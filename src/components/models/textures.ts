import { useMemo } from "react";
import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NearestFilter,
  RepeatWrapping,
} from "three";

export function usePaperTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#f7f4ee";
    g.fillRect(0, 0, 64, 64);
    g.strokeStyle = "rgba(200, 190, 175, 0.7)";
    g.lineWidth = 1;
    for (let y = 4; y < 64; y += 8) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(64, y);
      g.stroke();
    }
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

/** One bathroom tile — repeated once per maze cell to avoid swimming. */
export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = grout;
    g.fillRect(0, 0, 128, 128);
    // Soft fill (no harsh pixel edges that shimmer under motion).
    const grad = g.createLinearGradient(8, 8, 120, 120);
    grad.addColorStop(0, a);
    grad.addColorStop(1, b);
    g.fillStyle = grad;
    g.fillRect(6, 6, 116, 116);
    g.strokeStyle = "rgba(120, 100, 80, 0.18)";
    g.lineWidth = 2;
    g.strokeRect(7, 7, 114, 114);
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

export function useWallTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#c5dbe0";
    g.fillRect(0, 0, 64, 128);
    const colors = ["#eef6f8", "#e4f0f3", "#f7fcfd"];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = colors[(x + y) % colors.length];
        const ox = y % 2 === 0 ? 0 : 8;
        g.fillRect(x * 16 + ox + 1, y * 16 + 1, 14, 14);
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
