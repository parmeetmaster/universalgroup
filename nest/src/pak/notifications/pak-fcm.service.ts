import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { promises as fs } from 'node:fs';

export const TOPIC_NEW_EPISODE = 'pak_new_episode';
export const topicForDrama = (slug: string) =>
  `pak_drama_${slug.replace(/[^a-zA-Z0-9_-]/g, '_')}`;

@Injectable()
export class PakFcmService implements OnModuleInit {
  private readonly logger = new Logger(PakFcmService.name);
  private app?: admin.app.App;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const saPath = this.config.get<string>('PAK_FIREBASE_PATH');
    if (!saPath) {
      this.logger.warn('PAK_FIREBASE_PATH not set — FCM disabled (dry-run)');
      return;
    }
    try {
      const raw = await fs.readFile(saPath, 'utf8');
      const credential = admin.credential.cert(JSON.parse(raw));
      this.app = admin.initializeApp({ credential }, 'pak');
      this.logger.log('Firebase Admin (pak) initialized');
    } catch (e) {
      this.logger.error(`Failed to init Firebase (pak): ${(e as Error).message}`);
    }
  }

  get isEnabled() {
    return !!this.app;
  }

  async sendNewEpisode(opts: {
    dramaTitle: string;
    dramaSlug: string;
    episodeNumber: number;
    posterUrl?: string;
    silent?: boolean;
  }) {
    const { dramaTitle, dramaSlug, episodeNumber, posterUrl, silent } = opts;
    const dramaTopic = topicForDrama(dramaSlug);
    const body = `Episode ${episodeNumber} is now streaming`;

    const buildMessage = (topic: string): admin.messaging.Message => ({
      topic,
      notification: {
        title: dramaTitle,
        body,
        ...(posterUrl ? { imageUrl: posterUrl } : {}),
      },
      data: {
        dramaSlug,
        dramaTitle,
        episodeNumber: String(episodeNumber),
        type: 'new_episode',
      },
      android: {
        priority: silent ? 'normal' : 'high',
        notification: {
          channelId: silent ? 'pak_new_silent' : 'pak_new_episode',
          priority: silent ? 'low' : 'high',
          defaultSound: !silent,
          defaultVibrateTimings: !silent,
        },
      },
    });

    if (!this.app) {
      this.logger.log(`[dry-run] ${dramaTitle} Ep${episodeNumber} -> ${TOPIC_NEW_EPISODE}, ${dramaTopic}`);
      return { global: 'dry-run', drama: 'dry-run' };
    }

    const messaging = admin.messaging(this.app);
    const [global, drama] = await Promise.allSettled([
      messaging.send(buildMessage(TOPIC_NEW_EPISODE)),
      messaging.send(buildMessage(dramaTopic)),
    ]);

    if (global.status === 'rejected') {
      this.logger.warn(`Global topic send failed: ${global.reason}`);
    }
    if (drama.status === 'rejected') {
      this.logger.warn(`Drama topic (${dramaTopic}) send failed: ${drama.reason}`);
    }

    return {
      global: global.status === 'fulfilled' ? global.value : 'failed',
      drama: drama.status === 'fulfilled' ? drama.value : 'failed',
    };
  }
}
