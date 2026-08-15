# CheckMec

Aplicación móvil para **inspecciones pre-uso** de herramientas y equipos de una empresa mecánica. Se firma en el celular y se genera un **QR** para que cualquiera abra la ficha.

## Cómo abrirla (si “no carga”)

GitHub y jsDelivr **no ejecutan** `index.html`: lo muestran como texto o dan error. Por eso el celular se queda en blanco.

Usa una de estas opciones:

1. **GitHub Pages** (la que funciona en el teléfono, después de activarla una vez):
   - En el repo: **Settings → Pages → Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `cursor/checklist-mecanica-9fc5`, folder `/` (root) → Save
   - Entra a: https://caleushe-desing.github.io/Shooter/
2. **En el computador**, en esta carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://IP-DE-TU-PC:8080` en el celular (misma Wi‑Fi).

3. Vista previa (puede tardar unos segundos):  
   https://html-preview.github.io/?url=https://github.com/Caleushe-desing/Shooter/blob/cursor/checklist-mecanica-9fc5/index.html

## Uso

1. **Datos de la empresa** (nombre, RUT, sucursal)
2. **Nueva inspección** → elige el equipo
3. Marca cada punto **OK / Falla / N/A**, cierra con un resultado y **firma con el dedo**
4. La app publica la ficha y muestra un **QR**
5. Quien lo escanea ve el informe (puntos, resultado y firmas) sin instalar nada

El historial queda en ese celular. Es una bitácora de apoyo; no reemplaza certificaciones oficiales.

Incluye checklists de, entre otros:

- Escaleras tijera y extensibles
- Alza hombre y plataforma tijera
- Tecles hidráulicos, de cadena y eléctricos
- Puente grúa, grúa de piso, eslingas, ganchos
- Gatos, prensa hidráulica, andamio, arnés
- Compresor, esmeriles, soldadora, cilindros de gas
- Extintor, generador, EPP, orden y aseo, LOTO, camioneta
