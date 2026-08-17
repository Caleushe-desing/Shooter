# Especificación actual — Check list Técnico

Documento de handoff para continuar el desarrollo (p. ej. con Gemini). Describe **lo que hay hoy**, no un roadmap.

- **Producto:** Check list Técnico
- **Repo:** https://github.com/Caleushe-desing/Shooter
- **Rama de trabajo:** `cursor/checklist-mecanica-9fc5`
- **PR:** https://github.com/Caleushe-desing/Shooter/pull/8
- **Idioma UI:** español de Chile (`es-CL` en fechas)
- **Stack:** HTML + CSS + JS vanilla. Sin framework, sin bundler, sin backend propio, sin npm.
- **Público objetivo:** empresas / talleres / terreno. Inspección diaria de equipos en el celular. **No reemplaza certificaciones ni fiscalizaciones oficiales** (texto legal en la app).

---

## 1. Qué hace el producto (visión de usuario)

App móvil (SPA) para inspecciones genéricas:

1. El **administrador de una empresa** registra la empresa (nombre, RUT, sucursal, logo) y autoriza inspectores.
2. El **usuario/inspector** pide acceso con un código de empresa y **no puede inspeccionar hasta que el admin lo autorice**.
3. El inspector elige un **tipo de equipo** (catálogo con foto JPG).
4. Completa **todos** los campos, marca cada punto (OK / Falla / N/A), si hay falla anota el detalle.
5. Al **final** saca **al menos una foto** del equipo (cámara o galería), máximo 8.
6. Elige resultado (apto / observado / rechazado), observaciones, **firma inspector + firma supervisor**.
7. Se genera **QR** para compartir la ficha y **PDF formato carta** (US Letter 8,5 × 11 in).
8. El historial de inspecciones vive en **localStorage de ese navegador** (ese celular). No hay cuenta en la nube de inspecciones.

Hay una **web de bienvenida** (`#/` o hash vacío) con fotos e información, y botones **Ingreso administrador** / **Ingreso usuarios**.

---

## 2. Arquitectura

SPA de una sola página. Enrutado por `location.hash`. Render manual: funciones que devuelven HTML string → `$app.innerHTML` → `bindUi()`.

### Archivos fuente (editar estos, no el HTML generado)

| Archivo | Rol |
|---|---|
| `js/data.js` | `window.MEC_TEMPLATES` (30 tipos) y `window.MEC_VERDICTS` (3 resultados). |
| `js/auth.js` | Bienvenida, login/registro admin y usuario, org, autorización. Expone `window.MEC_AUTH`. |
| `js/app.js` | Router, formulario de inspección, firmas, QR, PDF, historial, ajustes. |
| `js/qrcode.min.js` | Librería vendored `qrcode-generator` 1.4.4. |
| `css/app.css` | Estilos (móvil first, paleta steel/amarillo). |
| `img/equipos/<id>.jpg` | 30 fotos de catálogo. El `id` coincide con `template.id` (excepto `libre`, sin foto). |
| `icon.svg` | Icono. |
| `manifest.webmanifest` | PWA mínima (`display: standalone`). |
| `scripts/build-index.py` | Concatena CSS+JS en un `index.html` autocontenido. |
| `.github/workflows/pages.yml` | Deploy GitHub Pages (Actions). **Pages aún no está activado en el repo** (`has_pages: false`). |
| `index.html` | **Generado.** Tras cambiar CSS/JS hay que correr `python3 scripts/build-index.py`. |

### Cómo se sirve

- **Local:** `python3 -m http.server 8080` → `http://127.0.0.1:8080/` (fotos relativas `img/equipos/`).
- **GitHub Pages (cuando exista):** `https://caleushe-desing.github.io/Shooter/`
- **Previewers tipo html-preview.github.io:** suelen fallar (proxy CORS caído). Por eso `index.html` lleva CSS y JS **inline**.
- Fotos de catálogo fuera de localhost/Pages se cargan desde:
  `https://raw.githubusercontent.com/Caleushe-desing/Shooter/cursor/checklist-mecanica-9fc5/img/equipos/<id>.jpg`
- Variable `window.MEC_ASSET_BASE`: `""` en localhost y `*.github.io` (excepto html-preview); si no, el CDN raw de GitHub.

**No hay servidor de aplicación.** Sincronización puntual vía `https://jsonblob.com/api/jsonBlob` (CORS desde el navegador).

---

## 3. Rutas (hash)

Públicas (sin sesión):

