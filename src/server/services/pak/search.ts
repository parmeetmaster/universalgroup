import { query } from "@/lib/db";

export async function search(q: string) {
  if (!q || q.trim().length < 2) {
    return { dramas: [], episodes: [], cast: [] };
  }

  const like = `%${q.trim()}%`;

  const [dramas, episodes, cast] = await Promise.all([
    query(
      "pak",
      `SELECT id, title, slug, poster_url, type, status, release_year, rating_avg
       FROM dramas
       WHERE (title LIKE ? OR synopsis LIKE ?) AND is_published = 1 AND deleted_at IS NULL
       ORDER BY rating_count DESC
       LIMIT 20`,
      [like, like]
    ),
    query(
      "pak",
      `SELECT e.id, e.title, e.number, e.season_id,
              d.title AS drama_title, d.slug AS drama_slug, s.number AS season_number
       FROM episodes e
       JOIN dramas d ON d.id = e.drama_id
       JOIN seasons s ON s.id = e.season_id
       WHERE e.title LIKE ? AND d.is_published = 1 AND d.deleted_at IS NULL
       ORDER BY d.rating_count DESC
       LIMIT 20`,
      [like]
    ),
    query(
      "pak",
      `SELECT id, name, slug, photo_url
       FROM cast_members
       WHERE name LIKE ?
       ORDER BY name ASC
       LIMIT 20`,
      [like]
    ),
  ]);

  return { dramas, episodes, cast };
}
