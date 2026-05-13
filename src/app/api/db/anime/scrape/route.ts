import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const episodes = await query("anime", "SELECT url, first_seen_at, created_at FROM seen_episodes ORDER BY created_at DESC LIMIT 50");
    const countRows = await query("anime", "SELECT COUNT(*) as count FROM seen_episodes") as Record<string, number>[];
    return NextResponse.json({ recentEpisodes: episodes, totalEpisodes: countRows[0]?.count || 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await fetch("http://194.163.133.119:3050/anime-downloader/scrape", {
      headers: { "User-Agent": "UniversalDashboard/1.0" },
      signal: AbortSignal.timeout(30000),
    });
    const data = await res.json();
    return NextResponse.json({ success: true, data });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
