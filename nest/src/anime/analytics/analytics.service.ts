import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SiteVisitEntity } from './entities/site-visit.entity';

export type VisitBatch = {
  visits: Array<{ domain: string; count: number }>;
  device_id?: string;
  app_version?: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(SiteVisitEntity, 'anime')
    private readonly repo: Repository<SiteVisitEntity>,
  ) {}

  async ingestBatch(batch: VisitBatch): Promise<{ accepted: number }> {
    const today = new Date().toISOString().slice(0, 10);
    let accepted = 0;

    for (const v of batch.visits ?? []) {
      const domain = this.cleanDomain(v.domain);
      if (!domain || domain.length > 255) continue;
      const count = Math.max(1, Math.min(v.count ?? 1, 1000));

      try {
        // Use raw query for proper INSERT ... ON DUPLICATE KEY UPDATE
        await this.repo.query(
          `INSERT INTO site_visits (domain, visit_count, unique_devices, visit_date)
           VALUES (?, ?, 1, ?)
           ON DUPLICATE KEY UPDATE
             visit_count = visit_count + ?,
             unique_devices = unique_devices + 1`,
          [domain, count, today, count],
        );
        accepted++;
      } catch {
        // Skip on error
      }
    }

    return { accepted };
  }

  async topSites(opts: {
    days?: number;
    limit?: number;
  }): Promise<
    Array<{
      domain: string;
      total_visits: number;
      total_devices: number;
      last_seen: string;
    }>
  > {
    const days = Math.min(Math.max(opts.days ?? 30, 1), 365);
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    return this.repo
      .createQueryBuilder('v')
      .select('v.domain', 'domain')
      .addSelect('SUM(v.visit_count)', 'total_visits')
      .addSelect('SUM(v.unique_devices)', 'total_devices')
      .addSelect('MAX(v.visit_date)', 'last_seen')
      .where('v.visit_date >= :since', { since: sinceStr })
      .groupBy('v.domain')
      .orderBy('total_visits', 'DESC')
      .limit(limit)
      .getRawMany();
  }

  async dailyStats(opts: {
    days?: number;
  }): Promise<Array<{ date: string; domains: number; visits: number }>> {
    const days = Math.min(Math.max(opts.days ?? 14, 1), 90);
    const since = new Date();
    since.setDate(since.getDate() - days);
    const sinceStr = since.toISOString().slice(0, 10);

    return this.repo
      .createQueryBuilder('v')
      .select('v.visit_date', 'date')
      .addSelect('COUNT(DISTINCT v.domain)', 'domains')
      .addSelect('SUM(v.visit_count)', 'visits')
      .where('v.visit_date >= :since', { since: sinceStr })
      .groupBy('v.visit_date')
      .orderBy('v.visit_date', 'DESC')
      .getRawMany();
  }

  async deleteOlderThan(days: number): Promise<number> {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const cutoffStr = cutoff.toISOString().slice(0, 10);
    const result = await this.repo
      .createQueryBuilder()
      .delete()
      .where('visit_date < :cutoff', { cutoff: cutoffStr })
      .execute();
    return result.affected ?? 0;
  }

  private cleanDomain(raw: string): string | null {
    if (!raw) return null;
    try {
      let d = raw.trim().toLowerCase();
      if (!d.includes('://')) d = 'https://' + d;
      const url = new URL(d);
      const host = url.hostname.replace(/^www\./, '');
      if (!host || host.length < 3 || !host.includes('.')) return null;
      // Skip internal/local domains
      if (
        host === 'localhost' ||
        host.startsWith('127.') ||
        host.startsWith('10.') ||
        host.startsWith('192.168.')
      )
        return null;
      return host;
    } catch {
      return null;
    }
  }
}
