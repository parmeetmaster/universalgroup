import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PakParseOrchestratorService } from './parse-orchestrator.service';
import { PakDramaSpiceDriver } from '../drivers/dramaspice.driver';
import { PakDramaximaDriver } from '../drivers/dramaxima.driver';
import { PakDistributedLockService } from './distributed-lock.service';

@Injectable()
export class PakParseSchedulerService {
  private readonly logger = new Logger(PakParseSchedulerService.name);

  constructor(
    private readonly orchestrator: PakParseOrchestratorService,
    private readonly dramaSpice: PakDramaSpiceDriver,
    private readonly dramaxima: PakDramaximaDriver,
    private readonly lock: PakDistributedLockService,
  ) {}

  @Cron('0 * * * *', { name: 'pak-dramaxima-hot' })
  hot(): Promise<unknown> {
    return this.orchestrator.runTier('hot').catch((err) => {
      this.logger.error(`hot tier failed: ${err.message}`, err.stack);
    });
  }

  @Cron('15 3 * * *', { name: 'pak-dramaxima-warm' })
  warm(): Promise<unknown> {
    return this.orchestrator.runTier('warm').catch((err) => {
      this.logger.error(`warm tier failed: ${err.message}`, err.stack);
    });
  }

  @Cron('45 3 * * 0', { name: 'pak-dramaxima-cold' })
  cold(): Promise<unknown> {
    return this.orchestrator.runTier('cold').catch((err) => {
      this.logger.error(`cold tier failed: ${err.message}`, err.stack);
    });
  }

  // Discovery in IST: 6-hourly through the day (00, 06, 12, 18) plus hourly in the
  // 8 PM–midnight prime window, since most new dramas/episodes drop in the evening.
  @Cron('0 0,6,12,18,20,21,22,23 * * *', {
    name: 'pak-dramaxima-discovery',
    timeZone: 'Asia/Kolkata',
  })
  discover(): Promise<unknown> {
    return this.orchestrator.runDiscovery().catch((err) => {
      this.logger.error(`discovery failed: ${err.message}`, err.stack);
    });
  }

  // Daily at 5:30 AM IST: fix any dramaxima drama with a logo/placeholder/missing
  // poster or a polluted "… Episode N" title (resolves posters from WP featured
  // images, the landing page, then a safe online search).
  @Cron('30 5 * * *', {
    name: 'pak-dramaxima-poster-repair',
    timeZone: 'Asia/Kolkata',
  })
  async posterRepair(): Promise<void> {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;
    try {
      const r = await this.dramaxima.repairPostersAndTitles();
      this.logger.log(
        `Poster/title repair: checked=${r.checked}, repaired=${r.repaired.length}, failed=${r.failed.length}`,
      );
    } catch (err) {
      this.logger.error(`poster repair failed: ${(err as Error).message}`);
    }
  }

  // DramaSpice: scan sitemap for new episodes every 2 hours
  @Cron('0 */2 * * *', { name: 'pak-dramaspice-scan' })
  async dramaSpiceScan(): Promise<void> {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    const result = await this.lock.withLock(
      'parse:dramaspice:scan',
      5,
      () => this.dramaSpice.scanAndImport(),
    );

    if (!result) {
      this.logger.debug('DramaSpice scan skipped (lock held by another instance)');
      return;
    }

    if (result.newEpisodes > 0 || result.newDramas > 0) {
      this.logger.log(
        `DramaSpice scan: ${result.newDramas} new dramas, ${result.newEpisodes} new episodes`,
      );
    }
    if (result.errors.length > 0) {
      this.logger.warn(`DramaSpice errors: ${result.errors.join('; ')}`);
    }
  }

  // DramaSpice homepage sync: scrape "Today's Episodes" list and set ordered
  // airDates so "Latest Releases" rail matches the homepage order exactly.
  // Runs hourly during prime window (8 PM–midnight IST) when new episodes drop.
  // Multi-source discovery: link dramas across all active sources (hum.tv, etc.)
  // Runs twice daily at 6 AM and 6 PM IST
  @Cron('0 6,18 * * *', {
    name: 'pak-multi-source-discovery',
    timeZone: 'Asia/Kolkata',
  })
  async multiSourceDiscovery(): Promise<void> {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;
    try {
      const r = await this.orchestrator.runMultiSourceDiscovery();
      this.logger.log(
        `Multi-source discovery: ${r.sources.map((s) => `${s.slug}:linked=${s.linked}`).join(', ')}`,
      );
    } catch (err) {
      this.logger.error(`Multi-source discovery failed: ${(err as Error).message}`);
    }
  }

  @Cron('30 20,21,22,23 * * *', {
    name: 'pak-dramaspice-homepage-sync',
    timeZone: 'Asia/Kolkata',
  })
  async dramaSpiceHomepageSync(): Promise<void> {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    try {
      const r = await this.dramaSpice.syncHomepageAirDates();
      if (r.updated > 0) {
        this.logger.log(
          `Homepage sync: found=${r.found}, updated=${r.updated}`,
        );
      }
      if (r.errors.length > 0) {
        this.logger.warn(`Homepage sync errors: ${r.errors.join('; ')}`);
      }
    } catch (err) {
      this.logger.error(
        `Homepage sync failed: ${(err as Error).message}`,
      );
    }
  }
}
