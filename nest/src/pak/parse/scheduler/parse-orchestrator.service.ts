import { Injectable, Logger, OnApplicationShutdown } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, In, IsNull, Not, Repository } from 'typeorm';

import { Drama } from '../../entities/drama.entity';
import { Episode } from '../../entities/episode.entity';
import { ParseRun } from '../../entities/parse-run.entity';
import { ParseRunStatusEnum } from '../../entities/enums';
import {
  PakDramaximaDriver,
  DiscoverySummary,
  ImportSummary,
} from '../drivers/dramaxima.driver';
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
    private readonly dramaxima: PakDramaximaDriver,
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
            await this.dramaRepo.update(drama.id, {
              parseLastAttemptedAt: new Date(),
            });
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

  private async selectTierDramas(target: ParseTier): Promise<Drama[]> {
    const now = new Date();
    const dramas = await this.dramaRepo
      .createQueryBuilder('d')
      .where('d.sourceUrl LIKE :u', { u: 'https://dramaxima.com/%' })
      .andWhere('(d.parseFrozenUntil IS NULL OR d.parseFrozenUntil <= :now)', {
        now,
      })
      .orderBy('COALESCE(d.parseLastSucceededAt, 0)', 'ASC')
      .getMany();

    if (target === 'frozen') return [];

    const ids = dramas.map((d) => d.id);
    const airDateByDrama = new Map<string, Date>();
    if (ids.length) {
      const rows = await this.episodeRepo
        .createQueryBuilder('e')
        .select('e.dramaId', 'dramaId')
        .addSelect('MAX(e.airDate)', 'maxAir')
        .where('e.dramaId IN (:...ids)', { ids })
        .groupBy('e.dramaId')
        .getRawMany();
      for (const r of rows) {
        if (r.maxAir) airDateByDrama.set(String(r.dramaId), new Date(r.maxAir));
      }
    }

    return dramas.filter(
      (d) =>
        classify({
          drama: d,
          lastEpisodeAt: airDateByDrama.get(d.id) ?? null,
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
    const tier = classify({ drama: d, lastEpisodeAt });
    const recent = await this.runRepo.find({
      where: { dramaId: In([d.id]) },
      order: { createdAt: 'DESC' },
      take: 10,
    });
    return { slug, found: true, drama: d, lastEpisodeAt, tier, recentRuns: recent };
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
