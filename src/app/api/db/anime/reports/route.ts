import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    const limit = Math.min(Number(searchParams.get("limit")) || 50, 200);
    const offset = Number(searchParams.get("offset")) || 0;

    let where = "WHERE 1=1";
    const params: unknown[] = [];
    if (status && ["open", "ack", "closed"].includes(status)) {
      where += " AND status = ?";
      params.push(status);
    }
    if (q) {
      where += " AND (error_title LIKE ? OR error_message LIKE ? OR device_name LIKE ? OR download_url LIKE ?)";
      const like = `%${q}%`;
      params.push(like, like, like, like);
    }

    const countRows = await query("anime", `SELECT COUNT(*) as count FROM error_reports ${where}`, params) as Record<string, number>[];
    const total = countRows[0]?.count || 0;

    const items = await query("anime", `SELECT * FROM error_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);

    const countsRows = await query("anime", "SELECT status, COUNT(*) as count FROM error_reports GROUP BY status") as Record<string, string | number>[];
    const counts = { total: 0, open: 0, ack: 0, closed: 0 };
    for (const r of countsRows) {
      const s = r.status as string;
      const c = Number(r.count);
      counts.total += c;
      if (s === "open") counts.open = c;
      else if (s === "ack") counts.ack = c;
      else if (s === "closed") counts.closed = c;
    }

    return NextResponse.json({ total, counts, items });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    if (status && ["open", "ack", "closed"].includes(status)) {
      await query("anime", "DELETE FROM error_reports WHERE status = ?", [status]);
    } else {
      await query("anime", "DELETE FROM error_reports");
    }

    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
