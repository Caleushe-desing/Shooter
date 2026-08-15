import {
  DEATH_SECONDS,
  EATEN_SPEED,
  FRIGHTENED_SECONDS,
  FRIGHTENED_SPEED,
  GHOST_SCORES,
  GHOST_SPEED,
  LEVEL_CLEAR_SECONDS,
  PELLET_SCORE,
  PLAYER_SPEED,
  POWER_SCORE,
  READY_SECONDS,
  SCATTER_CHASE,
  START_LIVES,
  TUNNEL_GHOST_SPEED,
} from "../constants";
import { wrapColFloat } from "../maze/grid";
import {
  COLS,
  MAZE,
  canStep,
  exits,
  neighbor,
  wrapCol,
} from "../maze/layout";
import type { Actor, Dir, FloatingScore, GameStatus, GhostId, GhostMode, GhostState } from "./types";
import { DIR_PRIORITY, DIR_VEC, OPPOSITE, isDiagonal, keyCell } from "./types";

export interface EngineEvent {
  kind:
    | "pellet"
    | "power"
    | "ghostEat"
    | "death"
    | "ready"
    | "playing"
    | "levelclear"
    | "gameover"
    | "winFanfare";
  score?: number;
}

export class CacamanEngine {
  status: GameStatus = "menu";
  score = 0;
  lives = START_LIVES;
  level = 1;
  pellets = new Set(MAZE.pellets);
  powerPellets = new Set(MAZE.powerPellets);
  player: Actor = spawnPlayer();
  ghosts: GhostState[] = spawnGhosts(1);
  frightenedTimer = 0;
  eatStreak = 0;
  statusTimer = 0;
  waveIndex = 0;
  waveTimer = SCATTER_CHASE[0].seconds;
  floaters: FloatingScore[] = [];
  floaterId = 0;
  extraLifeAt = 10000;
  queuedInput: Dir | null = null;

  startGame(): void {
    this.score = 0;
    this.lives = START_LIVES;
    this.level = 1;
    this.extraLifeAt = 10000;
    this.resetLevel(true);
    this.status = "ready";
    this.statusTimer = READY_SECONDS;
  }

  pauseToggle(): void {
    if (this.status === "playing") this.status = "paused";
    else if (this.status === "paused") this.status = "playing";
  }

  setInput(dir: Dir | null): void {
    if (dir) this.queuedInput = dir;
  }

  update(dt: number): EngineEvent[] {
    const events: EngineEvent[] = [];
    const capped = Math.min(dt, 0.05);

    this.tickFloaters(capped);

    if (this.status === "menu" || this.status === "paused" || this.status === "gameover") {
      return events;
    }

    if (this.status === "ready") {
      this.statusTimer -= capped;
      if (this.statusTimer <= 0) {
        this.status = "playing";
        events.push({ kind: "playing" });
      }
      return events;
    }

    if (this.status === "dying") {
      this.statusTimer -= capped;
      if (this.statusTimer <= 0) {
        if (this.lives <= 0) {
          this.status = "gameover";
          events.push({ kind: "gameover" });
        } else {
          this.resetActors();
          this.status = "ready";
          this.statusTimer = READY_SECONDS;
          events.push({ kind: "ready" });
        }
      }
      return events;
    }

    if (this.status === "levelclear") {
      this.statusTimer -= capped;
      if (this.statusTimer <= 0) {
        this.level += 1;
        this.resetLevel(false);
        this.status = "ready";
        this.statusTimer = READY_SECONDS;
        events.push({ kind: "ready" });
      }
      return events;
    }

    this.tickModes(capped);
    this.movePlayer(capped);
    events.push(...this.collectPellets());
    for (const ghost of this.ghosts) this.moveGhost(ghost, capped);
    events.push(...this.collide());

    if (this.pellets.size === 0 && this.powerPellets.size === 0 && this.status === "playing") {
      this.status = "levelclear";
      this.statusTimer = LEVEL_CLEAR_SECONDS;
      events.push({ kind: "levelclear" }, { kind: "winFanfare" });
    }

    return events;
  }

  remainingPellets(): number {
    return this.pellets.size + this.powerPellets.size;
  }

  globalMode(): "scatter" | "chase" {
    return SCATTER_CHASE[Math.min(this.waveIndex, SCATTER_CHASE.length - 1)].mode;
  }

  private resetLevel(full: boolean): void {
    this.pellets = new Set(MAZE.pellets);
    this.powerPellets = new Set(MAZE.powerPellets);
    this.resetActors();
    this.frightenedTimer = 0;
    this.eatStreak = 0;
    this.waveIndex = 0;
    this.waveTimer = SCATTER_CHASE[0].seconds;
    this.queuedInput = null;
    if (full) this.floaters = [];
  }

