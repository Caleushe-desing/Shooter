/* Súper Salto — motor original de platformer 8-bit.
   No usa personajes, música ni marcas de Nintendo. */
(function () {
  "use strict";

  const TILE = 16;
  const NW = 320;
  const NH = 240;
  const SCALE = 3;
  const STEP = 1 / 60;
  const SAVE_KEY = "super-salto-save-v1";

  const SOLID = new Set(["=", "#", "B", "?", "M", "F", "S", "1", "U", "[", "]", "{", "}", "!"]);
  const BUMPABLE = new Set(["B", "?", "M", "F", "S", "1", "H"]);

  const THEMES = {
    grass: {
      skyTop: "#5c94fc",
      skyBot: "#7ab8ff",
      ground: "#c84c0c",
      grass: "#00a800",
      brick: "#c84c0c",
      hill: "#2d8c2d",
      hillDark: "#1f6a1f",
      bush: "#00c800",
      deco: "hills",
      hard: "#8a4a18",
    },
    cave: {
      skyTop: "#000000",
      skyBot: "#0a0a12",
      ground: "#8b5a2b",
      grass: "#6b4423",
      brick: "#c84c0c",
      hill: "#1a1a1a",
      hillDark: "#111",
      bush: "#333",
      deco: "none",
      hard: "#5a3a20",
    },
    desert: {
      skyTop: "#f0c060",
      skyBot: "#ffe09a",
      ground: "#e0a030",
      grass: "#d4942a",
      brick: "#c87820",
      hill: "#d4a84a",
      hillDark: "#c09030",
      bush: "#c07020",
      deco: "dunes",
      hard: "#c08030",
    },
    pyramid: {
      skyTop: "#1a1008",
      skyBot: "#2a1a0c",
      ground: "#c09040",
      grass: "#a07830",
      brick: "#b8860b",
      hill: "#3a2a10",
      hillDark: "#2a1a08",
      bush: "#6a4a10",
      deco: "none",
      hard: "#a07028",
    },
    sky: {
      skyTop: "#9ee4ff",
      skyBot: "#e8f7ff",
      ground: "#e8e8e8",
      grass: "#ffffff",
      brick: "#d0d0d0",
      hill: "#ffffff",
      hillDark: "#d0f0ff",
      bush: "#c0ffd0",
      deco: "clouds",
      hard: "#c8c8c8",
    },
    castle: {
      skyTop: "#1a1520",
      skyBot: "#2a2030",
      ground: "#6a6a6a",
      grass: "#7a7a7a",
      brick: "#8a4a3a",
      hill: "#2a2a2a",
      hillDark: "#1a1a1a",
      bush: "#3a3a3a",
      deco: "none",
      hard: "#8a8a8a",
    },
    night: {
      skyTop: "#0c1024",
      skyBot: "#1a2040",
      ground: "#3a5a20",
      grass: "#2a8a2a",
      brick: "#8a3a2a",
      hill: "#1a3a1a",
      hillDark: "#0a2a0a",
      bush: "#1a6a1a",
      deco: "stars",
      hard: "#3a4a28",
    },
    ghost: {
      skyTop: "#12101c",
      skyBot: "#1c1830",
      ground: "#4a3a5a",
      grass: "#5a4a6a",
      brick: "#6a4a7a",
      hill: "#2a1a3a",
      hillDark: "#1a0a2a",
      bush: "#3a2a4a",
      deco: "none",
      hard: "#4a3a5a",
    },
    lava: {
      skyTop: "#1a0808",
      skyBot: "#2a1010",
      ground: "#5a3a3a",
      grass: "#6a2a2a",
      brick: "#8a3a2a",
      hill: "#3a1010",
      hillDark: "#2a0808",
      bush: "#4a1010",
      deco: "embers",
      hard: "#5a3030",
    },
  };

  const FONT = {
    " ": [0, 0, 0, 0, 0, 0, 0],
    "0": [14, 17, 19, 21, 25, 17, 14],
    "1": [4, 12, 4, 4, 4, 4, 14],
    "2": [14, 17, 1, 2, 4, 8, 31],
    "3": [30, 1, 1, 14, 1, 1, 30],
    "4": [2, 6, 10, 18, 31, 2, 2],
    "5": [31, 16, 30, 1, 1, 17, 14],
    "6": [14, 16, 16, 30, 17, 17, 14],
    "7": [31, 1, 2, 4, 8, 8, 8],
    "8": [14, 17, 17, 14, 17, 17, 14],
    "9": [14, 17, 17, 15, 1, 1, 14],
    A: [14, 17, 17, 31, 17, 17, 17],
    B: [30, 17, 17, 30, 17, 17, 30],
    C: [14, 17, 16, 16, 16, 17, 14],
    D: [30, 17, 17, 17, 17, 17, 30],
    E: [31, 16, 16, 30, 16, 16, 31],
    F: [31, 16, 16, 30, 16, 16, 16],
    G: [14, 17, 16, 19, 17, 17, 14],
    H: [17, 17, 17, 31, 17, 17, 17],
    I: [14, 4, 4, 4, 4, 4, 14],
    J: [1, 1, 1, 1, 17, 17, 14],
    K: [17, 18, 20, 24, 20, 18, 17],
    L: [16, 16, 16, 16, 16, 16, 31],
    M: [17, 27, 21, 21, 17, 17, 17],
    N: [17, 25, 21, 19, 17, 17, 17],
    O: [14, 17, 17, 17, 17, 17, 14],
    P: [30, 17, 17, 30, 16, 16, 16],
    Q: [14, 17, 17, 17, 21, 18, 13],
    R: [30, 17, 17, 30, 20, 18, 17],
    S: [14, 17, 16, 14, 1, 17, 14],
    T: [31, 4, 4, 4, 4, 4, 4],
    U: [17, 17, 17, 17, 17, 17, 14],
    V: [17, 17, 17, 17, 17, 10, 4],
    W: [17, 17, 17, 21, 21, 21, 10],
    X: [17, 17, 10, 4, 10, 17, 17],
    Y: [17, 17, 10, 4, 4, 4, 4],
    Z: [31, 1, 2, 4, 8, 16, 31],
    "-": [0, 0, 0, 31, 0, 0, 0],
    "!": [4, 4, 4, 4, 4, 0, 4],
    ".": [0, 0, 0, 0, 0, 0, 4],
    ":": [0, 4, 0, 0, 0, 4, 0],
    "x": [0, 17, 10, 4, 10, 17, 0],
    "?": [14, 17, 1, 2, 4, 0, 4],
    "*": [0, 4, 21, 14, 21, 4, 0],
    "'": [6, 6, 2, 0, 0, 0, 0],
    ">": [8, 4, 2, 1, 2, 4, 8],
    "<": [2, 4, 8, 16, 8, 4, 2],
    "^": [4, 14, 31, 4, 4, 0, 0],
  };

  /* ---------- helpers ---------- */
  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }
  function aabb(a, b) {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }
  function pad(n, w) {
    let s = String(Math.max(0, n | 0));
    while (s.length < w) s = "0" + s;
    return s;
  }
  function rand(a, b) {
    return a + Math.random() * (b - a);
  }

  /* ---------- audio ---------- */
  const audio = {
    ctx: null,
    muted: false,
    musicTimer: null,
    musicStep: 0,
    song: null,
    hurry: false,
    unlock() {
      try {
        if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        if (this.ctx.state === "suspended") this.ctx.resume();
      } catch (e) {}
    },
    beep(freq, dur, type, vol, slide) {
      if (this.muted || !this.ctx) return;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, this.ctx.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), this.ctx.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.06, this.ctx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
      o.connect(g);
      g.connect(this.ctx.destination);
      o.start();
      o.stop(this.ctx.currentTime + dur);
    },
    jump() {
      this.beep(420, 0.12, "square", 0.05, 720);
    },
    stomp() {
      this.beep(180, 0.1, "square", 0.06, 80);
    },
    coin() {
      this.beep(980, 0.08, "square", 0.05);
      setTimeout(() => this.beep(1320, 0.12, "square", 0.05), 70);
    },
    bump() {
      this.beep(140, 0.08, "square", 0.05);
    },
    brick() {
      this.beep(120, 0.12, "sawtooth", 0.04, 60);
    },
    power() {
      [440, 554, 659, 880].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, "square", 0.05), i * 70));
    },
    fire() {
      this.beep(240, 0.08, "sawtooth", 0.04, 90);
    },
    die() {
      [520, 390, 260, 130].forEach((f, i) => setTimeout(() => this.beep(f, 0.16, "square", 0.06), i * 140));
    },
    flag() {
      [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => this.beep(f, 0.12, "square", 0.05), i * 90));
    },
    oneup() {
      [523, 659, 784, 1046, 1318].forEach((f, i) => setTimeout(() => this.beep(f, 0.1, "square", 0.05), i * 80));
    },
    pause() {
      this.beep(330, 0.08, "square", 0.04);
    },
    playMusic(kind) {
      this.stopMusic();
      this.song = kind;
      this.musicStep = 0;
      this.hurry = false;
      this.tickMusic();
    },
    tickMusic() {
      if (this.muted || !this.ctx || !this.song) return;
      const songs = {
        overworld: [392, 523, 659, 523, 392, 659, 784, 0, 659, 523, 392, 330, 349, 392, 0, 0],
        cave: [196, 247, 196, 165, 196, 247, 294, 0, 247, 196, 165, 131, 147, 165, 0, 0],
        castle: [165, 0, 165, 196, 147, 0, 131, 0, 165, 196, 220, 196, 165, 131, 110, 0],
        sky: [523, 659, 784, 988, 784, 659, 523, 0, 587, 698, 880, 698, 587, 523, 0, 0],
        map: [392, 494, 587, 494, 392, 330, 349, 392],
      };
      const seq = songs[this.song] || songs.overworld;
      const note = seq[this.musicStep % seq.length];
      if (note) this.beep(this.hurry ? note * 1.12 : note, this.hurry ? 0.1 : 0.14, "square", 0.025);
      this.musicStep++;
      const delay = this.hurry ? 140 : 220;
      this.musicTimer = setTimeout(() => this.tickMusic(), delay);
    },
    stopMusic() {
      this.song = null;
      if (this.musicTimer) clearTimeout(this.musicTimer);
      this.musicTimer = null;
    },
  };

  function musicForTheme(theme) {
    if (theme === "cave" || theme === "pyramid" || theme === "ghost") return "cave";
    if (theme === "castle" || theme === "lava") return "castle";
    if (theme === "sky") return "sky";
    return "overworld";
  }

  /* ---------- input ---------- */
  const keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    jump: false,
    run: false,
    fire: false,
    start: false,
    pause: false,
    jumpTap: false,
    fireTap: false,
    startTap: false,
    pauseTap: false,
  };

  function bindKey(e, down) {
    const k = e.code;
    const map = {
      ArrowLeft: "left",
      KeyA: "left",
      ArrowRight: "right",
      KeyD: "right",
      ArrowUp: "up",
      KeyW: "up",
      ArrowDown: "down",
      KeyS: "down",
      KeyZ: "jump",
      Space: "jump",
      KeyX: "run",
      ShiftLeft: "run",
      ShiftRight: "run",
      KeyC: "fire",
      ControlLeft: "fire",
      Enter: "start",
      Escape: "pause",
      KeyP: "pause",
      KeyM: "mute",
    };
    const name = map[k];
    if (!name) return;
    if (name === "mute" && down) {
      audio.muted = !audio.muted;
      if (audio.muted) audio.stopMusic();
      else if (game.state === "play") audio.playMusic(musicForTheme(game.stage.level.theme));
      else if (game.state === "map" || game.state === "title") audio.playMusic("map");
      return;
    }
    if (e.preventDefault) e.preventDefault();
    if (name === "jump" && down && !keys.jump) keys.jumpTap = true;
    if (name === "fire" && down && !keys.fire) keys.fireTap = true;
    if (name === "start" && down && !keys.start) keys.startTap = true;
    if (name === "pause" && down && !keys.pause) keys.pauseTap = true;
    keys[name] = down;
  }

  window.addEventListener("keydown", (e) => {
    audio.unlock();
    bindKey(e, true);
  });
  window.addEventListener("keyup", (e) => bindKey(e, false));
  window.addEventListener("pointerdown", () => audio.unlock());

  function bindTouch() {
    const root = document.getElementById("touch");
    if (!root) return;
    const set = (btn, down) => {
      if (btn === "left") keys.left = down;
      if (btn === "right") keys.right = down;
      if (btn === "down") keys.down = down;
      if (btn === "run") keys.run = down;
      if (btn === "jump") {
        if (down && !keys.jump) keys.jumpTap = true;
        keys.jump = down;
        keys.up = down;
      }
      if (btn === "fire") {
        if (down && !keys.fire) keys.fireTap = true;
        keys.fire = down;
      }
    };
    root.querySelectorAll("button").forEach((el) => {
      const btn = el.getAttribute("data-btn");
      const on = (e) => {
        e.preventDefault();
        audio.unlock();
        el.classList.add("held");
        set(btn, true);
      };
      const off = (e) => {
        e.preventDefault();
        el.classList.remove("held");
        set(btn, false);
      };
      el.addEventListener("pointerdown", on);
      el.addEventListener("pointerup", off);
      el.addEventListener("pointerleave", off);
      el.addEventListener("pointercancel", off);
    });
  }

  function consumeTaps() {
    const t = {
      jump: keys.jumpTap,
      fire: keys.fireTap,
      start: keys.startTap,
      pause: keys.pauseTap,
    };
    keys.jumpTap = keys.fireTap = keys.startTap = keys.pauseTap = false;
    return t;
  }

  /* ---------- drawing ---------- */
  function drawText(ctx, str, x, y, scale, color, align) {
    str = String(str)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();
    const w = str.length * 6 * scale;
    let px = x;
    if (align === "center") px = x - (w >> 1);
    if (align === "right") px = x - w;
    ctx.fillStyle = color || "#fff";
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT["?"];
      for (let row = 0; row < 7; row++) {
        for (let col = 0; col < 5; col++) {
          if (g[row] & (1 << (4 - col))) {
            ctx.fillRect(px + (i * 6 + col) * scale, y + row * scale, scale, scale);
          }
        }
      }
    }
  }

  function fillRect(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(x | 0, y | 0, w, h);
  }

  /* ---------- stage ---------- */
  function isSolidTile(t, meta) {
    if (SOLID.has(t)) return true;
    if (t === "-" && meta && meta.vy >= 0 && meta.wasAbove) return true;
    return false;
  }

  function Stage(level) {
    this.level = level;
    this.w = level.w;
    this.h = level.h;
    this.tiles = level.map.map((r) => r.split(""));
    this.theme = THEMES[level.theme] || THEMES.grass;
    this.ents = [];
    this.particles = [];
    this.popups = [];
    this.bump = {};
    this.time = level.time;
    this.tick = 0;
    this.cleared = false;
    this.spawn = { x: 32, y: 160 };
    this.parse();
  }

  Stage.prototype.get = function (tx, ty) {
    if (ty < 0) return ".";
    if (tx < 0 || tx >= this.w || ty >= this.h) return "#";
    return this.tiles[ty][tx];
  };

  Stage.prototype.set = function (tx, ty, c) {
    if (tx < 0 || ty < 0 || tx >= this.w || ty >= this.h) return;
    this.tiles[ty][tx] = c;
  };

  Stage.prototype.restY = function (tx, ty, h) {
    let gy = ty;
    while (gy < this.h && !SOLID.has(this.tiles[gy][tx])) gy++;
    if (gy >= this.h) return ty * TILE;
    return gy * TILE - h;
  };

  Stage.prototype.parse = function () {
    for (let ty = 0; ty < this.h; ty++) {
      for (let tx = 0; tx < this.w; tx++) {
        const c = this.tiles[ty][tx];
        const px = tx * TILE;
        if (c === "@") {
          this.spawn = { x: px, y: this.restY(tx, ty, 16) };
          this.tiles[ty][tx] = ".";
        } else if (c === "g") {
          this.ents.push(new Goomba(px, this.restY(tx, ty, 16)));
          this.tiles[ty][tx] = ".";
        } else if (c === "k") {
          this.ents.push(new Koopa(px, this.restY(tx, ty, 24)));
          this.tiles[ty][tx] = ".";
        } else if (c === "f") {
          this.ents.push(new Flyer(px, ty * TILE));
          this.tiles[ty][tx] = ".";
        } else if (c === "n") {
          this.ents.push(new Ghost(px, ty * TILE));
          this.tiles[ty][tx] = ".";
        } else if (c === "p") {
          this.ents.push(new Piranha(px, (ty + 1) * TILE));
          this.tiles[ty][tx] = ".";
        } else if (c === "o") {
          this.ents.push(new CoinPickup(px + 3, ty * TILE + 2));
          this.tiles[ty][tx] = ".";
        } else if (c === "X") {
          this.ents.push(new Boss(px, this.restY(tx, ty, 32)));
          this.tiles[ty][tx] = ".";
        }
      }
    }
  };

  Stage.prototype.solidAt = function (x, y, w, h, vy, prevBottom) {
    const x0 = Math.floor(x / TILE);
    const x1 = Math.floor((x + w - 0.001) / TILE);
    const y0 = Math.floor(y / TILE);
    const y1 = Math.floor((y + h - 0.001) / TILE);
    const hits = [];
    for (let ty = y0; ty <= y1; ty++) {
      for (let tx = x0; tx <= x1; tx++) {
        const t = this.get(tx, ty);
        const tileTop = ty * TILE;
        const wasAbove = prevBottom !== undefined && prevBottom <= tileTop + 1;
        if (isSolidTile(t, { vy: vy, wasAbove: wasAbove })) {
          hits.push({ tx: tx, ty: ty, t: t, left: tx * TILE, right: (tx + 1) * TILE, top: tileTop, bot: (ty + 1) * TILE });
        }
      }
    }
    return hits;
  };

  Stage.prototype.bumpBlock = function (tx, ty, player) {
    const t = this.get(tx, ty);
    if (!BUMPABLE.has(t) && t !== "H") return;
    const key = tx + "," + ty;
    if (this.bump[key] > 0) return;
    this.bump[key] = 8;

    if (t === "H") {
      this.set(tx, ty, "U");
      this.spawnCoinPop(tx, ty);
      audio.coin();
      return;
    }
    if (t === "B") {
      if (player.power > 0) {
        this.set(tx, ty, ".");
        this.shatter(tx, ty);
        audio.brick();
        addScore(50);
      } else {
        audio.bump();
      }
      this.hitAbove(tx, ty);
      return;
    }
    if (t === "1") {
      this.set(tx, ty, "U");
      this.ents.push(new Mushroom(tx * TILE, ty * TILE, true));
      audio.power();
      this.hitAbove(tx, ty);
      return;
    }
    let item = "coin";
    if (t === "M") item = player.power === 0 ? "mush" : "flower";
    if (t === "F") item = "flower";
    if (t === "S") item = "star";
    this.set(tx, ty, "U");
    if (item === "coin") {
      this.spawnCoinPop(tx, ty);
      audio.coin();
    } else if (item === "mush") {
      this.ents.push(new Mushroom(tx * TILE, ty * TILE, false));
      audio.power();
    } else if (item === "flower") {
      this.ents.push(new Flower(tx * TILE, ty * TILE));
      audio.power();
    } else if (item === "star") {
      this.ents.push(new Star(tx * TILE, ty * TILE));
      audio.power();
    }
    this.hitAbove(tx, ty);
  };

  Stage.prototype.hitAbove = function (tx, ty) {
    const box = { x: tx * TILE, y: (ty - 1) * TILE, w: TILE, h: TILE };
    for (const e of this.ents) {
      if (e.dead || !e.stompable) continue;
      if (aabb(e, box)) {
        e.flipDie();
        addScore(100);
      }
    }
  };

  Stage.prototype.spawnCoinPop = function (tx, ty) {
    game.coins = (game.coins + 1) % 100;
    addScore(200);
    if (game.coins === 0) {
      game.lives++;
      audio.oneup();
      this.popups.push({ x: tx * TILE, y: ty * TILE, text: "1UP", life: 50 });
    }
    this.popups.push({ x: tx * TILE + 2, y: ty * TILE - 8, text: "200", life: 40 });
    this.particles.push({
      x: tx * TILE + 4,
      y: ty * TILE,
      vx: 0,
      vy: -2.4,
      life: 22,
      kind: "coin",
    });
  };

  Stage.prototype.shatter = function (tx, ty) {
    const cx = tx * TILE + 8;
    const cy = ty * TILE + 8;
    const dirs = [
      [-1.6, -3.2],
      [1.6, -3.2],
      [-2.1, -1.6],
      [2.1, -1.6],
    ];
    for (const d of dirs) {
      this.particles.push({ x: cx, y: cy, vx: d[0], vy: d[1], life: 32, kind: "brick" });
    }
  };

  Stage.prototype.updatePhysics = function (ent, gravity) {
    const prevBottom = ent.y + ent.h;
    ent.vy += gravity;
    if (ent.vy > 4.6) ent.vy = 4.6;

    ent.x += ent.vx;
    let hits = this.solidAt(ent.x, ent.y, ent.w, ent.h, 0, prevBottom);
    for (const h of hits) {
      if (ent.vx > 0) {
        ent.x = h.left - ent.w;
        ent.vx = 0;
        ent.wall = 1;
      } else if (ent.vx < 0) {
        ent.x = h.right;
        ent.vx = 0;
        ent.wall = -1;
      }
    }

    ent.y += ent.vy;
    ent.onGround = false;
    ent.wall = 0;
    hits = this.solidAt(ent.x, ent.y, ent.w, ent.h, ent.vy, prevBottom);
    for (const h of hits) {
      if (ent.vy > 0) {
        ent.y = h.top - ent.h;
        ent.vy = 0;
        ent.onGround = true;
      } else if (ent.vy < 0) {
        ent.y = h.bot;
        ent.vy = 0;
        ent.hitCeil = { tx: h.tx, ty: h.ty };
      }
    }
  };

  /* ---------- entities ---------- */
  function Goomba(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.vx = -0.45;
    this.vy = 0;
    this.dead = false;
    this.stompable = true;
    this.flat = 0;
    this.kind = "goomba";
    this.dir = -1;
  }
  Goomba.prototype.update = function (stage) {
    if (this.flat > 0) {
      this.flat--;
      if (this.flat <= 0) this.dead = true;
      return;
    }
    this.wall = 0;
    stage.updatePhysics(this, 0.28);
    if (this.wall) this.vx *= -1;
    if (this.onGround) this.vx = (this.vx < 0 ? -1 : 1) * 0.45;
  };
  Goomba.prototype.stomp = function () {
    this.flat = 28;
    this.vx = 0;
    this.stompable = false;
    audio.stomp();
  };
  Goomba.prototype.flipDie = function () {
    this.dead = true;
    audio.stomp();
  };
  Goomba.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    if (this.flat > 0) {
      fillRect(ctx, x, y + 10, 16, 6, "#8b4513");
      fillRect(ctx, x + 1, y + 11, 14, 4, "#c07030");
      return;
    }
    const step = Math.floor(tick / 10) % 2;
    fillRect(ctx, x + 1, y + 4, 14, 12, "#8b4513");
    fillRect(ctx, x + 2, y + 2, 12, 6, "#a05a20");
    fillRect(ctx, x + 4, y + 6, 2, 2, "#1a1a1a");
    fillRect(ctx, x + 10, y + 6, 2, 2, "#1a1a1a");
    fillRect(ctx, x + 2 + step, y + 14, 4, 2, "#3a2010");
    fillRect(ctx, x + 10 - step, y + 14, 4, 2, "#3a2010");
  };

  function Koopa(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 24;
    this.vx = -0.4;
    this.vy = 0;
    this.dead = false;
    this.stompable = true;
    this.kind = "koopa";
    this.mode = "walk";
    this.wake = 0;
  }
  Koopa.prototype.update = function (stage) {
    if (this.mode === "shell" && this.vx === 0) {
      this.wake++;
      if (this.wake > 240) {
        this.mode = "walk";
        this.h = 24;
        this.y -= 10;
        this.wake = 0;
        this.vx = -0.4;
      }
      stage.updatePhysics(this, 0.28);
      return;
    }
    this.wall = 0;
    stage.updatePhysics(this, 0.28);
    if (this.mode === "slide") {
      if (this.wall) this.vx *= -1;
      for (const e of stage.ents) {
        if (e === this || e.dead || !e.stompable) continue;
        if (aabb(this, e)) {
          e.flipDie();
          addScore(200);
        }
      }
      return;
    }
    if (this.wall) this.vx *= -1;
    if (this.onGround && this.mode === "walk") this.vx = (this.vx < 0 ? -1 : 1) * 0.4;
  };
  Koopa.prototype.stomp = function (player) {
    audio.stomp();
    if (this.mode === "walk") {
      this.mode = "shell";
      this.h = 14;
      this.y += 10;
      this.vx = 0;
      this.wake = 0;
    } else if (this.mode === "shell") {
      this.mode = "slide";
      this.vx = player.x + player.w / 2 < this.x + 8 ? 3.2 : -3.2;
    } else {
      this.mode = "shell";
      this.vx = 0;
      this.wake = 0;
    }
  };
  Koopa.prototype.flipDie = function () {
    this.dead = true;
    audio.stomp();
  };
  Koopa.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const green = "#2a9a2a";
    const dark = "#145014";
    if (this.mode !== "walk") {
      fillRect(ctx, x + 1, y + 2, 14, 12, green);
      fillRect(ctx, x + 3, y + 4, 10, 8, "#3ec83e");
      fillRect(ctx, x + 5, y + 6, 6, 4, dark);
      return;
    }
    fillRect(ctx, x + 3, y, 10, 8, "#f0d0a0");
    fillRect(ctx, x + 5, y + 2, 2, 2, "#1a1a1a");
    fillRect(ctx, x + 9, y + 2, 2, 2, "#1a1a1a");
    fillRect(ctx, x + 1, y + 8, 14, 14, green);
    fillRect(ctx, x + 3, y + 10, 10, 10, "#3ec83e");
    const step = Math.floor(tick / 10) % 2;
    fillRect(ctx, x + 2 + step, y + 22, 4, 2, "#f0d0a0");
    fillRect(ctx, x + 10 - step, y + 22, 4, 2, "#f0d0a0");
  };

  function Flyer(x, y) {
    this.x = x;
    this.y = y;
    this.homeY = y;
    this.w = 16;
    this.h = 16;
    this.vx = -0.55;
    this.vy = 0;
    this.dead = false;
    this.stompable = true;
    this.kind = "flyer";
    this.t = Math.random() * 10;
  }
  Flyer.prototype.update = function () {
    this.t += 0.08;
    this.x += this.vx;
    this.y = this.homeY + Math.sin(this.t) * 18;
    if (this.x < 0) this.vx = Math.abs(this.vx);
  };
  Flyer.prototype.stomp = function () {
    this.dead = true;
    audio.stomp();
  };
  Flyer.prototype.flipDie = function () {
    this.dead = true;
  };
  Flyer.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const flap = Math.sin(tick * 0.4) > 0;
    fillRect(ctx, x + 2, y + 4, 12, 10, "#3a8ad0");
    fillRect(ctx, x + 4, y + 6, 2, 2, "#fff");
    fillRect(ctx, x + 10, y + 6, 2, 2, "#fff");
    fillRect(ctx, x + (flap ? -2 : 2), y + (flap ? 0 : 6), 6, 4, "#d0e8ff");
    fillRect(ctx, x + (flap ? 12 : 8), y + (flap ? 0 : 6), 6, 4, "#d0e8ff");
  };

  function Ghost(x, y) {
    this.x = x;
    this.y = y;
    this.w = 16;
    this.h = 16;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.stompable = false;
    this.kind = "ghost";
    this.frozen = false;
  }
  Ghost.prototype.update = function (stage, player) {
    if (!player || player.dead) return;
    const dx = player.x + player.w / 2 - (this.x + 8);
    const looking = dx * player.facing > 0;
    this.frozen = looking;
    if (!looking) {
      this.x += Math.sign(dx) * 0.55;
      const dy = player.y + player.h / 2 - (this.y + 8);
      this.y += Math.sign(dy) * 0.35;
    }
  };
  Ghost.prototype.flipDie = function () {
    this.dead = true;
  };
  Ghost.prototype.draw = function (ctx, cam) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    fillRect(ctx, x + 2, y + 2, 12, 12, this.frozen ? "#e8e8ff" : "#f4f4ff");
    fillRect(ctx, x + 4, y + 1, 8, 2, "#f4f4ff");
    if (this.frozen) {
      fillRect(ctx, x + 4, y + 6, 3, 1, "#333");
      fillRect(ctx, x + 9, y + 6, 3, 1, "#333");
    } else {
      fillRect(ctx, x + 4, y + 5, 2, 3, "#222");
      fillRect(ctx, x + 10, y + 5, 2, 3, "#222");
    }
    fillRect(ctx, x + 4, y + 14, 2, 2, "#f4f4ff");
    fillRect(ctx, x + 7, y + 14, 2, 2, "#f4f4ff");
    fillRect(ctx, x + 10, y + 14, 2, 2, "#f4f4ff");
  };

  function Piranha(x, yPipeTop) {
    this.pipeX = x;
    this.homeY = yPipeTop;
    this.x = x;
    this.y = yPipeTop;
    this.w = 16;
    this.h = 24;
    this.dead = false;
    this.stompable = false;
    this.kind = "piranha";
    this.out = 0;
    this.phase = 0;
    this.timer = 40 + ((x / TILE) % 7) * 10;
    this.vx = 0;
    this.vy = 0;
  }
  Piranha.prototype.update = function (stage, player) {
    const near =
      player && Math.abs(player.x + player.w / 2 - (this.pipeX + 8)) < 22 && player.y + player.h <= this.homeY + 2;
    this.timer--;
    if (this.phase === 0) {
      this.out = 0;
      if (this.timer <= 0 && !near) {
        this.phase = 1;
        this.timer = 28;
      }
    } else if (this.phase === 1) {
      this.out = Math.min(24, this.out + 1);
      if (this.timer <= 0) {
        this.phase = 2;
        this.timer = 70;
      }
    } else if (this.phase === 2) {
      if (this.timer <= 0) {
        this.phase = 3;
        this.timer = 28;
      }
    } else {
      this.out = Math.max(0, this.out - 1);
      if (this.timer <= 0) {
        this.phase = 0;
        this.timer = 90;
      }
    }
    this.y = this.homeY - this.out;
    this.x = this.pipeX;
  };
  Piranha.prototype.flipDie = function () {
    this.dead = true;
  };
  Piranha.prototype.hurts = function () {
    return this.out > 8;
  };
  Piranha.prototype.draw = function (ctx, cam) {
    if (this.out <= 0) return;
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    fillRect(ctx, x + 6, y + 10, 4, this.out, "#1a8a1a");
    fillRect(ctx, x + 1, y, 14, 14, "#d02020");
    fillRect(ctx, x + 3, y + 3, 3, 3, "#fff");
    fillRect(ctx, x + 10, y + 4, 2, 2, "#fff");
    fillRect(ctx, x + 4, y + 10, 8, 3, "#fff8e0");
    fillRect(ctx, x + 5, y + 11, 2, 2, "#222");
    fillRect(ctx, x + 9, y + 11, 2, 2, "#222");
  };

  function CoinPickup(x, y) {
    this.x = x;
    this.y = y;
    this.w = 10;
    this.h = 14;
    this.dead = false;
    this.stompable = false;
    this.kind = "coin";
    this.vx = 0;
    this.vy = 0;
  }
  CoinPickup.prototype.update = function () {};
  CoinPickup.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const spin = Math.abs(Math.sin(tick * 0.15));
    const w = 2 + spin * 8;
    fillRect(ctx, x + 5 - w / 2, y, w, 14, "#ffd000");
    fillRect(ctx, x + 5 - w / 4, y + 2, Math.max(1, w / 2), 10, "#ffe86a");
  };

  function Mushroom(x, y, oneup) {
    this.x = x;
    this.y = y - 1;
    this.w = 16;
    this.h = 16;
    this.vx = 0.7;
    this.vy = 0;
    this.dead = false;
    this.stompable = false;
    this.kind = oneup ? "oneup" : "mush";
    this.emerge = 16;
    this.oneup = oneup;
  }
  Mushroom.prototype.update = function (stage) {
    if (this.emerge > 0) {
      this.emerge--;
      this.y -= 1;
      return;
    }
    this.wall = 0;
    stage.updatePhysics(this, 0.28);
    if (this.wall) this.vx *= -1;
  };
  Mushroom.prototype.draw = function (ctx, cam) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const cap = this.oneup ? "#2ecc71" : "#e23b3b";
    fillRect(ctx, x + 1, y, 14, 8, cap);
    fillRect(ctx, x + 3, y + 2, 3, 3, "#fff");
    fillRect(ctx, x + 10, y + 2, 3, 3, "#fff");
    fillRect(ctx, x + 4, y + 8, 8, 8, "#f0d0a0");
    fillRect(ctx, x + 5, y + 10, 2, 2, "#333");
    fillRect(ctx, x + 9, y + 10, 2, 2, "#333");
  };

  function Flower(x, y) {
    this.x = x;
    this.y = y - 1;
    this.w = 16;
    this.h = 16;
    this.vx = 0;
    this.vy = 0;
    this.dead = false;
    this.stompable = false;
    this.kind = "flower";
    this.emerge = 16;
  }
  Flower.prototype.update = function () {
    if (this.emerge > 0) {
      this.emerge--;
      this.y -= 1;
    }
  };
  Flower.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    const flash = Math.floor(tick / 8) % 2;
    fillRect(ctx, x + 7, y + 8, 2, 8, "#1a9a1a");
    fillRect(ctx, x + 2, y, 12, 10, flash ? "#ffdd33" : "#ff6622");
    fillRect(ctx, x + 6, y + 3, 4, 4, "#fff8d0");
  };

  function Star(x, y) {
    this.x = x;
    this.y = y - 1;
    this.w = 16;
    this.h = 16;
    this.vx = 1.1;
    this.vy = -2;
    this.dead = false;
    this.stompable = false;
    this.kind = "star";
    this.emerge = 16;
  }
  Star.prototype.update = function (stage) {
    if (this.emerge > 0) {
      this.emerge--;
      this.y -= 1;
      return;
    }
    this.wall = 0;
    stage.updatePhysics(this, 0.18);
    if (this.wall) this.vx *= -1;
    if (this.onGround) this.vy = -3.4;
  };
  Star.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    ctx.fillStyle = Math.floor(tick / 4) % 2 ? "#fff36a" : "#ffe100";
    ctx.beginPath();
    ctx.moveTo(x + 8, y);
    ctx.lineTo(x + 10, y + 6);
    ctx.lineTo(x + 16, y + 6);
    ctx.lineTo(x + 11, y + 10);
    ctx.lineTo(x + 13, y + 16);
    ctx.lineTo(x + 8, y + 12);
    ctx.lineTo(x + 3, y + 16);
    ctx.lineTo(x + 5, y + 10);
    ctx.lineTo(x, y + 6);
    ctx.lineTo(x + 6, y + 6);
    ctx.closePath();
    ctx.fill();
  };

  function Fireball(x, y, dir) {
    this.x = x;
    this.y = y;
    this.w = 8;
    this.h = 8;
    this.vx = dir * 3.1;
    this.vy = 1.2;
    this.dead = false;
    this.stompable = false;
    this.kind = "fireball";
    this.bounces = 0;
    this.life = 90;
  }
  Fireball.prototype.update = function (stage) {
    this.life--;
    if (this.life <= 0) {
      this.dead = true;
      return;
    }
    this.wall = 0;
    stage.updatePhysics(this, 0.22);
    if (this.onGround) {
      this.vy = -2.4;
      this.bounces++;
    }
    if (this.wall || this.bounces > 4) {
      this.dead = true;
      return;
    }
    if (this.kind === "bossfire") return;
    for (const e of stage.ents) {
      if (e.dead || e === this) continue;
      if (
        e.kind === "fireball" ||
        e.kind === "bossfire" ||
        e.kind === "coin" ||
        e.kind === "mush" ||
        e.kind === "flower" ||
        e.kind === "star" ||
        e.kind === "oneup"
      )
        continue;
      if (aabb(this, e)) {
        e.flipDie();
        addScore(e.kind === "boss" ? 1000 : 200);
        this.dead = true;
        break;
      }
    }
  };
  Fireball.prototype.draw = function (ctx, cam, tick) {
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    fillRect(ctx, x, y, 8, 8, Math.floor(tick / 3) % 2 ? "#ffee88" : "#ff6622");
    fillRect(ctx, x + 2, y + 2, 4, 4, "#fff");
  };

  function Boss(x, y) {
    this.x = x;
    this.y = y;
    this.w = 32;
    this.h = 32;
    this.vx = -0.55;
    this.vy = 0;
    this.dead = false;
    this.stompable = true;
    this.kind = "boss";
    this.hp = 5;
    this.flash = 0;
    this.shoot = 80;
  }
  Boss.prototype.update = function (stage, player) {
    if (this.flash > 0) this.flash--;
    this.wall = 0;
    stage.updatePhysics(this, 0.28);
    if (this.wall) this.vx *= -1;
    if (this.onGround && Math.random() < 0.01) this.vy = -4.4;
    this.shoot--;
    if (this.shoot <= 0 && player && !player.dead) {
      this.shoot = 90;
      const dir = player.x > this.x ? 1 : -1;
      stage.ents.push(new Fireball(this.x + 12, this.y + 10, dir));
      stage.ents[stage.ents.length - 1].vx = dir * 1.6;
      stage.ents[stage.ents.length - 1].kind = "bossfire";
    }
  };
  Boss.prototype.stomp = function (player) {
    if (this.flash > 0) return;
    this.hp--;
    this.flash = 30;
    audio.stomp();
    player.vy = -4;
    if (this.hp <= 0) {
      this.dead = true;
      addScore(5000);
      audio.flag();
    }
  };
  Boss.prototype.flipDie = function () {
    if (this.flash > 0) return;
    this.hp--;
    this.flash = 20;
    if (this.hp <= 0) {
      this.dead = true;
      addScore(5000);
    }
  };
  Boss.prototype.draw = function (ctx, cam, tick) {
    if (this.flash > 0 && tick % 4 < 2) return;
    const x = this.x - cam.x;
    const y = this.y - cam.y;
    fillRect(ctx, x + 4, y + 8, 24, 24, "#c43c14");
    fillRect(ctx, x + 8, y + 12, 16, 12, "#e06030");
    fillRect(ctx, x + 10, y + 16, 3, 3, "#fff");
    fillRect(ctx, x + 19, y + 16, 3, 3, "#fff");
    fillRect(ctx, x + 10, y + 17, 2, 2, "#111");
    fillRect(ctx, x + 19, y + 17, 2, 2, "#111");
    fillRect(ctx, x + 8, y, 6, 10, "#8a1a00");
    fillRect(ctx, x + 18, y, 6, 10, "#8a1a00");
    fillRect(ctx, x + 12, y + 2, 8, 6, "#ffd000");
    for (let i = 0; i < this.hp; i++) fillRect(ctx, x + 6 + i * 5, y - 6, 4, 3, "#ff4444");
  };

  /* ---------- player ---------- */
  function Player() {
    this.reset(32, 160, 0);
  }
  Player.prototype.reset = function (x, y, power) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.power = power || 0;
    this.facing = 1;
    this.onGround = false;
    this.dead = false;
    this.star = 0;
    this.invuln = 0;
    this.ducking = false;
    this.anim = 0;
    this.coyote = 0;
    this.jumpHold = 0;
    this.skid = false;
    this.flag = 0;
    this.walkIn = 0;
    this.fireCool = 0;
    this.deathT = 0;
  };
  Player.prototype.body = function () {
    const small = this.power === 0 || this.ducking;
    return { w: small ? 12 : 14, h: small ? 16 : 32 };
  };
  Object.defineProperty(Player.prototype, "w", {
    get() {
      return this.body().w;
    },
  });
  Object.defineProperty(Player.prototype, "h", {
    get() {
      return this.body().h;
    },
  });

  Player.prototype.die = function () {
    if (this.dead) return;
    this.dead = true;
    this.deathT = 0;
    this.vx = 0;
    this.vy = -5.2;
    audio.stopMusic();
    audio.die();
  };

  Player.prototype.hurt = function () {
    if (this.dead || this.invuln > 0 || this.star > 0 || this.flag) return;
    if (this.power > 0) {
      if (!this.ducking) this.y += 16;
      this.ducking = false;
      this.power = 0;
      this.invuln = 120;
      audio.bump();
    } else this.die();
  };

  Player.prototype.update = function (stage, taps) {
    if (this.dead) {
      this.deathT++;
      this.vy += 0.22;
      this.y += this.vy;
      return;
    }
    if (this.flag === 1) {
      this.vx = 0;
      this.x = Math.floor(this.x);
      this.vy = 1.4;
      this.y += this.vy;
      const ground = stage.restY(Math.floor((this.x + 6) / TILE), 0, this.h);
      if (this.y >= ground) {
        this.y = ground;
        this.flag = 2;
        this.walkIn = 0;
      }
      return;
    }
    if (this.flag === 2) {
      this.facing = 1;
      this.vx = 1.1;
      this.x += this.vx;
      this.anim += 0.2;
      this.walkIn++;
      return;
    }

    if (this.invuln > 0) this.invuln--;
    if (this.star > 0) this.star--;
    if (this.fireCool > 0) this.fireCool--;
    const wantDuck = this.power > 0 && keys.down && this.onGround;
    if (wantDuck && !this.ducking) {
      this.ducking = true;
      this.y += 16;
    } else if (!wantDuck && this.ducking) {
      const standHits = stage.solidAt(this.x, this.y - 16, 14, 32, 0, this.y + this.h);
      if (!standHits.length) {
        this.ducking = false;
        this.y -= 16;
      }
    }

    const run = keys.run && !this.ducking;
    const acc = run ? 0.11 : 0.075;
    const max = run ? 2.25 : 1.32;

    if (!this.ducking) {
      if (keys.left) {
        this.vx -= acc;
        if (this.vx > 0.4 && this.onGround) this.skid = true;
        this.facing = -1;
      } else if (keys.right) {
        this.vx += acc;
        if (this.vx < -0.4 && this.onGround) this.skid = true;
        this.facing = 1;
      } else {
        this.skid = false;
        const fr = this.onGround ? 0.09 : 0.03;
        if (this.vx > fr) this.vx -= fr;
        else if (this.vx < -fr) this.vx += fr;
        else this.vx = 0;
      }
    } else {
      const fr = 0.12;
      if (this.vx > fr) this.vx -= fr;
      else if (this.vx < -fr) this.vx += fr;
      else this.vx = 0;
    }
    this.vx = clamp(this.vx, -max, max);
    if (Math.abs(this.vx) < 0.35) this.skid = false;

    if (this.onGround) this.coyote = 8;
    else if (this.coyote > 0) this.coyote--;

    if (taps.jump && this.coyote > 0) {
      this.vy = -5.35 - (Math.abs(this.vx) > 1.6 ? 0.4 : 0);
      this.onGround = false;
      this.coyote = 0;
      this.jumpHold = 12;
      audio.jump();
    }
    if (!keys.jump) this.jumpHold = 0;
    else if (this.jumpHold > 0) this.jumpHold--;

    const grav = this.vy < 0 && keys.jump && this.jumpHold > 0 ? 0.13 : 0.28;
    const prevBottom = this.y + this.h;
    const bw = this.w;
    const bh = this.h;

    this.x += this.vx;
    if (this.x < 0) {
      this.x = 0;
      this.vx = 0;
    }
    if (this.x > stage.w * TILE - bw) this.x = stage.w * TILE - bw;
    let hits = stage.solidAt(this.x, this.y, bw, bh, 0, prevBottom);
    for (const h of hits) {
      if (this.vx > 0) this.x = h.left - bw;
      else if (this.vx < 0) this.x = h.right;
      this.vx = 0;
    }

    this.vy += grav;
    if (this.vy > 4.6) this.vy = 4.6;
    this.y += this.vy;
    this.onGround = false;
    hits = stage.solidAt(this.x, this.y, bw, bh, this.vy, prevBottom);
    for (const h of hits) {
      if (this.vy > 0) {
        this.y = h.top - bh;
        this.vy = 0;
        this.onGround = true;
      } else if (this.vy < 0) {
        this.y = h.bot;
        this.vy = 0;
        stage.bumpBlock(h.tx, h.ty, this);
      }
    }
    if (this.vy < 0) {
      const tx = Math.floor((this.x + bw / 2) / TILE);
      const ty = Math.floor((this.y - 1) / TILE);
      if (stage.get(tx, ty) === "H") stage.bumpBlock(tx, ty, this);
    }

    this.anim += Math.abs(this.vx) * 0.18 + 0.02;

    if (this.power === 2 && taps.fire && this.fireCool === 0 && !this.ducking) {
      const balls = stage.ents.filter((e) => e.kind === "fireball" && !e.dead).length;
      if (balls < 2) {
        stage.ents.push(new Fireball(this.x + (this.facing > 0 ? bw : -8), this.y + 8, this.facing));
        this.fireCool = 12;
        audio.fire();
      }
    }

    const feet = this.y + bh;
    const cx = this.x + bw / 2;
    const ft = stage.get(Math.floor(cx / TILE), Math.floor((feet - 1) / TILE));
    const mid = stage.get(Math.floor(cx / TILE), Math.floor((this.y + bh / 2) / TILE));
    if (ft === "~" || mid === "~" || ft === "^") this.die();
    if (this.y > stage.h * TILE + 24) this.die();

    if (!stage.cleared) {
      const t1 = stage.get(Math.floor(cx / TILE), Math.floor(this.y / TILE));
      const t2 = stage.get(Math.floor(cx / TILE), Math.floor((this.y + bh / 2) / TILE));
      if (t1 === "|" || t2 === "|" || t1 === "!" || t2 === "!") {
        stage.cleared = true;
        this.flag = 1;
        this.vx = 0;
        audio.stopMusic();
        audio.flag();
      }
    }
  };

  Player.prototype.draw = function (ctx, cam, tick) {
    if (this.invuln > 0 && tick % 4 < 2 && !this.dead) return;
    const x = Math.round(this.x - cam.x);
    const y = Math.round(this.y - cam.y);
    const small = this.power === 0 || this.ducking;
    const fire = this.power === 2;
    const cap = fire ? "#f4f4f4" : "#ff7a18";
    const shirt = fire ? "#f4f4f4" : "#14b8a6";
    const pants = fire ? "#d22b2b" : "#0f766e";
    const skin = "#f0c090";
    const starFlash = this.star > 0 && tick % 6 < 3;
    const body = starFlash ? "#ffe100" : shirt;

    if (this.dead) {
      fillRect(ctx, x + 2, y, 10, 6, cap);
      fillRect(ctx, x + 3, y + 5, 8, 6, skin);
      fillRect(ctx, x + 2, y + 10, 10, 6, body);
      return;
    }

    const walk = this.onGround && Math.abs(this.vx) > 0.2;
    const leg = walk ? Math.sin(this.anim * 6) * (small ? 2 : 3) : 0;
    const flip = this.facing < 0;

    ctx.save();
    if (flip) {
      ctx.translate(x + (small ? 6 : 7), 0);
      ctx.scale(-1, 1);
      ctx.translate(-(x + (small ? 6 : 7)), 0);
    }

    if (small) {
      fillRect(ctx, x + 2, y, 10, 5, cap);
      fillRect(ctx, x + 1, y + 3, 12, 2, cap);
      fillRect(ctx, x + 3, y + 5, 8, 5, skin);
      fillRect(ctx, x + 8, y + 6, 2, 2, "#222");
      fillRect(ctx, x + 2, y + 10, 10, 4, body);
      fillRect(ctx, x + 3, y + 14, 3, 2, "#5a3a1a");
      fillRect(ctx, x + 8, y + 14, 3, 2, "#5a3a1a");
      if (walk) fillRect(ctx, x + 3, y + 14 + (leg > 0 ? 1 : 0), 3, 2, "#5a3a1a");
    } else {
      fillRect(ctx, x + 2, y, 12, 6, cap);
      fillRect(ctx, x + 1, y + 4, 14, 2, cap);
      fillRect(ctx, x + 3, y + 6, 10, 7, skin);
      fillRect(ctx, x + 10, y + 8, 2, 2, "#222");
      fillRect(ctx, x + 2, y + 13, 12, 10, body);
      fillRect(ctx, x + 4, y + 13, 2, 8, pants);
      fillRect(ctx, x + 10, y + 13, 2, 8, pants);
      fillRect(ctx, x + 2, y + 22, 12, 6, pants);
      fillRect(ctx, x + 3, y + 28, 4, 4, "#5a3a1a");
      fillRect(ctx, x + 9, y + 28 + (leg > 0 ? 1 : 0), 4, 4, "#5a3a1a");
      fillRect(ctx, x, y + 14, 3, 6, skin);
      fillRect(ctx, x + 13, y + 14, 3, 6, skin);
    }
    ctx.restore();
  };

  /* ---------- game ---------- */
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  const buf = document.createElement("canvas");
  buf.width = NW;
  buf.height = NH;
  const g = buf.getContext("2d");

  const game = {
    state: "title",
    menu: 0,
    mapIndex: 0,
    lives: 5,
    coins: 0,
    score: 0,
    best: 0,
    powerKeep: 0,
    stage: null,
    player: new Player(),
    cam: { x: 0, y: 0 },
    freeze: 0,
    timeAcc: 0,
    overlay: 0,
    pauseMenu: 0,
    winT: 0,
  };

  function addScore(n) {
    game.score += n;
    if (game.score > game.best) game.best = game.score;
  }

  function defaultSave() {
    return { lives: 5, coins: 0, score: 0, best: 0, unlocked: ["1-1"], completed: [], mapIndex: 0 };
  }

  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY));
      if (!s || !s.unlocked) return defaultSave();
      return Object.assign(defaultSave(), s);
    } catch (e) {
      return defaultSave();
    }
  }

  function persist() {
    const s = {
      lives: game.lives,
      coins: game.coins,
      score: game.score,
      best: game.best,
      unlocked: game.unlocked,
      completed: game.completed,
      mapIndex: game.mapIndex,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(s));
    } catch (e) {}
  }

  function applySave(s) {
    game.lives = s.lives;
    game.coins = s.coins;
    game.score = s.score;
    game.best = s.best || 0;
    game.unlocked = s.unlocked.slice();
    game.completed = s.completed.slice();
    game.mapIndex = s.mapIndex || 0;
  }

  function allLevelIds() {
    return window.SUPER_SALTO_DATA.allLevels().map((l) => l.id);
  }

  function unlockNext(id) {
    if (game.completed.indexOf(id) < 0) game.completed.push(id);
    const next = window.SUPER_SALTO_DATA.nextLevel(id);
    if (next && game.unlocked.indexOf(next.id) < 0) game.unlocked.push(next.id);
    persist();
  }

  function startLevel(id) {
    const level = window.SUPER_SALTO_DATA.findLevel(id);
    if (!level) return;
    game.stage = new Stage(level);
    game.player.reset(game.stage.spawn.x, game.stage.spawn.y, game.powerKeep);
    game.cam.x = clamp(game.player.x - 80, 0, game.stage.w * TILE - NW);
    game.cam.y = 0;
    game.state = "play";
    game.freeze = 0;
    game.timeAcc = 0;
    game.overlay = 40;
    audio.playMusic(musicForTheme(level.theme));
  }

  function interactEntities() {
    const p = game.player;
    const st = game.stage;
    if (p.dead || p.flag) return;
    const pb = { x: p.x, y: p.y, w: p.w, h: p.h };
    for (const e of st.ents) {
      if (e.dead) continue;
      if (e.kind === "fireball" || e.kind === "bossfire") {
        if (e.kind === "bossfire" && aabb(pb, e)) {
          p.hurt();
          e.dead = true;
        }
        continue;
      }
      if (!aabb(pb, e)) continue;
      if (e.kind === "coin") {
        e.dead = true;
        st.spawnCoinPop(Math.floor(e.x / TILE), Math.floor(e.y / TILE));
        audio.coin();
        continue;
      }
      if (e.kind === "mush") {
        e.dead = true;
        if (p.power === 0) {
          p.y -= 16;
          p.power = 1;
        }
        addScore(1000);
        audio.power();
        continue;
      }
      if (e.kind === "oneup") {
        e.dead = true;
        game.lives++;
        audio.oneup();
        st.popups.push({ x: e.x, y: e.y, text: "1UP", life: 50 });
        continue;
      }
      if (e.kind === "flower") {
        e.dead = true;
        if (p.power === 0) p.y -= 16;
        p.power = 2;
        addScore(1000);
        audio.power();
        continue;
      }
      if (e.kind === "star") {
        e.dead = true;
        p.star = 420;
        addScore(1000);
        audio.power();
        continue;
      }
      if (e.kind === "piranha" && !e.hurts()) continue;
      if (p.star > 0 && e.kind !== "coin") {
        if (e.flipDie) e.flipDie();
        addScore(200);
        continue;
      }
      const stomping = p.vy > 0.15 && p.y + p.h - e.y < 12;
      if (stomping && e.stompable) {
        e.stomp(p);
        p.vy = -3.6;
        addScore(e.kind === "boss" ? 500 : 100);
      } else if (e.kind === "koopa" && e.mode === "shell" && e.vx === 0) {
        e.stomp(p);
      } else {
        p.hurt();
      }
    }
  }

  function updatePlay(taps) {
    const st = game.stage;
    const p = game.player;
    if (game.overlay > 0) game.overlay--;
    if (game.freeze > 0) {
      game.freeze--;
      return;
    }

    if (p.flag === 2 && p.walkIn > 70) {
      game.powerKeep = p.power;
      const left = st.time;
      addScore(left * 50);
      unlockNext(st.level.id);
      if (!window.SUPER_SALTO_DATA.nextLevel(st.level.id)) {
        game.state = "win";
        game.winT = 0;
        audio.playMusic("sky");
        persist();
        return;
      }
      game.state = "clear";
      game.overlay = 0;
      return;
    }

    p.update(st, taps);

    if (!p.dead && !p.flag) {
      game.timeAcc++;
      if (game.timeAcc >= 48) {
        game.timeAcc = 0;
        st.time--;
        if (st.time === 100) audio.hurry = true;
        if (st.time <= 0) {
          st.time = 0;
          p.die();
        }
      }
    }

    const camTarget = p.x - 96;
    game.cam.x += (camTarget - game.cam.x) * 0.12;
    game.cam.x = clamp(game.cam.x, 0, Math.max(0, st.w * TILE - NW));
    game.cam.y = 0;

    const viewL = game.cam.x - 48;
    const viewR = game.cam.x + NW + 64;
    for (const e of st.ents) {
      if (e.dead) continue;
      if (e.x < viewL - 80 || e.x > viewR + 80) {
        if (e.kind === "fireball" || e.kind === "bossfire") e.dead = true;
        continue;
      }
      if (e.update.length >= 2) e.update(st, p);
      else e.update(st);
    }
    st.ents = st.ents.filter((e) => !e.dead);
    interactEntities();

    for (const part of st.particles) {
      part.x += part.vx;
      part.y += part.vy;
      part.vy += 0.18;
      part.life--;
    }
    st.particles = st.particles.filter((p2) => p2.life > 0);
    for (const pop of st.popups) {
      pop.y -= 0.4;
      pop.life--;
    }
    st.popups = st.popups.filter((p2) => p2.life > 0);
    for (const k of Object.keys(st.bump)) {
      st.bump[k]--;
      if (st.bump[k] <= 0) delete st.bump[k];
    }
    st.tick++;

    if (p.dead && p.deathT > 110) {
      game.lives--;
      game.powerKeep = 0;
      if (game.lives < 0) {
        game.lives = 5;
        game.score = 0;
        game.coins = 0;
        persist();
        game.state = "over";
      } else {
        persist();
        startLevel(st.level.id);
      }
    }
  }

  /* ---------- render world ---------- */
  function drawTile(ctx, t, sx, sy, theme, tick, bumpY) {
    const y = sy - (bumpY || 0);
    if (t === "." || t === "@") return;
    if (t === "|") {
      fillRect(ctx, sx + 7, 24, 2, sy + 16 - 24, "#f4f4f4");
      const wave = Math.sin(tick * 0.08) * 2;
      fillRect(ctx, sx - 6 + wave, 28, 14, 10, "#e23b3b");
      fillRect(ctx, sx - 6 + wave, 28, 7, 5, "#fff");
      fillRect(ctx, sx + 1 + wave, 33, 7, 5, "#fff");
      return;
    }
    if (t === "!") {
      fillRect(ctx, sx, y, 16, 16, "#5a5a5a");
      fillRect(ctx, sx + 6, y, 4, 16, "#f4f4f4");
      return;
    }
    if (t === "~") {
      const boil = Math.sin(tick * 0.2 + sx) * 2;
      fillRect(ctx, sx, y + 4 + boil, 16, 12 - boil, "#ff3a00");
      fillRect(ctx, sx, y + 8, 16, 8, "#c01800");
      fillRect(ctx, sx + 4, y + 6 + boil, 3, 2, "#ffaa33");
      return;
    }
    if (t === "-") {
      fillRect(ctx, sx, y + 4, 16, 8, "#f4f8ff");
      fillRect(ctx, sx + 1, y + 5, 14, 3, "#ffffff");
      fillRect(ctx, sx + 2, y + 10, 12, 2, "#d0e8ff");
      return;
    }
    if (t === "[" || t === "]" || t === "{" || t === "}") {
      const left = t === "[" || t === "{";
      const top = t === "[" || t === "]";
      fillRect(ctx, sx, y, 16, 16, "#1aa01a");
      fillRect(ctx, sx + (left ? 2 : 0), y, 14, 16, "#22c022");
      if (top) fillRect(ctx, sx - (left ? 2 : 0), y, 18, 4, "#2ee02e");
      fillRect(ctx, sx + (left ? 12 : 2), y, 2, 16, "#0e6a0e");
      return;
    }
    if (t === "?" || t === "M" || t === "F" || t === "S") {
      const flash = Math.floor(tick / 12) % 3 !== 2;
      fillRect(ctx, sx, y, 16, 16, flash ? "#e0a020" : "#c08010");
      fillRect(ctx, sx + 1, y + 1, 14, 14, flash ? "#ffcc33" : "#d4a018");
      drawText(ctx, "?", sx + 5, y + 4, 1, "#a05010");
      fillRect(ctx, sx, y, 2, 2, "#fff6c0");
      fillRect(ctx, sx + 14, y, 2, 2, "#fff6c0");
      fillRect(ctx, sx, y + 14, 2, 2, "#fff6c0");
      fillRect(ctx, sx + 14, y + 14, 2, 2, "#fff6c0");
      return;
    }
    if (t === "U") {
      fillRect(ctx, sx, y, 16, 16, "#a06020");
      fillRect(ctx, sx + 4, y + 4, 8, 8, "#704010");
      return;
    }
    if (t === "B" || t === "1") {
      fillRect(ctx, sx, y, 16, 16, theme.brick);
      fillRect(ctx, sx, y + 7, 16, 1, "#5a2010");
      fillRect(ctx, sx + 7, y, 1, 7, "#5a2010");
      fillRect(ctx, sx + 4, y + 8, 1, 8, "#5a2010");
      fillRect(ctx, sx + 12, y + 8, 1, 8, "#5a2010");
      return;
    }
    if (t === "#") {
      const hard = theme.hard || "#8a8a8a";
      fillRect(ctx, sx, y, 16, 16, hard);
      fillRect(ctx, sx + 1, y + 1, 14, 14, hard);
      fillRect(ctx, sx + 3, y + 3, 2, 2, "#00000033");
      fillRect(ctx, sx + 11, y + 10, 2, 2, "#00000033");
      return;
    }
    if (t === "=") {
      fillRect(ctx, sx, y, 16, 16, theme.ground);
      fillRect(ctx, sx, y, 16, 4, theme.grass);
      fillRect(ctx, sx + 3, y + 8, 2, 2, "#6a3010");
      fillRect(ctx, sx + 10, y + 12, 2, 2, "#6a3010");
      return;
    }
  }

  function drawBackground(ctx, theme, camx, tick) {
    const grd = ctx.createLinearGradient(0, 0, 0, NH);
    grd.addColorStop(0, theme.skyTop);
    grd.addColorStop(1, theme.skyBot);
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, NW, NH);

    if (theme.deco === "stars" || theme.deco === "embers") {
      ctx.fillStyle = theme.deco === "embers" ? "#ff6622" : "#ffffff";
      for (let i = 0; i < 40; i++) {
        const x = ((i * 73 - camx * 0.1) % NW + NW) % NW;
        const y = (i * 37) % 140;
        ctx.fillRect(x, y, i % 5 === 0 ? 2 : 1, 1);
      }
    }
    if (theme.deco === "hills" || theme.deco === "dunes" || theme.deco === "clouds") {
      const par = camx * 0.25;
      for (let i = 0; i < 8; i++) {
        const x = ((i * 90 - par) % (NW + 120)) - 40;
        ctx.fillStyle = theme.hillDark;
        ctx.beginPath();
        ctx.ellipse(x, 190, 50, theme.deco === "clouds" ? 18 : 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = theme.hill;
        ctx.beginPath();
        ctx.ellipse(x + 18, 194, 36, theme.deco === "clouds" ? 14 : 22, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    if (theme.deco === "hills") {
      const par = camx * 0.45;
      ctx.fillStyle = theme.bush;
      for (let i = 0; i < 6; i++) {
        const x = ((i * 140 + 40 - par) % (NW + 80)) - 20;
        ctx.beginPath();
        ctx.ellipse(x, 208, 16, 10, 0, 0, Math.PI * 2);
        ctx.ellipse(x + 12, 208, 14, 9, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  function drawWorld(ctx) {
    const st = game.stage;
    const cam = game.cam;
    drawBackground(ctx, st.theme, cam.x, st.tick);
    const x0 = Math.max(0, Math.floor(cam.x / TILE) - 1);
    const x1 = Math.min(st.w - 1, Math.floor((cam.x + NW) / TILE) + 1);
    const pipe = new Set(["[", "]", "{", "}"]);
    function paint(skipPipes) {
      for (let ty = 0; ty < st.h; ty++) {
        for (let tx = x0; tx <= x1; tx++) {
          const t = st.tiles[ty][tx];
          if (skipPipes && pipe.has(t)) continue;
          if (!skipPipes && !pipe.has(t)) continue;
          const bump = st.bump[tx + "," + ty] || 0;
          const by = bump > 0 ? Math.sin((bump / 8) * Math.PI) * 4 : 0;
          drawTile(ctx, t, Math.round(tx * TILE - cam.x), ty * TILE - cam.y, st.theme, st.tick, by);
        }
      }
    }
    paint(true);
    for (const e of st.ents) e.draw(ctx, cam, st.tick);
    paint(false);
    for (const part of st.particles) {
      if (part.kind === "brick") fillRect(ctx, part.x - cam.x, part.y - cam.y, 4, 4, st.theme.brick);
      if (part.kind === "coin") fillRect(ctx, part.x - cam.x, part.y - cam.y, 8, 12, "#ffd000");
    }
    game.player.draw(ctx, cam, st.tick);
    for (const pop of st.popups) {
      drawText(ctx, pop.text, pop.x - cam.x, pop.y - cam.y, 1, "#fff");
    }
  }

  function drawHud(ctx) {
    fillRect(ctx, 0, 0, NW, 16, "rgba(0,0,0,0.25)");
    drawText(ctx, "CALEO", 8, 3, 1, "#fff");
    drawText(ctx, pad(game.score, 6), 8, 11, 1, "#fff");
    drawText(ctx, "*" + pad(game.coins, 2), 88, 7, 1, "#ffd000");
    const id = game.stage ? game.stage.level.id : "1-1";
    drawText(ctx, "MUNDO", 148, 3, 1, "#fff");
    drawText(ctx, id, 156, 11, 1, "#fff");
    drawText(ctx, "TIEMPO", 232, 3, 1, "#fff");
    const tm = game.stage ? game.stage.time : 0;
    drawText(ctx, pad(tm, 3), 248, 11, 1, tm < 100 ? "#ff6666" : "#fff");
    drawText(ctx, "x" + Math.max(0, game.lives), 292, 7, 1, "#fff");
  }

  /* ---------- screens ---------- */
  function drawTitle(ctx, tick) {
    drawBackground(ctx, THEMES.grass, tick * 0.4, tick);
    fillRect(ctx, 40, 168, 240, 16, THEMES.grass.ground);
    fillRect(ctx, 40, 168, 240, 4, THEMES.grass.grass);
    drawText(ctx, "SUPER SALTO", NW / 2, 36, 2, "#fff", "center");
    drawText(ctx, "SUPER SALTO", NW / 2 - 1, 35, 2, "#ff7a18", "center");
    drawText(ctx, "UN PLATFORMER ORIGINAL", NW / 2, 62, 1, "#ffe8a0", "center");

    const walker = { x: 40 + ((tick * 0.6) % 240), y: 152, vx: 1, power: 0, facing: 1, onGround: true, anim: tick * 0.2, ducking: false, invuln: 0, star: 0, dead: false };
    Player.prototype.draw.call(walker, ctx, { x: 0, y: 0 }, tick);

    const items = ["NUEVA PARTIDA", "CONTINUAR", "MAPA DEL MUNDO"];
    items.forEach((it, i) => {
      const y = 80 + i * 14;
      const sel = game.menu === i;
      drawText(ctx, (sel ? "> " : "  ") + it, 88, y, 1, sel ? "#fff" : "#c0c0d0");
    });
    drawText(ctx, "MEJOR " + pad(game.best, 6), NW / 2, 128, 1, "#ffe100", "center");
    drawText(ctx, "ENTER PARA ELEGIR   M SILENCIO", NW / 2, 220, 1, "#d0d0e0", "center");
  }

  function drawMap(ctx) {
    const worlds = window.SUPER_SALTO_DATA.worlds;
    ctx.fillStyle = "#102018";
    ctx.fillRect(0, 0, NW, NH);
    drawText(ctx, "MAPA DEL REINO", NW / 2, 10, 1, "#fff", "center");
    worlds.forEach((w, wi) => {
      const y = 36 + wi * 48;
      fillRect(ctx, 12, y - 6, 296, 42, "rgba(0,0,0,0.35)");
      drawText(ctx, w.id + " " + w.name.toUpperCase(), 18, y, 1, w.color);
      w.levels.forEach((lv, li) => {
        const x = 40 + li * 68;
        const idx = wi * 4 + li;
        const unlocked = game.unlocked.indexOf(lv.id) >= 0;
        const done = game.completed.indexOf(lv.id) >= 0;
        const sel = game.mapIndex === idx;
        fillRect(ctx, x, y + 14, 22, 16, unlocked ? (sel ? "#ff7a18" : done ? "#2ecc71" : "#3a6ad0") : "#333");
        drawText(ctx, lv.id.split("-")[1], x + 7, y + 18, 1, unlocked ? "#fff" : "#777");
        if (li < 3) fillRect(ctx, x + 22, y + 20, 46, 2, unlocked && game.unlocked.indexOf(w.levels[li + 1].id) >= 0 ? "#c0c0c0" : "#444");
        if (sel) drawText(ctx, "^", x + 7, y + 30, 1, "#fff");
      });
    });
    const cur = allLevelIds()[game.mapIndex];
    const level = window.SUPER_SALTO_DATA.findLevel(cur);
    drawText(ctx, level ? level.name.toUpperCase() : "", NW / 2, 220, 1, "#ffe8a0", "center");
    drawText(ctx, "ENTER JUGAR   ESC MENU", NW / 2, 230, 1, "#aaa", "center");
  }

  function drawPause(ctx) {
    fillRect(ctx, 60, 60, 200, 120, "rgba(0,0,0,0.8)");
    drawText(ctx, "PAUSA", NW / 2, 74, 2, "#fff", "center");
    ["CONTINUAR", "MAPA", "TITULO"].forEach((it, i) => {
      const sel = game.pauseMenu === i;
      drawText(ctx, (sel ? "> " : "  ") + it, 110, 110 + i * 16, 1, sel ? "#ffd000" : "#ddd");
    });
  }

  function drawClear(ctx) {
    drawWorld(ctx);
    drawHud(ctx);
    fillRect(ctx, 40, 80, 240, 70, "rgba(0,0,0,0.7)");
    drawText(ctx, "CURSO DESPEJADO", NW / 2, 96, 1, "#ffd000", "center");
    drawText(ctx, game.stage.level.name.toUpperCase(), NW / 2, 114, 1, "#fff", "center");
    drawText(ctx, "BONUS x" + game.stage.time, NW / 2, 130, 1, "#9fe8ff", "center");
  }

  function drawOver(ctx) {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, NW, NH);
    drawText(ctx, "JUEGO TERMINADO", NW / 2, 100, 1, "#ff5555", "center");
    drawText(ctx, "PUNTOS " + pad(game.score, 6), NW / 2, 124, 1, "#fff", "center");
    drawText(ctx, "ENTER PARA VOLVER", NW / 2, 160, 1, "#aaa", "center");
  }

  function drawWin(ctx, tick) {
    drawBackground(ctx, THEMES.sky, tick * 0.3, tick);
    drawText(ctx, "REINO LIBRE", NW / 2, 50, 2, "#fff", "center");
    drawText(ctx, "REINO LIBRE", NW / 2 - 1, 49, 2, "#ffd000", "center");
    drawText(ctx, "CALEO SALVO LOS CUATRO MUNDOS", NW / 2, 90, 1, "#fff", "center");
    drawText(ctx, "PUNTOS " + pad(game.score, 6), NW / 2, 120, 1, "#ffd000", "center");
    drawText(ctx, "GRACIAS POR JUGAR", NW / 2, 160, 1, "#c0ffd0", "center");
    drawText(ctx, "ENTER - TITULO", NW / 2, 210, 1, "#aaa", "center");
  }

  /* ---------- ui updates ---------- */
  function updateTitle(taps) {
    if (keys.up && taps.jump) {
      /* ignore */
    }
    if (taps.pause) {
      /* ignore */
    }
    if (keys.down && !game._holdDown) {
      game.menu = (game.menu + 1) % 3;
      game._holdDown = true;
      audio.bump();
    }
    if (keys.up && !game._holdUp) {
      game.menu = (game.menu + 2) % 3;
      game._holdUp = true;
      audio.bump();
    }
    if (!keys.down) game._holdDown = false;
    if (!keys.up) game._holdUp = false;
    if (taps.start || taps.jump) {
      const save = loadSave();
      if (game.menu === 0) {
        applySave(defaultSave());
        game.best = save.best || 0;
        game.powerKeep = 0;
        startLevel("1-1");
      } else if (game.menu === 1) {
        applySave(save);
        game.powerKeep = 0;
        const id = game.unlocked[game.unlocked.length - 1] || "1-1";
        game.mapIndex = Math.max(0, allLevelIds().indexOf(id));
        startLevel(id);
      } else {
        applySave(save);
        game.state = "map";
        audio.playMusic("map");
      }
    }
  }

  function updateMap(taps) {
    const ids = allLevelIds();
    const move = (d) => {
      let i = game.mapIndex;
      for (let n = 0; n < 16; n++) {
        i = (i + d + 16) % 16;
        if (game.unlocked.indexOf(ids[i]) >= 0) {
          game.mapIndex = i;
          audio.bump();
          return;
        }
      }
    };
    if (keys.right && !game._holdR) {
      move(1);
      game._holdR = true;
    }
    if (keys.left && !game._holdL) {
      move(-1);
      game._holdL = true;
    }
    if (keys.down && !game._holdDown) {
      move(4);
      game._holdDown = true;
    }
    if (keys.up && !game._holdUp) {
      move(-4);
      game._holdUp = true;
    }
    if (!keys.right) game._holdR = false;
    if (!keys.left) game._holdL = false;
    if (!keys.down) game._holdDown = false;
    if (!keys.up) game._holdUp = false;
    if (taps.pause) {
      game.state = "title";
      audio.playMusic("map");
    }
    if (taps.start || taps.jump) {
      const id = ids[game.mapIndex];
      if (game.unlocked.indexOf(id) >= 0) startLevel(id);
    }
  }

  function updatePause(taps) {
    if (keys.down && !game._holdDown) {
      game.pauseMenu = (game.pauseMenu + 1) % 3;
      game._holdDown = true;
    }
    if (keys.up && !game._holdUp) {
      game.pauseMenu = (game.pauseMenu + 2) % 3;
      game._holdUp = true;
    }
    if (!keys.down) game._holdDown = false;
    if (!keys.up) game._holdUp = false;
    if (taps.pause) {
      game.state = "play";
      audio.playMusic(musicForTheme(game.stage.level.theme));
    }
    if (taps.start || taps.jump) {
      if (game.pauseMenu === 0) {
        game.state = "play";
        audio.playMusic(musicForTheme(game.stage.level.theme));
      } else if (game.pauseMenu === 1) {
        audio.stopMusic();
        game.state = "map";
        audio.playMusic("map");
        persist();
      } else {
        persist();
        game.state = "title";
        audio.playMusic("map");
      }
    }
  }

  /* ---------- loop ---------- */
  let acc = 0;
  let last = performance.now();
  let tick = 0;

  function frame(now) {
    acc += Math.min(0.05, (now - last) / 1000);
    last = now;
    const taps = consumeTaps();
    while (acc >= STEP) {
      if (game.state === "title") updateTitle(taps);
      else if (game.state === "map") updateMap(taps);
      else if (game.state === "play") {
        if (taps.pause && !game.player.dead && !game.player.flag) {
          game.state = "pause";
          game.pauseMenu = 0;
          audio.stopMusic();
          audio.pause();
        } else updatePlay(taps);
      } else if (game.state === "pause") updatePause(taps);
      else if (game.state === "clear") {
        game.overlay++;
        if (taps.start || taps.jump || game.overlay > 180) {
          game.mapIndex = Math.max(0, allLevelIds().indexOf(window.SUPER_SALTO_DATA.nextLevel(game.stage.level.id).id));
          game.state = "map";
          audio.playMusic("map");
        }
      } else if (game.state === "over") {
        if (taps.start || taps.jump) {
          game.lives = 5;
          game.score = 0;
          game.coins = 0;
          game.powerKeep = 0;
          persist();
          game.state = "title";
          audio.playMusic("map");
        }
      } else if (game.state === "win") {
        game.winT++;
        if (taps.start || taps.jump) {
          game.state = "title";
          audio.playMusic("map");
        }
      }
      taps.jump = taps.fire = taps.start = taps.pause = false;
      acc -= STEP;
      tick++;
    }

    g.imageSmoothingEnabled = false;
    ctx.imageSmoothingEnabled = false;
    if (game.state === "title") drawTitle(g, tick);
    else if (game.state === "map") drawMap(g);
    else if (game.state === "play" || game.state === "pause") {
      drawWorld(g);
      drawHud(g);
      if (game.overlay > 0 && game.state === "play") {
        fillRect(g, 80, 100, 160, 28, "rgba(0,0,0,0.65)");
        drawText(g, game.stage.level.id + " " + game.stage.level.name.toUpperCase(), NW / 2, 110, 1, "#fff", "center");
      }
      if (game.state === "pause") drawPause(g);
    } else if (game.state === "clear") drawClear(g);
    else if (game.state === "over") drawOver(g);
    else if (game.state === "win") drawWin(g, tick);

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
    requestAnimationFrame(frame);
  }

  function init() {
    const s = loadSave();
    game.best = s.best || 0;
    game.unlocked = s.unlocked || ["1-1"];
    game.completed = s.completed || [];
    game.lives = 5;
    bindTouch();
    canvas.width = NW * SCALE;
    canvas.height = NH * SCALE;
    ctx.imageSmoothingEnabled = false;
    const params = new URLSearchParams(location.search);
    const play = params.get("play");
    if (play && window.SUPER_SALTO_DATA.findLevel(play)) {
      applySave(defaultSave());
      startLevel(play);
    } else if (params.get("map")) {
      applySave(defaultSave());
      game.unlocked = allLevelIds();
      game.completed = ["1-1", "1-2"];
      game.state = "map";
    }
    requestAnimationFrame(frame);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
