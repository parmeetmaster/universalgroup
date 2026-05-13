import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const limit = Math.min(Number(searchParams.get("limit")) || 20, 100);
    const status = searchParams.get("status");
    const offset = (page - 1) * limit;

    const statusFilter =
      status === "active" || status === "uninstalled"
        ? `WHERE status = '${status}'`
        : "";

    const [statsRows, dailyRows, devices, countRows] = await Promise.all([
      query(
        "anime",
        `SELECT
           COUNT(*) as total,
           SUM(status = 'active') as active,
           SUM(status = 'uninstalled') as uninstalled
         FROM device_tokens`
      ),
      query(
        "anime",
        `SELECT DATE(registered_at) as date, COUNT(*) as count
         FROM device_tokens
         WHERE registered_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
         GROUP BY DATE(registered_at)
         ORDER BY date ASC`
      ),
      query(
        "anime",
        `SELECT id, fcm_token, country, app_version, device_model, status,
                ping_failures, registered_at, last_active_at, uninstalled_at
         FROM device_tokens ${statusFilter}
         ORDER BY registered_at DESC
         LIMIT ? OFFSET ?`,
        [limit, offset]
      ),
      query(
        "anime",
        `SELECT COUNT(*) as total FROM device_tokens ${statusFilter}`
      ),
    ]);

    const s = (statsRows as Record<string, number>[])[0] || {};
    const total = Number(s.total) || 0;
    const active = Number(s.active) || 0;
    const uninstalled = Number(s.uninstalled) || 0;

    return NextResponse.json({
      stats: {
        total,
        active,
        uninstalled,
        uninstallRate: total > 0 ? Math.round((uninstalled / total) * 100) : 0,
      },
      dailyInstalls: dailyRows,
      devices,
      pagination: {
        total: Number((countRows as Record<string, number>[])[0]?.total) || 0,
        page,
        limit,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "ping") {
      const nestUrl =
        process.env.NEST_INTERNAL_URL?.replace(/\/$/, "") ??
        "http://localhost:3090/api";
      const adminToken = process.env.ADMIN_TOKEN ?? "";

      const res = await fetch(`${nestUrl}/anime-downloader/admin/devices/ping`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Admin-Token": adminToken,
        },
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json({ error: err }, { status: res.status });
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
