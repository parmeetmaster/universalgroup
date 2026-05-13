import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { Season } from '../../entities/season.entity';
import { Episode } from '../../entities/episode.entity';
import { EpisodeVideo } from '../../entities/episode-video.entity';
import { ParseSource } from '../../entities/parse-source.entity';
import { ParseRun } from '../../entities/parse-run.entity';
import { DramaStatusEnum, ParseRunStatusEnum, VideoFormatEnum, VideoQualityEnum } from '../../entities/enums';

export interface DiscoverySummary {
  found: number;
  newDramas: number;
  created: string[];
  failed: string[];
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';

export interface ImportSummary {
  dramaSlug: string;
  episodesFound: number;
  imported: number;
  skipped: number;
  failed: number;
  failures: Array<{ episode: number; reason: string }>;
}

export interface SitemapEntry {
  url: string;
  lastmod: Date | null;
}

@Injectable()
export class PakDramaximaDriver {
  private readonly logger = new Logger(PakDramaximaDriver.name);
  private static readonly SOURCE_SLUG = 'dramaxima';
  private static readonly SITEMAP_TTL_MS = 3_600_000;

  private sitemapCache:
    | { entries: SitemapEntry[]; loadedAt: number }
    | null = null;

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak') private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeVideo, 'pak') private readonly videoRepo: Repository<EpisodeVideo>,
    @InjectRepository(ParseSource, 'pak') private readonly sourceRepo: Repository<ParseSource>,
    @InjectRepository(ParseRun, 'pak') private readonly runRepo: Repository<ParseRun>,
  ) {}

