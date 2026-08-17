import fs from "node:fs";
import path from "node:path";
import express, { type NextFunction, type Request, type Response } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ROOT, UPLOAD_DIR } from "./config.js";
import { getDb } from "./db.js";
import { authRouter } from "./routes-auth.js";
import { inspectionsRouter, loadPublic } from "./routes-inspections.js";

export function createApp() {
  getDb();
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    })
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "12mb" }));
  app.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.get("/api/v1/health", (_req, res) => {
    try {
      getDb().prepare("SELECT 1").get();
      res.json({ ok: true, name: "Check list Técnico", db: true });
    } catch {
      res.status(500).json({ ok: false, db: false });
    }
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/inspections", inspectionsRouter);

  app.get("/api/v1/public/inspections/:token", (req, res) => {
    const full = loadPublic(req.params.token);
    if (!full) {
      res.status(404).json({ error: "Ficha no encontrada" });
      return;
    }
    res.json(full);
  });

  app.get("/api/v1/files/:name", (req, res) => {
    const name = path.basename(req.params.name);
    if (!/^[a-z0-9-]+-[a-f0-9]{24}\.(png|jpe?g|webp)$/i.test(name)) {
      res.status(400).end();
      return;
    }
    const file = path.join(UPLOAD_DIR, name);
    if (!fs.existsSync(file)) {
      res.status(404).end();
      return;
    }
    res.setHeader("Cache-Control", "private, max-age=86400");
    res.sendFile(file);
  });

  app.use(express.static(ROOT, { extensions: ["html"], index: "index.html" }));

  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error(err);
    res.status(500).json({ error: "Error interno." });
  });

  return app;
}
