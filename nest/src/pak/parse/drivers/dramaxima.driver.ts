import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../../entities/drama.entity';
import { Season } from '../../entities/season.entity';
import { Episode } from '../../entities/episode.entity';
import { EpisodeVideo } from '../../entities/episode-video.entity';
import { ParseSource } from '../../entities/parse-source.entity';
import { ParseRun } from '../../entities/parse-run.entity';
import { DramaSourceLink } from '../../entities/drama-source-link.entity';
import { DramaStatusEnum, ParseRunStatusEnum, VideoFormatEnum, VideoQualityEnum } from '../../entities/enums';
import { PosterHealthService } from '../../services/poster-health.service';
import {
  ISourceDriver,
  DiscoveredDrama,
  EpisodeLink,
  SourceFingerprint,
  DriverImportResult,
} from './source-driver.interface';
import { DriverRegistryService } from './driver-registry.service';

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
export class PakDramaximaDriver implements ISourceDriver, OnModuleInit {
  readonly driverSlug = 'dramaxima';
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
    private readonly posterHealth: PosterHealthService,
    private readonly registry: DriverRegistryService,
  ) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  // ── ISourceDriver interface ────────────────────────────

  async discoverDramas(): Promise<DiscoveredDrama[]> {
    const slugs = [
      ...new Set([
        ...(await this.discoverCategorySlugs()),
        ...(await this.discoverEpisodeSlugs()),
      ]),
    ];
    const results: DiscoveredDrama[] = [];
    for (const slug of slugs) {
      const sourceUrl = `https://dramaxima.com/${slug}/`;
      let title = this.titleFromSlug(slug);
      try {
        const html = await this.fetchHtml(sourceUrl);
        const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
        if (titleMatch?.[1]) title = this.cleanTitle(titleMatch[1], slug);
      } catch { /* slug-based title is fine */ }
      results.push({ sourceSlug: slug, sourceUrl, title });
    }
    return results;
  }

  async getEpisodeLinks(sourceSlug: string, sourceUrl: string): Promise<EpisodeLink[]> {
    return this.collectEpisodeLinks(sourceSlug, sourceUrl);
  }

  async getFingerprint(sourceSlug: string, sourceUrl: string): Promise<SourceFingerprint | null> {
    const sitemap = await this.loadSitemap();
    const urls = sitemap.map((e) => e.url);
    const prefix = await this.deriveEpisodePrefix(sourceSlug, sourceUrl, urls);
    if (!prefix) return null;
    const matcher = new RegExp(
      `/${this.escapeRe(prefix)}(?:-(?:\\d+(?:st|nd|rd|th)-)?last)?-episode-\\d+/?$`,
    );
    let max: Date | null = null;
    let count = 0;
    for (const e of sitemap) {
      if (!matcher.test(e.url)) continue;
      count++;
      if (e.lastmod && (!max || e.lastmod > max)) max = e.lastmod;
    }
    return { latestModified: max, episodeCount: count };
  }

  async importDrama(drama: Drama, sourceLink: DramaSourceLink): Promise<DriverImportResult> {
    return this.importDramaInternal(drama, sourceLink.sourceSlug, sourceLink.sourceUrl);
  }

  // ── Legacy public API (backward compat) ────────────────

  async discoverNewDramas(): Promise<DiscoverySummary> {
    const summary: DiscoverySummary = { found: 0, newDramas: 0, created: [], failed: [] };

    // Two discovery sources, merged:
    //  A) category-sitemap.xml \u2014 series/category pages.
    //  B) post sitemap (episode URLs) \u2014 catches brand-new series whose first
    //     episode is already live before the category sitemap refreshes.
    const slugs = [
      ...new Set([
        ...(await this.discoverCategorySlugs()),
        ...(await this.discoverEpisodeSlugs()),
      ]),
    ];
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
        const title = await this.createDramaFromSlug(slug);
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

  // Series slugs from the category sitemap (series landing pages).
  private async discoverCategorySlugs(): Promise<string[]> {
    try {
      const xml = await this.fetchHtml('https://dramaxima.com/category-sitemap.xml');
      const slugs: string[] = [];
      const locRx = /<loc>https:\/\/dramaxima\.com\/([a-z0-9][a-z0-9-]*)\/<\/loc>/gi;
      let m: RegExpExecArray | null;
      while ((m = locRx.exec(xml)) !== null) {
        const s = m[1];
        if (s !== 'articles' && s !== 'uncategorized') slugs.push(s);
      }
      return [...new Set(slugs)];
    } catch (err) {
      this.logger.warn(`category sitemap fetch failed: ${(err as Error).message}`);
      return [];
    }
  }

  // Series slugs derived from episode URLs in the post sitemap, e.g.
  // `/marg-e-wafa-episode-1/` \u2192 `marg-e-wafa`.
  private async discoverEpisodeSlugs(): Promise<string[]> {
    const sitemap = await this.loadSitemap();
    const slugs = new Set<string>();
    const rx = /^https:\/\/dramaxima\.com\/(.+?)-episode-\d+\/?$/i;
    for (const entry of sitemap) {
      const m = entry.url.match(rx);
      if (m?.[1]) slugs.add(this.stripFinaleQualifier(m[1]));
    }
    return [...slugs];
  }

  // Finale episodes use qualified URLs like `{slug}-2nd-last-episode-N`, which
  // would otherwise look like a separate series. Strip the qualifier so they map
  // back to the real drama. Only strip when a real multi-token slug remains, so a
  // genuine title ending in "last" (e.g. `the-last`) is left untouched.
  private stripFinaleQualifier(prefix: string): string {
    // Ordinal finale (e.g. `-2nd-last`, `-3rd-last`) is never part of a real
    // title — always strip it back to the base series.
    const ordinal = prefix.replace(/-\d+(?:st|nd|rd|th)-last$/i, '');
    if (ordinal !== prefix) return ordinal;
    // Plain `-last` is ambiguous; only strip when a multi-token base remains so a
    // genuine title ending in "last" (e.g. `the-last`) is left untouched.
    const plain = prefix.replace(/-last$/i, '');
    return plain !== prefix && plain.includes('-') ? plain : prefix;
  }

  // Title-cases a slug, e.g. `marg-e-wafa` \u2192 `Marg E Wafa`.
  private titleFromSlug(slug: string): string {
    return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  // Cleans a raw <title>/og:title into a series name: drops the site suffix and
  // any trailing "Episode N" so it isn't stored/searched as the drama title.
  private cleanTitle(raw: string, slug: string): string {
    const t = raw
      .replace(/\s*Drama\s*Online\s*$/i, '')
      .replace(/\s*[-\u2013|].*$/, '')
      .replace(/\s*[-\u2013]?\s*Episode\s*\d+.*$/i, '')
      .trim();
    return t || this.titleFromSlug(slug);
  }

  // dramaxima site chrome (logo/favicon) that isn't a real poster. NOTE:
  // "Untitled-design-N" files are NOT junk — they're real Canva-exported posters.
  private isJunkImage(url: string): boolean {
    return /dramaxima(@2x)?\.png|\/dx\.png|favicon|cropped-|\/logo/i.test(url);
  }

  // Authoritative dramaxima poster: a post's WordPress featured image — exactly
  // the thumbnail the site itself shows for that drama. Returns null when the
  // post has no featured image (placeholder) or it's site chrome.
  private async wpFeaturedImage(postSlug: string): Promise<string | null> {
    try {
      const res = await fetch(
        `https://dramaxima.com/wp-json/wp/v2/posts?slug=${encodeURIComponent(
          postSlug,
        )}&_embed=wp:featuredmedia`,
        { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(15000) },
      );
      if (!res.ok) return null;
      const posts = (await res.json()) as Array<{
        _embedded?: { 'wp:featuredmedia'?: Array<{ source_url?: string }> };
      }>;
      const url = posts?.[0]?._embedded?.['wp:featuredmedia']?.[0]?.source_url;
      return url && !this.isJunkImage(url) ? url : null;
    } catch {
      return null;
    }
  }

  // First non-junk image inside the series landing page's article body — the big
  // poster dramaxima renders next to the description.
  private extractEntryPoster(html: string): string | null {
    const ec = html.match(/entry-content[^>]*>([\s\S]*?)(?:<footer|<\/article|<aside)/i);
    const scope = ec ? ec[1] : '';
    const rx =
      /(?:data-src|data-lazy-src|src)="(https:\/\/dramaxima\.com\/wp-content\/uploads\/[^" ]+?\.(?:jpg|jpeg|png|webp))/gi;
    let m: RegExpExecArray | null;
    while ((m = rx.exec(scope)) !== null) {
      if (!this.isJunkImage(m[1])) return m[1];
    }
    return null;
  }

  // Trusted poster domains for the online fallback — keeps the search safe by
  // rejecting random/unsafe image hits for ambiguous Urdu drama titles.
  private static readonly POSTER_DOMAINS =
    /i\.pinimg\.com|hum\.tv|harpalgeo|arydigital|geo\.tv|wikipedia|wikimedia|reviewit|pakistanitv|dramaonline|mdramalist|themoviedb|tmdb/i;

  // Last resort: a safe image search restricted to trusted drama-poster domains.
  // Bing's results vary per query, so we try a few phrasings until one lands.
  private async searchOnlinePoster(title: string): Promise<string | null> {
    const suffixes = [
      'Pakistani drama poster',
      'Hum TV drama',
      'ARY drama',
      'Geo TV drama',
      'drama poster',
    ];
    for (const suffix of suffixes) {
      try {
        const q = encodeURIComponent(`${title} ${suffix}`);
        const html = await this.fetchHtml(`https://www.bing.com/images/search?q=${q}`);
        const rx = /murl&quot;:&quot;(https?:\/\/[^&]+?\.(?:jpg|jpeg|png|webp))/gi;
        let m: RegExpExecArray | null;
        while ((m = rx.exec(html)) !== null) {
          const u = m[1];
          if (PakDramaximaDriver.POSTER_DOMAINS.test(u) && (await this.isImageOk(u))) {
            return u;
          }
        }
      } catch {
        // try next phrasing
      }
    }
    return null;
  }

  private async isImageOk(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        headers: { 'User-Agent': UA },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) return false;
      const len = Number(res.headers.get('content-length') ?? '0');
      return len === 0 || len > 8000; // skip tiny icons; allow unknown length
    } catch {
      return false;
    }
  }

  // Resolves a drama's poster, best source first:
  //   1. dramaxima WP featured image of its newest episodes (authoritative)
  //   2. the big image on the series landing page (follows slug redirects)
  //   3. a safe online image search restricted to trusted domains
  private async resolvePoster(
    dramaId: string,
    slug: string,
    title: string,
  ): Promise<string | null> {
    const eps = await this.episodeRepo.find({
      where: { dramaId },
      order: { number: 'DESC' },
      take: 4,
    });
    for (const ep of eps) {
      if (!ep.sourceUrl) continue;
      const postSlug = ep.sourceUrl
        .replace(/^https?:\/\/dramaxima\.com\//i, '')
        .replace(/\/+$/, '');
      const img = await this.wpFeaturedImage(postSlug);
      if (img) return img;
    }

    try {
      const img = this.extractEntryPoster(
        await this.fetchHtml(`https://dramaxima.com/${slug}/`),
      );
      if (img) return img;
    } catch {
      // landing unavailable
    }

    return this.searchOnlinePoster(title);
  }

  // Clears poster/backdrop so the app shows its own clean fallback instead of a
  // logo or a wrong drama's image.
  private async clearPoster(dramaId: string): Promise<void> {
    await this.dramaRepo.update(dramaId, {
      posterUrl: null,
      backdropUrl: null,
      posterOriginalUrl: null,
      backdropOriginalUrl: null,
      posterImagebanId: null,
      backdropImagebanId: null,
      posterHosted: 0,
      backdropHosted: 0,
    });
  }

  // Creates a Drama row for a slug, imports episodes, and hosts its poster.
  // Returns the resolved title.
  private async createDramaFromSlug(slug: string): Promise<string> {
    const landingUrl = `https://dramaxima.com/${slug}/`;

    // Title from the landing page when available, else derived from the slug.
    // Brand-new series may not have a landing page yet, so this is best-effort.
    let title = this.titleFromSlug(slug);
    try {
      const html = await this.fetchHtml(landingUrl);
      const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
      if (titleMatch?.[1]) title = this.cleanTitle(titleMatch[1], slug);
    } catch {
      // No landing page \u2014 slug-based title is fine.
    }

    const drama = await this.dramaRepo.save(
      this.dramaRepo.create({
        title,
        slug,
        sourceUrl: landingUrl,
        status: DramaStatusEnum.ONGOING,
        isPublished: 1,
        language: 'ur',
      }),
    );

    // Import episodes first so we have a real episode page to read the poster
    // from; fall back to PosterHealth's external sources when none is found.
    try {
      await this.importDramaLegacy(drama);
    } catch (importErr) {
      this.logger.warn(`Episode import for new drama ${slug} failed: ${(importErr as Error).message}`);
    }

    try {
      const poster = await this.resolvePoster(drama.id, slug, title);
      if (poster) await this.posterHealth.ensurePosterHosted(drama.id, title, poster);
    } catch (posterErr) {
      this.logger.warn(`Poster hosting for ${slug} failed: ${(posterErr as Error).message}`);
    }

    return title;
  }

  // Repairs dramaxima dramas with a junk (logo/placeholder) poster or a polluted
  // "\u2026 Episode N" title: re-cleans the title and re-resolves the poster.
  async repairPostersAndTitles(): Promise<{
    checked: number;
    repaired: string[];
    failed: string[];
  }> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .where('d.sourceUrl LIKE :u', { u: 'https://dramaxima.com/%' })
      .getMany();

    const result = { checked: 0, repaired: [] as string[], failed: [] as string[] };
    for (const drama of dramas) {
      result.checked++;
      const orig = drama.posterOriginalUrl ?? '';
      const titleDirty = /\bEpisode\s*\d+/i.test(drama.title ?? '');
      const posterJunk = this.isJunkImage(orig);
      // A poster taken from the online fallback is replaceable: prefer the
      // drama's authoritative dramaxima poster if one now exists.
      const fromOnline = PakDramaximaDriver.POSTER_DOMAINS.test(orig);
      const posterBad = posterJunk || !drama.posterUrl || fromOnline;
      if (!titleDirty && !posterBad) continue;

      try {
        const title = titleDirty
          ? this.cleanTitle(drama.title ?? '', drama.slug)
          : drama.title ?? this.titleFromSlug(drama.slug);
        if (titleDirty) await this.dramaRepo.update(drama.id, { title });

        if (posterBad) {
          const poster = await this.resolvePoster(drama.id, drama.slug, title);
          // Replace when we have a poster — but don't swap one online guess for
          // another (keeps the picture stable across runs); only upgrade an
          // online poster to a dramaxima one.
          const isDramaxima = !!poster && /dramaxima\.com/i.test(poster);
          if (poster && (!fromOnline || isDramaxima)) {
            await this.posterHealth.ensurePosterHosted(drama.id, title, poster);
          } else if (posterJunk && !poster) {
            // No real poster found and the current one is the logo → clear it.
            await this.clearPoster(drama.id);
          }
        }
        result.repaired.push(drama.slug);
      } catch (err) {
        result.failed.push(drama.slug);
        this.logger.warn(`Repair failed for ${drama.slug}: ${(err as Error).message}`);
      }
    }
    return result;
  }

  async importBySlug(slug: string): Promise<ImportSummary> {
    const drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) throw new NotFoundException(`Drama '${slug}' not found`);
    if (!drama.sourceUrl) throw new NotFoundException(`Drama '${slug}' has no sourceUrl`);
    return this.importDramaLegacy(drama);
  }

  async importById(id: string): Promise<ImportSummary> {
    const drama = await this.dramaRepo.findOne({ where: { id } });
    if (!drama) throw new NotFoundException(`Drama id=${id} not found`);
    if (!drama.sourceUrl) {
      throw new NotFoundException(`Drama id=${id} has no sourceUrl`);
    }
    return this.importDramaLegacy(drama);
  }

  async importAll(): Promise<ImportSummary[]> {
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .where('d.sourceUrl LIKE :u', { u: 'https://dramaxima.com/%' })
      .getMany();

    const out: ImportSummary[] = [];
    for (const d of dramas) {
      try {
        out.push(await this.importDramaLegacy(d));
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
    const matcher = new RegExp(
      `/${this.escapeRe(prefix)}(?:-(?:\\d+(?:st|nd|rd|th)-)?last)?-episode-\\d+/?$`,
    );
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
    return this.importDramaInternal(drama, drama.slug, drama.sourceUrl);
  }

  private importDramaLegacy(drama: Drama): Promise<ImportSummary> {
    return this.importDramaInternal(drama, drama.slug, drama.sourceUrl!);
  }

  private async importDramaInternal(
    drama: Drama,
    sourceSlug: string,
    sourceUrl: string,
  ): Promise<ImportSummary> {
    const run = await this.runRepo.save(
      this.runRepo.create({
        dramaId: drama.id,
        targetUrl: sourceUrl,
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

      const links = await this.collectEpisodeLinks(sourceSlug, sourceUrl);
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
          // Source-provided air date (sitemap lastmod). For a brand-new episode
          // fall back to now — the scraper processes dramas sequentially so the
          // natural insert order provides a meaningful secondary sort.
          const sourceAirDate = link.lastmod ?? null;
          if (!ep) {
            ep = await this.episodeRepo.save(
              this.episodeRepo.create({
                dramaId: drama.id,
                seasonId: season.id,
                number: link.number,
                title: `Episode ${link.number}`,
                sourceUrl: link.url,
                airDate: sourceAirDate ?? new Date(),
                isPublished: 1,
              }),
            );
            byNum.set(link.number, ep);
          } else {
            let changed = false;
            if (ep.sourceUrl !== link.url) {
              ep.sourceUrl = link.url;
              changed = true;
            }
            // Update airDate when the source re-published (trailer → real episode).
            // A newer lastmod means the content was replaced, so refresh the date
            // so the episode appears in "Latest Releases" correctly.
            if (sourceAirDate) {
              const newDate = new Date(sourceAirDate);
              if (!ep.airDate || newDate.getTime() > ep.airDate.getTime()) {
                ep.airDate = newDate;
                changed = true;
              }
            }
            if (changed) await this.episodeRepo.save(ep);
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

      // Gap-filling disabled: creates bogus placeholder episodes when
      // DramaXima has outlier episode numbers (e.g., ep 280 when only 50 exist)
      // await this.fillGaps(drama.id, season.id);

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
  ): Promise<Array<{ number: number; url: string; lastmod: Date | null }>> {
    const sitemap = await this.loadSitemap();
    const urls = sitemap.map((e) => e.url);
    const prefix = await this.deriveEpisodePrefix(dramaSlug, landingUrl, urls);
    if (!prefix) return [];

    // Allow an optional finale qualifier (e.g. `-2nd-last`, `-last`) between the
    // prefix and `-episode-N`, so finale URLs map to the right episode number.
    const matcher = new RegExp(
      `/${this.escapeRe(prefix)}(?:-(?:\\d+(?:st|nd|rd|th)-)?last)?-episode-(\\d+)/?$`,
    );
    const found = new Map<number, { url: string; lastmod: Date | null }>();
    for (const entry of sitemap) {
      const m = entry.url.match(matcher);
      if (!m) continue;
      const n = parseInt(m[1], 10);
      if (!found.has(n)) {
        found.set(n, {
          url: entry.url.endsWith('/') ? entry.url : `${entry.url}/`,
          lastmod: entry.lastmod,
        });
      }
    }

    try {
      for (let page = 1; page <= 2; page++) {
        const pageUrl = page === 1 ? landingUrl : `${landingUrl}page/${page}/`;
        const html = await this.fetchHtml(pageUrl);
        const main = this.extractMainSection(html);
        const linkRx = new RegExp(
          `https://dramaxima\\.com/${this.escapeRe(prefix)}(?:-(?:\\d+(?:st|nd|rd|th)-)?last)?-episode-(\\d+)/?`,
          'gi',
        );
        let lm: RegExpExecArray | null;
        while ((lm = linkRx.exec(main)) !== null) {
          const n = parseInt(lm[1], 10);
          if (!found.has(n)) {
            const u = lm[0].endsWith('/') ? lm[0] : `${lm[0]}/`;
            found.set(n, { url: u, lastmod: null });
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
          if (res.status === 200) found.set(n, { url, lastmod: null });
        } catch {
          // network errors ignored
        }
      }
    }

    return [...found.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([number, entry]) => ({ number, url: entry.url, lastmod: entry.lastmod }));
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
