import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const [tables] = await Promise.all([
      query("manga", "SHOW TABLES"),
    ]);

    const tableNames = (tables as Record<string, string>[]).map((t) => Object.values(t)[0] as string);

    const stats: Record<string, number> = {};
    for (const table of tableNames) {
      const rows = await query("manga", `SELECT COUNT(*) as count FROM \`${table}\``) as Record<string, number>[];
      stats[table] = rows[0]?.count || 0;
    }

    return NextResponse.json({
      tables: tableNames,
      stats,
      dbStatus: "connected",
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), tables: [], stats: {}, dbStatus: "error" }, { status: 500 });
  }
}
