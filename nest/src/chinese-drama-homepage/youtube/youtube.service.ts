import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { runYtDlp } from '../../aviation/utils/ytdlp.util';
import {
  CaptionDto,
  QualityLinkDto,
  YouTubeExtractResponseDto,
} from './youtube.dto';

interface CachedExtraction {
  data: YouTubeExtractResponseDto;
  expiresAt: number;
}

interface YtDlpSubtitleEntry {
  ext: string;
  url: string;
}

interface YtDlpJsonDump {
  title?: string;
  fulltitle?: string;
  thumbnail?: string;
  duration?: number;
  subtitles?: Record<string, YtDlpSubtitleEntry[]>;
  automatic_captions?: Record<string, YtDlpSubtitleEntry[]>;
}

const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes

const QUALITY_FORMATS: { quality: string; format: string }[] = [
  { quality: '1080p', format: 'b[height<=1080][ext=mp4]' },
  { quality: '720p', format: '22/b[height<=720][ext=mp4]' },
  { quality: '480p', format: 'b[height<=480][ext=mp4]' },
  { quality: '360p', format: '18/b[height<=360][ext=mp4]' },
];

@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly cache = new Map<string, CachedExtraction>();

  async extract(url: string): Promise<YouTubeExtractResponseDto> {
    const cached = this.cache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      this.logger.log(`Cache hit for ${url}`);
      return cached.data;
    }

    // Step 1: Get metadata + subtitle info via --dump-json
    let metadata: YtDlpJsonDump;
    try {
      const json = await runYtDlp(['--dump-json', '--no-download', url]);
      metadata = JSON.parse(json) as YtDlpJsonDump;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Unknown yt-dlp error';
      this.logger.error(`Failed to fetch metadata for ${url}: ${message}`);
      throw new BadRequestException(`Failed to extract video info: ${message}`);
    }

    const title = metadata.title || metadata.fulltitle || '';
    const thumbnail =
      metadata.thumbnail ||
      `https://i.ytimg.com/vi/${this.extractVideoId(url)}/hqdefault.jpg`;
    const duration = metadata.duration || 0;

    // Step 2: Extract streaming URLs for each quality in parallel
    const qualityResults = await Promise.allSettled(
      QUALITY_FORMATS.map(async ({ quality, format }) => {
        try {
          const output = await runYtDlp(
            ['-f', format, '--get-url', url],
            45000,
          );
          const streamUrl = output.split('\n')[0].trim();
          if (!streamUrl) return null;
          return { quality, url: streamUrl } as QualityLinkDto;
        } catch (err) {
          this.logger.warn(
            `Quality ${quality} extraction failed: ${err instanceof Error ? err.message : err}`,
          );
          return null;
        }
      }),
    );

    const qualities: QualityLinkDto[] = qualityResults
      .filter(
        (r): r is PromiseFulfilledResult<QualityLinkDto | null> =>
          r.status === 'fulfilled',
      )
      .map((r) => r.value)
      .filter((v): v is QualityLinkDto => v !== null);

    if (qualities.length === 0) {
      throw new BadRequestException(
        'Could not extract any streaming URLs for this video',
      );
    }

    // Step 3: Extract captions
    const captions = this.extractCaptions(metadata);

    const data: YouTubeExtractResponseDto = {
      title,
      thumbnail,
      duration,
      qualities,
      captions,
    };

    // Cache the result
    this.cache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });

    return data;
  }

  private extractCaptions(metadata: YtDlpJsonDump): CaptionDto[] {
    const captions: CaptionDto[] = [];
    const seen = new Set<string>();

    // Prefer manual subtitles over auto-generated
    const subtitleSources = [
      metadata.subtitles,
      metadata.automatic_captions,
    ];

    for (const source of subtitleSources) {
      if (!source) continue;
      for (const [lang, tracks] of Object.entries(source)) {
        if (seen.has(lang)) continue;
        // Find VTT format first, then any available
        const track =
          tracks.find((t) => t.ext === 'vtt') ||
          tracks.find((t) => t.ext === 'srv3') ||
          tracks[0];
        if (track?.url) {
          captions.push({ lang, url: track.url });
          seen.add(lang);
        }
      }
    }

    return captions;
  }

  private extractVideoId(url: string): string {
    const match = url.match(
      /(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    );
    return match?.[1] || '';
  }
}
