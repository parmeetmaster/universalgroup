import { query } from "@/lib/db";

export type ReportStatus = "open" | "ack" | "closed";
export const REPORT_STATUSES: ReportStatus[] = ["open", "ack", "closed"];

export interface CreateReportInput {
  device_name?: string;
  app_version?: string;
  error_title?: string;
  error_message?: string;
  download_url?: string;
  additional_info?: string;
}

export interface ErrorReport {
  id: number;
  device_name: string | null;
  app_version: string | null;
  error_title: string | null;
  error_message: string | null;
  download_url: string | null;
  additional_info: string | null;
  status: string;
  admin_notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function trim(s: string | undefined, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

export async function ingest(input: CreateReportInput): Promise<{ id: number; created_at: Date }> {
  const result = (await query(
    "anime",
    `INSERT INTO error_reports (device_name, app_version, error_title, error_message, download_url, additional_info, status)
     VALUES (?, ?, ?, ?, ?, ?, 'open')`,
    [
      trim(input.device_name, 200),
      trim(input.app_version, 50),
      trim(input.error_title, 200),
      trim(input.error_message, 10_000),
      trim(input.download_url, 2_000),
      trim(input.additional_info, 10_000),
    ]
  )) as { insertId: number };

  const rows = (await query(
    "anime",
    "SELECT id, created_at FROM error_reports WHERE id = ?",
    [result.insertId]
  )) as { id: number; created_at: Date }[];
  return rows[0];
}

export async function list(opts: {
  status?: ReportStatus;
  q?: string;
  limit?: number;
  offset?: number;
}): Promise<{ total: number; items: ErrorReport[] }> {
  const limit = Math.min(Math.max(opts.limit ?? 50, 1), 200);
  const offset = Math.max(opts.offset ?? 0, 0);
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (opts.status) {
    conditions.push("status = ?");
    params.push(opts.status);
  }
  if (opts.q?.trim()) {
    const like = `%${opts.q.trim()}%`;
    conditions.push(
      "(error_title LIKE ? OR error_message LIKE ? OR download_url LIKE ? OR device_name LIKE ? OR additional_info LIKE ?)"
    );
    params.push(like, like, like, like, like);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countRows = (await query(
    "anime",
    `SELECT COUNT(*) as total FROM error_reports ${where}`,
    params
  )) as { total: number }[];

  const items = (await query(
    "anime",
    `SELECT * FROM error_reports ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )) as ErrorReport[];

  return { total: countRows[0].total, items };
}

export async function getById(id: number): Promise<ErrorReport | null> {
  const rows = (await query(
    "anime",
    "SELECT * FROM error_reports WHERE id = ?",
    [id]
  )) as ErrorReport[];
  return rows[0] ?? null;
}

export async function update(
  id: number,
  patch: { status?: ReportStatus; admin_notes?: string | null }
): Promise<ErrorReport | null> {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (patch.status && REPORT_STATUSES.includes(patch.status)) {
    sets.push("status = ?");
    params.push(patch.status);
  }
  if (patch.admin_notes !== undefined) {
    sets.push("admin_notes = ?");
    params.push(patch.admin_notes?.trim() || null);
  }

  if (sets.length > 0) {
    params.push(id);
    await query("anime", `UPDATE error_reports SET ${sets.join(", ")} WHERE id = ?`, params);
  }
  return getById(id);
}

export async function remove(id: number): Promise<boolean> {
  const result = (await query(
    "anime",
    "DELETE FROM error_reports WHERE id = ?",
    [id]
  )) as { affectedRows: number };
  return (result.affectedRows ?? 0) > 0;
}

export async function counts(): Promise<Record<string, number>> {
  const rows = (await query(
    "anime",
    "SELECT status, COUNT(*) as c FROM error_reports GROUP BY status"
  )) as { status: string; c: number }[];

  const out: Record<string, number> = { total: 0, open: 0, ack: 0, closed: 0 };
  for (const r of rows) {
    const n = Number(r.c) || 0;
    if (r.status in out) out[r.status] = n;
    out.total += n;
  }
  return out;
}
