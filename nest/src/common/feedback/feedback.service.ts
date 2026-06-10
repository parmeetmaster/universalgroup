import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppFeedbackEntity } from './entities/app-feedback.entity';

const KNOWN_KEYS = [
  'type',
  'message',
  'contact',
  'appVersion',
  'platform',
  'deviceInfo',
  'appName',
];

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(AppFeedbackEntity, 'common')
    private readonly repo: Repository<AppFeedbackEntity>,
  ) {}

  async create(
    appNameHeader: string | undefined,
    body: Record<string, unknown>,
  ): Promise<{ id: number; ok: true }> {
    const safe = body ?? {};

    // Collect any fields the app sent that are not known columns → flexible extra.
    const extra: Record<string, unknown> = {};
    for (const key of Object.keys(safe)) {
      if (!KNOWN_KEYS.includes(key)) extra[key] = safe[key];
    }

    const str = (v: unknown, max: number): string | null =>
      v == null ? null : String(v).slice(0, max);

    const entity = this.repo.create({
      appName: (appNameHeader || (safe.appName as string) || 'unknown')
        .toString()
        .slice(0, 100),
      type: str(safe.type, 50) || 'issue',
      message: (str(safe.message, 5000) || '').trim(),
      contact: str(safe.contact, 255),
      appVersion: str(safe.appVersion, 100),
      platform: str(safe.platform, 50),
      deviceInfo: str(safe.deviceInfo, 255),
      extra: Object.keys(extra).length ? extra : null,
      status: 'open',
    });

    const saved = await this.repo.save(entity);
    return { id: saved.id, ok: true };
  }

  async list(opts: {
    app?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; items: AppFeedbackEntity[] }> {
    const qb = this.repo.createQueryBuilder('f').orderBy('f.createdAt', 'DESC');
    if (opts.app) qb.andWhere('f.appName = :app', { app: opts.app });
    if (opts.status) qb.andWhere('f.status = :status', { status: opts.status });
    qb.take(Math.min(opts.limit ?? 50, 200)).skip(opts.offset ?? 0);
    const [items, total] = await qb.getManyAndCount();
    return { total, items };
  }

  async updateStatus(id: number, status: string): Promise<{ ok: boolean }> {
    await this.repo.update(id, { status: status.slice(0, 20) });
    return { ok: true };
  }
}
