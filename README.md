# Check list Técnico

Aplicación móvil para **inspecciones pre-uso** de herramientas y equipos de una empresa mecánica. Se firma en el celular y se genera un **QR** para que cualquiera abra la ficha.

## Dónde verla

Ábrela en el celular (o el computador) con este enlace:

**https://html-preview.github.io/?url=https://github.com/Caleushe-desing/Shooter/blob/cursor/checklist-mecanica-9fc5/index.html**

No uses el botón Raw ni jsDelivr: GitHub los muestra como texto.

En el computador, en esta carpeta:

```bash
python3 -m http.server 8080
```

Abre `http://IP-DE-TU-PC:8080` en el celular (misma Wi‑Fi).

## Uso

1. **Datos de la empresa** (nombre, RUT, sucursal)
2. **Nueva inspección** → elige el equipo
3. Marca cada punto **OK / Falla / N/A**, cierra con un resultado y **firma con el dedo**
4. La app publica la ficha y muestra un **QR**
5. Quien lo escanea ve el informe (puntos, resultado y firmas) sin instalar nada

El historial queda **en la memoria de ese navegador** (localStorage), en ese celular. No hay cuenta ni servidor propio: si borras los datos del sitio, usas otro teléfono u otro explorador, esas inspecciones no aparecen. El QR sirve para que otra persona vea esa ficha. Es una bitácora de apoyo; no reemplaza certificaciones oficiales.

Incluye checklists de, entre otros:

- Escaleras tijera y extensibles
- Alza hombre y plataforma tijera
- Tecles hidráulicos, de cadena y eléctricos
- Puente grúa, grúa de piso, eslingas, ganchos
- Gatos, prensa hidráulica, andamio, arnés
- Compresor, esmeriles, soldadora, cilindros de gas
- Extintor, generador, EPP, orden y aseo, LOTO, camioneta
