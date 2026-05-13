import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const rows = await query("anime", "SELECT `key`, `value`, `updated_at` as updatedAt FROM kv_entries ORDER BY `key` ASC");
    return NextResponse.json({ entries: rows });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { key, value } = await req.json();

    if (!key || typeof key !== "string" || key.trim().length === 0) {
      return NextResponse.json({ error: "Key is required" }, { status: 400 });
    }
    if (key.length > 128) {
      return NextResponse.json({ error: "Key must be under 128 characters" }, { status: 400 });
    }
    if (value === undefined || value === null) {
      return NextResponse.json({ error: "Value is required" }, { status: 400 });
    }

    // Value must be valid JSON (DB constraint: CHECK json_valid)
    let valStr: string;
    if (typeof value === "string") {
      try {
        JSON.parse(value);
        valStr = value;
      } catch {
        valStr = JSON.stringify(value);
      }
    } else {
      valStr = JSON.stringify(value);
    }

    await query(
      "anime",
      "INSERT INTO kv_entries (`key`, `value`, `updated_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()",
      [key.trim(), valStr]
    );

    return NextResponse.json({ success: true, key: key.trim(), value: valStr });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { key } = await req.json();
    if (!key) return NextResponse.json({ error: "Key is required" }, { status: 400 });

    await query("anime", "DELETE FROM kv_entries WHERE `key` = ?", [key]);
    return NextResponse.json({ success: true, deleted: key });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
