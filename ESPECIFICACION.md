# Check list Técnico — especificación actual (backend Node + SPA)

Documento vivo del producto **después** de la implementación del servidor. El archivo `index.html` se **genera** con `python3 scripts/build-index.py`; no se edita a mano.

## Qué es

SPA en vanilla JS + CSS + HTML, servida por **Express (TypeScript)** en el mismo origen. API REST `/api/v1`, SQLite, sesiones HttpOnly, fotos y firmas en disco.

- **Admin de empresa:** registra la empresa, aprueba inspectores, configura logo/datos, ve historial de la empresa.
- **Inspector:** solicita acceso con el **código de 6 letras** de la empresa; queda `pending` hasta que el admin aprueba.

## Cómo ejecutar (desarrollo / VPS)

```bash
cd server
cp .env.example .env   # opcional
npm install
npm start
```

Abre **http://127.0.0.1:3000/** (en el VPS: `http://IP:3000` o el dominio con nginx).

- Base de datos: `server/data/app.db` (se crea sola).
- Archivos: `server/data/uploads/`.
- Cookie: `clt_session` (HttpOnly, SameSite=Lax). En HTTP usa `COOKIE_SECURE=0`.

## Arquitectura

```
Navegador (index.html + js/*.js)
        │  fetch credentials:include
        ▼
Express  GET /*  estáticos (SPA)
         /api/v1/*  JSON + cookie
         SQLite + bcryptjs + disco
```

**No** hay jsonblob. **No** hay SHA-256 de contraseñas. El historial **no** vive en localStorage (solo caché de UI).

## API (cookie de sesión)

Prefijo `/api/v1`. Cuerpos JSON. Fotos/logo/firmas se envían como **data URL**; el servidor las guarda en disco y devuelve `/api/v1/files/<uuid>.<ext>`.

| Método | Ruta | Quién | Notas |
|--------|------|--------|--------|
| GET | `/health` | público | `{ ok, db }` |
| POST | `/auth/register-company` | público | empresa + primer admin `approved` |
| POST | `/auth/login` | público | `{ username, password, companyCode? }` |
| POST | `/auth/logout` | sesión | |
| GET | `/auth/me` | sesión | usuario + empresa |
| POST | `/auth/request-access` | público | inspector `pending` |
| GET/PATCH | `/auth/company` | admin | datos + logo |
| GET | `/auth/company/users` | admin | lista |
| POST | `/auth/company/users/:id/approve` | admin | |
| POST | `/auth/company/users/:id/reject` | admin | |
| GET | `/inspections` | approved | lista empresa |
| POST | `/inspections` | approved | crea informe |
| GET | `/inspections/:id` | approved | detalle |
| GET | `/public/inspections/:token` | público | QR / compartir |
| GET | `/files/:name` | público | binario (uuid.ext) |

Rate limit: 20 req / 15 min en register, login y request-access (por IP).

## Roles y estados

- `role`: `admin` | `inspector`
- `status`: `pending` | `approved` | `rejected`
- Admin de empresa: `approved` al registrar.
- Inspector: `pending` hasta approve. Con `pending` o `rejected` no puede listar/crear inspecciones (403).

## Datos persistidos (SQLite)

Tablas: `companies`, `users`, `sessions`, `inspections`, `inspection_items`, `inspection_photos`.

Campos de inspección (todos obligatorios en UI): cliente, faena, marca, modelo, año, n° interno, horómetro, fecha, observaciones, ítems OK/falla, fotos, firma inspector, firma responsable.

PDF = **impresión del navegador** (CSS US Letter), no un PDF binario en el servidor.

## Front (vanilla, conservar)

- Hash: `#/`, `#/login`, `#/registro`, `#/acceso`, `#/unirse/<CODE>`, `#/app`, `#/tipos`, `#/nuevo/<id>`, `#/historial`, `#/informe/<id>`, `#/r/<shareToken>`, `#/ajustes`, `#/admin/equipo`.
- Catálogo: `js/data.js` `MEC_TEMPLATES` + `img/equipos/<id>.jpg`.
- Cliente API: `js/api.js` (`window.MEC_API`).
- Idioma UI: español de Chile.

## Seguridad (mínimo actual)

- bcryptjs cost 12.
- Sesión opaca en SQLite, cookie HttpOnly.
- Rate limit en auth.
- Validación de tipos MIME de imágenes.
- Archivos servidos solo si el nombre es uuid + extensión permitida.

Pendiente (hardening): HTTPS, `COOKIE_SECURE=1`, nginx (`server/deploy/`), copias de `app.db`, rotación de secretos, auditoría.

## GitHub Pages

**No** sirve este stack (no hay API ni disco). Usar el VPS Node.

## Archivos clave

| Ruta | Rol |
|------|-----|
| `server/src/` | Express + SQLite |
| `js/api.js` | Cliente REST |
| `js/auth.js` | Login / registro / aprobación |
| `js/app.js` | Inspecciones / PDF / QR |
| `scripts/build-index.py` | Genera `index.html` |
