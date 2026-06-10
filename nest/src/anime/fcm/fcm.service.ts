import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { promises as fs } from 'node:fs';
import { EpisodeItem } from '../scraper/types';
import { BlockedCountriesService } from './blocked-countries.service';
import { CountriesRegistry } from './countries-registry.service';
import { NotificationWindowService } from './notification-window.service';

export const TOPIC_ALL = 'anime_new';
export const topicForCountry = (cc: string) => `anime_new_${cc.toUpperCase()}`;

const ANDROID_CLICK_ACTION = 'com.myAllVideoBrowser.OPEN_URL';
const ANDROID_CHANNEL_ALERT = 'anime_new';
const ANDROID_CHANNEL_SILENT = 'anime_new_silent';

@Injectable()
export class FcmService implements OnModuleInit {
  private readonly logger = new Logger(FcmService.name);
  private app?: admin.app.App;

  constructor(
    private readonly config: ConfigService,
    private readonly countries: CountriesRegistry,
    private readonly blocked: BlockedCountriesService,
    private readonly window: NotificationWindowService,
  ) {}

  async onModuleInit() {
    const saPath = this.config.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
    if (!saPath) {
      this.logger.warn('FIREBASE_SERVICE_ACCOUNT_PATH not set — FCM disabled (dry-run mode)');
      return;
    }
    try {
      const raw = await fs.readFile(saPath, 'utf8');
      const credential = admin.credential.cert(JSON.parse(raw));
      this.app = admin.initializeApp({ credential });
      this.logger.log('Firebase Admin initialized');
    } catch (e) {
      this.logger.error(`Failed to init Firebase Admin from ${saPath}: ${(e as Error).message}`);
    }
  }

  get isEnabled() {
    return !!this.app;
  }

  async subscribeToCountry(token: string, country?: string): Promise<string[]> {
    const cc = country && /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : undefined;

    if (cc && this.blocked.isBlocked(cc)) {
      this.logger.log(`Refusing subscription for blocked country ${cc}`);
      return [];
    }

    const topics = cc ? [topicForCountry(cc)] : [TOPIC_ALL];

    if (cc) {
      await this.countries.add(cc);
    }

    if (!this.app) {
      this.logger.warn(`[dry-run] would subscribe token to topics ${topics.join(', ')}`);
      return topics;
    }
    const messaging = admin.messaging(this.app);
    await Promise.all(topics.map((t) => messaging.subscribeToTopic([token], t)));
    return topics;
  }

  async publishEpisode(item: EpisodeItem, topic: string = TOPIC_ALL, silent = false) {
    const channelId = silent ? ANDROID_CHANNEL_SILENT : ANDROID_CHANNEL_ALERT;
    const payload: admin.messaging.Message = {
      topic,
      notification: {
        title: item.animeName,
        body: item.episode ? `Watch ${item.episode}` : 'New release',
        imageUrl: item.thumbnail,
      },
      data: {
        url: item.url,
        animeName: item.animeName,
        episode: item.episode ?? '',
        type: item.type ?? '',
        silent: silent ? '1' : '0',
      },
      android: {
        priority: 'high',
        notification: {
          clickAction: ANDROID_CLICK_ACTION,
          channelId,
          priority: silent ? 'low' : 'high',
          defaultSound: !silent,
          defaultVibrateTimings: !silent,
        },
      },
    };

    if (!this.app) {
      this.logger.log(`[dry-run] publish ${item.title} -> ${topic} (${silent ? 'silent' : 'alert'})`);
      return 'dry-run';
    }
    return admin.messaging(this.app).send(payload);
  }

  async pingTokens(tokens: string[]): Promise<admin.messaging.BatchResponse> {
    if (!this.app) {
      this.logger.warn(`[dry-run] would ping ${tokens.length} token(s)`);
      return {
        successCount: tokens.length,
        failureCount: 0,
        responses: tokens.map(() => ({ success: true })),
      };
    }
    const message: admin.messaging.MulticastMessage = {
      tokens,
      data: { ping: '1' },
      android: { priority: 'normal' },
    };
    return admin.messaging(this.app).sendEachForMulticast(message);
  }

  async publishEpisodeFanout(item: EpisodeItem, silent = false) {
    const allCountries = await this.countries.all();
    const eligible = allCountries.filter((cc) => !this.blocked.isBlocked(cc));

    // Respect per-country delivery windows (e.g. IN only gets pushes 20:00-08:00 IST).
    // Inside its window a country behaves like any other; outside, its topic is skipped.
    const skippedByWindow = eligible.filter((cc) => !this.window.isWithinWindow(cc));
    if (skippedByWindow.length > 0) {
      this.logger.log(
        `Skipping ${skippedByWindow.join(', ')} for ${item.url} — outside delivery window`,
      );
    }
    const countryTopics = eligible
      .filter((cc) => this.window.isWithinWindow(cc))
      .map(topicForCountry);

    const targets = [TOPIC_ALL, ...countryTopics];
    const results = await Promise.allSettled(
      targets.map((topic) => this.publishEpisode(item, topic, silent)),
    );
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length > 0) {
      this.logger.warn(
        `publishEpisodeFanout: ${failed.length}/${targets.length} failed for ${item.url}`,
      );
    }
    return { total: targets.length, failed: failed.length, topics: targets };
  }
}
