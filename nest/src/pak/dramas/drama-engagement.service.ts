import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron } from '@nestjs/schedule';
import { Drama } from '../entities/drama.entity';
import { DramaLike } from '../entities/drama-like.entity';

@Injectable()
export class DramaEngagementService {
  private readonly logger = new Logger(DramaEngagementService.name);

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(DramaLike, 'pak') private readonly likeRepo: Repository<DramaLike>,
  ) {}

  // ── Like / Unlike toggle ──

  async toggleLike(
    slug: string,
    deviceId: string,
  ): Promise<{ liked: boolean; totalLikes: number }> {
    const drama = await this.dramaRepo.findOne({ where: { slug, isPublished: 1 } });
    if (!drama) throw new Error('Drama not found');

    const existing = await this.likeRepo.findOne({
      where: { dramaId: drama.id, deviceId },
    });

    if (existing) {
      // Unlike
      await this.likeRepo.remove(existing);
      await this.dramaRepo.decrement({ id: drama.id }, 'totalLikes', 1);
      const updated = await this.dramaRepo.findOne({ where: { id: drama.id } });
      return { liked: false, totalLikes: Math.max(0, updated?.totalLikes ?? 0) };
    } else {
      // Like
      await this.likeRepo.save({ dramaId: drama.id, deviceId });
      await this.dramaRepo.increment({ id: drama.id }, 'totalLikes', 1);
      const updated = await this.dramaRepo.findOne({ where: { id: drama.id } });
      return { liked: true, totalLikes: updated?.totalLikes ?? 1 };
    }
  }

  async isLiked(slug: string, deviceId: string): Promise<boolean> {
    const drama = await this.dramaRepo.findOne({ where: { slug, isPublished: 1 } });
    if (!drama) return false;
    const count = await this.likeRepo.count({ where: { dramaId: drama.id, deviceId } });
    return count > 0;
  }

  async getLikedSlugs(deviceId: string): Promise<string[]> {
    const rows: { slug: string }[] = await this.likeRepo.query(
      `SELECT d.slug FROM drama_likes dl
       JOIN dramas d ON d.id = dl.drama_id
       WHERE dl.device_id = ?`,
      [deviceId],
    );
    return rows.map((r) => r.slug);
  }

  // ── View recording ──

  async recordView(slug: string): Promise<void> {
    await this.dramaRepo
      .createQueryBuilder()
      .update(Drama)
      .set({
        dailyViews: () => 'daily_views + 1',
        monthlyViews: () => 'monthly_views + 1',
      })
      .where('slug = :slug AND is_published = 1', { slug })
      .execute();
  }

  // ── Cron: reset daily views at midnight UTC ──

  @Cron('0 0 * * *')
  async resetDailyViews() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    await this.dramaRepo
      .createQueryBuilder()
      .update(Drama)
      .set({ dailyViews: 0 })
      .where('daily_views > 0')
      .execute();
    this.logger.log('Daily views reset');
  }

  // ── Cron: reset monthly views on 1st of month ──

  @Cron('0 0 1 * *')
  async resetMonthlyViews() {
    const instance = process.env.NODE_APP_INSTANCE;
    if (instance && instance !== '0') return;

    await this.dramaRepo
      .createQueryBuilder()
      .update(Drama)
      .set({ monthlyViews: 0 })
      .where('monthly_views > 0')
      .execute();
    this.logger.log('Monthly views reset');
  }
}
