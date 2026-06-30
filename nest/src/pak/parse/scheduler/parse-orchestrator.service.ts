import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Not, Repository } from 'typeorm';

import { Drama } from '../../entities/drama.entity';
import { Episode } from '../../entities/episode.entity';
import { ParseRun } from '../../entities/parse-run.entity';
import { ParseSource } from '../../entities/parse-source.entity';
import { DramaSourceLink } from '../../entities/drama-source-link.entity';
import { ParseRunStatusEnum, SourceLinkStatusEnum, MatchMethodEnum } from '../../entities/enums';
import {
  PakDramaximaDriver,
  DiscoverySummary,
  ImportSummary,
} from '../drivers/dramaxima.driver';
import { DriverRegistryService } from '../drivers/driver-registry.service';
import { ISourceDriver, DriverImportResult } from '../drivers/source-driver.interface';
import { SlugMatcherService } from '../matching/slug-matcher.service';
import { PakDistributedLockService } from './distributed-lock.service';
import {
  ParseTier,
  classify,
  classifyError,
  freezeWindowMs,
  MAX_CONSECUTIVE_FAILURES,
} from './tier-classifier';

export interface TierRunReport {
  tier: ParseTier | 'all';
  startedAt: Date;
  finishedAt: Date;
  lockAcquired: boolean;
  dramasConsidered: number;
  dramasSkipped: number;
  dramasImported: number;
  dramasFailed: number;
  episodesImported: number;
  details: Array<{
    slug: string;
    outcome: 'imported' | 'skipped' | 'failed' | 'frozen';
    imported?: number;
    reason?: string;
  }>;
}

const MAX_CONCURRENT_DRAMAS = 3;
const DRAMA_START_JITTER_MS = 400;

