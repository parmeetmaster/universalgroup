import { query } from "@/lib/db";

// --------------- Types ---------------

interface EpisodeRow {
  id: number;
  drama_id: number;
  season_id: number;
  number: number;
  title: string | null;
  synopsis: string | null;
  air_date: string | null;
  source_url: string | null;
  is_published: number;
  created_at: string;
  updated_at: string;
}

interface VideoRow {
  id: number;
  episode_id: number;
  source_id: number | null;
  label: string | null;
  url: string;
  format: string;
  quality: string;
  language: string | null;
  subtitle_url: string | null;
  headers: string | null;
  priority: number;
  is_active: number;
  play_count: number;
  last_verified_at: string | null;
}

interface CreateSeasonData {
  drama_id: number;
  number: number;
  title?: string;
  synopsis?: string;
  poster_url?: string;
  total_episodes?: number;
}

interface CreateEpisodeData {
  drama_id: number;
  season_id: number;
  number: number;
  title?: string;
  synopsis?: string;
  air_date?: string;
  source_url?: string;
  is_published?: boolean;
}

// --------------- Public ---------------

export async function getEpisode(id: number) {
  const episodes = (await query(
    "pak",
    "SELECT * FROM episodes WHERE id = ?",
    [id]
  )) as EpisodeRow[];

  const episode = episodes[0];
  if (!episode) return null;

  const videos = (await query(
    "pak",
    `SELECT * FROM episode_videos
     WHERE episode_id = ? AND is_active = 1
     ORDER BY priority ASC`,
    [id]
  )) as VideoRow[];

  return { ...episode, videos };
}

export async function resolveEpisodeSources(id: number) {
  const videos = (await query(
    "pak",
    `SELECT * FROM episode_videos
     WHERE episode_id = ? AND is_active = 1
     ORDER BY priority ASC`,
    [id]
  )) as VideoRow[];

  if (videos.length > 0) {
    return videos.map((v) => ({
      id: v.id,
      label: v.label,
      url: v.url,
      format: v.format,
      quality: v.quality,
      language: v.language,
      subtitle_url: v.subtitle_url,
      headers: v.headers ? JSON.parse(v.headers) : null,
    }));
  }

  const episodes = (await query(
    "pak",
    "SELECT source_url FROM episodes WHERE id = ?",
    [id]
  )) as { source_url: string | null }[];

  const sourceUrl = episodes[0]?.source_url;
  if (!sourceUrl) return [];

  return [{ url: sourceUrl, format: "embed", quality: "auto", label: "Source" }];
}

// --------------- Admin ---------------

export async function createSeason(data: CreateSeasonData) {
  const result = (await query(
    "pak",
    `INSERT INTO seasons (drama_id, number, title, synopsis, poster_url, total_episodes)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      data.drama_id,
      data.number,
      data.title ?? null,
      data.synopsis ?? null,
      data.poster_url ?? null,
      data.total_episodes ?? 0,
    ]
  )) as { insertId: number };

  return { id: result.insertId };
}

export async function deleteSeason(id: number) {
  await query("pak", "DELETE FROM episodes WHERE season_id = ?", [id]);
  await query("pak", "DELETE FROM seasons WHERE id = ?", [id]);
}

export async function createEpisode(data: CreateEpisodeData) {
  const result = (await query(
    "pak",
    `INSERT INTO episodes (drama_id, season_id, number, title, synopsis, air_date, source_url, is_published)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      data.drama_id,
      data.season_id,
      data.number,
      data.title ?? null,
      data.synopsis ?? null,
      data.air_date ?? null,
      data.source_url ?? null,
      data.is_published ? 1 : 0,
    ]
  )) as { insertId: number };

  return { id: result.insertId };
}

export async function deleteEpisode(id: number) {
  await query("pak", "DELETE FROM episode_videos WHERE episode_id = ?", [id]);
  await query("pak", "DELETE FROM episodes WHERE id = ?", [id]);
}
