import { useMemo } from "react";
import { CanvasTexture, RepeatWrapping } from "three";

export function usePaperTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 256;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#f7f4ee";
    g.fillRect(0, 0, 256, 256);
    g.strokeStyle = "rgba(200, 190, 175, 0.7)";
    g.lineWidth = 2;
    for (let y = 12; y < 256; y += 18) {
      g.beginPath();
      g.setLineDash([6, 8]);
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
    }
    g.setLineDash([]);
    g.strokeStyle = "rgba(180, 170, 155, 0.35)";
    for (let x = 0; x < 256; x += 32) {
      g.beginPath();
      g.moveTo(x, 0);
      g.lineTo(x, 256);
      g.stroke();
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  }, []);
}

export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = grout;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = a;
    g.fillRect(4, 4, 58, 58);
    g.fillRect(66, 66, 58, 58);
    g.fillStyle = b;
    g.fillRect(66, 4, 58, 58);
    g.fillRect(4, 66, 58, 58);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.anisotropy = 8;
    return tex;
  }, [a, b, grout]);
}

export function useWallTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    g.fillStyle = "#c5dbe0";
    g.fillRect(0, 0, 128, 256);
    const colors = ["#eef6f8", "#e4f0f3", "#f7fcfd"];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = colors[(x + y) % colors.length];
        const ox = y % 2 === 0 ? 0 : 16;
        g.fillRect(x * 32 + ox + 2, y * 32 + 2, 28, 28);
      }
    }
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    return tex;
  }, []);
}
