import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q");
    if (!q) return NextResponse.json({ results: [] });

    const results = await query("pak", "SELECT id, title, slug, status, poster_url as posterUrl FROM dramas WHERE title LIKE ? ORDER BY created_at DESC LIMIT 30", [`%${q}%`]);
    return NextResponse.json({ results });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
