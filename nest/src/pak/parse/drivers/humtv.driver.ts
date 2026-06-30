import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { Season } from '../../entities/season.entity';
import { Episode } from '../../entities/episode.entity';
import { DramaSourceLink } from '../../entities/drama-source-link.entity';
import { VideoFormatEnum } from '../../entities/enums';
import {
  ISourceDriver,
  DiscoveredDrama,
  EpisodeLink,
  SourceFingerprint,
  DriverImportResult,
} from './source-driver.interface';
import { DriverRegistryService } from './driver-registry.service';

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';

const EPISODE_RE = /\/([a-z0-9][a-z0-9-]*)-episode-(\d+)\/?$/;

interface SitemapEntry {
  url: string;
  lastmod: Date | null;
}

@Injectable()
export class PakHumTvDriver implements ISourceDriver, OnModuleInit {
  readonly driverSlug = 'humtv';
  private readonly logger = new Logger(PakHumTvDriver.name);

  private static readonly SITEMAP_TTL_MS = 3_600_000;
  private sitemapCache: { entries: SitemapEntry[]; loadedAt: number } | null = null;

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak') private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    private readonly registry: DriverRegistryService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  async discoverDramas(): Promise<DiscoveredDrama[]> {
    const sitemap = await this.loadSitemap();
    const slugs = new Map<string, string>();
    for (const entry of sitemap) {
      const m = EPISODE_RE.exec(entry.url);
      if (!m) continue;
      const slug = m[1];
      if (!slugs.has(slug)) {
        slugs.set(slug, `https://hum.tv/${slug}/`);
      }
    }

