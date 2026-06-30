import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppFeedbackEntity } from './entities/app-feedback.entity';

export type CreateFeedbackInput = {
  rating: number;
  problemTypes?: string;
  description?: string;
  deviceModel?: string;
  appVersion?: string;
  androidVersion?: string;
};

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(AppFeedbackEntity, 'anime')
    private readonly repo: Repository<AppFeedbackEntity>,
  ) {}

  private trim(s: string | undefined, max: number): string | null {
    if (s == null) return null;
    const t = String(s).trim();
    if (!t) return null;
    return t.length > max ? t.slice(0, max) : t;
  }

  async create(input: CreateFeedbackInput): Promise<AppFeedbackEntity> {
    const rating = Math.min(Math.max(Math.round(input.rating ?? 0), 1), 5);
    const row = this.repo.create({
      rating,
      problemTypes: this.trim(input.problemTypes, 5_000),
      description: this.trim(input.description, 10_000),
      deviceModel: this.trim(input.deviceModel, 100),
      appVersion: this.trim(input.appVersion, 50),
      androidVersion: this.trim(input.androidVersion, 20),
    });
    return this.repo.save(row);
  }

  async list(opts: {
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; items: AppFeedbackEntity[] }> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);

    const qb = this.repo.createQueryBuilder('f');
    qb.orderBy('f.created_at', 'DESC').take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { total, items };
  }
}
