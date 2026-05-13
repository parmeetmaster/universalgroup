import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [episodes, countries, blocked, kv] = await Promise.all([
      query("anime", "SELECT COUNT(*) as count FROM seen_episodes"),
      query("anime", "SELECT * FROM registered_countries"),
      query("anime", "SELECT * FROM blocked_countries"),
      query("anime", "SELECT `key`, `value` FROM kv_entries"),
    ]);

    const countryRows = countries as Record<string, string>[];
    const blockedRows = blocked as Record<string, string>[];

    return NextResponse.json({
      stats: {
        seenEpisodes: (episodes as Record<string, number>[])[0]?.count || 0,
        registeredCountries: countryRows.length,
        blockedCountries: blockedRows.length,
        kvEntries: (kv as unknown[]).length,
      },
      countries: countryRows.map((c) => c.country_code || c.code || c.name),
      blocked: blockedRows.map((c) => c.country_code || c.code || c.name),
      kvEntries: kv,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
