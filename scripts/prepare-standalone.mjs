import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const standaloneDir = path.join(root, ".next", "standalone");
const standaloneNextDir = path.join(standaloneDir, ".next");

if (!fs.existsSync(standaloneDir)) {
  console.log("Standalone output not found; skipping standalone asset copy.");
  process.exit(0);
}

fs.mkdirSync(standaloneNextDir, { recursive: true });

const copies = [
  [path.join(root, ".next", "static"), path.join(standaloneNextDir, "static")],
  [path.join(root, "public"), path.join(standaloneDir, "public")]
];

for (const [from, to] of copies) {
  if (!fs.existsSync(from)) continue;
  fs.rmSync(to, { recursive: true, force: true });
  fs.cpSync(from, to, { recursive: true });
}

console.log("Standalone static assets prepared.");
