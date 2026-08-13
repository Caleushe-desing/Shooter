# Cacaman

Pac-Man en tercera persona y 3D. Tú eres un **rollo de papel higiénico** que recorre un baño-laberinto recogiendo **caca**. Los fantasmas son **jabones**.

## Cómo jugar

- **Moverse:** WASD o flechas (en móvil, stick virtual)
- **Vista:** botón Vista 2D/3D · tecla **V**
- Recoge toda la caca para pasar de nivel
- Las **cacas grandes** (esquinas) asustan a los jabones: entonces puedes comerlos
- Si un jabón te toca en estado normal, pierdes una vida (un rollo)
- **P** pausa · **M** silencio · **Enter** para empezar

### Los jabones

| Jabón | Color | Personalidad |
|---|---|---|
| Lejía | Rojo | Te persigue |
| Espuma | Rosa | Intenta cortarte el paso |
| Gel | Cian | Flanquea con Lejía |
| Jabón | Naranja | Se acobarda si te acercas |

## Desarrollo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`.

## Build

```bash
npm run build
npm run preview
```

## Stack

React + TypeScript + Vite, React Three Fiber / Three.js, Tailwind CSS, Zustand.
