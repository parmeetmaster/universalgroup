import {
  BadGatewayException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Drama } from '../entities/drama.entity';
import { Season } from '../entities/season.entity';
import { Episode } from '../entities/episode.entity';
import { EpisodeVideo } from '../entities/episode-video.entity';
import { PakDramaximaDriver } from '../parse/drivers/dramaxima.driver';
import { SearxClient, SearxResult } from '../search-engine/searx.client';

export interface ResolvedServer {
  label: string;
  url: string;
  format: 'embed' | 'mp4';
}

const MIN_EPISODE_SECONDS = 20 * 60;

const INVIDIOUS_MIRRORS = [
  'https://iv.melmac.space',
  'https://invidious.f5.si',
  'https://invidious.projectsegfau.lt',
  'https://invidious.nerdvpn.de',
  'https://invidious.einfachzocken.eu',
];

@Injectable()
export class PakEpisodesService {
  private readonly logger = new Logger(PakEpisodesService.name);

  constructor(
    @InjectRepository(Drama, 'pak') private readonly dramaRepo: Repository<Drama>,
    @InjectRepository(Season, 'pak') private readonly seasonRepo: Repository<Season>,
    @InjectRepository(Episode, 'pak') private readonly episodeRepo: Repository<Episode>,
    @InjectRepository(EpisodeVideo, 'pak') private readonly videoRepo: Repository<EpisodeVideo>,
    private readonly dramaxima: PakDramaximaDriver,
    private readonly searx: SearxClient,
  ) {}

  async resolveSources(id: string): Promise<{ servers: ResolvedServer[] }> {
    const ep = await this.episodeRepo.findOne({
      where: { id },
      relations: { drama: true },
    });
    if (!ep) throw new NotFoundException('Episode not found');

    const [dramaxima, dailymotions, youtubes] = await Promise.all([
      this.resolveDramaxima(ep),
      this.findTopOnPlatform(ep, 'dailymotion', 2),
      this.findTopOnPlatform(ep, 'youtube', 3),
    ]);

    const servers: ResolvedServer[] = [];
    if (dramaxima) servers.push(dramaxima);

    dailymotions.forEach((s, i) => {
      servers.push({ ...s, label: i === 0 ? 'Dailymotion' : `Dailymotion ${i + 1}` });
    });

    let ytIndex = 0;
    for (const s of youtubes) {
      const ytId = s.url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/)?.[1];
      if (!ytId) continue;
      const mirrored = await this.pickWorkingMirrorFor(ytId);
      if (!mirrored) continue;
      servers.push({
        ...s,
        url: mirrored,
        label: ytIndex === 0 ? 'YouTube' : `YouTube ${ytIndex + 1}`,
      });
      ytIndex++;
    }

