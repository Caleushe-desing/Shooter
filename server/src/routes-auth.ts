import { Router } from "express";
import rateLimit from "express-rate-limit";
import { COOKIE_NAME } from "./config.js";
import { getDb } from "./db.js";
import {
  clearSessionCookie,
  createSession,
  hashPassword,
  publicUser,
  requireAdmin,
  requireAuth,
  setSessionCookie,
  verifyPassword,
  type CompanyRow,
  type UserRow,
} from "./auth.js";
import { getCompanyByCode, listCompanyUsers, serializeCompany } from "./companies.js";
import { asyncHandler, makeCompanyCode, nowISO, saveDataUrl, uid } from "./util.js";

export const authRouter = Router();

const authLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos. Espera unos minutos." },
});

authRouter.post(
  "/register-company",
  authLimit,
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const company = String(body.company || "").trim();
    const rut = String(body.rut || "").trim();
    const branch = String(body.branch || "").trim();
    const name = String(body.name || "").trim();
    const username = String(body.username || "").trim().toLowerCase();
    const password = String(body.password || "");
    const logo = saveDataUrl(body.logo, "logo");
    if (!company || !rut || !branch || !name || !username || !password || !logo) {
      res.status(400).json({ error: "Completa empresa, RUT, sucursal, logo, tu nombre, usuario y clave." });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: "La clave debe tener al menos 4 caracteres." });
      return;
    }
    const db = getDb();
    let code = makeCompanyCode();
    for (let i = 0; i < 8; i++) {
      const exists = db.prepare("SELECT 1 FROM companies WHERE code = ?").get(code);
      if (!exists) break;
      code = makeCompanyCode();
    }
    const companyId = uid();
    const userId = uid();
    const hash = await hashPassword(password);
    const ts = nowISO();
    const tx = db.transaction(() => {
      db.prepare(
        "INSERT INTO companies (id, code, name, rut, branch, logo_path, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
      ).run(companyId, code, company, rut, branch, logo, ts, ts);
      db.prepare(
        "INSERT INTO users (id, company_id, role, status, name, username, password_hash, created_at, decided_at) VALUES (?, ?, 'admin', 'approved', ?, ?, ?, ?, ?)"
      ).run(userId, companyId, name, username, hash, ts, ts);
    });
    tx();
    const sid = createSession(userId);
    setSessionCookie(res, sid);
    const org = serializeCompany({
      id: companyId,
      code,
      name: company,
      rut,
      branch,
      logo_path: logo,
      created_at: ts,
      updated_at: ts,
    });
    res.status(201).json({
      session: {
        role: "admin",
        companyCode: code,
        blobId: code,
        userId,
        user: username,
        name,
        status: "approved",
      },
      company: org,
    });
  })
);

authRouter.post(
  "/login",
  authLimit,
  asyncHandler(async (req, res) => {
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    const companyCode = String(req.body?.companyCode || req.body?.invite || "")
      .trim()
      .toUpperCase()
      .split(".")[0];
    if (!username || !password) {
      res.status(400).json({ error: "Ingresa usuario y clave." });
      return;
    }
    const db = getDb();
    let user: UserRow | undefined;
    let company: CompanyRow | undefined;
    if (companyCode) {
      company = getCompanyByCode(companyCode);
      if (!company) {
        res.status(404).json({ error: "No encontramos esa empresa. Revisa el código." });
        return;
      }
      user = db
        .prepare("SELECT * FROM users WHERE company_id = ? AND username = ?")
        .get(company.id, username) as UserRow | undefined;
    } else {
      const matches = db.prepare("SELECT * FROM users WHERE username = ? AND role = 'admin'").all(username) as UserRow[];
      if (matches.length === 1) {
        user = matches[0];
        company = db.prepare("SELECT * FROM companies WHERE id = ?").get(user.company_id) as CompanyRow;
      } else if (matches.length > 1) {
        res.status(400).json({ error: "Hay varias empresas con ese usuario. Pega el código de empresa." });
        return;
      }
    }
    if (!user || !company || !(await verifyPassword(password, user.password_hash))) {
      res.status(401).json({ error: "Usuario o clave incorrectos." });
      return;
    }
    if (user.role !== "admin" && user.status === "rejected") {
      res.status(403).json({ error: "El administrador rechazó tu acceso.", status: "rejected" });
      return;
    }
    const sid = createSession(user.id);
    setSessionCookie(res, sid);
    const role = user.role === "admin" ? "admin" : "user";
    if (role === "user" && user.status !== "approved") {
      res.status(200).json({
        pending: true,
        session: {
          role,
          companyCode: company.code,
          blobId: company.code,
          userId: user.id,
          user: user.username,
          name: user.name,
          status: user.status,
        },
        company: serializeCompany(company),
      });
      return;
    }
    res.json({
      session: {
        role,
        companyCode: company.code,
        blobId: company.code,
        userId: user.id,
        user: user.username,
        name: user.name,
        status: user.status,
      },
      company: serializeCompany(company),
    });
  })
);

authRouter.post("/logout", (req, res) => {
  const sid = req.cookies?.[COOKIE_NAME];
  if (sid) getDb().prepare("DELETE FROM sessions WHERE id = ?").run(sid);
  clearSessionCookie(res);
  res.json({ ok: true });
});

