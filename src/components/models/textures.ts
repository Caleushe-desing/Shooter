import { useMemo } from "react";
import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NearestFilter,
  RepeatWrapping,
} from "three";
import { PALETTE } from "../../constants";

export function usePaperTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext("2d")!;
    g.fillStyle = PALETTE.paper;
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "rgba(184, 255, 60, 0.4)";
    g.lineWidth = 1;
    for (let y = 4; y < 64; y += 8) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(64, y);
      g.stroke();
    }
    g.fillStyle = "rgba(0, 229, 255, 0.22)";
    for (let x = 0; x < 64; x += 8) g.fillRect(x, 0, 1, 64);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 1);
    tex.generateMipmaps = false;
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    return tex;
  }, []);
}

/** Baldosa limpia actual: blanco + azul frío. */
export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d")!;
    g.fillStyle = grout;
    g.fillRect(0, 0, size, size);
    g.fillStyle = a;
    g.fillRect(3, 3, 60, 60);
    g.fillRect(65, 65, 60, 60);
    g.fillStyle = b;
    g.fillRect(65, 3, 60, 60);
    g.fillRect(3, 65, 60, 60);
    g.fillStyle = "rgba(184, 255, 60, 0.55)";
    g.fillRect(6, 6, 5, 5);
    g.fillRect(117, 117, 5, 5);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.magFilter = LinearFilter;
    tex.needsUpdate = true;
    return tex;
  }, [a, b, grout]);
}

/** Azulejo blanco brillante con toque azul. */
export function useWallTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = PALETTE.wallBase;
    g.fillRect(0, 0, 64, 128);
    const colors = [PALETTE.wallA, PALETTE.wallB, PALETTE.wallC];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = colors[(x + y) % colors.length];
        const ox = y % 2 === 0 ? 0 : 8;
        g.fillRect(x * 16 + ox + 1, y * 16 + 1, 14, 14);
        g.fillStyle = "rgba(0, 229, 255, 0.28)";
        g.fillRect(x * 16 + ox + 2, y * 16 + 2, 3, 3);
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.magFilter = LinearFilter;
    return tex;
  }, []);
}
