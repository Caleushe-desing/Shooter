#!/usr/bin/env node
"use strict";
require("./levels.js");

const data = global.SUPER_SALTO_DATA;
if (!data) {
  console.error("SUPER_SALTO_DATA no está definido");
  process.exit(1);
}

const SOLID = new Set(["=", "#", "B", "?", "M", "F", "S", "1", "U", "[", "]", "{", "}", "!"]);
let failed = 0;
const ids = [];

function fail(msg) {
  console.error("FAIL:", msg);
  failed++;
}

const worlds = data.worlds;
if (worlds.length !== 4) fail("se esperaban 4 mundos, hay " + worlds.length);

worlds.forEach((w, wi) => {
  if (!w.name) fail("mundo " + (wi + 1) + " sin nombre");
  if (w.levels.length !== 4) fail(w.name + " no tiene 4 niveles");
  w.levels.forEach((lv) => {
    ids.push(lv.id);
    if (!lv.map || lv.map.length !== lv.h) fail(lv.id + " alto inconsistente");
    const widths = new Set(lv.map.map((r) => r.length));
    if (widths.size !== 1 || !widths.has(lv.w)) fail(lv.id + " ancho inconsistente");
    const joined = lv.map.join("");
    if (!joined.includes("@")) fail(lv.id + " no tiene spawn @");
    if (!joined.includes("!")) fail(lv.id + " no tiene bandera !");
    const expected = String(w.id) + "-" + (w.levels.indexOf(lv) + 1);
    if (lv.id !== expected) fail("id " + lv.id + " no coincide con " + expected);
    const spawnY = lv.map.findIndex((r) => r.includes("@"));
    const spawnX = lv.map[spawnY].indexOf("@");
    let gy = spawnY;
    while (gy < lv.h && !SOLID.has(lv.map[gy][spawnX])) gy++;
    if (gy >= lv.h) fail(lv.id + " spawn sobre el vacío (caída inmediata)");
  });
});

if (data.allLevels().length !== 16) fail("total de niveles != 16");
if (data.findLevel("1-1").id !== "1-1") fail("findLevel 1-1");
if (data.nextLevel("1-4").id !== "2-1") fail("next 1-4 -> 2-1");
if (data.nextLevel("4-4") !== null) fail("next 4-4 debe ser null");

if (new Set(ids).size !== ids.length) fail("ids duplicados");

if (failed) {
  console.error(failed + " errores");
  process.exit(1);
}
console.log("OK: 4 mundos, 16 niveles válidos (" + ids.join(", ") + ")");
