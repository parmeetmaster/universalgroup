import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { DiffService } from '../diff/diff.service';
import { FcmService } from '../fcm/fcm.service';
import { ScraperService } from '../scraper/scraper.service';

const MAX_NOTIFICATIONS_PER_BATCH = 5;

@Injectable()
export class PollerService implements OnModuleInit {
  private readonly logger = new Logger(PollerService.name);
  private running = false;

  constructor(
    private readonly scraper: ScraperService,
    private readonly diff: DiffService,
    private readonly fcm: FcmService,
    private readonly config: ConfigService,
    private readonly registry: SchedulerRegistry,
  ) {}

  onModuleInit() {
    const instanceId = process.env.NODE_APP_INSTANCE ?? '0';
    if (instanceId !== '0') {
      this.logger.log(`Cluster instance ${instanceId} — poller disabled (only runs on instance 0)`);
      return;
    }

    const minutes = parseInt(this.config.get<string>('POLL_INTERVAL_MINUTES', '10'), 10);
    const cronExpr = `*/${Math.max(1, minutes)} * * * *`;

    const job = new CronJob(cronExpr, () => {
      void this.runOnce();
    });
    this.registry.addCronJob('gogo-poller', job as unknown as CronJob);
    job.start();
    this.logger.log(`Poller scheduled: every ${minutes} min (${cronExpr})`);

    void this.runOnce();
  }

  async runOnce() {
    if (this.running) {
      this.logger.debug('previous tick still running — skipping');
      return;
    }
    this.running = true;
    try {
      const items = await this.scraper.fetchHomepage();
      if (items.length === 0) {
        this.logger.warn('Scraper returned 0 items — selectors may have changed');
        return;
      }
      const fresh = await this.diff.diff(items);
      if (fresh.length === 0) {
        this.logger.debug('no new episodes');
        return;
      }

      const limited = fresh.slice(0, MAX_NOTIFICATIONS_PER_BATCH);
      const skipped = fresh.length - limited.length;
      this.logger.log(
        `${fresh.length} new episode(s) detected — publishing ${limited.length}` +
          (skipped > 0 ? ` (skipping ${skipped} to stay under batch cap)` : ''),
      );

      for (let i = 0; i < limited.length; i++) {
        const item = limited[i];
        const silent = i > 0;
        try {
          const result = await this.fcm.publishEpisodeFanout(item, silent);
          this.logger.log(
            `published ${item.url} (${silent ? 'silent' : 'alert'}) → ${result.topics.length} topic(s)` +
              (result.failed > 0 ? ` (${result.failed} failed)` : ''),
          );
        } catch (e) {
          this.logger.error(`publish failed for ${item.url}: ${(e as Error).message}`);
        }
      }
    } catch (e) {
      this.logger.error(`poll tick failed: ${(e as Error).message}`);
    } finally {
      this.running = false;
    }
  }
}
