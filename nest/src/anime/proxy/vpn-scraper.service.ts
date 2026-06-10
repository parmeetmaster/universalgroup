import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

interface VpnSource {
  name: string;
  url: string;
}

const SOURCES: VpnSource[] = [
  {
    name: 'epodonios',
    url: 'https://raw.githubusercontent.com/Epodonios/v2ray-configs/main/All_Configs_base64_Sub.txt',
  },
  {
    name: 'mahdibland-aggregator',
    url: 'https://raw.githubusercontent.com/mahdibland/V2RayAggregator/master/sub/sub_merge_base64.txt',
  },
  {
    name: 'aliilapro',
    url: 'https://raw.githubusercontent.com/ALIILAPRO/v2rayNG-Config/main/server.txt',
  },
  {
    name: 'mfuu',
    url: 'https://raw.githubusercontent.com/mfuu/v2ray/master/v2ray',
  },
];

const CONFIG_PREFIX = /^(vmess|vless|trojan|ss):\/\//;

@Injectable()
export class VpnScraperService {
  private readonly logger = new Logger(VpnScraperService.name);

  constructor(private readonly http: HttpService) {}

  async scrapeAll(): Promise<{ uri: string; source: string }[]> {
    const results = await Promise.allSettled(
      SOURCES.map((src) => this.scrapeSource(src)),
    );

    const all: { uri: string; source: string }[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') {
        all.push(...r.value);
      }
    }

    const unique = this.deduplicate(all);
    this.logger.log(
      `Scraped ${all.length} total, ${unique.length} unique VPN configs`,
    );
    return unique;
  }

  private async scrapeSource(
    source: VpnSource,
  ): Promise<{ uri: string; source: string }[]> {
    try {
      const { data } = await firstValueFrom(
        this.http.get<string>(source.url, {
          timeout: 20000,
          responseType: 'text',
        }),
      );

      const text = this.resolveText(data);
      const configs = this.extractConfigs(text, source.name);
      this.logger.log(`[${source.name}] scraped ${configs.length} configs`);
      return configs;
    } catch (err) {
      this.logger.warn(
        `[${source.name}] scrape failed: ${err instanceof Error ? err.message : err}`,
      );
      return [];
    }
  }

  /**
   * Try base64-decoding the raw body; if the decoded text contains no config
   * lines, fall back to treating the body as plain text.
   */
  private resolveText(raw: string): string {
    const decoded = this.tryDecodeBase64(raw);
    if (decoded && CONFIG_PREFIX.test(decoded.trim()) === false) {
      // Decoded but no leading config — still check anywhere in the body.
      if (/(vmess|vless|trojan|ss):\/\//.test(decoded)) return decoded;
    } else if (decoded && /(vmess|vless|trojan|ss):\/\//.test(decoded)) {
      return decoded;
    }
    return raw;
  }

  private tryDecodeBase64(raw: string): string {
    try {
      const cleaned = raw.replace(/\s+/g, '');
      if (!cleaned) return '';
      let b64 = cleaned.replace(/-/g, '+').replace(/_/g, '/');
      const pad = b64.length % 4;
      if (pad) b64 += '='.repeat(4 - pad);
      return Buffer.from(b64, 'base64').toString('utf8');
    } catch {
      return '';
    }
  }

  private extractConfigs(
    text: string,
    source: string,
  ): { uri: string; source: string }[] {
    const out: { uri: string; source: string }[] = [];
    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (CONFIG_PREFIX.test(trimmed)) {
        out.push({ uri: trimmed, source });
      }
    }
    return out;
  }

  private deduplicate(
    configs: { uri: string; source: string }[],
  ): { uri: string; source: string }[] {
    const seen = new Set<string>();
    return configs.filter((c) => {
      if (seen.has(c.uri)) return false;
      seen.add(c.uri);
      return true;
    });
  }
}
