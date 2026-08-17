# Check list Técnico

Checklists con foto de catálogo del tipo de equipo. Al **final del check** el usuario puede sacar fotos del equipo. Se firma en el celular y se genera un **QR**.

## Dónde verla

El visor `html-preview.github.io` suele mostrar **TypeError: Failed to fetch**: no es la app, es un proxy externo caído. No lo uses.

### En el celular (enlace permanente)

Activa GitHub Pages en este repositorio (Settings → Pages → Source: **GitHub Actions** → Save). Después abre:

**https://caleushe-desing.github.io/Shooter/**

### Sin Pages: abre el archivo

1. En el celular entra a [index.html en GitHub](https://github.com/Caleushe-desing/Shooter/blob/cursor/checklist-mecanica-9fc5/index.html)
2. Menú ⋯ → **Download** / Descargar
3. Abre el archivo descargado con Chrome o Safari

`index.html` ya trae el CSS y el JavaScript adentro. Las fotos de catálogo salen de GitHub; el historial queda en ese navegador.

### En el computador

En esta carpeta:

```bash
python3 -m http.server 8080
```

Luego http://127.0.0.1:8080/

## Uso

1. **Datos de la empresa** (obligatorio): nombre, RUT, sucursal, inspector y **logo**. El logo sale en el documento final.
2. **Nueva inspección** → elige el tipo (foto de catálogo)
3. Completa **todos** los campos, marca cada punto y, si hay falla, el detalle
4. Al final: **al menos una foto** del equipo
5. Resultado, observaciones y **ambas firmas**
6. Comparte el **QR** o **Exportar PDF carta** (8,5 × 11 pulgadas; en el cuadro elige Guardar como PDF y papel Carta)

El historial queda en la memoria de **ese navegador**, en ese celular.

Tras cambiar `css/` o `js/`, regenera el HTML único:

```bash
python3 scripts/build-index.py
```
