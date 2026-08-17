#!/usr/bin/env python3
"""Build a self-contained index.html so GitHub HTML preview does not fetch extra JS/CSS."""
from pathlib import Path

root = Path(__file__).resolve().parents[1]
css = (root / "css/app.css").read_text(encoding="utf-8")
qr = (root / "js/qrcode.min.js").read_text(encoding="utf-8").split("//# sourceMappingURL")[0]
data = (root / "js/data.js").read_text(encoding="utf-8")
auth = (root / "js/auth.js").read_text(encoding="utf-8")
app = (root / "js/app.js").read_text(encoding="utf-8")
raw = "https://raw.githubusercontent.com/Caleushe-desing/Shooter/cursor/checklist-mecanica-9fc5/"

def pack_js(src: str) -> str:
    return src.replace("</script>", "<\\/script>")

html = f"""<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover">
  <title>Check list Técnico — Inspecciones</title>
  <meta name="theme-color" content="#2c333d">
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'%3E%3Crect width='64' height='64' rx='16' fill='%231a2027'/%3E%3Cpath d='M16 0h32a16 16 0 0 1 16 16v6H0V16A16 16 0 0 1 16 0z' fill='%23f5c400'/%3E%3C/svg%3E">
  <style>
{css}
  </style>
</head>
<body>
  <div id="app">
    <div class="boot">
      <svg class="boot-logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" aria-hidden="true">
        <rect width="64" height="64" rx="16" fill="#1a2027"/>
        <path d="M16 0h32a16 16 0 0 1 16 16v6H0V16A16 16 0 0 1 16 0z" fill="#f5c400"/>
        <rect x="16.5" y="22" width="31" height="32" rx="4.5" fill="#fffef8"/>
        <rect x="26" y="17.5" width="12" height="8" rx="2.2" fill="#f5c400"/>
        <circle cx="44.5" cy="46.5" r="8.6" fill="#1b8f4e"/>
        <path d="M40.2 46.6l2.8 2.9 6.2-7.2" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/>
      </svg>
      <h1>Check list Técnico</h1>
      <p>Cargando inspecciones…</p>
    </div>
  </div>
  <noscript>
    <p style="padding:24px">Activa JavaScript para usar Check list Técnico.</p>
  </noscript>
  <script>
    window.MEC_CDN = {raw!r};
    (function () {{
      var h = location.hostname || "";
      var local = h === "localhost" || h === "127.0.0.1";
      var pages = /\\.github\\.io$/i.test(h) && !/html-?preview/i.test(h);
      window.MEC_ASSET_BASE = local || pages ? "" : window.MEC_CDN;
    }})();
  </script>
  <script>
{pack_js(qr)}
  </script>
  <script>
{pack_js(data)}
  </script>
  <script>
{pack_js(auth)}
  </script>
  <script>
{pack_js(app)}
  </script>
</body>
</html>
"""
(root / "index.html").write_text(html, encoding="utf-8")
print("wrote", root / "index.html", "bytes", (root / "index.html").stat().st_size)
