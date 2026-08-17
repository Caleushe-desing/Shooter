import { Router } from "express";
import { getDb } from "./db.js";
import { requireApproved, requireAuth } from "./auth.js";
import { publicFileUrl, saveDataUrl, shareToken, makeInspectionId, nowISO } from "./util.js";

export const inspectionsRouter = Router();
inspectionsRouter.use(requireAuth, requireApproved);

type ItemIn = { id?: string; text?: string; result?: string; note?: string };

function toClient(row: Record<string, unknown>, items: Record<string, unknown>[], photos: string[]) {
  const logo = publicFileUrl(String(row.logo_path || ""));
  return {
    id: row.id,
    createdAt: row.created_at,
    company: row.company_name,
    rut: row.rut,
    branch: row.branch,
    companyLogo: logo,
    type: row.type,
    typeName: row.type_name,
    group: row.group_name,
    equipment: {
      code: row.equipment_code || "",
      location: row.location || "",
      photos,
      photo: photos[photos.length - 1] || "",
    },
    inspector: row.inspector_name,
    cargo: row.cargo,
    items: items.map((it) => ({
      id: it.item_id,
      text: it.text,
      result: it.result || "",
      note: it.note || "",
    })),
    observations: row.observations || "",
    verdict: row.verdict || "",
    signatures: {
      inspector: publicFileUrl(row.inspector_sig_path as string),
      supervisor: publicFileUrl(row.supervisor_sig_path as string),
    },
    strokes: {
      inspector: parseJson(row.inspector_strokes, []),
      supervisor: parseJson(row.supervisor_strokes, []),
    },
    supervisorName: row.supervisor_name || "",
    blobId: row.share_token,
    shareCode: "",
    shareToken: row.share_token,
  };
}

function parseJson(raw: unknown, fallback: unknown) {
  if (!raw || typeof raw !== "string") return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function loadFull(id: string, companyId: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT i.*, c.name AS company_name, c.rut, c.branch, c.logo_path
       FROM inspections i JOIN companies c ON c.id = i.company_id
       WHERE i.id = ? AND i.company_id = ?`
    )
    .get(id, companyId) as Record<string, unknown> | undefined;
  if (!row) return null;
  const items = db
    .prepare("SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY sort_order")
    .all(id) as Record<string, unknown>[];
  const photoRows = db
    .prepare("SELECT path FROM inspection_photos WHERE inspection_id = ? ORDER BY sort_order")
    .all(id) as { path: string }[];
  return toClient(
    row,
    items,
    photoRows.map((p) => publicFileUrl(p.path))
  );
}

export function loadPublic(token: string) {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT i.*, c.name AS company_name, c.rut, c.branch, c.logo_path
       FROM inspections i JOIN companies c ON c.id = i.company_id
       WHERE i.share_token = ?`
    )
    .get(token) as Record<string, unknown> | undefined;
  if (!row) return null;
  const id = String(row.id);
  const items = db
    .prepare("SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY sort_order")
    .all(id) as Record<string, unknown>[];
  const photoRows = db
    .prepare("SELECT path FROM inspection_photos WHERE inspection_id = ? ORDER BY sort_order")
    .all(id) as { path: string }[];
  return toClient(
    row,
    items,
    photoRows.map((p) => publicFileUrl(p.path))
  );
}

