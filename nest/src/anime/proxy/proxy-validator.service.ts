import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ProxyEntity, ProxyProtocol, ProxyStatus } from './entities/proxy.entity';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { SocksProxyAgent } = require('socks-proxy-agent');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { HttpsProxyAgent } = require('https-proxy-agent');

// HTTPS-only on purpose: the app browses HTTPS sites, which require the proxy
// to support CONNECT tunneling. A proxy that only forwards plain HTTP GET would
// pass an http:// test but fail in the app, so we never mark such proxies alive.
const TEST_URLS = [
  'https://www.gstatic.com/generate_204',
  'https://api.ipify.org?format=json',
  'https://httpbin.org/ip',
];

const VALIDATE_TIMEOUT = 10000;
const BATCH_SIZE = 50;
const MAX_DEAD_FAIL_COUNT = 10;

@Injectable()
export class ProxyValidatorService {
  private readonly logger = new Logger(ProxyValidatorService.name);

  constructor(
    @InjectRepository(ProxyEntity, 'anime')
    private readonly proxyRepo: Repository<ProxyEntity>,
  ) {}

  /**
   * Discovery pass: tests the oldest-checked UNCHECKED/DEAD/ACTIVE proxies to
   * find new alive ones and replenish the pool. Runs less frequently.
   */
  async validateAll(): Promise<{ tested: number; alive: number; dead: number }> {
    const proxies = await this.proxyRepo
      .createQueryBuilder('p')
      .where('p.status IN (:...statuses)', {
        statuses: [ProxyStatus.UNCHECKED, ProxyStatus.ACTIVE, ProxyStatus.DEAD],
      })
      .orderBy('p.lastCheckedAt IS NULL', 'DESC')
      .addOrderBy('p.lastCheckedAt', 'ASC')
      .take(500)
      .getMany();

    return this.runValidation(proxies, 'discovery');
  }

  /**
   * Hot-pool pass: re-tests proxies currently marked ACTIVE so the served pool
   * stays genuinely alive. The active set is small, so this runs frequently
   * (every few minutes) — this is what keeps the app's VPN reliable: a proxy
   * served to the app was confirmed alive minutes ago, not hours/days.
   */
  async revalidateActive(): Promise<{ tested: number; alive: number; dead: number }> {
    const proxies = await this.proxyRepo
      .createQueryBuilder('p')
      .where('p.status = :status', { status: ProxyStatus.ACTIVE })
      .orderBy('p.lastCheckedAt', 'ASC')
      .take(500)
      .getMany();

    return this.runValidation(proxies, 'hot-pool');
  }

  private async runValidation(
    proxies: ProxyEntity[],
    label: string,
  ): Promise<{ tested: number; alive: number; dead: number }> {
    if (proxies.length === 0) {
      this.logger.log(`No proxies to validate (${label})`);
      return { tested: 0, alive: 0, dead: 0 };
    }

    this.logger.log(`Validating ${proxies.length} proxies (${label})...`);

    let alive = 0;
    let dead = 0;

    for (let i = 0; i < proxies.length; i += BATCH_SIZE) {
      const batch = proxies.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((p) => this.testProxy(p)),
      );

      const updates: ProxyEntity[] = [];

      for (let j = 0; j < batch.length; j++) {
        const proxy = batch[j];
        const result = results[j];

        if (result.status === 'fulfilled' && result.value.ok) {
          proxy.status = ProxyStatus.ACTIVE;
          proxy.speed = result.value.speed;
          proxy.failCount = 0;
          proxy.successCount += 1;
          proxy.lastCheckedAt = new Date();
          alive++;
        } else {
          proxy.failCount += 1;
          proxy.lastCheckedAt = new Date();
          if (proxy.failCount >= 3) {
            proxy.status = ProxyStatus.DEAD;
          }
          dead++;
        }

        updates.push(proxy);
      }

      await this.proxyRepo.save(updates);
    }

    this.logger.log(`Validation done (${label}): ${alive} alive, ${dead} dead out of ${proxies.length}`);
    return { tested: proxies.length, alive, dead };
  }

  async cleanup(): Promise<number> {
    const deleted = await this.proxyRepo
      .createQueryBuilder()
      .delete()
      .where('status = :status AND failCount >= :maxFails', {
        status: ProxyStatus.DEAD,
        maxFails: MAX_DEAD_FAIL_COUNT,
      })
      .execute();

    this.logger.log(`Cleaned up ${deleted.affected ?? 0} dead proxies`);
    return deleted.affected ?? 0;
  }

  private testProxy(
    proxy: ProxyEntity,
  ): Promise<{ ok: boolean; speed: number }> {
    return Promise.race([
      this.doTestProxy(proxy),
      new Promise<{ ok: false; speed: 0 }>((resolve) =>
        setTimeout(() => resolve({ ok: false, speed: 0 }), VALIDATE_TIMEOUT + 2000),
      ),
    ]);
  }

  private async doTestProxy(
    proxy: ProxyEntity,
  ): Promise<{ ok: boolean; speed: number }> {
    const testUrl = TEST_URLS[Math.floor(Math.random() * TEST_URLS.length)];

    const start = Date.now();
    try {
      const agent = this.createAgent(proxy);

      await axios.get(testUrl, {
        timeout: VALIDATE_TIMEOUT,
        httpAgent: agent,
        httpsAgent: agent,
        validateStatus: (s) => s >= 200 && s < 400,
        maxRedirects: 2,
      });

      const speed = Date.now() - start;
      return { ok: true, speed };
    } catch {
      return { ok: false, speed: 0 };
    }
  }

  private createAgent(proxy: ProxyEntity) {
    if (
      proxy.protocol === ProxyProtocol.SOCKS4 ||
      proxy.protocol === ProxyProtocol.SOCKS5
    ) {
      const type = proxy.protocol === ProxyProtocol.SOCKS4 ? 4 : 5;
      return new SocksProxyAgent(`socks${type}://${proxy.ip}:${proxy.port}`);
    }

    return new HttpsProxyAgent(`http://${proxy.ip}:${proxy.port}`);
  }
}
