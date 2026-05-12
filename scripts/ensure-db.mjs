import Database from "better-sqlite3";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "pm.sqlite");
fs.mkdirSync(dataDir, { recursive: true });

let shouldSeed = !fs.existsSync(dbPath);

if (!shouldSeed) {
  try {
    const db = new Database(dbPath, { readonly: true });
    const userTable = db
      .prepare("select name from sqlite_master where type = 'table' and name = 'users'")
      .get();
    shouldSeed = !userTable;
    db.close();
  } catch {
    shouldSeed = true;
  }
}

if (shouldSeed) {
  const result = spawnSync(process.execPath, ["scripts/init-db.mjs"], {
    stdio: "inherit",
    env: process.env
  });
  process.exit(result.status ?? 1);
}

console.log(`SQLite database ready at ${dbPath}`);
