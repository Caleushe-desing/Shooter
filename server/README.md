# API Check list Técnico

Backend Node.js + Express + TypeScript + SQLite.

## Desarrollo

```bash
cd server
cp .env.example .env   # opcional
npm install
npm start
```

Abre **http://127.0.0.1:3000/** (la SPA y `/api/v1` en el mismo origen).

## Producción (VPS)

- Node 20+
- `COOKIE_SECURE=1` detrás de HTTPS
- systemd + nginx: ver `server/deploy/`
- Respaldo: `server/data/app.db` y `server/data/uploads/`

## Rutas

- `GET /api/v1/health`
- `POST /api/v1/auth/register-company`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `POST /api/v1/auth/request-access`
- `GET|PATCH /api/v1/auth/company`
- `GET /api/v1/auth/company/users`
- `POST /api/v1/auth/company/users/:id/approve|reject`
- `GET|POST /api/v1/inspections`
- `GET /api/v1/inspections/:id`
- `GET /api/v1/public/inspections/:token`
- `GET /api/v1/files/:name`
