import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AsuraScraperService, ChapterCandidate } from './asura-scraper.service';
import { MangaFcmService } from './manga-fcm.service';
import { SeenChapterEntity } from './entities/seen-chapter.entity';

const MAX_PER_RUN = 8;

export interface RunResult {
  scraped: number;
  fresh: number;
  sent: number;
  primed: boolean;
  dryRun: boolean;
  wouldSend: Array<{ title: string; chapterNumber: string; url: string }>;
}

/**
 * Hourly Asura Scans new-chapter poller. Idempotent by design: every chapter
 * is claimed in `seen_chapters` (INSERT IGNORE) BEFORE its notification is
 * sent, so a chapter is never notified twice — across cluster instances and
 * restarts. First run primes the table silently to avoid a backlog flood.
 */
@Injectable()
export class MangaNotificationCronService {
  private readonly logger = new Logger(MangaNotificationCronService.name);
  private running = false;

  constructor(
    @InjectRepository(SeenChapterEntity, 'manga')
    private readonly repo: Repository<SeenChapterEntity>,
    private readonly scraper: AsuraScraperService,
    private readonly fcm: MangaFcmService,
  ) {}

  @Cron('0 * * * *') // top of every hour
  async scheduledRun(): Promise<void> {
    const instance = process.env.NODE_APP_INSTANCE ?? '0';
    if (instance !== '0') {
      this.logger.debug(`Instance ${instance} — manga poll skipped (only instance 0 runs)`);
      return;
    }
    await this.runOnce(false);
  }

  /**
   * @param preview when true (or when FCM is disabled), no DB writes happen —
   * it only reports what WOULD be sent. Used by the admin trigger (?dry=1) and
   * automatically while the service account is not configured.
   */
  async runOnce(preview: boolean): Promise<RunResult> {
    const empty: RunResult = {
      scraped: 0,
      fresh: 0,
      sent: 0,
      primed: false,
      dryRun: preview,
      wouldSend: [],
    };

    if (this.running) {
      this.logger.debug('previous run still in progress — skipping');
      return empty;
    }
    this.running = true;

    try {
      const isPreview = preview || !this.fcm.isEnabled;

      const candidates = await this.scraper.fetchLatest();
      if (candidates.length === 0) {
        this.logger.warn('Asura returned 0 chapters — API may have changed');
        return { ...empty, dryRun: isPreview };
      }

      // De-dup within this batch by chapterId (defensive).
      const byId = new Map<string, ChapterCandidate>();
      for (const c of candidates) if (!byId.has(c.chapterId)) byId.set(c.chapterId, c);
      const unique = [...byId.values()];

      const ids = unique.map((c) => c.chapterId);
      const existing = await this.repo.find({
        where: { chapterId: In(ids) },
        select: { chapterId: true },
      });
      const seen = new Set(existing.map((e) => e.chapterId));
      const fresh = unique.filter((c) => !seen.has(c.chapterId));

      if (isPreview) {
        const wouldSend = fresh.slice(0, MAX_PER_RUN).map((c) => ({
          title: c.seriesTitle,
          chapterNumber: c.chapterNumber,
          url: c.chapterUrl,
        }));
        this.logger.log(
          `[preview] scraped=${unique.length} fresh=${fresh.length} wouldSend=${wouldSend.length}`,
        );
        return { scraped: unique.length, fresh: fresh.length, sent: 0, primed: false, dryRun: true, wouldSend };
      }

      if (fresh.length === 0) {
        this.logger.debug('no new chapters');
        return { ...empty, scraped: unique.length, dryRun: false };
      }

      // First run: table empty → prime with the whole window, notify nothing.
      const total = await this.repo.count();
      if (total === 0) {
        await this.repo
          .createQueryBuilder()
          .insert()
          .into(SeenChapterEntity)
          .values(unique.map((c) => this.toRow(c)))
          .orIgnore()
          .execute();
        this.logger.log(
          `Primed seen_chapters with ${unique.length} rows — suppressing first-run notifications`,
        );
        return { scraped: unique.length, fresh: fresh.length, sent: 0, primed: true, dryRun: false, wouldSend: [] };
      }

      const toSend = fresh.slice(0, MAX_PER_RUN);
      const skipped = fresh.length - toSend.length;
      if (skipped > 0) {
        this.logger.log(`Capping at ${MAX_PER_RUN}/run — ${skipped} will go out next run`);
      }

      let sent = 0;
      for (const c of toSend) {
        const claimed = await this.claim(c);
        if (!claimed) {
          this.logger.debug(`already claimed: ${c.chapterId}`);
          continue;
        }
        const res = await this.fcm.sendNewChapter({
          title: c.seriesTitle,
          chapterNumber: c.chapterNumber,
          url: c.chapterUrl,
          imageUrl: c.coverUrl,
          seriesSlug: c.seriesSlug,
        });
        if (res.ok) {
          sent++;
        } else if (res.retryable) {
          // transient failure — release the claim so the next run retries
          await this.repo.delete({ chapterId: c.chapterId }).catch(() => {});
        }
        // permanent failure: keep the claim (don't hammer a bad payload hourly)
      }

      this.logger.log(`Run complete. scraped=${unique.length} fresh=${fresh.length} sent=${sent}`);
      return { scraped: unique.length, fresh: fresh.length, sent, primed: false, dryRun: false, wouldSend: [] };
    } catch (err) {
      this.logger.error(`Manga poll failed: ${err instanceof Error ? err.message : err}`);
      return empty;
    } finally {
      this.running = false;
    }
  }

  /** INSERT IGNORE one chapter. Returns true only if THIS call inserted it. */
  private async claim(c: ChapterCandidate): Promise<boolean> {
    try {
      const result = await this.repo
        .createQueryBuilder()
        .insert()
        .into(SeenChapterEntity)
        .values(this.toRow(c))
        .orIgnore()
        .execute();
      return (result.raw?.affectedRows ?? 0) > 0;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Duplicate') || msg.includes('UNIQUE')) return false;
      this.logger.warn(`claim failed for ${c.chapterId}: ${msg}`);
      return false;
    }
  }

  private toRow(c: ChapterCandidate) {
    return {
      chapterId: c.chapterId,
      seriesSlug: c.seriesSlug || null,
      chapterNumber: c.chapterNumber || null,
      title: (c.seriesTitle || '').slice(0, 255) || null,
    };
  }
}
