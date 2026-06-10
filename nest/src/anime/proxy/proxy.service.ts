import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  ProxyEntity,
  ProxyProtocol,
  ProxyStatus,
} from './entities/proxy.entity';
import { ProxyScraperService, ScrapedProxy } from './proxy-scraper.service';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);

  constructor(
    @InjectRepository(ProxyEntity, 'anime')
    private readonly proxyRepo: Repository<ProxyEntity>,
    private readonly scraperService: ProxyScraperService,
  ) {}

  // Only serve proxies confirmed alive within one full validation cycle.
  // The validator re-checks 500 oldest proxies every 30 min; with the current
  // pool size a full sweep takes a few hours, so a proxy marked ACTIVE days ago
  // is very likely dead by now. Serving stale-actives is the main reason the
  // app's VPN "turns on but doesn't work". 6h keeps the freshest actives only.
  private static readonly FRESH_WINDOW_MS = 6 * 60 * 60 * 1000;

  async getWorkingProxies(opts?: {
    protocol?: ProxyProtocol;
    country?: string;
    limit?: number;
    maxSpeed?: number;
  }): Promise<ProxyEntity[]> {
    const buildQuery = (freshOnly: boolean) => {
      const qb = this.proxyRepo
        .createQueryBuilder('p')
        .where('p.status = :status', { status: ProxyStatus.ACTIVE });

      if (freshOnly) {
        const freshCutoff = new Date(Date.now() - ProxyService.FRESH_WINDOW_MS);
        qb.andWhere('p.lastCheckedAt >= :freshCutoff', { freshCutoff });
      }

      // Most recently confirmed-alive first, fastest among those next.
      qb.orderBy('p.lastCheckedAt', 'DESC').addOrderBy('p.speed', 'ASC');

      if (opts?.protocol) {
        qb.andWhere('p.protocol = :protocol', { protocol: opts.protocol });
      }
      if (opts?.country) {
        qb.andWhere('p.country = :country', {
          country: opts.country.toUpperCase(),
        });
      }
      if (opts?.maxSpeed) {
        qb.andWhere('p.speed <= :maxSpeed', { maxSpeed: opts.maxSpeed });
      }

      qb.take(opts?.limit ?? 50);
      return qb;
    };

    // Prefer freshly-validated proxies; fall back to all actives (by recency)
    // only if the fresh window is empty, so the endpoint never starves.
    const fresh = await buildQuery(true).getMany();
    if (fresh.length > 0) return fresh;
    return buildQuery(false).getMany();
  }

  async getStats(): Promise<{
    total: number;
    active: number;
    dead: number;
    unchecked: number;
    byProtocol: Record<string, number>;
    avgSpeed: number | null;
  }> {
    const [total, active, dead, unchecked] = await Promise.all([
      this.proxyRepo.count(),
      this.proxyRepo.count({ where: { status: ProxyStatus.ACTIVE } }),
      this.proxyRepo.count({ where: { status: ProxyStatus.DEAD } }),
      this.proxyRepo.count({ where: { status: ProxyStatus.UNCHECKED } }),
    ]);

    const byProtocol: Record<string, number> = {};
    for (const p of Object.values(ProxyProtocol)) {
      byProtocol[p] = await this.proxyRepo.count({
        where: { protocol: p, status: ProxyStatus.ACTIVE },
      });
    }

    const avgResult = await this.proxyRepo
      .createQueryBuilder('p')
      .select('AVG(p.speed)', 'avg')
      .where('p.status = :status AND p.speed IS NOT NULL', {
        status: ProxyStatus.ACTIVE,
      })
      .getRawOne();

    return {
      total,
      active,
      dead,
      unchecked,
      byProtocol,
      avgSpeed: avgResult?.avg ? Math.round(parseFloat(avgResult.avg)) : null,
    };
  }

  async scrapeAndSave(): Promise<{ scraped: number; new: number }> {
    const proxies = await this.scraperService.scrapeAll();

    let newCount = 0;

    // Batch upsert in chunks of 100
    for (let i = 0; i < proxies.length; i += 100) {
      const batch = proxies.slice(i, i + 100);
      const result = await this.upsertBatch(batch);
      newCount += result;
    }

    this.logger.log(`Scrape done: ${proxies.length} scraped, ${newCount} new`);
    return { scraped: proxies.length, new: newCount };
  }

  private async upsertBatch(proxies: ScrapedProxy[]): Promise<number> {
    let newCount = 0;

    for (const p of proxies) {
      const existing = await this.proxyRepo.findOne({
        where: { ip: p.ip, port: p.port },
      });

      if (!existing) {
        await this.proxyRepo
          .insert({
            ip: p.ip,
            port: p.port,
            protocol: p.protocol,
            source: p.source,
            status: ProxyStatus.UNCHECKED,
          })
          .catch(() => {
            // Duplicate key — skip
          });
        newCount++;
      } else if (existing.status === ProxyStatus.DEAD && existing.failCount < 5) {
        // Give dead proxies another chance if they show up again
        existing.status = ProxyStatus.UNCHECKED;
        existing.failCount = 0;
        existing.source = p.source;
        await this.proxyRepo.save(existing);
      }
    }

    return newCount;
  }
}
