import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Number(searchParams.get("offset")) || 0;

    const notifications = await query("aviation", "SELECT id, articleUrl as article_url, title, image, sentAt as created_at FROM sent_notifications ORDER BY sentAt DESC LIMIT ? OFFSET ?", [limit, offset]);
    const countRows = await query("aviation", "SELECT COUNT(*) as count FROM sent_notifications") as Record<string, number>[];
    return NextResponse.json({ notifications, total: countRows[0]?.count || 0 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
