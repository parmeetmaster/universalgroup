import { query } from "@/lib/db";
import * as argon2 from "argon2";
import crypto from "crypto";

interface AdminUser {
  id: number;
  email: string;
  password_hash: string;
  session_token: string | null;
  session_expires_at: string | null;
}

function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function sessionExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 19).replace("T", " ");
}

export async function login(
  email: string,
  password: string
): Promise<{ token: string; email: string }> {
  const normalized = (email || "").trim().toLowerCase();

  const rows = (await query(
    "pak",
    "SELECT id, email, password_hash FROM admin_users WHERE email = ?",
    [normalized]
  )) as AdminUser[];

  const user = rows[0];
  if (!user) throw new Error("invalid email or password");

  const ok = await argon2.verify(user.password_hash, password ?? "");
  if (!ok) throw new Error("invalid email or password");

  const token = generateToken();
  const expires = sessionExpiry();

  await query(
    "pak",
    "UPDATE admin_users SET session_token = ?, session_expires_at = ? WHERE id = ?",
    [token, expires, user.id]
  );

  return { token, email: user.email };
}

export async function verifySession(
  token: string
): Promise<{ id: number; email: string } | null> {
  if (!token) return null;

  const rows = (await query(
    "pak",
    "SELECT id, email, session_expires_at FROM admin_users WHERE session_token = ?",
    [token]
  )) as { id: number; email: string; session_expires_at: string }[];

  const user = rows[0];
  if (!user) return null;

  if (new Date(user.session_expires_at) < new Date()) return null;

  return { id: user.id, email: user.email };
}

export async function changePassword(
  sessionToken: string,
  oldPassword: string,
  newPassword: string
): Promise<{ token: string }> {
  const rows = (await query(
    "pak",
    "SELECT id, password_hash FROM admin_users WHERE session_token = ?",
    [sessionToken]
  )) as AdminUser[];

  const user = rows[0];
  if (!user) throw new Error("invalid session");

  const ok = await argon2.verify(user.password_hash, oldPassword);
  if (!ok) throw new Error("incorrect old password");

  const newHash = await argon2.hash(newPassword);
  const newToken = generateToken();
  const expires = sessionExpiry();

  await query(
    "pak",
    "UPDATE admin_users SET password_hash = ?, session_token = ?, session_expires_at = ? WHERE id = ?",
    [newHash, newToken, expires, user.id]
  );

  return { token: newToken };
}

export async function logout(sessionToken: string): Promise<void> {
  await query(
    "pak",
    "UPDATE admin_users SET session_token = NULL, session_expires_at = NULL WHERE session_token = ?",
    [sessionToken]
  );
}