  private resetActors(): void {
    this.player = spawnPlayer();
    this.ghosts = spawnGhosts(this.level);
    this.frightenedTimer = 0;
    this.eatStreak = 0;
    this.queuedInput = this.player.dir;
  }

  private tickModes(dt: number): void {
    if (this.frightenedTimer > 0) {
      this.frightenedTimer -= dt;
      if (this.frightenedTimer <= 0) {
        this.frightenedTimer = 0;
        this.eatStreak = 0;
        for (const g of this.ghosts) {
          if (g.mode === "frightened") {
            g.mode = this.globalMode();
            g.frightened = false;
            g.dir = OPPOSITE[g.dir];
          }
        }
      }
      return;
    }

    this.waveTimer -= dt;
    if (this.waveTimer <= 0 && this.waveIndex < SCATTER_CHASE.length - 1) {
      this.waveIndex += 1;
      this.waveTimer = SCATTER_CHASE[this.waveIndex].seconds;
      for (const g of this.ghosts) {
        if (g.mode === "scatter" || g.mode === "chase") {
          g.mode = this.globalMode();
          g.dir = OPPOSITE[g.dir];
        }
      }
    }
  }

  private tickFloaters(dt: number): void {
    this.floaters = this.floaters
      .map((f) => ({ ...f, age: f.age + dt }))
      .filter((f) => f.age < 1.1);
  }

  private addFloater(col: number, row: number, text: string): void {
    this.floaters.push({
      id: ++this.floaterId,
      x: col,
      z: row,
      text,
      age: 0,
    });
  }

  private movePlayer(dt: number): void {
    const p = this.player;
    if (this.queuedInput) p.queued = this.queuedInput;
    // Allow corner cuts every frame (not only exactly on tile center).
    tryTurn(p, false);

    const speed = PLAYER_SPEED + (this.level - 1) * 0.12;
    advanceActor(p, speed * dt, false, () => tryTurn(p, false));
  }

  private collectPellets(): EngineEvent[] {
    const events: EngineEvent[] = [];
    const pc = Math.round(this.player.col);
    const pr = Math.round(this.player.row);
    const wrapped = wrapCol(pc);
    const k = keyCell(wrapped, pr);
    const dist = Math.abs(this.player.col - pc) + Math.abs(this.player.row - pr);
    if (dist > 0.42) return events;

    if (this.pellets.delete(k)) {
      this.score += PELLET_SCORE;
      this.maybeExtraLife();
      events.push({ kind: "pellet", score: PELLET_SCORE });
    }
    if (this.powerPellets.delete(k)) {
      this.score += POWER_SCORE;
      this.maybeExtraLife();
      this.frightenedTimer = Math.max(2.6, FRIGHTENED_SECONDS - (this.level - 1) * 0.55);
      this.eatStreak = 0;
      for (const g of this.ghosts) {
        if (g.mode === "eaten" || g.mode === "house") continue;
        g.mode = "frightened";
        g.frightened = true;
        g.dir = OPPOSITE[g.dir];
      }
      events.push({ kind: "power", score: POWER_SCORE });
    }
    return events;
  }

  private maybeExtraLife(): void {
    if (this.score >= this.extraLifeAt) {
      this.lives += 1;
      this.extraLifeAt += 10000;
    }
  }

  private moveGhost(ghost: GhostState, dt: number): void {
    if (ghost.mode === "house") {
      ghost.houseTimer -= dt;
      ghost.row = MAZE.houseCenter.r + Math.sin(ghost.houseTimer * 3) * 0.12;
      ghost.col = ghost.col;
      if (ghost.houseTimer <= 0) {
        ghost.mode = this.frightenedTimer > 0 ? "frightened" : this.globalMode();
        ghost.frightened = this.frightenedTimer > 0;
        ghost.dir = "up";
        ghost.col = MAZE.door.c;
        ghost.row = MAZE.door.r;
      }
      return;
    }

    const speed = this.ghostSpeed(ghost);
    advanceActor(ghost, speed * dt, true, () => {
      ghost.dir = chooseGhostDir(ghost, this);
    });

    if (ghost.mode === "eaten") {
      const dc = Math.abs(wrapDelta(ghost.col, MAZE.houseCenter.c)) + Math.abs(ghost.row - MAZE.houseCenter.r);
      if (dc < 0.35) {
        ghost.mode = "house";
        ghost.frightened = false;
        ghost.houseTimer = 0.85;
        ghost.col = MAZE.houseCenter.c;
        ghost.row = MAZE.houseCenter.r;
        ghost.dir = "up";
      }
    }
  }

