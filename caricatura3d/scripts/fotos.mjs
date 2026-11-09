// Fotos sueltas de una composición, con un solo bundle y un solo navegador (adaptado de
// tutorial-caricatura/plantillas/scripts/fotos.mjs, MIT).
// Uso: node scripts/fotos.mjs <Composición> <prefijo_salida> <f1,f2,...> [escala]
import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [id, prefijo, cuadros, escala = "0.5"] = process.argv.slice(2);
function navegador() {
  if (process.env.REMOTION_CHROME) return process.env.REMOTION_CHROME;
  const base = "/opt/pw-browsers";
  if (!fs.existsSync(base)) return null;
  for (const d of fs.readdirSync(base).filter((x) => x.startsWith("chromium_headless_shell")).sort().reverse()) {
    const r = `${base}/${d}/chrome-headless-shell-linux64/chrome-headless-shell`;
    if (fs.existsSync(r)) return r;
  }
  return null;
}
const browserExecutable = navegador();
const chromiumOptions = { gl: process.env.REMOTION_GL ?? "swangle" };
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts"), publicDir: path.resolve("public") });
const puppeteerInstance = await openBrowser("chrome", { browserExecutable, chromiumOptions });
const composition = await selectComposition({ serveUrl, id, puppeteerInstance, browserExecutable, chromiumOptions });
const onBrowserLog = (l) => { if (l.type === "error") console.log("[error]", l.text.slice(0, 300)); };
fs.mkdirSync(path.dirname(prefijo), { recursive: true });
for (const f of cuadros.split(",").map(Number)) {
  const t0 = Date.now();
  await renderStill({ composition, serveUrl, frame: f, output: `${prefijo}${String(f).padStart(4, "0")}.jpg`, imageFormat: "jpeg", jpegQuality: 88, scale: Number(escala),
    puppeteerInstance, browserExecutable, chromiumOptions, timeoutInMilliseconds: 300000, onBrowserLog });
  console.log("foto", f, ((Date.now() - t0) / 1000).toFixed(1) + "s");
}
await puppeteerInstance.close({ silent: true });
