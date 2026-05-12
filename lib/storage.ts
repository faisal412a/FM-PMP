import fs from "node:fs";
import path from "node:path";

export const dataDir = process.env.DATA_DIR || process.env.RAILWAY_VOLUME_MOUNT_PATH || path.join(process.cwd(), "data");

export function uploadDir(projectId: number) {
  const dir = path.join(dataDir, "uploads", String(projectId));
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function safeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "upload";
}
