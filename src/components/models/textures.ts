import { useMemo } from "react";
import { CanvasTexture, NearestFilter, RepeatWrapping } from "three";

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

export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const g = canvas.getContext("2d")!;
    g.fillStyle = grout;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = a;
    g.fillRect(2, 2, 28, 28);
    g.fillRect(34, 34, 28, 28);
    g.fillStyle = b;
    g.fillRect(34, 2, 28, 28);
    g.fillRect(2, 34, 28, 28);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.anisotropy = 1;
    tex.generateMipmaps = false;
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
    tex.generateMipmaps = false;
    return tex;
  }, []);
}
