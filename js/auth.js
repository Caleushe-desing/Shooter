/* Bienvenida, cuentas de empresa y autorización de usuarios */
(function (w) {
  "use strict";

  const SESS = "meccheck-session-v1";
  const SETTINGS = "meccheck-settings-v1";

  let orgCache = null;

  const authState = {
    tab: "entrar",
    msg: "",
    busy: false,
    joinBlob: "",
    joinCode: "",
    logo: "",
  };

  function escapeHtml(s) {
    return String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function blank(s) {
    return !String(s || "").trim();
  }
  function nowISO() {
    return new Date().toISOString();
  }
  function uid(prefix) {
    return (prefix || "U") + "-" + Math.random().toString(36).slice(2, 8).toUpperCase();
  }
  function makeCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let s = "";
    for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }
  function asset(file) {
    return (w.MEC_ASSET_BASE || w.MEC_CDN || "") + file;
  }
  function eqSrc(id) {
    return asset("img/equipos/" + id + ".jpg");
  }

  function loadOrgs() {
    return orgCache ? [orgCache] : [];
  }
  function upsertOrg(org) {
    if (org) orgCache = org;
    return org;
  }
  function findLocalOrg() {
    return orgCache;
  }
  function inviteOf(org) {
    return (org && org.code) || "";
  }
  function joinHref(org) {
    const origin = location.origin && location.origin !== "null" ? location.origin : "";
    const pathName = location.pathname || "";
    const base = origin + pathName;
    if (org && org.code) return base + "#/unirse/" + org.code;
    return base + "#/usuario/registro";
  }
  function parseInvite(raw) {
    const t = String(raw || "").trim();
    if (!t) return { code: "", blobId: "" };
    if (t.indexOf(".") >= 0) {
      const i = t.indexOf(".");
      return { code: t.slice(0, i).toUpperCase(), blobId: t.slice(i + 1) };
    }
    return { code: t.toUpperCase(), blobId: "" };
  }

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem(SESS) || "null");
    } catch (e) {
      return null;
    }
  }
  function saveSession(s) {
    if (!s) localStorage.removeItem(SESS);
    else localStorage.setItem(SESS, JSON.stringify(s));
  }
  function clearSession() {
    localStorage.removeItem(SESS);
    orgCache = null;
    const api = w.MEC_API;
    if (api && api.available()) api.logout().catch(function () {});
  }
  function isAdmin() {
    const s = loadSession();
    return !!(s && s.role === "admin");
  }
  function canInspect() {
    const s = loadSession();
    if (!s) return false;
    if (s.role === "admin") return true;
    return s.role === "user" && s.status === "approved";
  }

  function applyApiAuth(data) {
    if (data.company) upsertOrg(data.company);
    if (data.session) {
      saveSession(data.session);
      const inspector = data.session.name || "";
      applyOrgToSettings(data.company || orgCache || {}, inspector);
    }
    return data;
  }

  async function pullOrg() {
    const api = w.MEC_API;
    const data = await api.listUsers().catch(() => api.getCompany());
    if (data && data.company) upsertOrg(data.company);
    if (!orgCache) throw new Error("No hay empresa en este servidor.");
    return orgCache;
  }
  async function pushOrg() {
    return orgCache;
  }

  function applyOrgToSettings(org, inspector) {
    const cur = (() => {
      try {
        return JSON.parse(localStorage.getItem(SETTINGS) || "{}");
      } catch (e) {
        return {};
      }
    })();
    const next = {
      company: org.company || "",
      rut: org.rut || "",
      branch: org.branch || "",
      inspector: inspector || cur.inspector || (org.admin && org.admin.name) || "",
      logo: org.logo || cur.logo || "",
    };
    localStorage.setItem(SETTINGS, JSON.stringify(next));
    return next;
  }

  function existingSettings() {
    try {
      return Object.assign(
        { company: "", rut: "", branch: "", inspector: "", logo: "" },
        JSON.parse(localStorage.getItem(SETTINGS) || "{}")
      );
    } catch (e) {
      return { company: "", rut: "", branch: "", inspector: "", logo: "" };
    }
  }

  function brandSvg(cls) {
    return (
      '<svg class="' +
      (cls || "brand-logo") +
      '" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">' +
      '<rect width="64" height="64" rx="16" fill="#1a2027"/>' +
      '<path d="M16 0h32a16 16 0 0 1 16 16v6H0V16A16 16 0 0 1 16 0z" fill="#f5c400"/>' +
      '<rect x="16.5" y="22" width="31" height="32" rx="4.5" fill="#fffef8"/>' +
      '<rect x="26" y="17.5" width="12" height="8" rx="2.2" fill="#f5c400"/>' +
      '<circle cx="44.5" cy="46.5" r="8.6" fill="#1b8f4e"/>' +
      '<path d="M40.2 46.6l2.8 2.9 6.2-7.2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>' +
      "</svg>"
    );
  }

  function photo(id, alt, cls) {
    return (
      '<img class="' +
      (cls || "") +
      '" src="' +
      eqSrc(id) +
      '" alt="' +
      escapeHtml(alt) +
      '" loading="lazy" onerror="window.mecImgFb&&window.mecImgFb(this)">'
    );
  }
  function step(id, num, title, text) {
    return (
      '<article class="lp-step">' +
      photo(id, title, "lp-step-img") +
      "<div><span class=\"lp-n\">Paso " +
      num +
      "</span><h3>" +
      escapeHtml(title) +
      "</h3><p>" +
      escapeHtml(text) +
      "</p></div></article>"
    );
  }

  function landingView() {
    const sess = loadSession();
    return (
      '<div class="lp">' +
      '<section class="lp-hero">' +
      '<div class="lp-hero-inner">' +
      brandSvg("lp-mark") +
      "<p class=\"lp-kicker\">Inspecciones en terreno</p>" +
      "<h1>Check list Técnico</h1>" +
      "<p class=\"lp-lead\">Elige el equipo, marca cada punto, saca fotos, firmen en el celular y sal con un <b>PDF carta</b> y un <b>QR</b> de la ficha.</p>" +
      '<div class="lp-cta">' +
      '<button class="btn" data-go="#/admin">Ingreso administrador</button>' +
      '<button class="btn ghost lp-cta-user" data-go="#/usuario">Ingreso usuarios</button>' +
      "</div>" +
      (sess && canInspect()
        ? '<button class="btn steel" data-go="#/app">Ir a mis inspecciones</button>'
        : sess && sess.status === "pending"
          ? '<p class="lp-wait">Tu solicitud sigue pendiente. El administrador de la empresa debe autorizarte.</p>'
          : "") +
      "</div></section>" +
      '<div class="lp-strip">' +
      photo("escalera-tijera", "Escalera tijera", "lp-strip-img") +
      photo("alza-hombre", "Alza hombre", "lp-strip-img") +
      photo("soldadora", "Soldadora", "lp-strip-img") +
      photo("extintor", "Extintor", "lp-strip-img") +
      photo("compresor", "Compresor", "lp-strip-img") +
      photo("arnes", "Arnés", "lp-strip-img") +
      "</div>" +
      '<div class="lp-body">' +
      "<h2>Qué hace la app</h2>" +
      '<p class="lp-intro">Es una bitácora de inspección para el celular. Sirve para el check del día en terreno: no reemplaza certificaciones ni fiscalizaciones oficiales.</p>' +
      "<h2>Cómo se usa</h2>" +
      '<div class="lp-steps">' +
      step("escalera-tijera", "1", "Elige el equipo", "Buscas en el catálogo (escalera, alza hombre, tecle, soldadora, EPP…) y abres el check de ese tipo.") +
      step("andamio", "2", "Marca cada punto", "OK, falla o no aplica. Si hay falla, escribes qué viste. No se puede guardar a medias.") +
      step("generador", "3", "Saca fotos", "Al final del listado abres la cámara y dejas al menos una foto real del equipo.") +
      step("eslingas", "4", "Firman en pantalla", "Inspector y supervisor firman con el dedo. El logo de la empresa va en la ficha.") +
      step("extintor", "5", "PDF carta y QR", "Exportas en formato carta (8,5 × 11) o compartes un QR para que otro celular vea la misma ficha.") +
      "</div>" +
      "<h2>Qué incluye</h2>" +
      '<div class="lp-features">' +
      '<article class="lp-card">' +
      photo("plataforma-tijera", "Plataforma tijera", "lp-card-img") +
      "<div><span class=\"lp-n\">01</span><h3>Catálogo de equipos</h3><p>Escaleras, alza hombre, tecle, soldadora, EPP y más. Cada tipo trae su foto y sus puntos de control.</p></div></article>" +
      '<article class="lp-card">' +
      photo("tecle-cadena", "Tecle de cadena", "lp-card-img") +
      "<div><span class=\"lp-n\">02</span><h3>Check punto a punto</h3><p>Marca OK, falla o N/A. Si hay falla, anotas el detalle. Todos los campos van obligatorios.</p></div></article>" +
      '<article class="lp-card">' +
      photo("camioneta", "Camioneta de servicio", "lp-card-img") +
      "<div><span class=\"lp-n\">03</span><h3>Fotos del equipo</h3><p>Al final del check sacas fotos con la cámara. Quedan en la ficha junto al logo de la empresa.</p></div></article>" +
      '<article class="lp-card">' +
      photo("epp", "Elementos de protección", "lp-card-img") +
      "<div><span class=\"lp-n\">04</span><h3>Firma, QR y PDF carta</h3><p>Firman inspector y supervisor en pantalla. Compartes la ficha con un QR o la exportas en formato carta (8,5 × 11).</p></div></article>" +
      "</div>" +
      "<h2>Cómo se entra</h2>" +
      '<div class="lp-access">' +
      '<div class="lp-access-col">' +
      "<h3>Administrador</h3>" +
      "<p>Registra la empresa (nombre, RUT, sucursal y logo). Recibe un <b>código de empresa</b> y autoriza a cada inspector.</p>" +
      '<ul><li>Crea la cuenta de la empresa</li><li>Comparte el código o el QR</li><li>Aprueba o rechaza solicitudes</li></ul>' +
      '<button class="btn" data-go="#/admin">Entrar como admin</button>' +
      "</div>" +
      '<div class="lp-access-col">' +
      "<h3>Usuarios</h3>" +
      "<p>Pides acceso con el código que te da tu empresa. <b>No entras al check hasta que el administrador te autorice.</b></p>" +
      '<ul><li>Solicitas acceso con tu nombre</li><li>Esperas la autorización</li><li>Haces inspecciones en tu celular</li></ul>' +
      '<button class="btn ghost" data-go="#/usuario">Entrar como usuario</button>' +
      "</div></div>" +
      '<p class="note">Las inspecciones de cada persona quedan en la memoria de <b>su</b> navegador. El registro de la empresa (quién está autorizado) se sincroniza cuando hay internet.</p>' +
      "</div></div>"
    );
  }

  function authShell(title, back, inner) {
    return (
      '<header class="top">' +
      '<button class="back" data-go="' +
      back +
      '" aria-label="Volver">←</button>' +
      "<div><h1>" +
      escapeHtml(title) +
      "</h1></div></header>" +
      '<div class="wrap">' +
      (authState.msg ? '<p class="banner-bad">' + escapeHtml(authState.msg) + "</p>" : "") +
      inner +
      "</div>"
    );
  }

  function tabs(base, entrar, registro) {
    const t = authState.tab;
    return (
      '<div class="auth-tabs">' +
      '<button type="button" class="' +
      (t === "entrar" ? "on" : "") +
      '" data-go="' +
      entrar +
      '">Entrar</button>' +
      '<button type="button" class="' +
      (t === "registro" ? "on" : "") +
      '" data-go="' +
      registro +
      '">Crear cuenta</button></div>'
    );
  }

  function adminView() {
    const t = authState.tab;
    const pre = existingSettings();
    if (t === "registro") {
      return authShell(
        "Administrador",
        "#/",
        tabs("#/admin", "#/admin", "#/admin/registro") +
          '<div class="card">' +
          "<p class=\"note\">Crea la empresa. Después autorizas a los inspectores que pidan acceso.</p>" +
          "<label>Nombre o razón social <span class=\"req\">*</span></label>" +
          '<input id="a-co" value="' +
          escapeHtml(pre.company) +
          '" autocomplete="organization">' +
          "<label>RUT <span class=\"req\">*</span></label>" +
          '<input id="a-rut" value="' +
          escapeHtml(pre.rut) +
          '">' +
          "<label>Sucursal / lugar <span class=\"req\">*</span></label>" +
          '<input id="a-br" value="' +
          escapeHtml(pre.branch) +
          '">' +
          "<label>Logo de la empresa <span class=\"req\">*</span></label>" +
          (authState.logo || pre.logo
            ? '<div class="logo-preview"><img src="' + (authState.logo || pre.logo) + '" alt="Logo"></div>'
            : '<p class="note">Obligatorio. Sale en el documento final.</p>') +
          '<label class="btn ghost">Cargar logo<input id="a-logo" type="file" accept="image/*" hidden></label>' +
          "<label>Tu nombre <span class=\"req\">*</span></label>" +
          '<input id="a-name" value="' +
          escapeHtml(pre.inspector) +
          '" autocomplete="name">' +
          "<label>Usuario <span class=\"req\">*</span></label>" +
          '<input id="a-user" autocomplete="username" autocapitalize="none">' +
          "<label>Clave <span class=\"req\">*</span></label>" +
          '<input id="a-pass" type="password" autocomplete="new-password">' +
          "<label>Repetir clave <span class=\"req\">*</span></label>" +
          '<input id="a-pass2" type="password" autocomplete="new-password">' +
          "</div>" +
          '<button class="btn" id="a-register">' +
          (authState.busy ? "Creando…" : "Registrar empresa") +
          "</button>"
      );
    }
    return authShell(
      "Administrador",
      "#/",
      tabs("#/admin", "#/admin", "#/admin/registro") +
        '<div class="card">' +
        "<p class=\"note\">Entra con el usuario de la empresa. Si es otro celular, pega el código de 6 letras.</p>" +
        "<label>Código de empresa</label>" +
        '<input id="a-invite" placeholder="Ej: K7M2PQ" autocapitalize="characters" autocomplete="off">' +
        "<label>Usuario <span class=\"req\">*</span></label>" +
        '<input id="a-user" autocomplete="username" autocapitalize="none">' +
        "<label>Clave <span class=\"req\">*</span></label>" +
        '<input id="a-pass" type="password" autocomplete="current-password">' +
        "</div>" +
        '<button class="btn" id="a-login">' +
        (authState.busy ? "Entrando…" : "Entrar") +
        "</button>" +
        '<p class="note">¿Primera vez? <a href="#/admin/registro">Registra la empresa</a>.</p>'
    );
  }

  function userView() {
    const sess = loadSession();
    if (sess && sess.role === "user" && sess.status === "pending") {
      return authShell(
        "Esperando autorización",
        "#/",
        '<div class="card">' +
          "<p>Hola <b>" +
          escapeHtml(sess.name) +
          "</b>. Tu solicitud para <b>" +
          escapeHtml(sess.companyCode) +
          "</b> está en revisión.</p>" +
          "<p class=\"note\">El administrador de tu empresa debe autorizarte en <b>Autorizar usuarios</b>.</p>" +
          '<button class="btn" id="u-refresh">' +
          (authState.busy ? "Consultando…" : "Ya me autorizaron — actualizar") +
          "</button>" +
          '<button class="btn ghost" id="logout" style="margin-top:8px">Salir</button>' +
          "</div>"
      );
    }
    const t = authState.tab;
    if (t === "registro") {
      return authShell(
        "Usuario",
        "#/",
        tabs("#/usuario", "#/usuario", "#/usuario/registro") +
          '<div class="card">' +
          "<p class=\"note\">Pide acceso con el código que te dio el administrador. No podrás inspeccionar hasta que te autorice.</p>" +
          "<label>Código de empresa <span class=\"req\">*</span></label>" +
          '<input id="u-invite" value="' +
          escapeHtml(authState.joinCode || (authState.joinBlob ? authState.joinBlob : "")) +
          '" placeholder="Código o QR de la empresa" autocapitalize="none">' +
          "<label>Tu nombre <span class=\"req\">*</span></label>" +
          '<input id="u-name" autocomplete="name">' +
          "<label>Usuario <span class=\"req\">*</span></label>" +
          '<input id="u-user" autocomplete="username" autocapitalize="none">' +
          "<label>Clave <span class=\"req\">*</span></label>" +
          '<input id="u-pass" type="password" autocomplete="new-password">' +
          "</div>" +
          '<button class="btn" id="u-register">' +
          (authState.busy ? "Enviando…" : "Solicitar acceso") +
          "</button>"
      );
    }
    return authShell(
      "Usuario",
      "#/",
      tabs("#/usuario", "#/usuario", "#/usuario/registro") +
        '<div class="card">' +
        "<label>Código de empresa <span class=\"req\">*</span></label>" +
        '<input id="u-invite" placeholder="El que te dio el admin" autocapitalize="none">' +
        "<label>Usuario <span class=\"req\">*</span></label>" +
        '<input id="u-user" autocomplete="username" autocapitalize="none">' +
        "<label>Clave <span class=\"req\">*</span></label>" +
        '<input id="u-pass" type="password" autocomplete="current-password">' +
        "</div>" +
        '<button class="btn" id="u-login">' +
        (authState.busy ? "Entrando…" : "Entrar") +
        "</button>" +
        '<p class="note">¿Todavía no te dan acceso? <a href="#/usuario/registro">Solicítalo aquí</a>.</p>'
    );
  }

  function teamView() {
    const sess = loadSession();
    const org = sess ? findLocalOrg(sess.companyCode || sess.blobId) : null;
    if (!org) {
      return authShell("Equipo", "#/app", '<p class="empty">No hay empresa en este celular.</p>');
    }
    const users = org.users || [];
    const pending = users.filter((u) => u.status === "pending");
    const ok = users.filter((u) => u.status === "approved");
    const no = users.filter((u) => u.status === "rejected");
    const invite = inviteOf(org);
    let inner =
      '<div class="card">' +
      "<p class=\"note\">Comparte este código o el QR. Cada inspector solicita acceso y tú lo autorizas.</p>" +
      '<div class="folio" id="org-code">' +
      escapeHtml(org.code) +
      "</div>" +
      '<p class="note">Código completo (cópialo si el usuario está en otro celular):</p>' +
      '<input id="org-invite" readonly value="' +
      escapeHtml(invite) +
      '">' +
      '<div class="qrbox" style="margin-top:12px"><div id="join-qr" data-join="' +
      escapeHtml(joinHref(org)) +
      '"></div></div>' +
      '<div class="actions"><button class="btn ghost" id="copy-invite">Copiar código</button>' +
      '<button class="btn ghost" id="team-refresh">Actualizar lista</button></div>' +
      "</div>" +
      "<h3 style=\"margin:4px 0 8px\">Pendientes (" +
      pending.length +
      ")</h3>";
    if (!pending.length) inner += '<p class="note">Nadie esperando autorización.</p>';
    pending.forEach((u) => {
      inner +=
        '<div class="card team-row"><b>' +
        escapeHtml(u.name) +
        "</b><div class=\"note\">@" +
        escapeHtml(u.user) +
        "</div>" +
        '<div class="actions" style="margin-top:8px">' +
        '<button class="btn" data-approve="' +
        escapeHtml(u.id) +
        '">Autorizar</button>' +
        '<button class="btn ghost" data-reject="' +
        escapeHtml(u.id) +
        '">Rechazar</button></div></div>';
    });
    inner += "<h3 style=\"margin:16px 0 8px\">Autorizados (" + ok.length + ")</h3>";
    if (!ok.length) inner += '<p class="note">Aún no hay inspectores autorizados.</p>';
    ok.forEach((u) => {
      inner +=
        '<div class="list-row" style="border:1px solid var(--line);border-radius:12px;padding:12px;margin-bottom:8px;display:flex">' +
        "<span style=\"flex:1\"><b>" +
        escapeHtml(u.name) +
        "</b><div class=\"note\">@" +
        escapeHtml(u.user) +
        '</div></span><button class="btn ghost" style="width:auto;padding:8px 12px" data-reject="' +
        escapeHtml(u.id) +
        '">Revocar</button></div>';
    });
    if (no.length) {
      inner += "<h3 style=\"margin:16px 0 8px\">Rechazados</h3>";
      no.forEach((u) => {
        inner +=
          '<p class="note">' +
          escapeHtml(u.name) +
          " · @" +
          escapeHtml(u.user) +
          ' <button class="btn ghost" style="width:auto;display:inline;padding:4px 8px" data-approve="' +
          escapeHtml(u.id) +
          '">Autorizar</button></p>';
      });
    }
    return authShell("Autorizar usuarios", "#/app", inner);
  }

  function val(id) {
    const el = document.getElementById(id);
    return el ? el.value : "";
  }

  async function registerAdmin() {
    authState.msg = "";
    const company = val("a-co").trim();
    const rut = val("a-rut").trim();
    const branch = val("a-br").trim();
    const name = val("a-name").trim();
    const user = val("a-user").trim().toLowerCase();
    const pass = val("a-pass");
    const pass2 = val("a-pass2");
    const logo = authState.logo || existingSettings().logo || "";
    if (blank(company) || blank(rut) || blank(branch) || blank(name) || blank(user) || blank(pass) || blank(logo)) {
      throw new Error("Completa empresa, RUT, sucursal, logo, tu nombre, usuario y clave.");
    }
    if (pass.length < 4) throw new Error("La clave debe tener al menos 4 caracteres.");
    if (pass !== pass2) throw new Error("Las claves no coinciden.");
    const data = await w.MEC_API.registerCompany({
      company: company,
      rut: rut,
      branch: branch,
      name: name,
      username: user,
      password: pass,
      logo: logo,
    });
    applyApiAuth(data);
    return data.company;
  }

  async function loginAdmin() {
    authState.msg = "";
    const invite = val("a-invite").trim();
    const user = val("a-user").trim().toLowerCase();
    const pass = val("a-pass");
    if (blank(user) || blank(pass)) throw new Error("Ingresa usuario y clave.");
    const data = await w.MEC_API.login({
      username: user,
      password: pass,
      companyCode: parseInvite(invite).code,
    });
    applyApiAuth(data);
    if (data.session && data.session.role !== "admin") {
      throw new Error("Esa cuenta no es de administrador. Entra por ingreso usuarios.");
    }
    return data.company;
  }

  async function registerUser() {
    authState.msg = "";
    const invite = val("u-invite").trim() || authState.joinBlob || authState.joinCode;
    const name = val("u-name").trim();
    const user = val("u-user").trim().toLowerCase();
    const pass = val("u-pass");
    if (blank(invite) || blank(name) || blank(user) || blank(pass)) {
      throw new Error("Completa código de empresa, nombre, usuario y clave.");
    }
    if (pass.length < 4) throw new Error("La clave debe tener al menos 4 caracteres.");
    const data = await w.MEC_API.requestAccess({
      invite: invite,
      companyCode: parseInvite(invite).code,
      name: name,
      username: user,
      password: pass,
    });
    applyApiAuth(data);
    return data.session;
  }

  async function loginUser() {
    authState.msg = "";
    const invite = val("u-invite").trim();
    const user = val("u-user").trim().toLowerCase();
    const pass = val("u-pass");
    if (blank(invite) || blank(user) || blank(pass)) throw new Error("Completa código, usuario y clave.");
    const data = await w.MEC_API.login({
      username: user,
      password: pass,
      companyCode: parseInvite(invite).code,
    });
    applyApiAuth(data);
    if (data.session && data.session.status === "rejected") throw new Error("El administrador rechazó tu acceso.");
    if (data.pending || (data.session && data.session.status !== "approved")) throw new Error("PENDING");
    return data.session;
  }

  async function refreshUser() {
    const data = await w.MEC_API.me();
    applyApiAuth(data);
    const rec = data.session || {};
    if (rec.status === "rejected") throw new Error("El administrador rechazó tu acceso.");
    return rec;
  }

  async function setUserStatus(userId, status) {
    const data = status === "approved" ? await w.MEC_API.approveUser(userId) : await w.MEC_API.rejectUser(userId);
    if (data.company) upsertOrg(data.company);
    return data.user;
  }

  w.MEC_AUTH = {
    authState: authState,
    loadSession: loadSession,
    saveSession: saveSession,
    clearSession: clearSession,
    isAdmin: isAdmin,
    canInspect: canInspect,
    findLocalOrg: findLocalOrg,
    inviteOf: inviteOf,
    landingView: landingView,
    adminView: adminView,
    userView: userView,
    teamView: teamView,
    registerAdmin: registerAdmin,
    loginAdmin: loginAdmin,
    registerUser: registerUser,
    loginUser: loginUser,
    refreshUser: refreshUser,
    setUserStatus: setUserStatus,
    applyOrgToSettings: applyOrgToSettings,
    applyApiAuth: applyApiAuth,
    pullOrg: pullOrg,
    pushOrg: pushOrg,
    val: val,
  };
})(window);
