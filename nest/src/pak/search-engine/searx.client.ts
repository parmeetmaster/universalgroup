import { Injectable, Logger } from '@nestjs/common';

export interface SearxResult {
  url: string;
  title: string;
  content?: string;
  engine?: string;
  engines?: string[];
  score?: number;
  thumbnail?: string;
  publishedDate?: string | null;
}

@Injectable()
export class SearxClient {
  private readonly logger = new Logger(SearxClient.name);
  private readonly base =
    process.env.SEARX_URL ?? 'http://127.0.0.1:7777/search';

  async search(
    query: string,
    engines: string[] = ['dailymotion', 'youtube'],
    limit = 10,
  ): Promise<SearxResult[]> {
    const url = new URL(this.base);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('engines', engines.join(','));

    try {
      const res = await fetch(url.toString(), {
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) {
        this.logger.warn(`searx ${query} -> ${res.status}`);
        return [];
      }
      const body = (await res.json()) as { results?: SearxResult[] };
      return (body.results ?? []).slice(0, limit);
    } catch (err) {
      this.logger.warn(`searx ${query} failed: ${(err as Error).message}`);
      return [];
    }
  }
}
