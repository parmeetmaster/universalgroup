import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { country } = await req.json();
    if (!country || typeof country !== "string" || country.length !== 2) {
      return NextResponse.json({ error: "2-letter country code required" }, { status: 400 });
    }
    const cc = country.toUpperCase();
    await query("anime", "INSERT IGNORE INTO blocked_countries (code, created_at) VALUES (?, NOW())", [cc]);
    return NextResponse.json({ success: true, country: cc });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { country } = await req.json();
    if (!country) return NextResponse.json({ error: "Country code required" }, { status: 400 });
    await query("anime", "DELETE FROM blocked_countries WHERE code = ?", [country.toUpperCase()]);
    return NextResponse.json({ success: true, country: country.toUpperCase() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
