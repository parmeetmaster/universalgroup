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

    // Single send via a topic CONDITION instead of two separate topic sends.
    // A device that follows the drama is subscribed to BOTH the global topic and
    // the drama topic; FCM delivers a condition message only ONCE per device even
    // when several of its topics match, so the same episode can never arrive twice.
    const condition = `'${TOPIC_NEW_EPISODE}' in topics || '${dramaTopic}' in topics`;

    const message: admin.messaging.Message = {
      condition,
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
    };

    if (!this.app) {
      this.logger.log(`[dry-run] ${dramaTitle} Ep${episodeNumber} -> (${condition})`);
      return { messageId: 'dry-run' };
    }

    const messageId = await admin.messaging(this.app).send(message);
    return { messageId };
  }
}
