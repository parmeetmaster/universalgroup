import { query } from "@/lib/db";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const VIDEO_ID_REGEX = /(?:shorts\/|v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
const STREAM_CACHE_TTL = 50 * 60 * 1000; // 50 min
const streamCache = new Map<string, { url: string; fetchedAt: number }>();

// --------------- interfaces ---------------

export interface YoutubeShort {
  id: number;
  youtubeUrl: string;
  title: string | null;
  thumbnailUrl: string | null;
  durationSeconds: number | null;
  isActive: boolean;
  sortOrder: number;
  streamingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// --------------- helpers ---------------

export function extractVideoId(url: string): string | null {
  const match = url.match(VIDEO_ID_REGEX);
  return match ? match[1] : null;
}

function normalizeYoutubeUrl(videoId: string): string {
  return `https://www.youtube.com/shorts/${videoId}`;
}

export async function getStreamingUrl(youtubeUrl: string): Promise<string | null> {
  const now = Date.now();
  const cached = streamCache.get(youtubeUrl);
  if (cached && now - cached.fetchedAt < STREAM_CACHE_TTL) {
    return cached.url;
  }

  // Try best quality mp4 first
  try {
    const { stdout } = await execAsync(
      `yt-dlp -f "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]" --get-url "${youtubeUrl}"`,
      { timeout: 30_000 }
    );
    const streamUrl = stdout.trim().split("\n")[0];
    if (streamUrl) {
      streamCache.set(youtubeUrl, { url: streamUrl, fetchedAt: now });
      return streamUrl;
    }
  } catch {
    // fallback
  }

  // Fallback: format 18 (360p mp4)
  try {
    const { stdout } = await execAsync(
      `yt-dlp -f 18 --get-url "${youtubeUrl}"`,
      { timeout: 30_000 }
    );
    const streamUrl = stdout.trim();
    if (streamUrl) {
      streamCache.set(youtubeUrl, { url: streamUrl, fetchedAt: now });
      return streamUrl;
    }
  } catch {
    // ignore
  }

  return null;
}

// --------------- CRUD ---------------

export async function addVideo(youtubeUrl: string): Promise<{ id: number; youtubeUrl: string }> {
  const videoId = extractVideoId(youtubeUrl);
  if (!videoId) throw new Error("Invalid YouTube URL: could not extract video ID");

  const normalizedUrl = normalizeYoutubeUrl(videoId);

  // Check duplicate
  const existing = (await query(
    "aviation",
    "SELECT id FROM youtube_shorts WHERE youtubeUrl = ? AND isActive = 1 LIMIT 1",
    [normalizedUrl]
  )) as { id: number }[];

  if (existing.length > 0) {
    throw new Error(`Video already exists with id ${existing[0].id}`);
  }

  // Get max sortOrder
  const maxRows = (await query(
    "aviation",
    "SELECT COALESCE(MAX(sortOrder), 0) AS maxSort FROM youtube_shorts WHERE isActive = 1"
  )) as { maxSort: number }[];
  const nextSort = (maxRows[0]?.maxSort || 0) + 1;

  const result = (await query(
    "aviation",
    `INSERT INTO youtube_shorts (youtubeUrl, isActive, sortOrder, createdAt, updatedAt)
     VALUES (?, 1, ?, NOW(), NOW())`,
    [normalizedUrl, nextSort]
  )) as { insertId: number };

  return { id: result.insertId, youtubeUrl: normalizedUrl };
}

export async function getVideos(
  page: number = 1,
  limit: number = 20
): Promise<{ videos: YoutubeShort[]; total: number; page: number; totalPages: number }> {
  const offset = (page - 1) * limit;

  const countRows = (await query(
    "aviation",
    "SELECT COUNT(*) AS cnt FROM youtube_shorts WHERE isActive = 1"
  )) as { cnt: number }[];
  const total = countRows[0]?.cnt || 0;
  const totalPages = Math.ceil(total / limit) || 1;

  const rows = (await query(
    "aviation",
    `SELECT id, youtubeUrl, title, thumbnailUrl, durationSeconds, isActive, sortOrder, createdAt, updatedAt
     FROM youtube_shorts WHERE isActive = 1 ORDER BY sortOrder DESC, createdAt DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  )) as YoutubeShort[];

  const videos: YoutubeShort[] = [];
  for (const row of rows) {
    const streamingUrl = await getStreamingUrl(row.youtubeUrl);
    videos.push({
      ...row,
      isActive: !!row.isActive,
      streamingUrl: streamingUrl || undefined,
    });
  }

  return { videos, total, page, totalPages };
}

export async function deleteVideo(id: number): Promise<void> {
  const result = (await query(
    "aviation",
    "UPDATE youtube_shorts SET isActive = 0, updatedAt = NOW() WHERE id = ?",
    [id]
  )) as { affectedRows: number };

  if (result.affectedRows === 0) {
    throw new Error(`Video with id ${id} not found`);
  }
}