  private ghostSpeed(ghost: GhostState): number {
    const levelBoost = (this.level - 1) * 0.14;
    if (ghost.mode === "eaten") return EATEN_SPEED;
    const onTunnel = ghost.row === 10 && (ghost.col < 3 || ghost.col > COLS - 4);
    if (onTunnel) return TUNNEL_GHOST_SPEED + levelBoost * 0.25;
    if (ghost.mode === "frightened") return FRIGHTENED_SPEED;
    return GHOST_SPEED + levelBoost;
  }

  private collide(): EngineEvent[] {
    const events: EngineEvent[] = [];
    const p = this.player;
    for (const g of this.ghosts) {
      if (g.mode === "house") continue;
      const dc = Math.abs(wrapDelta(p.col, g.col));
      const dr = Math.abs(p.row - g.row);
      if (dc + dr > 0.72) continue;

      if (g.mode === "eaten") continue;

      if (g.mode === "frightened") {
        g.mode = "eaten";
        g.frightened = false;
        const pts = GHOST_SCORES[Math.min(this.eatStreak, GHOST_SCORES.length - 1)];
        this.eatStreak += 1;
        this.score += pts;
        this.maybeExtraLife();
        this.addFloater(g.col, g.row, `+${pts}`);
        events.push({ kind: "ghostEat", score: pts });
        continue;
      }

      this.lives -= 1;
      this.status = "dying";
      this.statusTimer = DEATH_SECONDS;
      events.push({ kind: "death" });
      break;
    }
    return events;
  }
}

function spawnPlayer(): Actor {
  return {
    col: MAZE.playerSpawn.c,
    row: MAZE.playerSpawn.r,
    dir: "left",
    queued: "left",
  };
}

function spawnGhosts(level: number): GhostState[] {
  const delay = (base: number) => Math.max(0.4, base - (level - 1) * 0.35);
  return [
    {
      id: "blinky",
      col: MAZE.blinkySpawn.c,
      row: MAZE.blinkySpawn.r,
      dir: "left",
      queued: null,
      mode: "scatter",
      houseTimer: 0,
      frightened: false,
    },
    {
      id: "pinky",
      col: MAZE.houseSpawns[0].c,
      row: MAZE.houseSpawns[0].r,
      dir: "up",
      queued: null,
      mode: "house",
      houseTimer: delay(1.2),
      frightened: false,
    },
    {
      id: "inky",
      col: MAZE.houseSpawns[1].c,
      row: MAZE.houseSpawns[1].r,
      dir: "up",
      queued: null,
      mode: "house",
      houseTimer: delay(4.2),
      frightened: false,
    },
    {
      id: "clyde",
      col: MAZE.houseSpawns[2].c,
      row: MAZE.houseSpawns[2].r,
      dir: "up",
      queued: null,
      mode: "house",
      houseTimer: delay(7.4),
      frightened: false,
    },
  ];
}

/** How close to tile center before a turn snaps in (Pac-Man corner cut). */
const TURN_SLACK = 0.32;

function tryTurn(actor: Actor, ghost: boolean): void {
  if (!actor.queued || actor.queued === actor.dir) return;
  const vec = DIR_VEC[actor.queued];
  if (actor.queued === OPPOSITE[actor.dir]) {
    actor.dir = actor.queued;
    return;
  }

  const tileC = wrapCol(Math.round(actor.col));
  const tileR = Math.round(actor.row);
  const offC = Math.abs(actor.col - Math.round(actor.col));
  const offR = Math.abs(actor.row - Math.round(actor.row));
  const diag = isDiagonal(actor.queued);
  const aligned = diag
    ? offC <= TURN_SLACK && offR <= TURN_SLACK
    : vec.c === 0
      ? offC <= TURN_SLACK
      : offR <= TURN_SLACK;
  if (!aligned) return;

  if (!canStep(tileC, tileR, actor.queued, ghost)) return;

  if (diag || vec.c !== 0) actor.row = tileR;
  if (diag || vec.r !== 0) actor.col = tileC;
  actor.dir = actor.queued;
}

function isAtCenter(actor: Actor, eps = 1e-4): boolean {
  return Math.abs(actor.col - Math.round(actor.col)) <= eps && Math.abs(actor.row - Math.round(actor.row)) <= eps;
}

