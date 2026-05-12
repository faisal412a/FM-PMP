import crypto from "node:crypto";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { row } from "./db";
import type { RoleName, SessionUser } from "./types";

const COOKIE_NAME = "pm_session";
const secret = process.env.AUTH_SECRET || "local-dev-change-me";

export function hashPassword(password: string, salt = "pm-local-salt") {
  return crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
}

function sign(payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

export function createSessionToken(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify({ ...user, exp: Date.now() + 1000 * 60 * 60 * 10 })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function verifyToken(token?: string): SessionUser | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature || sign(payload) !== signature) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed.exp || parsed.exp < Date.now()) return null;
  return { id: parsed.id, name: parsed.name, email: parsed.email, role: parsed.role };
}

export function sessionFromRequest(request: NextRequest) {
  return verifyToken(request.cookies.get(COOKIE_NAME)?.value);
}

export async function currentUser() {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(COOKIE_NAME)?.value);
}

export function cookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 10
  };
}

export function findLoginUser(email: string) {
  return row<{ id: number; name: string; email: string; password_hash: string; role: RoleName }>(
    `select users.id, users.name, users.email, users.password_hash, roles.name as role
     from users join roles on roles.id = users.role_id
     where users.email = ? and users.is_active = 1`,
    [email]
  );
}