| Hash | Vista |
|---|---|
| `#/` `#/bienvenida` `#/inicio` o vacío | Landing / web de bienvenida |
| `#/admin` | Login administrador |
| `#/admin/registro` | Registro de empresa |
| `#/usuario` | Login usuario (o pantalla “pendiente”) |
| `#/usuario/registro` | Solicitar acceso |
| `#/unirse/<blobId>` | Solicitar acceso con empresa prefijada |
| `#/v/<shareCode>` | Ficha embebida en el QR (compacta, sin fotos) |
| `#/r/<blobId>` | Ficha publicada en jsonblob |

Requieren sesión **admin** o usuario **approved** (`needInspect()`):

| Hash | Vista |
|---|---|
| `#/app` | Home de inspecciones |
| `#/tipos` | Catálogo de equipos (busca) |
| `#/nuevo/<typeId>` | Formulario de inspección |
| `#/historial` | Lista local de fichas |
| `#/local/<reportId>` | Ver ficha guardada |
| `#/qr/<reportId>` | QR + compartir + PDF |
| `#/pdf/<reportId>` | Vista de impresión carta |
| `#/ajustes` | Datos empresa (solo admin) |
| `#/admin/equipo` | Autorizar usuarios (solo admin) |

Si un usuario `pending` intenta inspeccionar → `#/usuario`. Si no hay sesión → `#/`.

---

## 4. Identidad y autorización

Implementado en `js/auth.js`. **No es un sistema de cuentas bancario.** Hash SHA-256 en el cliente (`companyCode + "\n" + user + "\n" + pass`). Sin salt extra, sin recovery, sin e-mail.

### localStorage

| Clave | Contenido |
|---|---|
| `meccheck-session-v1` | Sesión: `{ role, companyCode, blobId, userId, user, name, status }` |
| `meccheck-orgs-v1` | Array de empresas conocidas en este dispositivo (máx. 30) |
| `meccheck-settings-v1` | `{ company, rut, branch, inspector, logo }` (logo = data URL JPEG) |
| `meccheck-reports-v1` | Array de inspecciones (máx. ~120; si quota, recorta fotos) |

`role`: `"admin"` | `"user"`.  
`status` de usuario: `"pending"` | `"approved"` | `"rejected"`. Admin siempre `approved`.

### Objeto empresa (org)

```js
{
  v: 2,
  code: "K7M2PQ",          // 6 chars A-Z sin I/O/0/1
  blobId: "<uuid jsonblob o ''>",
  company, rut, branch, logo,
  admin: { id, name, user, pass /* hash */ },
  users: [{ id, name, user, pass, status, requestedAt, decidedAt? }],
  createdAt, updatedAt
}
```

- **Código corto** (`code`): se muestra al admin.
- **Código completo / invite:** `CODE.blobId` (necesario entre celulares distintos).
- Al registrar, se intenta `POST` a jsonblob; si falla, la empresa queda **solo local** (mismo teléfono).
- `PUT` actualiza el blob. Logo remoto se omite si `logo.length > 160000`.
- No hay directorio global de empresas: el usuario necesita el invite o el blobId.

### Flujos

**Admin registra:** empresa + RUT + sucursal + logo + nombre + usuario + clave (≥4) + repetir clave → sesión admin → `#/app`. Prefilla con settings locales si existían.

**Admin entra:** usuario + clave; en otro celular pega también el código completo.

**Usuario solicita:** código de empresa + nombre + usuario + clave → queda `pending`. No entra al check.

**Usuario entra:** si `approved`, copia datos de empresa a settings (`inspector` = su nombre) y va a `#/app`. Si `pending`, ve “Esperando autorización” y botón actualizar.

**Admin autoriza** (`#/admin/equipo`): lista pendientes (Autorizar / Rechazar), autorizados (Revocar), QR de alta `#/unirse/<blobId>`, copiar invite.

Usuarios **no** editan datos de empresa.

---

## 5. Web de bienvenida

Función `landingView()` en `auth.js`. Clases CSS `lp-*` en `app.css`.

Contiene:

- Hero: logo SVG, título, lead, CTAs admin/usuario.
- Tira de 6 fotos: escalera-tijera, alza-hombre, soldadora, extintor, compresor, arnés.
- **Cómo se usa** (5 pasos con foto): elegir equipo, marcar puntos, fotos, firmas, PDF/QR.
- **Qué incluye** (4 cards): catálogo, check, cámara, documento.
- **Cómo se entra:** dos columnas admin vs usuario.

