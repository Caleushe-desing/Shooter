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
    g.strokeStyle = "rgba(90, 200, 190, 0.55)";
    g.lineWidth = 1;
    for (let y = 4; y < 64; y += 8) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(64, y);
      g.stroke();
    }
    // Pixel tick marks — digital roll vibe.
    g.fillStyle = "rgba(45, 180, 170, 0.35)";
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

/** Ceramic bathroom tile with a crisp digital grout. */
export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 128;
    const g = canvas.getContext("2d")!;
    g.fillStyle = grout;
    g.fillRect(0, 0, 128, 128);
    g.fillStyle = a;
    g.fillRect(4, 4, 120, 120);
    // Inner bevel + pixel corner dots.
    g.strokeStyle = b;
    g.lineWidth = 3;
    g.strokeRect(8, 8, 112, 112);
    g.fillStyle = "rgba(93, 255, 210, 0.35)";
    g.fillRect(10, 10, 6, 6);
    g.fillRect(112, 10, 6, 6);
    g.fillRect(10, 112, 6, 6);
    g.fillRect(112, 112, 6, 6);
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
    g.fillStyle = PALETTE.wallBase;
    g.fillRect(0, 0, 64, 128);
    const colors = [PALETTE.wallA, PALETTE.wallB, PALETTE.wallC];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = colors[(x + y) % colors.length];
        const ox = y % 2 === 0 ? 0 : 8;
        g.fillRect(x * 16 + ox + 1, y * 16 + 1, 14, 14);
        g.fillStyle = "rgba(61, 255, 224, 0.2)";
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