  async discoverNewDramas(): Promise<DiscoverySummary> {
    const summary: DiscoverySummary = { found: 0, newDramas: 0, created: [], failed: [] };

    const xml = await this.fetchHtml('https://dramaxima.com/category-sitemap.xml');
    const slugs: string[] = [];
    const locRx = /<loc>https:\/\/dramaxima\.com\/([a-z0-9][a-z0-9-]*)\/<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = locRx.exec(xml)) !== null) {
      const s = m[1];
      if (s !== 'articles' && s !== 'uncategorized') slugs.push(s);
    }
    summary.found = slugs.length;
    if (!slugs.length) return summary;

    const existing = await this.dramaRepo
      .createQueryBuilder('d')
      .select('d.slug')
      .where('d.slug IN (:...slugs)', { slugs })
      .getMany();
    const have = new Set(existing.map((d) => d.slug));
    const newSlugs = slugs.filter((s) => !have.has(s));
    if (!newSlugs.length) return summary;

    this.logger.log(`Discovered ${newSlugs.length} new drama(s): ${newSlugs.join(', ')}`);

    for (const slug of newSlugs) {
      try {
        const landingUrl = `https://dramaxima.com/${slug}/`;
        const html = await this.fetchHtml(landingUrl);

        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        let title = slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
        if (titleMatch?.[1]) {
          title = titleMatch[1]
            .replace(/\s*Drama\s*Online\s*$/i, '')
            .replace(/\s*[-\u2013|].*$/, '')
            .trim() || title;
        }

        const main = this.extractMainSection(html);
        const imgMatch = main.match(
          /src="(https:\/\/dramaxima\.com\/wp-content\/uploads\/[^"]*\.(?:jpg|jpeg|png|webp))"/i,
        );
        const posterUrl = imgMatch?.[1] ?? null;

        const drama = await this.dramaRepo.save(
          this.dramaRepo.create({
            title,
            slug,
            sourceUrl: landingUrl,
            posterUrl,
            backdropUrl: posterUrl,
            status: DramaStatusEnum.ONGOING,
            isPublished: 1,
            language: 'ur',
          }),
        );

        try {
          await this.importDrama(drama);
        } catch (importErr) {
          this.logger.warn(`Episode import for new drama ${slug} failed: ${(importErr as Error).message}`);
        }

        summary.newDramas++;
        summary.created.push(slug);
        this.logger.log(`Created new drama: ${title} (${slug})`);
      } catch (err) {
        summary.failed.push(slug);
        this.logger.warn(`Failed to create drama ${slug}: ${(err as Error).message}`);
      }
    }

    return summary;
  }

  async importBySlug(slug: string): Promise<ImportSummary> {
    const drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) throw new NotFoundException(`Drama '${slug}' not found`);
    if (!drama.sourceUrl) throw new NotFoundException(`Drama '${slug}' has no sourceUrl`);
    return this.importDrama(drama);
  }

  async importById(id: string): Promise<ImportSummary> {
    const drama = await this.dramaRepo.findOne({ where: { id } });
    if (!drama) throw new NotFoundException(`Drama id=${id} not found`);
    if (!drama.sourceUrl) {
      throw new NotFoundException(`Drama id=${id} has no sourceUrl`);
    }
    return this.importDrama(drama);
  }

  async importAll(): Promise<ImportSummary[]> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .where('d.sourceUrl LIKE :u', { u: 'https://dramaxima.com/%' })
      .getMany();

    const out: ImportSummary[] = [];
    for (const d of dramas) {
      try {
        out.push(await this.importDrama(d));
      } catch (err) {
        this.logger.error(`Import failed for ${d.slug}: ${(err as Error).message}`);
        out.push({
          dramaSlug: d.slug,
          episodesFound: 0,
          imported: 0,
          skipped: 0,
          failed: 1,
          failures: [{ episode: 0, reason: (err as Error).message }],
        });
      }
    }
    return out;
  }

  async getDramaFingerprint(drama: Drama): Promise<Date | null> {
    if (!drama.sourceUrl) return null;
    const sitemap = await this.loadSitemap();
    const prefix = await this.deriveEpisodePrefix(
      drama.slug,
      drama.sourceUrl,
      sitemap.map((e) => e.url),
    );
    if (!prefix) return null;
    const matcher = new RegExp(`/${this.escapeRe(prefix)}-episode-\\d+/?$`);
    let max: Date | null = null;
    for (const e of sitemap) {
      if (!e.lastmod) continue;
      if (!matcher.test(e.url)) continue;
      if (!max || e.lastmod > max) max = e.lastmod;
    }
    return max;
  }

  async importDramaRow(drama: Drama): Promise<ImportSummary> {
    if (!drama.sourceUrl) {
      throw new NotFoundException(`Drama '${drama.slug}' has no sourceUrl`);
    }
    return this.importDrama(drama);
  }

  private async importDrama(drama: Drama): Promise<ImportSummary> {
    const run = await this.runRepo.save(
      this.runRepo.create({
        dramaId: drama.id,
        targetUrl: drama.sourceUrl,
        status: ParseRunStatusEnum.RUNNING,
        startedAt: new Date(),
      }),
    );

    const summary: ImportSummary = {
      dramaSlug: drama.slug,
      episodesFound: 0,
      imported: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    };

    try {
      const source = await this.ensureSource();
      run.sourceId = source.id;

      const links = await this.collectEpisodeLinks(drama.slug, drama.sourceUrl!);
      summary.episodesFound = links.length;
      if (links.length === 0) {
        await this.finishRun(run, ParseRunStatusEnum.SUCCESS, 'No episode links', summary);
        return summary;
      }

      const season = await this.ensureSeason(drama.id);

      const existing = await this.episodeRepo.find({
        where: { seasonId: season.id },
      });
      const byNum = new Map(existing.map((e) => [e.number, e]));

      for (const link of links) {
        try {
          let ep = byNum.get(link.number);
          if (!ep) {
            ep = await this.episodeRepo.save(
              this.episodeRepo.create({
                dramaId: drama.id,
                seasonId: season.id,
                number: link.number,
                title: `Episode ${link.number}`,
                sourceUrl: link.url,
                isPublished: 1,
              }),
            );
            byNum.set(link.number, ep);
          } else if (ep.sourceUrl !== link.url) {
            ep.sourceUrl = link.url;
            await this.episodeRepo.save(ep);
          }
          summary.imported++;
        } catch (err) {
          summary.failed++;
          summary.failures.push({
            episode: link.number,
            reason: (err as Error).message,
          });
        }
      }

      await this.fillGaps(drama.id, season.id);

      await this.dramaRepo.update(drama.id, {
        totalEpisodes: await this.episodeRepo.count({ where: { dramaId: drama.id } }),
      });

      await this.finishRun(run, ParseRunStatusEnum.SUCCESS, null, summary);
    } catch (err) {
      await this.finishRun(run, ParseRunStatusEnum.FAILED, (err as Error).message, summary);
      throw err;
    }

    return summary;
  }

  private async ensureSource(): Promise<ParseSource> {
    let src = await this.sourceRepo.findOne({
      where: { slug: PakDramaximaDriver.SOURCE_SLUG },
    });
    if (src) return src;
    src = await this.sourceRepo.save(
      this.sourceRepo.create({
        name: 'Dramaxima',
        slug: PakDramaximaDriver.SOURCE_SLUG,
        baseUrl: 'https://dramaxima.com',
        driver: 'dramaxima',
        priority: 20,
        isActive: 1,
      }),
    );
    return src;
  }

  private async fillGaps(dramaId: string, seasonId: string): Promise<void> {
    const existing = await this.episodeRepo.find({
      where: { dramaId },
      select: { number: true },
    });
    if (!existing.length) return;
    const have = new Set(existing.map((e) => e.number));
    const max = Math.max(...existing.map((e) => e.number));
    const toCreate: Episode[] = [];
    for (let n = 1; n <= max; n++) {
      if (have.has(n)) continue;
      toCreate.push(
        this.episodeRepo.create({
          dramaId,
          seasonId,
          number: n,
          title: `Episode ${n}`,
          sourceUrl: null,
          isPublished: 1,
        }),
      );
    }
    if (toCreate.length) {
      await this.episodeRepo.save(toCreate);
      this.logger.log(
        `filled ${toCreate.length} placeholder episodes for drama ${dramaId}`,
      );
    }
  }

  private async ensureSeason(dramaId: string): Promise<Season> {
    let s = await this.seasonRepo.findOne({ where: { dramaId, number: 1 } });
    if (s) return s;
    s = await this.seasonRepo.save(
      this.seasonRepo.create({ dramaId, number: 1, title: 'Season 1' }),
    );
    return s;
  }

  private async upsertVideo(
    episodeId: string,
    sourceId: string,
    url: string,
  ): Promise<void> {
    const existing = await this.videoRepo.findOne({
      where: { episodeId, sourceId, format: VideoFormatEnum.EMBED },
    });
    if (existing) {
      existing.url = url;
      existing.lastVerifiedAt = new Date();
      existing.isActive = 1;
      await this.videoRepo.save(existing);
      return;
    }
    await this.videoRepo.save(
      this.videoRepo.create({
        episodeId,
        sourceId,
        label: 'Dramaxima Embed',
        url,
        format: VideoFormatEnum.EMBED,
        quality: VideoQualityEnum.AUTO,
        language: 'ur',
        priority: 10,
        isActive: 1,
        lastVerifiedAt: new Date(),
      }),
    );
  }

  private async collectEpisodeLinks(
    dramaSlug: string,
    landingUrl: string,
  ): Promise<Array<{ number: number; url: string }>> {
    const sitemap = await this.loadSitemap();
    const urls = sitemap.map((e) => e.url);
    const prefix = await this.deriveEpisodePrefix(dramaSlug, landingUrl, urls);
    if (!prefix) return [];

    const matcher = new RegExp(`/${this.escapeRe(prefix)}-episode-(\\d+)/?$`);
    const found = new Map<number, string>();
    for (const url of urls) {
      const m = url.match(matcher);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (!found.has(n)) {
        found.set(n, url.endsWith('/') ? url : `${url}/`);
      }
    }

    try {
      for (let page = 1; page <= 2; page++) {
        const pageUrl = page === 1 ? landingUrl : `${landingUrl}page/${page}/`;
        const html = await this.fetchHtml(pageUrl);
        const main = this.extractMainSection(html);
        const linkRx = new RegExp(
          `https://dramaxima\\.com/${this.escapeRe(prefix)}-episode-(\\d+)/?`,
          'gi',
        );
        let lm: RegExpExecArray | null;
        while ((lm = linkRx.exec(main)) !== null) {
          const n = parseInt(lm[1], 10);
          if (!found.has(n)) {
            found.set(n, `https://dramaxima.com/${prefix}-episode-${n}/`);
          }
        }
        if (page === 1 && found.size > 0) break;
      }
    } catch (err) {
      this.logger.warn(
        `landing-page scrape for ${dramaSlug} failed: ${(err as Error).message}`,
      );
    }

    if (found.size === 0) return [];

    const minN = Math.min(...found.keys());
    if (minN > 1) {
      for (let n = 1; n < minN; n++) {
        const url = `https://dramaxima.com/${prefix}-episode-${n}/`;
        try {
          const res = await fetch(url, {
            method: 'GET',
            redirect: 'manual',
            headers: { 'User-Agent': UA },
            signal: AbortSignal.timeout(10000),
          });
          if (res.status === 200) found.set(n, url);
        } catch {
          // network errors ignored
        }
      }
    }

    return [...found.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, url]) => ({ number, url }));
  }

  private async loadSitemap(): Promise<SitemapEntry[]> {
    const fresh =
      this.sitemapCache &&
      Date.now() - this.sitemapCache.loadedAt < PakDramaximaDriver.SITEMAP_TTL_MS;
    if (fresh) return this.sitemapCache!.entries;

    const root = await this.fetchHtml('https://dramaxima.com/sitemap.xml');
    const files: string[] = [];
    const fileRx = /<loc>([^<]*post-sitemap[^<]*\.xml)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = fileRx.exec(root)) !== null) files.push(m[1]);

    const byUrl = new Map<string, SitemapEntry>();
    for (const f of files) {
      try {
        const xml = await this.fetchHtml(f);
        const urlRx =
          /<url>\s*<loc>(https:\/\/dramaxima\.com\/[^<]*-episode-\d+\/?)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/gi;
        let mm: RegExpExecArray | null;
        while ((mm = urlRx.exec(xml)) !== null) {
          const url = mm[1];
          const lastmod = mm[2] ? new Date(mm[2]) : null;
          const prev = byUrl.get(url);
          if (
            !prev ||
            (lastmod && (!prev.lastmod || lastmod > prev.lastmod))
          ) {
            byUrl.set(url, { url, lastmod });
          }
        }
      } catch (err) {
        this.logger.warn(`sitemap fetch ${f} failed: ${(err as Error).message}`);
      }
    }

    const entries = [...byUrl.values()];
    this.sitemapCache = { entries, loadedAt: Date.now() };
    this.logger.log(`Loaded ${entries.length} episode URLs from sitemap`);
    return entries;
  }

  private async deriveEpisodePrefix(
    dramaSlug: string,
    landingUrl: string,
    sitemap: string[],
  ): Promise<string | null> {
    const directRx = new RegExp(`/${this.escapeRe(dramaSlug)}-episode-\\d+/?$`);
    if (sitemap.some((u) => directRx.test(u))) return dramaSlug;

    let html: string;
    try {
      html = await this.fetchHtml(landingUrl);
    } catch (err) {
      this.logger.warn(
        `landing fetch failed for ${dramaSlug}: ${(err as Error).message}`,
      );
      return null;
    }
    const main = this.extractMainSection(html);
    const m = main.match(
      /href="https:\/\/dramaxima\.com\/([a-z0-9][a-z0-9-]*)-episode-\d+\/?"/i,
    );
    return m ? m[1] : null;
  }

  private extractMainSection(html: string): string {
    const asideAt = html.search(/<aside\b/i);
    return asideAt > 0 ? html.slice(0, asideAt) : html;
  }

  private escapeRe(s: string): string {
    return s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
  }

  async extractIframe(episodeUrl: string): Promise<string | null> {
    const html = await this.fetchHtml(episodeUrl);
    const m = html.match(/<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
    return m ? m[1] : null;
  }

  async extractDirectVideoUrl(episodeUrl: string): Promise<string | null> {
    try {
      const pageHtml = await this.fetchHtml(episodeUrl);
      const outerIframe = pageHtml.match(
        /<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>/i,
      );
      if (!outerIframe?.[1]) return null;

      const outerHtml = await this.fetchHtml(outerIframe[1]);

      let playerHtml = outerHtml;
      const innerIframe = outerHtml.match(
        /<iframe[^>]*\bsrc=["']([^"']+)["'][^>]*>/i,
      );
      if (innerIframe?.[1]) {
        let playerUrl = innerIframe[1];
        if (playerUrl.startsWith('/') || !playerUrl.startsWith('http')) {
          const base = new URL(outerIframe[1]);
          playerUrl = `${base.origin}${playerUrl.startsWith('/') ? '' : '/'}${playerUrl}`;
        }
        playerHtml = await this.fetchHtml(playerUrl);
      }

      const fileMatch = playerHtml.match(
        /file\s*:\s*["']([^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/i,
      );
      if (fileMatch?.[1]) return fileMatch[1];

      const srcMatch = playerHtml.match(
        /<source[^>]*\bsrc=["']([^"']+\.(?:mp4|m3u8|webm)[^"']*)["']/i,
      );
      if (srcMatch?.[1]) return srcMatch[1];

      return null;
    } catch (err) {
      this.logger.warn(
        `extractDirectVideoUrl ${episodeUrl} failed: ${(err as Error).message}`,
      );
      return null;
    }
  }

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.text();
  }

  private async finishRun(
    run: ParseRun,
    status: ParseRunStatusEnum,
    message: string | null,
    summary: ImportSummary,
  ): Promise<void> {
    run.status = status;
    run.message = message;
    run.stats = summary as unknown as Record<string, any>;
    run.finishedAt = new Date();
    await this.runRepo.save(run);
  }
}
