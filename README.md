# Cacaman — Arcade 80s (Chile)

Pac-Man de calle chilena con look **arcade 80s**: gráficos planos, neón, muchos colores. Misma jugabilidad al 100%.

## Jugar

```bash
npm install
npm run dev
```

Abre la URL de Vite (por defecto `http://127.0.0.1:5173`).

## Controles

Mismo esquema en PC y celular: **sin mando**. Se mueve el **jugador**, la cámara no gira.

| Acción | PC (teclado) | Celular (desliz) |
|--------|--------------|------------------|
| Mover al quiltro | WASD / flechas | Misma dirección en pantalla |
| Vista 3D / 2D | `V` | Botón 3D/2D |
| Pausar | Esc / `P` | — |

En 3D la cámara sigue al jugador desde un ángulo fijo (no rota al girar).

## Objetivo

- Comé **lucas** ($100) por el laberinto.
- **Completo** = power-up: perseguí a Micro, Gaviota, Delivery e Inspector.
- Evitalos en modo normal o perdés una vida.
- Limpiá el mapa para pasar de nivel.

## Look 80s

- Materiales planos (sin texturas pesadas)
- Paredes neón multicolor
- UI CRT + scanlines
- Música chiptune y SFX arcade
