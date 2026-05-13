import { query } from "@/lib/db";

const KEY_PATTERN = /^[a-zA-Z0-9._-]{1,128}$/;

function assertValidKey(key: string) {
  if (!KEY_PATTERN.test(key)) {
    throw new Error("key must match /^[a-zA-Z0-9._-]{1,128}$/");
  }
}

export interface KvEntry {
  key: string;
  value: unknown;
  updated_at: Date;
}

export async function get(key: string): Promise<KvEntry | null> {
  assertValidKey(key);
  const rows = (await query(
    "anime",
    "SELECT `key`, `value`, `updated_at` FROM kv_entries WHERE `key` = ?",
    [key]
  )) as KvEntry[];
  if (rows.length === 0) return null;
  const row = rows[0];
  row.value = typeof row.value === "string" ? JSON.parse(row.value) : row.value;
  return row;
}

export async function all(): Promise<KvEntry[]> {
  const rows = (await query(
    "anime",
    "SELECT `key`, `value`, `updated_at` FROM kv_entries ORDER BY `key` ASC"
  )) as KvEntry[];
  return rows.map((r) => ({
    ...r,
    value: typeof r.value === "string" ? JSON.parse(r.value as string) : r.value,
  }));
}

export async function set(key: string, value: unknown): Promise<KvEntry> {
  assertValidKey(key);
  if (value === undefined) throw new Error("value is required");
  const json = JSON.stringify(value);
  await query(
    "anime",
    "INSERT INTO kv_entries (`key`, `value`, `updated_at`) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), `updated_at` = NOW()",
    [key, json]
  );
  return (await get(key))!;
}

export async function del(key: string): Promise<boolean> {
  assertValidKey(key);
  const result = (await query(
    "anime",
    "DELETE FROM kv_entries WHERE `key` = ?",
    [key]
  )) as { affectedRows: number };
  return (result.affectedRows ?? 0) > 0;
}
