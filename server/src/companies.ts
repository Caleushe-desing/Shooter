import { getDb } from "./db.js";
import { publicFileUrl } from "./util.js";
import type { CompanyRow, UserRow } from "./auth.js";
import { publicUser } from "./auth.js";

export function getCompany(id: string): CompanyRow | undefined {
  return getDb().prepare("SELECT * FROM companies WHERE id = ?").get(id) as CompanyRow | undefined;
}

export function getCompanyByCode(code: string): CompanyRow | undefined {
  return getDb().prepare("SELECT * FROM companies WHERE code = ?").get(code.toUpperCase()) as CompanyRow | undefined;
}

export function listCompanyUsers(companyId: string): UserRow[] {
  return getDb()
    .prepare("SELECT * FROM users WHERE company_id = ? AND role = 'inspector' ORDER BY created_at DESC")
    .all(companyId) as UserRow[];
}

export function getAdmin(companyId: string): UserRow | undefined {
  return getDb().prepare("SELECT * FROM users WHERE company_id = ? AND role = 'admin' LIMIT 1").get(companyId) as
    | UserRow
    | undefined;
}

export function serializeCompany(c: CompanyRow, users?: UserRow[]) {
  const admin = getAdmin(c.id);
  return {
    id: c.id,
    v: 2,
    code: c.code,
    blobId: c.code,
    company: c.name,
    rut: c.rut,
    branch: c.branch,
    logo: publicFileUrl(c.logo_path),
    logoUrl: publicFileUrl(c.logo_path),
    admin: admin ? publicUser(admin) : null,
    users: (users || listCompanyUsers(c.id)).map(publicUser),
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}
