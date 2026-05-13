import { query } from "@/lib/db";

let cache: Set<string> | null = null;

function normalize(countryRaw: string): string {
  const cc = countryRaw?.trim().toUpperCase() ?? "";
  if (!/^[A-Z]{2}$/.test(cc)) {
    throw new Error(`invalid country code: "${countryRaw}" (expect ISO-3166 alpha-2)`);
  }
  return cc;
}

async function ensureCache(): Promise<Set<string>> {
  if (cache) return cache;
  const rows = (await query("anime", "SELECT code FROM blocked_countries")) as { code: string }[];
  cache = new Set(rows.map((r) => r.code.toUpperCase()));
  return cache;
}

export async function isBlocked(countryRaw?: string): Promise<boolean> {
  if (!countryRaw) return false;
  const c = await ensureCache();
  return c.has(countryRaw.trim().toUpperCase());
}

export async function all(): Promise<string[]> {
  const c = await ensureCache();
  return Array.from(c).sort();
}

export async function add(countryRaw: string): Promise<boolean> {
  const cc = normalize(countryRaw);
  const result = (await query(
    "anime",
    "INSERT IGNORE INTO blocked_countries (code) VALUES (?)",
    [cc]
  )) as { affectedRows: number };
  const inserted = (result.affectedRows ?? 0) > 0;
  if (inserted) {
    const c = await ensureCache();
    c.add(cc);
  }
  return inserted;
}

export async function remove(countryRaw: string): Promise<boolean> {
  const cc = normalize(countryRaw);
  const result = (await query(
    "anime",
    "DELETE FROM blocked_countries WHERE code = ?",
    [cc]
  )) as { affectedRows: number };
  const removed = (result.affectedRows ?? 0) > 0;
  if (removed) {
    const c = await ensureCache();
    c.delete(cc);
  }
  return removed;
}
