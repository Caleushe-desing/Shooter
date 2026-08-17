import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { UPLOAD_DIR } from "./config.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function nowISO(): string {
  return new Date().toISOString();
}

export function uid(prefix = ""): string {
  const id = crypto.randomUUID();
  return prefix ? prefix + id : id;
}

export function makeCompanyCode(): string {
  let s = "";
  for (let i = 0; i < 6; i++) s += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  return s;
}

export function makeInspectionId(): string {
  const d = new Date();
  const p =
    String(d.getFullYear()).slice(2) +
    String(d.getMonth() + 1).padStart(2, "0") +
    String(d.getDate()).padStart(2, "0");
  const r = crypto.randomBytes(2).toString("hex").toUpperCase();
  return "MC-" + p + "-" + r;
}

export function sessionId(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function shareToken(): string {
  return crypto.randomBytes(18).toString("base64url");
}

export function publicFileUrl(fileName: string | null | undefined): string {
  if (!fileName) return "";
  return "/api/v1/files/" + encodeURIComponent(path.basename(fileName));
}

const DATA_URL_RE = /^data:(image\/(?:png|jpeg|jpg|webp));base64,(.+)$/i;

export function saveDataUrl(dataUrl: string | undefined | null, hint = "bin"): string {
  if (!dataUrl || typeof dataUrl !== "string") return "";
  const m = dataUrl.trim().match(DATA_URL_RE);
  if (!m) return "";
  const mime = m[1].toLowerCase();
  const buf = Buffer.from(m[2], "base64");
  if (buf.length < 32 || buf.length > 3_500_000) return "";
  const ext = mime.includes("png") ? ".png" : mime.includes("webp") ? ".webp" : ".jpg";
  const name = hint + "-" + crypto.randomBytes(12).toString("hex") + ext;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return name;
}

export function asyncHandler(
  fn: (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => Promise<unknown>
) {
  return (req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
