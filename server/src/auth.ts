import type { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { COOKIE_NAME, COOKIE_SECURE, SESSION_DAYS } from "./config.js";
import { getDb } from "./db.js";
import { nowISO, sessionId } from "./util.js";

export type Role = "admin" | "inspector";
export type UserStatus = "pending" | "approved" | "rejected";

export type UserRow = {
  id: string;
  company_id: string;
  role: Role;
  status: UserStatus;
  name: string;
  username: string;
  password_hash: string;
  created_at: string;
  decided_at: string | null;
};

export type CompanyRow = {
  id: string;
  code: string;
  name: string;
  rut: string;
  branch: string;
  logo_path: string | null;
  created_at: string;
  updated_at: string;
};

export type Authed = {
  user: UserRow;
  company: CompanyRow;
};

declare global {
  namespace Express {
    interface Request {
      auth?: Authed;
    }
  }
}

const BCRYPT_ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function createSession(userId: string): string {
  const db = getDb();
  const now = nowISO();
  db.prepare("DELETE FROM sessions WHERE expires_at < ?").run(now);
  const id = sessionId();
  const exp = new Date(Date.now() + SESSION_DAYS * 86400_000).toISOString();
  db.prepare("INSERT INTO sessions (id, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)").run(id, userId, exp, now);
  return id;
}

export function setSessionCookie(res: Response, sid: string): void {
  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86400_000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function loadAuthFromCookie(req: Request): Authed | null {
  const sid = req.cookies?.[COOKIE_NAME];
  if (!sid) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT u.*, c.id AS c_id, c.code AS c_code, c.name AS c_name, c.rut AS c_rut,
              c.branch AS c_branch, c.logo_path AS c_logo, c.created_at AS c_created, c.updated_at AS c_updated
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN companies c ON c.id = u.company_id
       WHERE s.id = ? AND s.expires_at > ?`
    )
    .get(sid, nowISO()) as Record<string, string> | undefined;
  if (!row) return null;
  return {
    user: {
      id: row.id,
      company_id: row.company_id,
      role: row.role as Role,
      status: row.status as UserStatus,
      name: row.name,
      username: row.username,
      password_hash: row.password_hash,
      created_at: row.created_at,
      decided_at: row.decided_at,
    },
    company: {
      id: row.c_id,
      code: row.c_code,
      name: row.c_name,
      rut: row.c_rut,
      branch: row.c_branch,
      logo_path: row.c_logo,
      created_at: row.c_created,
      updated_at: row.c_updated,
    },
  };
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const auth = loadAuthFromCookie(req);
  if (!auth) {
    res.status(401).json({ error: "Inicia sesión." });
    return;
  }
  req.auth = auth;
  next();
}

export function requireApproved(req: Request, res: Response, next: NextFunction): void {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Inicia sesión." });
    return;
  }
  if (auth.user.role !== "admin" && auth.user.status !== "approved") {
    res.status(403).json({ error: "El administrador aún no autoriza tu acceso.", status: auth.user.status });
    return;
  }
  next();
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const auth = req.auth;
  if (!auth) {
    res.status(401).json({ error: "Inicia sesión." });
    return;
  }
  if (auth.user.role !== "admin") {
    res.status(403).json({ error: "Solo el administrador puede hacer esto." });
    return;
  }
  next();
}

export function publicUser(u: UserRow) {
  return {
    id: u.id,
    name: u.name,
    user: u.username,
    role: u.role === "admin" ? "admin" : "user",
    status: u.status,
    requestedAt: u.created_at,
    decidedAt: u.decided_at,
  };
}
