import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

export interface ChapterCandidate {
  chapterId: string; // Asura latest_chapters[].id (stable dedup key)
  seriesSlug: string;
  seriesTitle: string;
  chapterNumber: string; // kept as string — Asura numbers can be floats (10.5)
  coverUrl?: string;
  chapterUrl: string; // user-facing deep link opened in the app
}

const DEFAULT_API_BASE = 'https://api.asurascans.com';
const DEFAULT_SITE_BASE = 'https://asurascans.com';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

/**
 * Reads Asura Scans' public JSON API for the most-recently-updated series.
 * The API (api.asurascans.com) is not Cloudflare-challenged, so plain axios
 * works. Domain has changed ~5 times historically, so both bases are
 * configurable via env (ASURA_API_BASE / ASURA_SITE_BASE).
 */
@Injectable()
export class AsuraScraperService {
  private readonly logger = new Logger(AsuraScraperService.name);

  constructor(
    private readonly http: HttpService,
    private readonly config: ConfigService,
  ) {}

  private get apiBase(): string {
    return this.config
      .get<string>('ASURA_API_BASE', DEFAULT_API_BASE)
      .replace(/\/+$/, '');
  }

  private get siteBase(): string {
    return this.config
      .get<string>('ASURA_SITE_BASE', DEFAULT_SITE_BASE)
      .replace(/\/+$/, '');
  }

  async fetchLatest(limit = 30, retries = 2): Promise<ChapterCandidate[]> {
    const url = `${this.apiBase}/api/series?sort=latest&order=desc&offset=0&limit=${limit}`;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const res = await firstValueFrom(
          this.http.get(url, {
            headers: {
              'User-Agent': USER_AGENT,
              Referer: `${this.siteBase}/`,
              Accept: 'application/json',
            },
            timeout: 12000,
            maxRedirects: 5,
          }),
        );

        const contentType = String(res.headers?.['content-type'] ?? '');
        if (!contentType.includes('application/json') || typeof res.data !== 'object') {
          this.logger.warn(
            `Asura returned non-JSON (Cloudflare challenge?) content-type=${contentType || 'none'}`,
          );
          return [];
        }

        const finalUrl = String(
          (res.request as { res?: { responseUrl?: string } })?.res?.responseUrl ?? url,
        );
        if (!finalUrl.startsWith(this.apiBase)) {
          this.logger.warn(`Asura API redirected to ${finalUrl} — domain may have changed`);
        }

        return this.parse(res.data);
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`Asura fetch attempt ${attempt + 1} failed: ${lastError.message}`);
        if (attempt < retries) {
          await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
        }
      }
    }

    this.logger.error(
      `Asura fetch failed after ${retries + 1} attempts: ${lastError?.message ?? 'unknown'}`,
    );
    return [];
  }

  private parse(body: unknown): ChapterCandidate[] {
    const data = (body as { data?: unknown })?.data;
    if (!Array.isArray(data)) {
      this.logger.warn('Asura response has no data[] array — API shape may have changed');
      return [];
    }

    const out: ChapterCandidate[] = [];
    for (const series of data as Array<Record<string, unknown>>) {
      const chapters = series?.latest_chapters;
      const ch = Array.isArray(chapters)
        ? (chapters[0] as Record<string, unknown> | undefined)
        : undefined;
      const publicUrl = series?.public_url;

      if (
        !ch ||
        ch.id == null ||
        ch.number == null ||
        typeof publicUrl !== 'string' ||
        !publicUrl
      ) {
        continue; // newly-added series with no chapters yet, or malformed
      }

      // Skip premium/locked chapters — no row written, so when the chapter
      // later goes free it is claimed + notified exactly once.
      if (ch.is_premium === true || ch.is_premium === 1 || ch.is_premium === 'true') {
        continue;
      }

      const chapterNumber = String(ch.number);
      out.push({
        chapterId: String(ch.id),
        seriesSlug: typeof series.slug === 'string' ? series.slug : '',
        seriesTitle: typeof series.title === 'string' ? series.title : 'New chapter',
        chapterNumber,
        coverUrl: typeof series.cover === 'string' ? series.cover : undefined,
        chapterUrl: `${this.siteBase}${publicUrl}/chapter/${chapterNumber}`,
      });
    }

    this.logger.debug(`Parsed ${out.length} free chapter candidate(s) from Asura`);
    return out;
  }
}
