import { NextRequest } from "next/server";
import { json, requireUser } from "@/lib/api";
import { hashPassword } from "@/lib/auth";
import { logActivity, row, rows, run } from "@/lib/db";

export async function GET(request: NextRequest) {
  const auth = requireUser(request);
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin") return json({ error: "Forbidden" }, 403);
  return json({
    users: rows<any>(
      `select users.id, users.name, users.email, users.is_active, roles.name as role, users.created_at
       from users join roles on roles.id = users.role_id order by users.created_at desc`
    ),
    roles: rows<any>("select * from roles order by id")
  });
}

export async function POST(request: NextRequest) {
  const auth = requireUser(request);
  if ("error" in auth) return auth.error;
  if (auth.user.role !== "Admin") return json({ error: "Forbidden" }, 403);
  const body = await request.json();
  const role = row<any>("select id from roles where name = ?", [body.role]);
  if (!role) return json({ error: "Invalid role" }, 400);
  const result = run("insert into users (name, email, password_hash, role_id) values (?, ?, ?, ?)", [
    body.name,
    String(body.email).toLowerCase(),
    hashPassword(body.password || "password123"),
    role.id
  ]);
  logActivity({ userId: auth.user.id, action: "User created", module: "Users", newValue: { userId: result.lastInsertRowid, email: body.email } });
  return json({ id: result.lastInsertRowid }, 201);
}
