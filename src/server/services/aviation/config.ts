import { query } from "@/lib/db";

interface ConfigRow {
  key: string;
  value: string;
}

export async function getConfig(): Promise<Record<string, unknown>> {
  const rows = (await query(
    "aviation",
    "SELECT `key`, `value` FROM app_config"
  )) as ConfigRow[];

  const result: Record<string, unknown> = {};
  for (const row of rows) {
    try {
      result[row.key] = JSON.parse(row.value);
    } catch {
      result[row.key] = row.value;
    }
  }
  return result;
}

export async function updateConfig(patch: Record<string, unknown>): Promise<void> {
  const entries = Object.entries(patch);
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    const jsonVal = JSON.stringify(value);
    await query(
      "aviation",
      `INSERT INTO app_config (\`key\`, \`value\`, updated_at)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`), updated_at = NOW()`,
      [key, jsonVal]
    );
  }
}
