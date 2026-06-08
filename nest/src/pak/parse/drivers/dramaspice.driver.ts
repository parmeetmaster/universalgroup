import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { Season } from '../../entities/season.entity';
import { Episode } from '../../entities/episode.entity';
import { DramaStatusEnum } from '../../entities/enums';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const SITEMAP_INDEX_URL = 'https://dramaspice.net/sitemap.xml';
const EPISODE_RE = /\/([a-z0-9][a-z0-9-]*)-episode-(\d+)\/?$/;

interface SitemapEntry {
  url: string;
  lastmod: string;
  dramaSlug: string;
  episodeNumber: number;
}

export interface DramaSpiceScanResult {
  sitemapEntries: number;
  episodeEntries: number;
  newDramas: number;
  newEpisodes: number;
  errors: string[];
}

@Injectable()
export class PakDramaSpiceDriver {
  private readonly logger = new Logger(PakDramaSpiceDriver.name);

  constructor(
    @InjectRepository(Drama, 'pak')
    private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak')
    private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak')
    private readonly episodeRepo: Repository<Episode>,
  ) {}

  async scanAndImport(): Promise<DramaSpiceScanResult> {
    const result: DramaSpiceScanResult = {
      sitemapEntries: 0,
      episodeEntries: 0,
      newDramas: 0,
      newEpisodes: 0,
      errors: [],
    };

    try {
      // 1. Fetch sitemap index → find last post-sitemap
      const postSitemaps = await this.fetchSitemapIndex();
      if (postSitemaps.length === 0) {
        result.errors.push('No post-sitemaps found in sitemap index');
        return result;
      }

      // 2. Fetch the last post-sitemap (newest episodes are here)
      const lastUrl = postSitemaps[postSitemaps.length - 1];
      this.logger.log(`Fetching latest sitemap: ${lastUrl}`);
      const rawEntries = await this.fetchSitemap(lastUrl);
      result.sitemapEntries = rawEntries.length;

      // 3. Parse episode URLs
      const episodes = this.parseEpisodeEntries(rawEntries);
      result.episodeEntries = episodes.length;
      if (episodes.length === 0) return result;

      // 4. Only process entries from the last 3 hours
      const cutoff = new Date(Date.now() - 3 * 60 * 60 * 1000);
      const recent = episodes.filter((e) => new Date(e.lastmod) > cutoff);
      if (recent.length === 0) {
        this.logger.log('No new episodes in the last 3 hours');
        return result;
      }
      this.logger.log(`Found ${recent.length} recent episode entries`);

      // 5. Group by drama slug
      const byDrama = new Map<string, SitemapEntry[]>();
      for (const ep of recent) {
        const arr = byDrama.get(ep.dramaSlug) || [];
        arr.push(ep);
        byDrama.set(ep.dramaSlug, arr);
      }

      // 6. Process each drama
      for (const [slug, eps] of byDrama) {
        try {
          const counts = await this.processDrama(slug, eps);
          result.newDramas += counts.newDramas;
          result.newEpisodes += counts.newEpisodes;
        } catch (err) {
          const msg = `Failed ${slug}: ${(err as Error).message}`;
          this.logger.error(msg);
          result.errors.push(msg);
        }
      }
    } catch (err) {
      const msg = `Scan failed: ${(err as Error).message}`;
      this.logger.error(msg);
      result.errors.push(msg);
    }

    return result;
  }

  private async processDrama(
    slug: string,
    entries: SitemapEntry[],
  ): Promise<{ newDramas: number; newEpisodes: number }> {
    let newDramas = 0;
    let newEpisodes = 0;

    // Find or create drama
    let drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) {
      const title = this.slugToTitle(slug);
      drama = this.dramaRepo.create({
        title,
        slug,
        status: DramaStatusEnum.ONGOING,
        isPublished: 1,
        language: 'ur',
        sourceUrl: entries[0]?.url ?? null,
      });
      drama = await this.dramaRepo.save(drama);
      this.logger.log(`Created drama: ${title} (${slug})`);
      newDramas++;
    }

