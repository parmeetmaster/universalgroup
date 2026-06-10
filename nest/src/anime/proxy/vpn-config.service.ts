import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VpnConfigEntity,
  VpnConfigStatus,
  VpnProtocol,
} from './entities/vpn-config.entity';
import { VpnScraperService } from './vpn-scraper.service';
import { parseConfigUri } from './vpn-parser';
import { createHash } from 'crypto';

export interface WorkingVpnConfig {
  id: number;
  protocol: VpnProtocol;
  host: string;
  port: number;
  remark: string | null;
  outbound: Record<string, unknown>;
  speed: number | null;
  lastCheckedAt: Date | null;
}

@Injectable()
export class VpnConfigService {
  private readonly logger = new Logger(VpnConfigService.name);

  // Only serve configs confirmed reachable within the last 6 hours so the app
  // never receives stale servers that look "active" but are long dead.
  private static readonly FRESH_WINDOW_MS = 6 * 60 * 60 * 1000;

  constructor(
    @InjectRepository(VpnConfigEntity, 'anime')
    private readonly vpnRepo: Repository<VpnConfigEntity>,
    private readonly scraperService: VpnScraperService,
  ) {}

  async getWorkingConfigs(opts?: {
    protocol?: VpnProtocol;
    limit?: number;
  }): Promise<WorkingVpnConfig[]> {
    const buildQuery = (freshOnly: boolean) => {
      const qb = this.vpnRepo
        .createQueryBuilder('c')
        .where('c.status = :status', { status: VpnConfigStatus.ACTIVE });

      if (freshOnly) {
        const freshCutoff = new Date(
          Date.now() - VpnConfigService.FRESH_WINDOW_MS,
        );
        qb.andWhere('c.lastCheckedAt >= :freshCutoff', { freshCutoff });
      }

      qb.orderBy('c.lastCheckedAt', 'DESC').addOrderBy('c.speed', 'ASC');

      if (opts?.protocol) {
        qb.andWhere('c.protocol = :protocol', { protocol: opts.protocol });
      }

      qb.take(opts?.limit ?? 20);
      return qb;
    };

    let configs = await buildQuery(true).getMany();
    if (configs.length === 0) {
      configs = await buildQuery(false).getMany();
    }

    return configs.map((c) => this.toWorkingConfig(c));
  }

  private toWorkingConfig(c: VpnConfigEntity): WorkingVpnConfig {
    let outbound: Record<string, unknown>;
    try {
      outbound = JSON.parse(c.outboundJson);
    } catch {
      outbound = {};
    }
    return {
      id: c.id,
      protocol: c.protocol,
      host: c.host,
      port: c.port,
      remark: c.remark,
      outbound,
      speed: c.speed,
      lastCheckedAt: c.lastCheckedAt,
    };
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
      this.vpnRepo.count(),
      this.vpnRepo.count({ where: { status: VpnConfigStatus.ACTIVE } }),
      this.vpnRepo.count({ where: { status: VpnConfigStatus.DEAD } }),
      this.vpnRepo.count({ where: { status: VpnConfigStatus.UNCHECKED } }),
    ]);

    const byProtocol: Record<string, number> = {};
    for (const p of Object.values(VpnProtocol)) {
      byProtocol[p] = await this.vpnRepo.count({
        where: { protocol: p, status: VpnConfigStatus.ACTIVE },
      });
    }

    const avgResult = await this.vpnRepo
      .createQueryBuilder('c')
      .select('AVG(c.speed)', 'avg')
      .where('c.status = :status AND c.speed IS NOT NULL', {
        status: VpnConfigStatus.ACTIVE,
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
    const scraped = await this.scraperService.scrapeAll();

    let newCount = 0;

    for (let i = 0; i < scraped.length; i += 100) {
      const batch = scraped.slice(i, i + 100);
      newCount += await this.upsertBatch(batch);
    }

    this.logger.log(
      `VPN scrape done: ${scraped.length} scraped, ${newCount} new`,
    );
    return { scraped: scraped.length, new: newCount };
  }

  private async upsertBatch(
    configs: { uri: string; source: string }[],
  ): Promise<number> {
    let newCount = 0;

    for (const item of configs) {
      const parsed = parseConfigUri(item.uri);
      if (!parsed) continue;

      const uriHash = createHash('sha256').update(parsed.uri).digest('hex');

      const existing = await this.vpnRepo.findOne({ where: { uriHash } });
      if (existing) continue;

      await this.vpnRepo
        .insert({
          uri: parsed.uri,
          uriHash,
          protocol: parsed.protocol,
          host: parsed.host,
          port: parsed.port,
          remark: parsed.remark,
          outboundJson: JSON.stringify(parsed.outbound),
          source: item.source,
          status: VpnConfigStatus.UNCHECKED,
        })
        .catch(() => {
          // Duplicate key — skip
        });
      newCount++;
    }

    return newCount;
  }
}
