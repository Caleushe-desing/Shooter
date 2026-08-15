import {
  playBeam,
  playBonus,
  playCapture,
  playDeath,
  playEnemyShot,
  playExplode,
  playExtraLife,
  playHit,
  playRescue,
  playShot,
  playStage,
  playStart,
  resetMusic,
  tickMusic,
} from "./audio";
import {
  burst,
  drawBeam,
  drawBullet,
  drawCapturedShip,
  drawEnemy,
  drawPlayer,
  drawSparks,
  drawStarfield,
  padScore,
  pixelText,
  titleFont,
  type EnemyKind,
  type Spark,
} from "./draw";
import type { InputState } from "./input";
import { H, W, clamp, followPolyline, hit, type Pt } from "./math";
import {
  attackPath,
  beamPath,
  buildSlots,
  challengeWaves,
  convoysForStage,
  pointsFor,
  returnPath,
  slotPos,
  type Slot,
} from "./wave";

type Mode = "title" | "ready" | "play" | "clear" | "dead" | "over" | "pause";

type Enemy = {
  id: number;
  kind: EnemyKind;
  slot: Slot | null;
  hp: number;
  x: number;
  y: number;
  angle: number;
  state: "wait" | "enter" | "form" | "dive" | "beam" | "return" | "dead";
  path: Pt[];
  t: number;
  speed: number;
  shootCd: number;
  hurt: number;
  captured: boolean;
  hold: number;
};

type Bullet = { x: number; y: number; vx: number; vy: number; enemy: boolean };

const HI_KEY = "gslsga-hi";

