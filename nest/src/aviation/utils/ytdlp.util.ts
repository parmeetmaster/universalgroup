import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

const logger = new Logger('YtDlpUtil');

// Auth: prefer OAuth2 token (permanent), fallback to cookies
const COOKIES_PATH = join(process.cwd(), 'yt-cookies.txt');
const OAUTH_TOKEN_DIR = join(process.env.HOME || '/root', '.cache', 'yt-dlp', 'youtube-oauth2');

function hasOAuthToken(): boolean {
  return existsSync(join(OAUTH_TOKEN_DIR, 'token.json'));
}

function hasCookies(): boolean {
  return existsSync(COOKIES_PATH);
}

interface VideoMetadata {
  title: string;
  thumbnailUrl: string;
  durationSeconds: number;
}

interface CachedStream {
  url: string;
  expiresAt: number;
}

// In-memory cache: youtubeUrl -> { url, expiresAt }
const streamCache = new Map<string, CachedStream>();
const CACHE_TTL_MS = 50 * 60 * 1000; // 50 minutes (streaming URLs expire ~1 hour)

// Semaphore: only 1 yt-dlp process at a time to avoid CPU spikes
const MAX_CONCURRENT = 1;
let running = 0;
const queue: Array<() => void> = [];

function acquireSlot(): Promise<void> {
  if (running < MAX_CONCURRENT) {
    running++;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => queue.push(resolve));
}

function releaseSlot(): void {
  const next = queue.shift();
  if (next) {
    next();
  } else {
    running--;
  }
}

export async function runYtDlp(args: string[], timeoutMs = 30000): Promise<string> {
  await acquireSlot();
  try {
    const authArgs = hasOAuthToken()
      ? ['--username', 'oauth2', '--password', '']
      : hasCookies()
        ? ['--cookies', COOKIES_PATH]
        : [];

    const baseArgs = [
      ...authArgs,
      '--no-warnings',
      ...args,
    ];

    return await new Promise((resolve, reject) => {
      execFile('yt-dlp', baseArgs, { timeout: timeoutMs }, (err, stdout, stderr) => {
        if (err) {
          const msg = stderr?.trim() || err.message;
          reject(new Error(msg));
          return;
        }
        resolve(stdout.trim());
      });
    });
  } finally {
    releaseSlot();
  }
}

export async function getVideoMetadata(youtubeUrl: string): Promise<VideoMetadata> {
  const json = await runYtDlp([
    '--dump-json',
    '--no-download',
    youtubeUrl,
  ]);

  const data = JSON.parse(json);
  return {
    title: data.title || data.fulltitle || '',
    thumbnailUrl: data.thumbnail || `https://i.ytimg.com/vi/${extractVideoId(youtubeUrl)}/oar2.jpg`,
    durationSeconds: data.duration || 0,
  };
}

// Format strategies: try best quality first, fallback to guaranteed format 18 (360p mp4)
const FORMAT_STRATEGIES = [
  'bv*[height<=1280][ext=mp4]+ba[ext=m4a]/b[height<=1280][ext=mp4]/b[ext=mp4]/b',
  '18/best[ext=mp4]/best',
];

export async function getStreamingUrl(youtubeUrl: string): Promise<string | null> {
  // Check cache first
  const cached = streamCache.get(youtubeUrl);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  for (let i = 0; i < FORMAT_STRATEGIES.length; i++) {
    try {
      const output = await runYtDlp([
        '-f', FORMAT_STRATEGIES[i],
        '--get-url',
        youtubeUrl,
      ], 45000);

      // yt-dlp may return two URLs (video + audio) for DASH formats — use only the first (video)
      const url = output.split('\n')[0].trim();
      if (!url) continue;

      // Cache the result
      streamCache.set(youtubeUrl, {
        url,
        expiresAt: Date.now() + CACHE_TTL_MS,
      });

      if (i > 0) {
        logger.log(`Used fallback format strategy ${i + 1} for ${youtubeUrl}`);
      }

      return url;
    } catch (err) {
      logger.warn(`Format strategy ${i + 1} failed for ${youtubeUrl}: ${err instanceof Error ? err.message : err}`);
    }
  }

  logger.error(`All format strategies failed for ${youtubeUrl}`);
  return null;
}

function extractVideoId(url: string): string {
  const match = url.match(/(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match?.[1] || '';
}
