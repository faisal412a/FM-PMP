import { NextRequest, NextResponse } from "next/server";
import { sessionFromRequest } from "./auth";
import { can } from "./permissions";

export function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

export function requireUser(request: NextRequest, action?: string) {
  const user = sessionFromRequest(request);
  if (!user) return { error: json({ error: "Authentication required" }, 401) };
  if (action && !can(user.role, action)) return { error: json({ error: "Forbidden" }, 403) };
  return { user };
}

export function parseSearch(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return Object.fromEntries(params.entries());
}