function loadHi(): number {
  try {
    return Number(localStorage.getItem(HI_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

function saveHi(n: number): void {
  try {
    localStorage.setItem(HI_KEY, String(n));
  } catch {
    /* ignore */
  }
}

function makeStars() {
  return Array.from({ length: 90 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    z: 0.25 + Math.random() * 0.75,
    c: ["#ffffff", "#00ffff", "#ff2ea6", "#ffe14a"][(Math.random() * 4) | 0],
  }));
}

export class Game {
  private mode: Mode = "title";
  private time = 0;
  private banner = 0;
  private bannerText = "";
  private stage = 1;
  private score = 0;
  private hi = loadHi();
  private lives = 3;
  private extraAt = 20000;
  private playerX = W / 2;
  private playerY = H - 56;
  private dual = false;
  private invuln = 0;
  private fireCd = 0;
  private dying = 0;
  private slots: Slot[] = [];
  private enemies: Enemy[] = [];
  private bullets: Bullet[] = [];
  private sparks: Spark[] = [];
  private stars = makeStars();
  private diveCd = 0;
  private challenge = false;
  private challengeLeft = 0;
  private challengeHits = 0;
  private challengeTotal = 0;
  private enterT = 0;
  private flash = 0;
  private shake = 0;
  private capturedLife = false;

  startRun(): void {
    this.score = 0;
    this.lives = 3;
    this.extraAt = 20000;
    this.stage = 1;
    this.dual = false;
    this.capturedLife = false;
    playStart();
    resetMusic();
    this.beginStage();
  }

  private beginStage(): void {
    this.challenge = this.stage % 3 === 0;
    this.slots = this.challenge ? [] : buildSlots();
    this.enemies = [];
    this.bullets = [];
    this.enterT = 0;
    this.diveCd = 1.4;
    this.playerX = W / 2;
    this.invuln = 2.1;
    this.fireCd = 0;
    this.dying = 0;
    this.mode = "ready";
    this.banner = 1.6;
    this.bannerText = this.challenge ? `DESAFÍO ${this.stage}` : `ETAPA ${this.stage}`;
    playStage();

    if (this.challenge) {
      const waves = challengeWaves();
      this.challengeTotal = waves.length;
      this.challengeHits = 0;
      this.challengeLeft = waves.length;
      this.enemies = waves.map((w, i) => ({
        id: i,
        kind: w.kind,
        slot: null,
        hp: 1,
        x: w.path[0].x,
        y: w.path[0].y,
        angle: 0,
        state: "wait" as const,
        path: w.path,
        t: 0,
        speed: 0.22,
        shootCd: 99,
        hurt: 0,
        captured: false,
        hold: w.delay,
      }));
    } else {
      const conv = convoysForStage(this.slots, false);
      this.enemies = this.slots.map((slot) => {
        const convoy = conv.find((c) => c.slotIds.includes(slot.id));
        const target = slotPos(slot, 1, 0);
        return {
          id: slot.id,
          kind: slot.kind,
          slot,
          hp: slot.kind === "boss" ? 2 : 1,
          x: -40,
          y: -40,
          angle: 0,
          state: "wait" as const,
          path: convoy ? convoy.pathFor(slot, target) : [target],
          t: 0,
          speed: 0.28,
          shootCd: 0.4,
          hurt: 0,
          captured: false,
          hold: convoy ? convoy.delay + slot.id * 0.04 : 0.2,
        };
      });
    }
  }

  private addScore(n: number): void {
    this.score += n;
    if (this.score > this.hi) {
      this.hi = this.score;
      saveHi(this.hi);
    }
    if (this.score >= this.extraAt) {
      this.lives += 1;
      this.extraAt += this.extraAt === 20000 ? 50000 : 70000;
      playExtraLife();
      this.banner = 1.2;
      this.bannerText = "NAVE EXTRA";
    }
  }

  update(dt: number, input: InputState): void {
    this.time += dt;
    if (this.shake > 0) this.shake = Math.max(0, this.shake - dt * 8);
    if (this.flash > 0) this.flash = Math.max(0, this.flash - dt);
    for (const s of this.stars) {
      s.y += (20 + s.z * 70) * dt;
      if (s.y > H) {
        s.y = 0;
        s.x = Math.random() * W;
      }
    }
    for (const sp of this.sparks) {
      sp.x += sp.vx * dt;
      sp.y += sp.vy * dt;
      sp.vy += 40 * dt;
      sp.life -= dt;
    }
    this.sparks = this.sparks.filter((s) => s.life > 0);

    if (this.mode === "title") {
      tickMusic(dt, true);
      if (input.start || input.fire) this.startRun();
      return;
    }
    if (this.mode === "over") {
      if (input.start) this.mode = "title";
      return;
    }
    if (input.pause && this.mode === "play") this.mode = "pause";
    else if (input.pause && this.mode === "pause") this.mode = "play";
    if (this.mode === "pause") return;

    tickMusic(dt, this.mode === "play" || this.mode === "ready");

    if (this.banner > 0) this.banner = Math.max(0, this.banner - dt);
    if (this.mode === "ready" && this.banner <= 0) this.mode = "play";
    if (this.mode === "clear") {
      if (this.banner <= 0) {
        this.stage += 1;
        this.beginStage();
      }
      return;
    }
    if (this.mode === "dead") {
      this.dying -= dt;
      if (this.dying <= 0) {
        if (this.lives <= 0 && !this.dual) {
          this.mode = "over";
          return;
        }
        this.dual = false;
        this.playerX = W / 2;
        this.invuln = 2.6;
        this.mode = "play";
      }
      this.stepWorld(dt, { ...input, left: false, right: false, fire: false, touchX: null });
      return;
    }

    if (this.mode === "play" || this.mode === "ready") this.stepWorld(dt, input);
  }

  private stepWorld(dt: number, input: InputState): void {
    this.enterT += dt;
    if (this.invuln > 0) this.invuln = Math.max(0, this.invuln - dt);
    this.fireCd = Math.max(0, this.fireCd - dt);

    const speed = 168;
    if (input.touchX != null) this.playerX = clamp(input.touchX, 22, W - 22);
    else {
      if (input.left) this.playerX -= speed * dt;
      if (input.right) this.playerX += speed * dt;
      this.playerX = clamp(this.playerX, 22, W - 22);
    }

    const canShoot = this.mode === "play" && this.dying <= 0;
    if (canShoot && input.fire && this.fireCd <= 0) {
      this.fireCd = this.dual ? 0.13 : 0.16;
      if (this.dual) {
        this.bullets.push({ x: this.playerX - 11, y: this.playerY - 14, vx: 0, vy: -420, enemy: false });
        this.bullets.push({ x: this.playerX + 11, y: this.playerY - 14, vx: 0, vy: -420, enemy: false });
      } else {
        this.bullets.push({ x: this.playerX, y: this.playerY - 14, vx: 0, vy: -420, enemy: false });
      }
      playShot();
    }

    const breathe = 1 + Math.sin(this.time * 1.35) * 0.055;
    const drift = Math.sin(this.time * 0.45) * 16;

    for (const e of this.enemies) {
      if (e.state === "dead") continue;
      e.hurt = Math.max(0, e.hurt - dt);
      e.shootCd = Math.max(0, e.shootCd - dt);

      if (e.state === "wait") {
        e.hold -= dt;
        if (e.hold <= 0) {
          e.state = "enter";
          e.t = 0;
        }
        continue;
      }

      if (e.state === "form" && e.slot) {
        const p = slotPos(e.slot, breathe, drift);
        e.x = p.x;
        e.y = p.y;
        e.angle = -Math.PI / 2;
        continue;
      }

      if (e.state === "beam") {
        if (e.t < 1) {
          const f = followPolyline(e.path, e.t);
          e.x = f.x;
          e.y = f.y;
          e.angle = Math.PI / 2;
          e.t += e.speed * dt;
        } else {
          e.hold -= dt;
          e.x += (this.playerX - e.x) * dt * 1.2;
          if (e.hold <= 0) {
            e.state = "return";
            e.path = returnPath({ x: e.x, y: e.y }, e.slot ? slotPos(e.slot, 1, 0) : { x: e.x, y: 80 });
            e.t = 0;
            e.speed = 0.4;
          } else if (
            this.dying <= 0 &&
            this.invuln <= 0 &&
            !this.capturedLife &&
            Math.abs(this.playerX - e.x) < 28 + (1 - e.hold / 2.4) * 36
          ) {
            this.capture(e);
          }
        }
        continue;
      }

      const f = followPolyline(e.path, e.t);
      e.x = f.x;
      e.y = f.y;
      e.angle = f.angle;
      e.t += e.speed * dt;
      if (e.t >= 1 || f.done) {
        if (e.state === "enter") {
          if (this.challenge) {
            e.state = "dead";
            this.challengeLeft -= 1;
          } else {
            e.state = "form";
          }
        } else if (e.state === "dive") {
          if (e.slot) {
            e.state = "return";
            e.path = returnPath({ x: e.x, y: e.y }, slotPos(e.slot, 1, 0));
            e.t = 0;
            e.speed = 0.42;
          } else {
            e.state = "dead";
          }
        } else if (e.state === "return") {
          e.state = "form";
          e.t = 0;
        }
      }

      if (
        e.state === "dive" &&
        e.shootCd <= 0 &&
        e.y > 130 &&
        e.y < 400 &&
        this.mode === "play"
      ) {
        e.shootCd = 0.7 - Math.min(0.3, this.stage * 0.03);
        const dx = this.playerX - e.x;
        const dy = this.playerY - e.y;
        const len = Math.hypot(dx, dy) || 1;
        this.bullets.push({
          x: e.x,
          y: e.y + 8,
          vx: (dx / len) * 36,
          vy: 150,
          enemy: true,
        });
        playEnemyShot();
      }
    }

    if (this.mode === "play" && !this.challenge) {
      this.diveCd -= dt;
      const inForm = this.enemies.filter((e) => e.state === "form");
      const entering = this.enemies.some((e) => e.state === "wait" || e.state === "enter");
      if (this.diveCd <= 0 && inForm.length && !entering) {
        const n = 1 + (Math.random() < 0.35 + this.stage * 0.04 ? 1 : 0);
        for (let i = 0; i < n; i++) this.launchDive(inForm);
        this.diveCd = Math.max(0.7, 1.85 - this.stage * 0.08);
      }
    }

    for (const b of this.bullets) {
      b.x += b.vx * dt;
      b.y += b.vy * dt;
    }
    this.bullets = this.bullets.filter((b) => b.y > -20 && b.y < H + 20 && b.x > -20 && b.x < W + 20);

    this.resolveHits();

    const alive = this.enemies.filter((e) => e.state !== "dead");
    if (this.mode === "play" && alive.length === 0 && this.dying <= 0) {
      if (this.challenge && this.challengeHits === this.challengeTotal) {
        this.addScore(10000);
        playBonus();
        this.bannerText = "PERFECTO +10000";
      } else {
        this.bannerText = "ETAPA CLARA";
      }
      this.banner = 1.8;
      this.mode = "clear";
    }
  }

  private launchDive(pool: Enemy[]): void {
    const e = pool[(Math.random() * pool.length) | 0];
    if (!e || e.state !== "form") return;
    const wantBeam =
      e.kind === "boss" &&
      !this.dual &&
      !this.capturedLife &&
      Math.random() < 0.28 &&
      !this.enemies.some((o) => o.state === "beam");
    if (wantBeam) {
      e.state = "beam";
      e.path = beamPath({ x: e.x, y: e.y }, this.playerX);
      e.t = 0;
      e.speed = 0.55;
      e.hold = 2.4;
      playBeam();
      return;
    }
    e.state = "dive";
    e.path = attackPath({ x: e.x, y: e.y }, this.playerX, true);
    e.t = 0;
    e.speed = 0.36 + Math.min(0.16, this.stage * 0.015);
    e.shootCd = 0.25;
  }

  private capture(e: Enemy): void {
    this.capturedLife = true;
    e.captured = true;
    playCapture();
    this.flash = 0.25;
    this.shake = 1;
    this.killPlayer(true);
  }

  private killPlayer(fromBeam: boolean): void {
    if (this.dying > 0) return;
    if (this.dual && !fromBeam) {
      this.dual = false;
      burst(this.sparks, this.playerX + 11, this.playerY, "#00ffff", 12);
      playHit();
      this.invuln = 1.2;
      return;
    }
    burst(this.sparks, this.playerX, this.playerY, "#00ffff", 22);
    playDeath();
    this.dying = 1.4;
    this.shake = 1.2;
    this.flash = 0.2;
    this.lives = Math.max(0, this.lives - 1);
    this.mode = "dead";
  }

  private resolveHits(): void {
    for (const b of this.bullets) {
      if (b.enemy) continue;
      for (const e of this.enemies) {
        if (e.state === "dead" || e.state === "wait") continue;
        const r = e.kind === "boss" ? 12 : 9;
        if (!hit(b, 3, e, r)) continue;
        b.y = -99;
        e.hp -= 1;
        e.hurt = 0.08;
        if (e.hp > 0) {
          playHit();
          burst(this.sparks, e.x, e.y, "#ffffff", 6);
          continue;
        }
        const diving = e.state === "dive" || e.state === "beam";
        this.addScore(pointsFor(e.kind, diving) + (e.kind === "boss" && diving ? 400 : 0));
        if (this.challenge) this.challengeHits += 1;
        const color = e.kind === "bee" ? "#ffe14a" : e.kind === "moth" ? "#ff2ea6" : "#5cff7a";
        burst(this.sparks, e.x, e.y, color, 18);
        playExplode();
        if (e.captured) {
          this.dual = true;
          this.capturedLife = false;
          this.addScore(1000);
          playRescue();
          this.banner = 1.3;
          this.bannerText = "NAVE DUAL";
        }
        e.state = "dead";
        if (this.challenge) this.challengeLeft = Math.max(0, this.challengeLeft - 1);
      }
    }

    if (this.mode !== "play" || this.dying > 0 || this.invuln > 0) return;

    for (const b of this.bullets) {
      if (!b.enemy) continue;
      const pr = this.dual ? 10 : 5.5;
      if (hit(b, 2.4, { x: this.playerX, y: this.playerY }, pr)) {
        b.y = H + 99;
        this.killPlayer(false);
        return;
      }
    }
    for (const e of this.enemies) {
      if (e.state === "dead" || e.state === "wait" || e.state === "form") continue;
      if (e.state !== "dive" && e.state !== "beam") continue;
      if (hit(e, 7, { x: this.playerX, y: this.playerY }, this.dual ? 10 : 5.5)) {
        this.killPlayer(false);
        return;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * 6 * this.shake, (Math.random() - 0.5) * 6 * this.shake);
    }
    ctx.fillStyle = "#000012";
    ctx.fillRect(0, 0, W, H);
    drawStarfield(ctx, this.stars);

    if (this.mode === "title") {
      this.drawTitle(ctx);
      ctx.restore();
      return;
    }

    for (const e of this.enemies) {
      if (e.state === "dead" || e.state === "wait") continue;
      if (e.state === "beam") {
        drawBeam(ctx, e.x, e.y + 10, 18 + (1 - e.hold / 2.4) * 42, 0.5 + Math.sin(this.time * 12) * 0.5);
      }
      drawEnemy(ctx, e.kind, e.x, e.y, e.angle, e.hurt > 0, this.time * 10 + e.id);
      if (e.captured) drawCapturedShip(ctx, e.x, e.y + 18);
    }
    for (const b of this.bullets) drawBullet(ctx, b.x, b.y, b.enemy);
    drawSparks(ctx, this.sparks);

    const showPlayer = this.dying <= 0 && (this.invuln <= 0 || Math.floor(this.time * 16) % 2 === 0);
    if (showPlayer && this.mode !== "over") {
      drawPlayer(ctx, this.playerX, this.playerY, this.dual, this.flash > 0);
    }

    this.drawHud(ctx);
    if (this.banner > 0) {
      pixelText(ctx, this.bannerText, W / 2, H * 0.46, 12, "#ffe14a");
    }
    if (this.mode === "pause") {
      pixelText(ctx, "PAUSA", W / 2, H * 0.5, 16, "#00ffff");
    }
    if (this.mode === "over") {
      pixelText(ctx, "GAME OVER", W / 2, H * 0.42, 16, "#ff2ea6");
      pixelText(ctx, "TOCA O ENTER", W / 2, H * 0.52, 10, "#ffffff");
    }
    ctx.restore();
  }

  private drawHud(ctx: CanvasRenderingContext2D): void {
    pixelText(ctx, "1UP", 52, 16, 8, "#ff2ea6");
    pixelText(ctx, padScore(this.score), 52, 30, 8, "#ffffff");
    pixelText(ctx, "HI", W / 2, 16, 8, "#ffe14a");
    pixelText(ctx, padScore(this.hi), W / 2, 30, 8, "#ffffff");
    pixelText(ctx, `E${this.stage}`, W - 40, 16, 8, "#00ffff");
    for (let i = 0; i < this.lives; i++) {
      drawPlayer(ctx, W - 16 - i * 14, 42, false, false, 0.55);
    }
  }

  private drawTitle(ctx: CanvasRenderingContext2D): void {
    titleFont(ctx, "GSLSGA", W / 2, 150, 54, "#00ffff");
    pixelText(ctx, "ESCUADRÓN NEÓN", W / 2, 198, 10, "#ff2ea6");
    const demo = [
      { k: "boss" as const, x: W / 2 - 36, y: 270 },
      { k: "moth" as const, x: W / 2, y: 270 },
      { k: "bee" as const, x: W / 2 + 36, y: 270 },
    ];
    for (const d of demo) {
      drawEnemy(ctx, d.k, d.x, d.y + Math.sin(this.time * 3 + d.x) * 4, -Math.PI / 2, false, this.time * 8);
    }
    pixelText(ctx, Math.floor(this.time * 2) % 2 === 0 ? "TOCA PARA JUGAR" : "", W / 2, 360, 10, "#ffe14a");
    pixelText(ctx, "A D / ← →  ·  Z / ESPACIO", W / 2, 410, 7, "#8aa0c8");
    pixelText(ctx, "MÓVIL: ARRASTRA · AUTO DISPARO", W / 2, 430, 7, "#8aa0c8");
    pixelText(ctx, `RÉCORD ${padScore(this.hi)}`, W / 2, 480, 8, "#ffffff");
    pixelText(ctx, "M SILENCIO  ·  P PAUSA", W / 2, 510, 7, "#5a6a88");
  }
}