    // Ensure Season 1 exists
    let season = await this.seasonRepo.findOne({
      where: { dramaId: drama.id, number: 1 },
    });
    if (!season) {
      season = this.seasonRepo.create({
        dramaId: drama.id,
        number: 1,
        title: 'Season 1',
      });
      season = await this.seasonRepo.save(season);
    }

    // Get existing episode numbers
    const existing = await this.episodeRepo.find({
      where: { dramaId: drama.id },
      select: ['number'],
    });
    const existingNumbers = new Set(existing.map((e) => e.number));

    // Insert new episodes
    for (const entry of entries) {
      if (existingNumbers.has(entry.episodeNumber)) continue;

      // Use the sitemap lastmod when valid, otherwise stamp now (newly aired).
      const parsedAirDate = entry.lastmod ? new Date(entry.lastmod) : null;
      const episode = this.episodeRepo.create({
        dramaId: drama.id,
        seasonId: season.id,
        number: entry.episodeNumber,
        title: `Episode ${entry.episodeNumber}`,
        sourceUrl: entry.url,
        airDate:
          parsedAirDate && !isNaN(parsedAirDate.getTime())
            ? parsedAirDate
            : new Date(),
        isPublished: 1,
        isPlaceholder: 0,
        notificationSent: 0,
      });

      try {
        await this.episodeRepo.save(episode);
        existingNumbers.add(entry.episodeNumber);
        newEpisodes++;
        this.logger.log(
          `New episode: ${drama.title} Ep${entry.episodeNumber}`,
        );
      } catch (err) {
        // Duplicate key = already exists, safe to skip
        const msg = (err as Error).message;
        if (!msg.includes('Duplicate') && !msg.includes('UNIQUE')) {
          throw err;
        }
      }
    }

    // Update drama totalEpisodes count
    if (newEpisodes > 0) {
      const total = await this.episodeRepo.count({
        where: { dramaId: drama.id },
      });
      await this.dramaRepo.update(drama.id, { totalEpisodes: total });
    }

    return { newDramas, newEpisodes };
  }

  // ── Sitemap helpers ───────────────────────────────────

  private async fetchSitemapIndex(): Promise<string[]> {
    const xml = await this.fetchXml(SITEMAP_INDEX_URL);
    const urls: string[] = [];
    const re = /<loc>(https:\/\/dramaspice\.net\/post-sitemap\d*\.xml)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      urls.push(m[1]);
    }
    // Sort so post-sitemap7 comes after post-sitemap6
    urls.sort((a, b) => {
      const numA = this.sitemapNumber(a);
      const numB = this.sitemapNumber(b);
      return numA - numB;
    });
    return urls;
  }

  private async fetchSitemap(
    url: string,
  ): Promise<Array<{ url: string; lastmod: string }>> {
    const xml = await this.fetchXml(url);
    const entries: Array<{ url: string; lastmod: string }> = [];
    const re =
      /<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>([^<]+)<\/lastmod>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      entries.push({ url: m[1], lastmod: m[2] });
    }
    return entries;
  }

  private parseEpisodeEntries(
    raw: Array<{ url: string; lastmod: string }>,
  ): SitemapEntry[] {
    const episodes: SitemapEntry[] = [];
    for (const { url, lastmod } of raw) {
      const m = EPISODE_RE.exec(url);
      if (!m) continue;
      episodes.push({
        url,
        lastmod,
        dramaSlug: m[1],
        episodeNumber: parseInt(m[2], 10),
      });
    }
    return episodes;
  }

  private async fetchXml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching ${url}`);
    }
    return res.text();
  }

  private sitemapNumber(url: string): number {
    const m = /post-sitemap(\d*)\.xml/.exec(url);
    if (!m) return 0;
    return m[1] ? parseInt(m[1], 10) : 1;
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
