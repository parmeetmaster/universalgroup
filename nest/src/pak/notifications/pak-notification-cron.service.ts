import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Episode } from '../entities/episode.entity';
import { Drama } from '../entities/drama.entity';
import { PakSentNotification } from './sent-notification.entity';
import { PakFcmService, TOPIC_NEW_EPISODE, topicForDrama } from './pak-fcm.service';

const MAX_NOTIFICATIONS_PER_BATCH = 5;

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
    // Only run on instance 0 (cluster mode)
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') {
      this.logger.log(`Skipping notification cron on instance ${instance}`);
      return;
    }
    // Prime: mark existing episodes as "seen" on first run
    const count = await this.sentRepo.count();
    if (count === 0) {
      this.logger.log('First run — priming sent notifications table');
      await this.prime();
    }
    this.primed = true;
    this.logger.log('Notification cron ready (every 30 min)');
  }

  private async prime() {
    // Mark last 200 episodes as already sent to avoid notification spam on first deploy
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

    this.logger.log(`Primed ${records.length} episodes`);
  }

  // Every 30 minutes
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
    // Find episodes created in the last 35 minutes that haven't been notified
    const cutoff = new Date(Date.now() - 35 * 60 * 1000);

    const newEpisodes = await this.episodeRepo
      .createQueryBuilder('e')
      .innerJoinAndSelect('e.drama', 'd')
      .leftJoin(
        PakSentNotification,
        'sn',
        'sn.episode_id = e.id',
      )
      .where('e.createdAt > :cutoff', { cutoff })
      .andWhere('d.isPublished = 1')
      .andWhere('d.deletedAt IS NULL')
      .andWhere('sn.id IS NULL')
      .orderBy('e.createdAt', 'DESC')
      .take(MAX_NOTIFICATIONS_PER_BATCH)
      .getMany();

    if (newEpisodes.length === 0) return;

    this.logger.log(`Found ${newEpisodes.length} new episode(s) to notify`);

    // Group by drama to send one notification per drama (latest episode)
    const byDrama = new Map<string, Episode>();
    for (const ep of newEpisodes) {
      const existing = byDrama.get(ep.dramaId);
      if (!existing || ep.number > existing.number) {
        byDrama.set(ep.dramaId, ep);
      }
    }

    let alertSent = false;
    for (const ep of byDrama.values()) {
      const drama = ep.drama;
      // Pick a valid poster (skip broken dramaxima placeholder)
      const poster = drama.posterUrl && !drama.posterUrl.includes('dramaxima.png')
        ? drama.posterUrl
        : undefined;

      const result = await this.fcm.sendNewEpisode({
        dramaTitle: drama.title,
        dramaSlug: drama.slug,
        episodeNumber: ep.number,
        posterUrl: poster,
        silent: alertSent, // First one is alert, rest are silent
      });

      this.logger.log(
        `Notified: ${drama.title} Ep${ep.number} [global:${result.global}, drama:${result.drama}]`,
      );
      alertSent = true;
    }

    // Record all episodes as sent (including ones grouped away)
    const records = newEpisodes.map((ep) => ({
      episodeId: ep.id,
      dramaId: ep.dramaId,
      dramaTitle: ep.drama.title,
      dramaSlug: ep.drama.slug,
      episodeNumber: ep.number,
      topic: `${TOPIC_NEW_EPISODE},${topicForDrama(ep.drama.slug)}`,
    }));

    await this.sentRepo
      .createQueryBuilder()
      .insert()
      .into(PakSentNotification)
      .values(records)
      .orIgnore()
      .execute();
  }
}
