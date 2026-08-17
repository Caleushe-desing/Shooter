import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { DB_PATH, ensureDirs, SERVER_ROOT } from "./config.js";

export type Db = Database.Database;

let db: Db | null = null;

export function getDb(): Db {
  if (db) return db;
  ensureDirs();
  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  const schema = fs.readFileSync(path.join(SERVER_ROOT, "src/schema.sql"), "utf8");
  db.exec(schema);
  return db;
}