@Injectable()
export class PakParseOrchestratorService implements OnApplicationShutdown {
  private readonly logger = new Logger(PakParseOrchestratorService.name);
  private stopping = false;
  private inFlight: Promise<unknown> | null = null;

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(ParseRun, 'pak') private readonly runRepo: Repository<ParseRun>,
    @InjectRepository(ParseSource, 'pak') private readonly sourceRepo: Repository<ParseSource>,
    @InjectRepository(DramaSourceLink, 'pak') private readonly linkRepo: Repository<DramaSourceLink>,
    private readonly dramaxima: PakDramaximaDriver,
    private readonly registry: DriverRegistryService,
    private readonly matcher: SlugMatcherService,
    private readonly lock: PakDistributedLockService,
  ) {}

  async onApplicationShutdown(signal?: string): Promise<void> {
    this.stopping = true;
    if (this.inFlight) {
      this.logger.warn(
        `Shutdown (${signal ?? 'unknown'}): waiting for in-flight parse run`,
      );
      try {
        await Promise.race([
          this.inFlight,
          new Promise((r) => setTimeout(r, 25_000)),
        ]);
      } catch {
        /* already logged by runner */
      }
    }
  }

  async runDiscovery(): Promise<DiscoverySummary> {
    const lockName = 'parse:dramaxima:discovery';
    const result = await this.lock.withLock(lockName, 0, async () => {
      return this.dramaxima.discoverNewDramas();
    });
    if (result) {
      this.logger.log(
        `[discovery] done: found=${result.found} new=${result.newDramas} ` +
          `created=[${result.created.join(',')}] failed=[${result.failed.join(',')}]`,
      );
      return result;
    }
    return { found: 0, newDramas: 0, created: [], failed: [] };
  }

  async runMultiSourceDiscovery(): Promise<{
    sources: Array<{ slug: string; discovered: number; linked: number; created: number; failed: number }>;
  }> {
    const sources = await this.sourceRepo.find({ where: { isActive: 1 } });
    const report: Array<{ slug: string; discovered: number; linked: number; created: number; failed: number }> = [];

    for (const source of sources) {
      const driver = this.registry.get(source.driver);
      if (!driver) continue;

      const lockName = `parse:discovery:${source.slug}`;
      const result = await this.lock.withLock(lockName, 0, async () => {
        const discovered = await driver.discoverDramas();
        const entry = { slug: source.slug, discovered: discovered.length, linked: 0, created: 0, failed: 0 };

        for (const d of discovered) {
          try {
            // Check if link already exists
            const existingLink = await this.linkRepo.findOne({
              where: { sourceId: source.id, sourceSlug: d.sourceSlug },
            });
            if (existingLink) continue;

            // Try to match to existing drama
            const match = await this.matcher.findMatch(d.sourceSlug, d.title);
            if (match) {
              await this.ensureLink(match.drama, source, d.sourceSlug, d.sourceUrl, match.method, match.confidence);
              entry.linked++;
            }
            // Don't auto-create dramas from secondary sources — only link to existing ones
          } catch (err) {
            entry.failed++;
            this.logger.warn(`Discovery link failed for ${d.sourceSlug}: ${(err as Error).message}`);
          }
        }
        return entry;
      });

      if (result) report.push(result);
    }

    this.logger.log(
      `[multi-discovery] ${report.map((r) => `${r.slug}:found=${r.discovered},linked=${r.linked}`).join(' ')}`,
    );
    return { sources: report };
  }

  private async ensureLink(
    drama: Drama,
    source: ParseSource,
    sourceSlug: string,
    sourceUrl: string,
    method: MatchMethodEnum,
    confidence: number,
  ): Promise<DramaSourceLink> {
    const existing = await this.linkRepo.findOne({
      where: { dramaId: drama.id, sourceId: source.id },
    });
    if (existing) return existing;

    return this.linkRepo.save(
      this.linkRepo.create({
        dramaId: drama.id,
        sourceId: source.id,
        sourceSlug,
        sourceUrl,
        matchMethod: method,
        matchConfidence: confidence,
        priority: source.priority,
        status: SourceLinkStatusEnum.ACTIVE,
      }),
    );
  }

  async runDramaBySlug(slug: string): Promise<TierRunReport> {
    const drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) {
      return this.emptyReport('all', { start: new Date(), end: new Date() });
    }
    return this.runDramas('all', [drama], { skipFingerprintCheck: true });
  }

  async runTier(target: ParseTier): Promise<TierRunReport> {
    const lockName = `parse:dramaxima:${target}`;
    const startedAt = new Date();

    const skipFp = target === 'hot';

    const result = await this.lock.withLock(lockName, 0, async () => {
      const candidates = await this.selectTierDramas(target);
      this.logger.log(
        `[${target}] starting: ${candidates.length} drama(s) in tier`,
      );
      return this.runDramas(target, candidates, { skipFingerprintCheck: skipFp });
    });

    if (result) return result;
    return {
      ...this.emptyReport(target, { start: startedAt, end: new Date() }),
      lockAcquired: false,
    };
  }

  private async runDramas(
    target: ParseTier | 'all',
    candidates: Drama[],
    opts: { skipFingerprintCheck?: boolean } = {},
  ): Promise<TierRunReport> {
    const startedAt = new Date();
    const report: TierRunReport = {
      tier: target,
      startedAt,
      finishedAt: startedAt,
      lockAcquired: true,
      dramasConsidered: candidates.length,
      dramasSkipped: 0,
      dramasImported: 0,
      dramasFailed: 0,
      episodesImported: 0,
      details: [],
    };

    const run = async (drama: Drama, idx: number) => {
      if (this.stopping) return;
      await sleep(idx * DRAMA_START_JITTER_MS);

      // Try multi-source path first (source links), then legacy dramaxima fallback
      const links = await this.linkRepo.find({
        where: { dramaId: drama.id, status: SourceLinkStatusEnum.ACTIVE },
        relations: ['source'],
        order: { priority: 'ASC' },
      });

      if (links.length > 0) {
        await this.runDramaMultiSource(drama, links, report, target, opts);
      } else {
        await this.runDramaLegacy(drama, report, target, opts);
      }
    };

    const inflight = new Set<Promise<void>>();
    const scheduleNext = async (i: number) => {
      if (i >= candidates.length) return;
      const p = run(candidates[i], i).finally(() => inflight.delete(p));
      inflight.add(p);
      if (inflight.size >= MAX_CONCURRENT_DRAMAS) {
        await Promise.race(inflight);
      }
      return scheduleNext(i + 1);
    };

    const track = scheduleNext(0);
    this.inFlight = track;
    try {
      await track;
      await Promise.all(inflight);
    } finally {
      this.inFlight = null;
    }

    report.finishedAt = new Date();
    this.logger.log(
      `[${target}] done: imported=${report.dramasImported} ` +
        `skipped=${report.dramasSkipped} failed=${report.dramasFailed} ` +
        `eps+=${report.episodesImported} in ` +
        `${(report.finishedAt.getTime() - startedAt.getTime()) / 1000}s`,
    );
    return report;
  }

  private async runDramaMultiSource(
    drama: Drama,
    links: DramaSourceLink[],
    report: TierRunReport,
    target: ParseTier | 'all',
    opts: { skipFingerprintCheck?: boolean },
  ): Promise<void> {
    const now = new Date();
    for (const link of links) {
      if (link.frozenUntil && link.frozenUntil > now) continue;
      if (!link.source?.isActive) continue;

      const driver = this.registry.get(link.source.driver);
      if (!driver) continue;

      try {
        // Fingerprint check
        if (!opts.skipFingerprintCheck) {
          const fp = await driver.getFingerprint(link.sourceSlug, link.sourceUrl);
          if (
            fp?.latestModified &&
            link.parseLastModified &&
            fp.latestModified.getTime() <= link.parseLastModified.getTime()
          ) {
            continue; // No change on this source, try next
          }
        }

        const result = await driver.importDrama(drama, link);

        // Mark link success
        const fp = await driver.getFingerprint(link.sourceSlug, link.sourceUrl);
        await this.linkRepo.update(link.id, {
          lastScrapedAt: now,
          failureCount: 0,
          frozenUntil: null,
          parseLastModified: fp?.latestModified ?? link.parseLastModified ?? now,
        });
        await this.markSuccess(drama, fp?.latestModified ?? null);

        report.dramasImported++;
        report.episodesImported += result.imported;
        report.details.push({
          slug: drama.slug,
          outcome: 'imported',
          imported: result.imported,
        });
        return; // Success — stop trying other sources
      } catch (err) {
        const kind = classifyError(err);
        const nextCount = (link.failureCount ?? 0) + 1;
        const windowMs = nextCount >= MAX_CONSECUTIVE_FAILURES
          ? freezeWindowMs('permanent', nextCount)
          : freezeWindowMs(kind, nextCount);

        await this.linkRepo.update(link.id, {
          lastFailedAt: now,
          failureCount: nextCount,
          frozenUntil: new Date(now.getTime() + windowMs),
        });
        this.logger.warn(
          `[${target}] ${drama.slug} via ${link.source.slug} failed (${kind}): ${(err as Error).message}`,
        );
        // Continue to next source link
      }
    }

    // All sources exhausted
    const nextCount = (drama.parseFailureCount ?? 0) + 1;
    await this.markFailure(drama, 'transient', nextCount, new Error('All sources exhausted'));
    report.dramasFailed++;
    report.details.push({
      slug: drama.slug,
      outcome: 'failed',
      reason: 'All sources exhausted',
    });
  }

  private async runDramaLegacy(
    drama: Drama,
    report: TierRunReport,
    target: ParseTier | 'all',
    opts: { skipFingerprintCheck?: boolean },
  ): Promise<void> {
    try {
      let fingerprint: Date | null = null;
      if (!opts.skipFingerprintCheck) {
        fingerprint = await this.dramaxima.getDramaFingerprint(drama);
        if (
          fingerprint &&
          drama.parseLastModified &&
          fingerprint.getTime() <= drama.parseLastModified.getTime()
        ) {
          report.dramasSkipped++;
          report.details.push({ slug: drama.slug, outcome: 'skipped' });
          await this.dramaRepo.update(drama.id, { parseLastAttemptedAt: new Date() });
          return;
        }
      }

      const summary: ImportSummary = await this.dramaxima.importDramaRow(drama);
      await this.markSuccess(drama, fingerprint);
      report.dramasImported++;
      report.episodesImported += summary.imported;
      report.details.push({
        slug: drama.slug,
        outcome: 'imported',
        imported: summary.imported,
      });
    } catch (err) {
      const kind = classifyError(err);
      const nextCount = (drama.parseFailureCount ?? 0) + 1;
      await this.markFailure(drama, kind, nextCount, err);
      report.dramasFailed++;
      report.details.push({
        slug: drama.slug,
        outcome: 'failed',
        reason: `${kind}: ${(err as Error).message ?? err}`,
      });
      this.logger.warn(
        `[${target}] ${drama.slug} failed (${kind}, ${nextCount}x): ${(err as Error).message}`,
      );
    }
  }

  private async selectTierDramas(target: ParseTier): Promise<Drama[]> {
    const now = new Date();
    // Include dramas with either a direct sourceUrl OR active source links
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .leftJoin(DramaSourceLink, 'dsl', 'dsl.drama_id = d.id AND dsl.status = :active', {
        active: SourceLinkStatusEnum.ACTIVE,
      })
      .where(
        '(d.sourceUrl LIKE :u OR dsl.id IS NOT NULL)',
        { u: 'https://dramaxima.com/%' },
      )
      .andWhere('(d.parseFrozenUntil IS NULL OR d.parseFrozenUntil <= :now)', {
        now,
      })
      .orderBy('COALESCE(d.parseLastSucceededAt, 0)', 'ASC')
      .groupBy('d.id')
      .getMany();

    if (target === 'frozen') return [];

    const ids = dramas.map((d) => d.id);
    const airDateByDrama = new Map<string, Date>();
    const dramasWithLinks = new Set<string>();
    if (ids.length) {
      const [airRows, linkRows] = await Promise.all([
        this.episodeRepo
          .createQueryBuilder('e')
          .select('e.dramaId', 'dramaId')
          .addSelect('MAX(e.airDate)', 'maxAir')
          .where('e.dramaId IN (:...ids)', { ids })
          .groupBy('e.dramaId')
          .getRawMany(),
        this.linkRepo
          .createQueryBuilder('l')
          .select('DISTINCT l.drama_id', 'dramaId')
          .where('l.drama_id IN (:...ids)', { ids })
          .andWhere('l.status = :active', { active: SourceLinkStatusEnum.ACTIVE })
          .getRawMany(),
      ]);
      for (const r of airRows) {
        if (r.maxAir) airDateByDrama.set(String(r.dramaId), new Date(r.maxAir));
      }
      for (const r of linkRows) {
        dramasWithLinks.add(String(r.dramaId));
      }
    }

    return dramas.filter(
      (d) =>
        classify({
          drama: d,
          lastEpisodeAt: airDateByDrama.get(d.id) ?? null,
          hasActiveSourceLink: dramasWithLinks.has(d.id),
          now,
        }) === target,
    );
  }

  private async markSuccess(
    drama: Drama,
    fingerprint: Date | null,
  ): Promise<void> {
    const now = new Date();
    await this.dramaRepo.update(drama.id, {
      parseLastAttemptedAt: now,
      parseLastSucceededAt: now,
      parseFailureCount: 0,
      parseFrozenUntil: null,
      parseLastModified:
        fingerprint ?? drama.parseLastModified ?? now,
    });
  }

  private async markFailure(
    drama: Drama,
    kind: ReturnType<typeof classifyError>,
    nextCount: number,
    _err: unknown,
  ): Promise<void> {
    const now = new Date();
    const windowMs =
      nextCount >= MAX_CONSECUTIVE_FAILURES
        ? freezeWindowMs('permanent', nextCount)
        : freezeWindowMs(kind, nextCount);
    const frozenUntil = new Date(now.getTime() + windowMs);
    await this.dramaRepo.update(drama.id, {
      parseLastAttemptedAt: now,
      parseFailureCount: nextCount,
      parseFrozenUntil: frozenUntil,
    });
  }

  async recentRunStats(sinceMs: number): Promise<{
    windowMs: number;
    totalRuns: number;
    successful: number;
    failed: number;
    running: number;
    episodesImported: number;
    topDramasByImports: Array<{ dramaId: string | null; imported: number }>;
  }> {
    const since = new Date(Date.now() - sinceMs);
    const runs = await this.runRepo.find({
      where: { createdAt: Between(since, new Date()) },
    });
    const byStatus = {
      successful: 0,
      failed: 0,
      running: 0,
    };
    let episodesImported = 0;
    const tally = new Map<string | null, number>();
    for (const r of runs) {
      if (r.status === ParseRunStatusEnum.SUCCESS) byStatus.successful++;
      else if (r.status === ParseRunStatusEnum.FAILED) byStatus.failed++;
      else if (r.status === ParseRunStatusEnum.RUNNING) byStatus.running++;
      const imp = Number(
        (r.stats as Record<string, unknown> | null)?.imported ?? 0,
      );
      episodesImported += imp;
      if (imp > 0) tally.set(r.dramaId, (tally.get(r.dramaId) ?? 0) + imp);
    }
    const topDramasByImports = [...tally.entries()]
      .map(([dramaId, imported]) => ({ dramaId, imported }))
      .sort((a, b) => b.imported - a.imported)
      .slice(0, 10);
    return {
      windowMs: sinceMs,
      totalRuns: runs.length,
      ...byStatus,
      episodesImported,
      topDramasByImports,
    };
  }

  async dramaState(slug: string): Promise<unknown> {
    const d = await this.dramaRepo.findOne({
      where: { slug },
      select: {
        id: true,
        slug: true,
        status: true,
        sourceUrl: true,
        totalEpisodes: true,
        parseLastModified: true,
        parseLastAttemptedAt: true,
        parseLastSucceededAt: true,
        parseFailureCount: true,
        parseFrozenUntil: true,
      },
    });
    if (!d) return { slug, found: false };
    const lastEp = await this.episodeRepo.findOne({
      where: { dramaId: d.id, airDate: Not(IsNull()) },
      order: { airDate: 'DESC' },
      select: { id: true, number: true, airDate: true },
    });
    const lastEpisodeAt = lastEp?.airDate ? new Date(lastEp.airDate) : null;
    const sourceLinks = await this.linkRepo.find({
      where: { dramaId: d.id },
      relations: ['source'],
      order: { priority: 'ASC' },
    });
    const tier = classify({ drama: d, lastEpisodeAt, hasActiveSourceLink: sourceLinks.length > 0 });
    const recent = await this.runRepo.find({
      where: { dramaId: In([d.id]) },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return { slug, found: true, drama: d, lastEpisodeAt, tier, sourceLinks, recentRuns: recent };
  }

  private emptyReport(
    tier: ParseTier | 'all',
    { start, end }: { start: Date; end: Date },
  ): TierRunReport {
    return {
      tier,
      startedAt: start,
      finishedAt: end,
      lockAcquired: true,
      dramasConsidered: 0,
      dramasSkipped: 0,
      dramasImported: 0,
      dramasFailed: 0,
      episodesImported: 0,
      details: [],
    };
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
