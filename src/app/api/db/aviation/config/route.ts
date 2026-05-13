import { NextRequest, NextResponse } from "next/server";
import { getConfig, updateConfig } from "@/server/services/aviation/config";

export async function GET() {
  try {
    const config = await getConfig();
    return NextResponse.json({ config });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }
    await updateConfig(body);
    const config = await getConfig();
    return NextResponse.json({ success: true, config });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
