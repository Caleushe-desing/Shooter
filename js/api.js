/* Cliente HTTP de Check list Técnico → /api/v1 */
(function (w) {
  "use strict";

  function base() {
    if (typeof w.MEC_API_BASE === "string" && w.MEC_API_BASE) return w.MEC_API_BASE.replace(/\/$/, "");
    if (location.protocol === "http:" || location.protocol === "https:") return location.origin + "/api/v1";
    return "";
  }

  function available() {
    return !!base();
  }

  async function req(method, path, body) {
    const root = base();
    if (!root) throw new Error("Abre la app desde el servidor (no como archivo). Ej: http://IP:3000/");
    const opts = {
      method: method,
      credentials: "include",
      headers: { Accept: "application/json" },
    };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    let res;
    try {
      res = await fetch(root + path, opts);
    } catch (e) {
      throw new Error("No hay conexión con el servidor.");
    }
    let data = {};
    const text = await res.text();
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = { error: text.slice(0, 180) };
      }
    }
    if (!res.ok) {
      const err = new Error(data.error || "Error " + res.status);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  w.MEC_API = {
    available: available,
    base: base,
    health: () => req("GET", "/health"),
    registerCompany: (body) => req("POST", "/auth/register-company", body),
    login: (body) => req("POST", "/auth/login", body),
    logout: () => req("POST", "/auth/logout", {}),
    me: () => req("GET", "/auth/me"),
    requestAccess: (body) => req("POST", "/auth/request-access", body),
    getCompany: () => req("GET", "/auth/company"),
    patchCompany: (body) => req("PATCH", "/auth/company", body),
    listUsers: () => req("GET", "/auth/company/users"),
    approveUser: (id) => req("POST", "/auth/company/users/" + encodeURIComponent(id) + "/approve", {}),
    rejectUser: (id) => req("POST", "/auth/company/users/" + encodeURIComponent(id) + "/reject", {}),
    listInspections: () => req("GET", "/inspections"),
    getInspection: (id) => req("GET", "/inspections/" + encodeURIComponent(id)),
    saveInspection: (body) => req("POST", "/inspections", body),
    publicInspection: (token) => req("GET", "/public/inspections/" + encodeURIComponent(token)),
  };
})(window);
