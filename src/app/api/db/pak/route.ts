import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [dramaCount, episodeCount, genreCount, dramas, genres, recentEpisodes] = await Promise.all([
      query("pak", "SELECT COUNT(*) as count FROM dramas"),
      query("pak", "SELECT COUNT(*) as count FROM episodes"),
      query("pak", "SELECT COUNT(*) as count FROM genres"),
      query("pak", "SELECT id, title, slug, status, poster_url as posterUrl, created_at as createdAt FROM dramas ORDER BY created_at DESC LIMIT 20"),
      query("pak", "SELECT id, name, slug FROM genres ORDER BY display_order ASC"),
      query("pak", "SELECT e.id, e.title, e.number, d.title as dramaTitle FROM episodes e JOIN dramas d ON e.drama_id = d.id ORDER BY e.created_at DESC LIMIT 10"),
    ]);

    return NextResponse.json({
      stats: {
        totalDramas: (dramaCount as Record<string, number>[])[0]?.count || 0,
        totalEpisodes: (episodeCount as Record<string, number>[])[0]?.count || 0,
        totalGenres: (genreCount as Record<string, number>[])[0]?.count || 0,
      },
      dramas,
      genres,
      recentEpisodes,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