authRouter.get("/me", requireAuth, (req, res) => {
  const { user, company } = req.auth!;
  const role = user.role === "admin" ? "admin" : "user";
  res.json({
    session: {
      role,
      companyCode: company.code,
      blobId: company.code,
      userId: user.id,
      user: user.username,
      name: user.name,
      status: user.status,
    },
    company: serializeCompany(company),
    me: publicUser(user),
  });
});

authRouter.post(
  "/request-access",
  authLimit,
  asyncHandler(async (req, res) => {
    const invite = String(req.body?.companyCode || req.body?.invite || "").trim();
    const name = String(req.body?.name || "").trim();
    const username = String(req.body?.username || "").trim().toLowerCase();
    const password = String(req.body?.password || "");
    if (!invite || !name || !username || !password) {
      res.status(400).json({ error: "Completa código de empresa, nombre, usuario y clave." });
      return;
    }
    if (password.length < 4) {
      res.status(400).json({ error: "La clave debe tener al menos 4 caracteres." });
      return;
    }
    const code = invite.toUpperCase().split(".")[0];
    const company = getCompanyByCode(code);
    if (!company) {
      res.status(404).json({ error: "No encontramos esa empresa. Pide al administrador el código." });
      return;
    }
    const db = getDb();
    const existing = db
      .prepare("SELECT * FROM users WHERE company_id = ? AND username = ?")
      .get(company.id, username) as UserRow | undefined;
    if (existing) {
      if (existing.role === "admin") {
        res.status(409).json({ error: "Ese usuario es el administrador. Entra por ingreso admin." });
        return;
      }
      res.status(409).json({ error: "Ese usuario ya pidió acceso. Entra o espera la autorización." });
      return;
    }
    const userId = uid();
    const hash = await hashPassword(password);
    const ts = nowISO();
    db.prepare(
      "INSERT INTO users (id, company_id, role, status, name, username, password_hash, created_at) VALUES (?, ?, 'inspector', 'pending', ?, ?, ?, ?)"
    ).run(userId, company.id, name, username, hash, ts);
    const sid = createSession(userId);
    setSessionCookie(res, sid);
    res.status(201).json({
      pending: true,
      session: {
        role: "user",
        companyCode: company.code,
        blobId: company.code,
        userId,
        user: username,
        name,
        status: "pending",
      },
      company: serializeCompany(company),
    });
  })
);

authRouter.get("/company", requireAuth, (req, res) => {
  res.json({ company: serializeCompany(req.auth!.company, listCompanyUsers(req.auth!.company.id)) });
});

authRouter.patch(
  "/company",
  requireAuth,
  requireAdmin,
  asyncHandler(async (req, res) => {
    const c = req.auth!.company;
    const name = String(req.body?.company || c.name).trim();
    const rut = String(req.body?.rut || c.rut).trim();
    const branch = String(req.body?.branch || c.branch).trim();
    let logoPath = c.logo_path;
    if (req.body?.logo && String(req.body.logo).startsWith("data:")) {
      const saved = saveDataUrl(req.body.logo, "logo");
      if (saved) logoPath = saved;
    }
    if (!name || !rut || !branch) {
      res.status(400).json({ error: "Nombre, RUT y sucursal son obligatorios." });
      return;
    }
    const ts = nowISO();
    getDb()
      .prepare("UPDATE companies SET name = ?, rut = ?, branch = ?, logo_path = ?, updated_at = ? WHERE id = ?")
      .run(name, rut, branch, logoPath, ts, c.id);
    const inspector = String(req.body?.inspector || "").trim();
    if (inspector) {
      getDb().prepare("UPDATE users SET name = ? WHERE id = ?").run(inspector, req.auth!.user.id);
    }
    const updated = getDb().prepare("SELECT * FROM companies WHERE id = ?").get(c.id) as CompanyRow;
    res.json({ company: serializeCompany(updated) });
  })
);

authRouter.get("/company/users", requireAuth, requireAdmin, (req, res) => {
  res.json({ company: serializeCompany(req.auth!.company, listCompanyUsers(req.auth!.company.id)) });
});

authRouter.post("/company/users/:id/approve", requireAuth, requireAdmin, (req, res) => {
  setStatus(req, res, "approved");
});

authRouter.post("/company/users/:id/reject", requireAuth, requireAdmin, (req, res) => {
  setStatus(req, res, "rejected");
});

function setStatus(req: import("express").Request, res: import("express").Response, status: "approved" | "rejected") {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE id = ? AND company_id = ?").get(req.params.id, req.auth!.company.id) as
    | UserRow
    | undefined;
  if (!row || row.role === "admin") {
    res.status(404).json({ error: "Usuario no encontrado." });
    return;
  }
  db.prepare("UPDATE users SET status = ?, decided_at = ? WHERE id = ?").run(status, nowISO(), row.id);
  const fresh = db.prepare("SELECT * FROM users WHERE id = ?").get(row.id) as UserRow;
  res.json({ user: publicUser(fresh), company: serializeCompany(req.auth!.company, listCompanyUsers(req.auth!.company.id)) });
}
