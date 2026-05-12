import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";

const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "pm.sqlite");
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const globalForDb = globalThis as unknown as { pmDb?: Database.Database };

export const db =
  globalForDb.pmDb ??
  new Database(dbPath, {
    fileMustExist: false
  });

if (process.env.NODE_ENV !== "production") globalForDb.pmDb = db;

db.pragma("foreign_keys = ON");

export function rows<T = Record<string, unknown>>(sql: string, params: unknown[] | Record<string, unknown> = []) {
  return db.prepare(sql).all(params) as T[];
}

export function row<T = Record<string, unknown>>(sql: string, params: unknown[] | Record<string, unknown> = []) {
  return db.prepare(sql).get(params) as T | undefined;
}

export function run(sql: string, params: unknown[] | Record<string, unknown> = []) {
  return db.prepare(sql).run(params);
}

export function logActivity(input: {
  userId?: number;
  action: string;
  module: string;
  oldValue?: unknown;
  newValue?: unknown;
}) {
  run(
    `insert into activity_logs (user_id, action, module, old_value, new_value)
     values (@userId, @action, @module, @oldValue, @newValue)`,
    {
      userId: input.userId ?? null,
      action: input.action,
      module: input.module,
      oldValue: input.oldValue == null ? null : JSON.stringify(input.oldValue),
      newValue: input.newValue == null ? null : JSON.stringify(input.newValue)
    }
  );
}
