import { query } from "@/lib/db";

export async function addCountry(countryRaw: string | undefined): Promise<boolean> {
  if (!countryRaw) return false;
  const cc = countryRaw.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(cc)) return false;

  const result = (await query(
    "anime",
    "INSERT IGNORE INTO registered_countries (code) VALUES (?)",
    [cc]
  )) as { affectedRows: number };
  return (result.affectedRows ?? 0) > 0;
}

export async function allCountries(): Promise<string[]> {
  const rows = (await query(
    "anime",
    "SELECT code FROM registered_countries ORDER BY code ASC"
  )) as { code: string }[];
  return rows.map((r) => r.code);
}
