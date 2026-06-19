import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ErrorReportEntity } from './entities/error-report.entity';

export const REPORT_STATUSES = ['open', 'ack', 'closed'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export type CreateReportInput = {
  device_name?: string;
  app_version?: string;
  error_title?: string;
  error_message?: string;
  download_url?: string;
  additional_info?: string;
  location?: string;
};

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ErrorReportEntity, 'anime')
    private readonly repo: Repository<ErrorReportEntity>,
  ) {}

  private trim(s: string | undefined, max: number): string | null {
    if (s == null) return null;
    const t = String(s).trim();
    if (!t) return null;
    return t.length > max ? t.slice(0, max) : t;
  }

  async ingest(input: CreateReportInput): Promise<ErrorReportEntity> {
    const row = this.repo.create({
      deviceName: this.trim(input.device_name, 200),
      appVersion: this.trim(input.app_version, 50),
      errorTitle: this.trim(input.error_title, 200),
      errorMessage: this.trim(input.error_message, 10_000),
      downloadUrl: this.trim(input.download_url, 2_000),
      additionalInfo: this.trim(input.additional_info, 10_000),
      location: this.trim(input.location, 200),
      status: 'open',
    });
    return this.repo.save(row);
  }

  async list(opts: {
    status?: ReportStatus;
    q?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ total: number; items: ErrorReportEntity[] }> {
    const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
    const offset = Math.max(opts.offset ?? 0, 0);

    const qb = this.repo.createQueryBuilder('r');
    if (opts.status) qb.andWhere('r.status = :s', { s: opts.status });
    if (opts.q && opts.q.trim()) {
      const like = `%${opts.q.trim()}%`;
      qb.andWhere(
        '(r.error_title LIKE :q OR r.error_message LIKE :q OR r.download_url LIKE :q OR r.device_name LIKE :q OR r.additional_info LIKE :q)',
        { q: like },
      );
    }
    qb.orderBy('r.created_at', 'DESC').take(limit).skip(offset);

    const [items, total] = await qb.getManyAndCount();
    return { total, items };
  }

  async getById(id: number): Promise<ErrorReportEntity> {
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException(`report ${id} not found`);
    return row;
  }

  async update(
    id: number,
    patch: { status?: ReportStatus; adminNotes?: string | null },
  ): Promise<ErrorReportEntity> {
    const row = await this.getById(id);
    if (patch.status) {
      if (!REPORT_STATUSES.includes(patch.status)) {
        throw new Error(`invalid status "${patch.status}"`);
      }
      row.status = patch.status;
    }
    if (patch.adminNotes !== undefined) {
      row.adminNotes = patch.adminNotes?.trim() || null;
    }
    return this.repo.save(row);
  }

  async remove(id: number): Promise<void> {
    const row = await this.getById(id);
    await this.repo.remove(row);
  }

  async counts(): Promise<Record<ReportStatus | 'total', number>> {
    const rows: { status: string; c: string }[] = await this.repo
      .createQueryBuilder('r')
      .select('r.status', 'status')
      .addSelect('COUNT(*)', 'c')
      .groupBy('r.status')
      .getRawMany();
    const out: Record<string, number> = { total: 0, open: 0, ack: 0, closed: 0 };
    for (const r of rows) {
      const n = Number(r.c) || 0;
      if (r.status in out) out[r.status] = n;
      out.total += n;
    }
    return out as Record<ReportStatus | 'total', number>;
  }
}
