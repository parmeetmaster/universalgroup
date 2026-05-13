import { query } from "@/lib/db";
import * as bcrypt from "bcrypt";

export async function login(
  email: string,
  password: string
): Promise<{ token: string; email: string }> {
  const normalized = (email || "").trim().toLowerCase();

  const rows = (await query(
    "anime",
    "SELECT id, email, password_hash FROM dashboard_users WHERE email = ?",
    [normalized]
  )) as { id: number; email: string; password_hash: string }[];

  const user = rows[0];
  const hash = user?.password_hash ?? "$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv";
  const ok = await bcrypt.compare(password ?? "", hash);

  if (!user || !ok) {
    throw new Error("invalid email or password");
  }

  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken || adminToken.length < 12) {
    throw new Error("server not provisioned");
  }

  return { token: adminToken, email: normalized };
}

export async function seedUser(): Promise<void> {
  const email = process.env.SEED_LOGIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_LOGIN_PASSWORD;
  if (!email || !password) return;

  const rows = (await query(
    "anime",
    "SELECT id, password_hash FROM dashboard_users WHERE email = ?",
    [email]
  )) as { id: number; password_hash: string }[];

  if (rows.length > 0) {
    const matches = await bcrypt.compare(password, rows[0].password_hash);
    if (!matches) {
      const hash = await bcrypt.hash(password, 10);
      await query("anime", "UPDATE dashboard_users SET password_hash = ? WHERE id = ?", [hash, rows[0].id]);
    }
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  await query("anime", "INSERT INTO dashboard_users (email, password_hash) VALUES (?, ?)", [email, hash]);
}