function distToNextCenter(actor: Actor): number {
  const vec = DIR_VEC[actor.dir];
  let dc = Infinity;
  let dr = Infinity;
  if (vec.c > 0) dc = Math.floor(actor.col + 1e-4) + 1 - actor.col;
  if (vec.c < 0) dc = actor.col - (Math.ceil(actor.col - 1e-4) - 1);
  if (vec.r > 0) dr = Math.floor(actor.row + 1e-4) + 1 - actor.row;
  if (vec.r < 0) dr = actor.row - (Math.ceil(actor.row - 1e-4) - 1);
  if (vec.c !== 0 && vec.r !== 0) return Math.min(dc, dr);
  return vec.c !== 0 ? dc : dr;
}

function advanceActor(actor: Actor, dist: number, ghost: boolean, onCenter: () => void): void {
  let remaining = dist;
  for (let i = 0; i < 6 && remaining > 1e-6; i++) {
    if (isAtCenter(actor)) {
      actor.col = wrapColFloat(Math.round(actor.col));
      actor.row = Math.round(actor.row);
      onCenter();
      const c = wrapCol(Math.round(actor.col));
      const r = Math.round(actor.row);
      if (!canStep(c, r, actor.dir, ghost)) return;
    }
    const vec = DIR_VEC[actor.dir];
    const toCenter = distToNextCenter(actor);
    const step = Math.min(remaining, Math.max(toCenter, 1e-6));
    const diag = isDiagonal(actor.dir);
    // Misma velocidad de tile; en diagonal ambos ejes avanzan `step`.
    actor.col = wrapColFloat(actor.col + Math.sign(vec.c) * step);
    actor.row += Math.sign(vec.r) * step;
    remaining -= diag ? step * Math.SQRT2 : step;
  }
}

function chooseGhostDir(ghost: GhostState, engine: CacamanEngine): Dir {
  const c = wrapCol(Math.round(ghost.col));
  const r = Math.round(ghost.row);
  const options = exits(c, r, true).filter((d) => d !== OPPOSITE[ghost.dir]);
  const usable = options.length > 0 ? options : exits(c, r, true);
  if (usable.length === 0) return ghost.dir;

  if (ghost.mode === "frightened") {
    return usable[Math.floor(Math.random() * usable.length)];
  }

  const target = ghostTarget(ghost, engine);
  let best = usable[0];
  let bestDist = Infinity;
  for (const dir of DIR_PRIORITY) {
    if (!usable.includes(dir)) continue;
    const n = neighbor(c, r, dir);
    const dist = Math.hypot(n.c - target.c, n.r - target.r);
    if (dist + 1e-6 < bestDist) {
      bestDist = dist;
      best = dir;
    }
  }
  return best;
}

function ghostTarget(ghost: GhostState, engine: CacamanEngine): { c: number; r: number } {
  if (ghost.mode === "eaten") return MAZE.houseCenter;
  if (ghost.mode === "scatter") return MAZE.scatter[ghost.id];

  const p = engine.player;
  const pc = wrapCol(Math.round(p.col));
  const pr = Math.round(p.row);
  const ahead = DIR_VEC[p.dir];

  switch (ghost.id) {
    case "blinky":
      return { c: pc, r: pr };
    case "pinky":
      return { c: wrapCol(pc + ahead.c * 4), r: pr + ahead.r * 4 };
    case "inky": {
      const two = { c: wrapCol(pc + ahead.c * 2), r: pr + ahead.r * 2 };
      const blinky = engine.ghosts.find((g) => g.id === "blinky") ?? ghost;
      const bc = wrapCol(Math.round(blinky.col));
      const br = Math.round(blinky.row);
      return { c: wrapCol(two.c * 2 - bc), r: two.r * 2 - br };
    }
    case "clyde": {
      const dist = Math.hypot(wrapDelta(ghost.col, p.col), ghost.row - p.row);
      if (dist > 8) return { c: pc, r: pr };
      return MAZE.scatter.clyde;
    }
  }
}

function wrapDelta(a: number, b: number): number {
  let d = a - b;
  if (d > COLS / 2) d -= COLS;
  if (d < -COLS / 2) d += COLS;
  return d;
}

export function dirFromKeys(keys: Set<string>): Dir | null {
  if (keys.has("arrowup") || keys.has("w") || keys.has("k")) return "up";
  if (keys.has("arrowdown") || keys.has("s") || keys.has("j")) return "down";
  if (keys.has("arrowleft") || keys.has("a") || keys.has("h")) return "left";
  if (keys.has("arrowright") || keys.has("d") || keys.has("l")) return "right";
  return null;
}

export type { GhostId, GhostMode };
