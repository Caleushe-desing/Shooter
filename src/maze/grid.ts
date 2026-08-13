import { TILE } from "../constants";
import { COLS, ROWS } from "./layout";

export function gridToWorld(col: number, row: number): { x: number; z: number } {
  return {
    x: (col - (COLS - 1) / 2) * TILE,
    z: (row - (ROWS - 1) / 2) * TILE,
  };
}

export function wrapColFloat(col: number): number {
  return ((col % COLS) + COLS) % COLS;
}
