# Wireframe Shooter

Prototipo de FPS web con estética wireframe / arcade retro.

## Stack

- React + TypeScript + Vite
- React Three Fiber + Three.js
- Tailwind CSS v4
- Zustand

## Controles

| Plataforma | Movimiento | Mirar | Disparo |
|---|---|---|---|
| Escritorio | WASD | Ratón (pointer lock) | Clic / F / Espacio |
| Móvil (landscape) | Joystick izquierdo | Zona táctil derecha | Botón FIRE |

## Desarrollo

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Mecánicas

- Arena de bloques en wireframe (verde neón / blanco) con niebla y overlay CRT
- Colisiones contra muros y obstáculos
- Revólver + mano en primera persona con recoil
- Tracers azul claro estilo Valorant
- Platos flotantes de colores que explotan en fragmentos wireframe
- HUD de puntuación y pantalla **Sector Cleared**
