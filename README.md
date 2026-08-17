# Check list Técnico

Inspecciones en el celular: catálogo de equipos, fotos, firmas, QR y PDF carta.  
Hay **web de bienvenida**, **administrador** (autoriza usuarios) y **inspectores**.

Los datos viven en un **servidor propio** (Node.js + SQLite), no en el celular.

## Cómo correrla

```bash
cd server
npm install
npm start
```

En el computador: http://127.0.0.1:3000/  
En el celular: `http://IP-DEL-VPS-O-PC:3000/` (misma red o dominio con HTTPS).

## Acceso

1. **Administrador** → Crear cuenta (empresa, RUT, sucursal, logo, usuario, clave).
2. Comparte el **código de 6 letras**.
3. **Usuario** pide acceso con ese código.
4. El admin autoriza en **Autorizar usuarios**.
5. El inspector hace checks; el historial queda en el servidor.

## Uso (inspección)

Catálogo → todos los campos → foto del equipo → firmas → QR / PDF carta (8,5 × 11).

Tras cambiar `css/` o `js/` de la SPA:

```bash
python3 scripts/build-index.py
```

Detalle de producto: [ESPECIFICACION.md](ESPECIFICACION.md).  
API: [server/README.md](server/README.md).
