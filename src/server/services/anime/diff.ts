import { query } from "@/lib/db";
import type { EpisodeItem } from "@/server/scrapers/gogo-scraper";

let primed: boolean | null = null;

async function isPrimed(): Promise<boolean> {
  if (primed !== null) return primed;
  const rows = (await query("anime", "SELECT COUNT(*) as c FROM seen_episodes")) as { c: number }[];
  primed = rows[0].c > 0;
  return primed;
}

export async function diff(items: EpisodeItem[]): Promise<EpisodeItem[]> {
  if (items.length === 0) return [];

  const urls = items.map((i) => i.url);
  const placeholders = urls.map(() => "?").join(",");
  const existing = (await query(
    "anime",
    `SELECT url FROM seen_episodes WHERE url IN (${placeholders})`,
    urls
  )) as { url: string }[];

  const existingSet = new Set(existing.map((e) => e.url));
  const fresh = items.filter((i) => !existingSet.has(i.url));
  if (fresh.length === 0) return [];

  const insertValues = fresh.map(() => "(?)").join(",");
  const insertParams = fresh.map((i) => i.url);
  await query(
    "anime",
    `INSERT IGNORE INTO seen_episodes (url) VALUES ${insertValues}`,
    insertParams
  );

  const wasPrimed = await isPrimed();
  if (!wasPrimed) {
    primed = true;
    console.log(`[diff] Primed seen_episodes with ${fresh.length} rows — suppressing first-run notifications`);
    return [];
  }

  return fresh;
}
