import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [shortsCount, notifCount, shorts] = await Promise.all([
      query("aviation", "SELECT COUNT(*) as count FROM youtube_shorts"),
      query("aviation", "SELECT COUNT(*) as count FROM sent_notifications"),
      query("aviation", "SELECT id, title, youtubeUrl, thumbnailUrl, createdAt FROM youtube_shorts ORDER BY createdAt DESC LIMIT 20"),
    ]);

    return NextResponse.json({
      stats: {
        totalShorts: (shortsCount as Record<string, number>[])[0]?.count || 0,
        totalNotifications: (notifCount as Record<string, number>[])[0]?.count || 0,
      },
      youtubeShorts: shorts,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
