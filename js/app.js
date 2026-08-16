/* Check list Técnico — inspecciones genéricas, foto, firma y ficha QR */
(function () {
  "use strict";

  const APP_NAME = "Check list Técnico";
  const STORE = "meccheck-reports-v1";
  const SETTINGS = "meccheck-settings-v1";
  const BLOB = "https://jsonblob.com/api/jsonBlob";
  const CDN = "https://cdn.jsdelivr.net/gh/Caleushe-desing/Shooter@cursor/checklist-mecanica-9fc5/";

  if (typeof window.MEC_ASSET_BASE !== "string") {
    const h = location.hostname || "";
    const local = h === "localhost" || h === "127.0.0.1";
    const pages = /\.github\.io$/i.test(h) && !/html-?preview/i.test(h);
    window.MEC_ASSET_BASE = local || pages ? "" : CDN;
  }
  if (!window.MEC_CDN) window.MEC_CDN = CDN;

  const $app = document.getElementById("app");
  const state = {
    view: "home",
    draft: null,
    report: null,
    filter: "",
    remoteError: "",
    publishing: false,
  };

  function uid() {
    const d = new Date();
    const p = String(d.getFullYear()).slice(2) + pad(d.getMonth() + 1) + pad(d.getDate());
    const r = Math.random().toString(36).slice(2, 6).toUpperCase();
    return "MC-" + p + "-" + r;
  }
  function pad(n) {
    return String(n).padStart(2, "0");
  }
  function nowISO() {
    return new Date().toISOString();
  }
  function fmtDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    return d.toLocaleString("es-CL", { dateStyle: "short", timeStyle: "short" });
  }
  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loadSettings() {
    try {
      return Object.assign(
        { company: "", rut: "", branch: "", inspector: "", logo: "" },
        JSON.parse(localStorage.getItem(SETTINGS) || "{}")
      );
    } catch (e) {
      return { company: "", rut: "", branch: "", inspector: "", logo: "" };
    }
  }
  function saveSettings(s) {
    localStorage.setItem(SETTINGS, JSON.stringify(s));
  }
  function blank(s) {
    return !String(s || "").trim();
  }
  function settingsComplete(s) {
    s = s || loadSettings();
    return !blank(s.company) && !blank(s.rut) && !blank(s.branch) && !blank(s.inspector) && !blank(s.logo);
  }
  function reqLabel(text) {
    return escapeHtml(text) + ' <span class="req">*</span>';
  }
  function loadReports() {
    try {
      return JSON.parse(localStorage.getItem(STORE) || "[]");
    } catch (e) {
      return [];
    }
  }
  function saveReports(list) {
    try {
      localStorage.setItem(STORE, JSON.stringify(list));
    } catch (e) {
      const slim = list.map((r, i) => {
        if (i < 12) return r;
        const c = JSON.parse(JSON.stringify(r));
        if (c.equipment) {
          c.equipment.photo = "";
          c.equipment.photos = [];
        }
        return c;
      });
      try {
        localStorage.setItem(STORE, JSON.stringify(slim.slice(0, 40)));
      } catch (e2) {
        localStorage.setItem(STORE, JSON.stringify(list.slice(0, 8)));
      }
    }
  }
  function upsertReport(rep) {
    const list = loadReports().filter((r) => r.id !== rep.id);
    list.unshift(rep);
    saveReports(list.slice(0, 120));
  }
  function getReport(id) {
    return loadReports().find((r) => r.id === id);
  }
  function templateById(id) {
    return (window.MEC_TEMPLATES || []).find((t) => t.id === id);
  }
  function eqPhoto(typeId) {
    if (!typeId || typeId === "libre") return "";
    if (window.MEC_PHOTOS && window.MEC_PHOTOS[typeId]) return window.MEC_PHOTOS[typeId];
    return (window.MEC_ASSET_BASE || "") + "img/equipos/" + typeId + ".jpg";
  }
  function eqPhotoTag(typeId, cls, alt) {
    const src = eqPhoto(typeId);
    if (!src) return "";
    return (
      '<img class="' +
      (cls || "eq-photo") +
      '" src="' +
      src +
      '" alt="' +
      escapeHtml(alt || "") +
      '" loading="lazy" onerror="window.mecImgFb&&window.mecImgFb(this)">'
    );
  }
  function userPhotos(r) {
    if (!r || !r.equipment) return [];
    if (r.equipment.photos && r.equipment.photos.length) return r.equipment.photos;
    if (r.equipment.photo) return [r.equipment.photo];
    return [];
  }
  function ensurePhotos(d) {
    if (!d.equipment) d.equipment = { code: "", location: "", photo: "", photos: [] };
    if (!d.equipment.photos) d.equipment.photos = userPhotos(d);
  }
  function compressImage(file, max, quality) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        const limit = max || 960;
        let w = img.width;
        let h = img.height;
        if (w > limit || h > limit) {
          const s = limit / Math.max(w, h);
          w = Math.round(w * s);
          h = Math.round(h * s);
        }
        const c = document.createElement("canvas");
        c.width = w;
        c.height = h;
        const ctx = c.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(c.toDataURL("image/jpeg", quality || 0.72));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error("foto"));
      };
      img.src = url;
    });
  }
  function brandLogo(cls) {
    const src = (window.MEC_ASSET_BASE || "") + "icon.svg";
    return (
      '<img class="' +
      (cls || "brand-logo") +
      '" src="' +
      src +
      '" alt="' +
      escapeHtml(APP_NAME) +
      '" width="40" height="40" onerror="window.mecImgFb&&window.mecImgFb(this)">'
    );
  }
  function newDraft(typeId) {
    const t = templateById(typeId) || templateById("libre") || (window.MEC_TEMPLATES || [])[0];
    const s = loadSettings();
    return {
      id: uid(),
      createdAt: nowISO(),
      company: s.company,
      rut: s.rut,
      branch: s.branch,
      companyLogo: s.logo || "",
      type: t ? t.id : "libre",
      typeName: t ? t.name : "",
      group: t ? t.group : "General",
      equipment: { code: "", location: "", photo: "", photos: [] },
      inspector: s.inspector,
      cargo: "",
      items: ((t && t.items) || []).map((text, i) => ({
        id: (t ? t.id : "libre") + "-" + (i + 1),
        text: text,
        result: "",
        note: "",
      })),
      observations: "",
      verdict: "",
      signatures: { inspector: "", supervisor: "" },
      strokes: { inspector: [], supervisor: [] },
      supervisorName: "",
      blobId: "",
      shareCode: "",
    };
  }

  /* ---------- signature pads ---------- */
  const pads = {};
  function bindPad(canvas, key) {
    const ctx = canvas.getContext("2d");
    const ratio = window.devicePixelRatio || 1;
    const cssW = canvas.clientWidth || 300;
    const cssH = canvas.clientHeight || 120;
    canvas.width = Math.floor(cssW * ratio);
    canvas.height = Math.floor(cssH * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    function paintPaper() {
      ctx.fillStyle = "#fffef8";
      ctx.fillRect(0, 0, cssW, cssH);
    }
    paintPaper();
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let drawing = false;
    let last = null;
    const strokes = (state.draft.strokes && state.draft.strokes[key] && state.draft.strokes[key].map((s) => s.slice())) || [];
    let current = [];
    if (!state.draft.strokes) state.draft.strokes = { inspector: [], supervisor: [] };
    const pos = (e) => {
      const r = canvas.getBoundingClientRect();
      const src = e.touches ? e.touches[0] : e;
      return { x: Math.round(src.clientX - r.left), y: Math.round(src.clientY - r.top) };
    };
    const start = (e) => {
      e.preventDefault();
      drawing = true;
      last = pos(e);
      current = [last];
    };
    const move = (e) => {
      if (!drawing) return;
      e.preventDefault();
      const p = pos(e);
      if (Math.abs(p.x - last.x) + Math.abs(p.y - last.y) < 2) return;
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      last = p;
      current.push(p);
    };
    const end = (e) => {
      if (!drawing) return;
      drawing = false;
      if (current.length) strokes.push(current.map((p) => [p.x, p.y]));
      current = [];
      state.draft.strokes[key] = strokes;
      try {
        state.draft.signatures[key] = canvas.toDataURL("image/png");
      } catch (err) {}
    };
    canvas.addEventListener("pointerdown", start);
    canvas.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
    pads[key] = {
      canvas: canvas,
      clear: () => {
        paintPaper();
        strokes.length = 0;
        if (state.draft) {
          state.draft.signatures[key] = "";
          state.draft.strokes[key] = [];
        }
      },
    };
    const existingStrokes = state.draft && state.draft.strokes && state.draft.strokes[key];
    if (existingStrokes && existingStrokes.length) {
      existingStrokes.forEach((st) => {
        if (!st.length) return;
        ctx.beginPath();
        ctx.moveTo(st[0][0], st[0][1]);
        for (let i = 1; i < st.length; i++) ctx.lineTo(st[i][0], st[i][1]);
        ctx.stroke();
      });
    } else {
      const existing = state.draft && state.draft.signatures[key];
      if (existing) {
        const img = new Image();
        img.onload = () => ctx.drawImage(img, 0, 0, cssW, cssH);
        img.src = existing;
      }
    }
  }

  function capStrokes(strokes, maxPts) {
    if (!strokes || !strokes.length) return [];
    const copy = strokes.map((s) => s.filter(Boolean));
    let n = copy.reduce((a, s) => a + s.length, 0);
    if (n <= maxPts) return copy;
    const step = Math.ceil(n / maxPts);
    return copy.map((s) => s.filter((_, i) => i === 0 || i === s.length - 1 || i % step === 0));
  }

  function compactReport(r) {
    return {
      v: 1,
      id: r.id,
      at: r.createdAt,
      co: r.company,
      rut: r.rut,
      br: r.branch,
      ty: r.type,
      tn: r.typeName,
      gp: r.group,
      eq: r.equipment
        ? { code: r.equipment.code || "", location: r.equipment.location || "", brand: r.equipment.brand || "", model: r.equipment.model || "" }
        : {},
      ins: r.inspector,
      car: r.cargo,
      tx: (r.items || []).map((i) => i.text),
      rs: (r.items || []).map((i) => (i.result === "ok" ? "o" : i.result === "fail" ? "f" : i.result === "na" ? "n" : ".")).join(""),
      nt: (r.items || []).reduce((a, i, idx) => {
        if (i.note) a[idx] = i.note;
        return a;
      }, {}),
      ob: r.observations,
      ve: r.verdict,
      si: capStrokes((r.strokes && r.strokes.inspector) || [], 280),
      ss: capStrokes((r.strokes && r.strokes.supervisor) || [], 180),
      sn: r.supervisorName,
    };
  }

  function expandReport(c) {
    const t = templateById(c.ty);
    const texts = c.tx && c.tx.length ? c.tx : t ? t.items : [];
    const items = [];
    const rs = c.rs || "";
    const n = Math.max(texts.length, rs.length);
    for (let i = 0; i < n; i++) {
      const ch = rs[i];
      items.push({
        id: (c.ty || "x") + "-" + (i + 1),
        text: texts[i] || "Punto " + (i + 1),
        result: ch === "o" ? "ok" : ch === "f" ? "fail" : ch === "n" ? "na" : "",
        note: (c.nt && c.nt[i]) || "",
      });
    }
    return {
      id: c.id,
      createdAt: c.at,
      company: c.co,
      rut: c.rut,
      branch: c.br,
      companyLogo: c.lg || "",
      type: c.ty,
      typeName: c.tn || (t && t.name) || c.ty,
      group: c.gp || (t && t.group) || "",
      equipment: c.eq || {},
      inspector: c.ins,
      cargo: c.car,
      items: items,
      observations: c.ob,
      verdict: c.ve,
      strokes: { inspector: c.si || [], supervisor: c.ss || [] },
      signatures: { inspector: "", supervisor: "" },
      supervisorName: c.sn || "",
      blobId: "",
      shareCode: "",
    };
  }

  function b64url(bytes) {
    let s = "";
    for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
    return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  function b64urlToBytes(s) {
    const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64.length % 4 === 0 ? "" : "=".repeat(4 - (b64.length % 4));
    const bin = atob(b64 + pad);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }

  async function encodeShare(report) {
    const json = JSON.stringify(compactReport(report));
    if (typeof CompressionStream === "function") {
      const buf = new TextEncoder().encode(json);
      const stream = new Blob([buf]).stream().pipeThrough(new CompressionStream("deflate-raw"));
      const ab = await new Response(stream).arrayBuffer();
      return "z" + b64url(new Uint8Array(ab));
    }
    return "u" + btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  async function decodeShare(code) {
    if (!code) throw new Error("Ficha vacía");
    if (code[0] === "z") {
      const bytes = b64urlToBytes(code.slice(1));
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      const ab = await new Response(stream).arrayBuffer();
      return expandReport(JSON.parse(new TextDecoder().decode(ab)));
    }
    if (code[0] === "u") {
      const raw = code.slice(1).replace(/-/g, "+").replace(/_/g, "/");
      const pad = raw.length % 4 === 0 ? "" : "=".repeat(4 - (raw.length % 4));
      return expandReport(JSON.parse(decodeURIComponent(escape(atob(raw + pad)))));
    }
    return expandReport(JSON.parse(decodeURIComponent(escape(atob(code)))));
  }

  function strokesSvg(strokes) {
    if (!strokes || !strokes.length) return "";
    let d = "";
    strokes.forEach((st) => {
      if (!st || !st.length) return;
      d += "M" + st[0][0] + " " + st[0][1];
      for (let i = 1; i < st.length; i++) d += "L" + st[i][0] + " " + st[i][1];
    });
    return (
      '<svg class="sig-img" viewBox="0 0 300 120" preserveAspectRatio="xMidYMid meet"><rect width="300" height="120" fill="#fffef8"/><path d="' +
      d +
      '" fill="none" stroke="#1a1a1a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
    );
  }

  function sigBlock(label, jpeg, strokes) {
    const hasStrokes = strokes && strokes.length;
    const art = hasStrokes
      ? strokesSvg(strokes)
      : jpeg && jpeg.indexOf("data:image") === 0
        ? '<img class="sig-img" alt="' + escapeHtml(label) + '" src="' + jpeg + '">'
        : "";
    return (
      "<div><div class=\"note\">" +
      escapeHtml(label) +
      "</div>" +
      (art || "<p class=\"note\">Sin firma</p>") +
      "</div>"
    );
  }
  function publicBase() {
    return location.origin && location.origin !== "null"
      ? location.origin + location.pathname
      : location.href.split("#")[0];
  }
  function viewUrl(blobId) {
    return publicBase() + "#/r/" + blobId;
  }
  function localViewUrl(id) {
    return publicBase() + "#/local/" + id;
  }
  function shareUrl(r) {
    if (r && r.shareCode) return publicBase() + "#/v/" + r.shareCode;
    if (r && r.blobId) return viewUrl(r.blobId);
    if (r) return localViewUrl(r.id);
    return publicBase();
  }

  function drawQr(el, text) {
    el.innerHTML = "";
    try {
      const qr = qrcode(0, text.length > 500 ? "L" : "M");
      qr.addData(text);
      qr.make();
      el.innerHTML = qr.createSvgTag(4, 8);
      const svg = el.querySelector("svg");
      if (svg) {
        svg.setAttribute("width", "260");
        svg.setAttribute("height", "260");
        svg.style.maxWidth = "100%";
      }
    } catch (e) {
      const img = document.createElement("img");
      img.alt = "QR";
      img.src = "https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=" + encodeURIComponent(text);
      el.appendChild(img);
    }
  }

  async function publish(report) {
    const slim = JSON.parse(JSON.stringify(report));
    const res = await fetch(BLOB, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(slim),
    });
    if (!res.ok) throw new Error("No se pudo publicar (" + res.status + ")");
    const loc = res.headers.get("Location") || res.headers.get("location") || res.headers.get("X-jsonblob");
    let id = "";
    if (loc) id = String(loc).split("/").pop();
    if (!id) {
      try {
        const body = await res.json();
        id = body.id || body.blobId || "";
      } catch (e) {}
    }
    if (!id) {
      const hdrs = [...res.headers.entries()];
      const hit = hdrs.find((h) => /jsonblob|location/i.test(h[0]));
      if (hit) id = String(hit[1]).split("/").pop();
    }
    if (!id) throw new Error("El servidor no devolvió un ID público");
    return id;
  }

  async function fetchRemote(id) {
    const res = await fetch(BLOB + "/" + id, { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error("Ficha no encontrada");
    return res.json();
  }

  /* ---------- routing ---------- */
  function parseHash() {
    const raw = (location.hash || "#/").replace(/^#/, "");
    const parts = raw.split("/").filter(Boolean);
    return parts;
  }

  function go(path) {
    location.hash = path;
  }

  window.addEventListener("hashchange", () => {
    route();
  });

  async function route() {
    const p = parseHash();
    if (p[0] === "v" && p[1]) {
      state.view = "remote";
      state.remoteError = "";
      state.report = null;
      render();
      try {
        state.report = await decodeShare(decodeURIComponent(p.slice(1).join("/")));
      } catch (e) {
        state.remoteError = "No se pudo leer esta ficha. Pide que te reenvíen el QR o el enlace.";
      }
      render();
      return;
    }
    if (p[0] === "r" && p[1]) {
      state.view = "remote";
      state.remoteError = "";
      render();
      try {
        state.report = await fetchRemote(p[1]);
      } catch (e) {
        state.remoteError = e.message || "No se pudo abrir la ficha";
        state.report = null;
      }
      render();
      return;
    }
    if (p[0] === "local" && p[1]) {
      state.view = "view";
      state.report = getReport(p[1]) || null;
      render();
      return;
    }
    if (p[0] === "nuevo") {
      if (!settingsComplete()) {
        alert("Primero completa los datos de la empresa, incluido el logo.");
        go("#/ajustes");
        return;
      }
      const typeId = p[1] || "libre";
      if (!state.draft || state.draft.type !== typeId) state.draft = newDraft(typeId);
      state.view = "form";
      render();
      afterForm();
      return;
    }
    if (p[0] === "tipos") {
      if (!settingsComplete()) {
        alert("Primero completa los datos de la empresa, incluido el logo.");
        go("#/ajustes");
        return;
      }
      state.view = "types";
      render();
      return;
    }
    if (p[0] === "historial") {
      state.view = "history";
      render();
      return;
    }
    if (p[0] === "ajustes") {
      state.editSettings = Object.assign({}, loadSettings());
      state.view = "settings";
      render();
      return;
    }
    if (p[0] === "pdf") {
      state.view = "print";
      if (p[1]) state.report = getReport(decodeURIComponent(p[1])) || state.report;
      render();
      return;
    }
    if (p[0] === "qr" && p[1]) {
      state.view = "qr";
      state.report = getReport(p[1]) || state.report;
      render();
      afterQr();
      return;
    }
    state.view = "home";
    render();
  }

  /* ---------- UI ---------- */
  function topBar(title, back) {
    return (
      '<header class="top">' +
      (back ? '<button class="back" data-go="' + back + '" aria-label="Volver">←</button>' : brandLogo()) +
      '<div><h1>' +
      escapeHtml(title) +
      "</h1></div></header>"
    );
  }

  function home() {
    const s = loadSettings();
    const n = loadReports().length;
    return (
      '<header class="top">' +
      (s.logo
        ? '<img class="brand-logo company-mark" src="' + s.logo + '" alt="' + escapeHtml(s.company) + '">'
        : brandLogo()) +
      '<div><h1>' +
      APP_NAME +
      '</h1><div class="sub">' +
      escapeHtml(s.company || "Completa los datos de la empresa") +
      "</div></div></header>" +
      '<div class="hero"><p>Elige qué vas a revisar, marca los checks y al final saca fotos del equipo. Se firma en el celular y se comparte con un QR.</p></div>' +
      '<div class="wrap">' +
      '<button class="btn" data-go="#/tipos">Nueva inspección</button>' +
      '<div class="actions">' +
      '<button class="btn ghost" data-go="#/historial">Historial (' +
      n +
      ")</button>" +
      '<button class="btn ghost" data-go="#/ajustes">Datos de la empresa' +
      (settingsComplete() ? "" : " (obligatorio)") +
      "</button>" +
      "</div>" +
      (settingsComplete()
        ? ""
        : '<p class="banner-bad">Completa nombre, RUT, sucursal, inspector y el logo de la empresa antes de inspeccionar.</p>') +
      '<p class="note">Las inspecciones quedan en la memoria de <b>este navegador</b>, en este celular. No hay cuenta en la nube: si borras los datos del sitio, usas otro teléfono u otro explorador, el historial no aparece. El QR sirve para mostrar esa ficha a otra persona.</p>' +
      '<p class="note">Bitácora de apoyo. No reemplaza certificaciones ni fiscalizaciones oficiales.</p>' +
      "</div>"
    );
  }

  function typesView() {
    const q = (state.filter || "").toLowerCase();
    const list = (window.MEC_TEMPLATES || []).filter(
      (t) => !q || (t.name + " " + t.group + " " + t.hint).toLowerCase().indexOf(q) >= 0
    );
    const groups = [];
    list.forEach((t) => {
      if (!groups.includes(t.group)) groups.push(t.group);
    });
    let html =
      topBar("Qué se inspecciona", "#/") +
      '<div class="wrap"><input class="search" id="q" placeholder="Buscar…" value="' +
      escapeHtml(state.filter) +
      '">';
    if (!list.length) {
      html += '<p class="empty">Sin coincidencias.</p></div>';
      return html;
    }
    groups.forEach((g) => {
      html += '<div class="group-title">' + escapeHtml(g) + '</div><div class="grid">';
      list
        .filter((t) => t.group === g)
        .forEach((t) => {
          html +=
            '<button class="eq" data-go="#/nuevo/' +
            t.id +
            '">' +
            (eqPhotoTag(t.id, "eq-thumb", t.name) || '<div class="eq-thumb photo-empty"></div>') +
            '<span class="eq-body"><span class="tag">' +
            escapeHtml(t.group) +
            "</span><b>" +
            escapeHtml(t.name) +
            "</b><span>" +
            escapeHtml(t.hint) +
            "</span></span></button>";
        });
      html += "</div>";
    });
    html += "</div>";
    return html;
  }

  function formView() {
    const d = state.draft;
    if (!d) return home();
    if (!d.equipment) d.equipment = { code: "", location: "", photo: "", photos: [] };
    const catalog = eqPhotoTag(d.type, "eq-hero-img", d.typeName);
    let html =
      topBar(d.typeName || "Nueva inspección", "#/tipos") +
      '<div class="wrap">' +
      (catalog ? '<div class="eq-hero">' + catalog + "</div>" : "") +
      '<p class="note">Folio <span class="folio">' +
      escapeHtml(d.id) +
      "</span>. Puedes ajustar los puntos. Al final saca fotos del equipo.</p>" +
      '<div class="card"><label>' +
      reqLabel("Qué se inspecciona") +
      '</label><input id="f-name" required placeholder="Nombre de lo que se revisa" value="' +
      escapeHtml(d.typeName) +
      '">' +
      "<label>" +
      reqLabel("Código / referencia") +
      '</label><input id="f-code" required value="' +
      escapeHtml(d.equipment.code || "") +
      '">' +
      "<label>" +
      reqLabel("Ubicación") +
      '</label><input id="f-loc" required value="' +
      escapeHtml(d.equipment.location || "") +
      '">' +
      "<label>" +
      reqLabel("Quién revisa") +
      '</label><input id="f-insp" required value="' +
      escapeHtml(d.inspector) +
      '">' +
      "<label>" +
      reqLabel("Cargo") +
      '</label><input id="f-cargo" required value="' +
      escapeHtml(d.cargo) +
      '"></div>' +
      "<h3 style=\"margin:8px 0\">Puntos de control</h3>";

    d.items.forEach((it, i) => {
      html +=
        '<div class="item ' +
        escapeHtml(it.result) +
        '"><div class="item-head"><input class="item-text" data-item-text="' +
        i +
        '" value="' +
        escapeHtml(it.text) +
        '"><button type="button" class="icon-btn item-del" data-del-item="' +
        i +
        '" aria-label="Quitar punto">×</button></div><div class="seg">' +
        '<button data-item="' +
        i +
        '" data-res="ok" class="' +
        (it.result === "ok" ? "on-ok" : "") +
        '">OK</button>' +
        '<button data-item="' +
        i +
        '" data-res="fail" class="' +
        (it.result === "fail" ? "on-fail" : "") +
        '">Falla</button>' +
        '<button data-item="' +
        i +
        '" data-res="na" class="' +
        (it.result === "na" ? "on-na" : "") +
        '">N/A</button></div>' +
        (it.result === "fail"
          ? '<label>' +
            reqLabel("Detalle de la falla") +
            '</label><input data-note="' +
            i +
            '" required placeholder="¿Qué se vio?" value="' +
            escapeHtml(it.note) +
            '">'
          : "") +
        "</div>";
    });
    html +=
      '<div class="card"><label>Agregar un punto</label><input id="new-item" placeholder="Escribe el check y agrégalo">' +
      '<button type="button" class="btn" id="add-item" style="margin-top:8px">Agregar al listado</button></div>';

    const shots = userPhotos(d);
    html +=
      '<div class="card"><h3 style="margin:0 0 8px">Fotos del equipo <span class="req">*</span></h3>' +
      '<p class="note">Obligatorio: al terminar el check, saca al menos una foto del equipo.</p>' +
      '<div class="shot-grid">';
    shots.forEach((src, i) => {
      html +=
        '<div class="shot"><img src="' +
        src +
        '" alt="Foto ' +
        (i + 1) +
        '"><button type="button" class="icon-btn shot-del" data-del-shot="' +
        i +
        '" aria-label="Quitar foto">×</button></div>';
    });
    html +=
      "</div>" +
      '<div class="photo-actions">' +
      '<label class="btn">Tomar foto<input id="f-photo-cam" type="file" accept="image/*" capture="environment" hidden></label>' +
      '<label class="btn ghost">Elegir de galería<input id="f-photo-gal" type="file" accept="image/*" hidden></label>' +
      "</div></div>";

    html +=
      '<div class="card"><label>' +
      reqLabel("Observaciones generales") +
      '</label><textarea id="f-obs" required placeholder="Anota lo relevante">' +
      escapeHtml(d.observations) +
      "</textarea></div>" +
      '<div class="card"><label>' +
      reqLabel("Resultado") +
      '</label><div class="verdict">';
    (window.MEC_VERDICTS || []).forEach((v) => {
      html +=
        '<button data-verdict="' +
        v.id +
        '" class="' +
        (d.verdict === v.id ? "on-" + v.id : "") +
        '"><b>' +
        escapeHtml(v.name) +
        "</b><small>" +
        escapeHtml(v.hint) +
        "</small></button>";
    });
    html +=
      "</div></div>" +
      '<div class="card"><label>' +
      reqLabel("Firma de quien revisa") +
      '</label>' +
      '<div class="pad-wrap"><canvas id="pad-insp"></canvas><div class="pad-bar"><span>Firme dentro del recuadro</span><button class="icon-btn" id="clr-insp" type="button" style="width:auto;padding:4px 8px;font-size:12px">Borrar</button></div></div>' +
      "<label>" +
      reqLabel("Nombre del supervisor") +
      '</label><input id="f-sup" required placeholder="Nombre y apellido" value="' +
      escapeHtml(d.supervisorName) +
      '">' +
      "<label>" +
      reqLabel("Firma del supervisor") +
      "</label>" +
      '<div class="pad-wrap" style="margin-top:8px"><canvas id="pad-sup"></canvas><div class="pad-bar"><span>Firma supervisor</span><button class="icon-btn" id="clr-sup" type="button" style="width:auto;padding:4px 8px;font-size:12px">Borrar</button></div></div></div>' +
      "</div>" +
      '<div class="dock"><button class="btn" id="save">Guardar, firmar y crear QR</button></div>';
    return html;
  }

  function readForm() {
    const d = state.draft;
    if (!d) return;
    const val = (id) => {
      const el = document.getElementById(id);
      return el ? el.value : "";
    };
    d.typeName = val("f-name") || d.typeName;
    if (!d.equipment) d.equipment = { code: "", location: "", photo: "", photos: [] };
    d.equipment.code = val("f-code");
    d.equipment.location = val("f-loc");
    d.inspector = val("f-insp");
    d.cargo = val("f-cargo");
    d.observations = val("f-obs");
    d.supervisorName = val("f-sup");
    document.querySelectorAll("input[data-item-text]").forEach((el) => {
      const i = +el.getAttribute("data-item-text");
      if (d.items[i]) d.items[i].text = el.value;
    });
    document.querySelectorAll("input[data-note]").forEach((el) => {
      d.items[+el.getAttribute("data-note")].note = el.value;
    });
    try {
      if (pads.inspector && pads.inspector.canvas && state.draft.strokes.inspector && state.draft.strokes.inspector.length) {
        d.signatures.inspector = pads.inspector.canvas.toDataURL("image/png");
      }
      if (pads.supervisor && pads.supervisor.canvas && state.draft.strokes.supervisor && state.draft.strokes.supervisor.length) {
        d.signatures.supervisor = pads.supervisor.canvas.toDataURL("image/png");
      }
    } catch (e) {}
  }

  function afterForm() {
    const a = document.getElementById("pad-insp");
    const b = document.getElementById("pad-sup");
    if (a) bindPad(a, "inspector");
    if (b) bindPad(b, "supervisor");
    const ci = document.getElementById("clr-insp");
    const cs = document.getElementById("clr-sup");
    if (ci) ci.onclick = () => pads.inspector && pads.inspector.clear();
    if (cs) cs.onclick = () => pads.supervisor && pads.supervisor.clear();
    const bindShot = (id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.onchange = async () => {
        const f = el.files && el.files[0];
        if (!f) return;
        readForm();
        try {
          ensurePhotos(state.draft);
          const data = await compressImage(f);
          if (state.draft.equipment.photos.length >= 8) {
            alert("Puedes adjuntar hasta 8 fotos.");
            return;
          }
          state.draft.equipment.photos.push(data);
          state.draft.equipment.photo = data;
        } catch (e) {
          alert("No se pudo leer la foto.");
          return;
        }
        render();
        afterForm();
      };
    };
    bindShot("f-photo-cam");
    bindShot("f-photo-gal");
    $app.querySelectorAll("[data-del-shot]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readForm();
        ensurePhotos(state.draft);
        const i = +btn.getAttribute("data-del-shot");
        state.draft.equipment.photos.splice(i, 1);
        state.draft.equipment.photo = state.draft.equipment.photos[0] || "";
        render();
        afterForm();
      });
    });
    const add = document.getElementById("add-item");
    if (add)
      add.onclick = () => {
        readForm();
        const inp = document.getElementById("new-item");
        const text = inp ? inp.value.trim() : "";
        if (!text) {
          alert("Escribe el punto a revisar.");
          return;
        }
        state.draft.items.push({ id: "c-" + Date.now(), text: text, result: "", note: "" });
        render();
        afterForm();
      };
    $app.querySelectorAll("[data-del-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readForm();
        if (state.draft.items.length <= 1) {
          alert("Debe quedar al menos un punto de control.");
          return;
        }
        const i = +btn.getAttribute("data-del-item");
        state.draft.items.splice(i, 1);
        render();
        afterForm();
      });
    });
  }

  function reportHtml(r, publicLink) {
    if (!r) return '<p class="empty">Ficha no encontrada.</p>';
    const v = (window.MEC_VERDICTS || []).find((x) => x.id === r.verdict);
    let items = "";
    (r.items || []).forEach((it, i) => {
      const mark = it.result === "ok" ? "OK" : it.result === "fail" ? "FALLA" : it.result === "na" ? "N/A" : "—";
      items +=
        '<div class="item ' +
        escapeHtml(it.result || "") +
        '"><p>' +
        (i + 1) +
        ". " +
        escapeHtml(it.text) +
        ' <span class="badge ' +
        escapeHtml(it.result || "") +
        '">' +
        mark +
        "</span></p>" +
        (it.note ? "<div class=\"note\">" + escapeHtml(it.note) + "</div>" : "") +
        "</div>";
    });
    return (
      (r.verdict === "rechazado" ? '<div class="banner-bad">NO APTO — NO USAR</div>' : "") +
      '<div class="card report">' +
      '<div class="report-head">' +
      (r.companyLogo
        ? '<img class="company-logo" src="' + r.companyLogo + '" alt="' + escapeHtml(r.company || "Logo") + '">'
        : "") +
      '<div class="report-head-text"><b>' +
      escapeHtml(r.company || "") +
      "</b><div class=\"note\">" +
      escapeHtml(r.rut || "") +
      (r.branch ? " · " + escapeHtml(r.branch) : "") +
      "</div></div>" +
      brandLogo("brand-logo report-logo") +
      "</div>" +
      '<div class="report-brand"><span>' +
      APP_NAME +
      "</span></div>" +
      (eqPhoto(r.type)
        ? '<div class="eq-hero">' + eqPhotoTag(r.type, "eq-hero-img", r.typeName) + "</div>"
        : "") +
      (userPhotos(r).length
        ? '<h2>Fotos del equipo</h2><div class="shot-grid report-shots">' +
          userPhotos(r)
            .map(function (src, i) {
              return '<img class="shot-img" src="' + src + '" alt="Foto ' + (i + 1) + '">';
            })
            .join("") +
          "</div>"
        : "") +
      "<div class=\"kv\">" +
      "<i>Empresa</i><b>" +
      escapeHtml(r.company) +
      "</b>" +
      "<i>RUT</i><span>" +
      escapeHtml(r.rut || "—") +
      "</span>" +
      "<i>Sucursal</i><span>" +
      escapeHtml(r.branch || "—") +
      "</span>" +
      "<i>Folio</i><span class=\"folio\">" +
      escapeHtml(r.id) +
      "</span>" +
      "<i>Fecha</i><span>" +
      escapeHtml(fmtDate(r.createdAt)) +
      "</span>" +
      "<i>Qué se revisó</i><b>" +
      escapeHtml(r.typeName) +
      "</b>" +
      "<i>Código</i><span>" +
      escapeHtml(r.equipment && r.equipment.code ? r.equipment.code : "—") +
      "</span>" +
      "<i>Ubicación</i><span>" +
      escapeHtml((r.equipment && r.equipment.location) || "—") +
      "</span>" +
      "<i>Quién revisó</i><span>" +
      escapeHtml(r.inspector || "—") +
      " · " +
      escapeHtml(r.cargo || "") +
      "</span>" +
      "<i>Resultado</i><span class=\"badge " +
      escapeHtml(r.verdict) +
      '">' +
      escapeHtml(v ? v.name : r.verdict || "Sin cierre") +
      "</span></div>" +
      (r.observations ? "<h2>Observaciones</h2><p>" + escapeHtml(r.observations) + "</p>" : "") +
      "<h2>Puntos</h2>" +
      items +
      "<h2>Firmas</h2><div class=\"grid grid-2\">" +
      sigBlock("Inspector", r.signatures && r.signatures.inspector, r.strokes && r.strokes.inspector) +
      sigBlock(
        "Supervisor " + (r.supervisorName || ""),
        r.signatures && r.signatures.supervisor,
        r.strokes && r.strokes.supervisor
      ) +
      "</div>" +
      (publicLink ? '<p class="note" style="margin-top:12px">Ficha pública: ' + escapeHtml(publicLink) + "</p>" : "") +
      "</div>"
    );
  }

  function historyView() {
    const rows = loadReports();
    let html = topBar("Historial", "#/") + '<div class="wrap">';
    if (!rows.length) html += '<p class="empty">Aún no hay inspecciones en este navegador. Quedan guardadas solo en este celular.</p>';
    rows.forEach((r) => {
      html +=
        '<button class="list-row" data-go="#/local/' +
        encodeURIComponent(r.id) +
        '">' +
        (eqPhotoTag(r.type, "eq-mini", r.typeName) ||
          (userPhotos(r)[0]
            ? '<img class="eq-mini" src="' + userPhotos(r)[0] + '" alt="">'
            : '<div class="eq-mini photo-empty"></div>')) +
        '<span class="dot ' +
        escapeHtml(r.verdict || "") +
        '"></span><span style="flex:1"><b>' +
        escapeHtml(r.typeName) +
        "</b><div class=\"note\">" +
        escapeHtml(r.id) +
        " · " +
        escapeHtml(fmtDate(r.createdAt)) +
        " · " +
        escapeHtml((r.equipment && r.equipment.code) || "sin código") +
        "</div></span></button>";
    });
    html += "</div>";
    return html;
  }

  function settingsView() {
    if (!state.editSettings) state.editSettings = Object.assign({}, loadSettings());
    const s = state.editSettings;
    return (
      topBar("Empresa", "#/") +
      '<div class="wrap"><div class="card">' +
      "<p class=\"note\">Todos los datos son obligatorios, incluido el logo. Aparece en el documento final.</p>" +
      "<label>" +
      reqLabel("Nombre o razón social") +
      '</label><input id="s-co" required value="' +
      escapeHtml(s.company) +
      '">' +
      "<label>" +
      reqLabel("RUT") +
      '</label><input id="s-rut" required value="' +
      escapeHtml(s.rut) +
      '">' +
      "<label>" +
      reqLabel("Sucursal / lugar") +
      '</label><input id="s-br" required value="' +
      escapeHtml(s.branch) +
      '">' +
      "<label>" +
      reqLabel("Inspector por defecto") +
      '</label><input id="s-in" required value="' +
      escapeHtml(s.inspector) +
      '">' +
      "<label>" +
      reqLabel("Logo de la empresa") +
      "</label>" +
      (s.logo
        ? '<div class="logo-preview"><img src="' + s.logo + '" alt="Logo"></div>'
        : '<p class="note">Aún no hay logo.</p>') +
      '<div class="photo-actions">' +
      '<label class="btn">Cargar logo<input id="s-logo" type="file" accept="image/*" hidden></label>' +
      (s.logo ? '<button type="button" class="btn ghost" id="clr-logo">Quitar logo</button>' : "") +
      "</div>" +
      '</div><button class="btn" id="save-set">Guardar</button></div>'
    );
  }

  function qrView() {
    const r = state.report;
    if (!r) return topBar("QR", "#/") + '<div class="wrap"><p class="empty">No hay ficha.</p></div>';
    const link = shareUrl(r);
    return (
      topBar("Ficha y QR", "#/historial") +
      '<div class="wrap">' +
      '<div class="qrbox"><div class="note">Cualquiera con el celular puede escanear este código y ver la inspección</div>' +
      '<div id="qr"></div>' +
      '<div class="folio">' +
      escapeHtml(r.id) +
      "</div>" +
      '<p class="note" id="qr-link">' +
      escapeHtml(link) +
      "</p></div>" +
      '<div class="actions">' +
      '<button class="btn" id="copy">Copiar enlace</button>' +
      '<button class="btn ghost" id="share">Compartir</button>' +
      '<button class="btn" id="print">Exportar PDF carta</button>' +
      '<button class="btn ghost" data-go="#/local/' +
      encodeURIComponent(r.id) +
      '">Ver ficha completa</button>' +
      "</div>" +
      (r.shareCode
        ? '<p class="note">El QR lleva la ficha completa (puntos, resultado y firma). Quien lo escanee la ve en su celular, sin instalar la app.</p>'
        : '<p class="note">Genera de nuevo la ficha para crear el enlace público.</p>') +
      "</div>"
    );
  }

  function afterQr() {
    const r = state.report;
    if (!r) return;
    const link = shareUrl(r);
    const box = document.getElementById("qr");
    if (box) drawQr(box, link);
    const copy = document.getElementById("copy");
    if (copy)
      copy.onclick = async () => {
        try {
          await navigator.clipboard.writeText(link);
          copy.textContent = "Enlace copiado";
        } catch (e) {
          prompt("Copia el enlace:", link);
        }
      };
    const share = document.getElementById("share");
    if (share)
      share.onclick = async () => {
        const text = r.typeName + " " + r.id + " — " + (r.verdict || "");
        if (navigator.share) {
          try {
            await navigator.share({ title: APP_NAME + " " + r.id, text: text, url: link });
          } catch (e) {}
        } else {
          window.open("https://wa.me/?text=" + encodeURIComponent(text + " " + link));
        }
      };
    const printBtn = document.getElementById("print");
    if (printBtn)
      printBtn.onclick = () => {
        if (r) go("#/pdf/" + encodeURIComponent(r.id));
      };
    const retry = document.getElementById("retry");
    if (retry)
      retry.onclick = async () => {
        retry.disabled = true;
        retry.textContent = "Publicando…";
        try {
          const id = await publish(r);
          r.blobId = id;
          upsertReport(r);
          go("#/qr/" + r.id);
        } catch (e) {
          alert(e.message || "No se pudo publicar. Revisa la conexión.");
          retry.disabled = false;
          retry.textContent = "Publicar para que otros lo vean";
        }
      };
  }

  function printView() {
    const r = state.report;
    const back = r ? "#/local/" + encodeURIComponent(r.id) : "#/";
    if (!r) {
      return topBar("PDF carta", back) + '<div class="wrap"><p class="empty">No hay ficha para exportar.</p></div>';
    }
    return (
      topBar("PDF carta", back) +
      '<div class="wrap no-print">' +
      '<p class="note">Tamaño <b>carta</b> (8,5 × 11 pulgadas). En el cuadro elige <b>Guardar como PDF</b> y papel <b>Carta / Letter</b>.</p>' +
      '<div class="actions">' +
      '<button class="btn" id="export-pdf">Exportar PDF carta</button>' +
      '<button class="btn ghost" data-go="#/qr/' +
      encodeURIComponent(r.id) +
      '">Volver al QR</button>' +
      "</div></div>" +
      '<div class="letter-page" id="letter-doc">' +
      reportHtml(r, "") +
      '<div class="letter-foot">Documento generado por ' +
      escapeHtml(APP_NAME) +
      " · Folio " +
      escapeHtml(r.id) +
      " · Formato carta</div></div>"
    );
  }

  function exportLetterPdf(r) {
    if (!r) return;
    const prev = document.title;
    document.title = (r.company || APP_NAME) + " — " + r.id + " — carta";
    document.body.classList.add("print-letter");
    const done = function () {
      document.title = prev;
      document.body.classList.remove("print-letter");
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    setTimeout(done, 5000);
  }

  function viewPane(title, r, err) {
    return (
      topBar(title, "#/") +
      '<div class="wrap">' +
      (err ? '<div class="banner-bad">' + escapeHtml(err) + "</div>" : "") +
      (r
        ? reportHtml(r, r.blobId ? viewUrl(r.blobId) : "") +
          '<div class="actions">' +
          '<button class="btn" data-go="#/pdf/' +
          encodeURIComponent(r.id) +
          '">Exportar PDF carta</button>' +
          '<button class="btn ghost" data-go="#/qr/' +
          encodeURIComponent(r.id) +
          '">Ver QR</button></div>'
        : "") +
      "</div>"
    );
  }

  function render() {
    if (state.view === "types") $app.innerHTML = typesView();
    else if (state.view === "form") $app.innerHTML = formView();
    else if (state.view === "history") $app.innerHTML = historyView();
    else if (state.view === "settings") $app.innerHTML = settingsView();
    else if (state.view === "qr") $app.innerHTML = qrView();
    else if (state.view === "print") $app.innerHTML = printView();
    else if (state.view === "view") $app.innerHTML = viewPane("Inspección", state.report, state.report ? "" : "No está en este celular.");
    else if (state.view === "remote") $app.innerHTML = viewPane("Ficha pública", state.report, state.remoteError);
    else $app.innerHTML = home();
    bindUi();
  }

  function bindUi() {
    $app.querySelectorAll("[data-go]").forEach((el) => {
      el.addEventListener("click", () => go(el.getAttribute("data-go")));
    });
    const exportPdf = document.getElementById("export-pdf");
    if (exportPdf) exportPdf.onclick = () => exportLetterPdf(state.report);
    const q = document.getElementById("q");
    if (q)
      q.addEventListener("input", () => {
        state.filter = q.value;
        const keep = q.selectionStart;
        render();
        const nq = document.getElementById("q");
        if (nq) {
          nq.focus();
          nq.setSelectionRange(keep, keep);
        }
      });
    $app.querySelectorAll("[data-item]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readForm();
        const i = +btn.getAttribute("data-item");
        state.draft.items[i].result = btn.getAttribute("data-res");
        render();
        afterForm();
      });
    });
    $app.querySelectorAll("[data-verdict]").forEach((btn) => {
      btn.addEventListener("click", () => {
        readForm();
        state.draft.verdict = btn.getAttribute("data-verdict");
        render();
        afterForm();
      });
    });
    function readSettingsForm() {
      if (!state.editSettings) state.editSettings = Object.assign({}, loadSettings());
      const g = (id) => {
        const el = document.getElementById(id);
        return el ? el.value : state.editSettings[id] || "";
      };
      state.editSettings.company = g("s-co");
      state.editSettings.rut = g("s-rut");
      state.editSettings.branch = g("s-br");
      state.editSettings.inspector = g("s-in");
    }
    const logoIn = document.getElementById("s-logo");
    if (logoIn)
      logoIn.onchange = async () => {
        const f = logoIn.files && logoIn.files[0];
        if (!f) return;
        readSettingsForm();
        try {
          state.editSettings.logo = await compressImage(f, 480, 0.84);
        } catch (e) {
          alert("No se pudo leer el logo.");
          return;
        }
        render();
      };
    const clrLogo = document.getElementById("clr-logo");
    if (clrLogo)
      clrLogo.onclick = () => {
        readSettingsForm();
        state.editSettings.logo = "";
        render();
      };
    const saveSet = document.getElementById("save-set");
    if (saveSet)
      saveSet.onclick = () => {
        readSettingsForm();
        const s = state.editSettings;
        if (blank(s.company) || blank(s.rut) || blank(s.branch) || blank(s.inspector) || blank(s.logo)) {
          alert("Todos los datos de la empresa son obligatorios, incluido el logo.");
          return;
        }
        saveSettings({
          company: s.company.trim(),
          rut: s.rut.trim(),
          branch: s.branch.trim(),
          inspector: s.inspector.trim(),
          logo: s.logo,
        });
        go("#/");
      };
    const save = document.getElementById("save");
    if (save)
      save.onclick = async () => {
        readForm();
        const d = state.draft;
        const missing = [];
        if (blank(d.typeName)) missing.push("qué se inspecciona");
        if (blank(d.equipment && d.equipment.code)) missing.push("código / referencia");
        if (blank(d.equipment && d.equipment.location)) missing.push("ubicación");
        if (blank(d.inspector)) missing.push("quién revisa");
        if (blank(d.cargo)) missing.push("cargo");
        if (!d.items.length) missing.push("al menos un punto de control");
        const pending = d.items.filter((it) => !it.result);
        if (pending.length) missing.push("marcar todos los puntos (quedan " + pending.length + ")");
        const fails = d.items.filter((it) => it.result === "fail" && blank(it.note));
        if (fails.length) missing.push("detalle de cada falla");
        if (!userPhotos(d).length) missing.push("al menos una foto del equipo");
        if (blank(d.observations)) missing.push("observaciones");
        if (!d.verdict) missing.push("resultado");
        if (!d.signatures.inspector) missing.push("firma de quien revisa");
        if (blank(d.supervisorName)) missing.push("nombre del supervisor");
        if (!d.signatures.supervisor) missing.push("firma del supervisor");
        if (missing.length) {
          alert("Falta completar: " + missing.join(", ") + ".");
          return;
        }
        const set = loadSettings();
        d.company = set.company;
        d.rut = set.rut;
        d.branch = set.branch;
        d.companyLogo = set.logo || d.companyLogo || "";
        d.createdAt = d.createdAt || nowISO();
        save.disabled = true;
        save.textContent = "Generando QR…";
        try {
          d.shareCode = await encodeShare(d);
        } catch (e) {
          d.shareCode = "";
        }
        try {
          const id = await publish(d);
          d.blobId = id;
        } catch (e) {
          d.blobId = "";
        }
        upsertReport(d);
        state.report = d;
        state.draft = null;
        go("#/qr/" + d.id);
      };
  }

  function boot() {
    try {
      route();
    } catch (e) {
      if ($app) {
        $app.innerHTML =
          '<div class="boot">' +
          brandLogo("brand-logo boot-logo") +
          "<h1>" +
          APP_NAME +
          '</h1><p id="boot-msg">No se pudo iniciar. Recarga. Evita enlaces Raw o jsDelivr: GitHub los muestra como texto y el celular queda en blanco.</p></div>';
      }
      console.error(e);
    }
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
