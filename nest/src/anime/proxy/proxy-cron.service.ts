import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { ProxyService } from './proxy.service';
import { ProxyValidatorService } from './proxy-validator.service';

@Injectable()
export class ProxyCronService implements OnModuleInit {
  private readonly logger = new Logger(ProxyCronService.name);
  private ready = false;

  constructor(
    private readonly proxyService: ProxyService,
    private readonly validator: ProxyValidatorService,
  ) {}

  async onModuleInit() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') {
      this.logger.log(`Skipping proxy cron on instance ${instance}`);
      return;
    }

    this.ready = true;
    this.logger.log('Proxy cron ready');

    // Initial scrape on startup
    try {
      await this.proxyService.scrapeAndSave();
      this.logger.log('Initial scrape done, starting validation...');
      await this.validator.validateAll();
      this.logger.log('Initial validation done');
    } catch (err) {
      this.logger.error(`Initial scrape/validate failed: ${(err as Error).message}`);
    }
  }

  // Scrape new proxies every 2 hours
  @Cron('0 */2 * * *')
  async scrapeProxies() {
    if (!this.ready) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.logger.log('Cron: scraping new proxies...');
    try {
      const result = await this.proxyService.scrapeAndSave();
      this.logger.log(`Cron scrape: ${result.scraped} scraped, ${result.new} new`);
    } catch (err) {
      this.logger.error(`Cron scrape failed: ${(err as Error).message}`);
    }
  }

  // Discovery: find new alive proxies every 15 minutes
  @Cron('*/15 * * * *')
  async validateProxies() {
    if (!this.ready) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.logger.log('Cron: validating proxies (discovery)...');
    try {
      const result = await this.validator.validateAll();
      this.logger.log(
        `Cron validate: ${result.tested} tested, ${result.alive} alive, ${result.dead} dead`,
      );
    } catch (err) {
      this.logger.error(`Cron validate failed: ${(err as Error).message}`);
    }
  }

  // Hot pool: re-verify currently-active proxies every 5 minutes so the proxies
  // served to the app are always confirmed-alive within minutes. Guarded so it
  // never overlaps itself if a run is slow.
  private revalidating = false;

  @Cron('*/5 * * * *')
  async revalidateActiveProxies() {
    if (!this.ready || this.revalidating) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.revalidating = true;
    try {
      const result = await this.validator.revalidateActive();
      this.logger.log(
        `Cron hot-pool: ${result.tested} tested, ${result.alive} still alive, ${result.dead} dropped`,
      );
    } catch (err) {
      this.logger.error(`Cron hot-pool failed: ${(err as Error).message}`);
    } finally {
      this.revalidating = false;
    }
  }

  // Cleanup dead proxies daily at 4 AM
  @Cron('0 4 * * *')
  async cleanupDead() {
    if (!this.ready) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.logger.log('Cron: cleaning up dead proxies...');
    try {
      const deleted = await this.validator.cleanup();
      this.logger.log(`Cron cleanup: removed ${deleted} dead proxies`);
    } catch (err) {
      this.logger.error(`Cron cleanup failed: ${(err as Error).message}`);
    }
  }
}
