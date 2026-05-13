import { NextRequest, NextResponse } from "next/server";

export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function verifyAdminToken(req: NextRequest): NextResponse | null {
  const expected = process.env.ADMIN_TOKEN;
  if (!expected || expected.length < 12) {
    return NextResponse.json(
      { error: "admin api is not provisioned" },
      { status: 503 }
    );
  }
  const provided = (req.headers.get("x-admin-token") ?? "").trim();
  if (!provided || !timingSafeEqual(provided, expected)) {
    return NextResponse.json({ error: "invalid admin token" }, { status: 403 });
  }
  return null;
}

export function jsonOk(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}