Fotos: `img/equipos/<id>.jpg` vía `MEC_ASSET_BASE`. `onerror` → `window.mecImgFb` oculta la img.

---

## 6. Inspección

### Home (`#/app`)

- Logo empresa o icono de marca.
- Nueva inspección, historial, (admin) Autorizar usuarios + Datos de la empresa, Web de bienvenida, Cerrar sesión.
- Bloquea inspeccionar si faltan settings (empresa, RUT, sucursal, inspector, logo).

### Catálogo (`#/tipos`)

Agrupado por `group`. Buscador. Cada ítem: thumb JPG + nombre + hint. Click → `#/nuevo/<id>`.

Tipo `libre` (“Otro / lo que quieras”): sin foto de catálogo; puntos editables como el resto.

### Formulario — campos obligatorios al guardar

- Qué se inspecciona (`typeName`, editable)
- Código / referencia
- Ubicación
- Quién revisa
- Cargo
- Todos los puntos marcados (ok | fail | na)
- Si fail: detalle de la falla
- ≥ 1 foto de usuario (máx. 8)
- Observaciones
- Resultado (`apto` | `observado` | `rechazado`)
- Firma inspector (canvas)
- Nombre del supervisor
- Firma supervisor

Se pueden **editar textos de puntos**, **borrar puntos**, **agregar puntos**.

Fotos: `input file accept=image/*` con `capture=environment` (cámara) y galería. Compresión canvas JPEG ~960 px, quality 0.72, data URL. Logo empresa: 480 px, 0.84.

Folio: `MC-AAMMDD-XXXX` (fecha + 4 chars).

### Resultados (`MEC_VERDICTS`)

- `apto` — Apto para uso
- `observado` — Apto con observaciones
- `rechazado` — No apto / fuera de servicio (banner rojo NO APTO en la ficha)

### Objeto inspección (report / draft)

```js
{
  id, createdAt,
  company, rut, branch, companyLogo,
  type, typeName, group,
  equipment: { code, location, photo, photos: [] },
  inspector, cargo,
  items: [{ id, text, result: ""|"ok"|"fail"|"na", note }],
  observations, verdict,
  signatures: { inspector, supervisor },  // data URL PNG
  strokes: { inspector, supervisor },     // polilíneas para reconstruir firma
  supervisorName, blobId, shareCode
}
```

`equipment.photo` = última foto (compatibilidad). `photos[]` = lista.

### Historial

Hasta 120 fichas en localStorage. Si se llena la cuota, recorta fotos de las más viejas o deja 8.

---

## 7. Documento, QR y PDF

### Ficha visual (`reportHtml`)

Header: logo empresa + razón social + RUT + sucursal + icono Check list Técnico. Foto de catálogo. Fotos del usuario. KV (folio, fecha, código, ubicación, inspector, resultado). Lista de puntos. Observaciones. Firmas.

### QR / compartir

1. `encodeShare`: compacta el report **sin fotos ni logo** (`compactReport`), deflate-raw + base64url prefijo `z`, o `u`+btoa. Enlace `#/v/<code>`.
2. Además intenta `POST` jsonblob con el report completo → `#/r/<blobId>`.
3. QR dibujado con `qrcode()` local; fallback `api.qrserver.com`.
4. Copiar enlace / Web Share / WhatsApp.

**No meter fotos ni logo en el payload compacto del QR** (revienta tamaño).

### PDF carta

Ruta `#/pdf/<id>`. CSS `@page { size: letter portrait; margin: 0.55in 0.6in; }`. El usuario en el diálogo elige **Guardar como PDF** y papel **Carta / Letter**. No hay librería PDF.js: es `window.print()`.

---

## 8. Catálogo de equipos

`js/data.js` → `window.MEC_TEMPLATES`. Cada uno: `{ id, name, group, hint, items: string[] }`.

| group | ids |
|---|---|
| General | `libre` |
| Altura | `escalera-tijera`, `escalera-extensible`, `alza-hombre`, `plataforma-tijera`, `andamio` |
| Izaje | `tecle-hidraulico`, `tecle-cadena`, `tecle-electrico`, `puente-grua`, `grua-piso`, `eslingas`, `cadenas-ganchos` |
| Hidráulica | `gato-botella`, `gato-carretilla`, `prensa-hidraulica` |
| Seguridad | `arnes`, `extintor`, `epp`, `orden-aseo`, `bloqueo-energi` |
| Taller | `compresor`, `esmeril-angular`, `esmeril-banco`, `soldadora`, `cilindros-gas`, `generador`, `taladro-columna`, `herramientas-manuales`, `banco-prensa` |
| Vehículos | `camioneta` |

