import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull } from 'typeorm';
import { Drama } from '../entities/drama.entity';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

/** Sources we try in order to find a replacement poster */
const POSTER_SOURCES = [
  {
    name: 'dramanagar',
    buildUrl: (title: string) =>
      `https://dramanagar.com/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-drama-cast/`,
    extractImage: (html: string) => {
      const m = html.match(
        /(?:thumbnailUrl|contentUrl|og:image)['":\s]+['"]?(https:\/\/dramanagar\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpg|jpeg|png|webp))/i,
      );
      return m?.[1] ?? null;
    },
  },
  {
    name: 'pakdrama',
    buildUrl: (title: string) =>
      `https://www.pakdrama.pk/drama/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
    extractImage: (html: string) => {
      const m = html.match(
        /(?:og:image|thumbnailUrl)['":\s]+['"]?(https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp))/i,
      );
      return m?.[1] ?? null;
    },
  },
  {
    name: 'dramaflight',
    buildUrl: (title: string) =>
      `https://dramaflight.com/${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-drama-cast/`,
    extractImage: (html: string) => {
      const m = html.match(
        /(?:thumbnailUrl|contentUrl|og:image)['":\s]+['"]?(https:\/\/dramaflight\.com\/wp-content\/uploads\/[^"'\s]+\.(?:jpg|jpeg|png|webp))/i,
      );
      return m?.[1] ?? null;
    },
  },
];

@Injectable()
export class PosterHealthService {
  private readonly logger = new Logger(PosterHealthService.name);

  constructor(
    @InjectRepository(Drama, 'pak')
    private readonly dramaRepo: Repository<Drama>,
  ) {}

  /** Daily at 4:30 AM — check all poster URLs, fix broken ones */
  @Cron('30 4 * * *', { name: 'pak-poster-health' })
  async run() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.logger.log('Poster health check starting...');

    try {
      await this.checkAndFix();
    } catch (e) {
      this.logger.error(`Poster health check failed: ${(e as Error).message}`);
    }
  }

  async checkAndFix(): Promise<{
    checked: number;
    broken: number;
    fixed: number;
    failed: string[];
  }> {
    const dramas = await this.dramaRepo.find({
      where: { isPublished: 1 },
      select: ['id', 'title', 'slug', 'posterUrl', 'backdropUrl'],
    });

    const result = { checked: 0, broken: 0, fixed: 0, failed: [] as string[] };

    for (const drama of dramas) {
      result.checked++;
      const posterBroken = drama.posterUrl
        ? !(await this.isUrlAccessible(drama.posterUrl))
        : !drama.posterUrl;
      const backdropBroken = drama.backdropUrl
        ? !(await this.isUrlAccessible(drama.backdropUrl))
        : false;

      if (!posterBroken && !backdropBroken) continue;

      result.broken++;
      this.logger.warn(
        `Broken image for "${drama.title}" (id=${drama.id}) — poster: ${posterBroken}, backdrop: ${backdropBroken}`,
      );

      const newUrl = await this.findReplacementPoster(drama.title);
      if (!newUrl) {
        result.failed.push(drama.title);
        this.logger.warn(`No replacement found for "${drama.title}"`);
        continue;
      }

      const update: Partial<Drama> = {};
      if (posterBroken) {
        update.posterUrl = newUrl;
        update.posterOriginalUrl = newUrl;
      }
      if (backdropBroken) {
        update.backdropUrl = newUrl;
        update.backdropOriginalUrl = newUrl;
      }

      await this.dramaRepo.update(drama.id, update);
      result.fixed++;
      this.logger.log(
        `Fixed "${drama.title}" (id=${drama.id}) → ${newUrl.substring(0, 80)}...`,
      );

      // Small delay between fixes to be polite to source sites
      await this.delay(1000);
    }

    this.logger.log(
      `Poster health: checked=${result.checked}, broken=${result.broken}, fixed=${result.fixed}, failed=${result.failed.length}`,
    );
    return result;
  }

  async isUrlAccessible(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async findReplacementPoster(dramaTitle: string): Promise<string | null> {
    // Try each source in order
    for (const source of POSTER_SOURCES) {
      try {
        const url = source.buildUrl(dramaTitle);
        const html = await this.fetchHtml(url);
        if (!html) continue;

        const imageUrl = source.extractImage(html);
        if (!imageUrl) continue;

        // Verify the image is actually accessible
        const accessible = await this.isUrlAccessible(imageUrl);
        if (!accessible) continue;

        this.logger.log(
          `Found poster for "${dramaTitle}" via ${source.name}: ${imageUrl.substring(0, 80)}`,
        );
        return imageUrl;
      } catch {
        // Source failed, try next
      }
    }

    // Fallback: try fetching og:image from a Google search result page
    return this.searchGoogleForPoster(dramaTitle);
  }

  private async searchGoogleForPoster(
    dramaTitle: string,
  ): Promise<string | null> {
    try {
      const query = encodeURIComponent(
        `${dramaTitle} Pakistani drama poster`,
      );
      const url = `https://www.google.com/search?q=${query}&tbm=isch&udm=2`;
      const html = await this.fetchHtml(url);
      if (!html) return null;

      // Try to extract an image URL from Google image search results
      const imgMatches = html.match(
        /\["(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))",\d+,\d+\]/gi,
      );
      if (!imgMatches?.length) return null;

      for (const match of imgMatches.slice(0, 5)) {
        const urlMatch = match.match(
          /"(https:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i,
        );
        if (!urlMatch?.[1]) continue;
        const imgUrl = urlMatch[1];

        // Skip tiny images, data URLs, and google's own thumbnails
        if (imgUrl.includes('gstatic.com')) continue;
        if (imgUrl.includes('google.com')) continue;

        const accessible = await this.isUrlAccessible(imgUrl);
        if (accessible) {
          this.logger.log(
            `Found poster for "${dramaTitle}" via Google: ${imgUrl.substring(0, 80)}`,
          );
          return imgUrl;
        }
      }
    } catch {
      // Google search failed
    }
    return null;
  }

  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      return res.text();
    } catch {
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
