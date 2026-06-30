import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Number(searchParams.get("offset")) || 0;
    const rating = searchParams.get("rating");

    let where = "WHERE 1=1";
    const params: unknown[] = [];

    if (rating) {
      const ratingNum = Number(rating);
      if (ratingNum >= 1 && ratingNum <= 5) {
        where += " AND rating = ?";
        params.push(ratingNum);
      }
    }

    const countRows = (await query(
      "anime",
      `SELECT COUNT(*) as count FROM app_feedback ${where}`,
      params
    )) as Record<string, number>[];
    const total = Number(countRows[0]?.count) || 0;

    const items = await query(
      "anime",
      `SELECT * FROM app_feedback ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const avgRows = (await query(
      "anime",
      "SELECT AVG(rating) as avg_rating, COUNT(*) as total FROM app_feedback"
    )) as Record<string, number>[];
    const avgRating = Number(avgRows[0]?.avg_rating) || 0;

    const ratingDist = (await query(
      "anime",
      "SELECT rating, COUNT(*) as count FROM app_feedback GROUP BY rating ORDER BY rating DESC"
    )) as Record<string, number>[];

    return NextResponse.json({
      data: items,
      total,
      avgRating: Math.round(avgRating * 10) / 10,
      ratingDistribution: ratingDist,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
