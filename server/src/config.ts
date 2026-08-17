import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ROOT = path.resolve(__dirname, "../..");
export const SERVER_ROOT = path.resolve(__dirname, "..");
export const DATA_DIR = path.join(SERVER_ROOT, "data");
export const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
export const DB_PATH = path.join(DATA_DIR, "app.db");

function loadEnvFile(): void {
  const file = path.join(SERVER_ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i < 1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

loadEnvFile();

export const PORT = Number(process.env.PORT || 3000);
export const SESSION_DAYS = Number(process.env.SESSION_DAYS || 14);
export const COOKIE_NAME = "clt_session";
export const COOKIE_SECURE = process.env.COOKIE_SECURE === "1";
export const SESSION_SECRET = process.env.SESSION_SECRET || "";

export function ensureDirs(): void {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}
