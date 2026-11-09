import fs from "node:fs";
import { Config } from "@remotion/cli/config";

// Sin tarjeta gráfica (como en la nube), el 3D se dibuja por software con "swangle".
// En un ordenador con GPU puedes poner REMOTION_GL=angle para que vaya más rápido.
type Gl = "swangle" | "angle" | "egl" | "swiftshader" | "vulkan" | "angle-egl";
Config.setChromiumOpenGlRenderer((process.env.REMOTION_GL as Gl | undefined) ?? "swangle");

// Remotion descarga su propio navegador. Si no puede (como en la nube de Claude Code),
// usa uno ya instalado: el de REMOTION_CHROME o el que trae Playwright en /opt/pw-browsers.
function buscarNavegador(): string | null {
  if (process.env.REMOTION_CHROME) return process.env.REMOTION_CHROME;
  const base = "/opt/pw-browsers";
  if (!fs.existsSync(base)) return null;
  for (const dir of fs.readdirSync(base).filter((d) => d.startsWith("chromium_headless_shell")).sort().reverse()) {
    const ruta = `${base}/${dir}/chrome-headless-shell-linux64/chrome-headless-shell`;
    if (fs.existsSync(ruta)) return ruta;
  }
  return null;
}
const navegador = buscarNavegador();
if (navegador) Config.setBrowserExecutable(navegador);

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
