import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { VpnConfigService } from './vpn-config.service';
import { VpnValidatorService } from './vpn-validator.service';

@Injectable()
export class VpnCronService implements OnModuleInit {
  private readonly logger = new Logger(VpnCronService.name);
  private ready = false;

  constructor(
    private readonly vpnService: VpnConfigService,
    private readonly validator: VpnValidatorService,
  ) {}

  async onModuleInit() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') {
      this.logger.log(`Skipping VPN cron on instance ${instance}`);
      return;
    }

    this.ready = true;
    this.logger.log('VPN cron ready');

    // Initial scrape + validate on startup
    try {
      await this.vpnService.scrapeAndSave();
      this.logger.log('Initial VPN scrape done, starting validation...');
      await this.validator.validateAll();
      this.logger.log('Initial VPN validation done');
    } catch (err) {
      this.logger.error(
        `Initial VPN scrape/validate failed: ${(err as Error).message}`,
      );
    }
  }

  // Scrape + validate fresh configs every 30 minutes so the served list updates.
  @Cron('*/30 * * * *')
  async refreshConfigs() {
    if (!this.ready) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.logger.log('Cron: scraping + validating VPN configs...');
    try {
      const scrape = await this.vpnService.scrapeAndSave();
      this.logger.log(
        `Cron VPN scrape: ${scrape.scraped} scraped, ${scrape.new} new`,
      );
      const validate = await this.validator.validateAll();
      this.logger.log(
        `Cron VPN validate: ${validate.tested} tested, ${validate.alive} alive, ${validate.dead} dead`,
      );
    } catch (err) {
      this.logger.error(`Cron VPN refresh failed: ${(err as Error).message}`);
    }
  }

  // Hot pool: re-verify currently-active configs every 5 minutes so the served
  // set is always confirmed-reachable within minutes. Guarded against overlap.
  private revalidating = false;

  @Cron('*/5 * * * *')
  async revalidateActiveConfigs() {
    if (!this.ready || this.revalidating) return;
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    this.revalidating = true;
    try {
      const result = await this.validator.revalidateActive();
      this.logger.log(
        `Cron VPN hot-pool: ${result.tested} tested, ${result.alive} still alive, ${result.dead} dropped`,
      );
    } catch (err) {
      this.logger.error(`Cron VPN hot-pool failed: ${(err as Error).message}`);
    } finally {
      this.revalidating = false;
    }
  }
}
