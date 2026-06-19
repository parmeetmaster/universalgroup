import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { promises as fs } from 'node:fs';

const ANDROID_CHANNEL = 'manga_new';
const DEFAULT_TOPIC = 'manga_new';

export interface ChapterNotification {
  title: string; // series title
  chapterNumber: string;
  url: string; // chapter deep link opened in the app
  imageUrl?: string;
  seriesSlug?: string;
}

export interface SendResult {
  ok: boolean;
  /** transient failure → caller should release its claim and retry next run */
  retryable: boolean;
}

/**
 * FCM for the Manga Browser app. The app lives in its OWN Firebase project
 * (`manga-browser-app`), separate from aviation/anime/pak — so this MUST use a
 * NAMED admin app ('manga') and send only via `admin.messaging(this.app)`.
 * Calling the bare `admin.messaging()` would send into the aviation project.
 */
@Injectable()
export class MangaFcmService implements OnModuleInit {
  private readonly logger = new Logger(MangaFcmService.name);
  private app?: admin.app.App;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const saPath = this.config.get<string>('MANGA_FIREBASE_PATH');
    if (!saPath) {
      this.logger.warn('MANGA_FIREBASE_PATH not set — FCM disabled (dry-run)');
      return;
    }
    try {
      const raw = await fs.readFile(saPath, 'utf8');
      const sa = JSON.parse(raw) as { project_id?: string };
      const credential = admin.credential.cert(sa as admin.ServiceAccount);
      // Reuse an existing 'manga' app if already initialized (hot-reload safety).
      this.app =
        admin.apps.find((a) => a?.name === 'manga') ??
        admin.initializeApp({ credential }, 'manga');
      this.logger.log(
        `Firebase Admin (manga) initialized for project ${sa.project_id ?? 'unknown'}`,
      );
    } catch (e) {
      this.logger.error(`Failed to init Firebase (manga): ${(e as Error).message}`);
    }
  }

  get isEnabled(): boolean {
    return !!this.app;
  }

  get topic(): string {
    return this.config.get<string>('MANGA_FCM_TOPIC', DEFAULT_TOPIC);
  }

  async sendNewChapter(n: ChapterNotification): Promise<SendResult> {
    const title = n.title.slice(0, 120);
    const body = `Chapter ${n.chapterNumber} is out`.slice(0, 200);

    if (!this.app) {
      this.logger.log(`[dry-run] would send: ${title} — ${body} -> ${this.topic} (${n.url})`);
      return { ok: true, retryable: false };
    }

    const message: admin.messaging.Message = {
      topic: this.topic,
      notification: {
        title,
        body,
        ...(n.imageUrl ? { imageUrl: n.imageUrl } : {}),
      },
      data: {
        url: n.url,
        title,
        body,
        type: 'manga_chapter',
        mangaTitle: title,
        chapterNumber: String(n.chapterNumber),
        ...(n.seriesSlug ? { seriesSlug: n.seriesSlug } : {}),
      },
      android: {
        priority: 'high',
        notification: {
          channelId: ANDROID_CHANNEL,
          priority: 'high',
          defaultSound: true,
          defaultVibrateTimings: true,
        },
      },
    };

    try {
      const id = await admin.messaging(this.app).send(message);
      this.logger.log(`Sent: ${title} (Ch ${n.chapterNumber}) -> ${this.topic} [${id}]`);
      return { ok: true, retryable: false };
    } catch (e) {
      const code = (e as { code?: string }).code ?? '';
      const retryable = !this.isPermanentError(code);
      this.logger.error(
        `FCM send failed (${code || 'unknown'}, retryable=${retryable}): ${(e as Error).message}`,
      );
      return { ok: false, retryable };
    }
  }

  /** Bad-payload errors: retrying won't help, so the caller keeps the claim. */
  private isPermanentError(code: string): boolean {
    return (
      code === 'messaging/invalid-argument' ||
      code === 'messaging/invalid-payload' ||
      code === 'messaging/payload-size-limit-exceeded' ||
      code === 'messaging/invalid-recipient'
    );
  }
}
