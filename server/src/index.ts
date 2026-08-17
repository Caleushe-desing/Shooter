import { PORT, SESSION_SECRET } from "./config.js";
import { createApp } from "./app.js";

if (!SESSION_SECRET || SESSION_SECRET === "cambia-esta-clave-larga") {
  console.warn("Aviso: define SESSION_SECRET en server/.env (clave larga y única).");
}

const app = createApp();
app.listen(PORT, "0.0.0.0", () => {
  console.log("Check list Técnico → http://127.0.0.1:" + PORT);
});
