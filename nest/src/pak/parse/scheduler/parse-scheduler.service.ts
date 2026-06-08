import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PakParseOrchestratorService } from './parse-orchestrator.service';
import { PakDramaSpiceDriver } from '../drivers/dramaspice.driver';
import { PakDistributedLockService } from './distributed-lock.service';

@Injectable()
export class PakParseSchedulerService {
  private readonly logger = new Logger(PakParseSchedulerService.name);

  constructor(
    private readonly orchestrator: PakParseOrchestratorService,
    private readonly dramaSpice: PakDramaSpiceDriver,
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

  @Cron('30 */6 * * *', { name: 'pak-dramaxima-discovery' })
  discover(): Promise<unknown> {
    return this.orchestrator.runDiscovery().catch((err) => {
      this.logger.error(`discovery failed: ${err.message}`, err.stack);
    });
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
}
