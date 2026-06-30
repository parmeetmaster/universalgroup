import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [dramaCount, episodeCount, userCount, genreCount, recentEpisodes, recentUsers] = await Promise.all([
      query("chinese-drama", "SELECT COUNT(*) as count FROM dramas"),
      query("chinese-drama", "SELECT COUNT(*) as count FROM cd_episodes"),
      query("chinese-drama", "SELECT COUNT(*) as count FROM cd_users"),
      query("chinese-drama", "SELECT COUNT(*) as count FROM genres"),
      query(
        "chinese-drama",
        "SELECT e.id, e.title, e.episode_number as episodeNumber, e.source_type as sourceType, e.is_vip as isVip, e.status, e.created_at as createdAt, d.name as dramaTitle FROM cd_episodes e JOIN dramas d ON e.drama_sno = d.sno ORDER BY e.created_at DESC LIMIT 20"
      ),
      query(
        "chinese-drama",
        "SELECT uid, name, email, country, deviceId, lastLoginAt FROM cd_users ORDER BY lastLoginAt DESC LIMIT 10"
      ),
    ]);

    return NextResponse.json({
      stats: {
        totalDramas: (dramaCount as Record<string, number>[])[0]?.count || 0,
        totalEpisodes: (episodeCount as Record<string, number>[])[0]?.count || 0,
        totalUsers: (userCount as Record<string, number>[])[0]?.count || 0,
        totalGenres: (genreCount as Record<string, number>[])[0]?.count || 0,
      },
      recentEpisodes,
      recentUsers,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { sql, params } = await req.json();
    if (!sql) {
      return NextResponse.json({ error: "sql is required" }, { status: 400 });
    }
    const rows = await query("chinese-drama", sql, params);
    return NextResponse.json({ results: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
