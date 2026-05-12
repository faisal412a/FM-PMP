import { NextRequest, NextResponse } from "next/server";
import { cookieOptions, createSessionToken, findLoginUser, hashPassword } from "@/lib/auth";
import { json } from "@/lib/api";
import { logActivity } from "@/lib/db";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const email = String(body.email || "").toLowerCase().trim();
  const password = String(body.password || "");
  const user = findLoginUser(email);

  if (!user || user.password_hash !== hashPassword(password)) {
    return json({ error: "Invalid email or password" }, 401);
  }

  const sessionUser = { id: user.id, name: user.name, email: user.email, role: user.role };
  const response = NextResponse.json({ user: sessionUser });
  response.cookies.set({ ...cookieOptions(), value: createSessionToken(sessionUser) });
  logActivity({ userId: user.id, action: "User login", module: "Authentication", newValue: { email } });
  return response;
}
