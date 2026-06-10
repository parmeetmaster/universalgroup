import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  VpnConfigEntity,
  VpnConfigStatus,
} from './entities/vpn-config.entity';
import { XrayTesterService } from './xray-tester.service';

// Configs are tested in chunks; each chunk is handed to a forked worker that
// runs the actual xray tunnel tests off the main event loop and saves results
// per chunk so progress is durable.
const CHUNK_SIZE = 100;

@Injectable()
export class VpnValidatorService {
  private readonly logger = new Logger(VpnValidatorService.name);

  constructor(
    @InjectRepository(VpnConfigEntity, 'anime')
    private readonly vpnRepo: Repository<VpnConfigEntity>,
    private readonly xray: XrayTesterService,
  ) {}

  /**
   * Discovery pass: tests the oldest-checked UNCHECKED/ACTIVE/DEAD configs to
   * find newly-working servers and replenish the served pool.
   */
  async validateAll(): Promise<{ tested: number; alive: number; dead: number }> {
    const configs = await this.vpnRepo
      .createQueryBuilder('c')
      .where('c.status IN (:...statuses)', {
        statuses: [
          VpnConfigStatus.UNCHECKED,
          VpnConfigStatus.ACTIVE,
          VpnConfigStatus.DEAD,
        ],
      })
      .orderBy('c.lastCheckedAt IS NULL', 'DESC')
      .addOrderBy('c.lastCheckedAt', 'ASC')
      .take(400)
      .getMany();

    return this.runValidation(configs, 'discovery');
  }

  /**
   * Hot-pool pass: re-tests configs currently marked ACTIVE so the served set
   * stays genuinely working. Runs frequently.
   */
  async revalidateActive(): Promise<{ tested: number; alive: number; dead: number }> {
    const configs = await this.vpnRepo
      .createQueryBuilder('c')
      .where('c.status = :status', { status: VpnConfigStatus.ACTIVE })
      .orderBy('c.lastCheckedAt', 'ASC')
      .take(400)
      .getMany();

    return this.runValidation(configs, 'hot-pool');
  }

  private async runValidation(
    configs: VpnConfigEntity[],
    label: string,
  ): Promise<{ tested: number; alive: number; dead: number }> {
    if (configs.length === 0) {
      this.logger.log(`No VPN configs to validate (${label})`);
      return { tested: 0, alive: 0, dead: 0 };
    }

    this.logger.log(`Validating ${configs.length} VPN configs (${label})...`);

    let alive = 0;
    let dead = 0;

    // Test in chunks via the forked worker (its own event loop = accurate
    // timing), saving DB updates after each chunk.
    for (let i = 0; i < configs.length; i += CHUNK_SIZE) {
      const chunk = configs.slice(i, i + CHUNK_SIZE);

      const payload = chunk
        .map((c) => {
          try {
            return {
              id: c.id,
              host: c.host,
              port: c.port,
              outbound: JSON.parse(c.outboundJson) as Record<string, unknown>,
            };
          } catch {
            return null;
          }
        })
        .filter((x): x is NonNullable<typeof x> => x !== null);

      const results = await this.xray.testBatch(payload);
      const resultById = new Map(results.map((r) => [r.id, r]));

      const updates: VpnConfigEntity[] = [];
      for (const config of chunk) {
        const r = resultById.get(config.id);
        if (r?.ok) {
          config.status = VpnConfigStatus.ACTIVE;
          config.speed = r.speed;
          config.failCount = 0;
          config.successCount += 1;
          config.lastCheckedAt = new Date();
          alive++;
        } else {
          config.failCount += 1;
          config.lastCheckedAt = new Date();
          if (config.failCount >= 3) {
            config.status = VpnConfigStatus.DEAD;
          }
          dead++;
        }
        updates.push(config);
      }

      if (updates.length > 0) {
        await this.vpnRepo.save(updates);
      }
    }

    this.logger.log(
      `VPN validation done (${label}): ${alive} alive, ${dead} dead out of ${configs.length}`,
    );
    return { tested: configs.length, alive, dead };
  }
}
