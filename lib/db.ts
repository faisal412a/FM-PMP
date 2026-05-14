import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import { dataDir } from "./storage";

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
db.pragma("ignore_check_constraints = ON");

function ensureColumn(table: string, column: string, definition: string) {
  const columns = db.prepare(`pragma table_info(${table})`).all() as Array<{ name: string }>;
  if (!columns.some((item) => item.name === column)) {
    db.prepare(`alter table ${table} add column ${column} ${definition}`).run();
  }
}

ensureColumn("project_quotes", "supplier_name", "text");
ensureColumn("payment_terms", "progress_trigger_percentage", "real not null default 0");

db.exec(`
create table if not exists suppliers (
  id integer primary key autoincrement,
  name text not null unique,
  arabic_name text,
  contact_person text,
  email text,
  phone text,
  secondary_phone text,
  vat_number text,
  cr_number text,
  national_address text,
  has_whatsapp integer not null default 0,
  category text,
  notes text,
  created_at text not null default current_timestamp
);

create table if not exists supplier_documents (
  id integer primary key autoincrement,
  supplier_name text not null,
  document_type text not null,
  file_name text not null,
  file_path text,
  uploaded_by integer references users(id),
  uploaded_at text not null default current_timestamp
);
`);

ensureColumn("suppliers", "arabic_name", "text");
ensureColumn("suppliers", "secondary_phone", "text");
ensureColumn("suppliers", "vat_number", "text");
ensureColumn("suppliers", "cr_number", "text");
ensureColumn("suppliers", "national_address", "text");
ensureColumn("suppliers", "has_whatsapp", "integer not null default 0");

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