JPG en `img/equipos/<id>.jpg` para todos **excepto** `libre`. 30 JPG.

Cada plantilla tiene ~8–14 ítems de control (textos en español, estilo pre-uso / visual).

---

## 9. UI / diseño

- Paleta: fondo `#e8eaee`, papel blanco, ink `#1c2128`, steel `#2c333d`, amarillo `#f5c400`, ok verde, fail rojo.
- Fuente: Segoe UI / system-ui.
- `#app` max-width 720px (840px en landing `.wide`).
- Componentes: `.top` sticky, `.btn` / `.btn.ghost` / `.btn.steel`, `.card`, `.seg` (OK/Falla/N/A), `.dock` sticky guardar.
- Safe-area insets (notch).
- Logo de marca: SVG inline (clipboard amarillo + check verde). No depende de `icon.svg` en runtime de la SPA.

---

## 10. Build

```bash
python3 scripts/build-index.py
```

Empaqueta `css/app.css` + `qrcode.min.js` + `data.js` + `auth.js` + `app.js` dentro de `index.html` (scripts inline). Favicon data-URI. Necesario para visores de un solo archivo y para descargar el HTML al celular.

`index.html` generado ~148 KB (sin las JPG; esas siguen en `img/` o raw GitHub).

---

## 11. Limitaciones conocidas (no son bugs a “arreglar” sin pedirlo)

1. **Sin backend propio.** Inspecciones no se sincronizan entre teléfonos. Solo la **org** (quién está autorizado) intenta jsonblob.
2. **jsonblob** puede fallar (403/red). Entonces admin/usuario en **distintos** celulares no se ven. En el mismo teléfono sí.
3. **GitHub Pages no está habilitado** en Settings del repo. `github.io/Shooter` da 404. Hay workflow listo.
4. `html-preview.github.io` suele mostrar `TypeError: Failed to fetch` (proxy `codetabs` caído). GitHub Raw sirve `text/plain` y el HTML no se ejecuta.
5. Claves hasheadas en el cliente; el blob de empresa las contiene. No es auth corporativa.
6. QR compacto **no lleva fotos**. Quien escanea ve puntos/resultado/firmas vectoriales, no las fotos del equipo (salvo ficha jsonblob `#/r/` si se publicó el report completo).
7. PDF = diálogo de impresión del sistema, no un archivo .pdf generado en JS.
8. Historial se pierde al borrar datos del sitio / otro navegador / otro teléfono.
9. No hay roles más finos, no hay multi-sucursal real, no hay notificaciones push, no hay export Excel.
10. El repo se llama **Shooter** por historia (antes hubo un juego); el producto es Check list Técnico.

---

## 12. Convenciones para seguir desarrollando

- Español de Chile en la UI. Tuteo/usted mixto actual: “tú” en textos de usuario (“tu solicitud”).
- Campos de inspección: **seguir todos obligatorios** salvo que se pida lo contrario.
- **No quitar las fotos de catálogo** `img/equipos`.
- Cámara del usuario: **al final** del check, no al inicio.
- Logo empresa: en settings/registro admin y en el documento final. **No** en el QR compacto.
- Tras editar `css/` o `js/`: regenerar `index.html`.
- Rama: `cursor/<nombre>-9fc5` en minúsculas si se abre otra.
- No introducir React/Vite/npm salvo que el dueño lo pida: el objetivo es que corra en un HTML en el celular.
- Tests: no hay suite. Probar a mano en móvil (cámara, firma táctil, print carta).

---

## 13. Cómo probar hoy

Computador: `python3 -m http.server 8080` en la raíz del repo.

Celular (si Pages sigue off): descargar `index.html` y abrirlo, o un host que sirva `text/html`. Las fotos de catálogo necesitan red (raw GitHub) si el HTML se abre suelto, sin la carpeta `img/`.

Flujo mínimo:

1. Bienvenida → Ingreso administrador → Crear cuenta (con logo).
2. Autorizar usuarios → copiar código.
3. (Otro perfil o incógnito) Ingreso usuarios → solicitar → volver al admin y Autorizar.
4. Nueva inspección → p. ej. Escalera tijera → completar todo → foto → firmas → QR / PDF carta.
