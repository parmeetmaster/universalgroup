import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { Season } from '../../entities/season.entity';
import { Episode } from '../../entities/episode.entity';
import { DramaSourceLink } from '../../entities/drama-source-link.entity';
import { DramaStatusEnum } from '../../entities/enums';
import { PosterHealthService } from '../../services/poster-health.service';
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
export class PakDramaSpiceDriver implements ISourceDriver, OnModuleInit {
  readonly driverSlug = 'dramaspice';
  private readonly logger = new Logger(PakDramaSpiceDriver.name);

  constructor(
    @InjectRepository(Drama, 'pak')
    private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak')
    private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak')
    private readonly episodeRepo: Repository<Episode>,
    private readonly posterHealth: PosterHealthService,
    private readonly registry: DriverRegistryService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  // ── ISourceDriver interface ────────────────────────────

  async discoverDramas(): Promise<DiscoveredDrama[]> {
    const postSitemaps = await this.fetchSitemapIndex();
    if (postSitemaps.length === 0) return [];
    const lastUrl = postSitemaps[postSitemaps.length - 1];
    const rawEntries = await this.fetchSitemap(lastUrl);
    const episodes = this.parseEpisodeEntries(rawEntries);
    const slugs = new Set<string>();
    const results: DiscoveredDrama[] = [];
    for (const ep of episodes) {
      if (slugs.has(ep.dramaSlug)) continue;
      slugs.add(ep.dramaSlug);
      results.push({
        sourceSlug: ep.dramaSlug,
        sourceUrl: `https://dramaspice.net/${ep.dramaSlug}-episode-1/`,
        title: this.slugToTitle(ep.dramaSlug),
      });
    }
    return results;
  }

  async getEpisodeLinks(sourceSlug: string, _sourceUrl: string): Promise<EpisodeLink[]> {
    const postSitemaps = await this.fetchSitemapIndex();
    const links: EpisodeLink[] = [];
    for (const smUrl of postSitemaps) {
      const rawEntries = await this.fetchSitemap(smUrl);
      const episodes = this.parseEpisodeEntries(rawEntries);
      for (const ep of episodes) {
        if (ep.dramaSlug !== sourceSlug) continue;
        links.push({
          number: ep.episodeNumber,
          url: ep.url.replace('dramaspice.net', 'dramaxima.com'),
          lastmod: ep.lastmod ? new Date(ep.lastmod) : null,
        });
      }
    }
    return links.sort((a, b) => a.number - b.number);
  }

  async getFingerprint(sourceSlug: string, _sourceUrl: string): Promise<SourceFingerprint | null> {
    const postSitemaps = await this.fetchSitemapIndex();
    if (postSitemaps.length === 0) return null;
    const lastUrl = postSitemaps[postSitemaps.length - 1];
    const rawEntries = await this.fetchSitemap(lastUrl);
    const episodes = this.parseEpisodeEntries(rawEntries);
    let max: Date | null = null;
    let count = 0;
    for (const ep of episodes) {
      if (ep.dramaSlug !== sourceSlug) continue;
      count++;
      const d = new Date(ep.lastmod);
      if (!isNaN(d.getTime()) && (!max || d > max)) max = d;
    }
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
      if (existingByNum.has(link.number)) {
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
        result.imported++;
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

  // ── Legacy public API ──────────────────────────────────

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

      // Fetch a poster, host it on ImageBan, and persist it right away so the
      // new serial never shows up without a photo.
      try {
        await this.posterHealth.ensurePosterHosted(drama.id, title);
      } catch (err) {
        this.logger.warn(
          `Poster hosting for ${slug} failed: ${(err as Error).message}`,
        );
      }
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

    // Get existing episodes
    const existing = await this.episodeRepo.find({
      where: { dramaId: drama.id },
    });
    const existingByNum = new Map(existing.map((e) => [e.number, e]));

    // Insert new episodes / update airDate for re-published ones
    for (const entry of entries) {
      const existingEp = existingByNum.get(entry.episodeNumber);
      if (existingEp) {
        // Update airDate when source re-published (trailer → real episode)
        const parsedDate = entry.lastmod ? new Date(entry.lastmod) : null;
        if (
          parsedDate &&
          !isNaN(parsedDate.getTime()) &&
          (!existingEp.airDate ||
            parsedDate.getTime() > existingEp.airDate.getTime())
        ) {
          existingEp.airDate = parsedDate;
          await this.episodeRepo.save(existingEp);
        }
        continue;
      }

      // Use the sitemap lastmod when valid, otherwise stamp now (newly aired).
      // The scraper processes dramas sequentially so the natural insert order
      // provides a meaningful secondary sort within the same day.
      const parsedAirDate = entry.lastmod ? new Date(entry.lastmod) : null;
      // Store DramaXima URL so video extraction works directly
      const resolvedUrl = entry.url.replace('dramaspice.net', 'dramaxima.com');

      const episode = this.episodeRepo.create({
        dramaId: drama.id,
        seasonId: season.id,
        number: entry.episodeNumber,
        title: `Episode ${entry.episodeNumber}`,
        sourceUrl: resolvedUrl,
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
        existingByNum.set(entry.episodeNumber, episode);
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

  // ── Homepage "Today's Episodes" sync ─────────────────

  /**
   * Scrapes the DramaSpice homepage to discover which episodes aired today
   * and sets their `airDate` with ordered timestamps so the "Latest Releases"
   * rail matches the homepage order exactly.
   *
   * Homepage lists episodes newest-first. We assign decreasing timestamps
   * (today 23:59, 23:58, …) so `ORDER BY air_date DESC` preserves that order.
   */
  async syncHomepageAirDates(): Promise<{
    found: number;
    updated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let updated = 0;

    // 1. Fetch homepage HTML
    let html: string;
    try {
      const res = await fetch('https://dramaspice.net/', {
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
    } catch (err) {
      const msg = `Homepage fetch failed: ${(err as Error).message}`;
      this.logger.error(msg);
      return { found: 0, updated: 0, errors: [msg] };
    }

    // 2. Extract episode links in page order (homepage lists newest first)
    //    Links look like: href="https://dramaspice.net/shaidai-episode-20/"
    const linkRe =
      /href="https?:\/\/dramaspice\.net\/([a-z0-9][a-z0-9-]*)-episode-(\d+)\/?"/gi;
    const seen = new Set<string>();
    const todayEpisodes: { slug: string; epNum: number }[] = [];
    let m: RegExpExecArray | null;
    while ((m = linkRe.exec(html)) !== null) {
      const key = `${m[1]}:${m[2]}`;
      if (seen.has(key)) continue;
      seen.add(key);
      todayEpisodes.push({ slug: m[1], epNum: parseInt(m[2], 10) });
    }

    if (todayEpisodes.length === 0) {
      this.logger.log('Homepage sync: no episodes found on homepage');
      return { found: 0, updated: 0, errors: [] };
    }
    this.logger.log(
      `Homepage sync: found ${todayEpisodes.length} episodes on homepage`,
    );

    // 3. For each episode, find in DB and set airDate preserving page order.
    //    First item = most recent → gets the latest timestamp.
    const today = new Date();
    today.setHours(23, 59, 0, 0);

    for (let i = 0; i < todayEpisodes.length; i++) {
      const { slug, epNum } = todayEpisodes[i];
      try {
        const drama = await this.dramaRepo.findOne({ where: { slug } });
        if (!drama) continue;

        const ep = await this.episodeRepo.findOne({
          where: { dramaId: drama.id, number: epNum },
        });
        if (!ep) continue;

        // Assign ordered timestamp: first = 23:59, second = 23:58, ...
        const orderedDate = new Date(today);
        orderedDate.setMinutes(59 - i);

        // Only update if our new timestamp is on today or later than existing
        const existingDay = ep.airDate
          ? ep.airDate.toISOString().slice(0, 10)
          : null;
        const todayStr = orderedDate.toISOString().slice(0, 10);

        if (!ep.airDate || existingDay! <= todayStr) {
          ep.airDate = orderedDate;
          await this.episodeRepo.save(ep);
          updated++;
        }
      } catch (err) {
        errors.push(`${slug} ep${epNum}: ${(err as Error).message}`);
      }
    }

    this.logger.log(
      `Homepage sync: updated ${updated}/${todayEpisodes.length} air dates`,
    );
    return { found: todayEpisodes.length, updated, errors };
  }

  private slugToTitle(slug: string): string {
    return slug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
}