inspectionsRouter.get("/", (req, res) => {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT i.*, c.name AS company_name, c.rut, c.branch, c.logo_path
       FROM inspections i JOIN companies c ON c.id = i.company_id
       WHERE i.company_id = ?
       ORDER BY i.created_at DESC
       LIMIT 200`
    )
    .all(req.auth!.company.id) as Record<string, unknown>[];
  const list = rows.map((row) => {
    const items = db
      .prepare("SELECT * FROM inspection_items WHERE inspection_id = ? ORDER BY sort_order")
      .all(row.id) as Record<string, unknown>[];
    const photoRows = db
      .prepare("SELECT path FROM inspection_photos WHERE inspection_id = ? ORDER BY sort_order")
      .all(row.id) as { path: string }[];
    return toClient(
      row,
      items,
      photoRows.map((p) => publicFileUrl(p.path))
    );
  });
  res.json({ inspections: list });
});

inspectionsRouter.get("/:id", (req, res) => {
  const full = loadFull(req.params.id, req.auth!.company.id);
  if (!full) {
    res.status(404).json({ error: "No está esta inspección." });
    return;
  }
  res.json({ inspection: full });
});

inspectionsRouter.post("/", (req, res) => {
  const b = req.body || {};
  const items: ItemIn[] = Array.isArray(b.items) ? b.items : [];
  if (!String(b.typeName || b.type || "").trim()) {
    res.status(400).json({ error: "Falta qué se inspecciona." });
    return;
  }
  const photosIn: string[] = [];
  if (Array.isArray(b.equipment?.photos)) photosIn.push(...b.equipment.photos);
  else if (b.equipment?.photo) photosIn.push(b.equipment.photo);
  const photoPaths = photosIn
    .slice(0, 8)
    .map((p, i) => saveDataUrl(p, "photo" + i))
    .filter(Boolean);
  const id = String(b.id || "").trim() || makeInspectionId();
  const ts = String(b.createdAt || nowISO());
  const db = getDb();
  const exists = db
    .prepare("SELECT id, company_id, share_token FROM inspections WHERE id = ?")
    .get(id) as { id: string; company_id: string; share_token: string } | undefined;
  if (exists && exists.company_id !== req.auth!.company.id) {
    res.status(409).json({ error: "Ese identificador ya existe." });
    return;
  }
  const token = exists?.share_token || shareToken();
  const inspectorSig = saveDataUrl(b.signatures?.inspector, "sig-insp");
  const supervisorSig = saveDataUrl(b.signatures?.supervisor, "sig-sup");
  const tx = db.transaction(() => {
    if (exists) {
      db.prepare("DELETE FROM inspections WHERE id = ? AND company_id = ?").run(id, req.auth!.company.id);
    }
    db.prepare(
      `INSERT INTO inspections (
        id, company_id, user_id, type, type_name, group_name, equipment_code, location,
        inspector_name, cargo, observations, verdict, supervisor_name,
        inspector_strokes, supervisor_strokes, inspector_sig_path, supervisor_sig_path,
        share_token, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      req.auth!.company.id,
      req.auth!.user.id,
      String(b.type || "libre"),
      String(b.typeName || ""),
      String(b.group || ""),
      String(b.equipment?.code || ""),
      String(b.equipment?.location || ""),
      String(b.inspector || req.auth!.user.name),
      String(b.cargo || ""),
      String(b.observations || ""),
      String(b.verdict || ""),
      String(b.supervisorName || ""),
      JSON.stringify(b.strokes?.inspector || []),
      JSON.stringify(b.strokes?.supervisor || []),
      inspectorSig || null,
      supervisorSig || null,
      token,
      ts
    );
    const insItem = db.prepare(
      "INSERT INTO inspection_items (inspection_id, sort_order, item_id, text, result, note) VALUES (?, ?, ?, ?, ?, ?)"
    );
    items.forEach((it, i) => {
      insItem.run(id, i, it.id || "p-" + (i + 1), String(it.text || ""), String(it.result || ""), String(it.note || ""));
    });
    const insPhoto = db.prepare("INSERT INTO inspection_photos (inspection_id, sort_order, path) VALUES (?, ?, ?)");
    photoPaths.forEach((p, i) => insPhoto.run(id, i, p));
  });
  try {
    tx();
  } catch (e) {
    res.status(500).json({ error: "No se pudo guardar la inspección." });
    return;
  }
  const full = loadFull(id, req.auth!.company.id);
  res.status(201).json({ inspection: full });
});
