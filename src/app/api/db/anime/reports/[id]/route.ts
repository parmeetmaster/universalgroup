import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const sets: string[] = [];
    const values: unknown[] = [];

    if (body.status && ["open", "ack", "closed"].includes(body.status)) {
      sets.push("status = ?");
      values.push(body.status);
    }
    if (body.admin_notes !== undefined) {
      sets.push("admin_notes = ?");
      values.push(body.admin_notes);
    }
    if (sets.length === 0) return NextResponse.json({ error: "No valid fields" }, { status: 400 });

    sets.push("updated_at = NOW()");
    values.push(id);
    await query("anime", `UPDATE error_reports SET ${sets.join(", ")} WHERE id = ?`, values);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await query("anime", "DELETE FROM error_reports WHERE id = ?", [id]);
    return NextResponse.json({ success: true });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
