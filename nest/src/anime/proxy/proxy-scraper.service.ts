import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ProxyProtocol } from './entities/proxy.entity';

export interface ScrapedProxy {
  ip: string;
  port: number;
  protocol: ProxyProtocol;
  source: string;
}

interface ProxySource {
  name: string;
  url: string;
  protocol: ProxyProtocol;
  parser: 'lines' | 'json-proxyscrape';
}

const SOURCES: ProxySource[] = [
  {
    name: 'proxyscrape-http',
    url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=10000&country=all&ssl=all&anonymity=all',
    protocol: ProxyProtocol.HTTP,
    parser: 'lines',
  },
  {
    name: 'proxyscrape-socks4',
    url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks4&timeout=10000&country=all',
    protocol: ProxyProtocol.SOCKS4,
    parser: 'lines',
  },
  {
    name: 'proxyscrape-socks5',
    url: 'https://api.proxyscrape.com/v2/?request=displayproxies&protocol=socks5&timeout=10000&country=all',
    protocol: ProxyProtocol.SOCKS5,
    parser: 'lines',
  },
  {
    name: 'thespeedx-http',
    url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/http.txt',
    protocol: ProxyProtocol.HTTP,
    parser: 'lines',
  },
  {
    name: 'thespeedx-socks4',
    url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks4.txt',
    protocol: ProxyProtocol.SOCKS4,
    parser: 'lines',
  },
  {
    name: 'thespeedx-socks5',
    url: 'https://raw.githubusercontent.com/TheSpeedX/PROXY-List/master/socks5.txt',
    protocol: ProxyProtocol.SOCKS5,
    parser: 'lines',
  },
  {
    name: 'monosans-http',
    url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/http.txt',
    protocol: ProxyProtocol.HTTP,
    parser: 'lines',
  },
  {
    name: 'monosans-socks4',
    url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks4.txt',
    protocol: ProxyProtocol.SOCKS4,
    parser: 'lines',
  },
  {
    name: 'monosans-socks5',
    url: 'https://raw.githubusercontent.com/monosans/proxy-list/main/proxies/socks5.txt',
    protocol: ProxyProtocol.SOCKS5,
    parser: 'lines',
  },
  {
    name: 'hookzof-socks5',
    url: 'https://raw.githubusercontent.com/hookzof/socks5_list/master/proxy.txt',
    protocol: ProxyProtocol.SOCKS5,
    parser: 'lines',
  },
  {
    name: 'proxy-list-download-http',
    url: 'https://www.proxy-list.download/api/v1/get?type=http',
    protocol: ProxyProtocol.HTTP,
    parser: 'lines',
  },
  {
    name: 'proxy-list-download-https',
    url: 'https://www.proxy-list.download/api/v1/get?type=https',
    protocol: ProxyProtocol.HTTPS,
    parser: 'lines',
  },
];

@Injectable()
export class ProxyScraperService {
  private readonly logger = new Logger(ProxyScraperService.name);

  constructor(private readonly http: HttpService) {}

  async scrapeAll(): Promise<ScrapedProxy[]> {
    const results = await Promise.allSettled(
      SOURCES.map((src) => this.scrapeSource(src)),
    );

    const allProxies: ScrapedProxy[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        allProxies.push(...r.value);
      }
    }

    const unique = this.deduplicate(allProxies);
    this.logger.log(`Scraped ${allProxies.length} total, ${unique.length} unique proxies`);
    return unique;
  }

  private async scrapeSource(source: ProxySource): Promise<ScrapedProxy[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<string>(source.url, {
          timeout: 15000,
          responseType: 'text',
        }),
      );

      const proxies = this.parseLines(data, source.protocol, source.name);
      this.logger.log(`[${source.name}] scraped ${proxies.length} proxies`);
      return proxies;
    } catch (err) {
      this.logger.warn(
        `[${source.name}] scrape failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  private parseLines(
    text: string,
    protocol: ProxyProtocol,
    source: string,
  ): ScrapedProxy[] {
    const proxies: ScrapedProxy[] = [];
    const lines = text.split(/\r?\n/);

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const match = trimmed.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}):(\d{2,5})$/);
      if (!match) continue;

      const ip = match[1];
      const port = parseInt(match[2], 10);

      if (port < 1 || port > 65535) continue;
      if (!this.isValidIp(ip)) continue;

      proxies.push({ ip, port, protocol, source });
    }

    return proxies;
  }

  private isValidIp(ip: string): boolean {
    const parts = ip.split('.');
    return parts.every((p) => {
      const n = parseInt(p, 10);
      return n >= 0 && n <= 255;
    });
  }

  private deduplicate(proxies: ScrapedProxy[]): ScrapedProxy[] {
    const seen = new Set<string>();
    return proxies.filter((p) => {
      const key = `${p.ip}:${p.port}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