    const results: DiscoveredDrama[] = [];
    for (const [slug, landingUrl] of slugs) {
      let title = this.slugToTitle(slug);
      try {
        const html = await this.fetchHtml(landingUrl);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) {
          title = this.cleanTitle(titleMatch[1], slug);
        }
      } catch { /* slug-derived title is fine */ }
      results.push({ sourceSlug: slug, sourceUrl: landingUrl, title });
    }
    return results;
  }

  async getEpisodeLinks(sourceSlug: string, _sourceUrl: string): Promise<EpisodeLink[]> {
    const sitemap = await this.loadSitemap();
    const found = new Map<number, EpisodeLink>();

    for (const entry of sitemap) {
      const m = EPISODE_RE.exec(entry.url);
      if (!m || m[1] !== sourceSlug) continue;
      const num = parseInt(m[2], 10);
      if (!found.has(num)) {
        found.set(num, {
          number: num,
          url: entry.url.endsWith('/') ? entry.url : `${entry.url}/`,
          lastmod: entry.lastmod,
        });
      }
    }

    return [...found.values()].sort((a, b) => a.number - b.number);
  }

  async getFingerprint(sourceSlug: string, _sourceUrl: string): Promise<SourceFingerprint | null> {
    const sitemap = await this.loadSitemap();
    let max: Date | null = null;
    let count = 0;
    for (const entry of sitemap) {
      const m = EPISODE_RE.exec(entry.url);
      if (!m || m[1] !== sourceSlug) continue;
      count++;
      if (entry.lastmod && (!max || entry.lastmod > max)) max = entry.lastmod;
    }
    if (count === 0) return null;
    return { latestModified: max, episodeCount: count };
  }

  async importDrama(drama: Drama, sourceLink: DramaSourceLink): Promise<DriverImportResult> {
    const epLinks = await this.getEpisodeLinks(sourceLink.sourceSlug, sourceLink.sourceUrl);
    const result: DriverImportResult = {
      dramaSlug: drama.slug,
      episodesFound: epLinks.length,
      imported: 0,
      skipped: 0,
      failed: 0,
      failures: [],
    };
    if (epLinks.length === 0) return result;

    let season = await this.seasonRepo.findOne({
      where: { dramaId: drama.id, number: 1 },
    });
    if (!season) {
      season = await this.seasonRepo.save(
        this.seasonRepo.create({ dramaId: drama.id, number: 1, title: 'Season 1' }),
      );
    }

    const existing = await this.episodeRepo.find({ where: { dramaId: drama.id } });
    const existingByNum = new Map(existing.map((e) => [e.number, e]));

    for (const link of epLinks) {
      const existingEp = existingByNum.get(link.number);
      if (existingEp) {
        // Update airDate if source has a newer date
        if (link.lastmod) {
          const newDate = new Date(link.lastmod);
          if (!existingEp.airDate || newDate.getTime() > existingEp.airDate.getTime()) {
            existingEp.airDate = newDate;
            await this.episodeRepo.save(existingEp);
          }
        }
        result.skipped++;
        continue;
      }

      try {
        const episode = this.episodeRepo.create({
          dramaId: drama.id,
          seasonId: season.id,
          number: link.number,
          title: `Episode ${link.number}`,
          sourceUrl: link.url,
          airDate: link.lastmod ?? new Date(),
          isPublished: 1,
          isPlaceholder: 0,
          notificationSent: 0,
        });
        await this.episodeRepo.save(episode);
        existingByNum.set(link.number, episode);
        result.imported++;
        this.logger.log(`New episode: ${drama.title} Ep${link.number} (hum.tv)`);
      } catch (err) {
        const msg = (err as Error).message;
        if (!msg.includes('Duplicate') && !msg.includes('UNIQUE')) {
          result.failed++;
          result.failures.push({ episode: link.number, reason: msg });
        }
      }
    }

    if (result.imported > 0) {
      const total = await this.episodeRepo.count({ where: { dramaId: drama.id } });
      await this.dramaRepo.update(drama.id, { totalEpisodes: total });
    }

    return result;
  }

  async extractVideos(episodeUrl: string): Promise<Array<{ url: string; format: VideoFormatEnum }>> {
    try {
      const html = await this.fetchHtml(episodeUrl);
      const videos: Array<{ url: string; format: VideoFormatEnum }> = [];

      // YouTube embeds
      const ytRe = /<iframe[^>]*src=["']([^"']*(?:youtube\.com|youtu\.be)[^"']*)["'][^>]*>/gi;
      let m: RegExpExecArray | null;
      while ((m = ytRe.exec(html)) !== null) {
        videos.push({ url: m[1], format: VideoFormatEnum.EMBED });
      }

      // Dailymotion embeds
      const dmRe = /<iframe[^>]*src=["']([^"']*dailymotion\.com[^"']*)["'][^>]*>/gi;
      while ((m = dmRe.exec(html)) !== null) {
        videos.push({ url: m[1], format: VideoFormatEnum.EMBED });
      }

      return videos;
    } catch (err) {
      this.logger.warn(`extractVideos ${episodeUrl} failed: ${(err as Error).message}`);
      return [];
    }
  }

  // ── Sitemap helpers ────────────────────────────────────

  private async loadSitemap(): Promise<SitemapEntry[]> {
    const fresh =
      this.sitemapCache &&
      Date.now() - this.sitemapCache.loadedAt < PakHumTvDriver.SITEMAP_TTL_MS;
    if (fresh) return this.sitemapCache!.entries;

    const root = await this.fetchHtml('https://hum.tv/sitemap.xml');
    const files: string[] = [];
    const fileRx = /<loc>([^<]*post-sitemap[^<]*\.xml)<\/loc>/gi;
    let m: RegExpExecArray | null;
    while ((m = fileRx.exec(root)) !== null) files.push(m[1]);

    const byUrl = new Map<string, SitemapEntry>();
    for (const f of files) {
      try {
        const xml = await this.fetchHtml(f);
        const urlRx =
          /<url>\s*<loc>(https:\/\/hum\.tv\/[^<]*-episode-\d+\/?)<\/loc>(?:[\s\S]*?<lastmod>([^<]+)<\/lastmod>)?[\s\S]*?<\/url>/gi;
        let mm: RegExpExecArray | null;
        while ((mm = urlRx.exec(xml)) !== null) {
          const url = mm[1];
          const lastmod = mm[2] ? new Date(mm[2]) : null;
          const prev = byUrl.get(url);
          if (!prev || (lastmod && (!prev.lastmod || lastmod > prev.lastmod))) {
            byUrl.set(url, { url, lastmod });
          }
        }
      } catch (err) {
        this.logger.warn(`sitemap fetch ${f} failed: ${(err as Error).message}`);
      }
    }

    const entries = [...byUrl.values()];
    this.sitemapCache = { entries, loadedAt: Date.now() };
    this.logger.log(`Loaded ${entries.length} episode URLs from hum.tv sitemap`);
    return entries;
  }

  private async fetchHtml(url: string): Promise<string> {
    const res = await fetch(url, {
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(15_000),
    });
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`);
    return res.text();
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }

  private cleanTitle(raw: string, slug: string): string {
    const t = raw
      .replace(/\s*[-\u2013|].*$/, '')
      .replace(/\s*[-\u2013]?\s*Episode\s*\d+.*$/i, '')
      .replace(/\s*HUM\s*TV\s*/gi, '')
      .trim();
    return t || this.slugToTitle(slug);
  }
}
