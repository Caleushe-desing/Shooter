# Check list Técnico

Checklists con foto de catálogo del tipo de equipo. Al **final del check** el usuario saca fotos, se firma en el celular y se genera un **QR** o un **PDF carta**.

## Dónde verla

Abre `index.html` (o GitHub Pages si está activo). La primera pantalla es la **web de bienvenida**: explica la app con fotos y tiene ingreso de administrador y de usuarios.

**https://caleushe-desing.github.io/Shooter/**

En el computador:

```bash
python3 -m http.server 8080
```

Luego http://127.0.0.1:8080/

## Acceso

1. **Administrador**: registra la empresa (nombre, RUT, sucursal, logo, usuario y clave). Comparte el **código de empresa**.
2. **Usuario**: pide acceso con ese código. **No entra al check hasta que el admin lo autorice.**
3. El admin autoriza o rechaza en **Autorizar usuarios**.

## Uso (inspección)

1. Nueva inspección → elige el tipo (foto de catálogo)
2. Completa todos los campos y marca cada punto
3. Al final: al menos una foto del equipo
4. Resultado, observaciones y ambas firmas
5. QR o **Exportar PDF carta** (8,5 × 11 pulgadas)

Las inspecciones quedan en la memoria de **ese navegador**. El listado de quién está autorizado se sincroniza cuando hay internet.

Tras cambiar `css/` o `js/`:

```bash
python3 scripts/build-index.py
```
