import { query } from "@/lib/db";

interface RailRow {
  id: number;
  title: string;
  rail_type: string;
  genre_id: number | null;
  display_order: number;
}

interface DramaCard {
  id: number;
  title: string;
  slug: string;
  poster_url: string | null;
  backdrop_url: string | null;
  type: string;
  status: string;
  release_year: number | null;
  rating_avg: number | null;
  rating_count: number;
}

export async function getHome() {
  const rails = (await query(
    "pak",
    "SELECT * FROM home_rails WHERE is_active = 1 ORDER BY display_order ASC"
  )) as RailRow[];

  const result: { id: number; title: string; rail_type: string; items: DramaCard[] }[] = [];

  for (const rail of rails) {
    let items: DramaCard[];

    if (rail.rail_type === "genre" && rail.genre_id) {
      items = (await query(
        "pak",
        `SELECT d.id, d.title, d.slug, d.poster_url, d.backdrop_url,
                d.type, d.status, d.release_year, d.rating_avg, d.rating_count
         FROM dramas d
         JOIN drama_genres dg ON dg.drama_id = d.id
         WHERE dg.genre_id = ? AND d.is_published = 1 AND d.deleted_at IS NULL
         ORDER BY d.rating_count DESC
         LIMIT 20`,
        [rail.genre_id]
      )) as DramaCard[];
    } else {
      items = (await query(
        "pak",
        `SELECT d.id, d.title, d.slug, d.poster_url, d.backdrop_url,
                d.type, d.status, d.release_year, d.rating_avg, d.rating_count
         FROM dramas d
         JOIN home_rail_items hri ON hri.drama_id = d.id
         WHERE hri.rail_id = ? AND d.is_published = 1 AND d.deleted_at IS NULL
         ORDER BY hri.display_order ASC`,
        [rail.id]
      )) as DramaCard[];
    }

    result.push({
      id: rail.id,
      title: rail.title,
      rail_type: rail.rail_type,
      items,
    });
  }

  return result;
}
