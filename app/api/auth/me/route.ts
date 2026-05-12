import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";

export async function GET(request: NextRequest) {
  const auth = requireUser(request);
  if ("error" in auth) return auth.error;
  return json({ user: auth.user });
}
