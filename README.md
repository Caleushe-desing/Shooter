# CheckMec

Aplicación móvil para **inspecciones pre-uso** de herramientas y equipos de una empresa mecánica. Se firma en el celular y se genera un **QR** para que cualquiera abra la ficha.

Incluye checklists de, entre otros:

- Escaleras tijera y extensibles
- Alza hombre y plataforma tijera
- Tecles hidráulicos, de cadena y eléctricos
- Puente grúa, grúa de piso, eslingas, ganchos
- Gatos, prensa hidráulica, andamio, arnés
- Compresor, esmeriles, soldadora, cilindros de gas
- Extintor, generador, EPP, orden y aseo, LOTO, camioneta

## Uso

Sirve la carpeta y ábrela en el teléfono:

```bash
python3 -m http.server 8080
```

1. **Datos de la empresa** (nombre, RUT, sucursal)
2. **Nueva inspección** → elige el equipo
3. Marca cada punto **OK / Falla / N/A**, cierra con un resultado y **firma con el dedo**
4. La app publica la ficha y muestra un **QR**
5. Quien lo escanea ve el informe (puntos, resultado y firmas) sin instalar nada

El historial queda en ese celular. Es una bitácora de apoyo; no reemplaza certificaciones oficiales.

Demo (después de publicar la rama): abre `index.html` o el enlace del pull request.
