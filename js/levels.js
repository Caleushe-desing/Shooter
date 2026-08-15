/* Súper Salto — mundos y niveles (datos). Personajes y nombres originales. */
(function (root) {
  "use strict";

  const H = 15;

  function grid(w, h) {
    return Array.from({ length: h }, () => Array(w).fill("."));
  }

  function makeApi(g, w, h) {
    const put = (x, y, c) => {
      if (x >= 0 && x < w && y >= 0 && y < h) g[y][x] = c;
    };
    return {
      w,
      h,
      put,
      fill(x, y, ww, hh, c) {
        for (let j = 0; j < hh; j++) {
          for (let i = 0; i < ww; i++) put(x + i, y + j, c);
        }
      },
      ground(x0, x1) {
        const a = Math.max(0, x0);
        const b = Math.min(w, x1);
        for (let x = a; x < b; x++) {
          put(x, h - 2, "=");
          put(x, h - 1, "#");
        }
      },
      gaps(pairs) {
        this.ground(0, w);
        for (const [s, e] of pairs) this.fill(s, h - 2, e - s, 2, ".");
      },
      platform(x, y, len, c) {
        c = c || "=";
        for (let i = 0; i < len; i++) put(x + i, y, c);
      },
      bricks(x, y, len) {
        for (let i = 0; i < len; i++) put(x + i, y, "B");
      },
      pipe(x, gy, height, piranha) {
        const top = gy - height + 1;
        put(x, top, "[");
        put(x + 1, top, "]");
        for (let y = top + 1; y <= gy; y++) {
          put(x, y, "{");
          put(x + 1, y, "}");
        }
        if (piranha && top > 0) put(x, top - 1, "p");
      },
      stairs(x, gy, steps, dir) {
        dir = dir === undefined ? 1 : dir;
        for (let i = 0; i < steps; i++) {
          const sx = dir === 1 ? x + i : x - i;
          for (let k = 0; k <= i; k++) put(sx, gy - k, "#");
        }
      },
      pyramid(x, gy, steps) {
        for (let i = 0; i < steps; i++) {
          for (let k = 0; k <= i; k++) {
            put(x + i, gy - k, "#");
            put(x + steps * 2 - 1 - i, gy - k, "#");
          }
        }
      },
      coins(x, y, len, dy) {
        dy = dy || 0;
        for (let i = 0; i < len; i++) put(x + i, y + (dy > 0 ? 0 : 0), "o");
      },
      row(x, y, chars) {
        for (let i = 0; i < chars.length; i++) put(x + i, y, chars[i]);
      },
      spawn(x, y) {
        put(x, y, "@");
      },
      flag(x, gy) {
        put(x, gy, "!");
        for (let y = gy - 1; y >= Math.max(0, gy - 10); y--) {
          if (g[y][x] === ".") put(x, y, "|");
        }
      },
      lava(x0, x1) {
        for (let x = x0; x < x1; x++) {
          put(x, h - 1, "~");
          put(x, h - 2, "~");
        }
      },
    };
  }

  function level(id, name, theme, w, build, extra) {
    extra = extra || {};
    const h = extra.h || H;
    const g = grid(w, h);
    const a = makeApi(g, w, h);
    build(a);
    return {
      id,
      name,
      theme,
      w,
      h,
      time: extra.time || 400,
      map: g.map((r) => r.join("")),
      warps: extra.warps || [],
      boss: !!extra.boss,
    };
  }

  /* ---------------- Mundo 1: Pradera Verde ---------------- */

  const l11 = level("1-1", "Colina Inicial", "grass", 168, (a) => {
    a.gaps([
      [42, 46],
      [78, 83],
      [118, 122],
    ]);
    a.spawn(3, 11);
    a.put(16, 9, "?");
    a.row(21, 9, "?BMB?");
    a.put(23, 5, "?");
    a.put(18, 11, "g");
    a.pipe(30, 12, 2);
    a.put(40, 11, "g");
    a.pipe(50, 12, 3, true);
    a.put(56, 11, "g");
    a.put(58, 11, "g");
    a.pipe(64, 12, 4, true);
    a.bricks(88, 9, 5);
    a.put(90, 9, "M");
    a.put(90, 5, "?");
    a.coins(88, 8, 5);
    a.put(96, 11, "k");
    a.platform(104, 10, 4, "B");
    a.put(105, 6, "?");
    a.put(112, 11, "g");
    a.pipe(126, 12, 2);
    a.stairs(148, 12, 8, 1);
    a.flag(164, 12);
  });

  const l12 = level(
    "1-2",
    "Caverna de Ladrillos",
    "cave",
    148,
    (a) => {
      a.fill(0, 0, a.w, 2, "#");
      a.ground(0, a.w);
      a.fill(70, 13, 6, 2, ".");
      a.spawn(3, 11);
      a.bricks(10, 9, 8);
      a.put(12, 9, "?");
      a.put(14, 9, "M");
      a.put(16, 9, "?");
      a.coins(10, 8, 8);
      a.put(20, 11, "g");
      a.put(24, 11, "g");
      a.pipe(28, 12, 3, true);
      a.fill(34, 6, 14, 1, "B");
      a.coins(36, 5, 10);
      a.put(40, 11, "k");
      a.fill(52, 8, 3, 5, "#");
      a.fill(58, 4, 3, 9, "#");
      a.coins(62, 7, 6);
      a.put(66, 11, "g");
      a.pipe(72, 12, 2);
      a.row(82, 9, "BB?BB");
      a.put(92, 11, "k");
      a.put(96, 11, "g");
      a.fill(102, 2, 8, 7, "B");
      a.fill(104, 4, 4, 3, ".");
      a.coins(104, 5, 4);
      a.put(106, 6, "S");
      a.stairs(128, 12, 6, 1);
      a.flag(144, 12);
    },
    { time: 360 }
  );

  const l13 = level("1-3", "Puentes del Valle", "grass", 158, (a) => {
    a.gaps([
      [16, 24],
      [36, 48],
      [60, 76],
      [90, 108],
      [122, 136],
    ]);
    a.spawn(3, 11);
    a.platform(16, 10, 8, "=");
    a.coins(18, 8, 4);
    a.put(20, 9, "g");
    a.platform(36, 8, 10, "=");
    a.put(38, 7, "?");
    a.put(42, 7, "M");
    a.put(40, 6, "k");
    a.platform(52, 11, 6, "B");
    a.platform(62, 7, 12, "-");
    a.coins(64, 5, 8);
    a.put(70, 6, "f");
    a.platform(90, 9, 8, "=");
    a.put(93, 8, "?");
    a.platform(102, 6, 6, "-");
    a.put(104, 5, "o");
    a.platform(122, 10, 10, "=");
    a.put(126, 9, "g");
    a.put(128, 9, "g");
    a.ground(136, 158);
    a.stairs(142, 12, 7, 1);
    a.flag(154, 12);
  });

  const l14 = level(
    "1-4",
    "Fortín de Piedra",
    "castle",
    128,
    (a) => {
      a.fill(0, 0, a.w, 1, "#");
      a.ground(0, 18);
      a.lava(18, 28);
      a.ground(28, 48);
      a.lava(48, 58);
      a.ground(58, 78);
      a.lava(78, 90);
      a.ground(90, 128);
      a.spawn(3, 11);
      a.row(8, 9, "B?B");
      a.put(12, 11, "g");
      a.platform(20, 10, 6, "#");
      a.coins(21, 8, 4);
      a.put(32, 11, "k");
      a.fill(38, 8, 2, 5, "#");
      a.put(42, 9, "?");
      a.put(44, 9, "F");
      a.platform(50, 9, 6, "#");
      a.put(62, 11, "g");
      a.put(66, 11, "g");
      a.fill(70, 4, 4, 9, "#");
      a.fill(71, 8, 2, 3, ".");
      a.platform(80, 8, 8, "#");
      a.put(84, 7, "k");
      a.stairs(110, 12, 6, 1);
      a.flag(124, 12);
    },
    { time: 320 }
  );

  /* ---------------- Mundo 2: Desierto Ardiente ---------------- */

  const l21 = level("2-1", "Dunas de Cobre", "desert", 172, (a) => {
    a.gaps([
      [28, 33],
      [54, 60],
      [88, 96],
      [130, 136],
    ]);
    a.spawn(3, 11);
    a.put(14, 9, "?");
    a.put(18, 11, "g");
    a.put(22, 11, "g");
    a.platform(30, 9, 5, "B");
    a.put(32, 9, "M");
    a.coins(30, 7, 5);
    a.pipe(40, 12, 2);
    a.put(48, 11, "k");
    a.pyramid(64, 12, 4);
    a.put(72, 7, "?");
    a.put(80, 11, "g");
    a.pipe(100, 12, 4, true);
    a.bricks(108, 9, 6);
    a.put(110, 9, "?");
    a.put(112, 5, "S");
    a.put(118, 11, "k");
    a.put(122, 11, "g");
    a.pipe(140, 12, 3, true);
    a.stairs(154, 12, 8, 1);
    a.flag(168, 12);
  });

  const l22 = level(
    "2-2",
    "Interior de la Pirámide",
    "pyramid",
    140,
    (a) => {
      a.fill(0, 0, a.w, 2, "#");
      a.ground(0, a.w);
      a.fill(40, 13, 5, 2, ".");
      a.fill(90, 13, 7, 2, ".");
      a.spawn(3, 11);
      a.fill(10, 6, 16, 1, "#");
      a.coins(12, 5, 12);
      a.put(16, 11, "g");
      a.fill(28, 8, 3, 5, "#");
      a.put(34, 9, "M");
      a.put(36, 9, "?");
      a.fill(48, 3, 10, 6, "#");
      a.fill(50, 5, 6, 3, ".");
      a.coins(50, 6, 6);
      a.put(52, 7, "1");
      a.put(62, 11, "k");
      a.put(66, 11, "g");
      a.pipe(74, 12, 3, true);
      a.row(82, 8, "BB?F?BB");
      a.fill(100, 7, 2, 6, "#");
      a.fill(108, 4, 2, 9, "#");
      a.stairs(122, 12, 6, 1);
      a.flag(136, 12);
    },
    { time: 340 }
  );

  const l23 = level("2-3", "Cañón Ventoso", "desert", 156, (a) => {
    a.gaps([
      [12, 22],
      [30, 50],
      [58, 80],
      [88, 112],
      [120, 138],
    ]);
    a.spawn(3, 11);
    a.platform(12, 10, 8, "=");
    a.put(16, 9, "g");
    a.platform(32, 8, 10, "=");
    a.coins(34, 6, 6);
    a.put(38, 7, "f");
    a.put(42, 7, "?");
    a.platform(52, 11, 6, "B");
    a.platform(60, 7, 14, "-");
    a.put(66, 6, "k");
    a.coins(62, 5, 10);
    a.platform(88, 9, 10, "=");
    a.put(92, 8, "M");
    a.put(96, 8, "g");
    a.platform(104, 6, 8, "-");
    a.put(108, 5, "f");
    a.platform(122, 10, 12, "=");
    a.ground(138, 156);
    a.stairs(142, 12, 6, 1);
    a.flag(152, 12);
  });

  const l24 = level(
    "2-4",
    "Fortaleza de Arena",
    "castle",
    130,
    (a) => {
      a.fill(0, 0, a.w, 1, "#");
      a.ground(0, 16);
      a.lava(16, 30);
      a.ground(30, 52);
      a.lava(52, 66);
      a.ground(66, 88);
      a.lava(88, 102);
      a.ground(102, 130);
      a.spawn(3, 11);
      a.put(8, 9, "F");
      a.platform(18, 10, 8, "#");
      a.put(22, 9, "k");
      a.coins(20, 8, 4);
      a.put(34, 11, "g");
      a.put(38, 11, "g");
      a.fill(44, 6, 3, 7, "#");
      a.platform(54, 9, 8, "#");
      a.put(58, 8, "?");
      a.put(70, 11, "k");
      a.fill(76, 5, 4, 8, "#");
      a.fill(77, 8, 2, 3, ".");
      a.platform(90, 8, 10, "#");
      a.put(94, 7, "f");
      a.stairs(112, 12, 7, 1);
      a.flag(126, 12);
    },
    { time: 300 }
  );

  /* ---------------- Mundo 3: Islas del Cielo ---------------- */

  const l31 = level("3-1", "Nubes Bajas", "sky", 164, (a) => {
    a.ground(0, 14);
    a.ground(150, 164);
    a.spawn(3, 11);
    a.platform(16, 11, 8, "-");
    a.coins(18, 9, 4);
    a.platform(28, 8, 10, "-");
    a.put(32, 7, "?");
    a.put(34, 7, "M");
    a.put(36, 6, "f");
    a.platform(44, 10, 6, "=");
    a.put(46, 9, "g");
    a.platform(54, 6, 12, "-");
    a.coins(56, 4, 8);
    a.put(62, 5, "f");
    a.platform(70, 11, 8, "=");
    a.put(74, 10, "k");
    a.platform(82, 7, 10, "-");
    a.put(86, 6, "?");
    a.platform(96, 9, 8, "=");
    a.put(100, 8, "g");
    a.platform(108, 5, 10, "-");
    a.coins(110, 3, 6);
    a.put(114, 4, "f");
    a.platform(122, 10, 12, "=");
    a.put(128, 9, "k");
    a.platform(138, 7, 8, "-");
    a.stairs(152, 12, 6, 1);
    a.flag(160, 12);
  });

  const l32 = level(
    "3-2",
    "Corriente Ascendente",
    "sky",
    150,
    (a) => {
      a.ground(0, 12);
      a.ground(138, 150);
      a.spawn(3, 11);
      a.platform(14, 10, 6, "-");
      a.platform(24, 7, 6, "-");
      a.platform(34, 4, 8, "-");
      a.coins(36, 2, 4);
      a.put(38, 3, "S");
      a.platform(46, 8, 8, "=");
      a.put(50, 7, "f");
      a.platform(58, 5, 10, "-");
      a.put(62, 4, "M");
      a.put(64, 3, "f");
      a.platform(72, 11, 8, "=");
      a.put(76, 10, "g");
      a.platform(84, 6, 12, "-");
      a.coins(86, 4, 8);
      a.platform(100, 9, 8, "=");
      a.put(104, 8, "k");
      a.platform(112, 5, 10, "-");
      a.put(116, 4, "f");
      a.platform(126, 10, 10, "=");
      a.flag(146, 12);
    },
    { time: 360 }
  );

  const l33 = level("3-3", "Flota Celeste", "sky", 168, (a) => {
    a.ground(0, 16);
    a.ground(152, 168);
    a.spawn(3, 11);
    a.pipe(10, 12, 2);
    a.platform(18, 9, 14, "=");
    a.put(22, 8, "f");
    a.put(26, 8, "f");
    a.row(24, 5, "?F?");
    a.platform(36, 6, 8, "-");
    a.coins(38, 4, 4);
    a.platform(48, 11, 10, "=");
    a.put(52, 10, "k");
    a.put(56, 10, "g");
    a.platform(62, 7, 16, "-");
    a.put(68, 6, "f");
    a.put(74, 6, "f");
    a.coins(64, 5, 12);
    a.platform(82, 10, 8, "=");
    a.put(86, 9, "?");
    a.platform(94, 5, 12, "-");
    a.put(100, 4, "f");
    a.platform(110, 9, 10, "=");
    a.put(114, 8, "k");
    a.platform(124, 6, 10, "-");
    a.platform(138, 10, 12, "=");
    a.stairs(154, 12, 6, 1);
    a.flag(164, 12);
  });

  const l34 = level(
    "3-4",
    "Palacio de Viento",
    "castle",
    134,
    (a) => {
      a.fill(0, 0, a.w, 1, "#");
      a.ground(0, 14);
      a.lava(14, 26);
      a.ground(26, 44);
      a.lava(44, 58);
      a.ground(58, 80);
      a.lava(80, 96);
      a.ground(96, 134);
      a.spawn(3, 11);
      a.put(8, 9, "F");
      a.platform(16, 9, 8, "#");
      a.put(20, 8, "f");
      a.put(30, 11, "k");
      a.fill(36, 6, 2, 7, "#");
      a.platform(46, 8, 10, "#");
      a.coins(48, 6, 6);
      a.put(62, 11, "g");
      a.put(66, 11, "k");
      a.fill(72, 4, 4, 9, "#");
      a.fill(73, 8, 2, 3, ".");
      a.platform(82, 7, 12, "#");
      a.put(88, 6, "f");
      a.stairs(116, 12, 7, 1);
      a.flag(130, 12);
    },
    { time: 300 }
  );

  /* ---------------- Mundo 4: Reino Oscuro ---------------- */

  const l41 = level("4-1", "Bosque Nocturno", "night", 168, (a) => {
    a.gaps([
      [24, 30],
      [50, 58],
      [82, 90],
      [118, 126],
    ]);
    a.spawn(3, 11);
    a.put(12, 9, "?");
    a.put(16, 11, "g");
    a.put(20, 11, "n");
    a.pipe(32, 12, 3, true);
    a.bricks(40, 9, 6);
    a.put(42, 9, "M");
    a.put(44, 5, "?");
    a.put(60, 11, "n");
    a.put(64, 11, "k");
    a.pipe(70, 12, 4, true);
    a.platform(78, 8, 8, "B");
    a.coins(80, 6, 4);
    a.put(96, 11, "g");
    a.put(100, 11, "n");
    a.row(108, 9, "?BFB?");
    a.put(132, 11, "k");
    a.pipe(138, 12, 2);
    a.stairs(150, 12, 8, 1);
    a.flag(164, 12);
  });

  const l42 = level(
    "4-2",
    "Mansión Espectral",
    "ghost",
    146,
    (a) => {
      a.fill(0, 0, a.w, 2, "#");
      a.ground(0, a.w);
      a.fill(48, 13, 6, 2, ".");
      a.fill(96, 13, 6, 2, ".");
      a.spawn(3, 11);
      a.put(10, 9, "H");
      a.put(12, 9, "H");
      a.put(14, 9, "M");
      a.coins(18, 8, 6);
      a.put(22, 11, "n");
      a.fill(28, 6, 12, 1, "B");
      a.put(32, 6, "?");
      a.put(36, 11, "n");
      a.fill(44, 4, 3, 9, "#");
      a.fill(56, 8, 8, 1, "B");
      a.coins(56, 7, 8);
      a.put(60, 6, "1");
      a.put(70, 11, "n");
      a.put(74, 11, "n");
      a.pipe(80, 12, 3);
      a.row(88, 9, "HHHHH");
      a.put(90, 5, "S");
      a.fill(110, 3, 10, 6, "B");
      a.fill(112, 5, 6, 3, ".");
      a.coins(112, 6, 6);
      a.put(114, 11, "n");
      a.stairs(128, 12, 6, 1);
      a.flag(142, 12);
    },
    { time: 340 }
  );

  const l43 = level(
    "4-3",
    "Río de Magma",
    "lava",
    158,
    (a) => {
      a.fill(0, 0, a.w, 1, "#");
      a.ground(0, 18);
      a.lava(18, 36);
      a.ground(36, 52);
      a.lava(52, 72);
      a.ground(72, 90);
      a.lava(90, 112);
      a.ground(112, 158);
      a.spawn(3, 11);
      a.put(10, 9, "F");
      a.platform(20, 10, 10, "#");
      a.coins(22, 8, 6);
      a.put(26, 9, "k");
      a.put(40, 11, "g");
      a.put(44, 11, "n");
      a.platform(54, 9, 12, "#");
      a.put(58, 8, "?");
      a.put(62, 8, "M");
      a.put(66, 8, "f");
      a.put(76, 11, "k");
      a.fill(82, 5, 3, 8, "#");
      a.platform(92, 8, 14, "#");
      a.coins(94, 6, 10);
      a.put(100, 7, "f");
      a.put(118, 11, "g");
      a.put(122, 11, "n");
      a.stairs(140, 12, 8, 1);
      a.flag(154, 12);
    },
    { time: 300 }
  );

  const l44 = level(
    "4-4",
    "Trono del Duque Magma",
    "lava",
    120,
    (a) => {
      a.fill(0, 0, a.w, 1, "#");
      a.ground(0, 22);
      a.lava(22, 34);
      a.ground(34, 56);
      a.lava(56, 68);
      a.ground(68, 120);
      a.spawn(3, 11);
      a.put(8, 9, "F");
      a.put(12, 9, "?");
      a.platform(24, 10, 8, "#");
      a.put(38, 11, "k");
      a.put(42, 11, "n");
      a.row(46, 9, "B?B");
      a.platform(58, 9, 8, "#");
      a.fill(74, 6, 4, 7, "#");
      a.put(82, 11, "X");
      a.flag(116, 12);
    },
    { time: 280, boss: true }
  );

  const worlds = [
    {
      id: 1,
      name: "Pradera Verde",
      subtitle: "Colinas y tuberías",
      color: "#3cb043",
      levels: [l11, l12, l13, l14],
    },
    {
      id: 2,
      name: "Desierto Ardiente",
      subtitle: "Dunas y pirámides",
      color: "#e0a100",
      levels: [l21, l22, l23, l24],
    },
    {
      id: 3,
      name: "Islas del Cielo",
      subtitle: "Nubes y corrientes",
      color: "#5ec8ff",
      levels: [l31, l32, l33, l34],
    },
    {
      id: 4,
      name: "Reino Oscuro",
      subtitle: "Sombras y magma",
      color: "#8b5cf6",
      levels: [l41, l42, l43, l44],
    },
  ];

  function allLevels() {
    const out = [];
    for (const w of worlds) out.push(...w.levels);
    return out;
  }

  function findLevel(id) {
    return allLevels().find((l) => l.id === id) || null;
  }

  function nextLevel(id) {
    const all = allLevels();
    const i = all.findIndex((l) => l.id === id);
    if (i < 0 || i >= all.length - 1) return null;
    return all[i + 1];
  }

  root.SUPER_SALTO_DATA = { worlds, allLevels, findLevel, nextLevel };
})(typeof window !== "undefined" ? window : globalThis);