    if (servers.length === 0) {
      throw new BadGatewayException('No playable source found for this episode');
    }
    return { servers };
  }

  private async findTopOnPlatform(
    ep: Episode,
    engine: 'dailymotion' | 'youtube',
    limit: number,
  ): Promise<ResolvedServer[]> {
    const drama = ep.drama;
    if (!drama) return [];

    const queries: string[] = [`${drama.title} Episode ${ep.number}`];
    if (ep.number < 10) {
      queries.unshift(`${drama.title} Episode 0${ep.number}`);
    }

    const hostMatch =
      engine === 'youtube'
        ? /(^|\.)(youtube\.com|youtu\.be)$/i
        : /(^|\.)dailymotion\.com$/i;

    const seen = new Set<string>();
    const hits: SearxResult[] = [];
    for (const q of queries) {
      for (const h of await this.searx.search(q, [engine, 'google'], 20)) {
        if (seen.has(h.url)) continue;
        seen.add(h.url);
        try {
          const host = new URL(h.url).hostname;
          if (!hostMatch.test(host)) continue;
        } catch {
          continue;
        }
        hits.push(h);
      }
    }

    const scored = await this.scoreHits(hits, drama.title, ep.number);

    const out: ResolvedServer[] = [];
    const embedSeen = new Set<string>();
    for (const { server } of scored) {
      if (embedSeen.has(server.url)) continue;
      embedSeen.add(server.url);
      out.push(server);
      if (out.length >= limit) break;
    }
    return out;
  }

  private async resolveDramaxima(ep: Episode): Promise<ResolvedServer | null> {
    if (!ep.sourceUrl || !ep.sourceUrl.includes('dramaxima.com')) return null;
    try {
      const directUrl = await this.dramaxima.extractDirectVideoUrl(ep.sourceUrl);
      if (directUrl) {
        return { label: 'No Ad Server', url: directUrl, format: 'mp4' };
      }
      const iframe = await this.dramaxima.extractIframe(ep.sourceUrl);
      if (iframe) {
        return { label: 'No Ad Server', url: iframe, format: 'embed' };
      }
    } catch (err) {
      this.logger.warn(
        `dramaxima resolve ${ep.sourceUrl} failed: ${(err as Error).message}`,
      );
    }
    return null;
  }

  private async scoreHits(
    hits: SearxResult[],
    dramaTitle: string,
    episodeNum: number,
  ): Promise<Array<{ server: ResolvedServer; score: number }>> {
    const firstWord = dramaTitle.split(/\s+/)[0].toLowerCase();
    const epRx = new RegExp(
      `\\b(episode|ep|epi)[\\s._-]*0*${episodeNum}\\b`,
      'i',
    );
    const badWords = /(trailer|teaser|promo|review|reaction|recap|ost|song|behind|interview)/i;

    const out: Array<{ server: ResolvedServer; score: number }> = [];

    for (const h of hits) {
      const titleLower = h.title?.toLowerCase() ?? '';
      if (!titleLower.includes(firstWord)) continue;
      if (!epRx.test(h.title ?? '')) continue;
      if (badWords.test(h.title ?? '')) continue;

      const embed = this.toEmbedServer(h.url);
      if (!embed) continue;

      if (h.url.includes('dailymotion.com')) {
        const duration = await this.dailymotionDuration(h.url);
        if (duration !== null && duration < MIN_EPISODE_SECONDS) continue;
      }

      let score = h.score ?? 1;
      if (h.engine === 'dailymotion' || h.engines?.includes('dailymotion')) {
        score += 50;
      }
      if (/\bfull\s+episode\b/i.test(h.title ?? '')) score += 5;
      out.push({ server: embed, score });
    }

    out.sort((a, b) => b.score - a.score);
    return out;
  }

  private async pickWorkingMirrorFor(videoId: string): Promise<string | null> {
    for (const base of INVIDIOUS_MIRRORS) {
      if (await this.mirrorCanServe(base, videoId)) {
        return `${base}/embed/${videoId}`;
      }
    }
    return null;
  }

  private async mirrorCanServe(base: string, videoId: string): Promise<boolean> {
    try {
      const res = await fetch(
        `${base}/api/v1/videos/${videoId}?fields=formatStreams,hlsUrl,error`,
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          },
          signal: AbortSignal.timeout(5000),
        },
      );
      if (!res.ok) return false;
      const body = (await res.json().catch(() => null)) as {
        formatStreams?: unknown[];
        hlsUrl?: string | null;
        error?: string;
      } | null;
      if (!body || body.error) return false;
      const hasStreams = Array.isArray(body.formatStreams) && body.formatStreams.length > 0;
      const hasHls = typeof body.hlsUrl === 'string' && body.hlsUrl.length > 0;
      return hasStreams || hasHls;
    } catch {
      return false;
    }
  }

  private async dailymotionDuration(url: string): Promise<number | null> {
    const id = url.match(/\/video\/([a-z0-9]+)/i)?.[1];
    if (!id) return null;
    try {
      const res = await fetch(
        `https://api.dailymotion.com/video/${id}?fields=duration`,
        { signal: AbortSignal.timeout(8000) },
      );
      if (!res.ok) return null;
      const body = (await res.json()) as { duration?: number };
      return typeof body.duration === 'number' ? body.duration : null;
    } catch {
      return null;
    }
  }

  private toEmbedServer(url: string): ResolvedServer | null {
    const dm = url.match(/dailymotion\.com\/(?:video|embed\/video)\/([a-z0-9]+)/i);
    if (dm) {
      return {
        label: 'Dailymotion',
        url: `https://geo.dailymotion.com/player.html?video=${dm[1]}`,
        format: 'embed',
      };
    }
    const ytId =
      url.match(/youtube\.com\/watch\?(?:.*&)?v=([a-zA-Z0-9_-]{11})/)?.[1] ??
      url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/)?.[1] ??
      null;
    if (ytId) {
      return {
        label: 'YouTube',
        url: `https://www.youtube.com/embed/${ytId}`,
        format: 'embed',
      };
    }
    return null;
  }

  async listSeasons(slug: string): Promise<Season[]> {
    const drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) throw new NotFoundException('Drama not found');
    return this.seasonRepo.find({
      where: { dramaId: drama.id },
      order: { number: 'ASC' },
    });
  }

  async listEpisodes(
    slug: string,
    seasonNumber: number,
  ): Promise<Array<Episode & { playUrl: string | null }>> {
    const drama = await this.dramaRepo.findOne({ where: { slug } });
    if (!drama) throw new NotFoundException('Drama not found');
    const season = await this.seasonRepo.findOne({
      where: { dramaId: drama.id, number: seasonNumber },
    });
    if (!season) throw new NotFoundException('Season not found');
    const eps = await this.episodeRepo.find({
      where: { seasonId: season.id, isPublished: 1 },
      order: { number: 'ASC' },
      relations: { videos: true },
    });
    return eps.map((ep) => {
      const active = (ep.videos ?? [])
        .filter((v) => v.isActive)
        .sort((a, b) => a.priority - b.priority);
      return Object.assign(ep, { playUrl: active[0]?.url ?? null });
    });
  }

  async findById(id: string): Promise<Episode & { playUrl: string | null }> {
    const ep = await this.episodeRepo.findOne({
      where: { id, isPublished: 1 },
      relations: { drama: true, season: true, videos: true },
    });
    if (!ep) throw new NotFoundException('Episode not found');
    const active = (ep.videos ?? [])
      .filter((v) => v.isActive)
      .sort((a, b) => a.priority - b.priority);
    const playUrl = active[0]?.url ?? null;
    return Object.assign(ep, { playUrl });
  }

  async incrementPlayCount(videoId: string): Promise<void> {
    await this.videoRepo.increment({ id: videoId }, 'playCount', 1);
  }
}
