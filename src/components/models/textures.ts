import { useMemo } from "react";
import {
  CanvasTexture,
  LinearFilter,
  LinearMipmapLinearFilter,
  NearestFilter,
  RepeatWrapping,
} from "three";
import { PALETTE } from "../../constants";

/** Asfalto con cruce peatonal amarillo (Santiago de noche). */
export function useTileTexture(a: string, b: string, grout: string): CanvasTexture {
  return useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const g = canvas.getContext("2d")!;
    g.fillStyle = b;
    g.fillRect(0, 0, size, size);
    g.fillStyle = a;
    g.fillRect(0, 0, size, size);
    // franja amarilla tipo paso cebra / berma
    g.fillStyle = grout;
    for (let i = 0; i < 4; i++) {
      g.fillRect(8 + i * 30, 52, 18, 24);
    }
    // grietas digitales
    g.strokeStyle = "rgba(255, 45, 149, 0.25)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(10, 20);
    g.lineTo(60, 40);
    g.lineTo(110, 18);
    g.stroke();
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

/** Muros muralistas Valparaíso — bloques de color que rompen lo “correcto”. */
export function useWallTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 256;
    const g = canvas.getContext("2d")!;
    g.fillStyle = PALETTE.wallBase;
    g.fillRect(0, 0, 128, 256);
    const colors = [PALETTE.wallA, PALETTE.wallB, PALETTE.wallC, "#7c5cff", "#ff6a00", "#00d4c8"];
    for (let y = 0; y < 8; y++) {
      for (let x = 0; x < 4; x++) {
        g.fillStyle = colors[(x * 3 + y * 2) % colors.length];
        const ox = y % 2 === 0 ? 0 : 16;
        g.fillRect(x * 32 + ox + 2, y * 32 + 2, 28, 28);
        // grafiti stroke
        g.fillStyle = "rgba(255,255,255,0.35)";
        g.fillRect(x * 32 + ox + 6, y * 32 + 8, 12, 3);
      }
    }
    // tag
    g.fillStyle = "#090614";
    g.font = "bold 18px sans-serif";
    g.fillText("STGO", 18, 140);
    const tex = new CanvasTexture(canvas);
    tex.wrapS = RepeatWrapping;
    tex.wrapT = RepeatWrapping;
    tex.generateMipmaps = true;
    tex.minFilter = LinearMipmapLinearFilter;
    tex.magFilter = LinearFilter;
    return tex;
  }, []);
}

/** Unused by quiltro but kept for API compatibility if imported. */
export function usePaperTexture(): CanvasTexture {
  return useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 32;
    canvas.height = 32;
    const g = canvas.getContext("2d")!;
    g.fillStyle = PALETTE.paper;
    g.fillRect(0, 0, 32, 32);
    const tex = new CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = NearestFilter;
    tex.magFilter = NearestFilter;
    return tex;
  }, []);
}
