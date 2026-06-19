import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { Drama } from '../entities/drama.entity';
import { PakSentNotification } from './sent-notification.entity';
import { PakFcmService, TOPIC_NEW_EPISODE, topicForDrama } from './pak-fcm.service';

const MAX_NOTIFICATIONS_PER_BATCH = 20;

@Injectable()
export class PakNotificationCronService implements OnModuleInit {
  private readonly logger = new Logger(PakNotificationCronService.name);
  private primed = false;

  constructor(
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(PakSentNotification, 'pak')
    private readonly sentRepo: Repository<PakSentNotification>,
    private readonly fcm: PakFcmService,
  ) {}

  async onModuleInit() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') {
      this.logger.log(`Skipping notification cron on instance ${instance}`);
      return;
    }
    const count = await this.sentRepo.count();
    if (count === 0) {
      this.logger.log('First run — priming sent notifications table');
      await this.prime();
    }
    this.primed = true;
    this.logger.log('Notification cron ready (every 30 min)');
  }

  private async prime() {
    // Mark last 200 episodes as already sent + set notification_sent = 1
    // to avoid notification spam on first deploy
    const recent = await this.episodeRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.drama', 'd')
      .where('d.isPublished = 1')
      .orderBy('e.createdAt', 'DESC')
      .take(200)
      .getMany();

    if (recent.length === 0) return;

    const records = recent.map((ep) => ({
      episodeId: ep.id,
      dramaId: ep.dramaId,
      dramaTitle: ep.drama.title,
      dramaSlug: ep.drama.slug,
      episodeNumber: ep.number,
      topic: 'primed',
    }));

    await this.sentRepo
      .createQueryBuilder()
      .insert()
      .into(PakSentNotification)
      .values(records)
      .orIgnore()
      .execute();

    // Also set notification_sent = 1 on these episodes
    const ids = recent.map((ep) => ep.id);
    if (ids.length > 0) {
      await this.episodeRepo
        .createQueryBuilder()
        .update(Episode)
        .set({ notificationSent: 1 })
        .whereInIds(ids)
        .execute();
    }

    this.logger.log(`Primed ${records.length} episodes`);
  }

  @Cron('*/30 * * * *')
  async checkNewEpisodes() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;
    if (!this.primed) return;

    try {
      await this.run();
    } catch (e) {
      this.logger.error(`Notification cron failed: ${(e as Error).message}`);
    }
  }

  private async run() {
    // Flag-based: find episodes where notification_sent = 0
    // Only notify if: published, not placeholder, has a source URL or active video
    const episodes = await this.episodeRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.drama', 'd')
      .where('e.notificationSent = 0')
      .andWhere('e.isPublished = 1')
      .andWhere('e.isPlaceholder = 0')
      .andWhere('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere(
        `(e.source_url IS NOT NULL AND e.source_url != '' OR EXISTS (SELECT 1 FROM episode_videos ev WHERE ev.episode_id = e.id AND ev.is_active = 1))`,
      )
      .orderBy('e.createdAt', 'ASC')
      .take(MAX_NOTIFICATIONS_PER_BATCH)
      .getMany();

    if (episodes.length === 0) return;

    this.logger.log(`Found ${episodes.length} episode(s) to notify`);

    let alertSent = false;

    for (const ep of episodes) {
      const drama = ep.drama;
      const title = drama.title.length > 50
        ? drama.title.substring(0, 47) + '...'
        : drama.title;

      const poster =
        drama.posterUrl && !drama.posterUrl.includes('dramaxima.png')
          ? drama.posterUrl
          : undefined;

      try {
        const result = await this.fcm.sendNewEpisode({
          dramaTitle: title,
          dramaSlug: drama.slug,
          episodeNumber: ep.number,
          posterUrl: poster,
          silent: alertSent,
        });

        // Set flag ONLY after FCM succeeds
        if (result.messageId) {
          await this.episodeRepo.update(ep.id, { notificationSent: 1 });

          this.logger.log(
            `Notified: ${title} Ep${ep.number} [${result.messageId}]`,
          );
        } else {
          this.logger.warn(
            `FCM failed for ${title} Ep${ep.number} — will retry next cycle`,
          );
        }

        alertSent = true;
      } catch (e) {
        this.logger.error(
          `Failed to notify ${title} Ep${ep.number}: ${(e as Error).message}`,
        );
        // Leave notificationSent = 0, will retry next cycle
      }

      // Secondary dedup record (belt + suspenders)
      try {
        await this.sentRepo
          .createQueryBuilder()
          .insert()
          .into(PakSentNotification)
          .values({
            episodeId: ep.id,
            dramaId: ep.dramaId,
            dramaTitle: drama.title,
            dramaSlug: drama.slug,
            episodeNumber: ep.number,
            topic: `${TOPIC_NEW_EPISODE},${topicForDrama(drama.slug)}`,
          })
          .orIgnore()
          .execute();
      } catch {
        // Non-critical — flag-based approach is the primary dedup
      }
    }
  }
}
