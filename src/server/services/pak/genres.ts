import { query } from "@/lib/db";

export async function listGenres() {
  const rows = await query(
    "pak",
    "SELECT * FROM genres ORDER BY display_order ASC, name ASC"
  );
  return rows;
}

export async function getGenre(slug: string) {
  const rows = (await query(
    "pak",
    "SELECT * FROM genres WHERE slug = ?",
    [slug]
  )) as { id: number; name: string; slug: string; icon_url: string | null; display_order: number }[];

  return rows[0] ?? null;
}
