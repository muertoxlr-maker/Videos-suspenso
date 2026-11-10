// Escenario de «Gasolinera de la carretera» con el nivel de detalle del estándar §8.4.
// Medidas en metros. La tienda ocupa x ∈ [-4.5, 4.5], z ∈ [-7, 0] y su fachada de vidrio mira hacia +z.
// Entre la tienda y el techo de las bombas queda un carril (z ≈ 0.4–2.9) donde se detiene el tráiler.
// El techo de las bombas va de z = 2 a 10; la carretera corre a lo largo de x entre z = 14 y 21.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor, texTexto } from "../turno3/comun";

export const TIENDA = { x0: -4.5, x1: 4.5, z0: -7, alto: 3.2 };
export const VENTANILLA = { x: -1.5, y: 1.35 }; // centro del vidrio de la ventanilla (en la fachada, z = 0)
export const PUERTA = { x: 2.5, ancho: 1.0, alto: 2.2 };
export const TECHO = { x: 6, z0: 2, z1: 10, alto: 4.6 };
export const BOMBAS_X = [-2.2, 2.2];
export const BOMBAS_Z = 6;
export const CARRETERA = { z0: 14, z1: 21 };

const vidrio = (op = 0.1) => new THREE.MeshBasicMaterial({ color: "#a9c7d6", transparent: true, opacity: op, depthWrite: false, side: THREE.DoubleSide });
const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
export const halo = (r: number, g: number, b: number, w: number, h: number, op = 0.5, niebla = true) => {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op, fog: niebla }));
  m.layers.set(NOINK); return m;
};

// ------------------------------------------------------------------ texturas pintadas
const texConcreto = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#8a8880"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 120; i++) { g.fillStyle = `rgba(${i % 2 ? "60,58,52" : "150,148,140"},0.18)`; g.fillRect((i * 53) % w, (i * 31) % h, 5 + (i % 4) * 4, 3 + (i % 3) * 2); }
  g.strokeStyle = "#6c6a63"; g.lineWidth = 4; g.strokeRect(0, 0, w, h); // juntas de las losas
  g.fillStyle = "rgba(40,36,30,0.25)"; g.beginPath(); g.ellipse(w * 0.6, h * 0.4, 40, 22, 0.4, 0, 7); g.fill(); // mancha de aceite
}, 256, 256, rep);
const texAsfalto = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#2c2c2e"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 200; i++) { g.fillStyle = `rgba(${i % 2 ? "15,15,16" : "70,70,72"},0.25)`; g.fillRect((i * 37) % w, (i * 71) % h, 3, 3); }
}, 128, 128, rep);
const texCarretera = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#28282a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${i % 2 ? "14,14,15" : "66,66,68"},0.25)`; g.fillRect((i * 41) % w, (i * 67) % h, 3, 3); }
  g.fillStyle = "#e8e4d8"; g.fillRect(0, h * 0.04, w, h * 0.025); g.fillRect(0, h * 0.935, w, h * 0.025); // orillas blancas
  g.fillStyle = "#d9b21e"; g.fillRect(0, h * 0.49, w * 0.55, h * 0.025); // raya central discontinua
}, 256, 256, rep);
const texAzulejo = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#cfcbc0"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#a9a59a"; g.lineWidth = 3; g.strokeRect(0, 0, w, h);
  g.fillStyle = "rgba(90,85,75,0.1)"; g.fillRect(w * 0.2, h * 0.3, 20, 10);
}, 64, 64, rep);
const texPared = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#d8d2c2"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#b83a2c"; g.fillRect(0, h * 0.78, w, h * 0.06); // franja roja de la marca
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(120,110,90,0.08)"; g.fillRect((i * 47) % w, (i * 29) % h, 12, 6); }
}, 128, 128, rep);
const texFranjaTecho = () => lienzo((g, w, h) => {
  g.fillStyle = "#f2efe6"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#b83a2c"; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = "#b83a2c"; g.font = "bold 150px 'DejaVu Sans', sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("SERVI 214", w / 2, h * 0.33);
}, 1024, 256);
const texProductos = (semilla: number) => lienzo((g, w, h) => {
  g.fillStyle = "#3a3632"; g.fillRect(0, 0, w, h);
  const cols = ["#c0392b", "#e0a526", "#2e7bbf", "#3d9b56", "#e6e1d3", "#8e44ad", "#d35400"];
  for (let fila = 0; fila < 4; fila++) for (let i = 0; i < 12; i++) {
    const c = cols[(i * 3 + fila * 5 + semilla) % cols.length], x = i * (w / 12) + 3, y = fila * (h / 4) + 8, ww = w / 12 - 6, hh = h / 4 - 14;
    g.fillStyle = c; g.fillRect(x, y + (i % 3) * 3, ww, hh - (i % 3) * 3); g.fillStyle = "rgba(255,255,255,0.35)"; g.fillRect(x + 3, y + hh * 0.3, ww - 6, 6);
  }
}, 512, 256);
const texRefri = () => lienzo((g, w, h) => {
  g.fillStyle = "#1c2830"; g.fillRect(0, 0, w, h);
  const cols = ["#c0392b", "#2e7bbf", "#3d9b56", "#e0a526", "#e6e1d3"];
  for (let fila = 0; fila < 5; fila++) for (let i = 0; i < 10; i++) { g.fillStyle = cols[(i + fila * 2) % cols.length]; g.fillRect(i * (w / 10) + 6, fila * (h / 5) + 20, w / 10 - 12, h / 5 - 26); }
  g.strokeStyle = "#9aa8b0"; g.lineWidth = 6; for (let i = 0; i <= 3; i++) { g.beginPath(); g.moveTo(i * w / 3, 0); g.lineTo(i * w / 3, h); g.stroke(); }
}, 512, 512);
/** Libreta abierta con las reglas escritas a mano por el encargado. */
const texLibreta = () => lienzo((g, w, h) => {
  g.fillStyle = "#efe8d2"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "rgba(90,120,170,0.45)"; g.lineWidth = 2; for (let y = 70; y < h; y += 34) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
  g.strokeStyle = "rgba(200,70,70,0.5)"; g.beginPath(); g.moveTo(w * 0.07, 0); g.lineTo(w * 0.07, h); g.moveTo(w * 0.57, 0); g.lineTo(w * 0.57, h); g.stroke();
  g.fillStyle = "rgba(60,50,40,0.35)"; g.fillRect(w / 2 - 4, 0, 8, h); // lomo
  g.fillStyle = "#1d2a5a"; g.font = "italic bold 30px 'DejaVu Sans', sans-serif";
  const L = (t: string, x: number, y: number) => g.fillText(t, x, y);
  L("TURNO DE NOCHE", w * 0.1, 58);
  g.font = "italic 25px 'DejaVu Sans', sans-serif";
  ["1. Después de las 12,", "   la puerta CERRADA.", "   Solo ventanilla.", "", "2. Si llega alguien", "   caminando, NO le", "   vendas nada."].forEach((t, i) => L(t, w * 0.09, 98 + i * 34));
  ["3. Las luces del techo", "   NUNCA se apagan.", "", "Lo que baja del monte", "no cruza la luz."].forEach((t, i) => L(t, w * 0.59, 98 + i * 34));
  g.font = "italic bold 30px 'DejaVu Sans', sans-serif"; L("NO ABRAS.", w * 0.62, 98 + 6 * 34); g.lineWidth = 3; g.strokeStyle = "#1d2a5a"; g.beginPath(); g.moveTo(w * 0.62, 98 + 6 * 34 + 8); g.lineTo(w * 0.88, 98 + 6 * 34 + 8); g.stroke();
}, 1024, 400);

// ------------------------------------------------------------------ vehículos
const rueda = (x: number, y: number, z: number, r: number) => {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.26, 18), lambert({ color: "#16161a" }));
  m.rotation.x = Math.PI / 2; m.position.set(x, y, z); return m;
};
/** Auto sencillo orientado hacia +x (frente en x = +2.1). */
export function carro(color: string) {
  const g = new THREE.Group();
  const m = lambert({ color }), oscuro = lambert({ color: "#1a1e24" });
  g.add(caja(4.2, 0.7, 1.8, m, 0, 0.6, 0), caja(2.2, 0.55, 1.62, oscuro, -0.3, 1.22, 0), caja(2.0, 0.08, 1.6, m, -0.3, 1.52, 0));
  for (const x of [-1.35, 1.35]) for (const z of [-0.85, 0.85]) g.add(rueda(x, 0.34, z, 0.34));
  const faros: THREE.Mesh[] = [], calaveras: THREE.Mesh[] = [];
  for (const z of [-0.65, 0.65]) {
    const f = caja(0.05, 0.14, 0.3, brillo("#fff4d6"), 2.11, 0.72, z); f.layers.set(NOINK); g.add(f); faros.push(f);
    const c = caja(0.05, 0.14, 0.3, brillo("#d42a1e"), -2.11, 0.72, z); c.layers.set(NOINK); g.add(c); calaveras.push(c);
  }
  return { g, faros, calaveras };
}
/** Tráiler hacia +x: cabina (frente en x = 0) y caja larga detrás. El chofer va del lado −z (el de la tienda). */
function trailer() {
  const g = new THREE.Group();
  const rojo = lambert({ color: "#8f2a22" }), gris = lambert({ color: "#bdbab0" }), oscuro = lambert({ color: "#1a1e24" }), interior = lambert({ color: "#2a2422" });
  // cabina x ∈ [-2.6, 0], y ∈ [0.8, 2.9], z ∈ [-1.25, 1.25]: parte baja maciza y parte alta hueca con ventana del lado −z
  g.add(caja(2.6, 1.0, 2.5, rojo, -1.3, 1.3, 0));
  g.add(caja(2.6, 0.08, 2.5, rojo, -1.3, 2.86, 0)); // techo
  g.add(caja(0.06, 1.1, 2.5, interior, -2.57, 2.35, 0)); // pared de atrás
  g.add(caja(2.6, 1.1, 0.06, rojo, -1.3, 2.35, 1.22)); // lado +z
  g.add(caja(0.05, 0.9, 2.3, oscuro, -0.02, 2.3, 0)); // parabrisas
  // lado −z con hueco de ventana (x ∈ [-1.5, -0.6], y ∈ [1.9, 2.6])
  g.add(caja(1.1, 1.1, 0.06, rojo, -2.05, 2.35, -1.22), caja(0.6, 1.1, 0.06, rojo, -0.3, 2.35, -1.22));
  g.add(caja(0.9, 0.1, 0.06, rojo, -1.05, 1.85, -1.22), caja(0.9, 0.3, 0.06, rojo, -1.05, 2.75, -1.22));
  g.add(caja(0.92, 0.04, 0.1, lambert({ color: "#c9ccc6" }), -1.05, 1.9, -1.24)); // marco
  g.add(caja(1.0, 2.5, 2.5, rojo, -3.1, 2.05, 0)); // dormitorio
  g.add(caja(0.08, 1.0, 1.0, lambert({ color: "#9a9a96" }), 0.05, 1.3, 0)); // parrilla
  const luzCabina = new THREE.PointLight("#ffd9a0", 0.6, 2.2, 1.5); luzCabina.position.set(-1.2, 2.6, -0.3); g.add(luzCabina);
  g.add(caja(12.5, 3.0, 2.5, gris, -10.0, 2.4, 0)); // caja
  g.add(caja(12.5, 0.3, 2.5, lambert({ color: "#b83a2c" }), -10.0, 1.1, 0));
  for (const x of [-0.8, -2.6, -12.9, -14.6]) for (const z of [-1.0, 1.0]) g.add(rueda(x, 0.5, z, 0.5));
  const faros: THREE.Mesh[] = [];
  for (const z of [-0.95, 0.95]) { const f = caja(0.06, 0.22, 0.35, brillo("#fff4d6"), 0.06, 0.95, z); f.layers.set(NOINK); g.add(f); faros.push(f); }
  const calaveras: THREE.Mesh[] = [];
  for (const z of [-1.0, 1.0]) { const c = caja(0.06, 0.2, 0.35, brillo("#e0301e"), -16.26, 1.0, z); c.layers.set(NOINK); g.add(c); calaveras.push(c); }
  const haloF = halo(255, 240, 210, 3.5, 3.5, 0.45); haloF.rotation.y = Math.PI / 2; haloF.position.set(0.3, 0.95, 0); g.add(haloF);
  const haloC = halo(255, 60, 40, 2.6, 1.6, 0.5); haloC.rotation.y = -Math.PI / 2; haloC.position.set(-16.4, 1.0, 0); g.add(haloC);
  const luz = new THREE.PointLight("#fff0d0", 2.5, 14, 1.5); luz.position.set(2.5, 1.2, 0); g.add(luz);
  return { g, faros, calaveras, haloF, haloC, luz };
}

// ------------------------------------------------------------------ escenario
export function crearGasolinera() {
  const raiz = new THREE.Group();

  // ---- suelo: asfalto, losas de concreto bajo el techo, carretera ----
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(240, 240), lambert({ map: texAsfalto([60, 60]) })); suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, -0.02, 0); raiz.add(suelo);
  const losas = new THREE.Mesh(new THREE.PlaneGeometry(18, 12.5), lambert({ map: texConcreto([6, 4.15]) })); losas.rotation.x = -Math.PI / 2; losas.position.set(0, 0.0, 6.25); raiz.add(losas);
  const camino = new THREE.Mesh(new THREE.PlaneGeometry(240, CARRETERA.z1 - CARRETERA.z0), lambert({ map: texCarretera([40, 1]) })); camino.rotation.x = -Math.PI / 2; camino.position.set(0, 0.016, (CARRETERA.z0 + CARRETERA.z1) / 2); raiz.add(camino);
  const tierra = lambert({ color: "#3a3226" });
  for (const z of [CARRETERA.z0 - 0.6, CARRETERA.z1 + 0.6]) { const t = new THREE.Mesh(new THREE.PlaneGeometry(240, 1.2), tierra); t.rotation.x = -Math.PI / 2; t.position.set(0, 0.008, z); raiz.add(t); }
  // banqueta de la tienda
  raiz.add(caja(10, 0.15, 0.4, lambert({ color: "#9b988e" }), 0, 0.075, 0.2));

  // ---- tienda ----
  const tienda = new THREE.Group(); raiz.add(tienda);
  const { x0, x1, z0, alto } = TIENDA, ancho = x1 - x0, fondo = -z0;
  const mPared = lambert({ map: texPared([3, 1]) }), mExt = lambert({ color: "#e6e0d0" }), mMarco = lambert({ color: "#3a3e44" });
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(ancho, fondo), lambert({ map: texAzulejo([ancho / 0.5, fondo / 0.5]) })); piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0.01, z0 / 2); tienda.add(piso);
  tienda.add(caja(ancho, 0.1, fondo, lambert({ color: "#e2ddd0" }), 0, alto, z0 / 2)); // plafón
  tienda.add(caja(0.15, alto, fondo, mPared, x0, alto / 2, z0 / 2), caja(0.15, alto, fondo, mPared, x1, alto / 2, z0 / 2), caja(ancho, alto, 0.15, mPared, 0, alto / 2, z0));
  // fachada: murete, vidrio, marquesina con letrero
  // murete y riel bajo el vidrio, en dos tramos: el hueco de la puerta llega hasta el piso
  const hueco = [PUERTA.x - PUERTA.ancho / 2 - 0.05, PUERTA.x + PUERTA.ancho / 2 + 0.05];
  const tramos: [number, number][] = [[x0, hueco[0]], [hueco[1], x1]];
  for (const [a, b] of tramos) tienda.add(caja(b - a, 0.9, 0.12, mExt, (a + b) / 2, 0.45, 0));
  tienda.add(caja(ancho + 0.4, 0.6, 0.3, lambert({ color: "#b83a2c" }), 0, alto - 0.1, 0.1));
  const letrero = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.42), new THREE.MeshLambertMaterial({ map: texTexto("TIENDA · 24 H", "#b83a2c", "#ffffff", 768, 96), emissive: "#ffffff", emissiveMap: texTexto("TIENDA · 24 H", "#b83a2c", "#ffffff", 768, 96), emissiveIntensity: 0.6 }));
  letrero.position.set(-0.8, alto - 0.1, 0.26); tienda.add(letrero);
  const vidrios: THREE.Mesh[] = [];
  const pano = (xa: number, xb: number, ya: number, yb: number) => { const v = new THREE.Mesh(new THREE.PlaneGeometry(xb - xa, yb - ya), vidrio()); v.position.set((xa + xb) / 2, (ya + yb) / 2, 0); v.layers.set(NOINK); tienda.add(v); vidrios.push(v); };
  // paneles entre montantes (huecos para la ventanilla y la puerta)
  const VX = VENTANILLA.x, PX = PUERTA.x, pa = PUERTA.ancho / 2;
  pano(x0, VX - 0.45, 0.9, 2.75); pano(VX + 0.45, PX - pa - 0.05, 0.9, 2.75); pano(PX + pa + 0.05, x1, 0.9, 2.75);
  pano(VX - 0.45, VX + 0.45, 1.8, 2.75); // sobre la ventanilla
  for (const x of [x0, -3.2, VX - 0.45, VX + 0.45, 0.4, PX - pa - 0.05, PX + pa + 0.05, x1]) tienda.add(caja(0.08, 1.85, 0.12, mMarco, x, 1.825, 0));
  tienda.add(caja(ancho, 0.08, 0.12, mMarco, 0, 2.75, 0));
  for (const [a, b] of tramos) tienda.add(caja(b - a, 0.06, 0.14, mMarco, (a + b) / 2, 0.92, 0));
  for (const x of [hueco[0], hueco[1]]) tienda.add(caja(0.1, 0.92, 0.15, mMarco, x, 0.46, 0)); // montantes de la puerta hasta el piso
  // ventanilla de despacho: marco, vidrio propio (se empaña), charola de metal
  tienda.add(caja(0.98, 0.06, 0.16, mMarco, VX, 0.95, 0), caja(0.98, 0.06, 0.16, mMarco, VX, 1.77, 0));
  const vidrioVent = new THREE.Mesh(new THREE.PlaneGeometry(0.82, 0.76), vidrio(0.13)); vidrioVent.position.set(VX, 1.36, 0); vidrioVent.layers.set(NOINK); tienda.add(vidrioVent);
  tienda.add(caja(0.6, 0.04, 0.55, lambert({ color: "#a7aaa8" }), VX, 1.075, -0.075)); // charola que atraviesa la pared (afuera solo sale 20 cm: no choca con el niño)
  tienda.add(caja(0.6, 0.08, 0.04, lambert({ color: "#8a8d8c" }), VX, 1.12, 0.18)); // borde de la charola
  tienda.add(caja(0.26, 0.26, 0.02, lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#c9c2a8"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2a2a"; c.font = "bold 20px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("PAGUE", w / 2, 50); c.fillText("AQUÍ", w / 2, 78); c.beginPath(); c.moveTo(w / 2 - 20, 92); c.lineTo(w / 2 + 20, 92); c.lineTo(w / 2, 112); c.fill(); }, 128, 128) }), VX + 0.62, 1.55, 0.07));
  // empañado del vidrio de la ventanilla (lado de adentro) y vaho del aliento
  const empanado = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.74), new THREE.MeshBasicMaterial({ map: resplandor(235, 242, 248), transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  empanado.position.set(VX + 0.05, 1.42, -0.015); empanado.rotation.y = Math.PI; empanado.layers.set(NOINK); tienda.add(empanado);
  const vaho = halo(235, 242, 248, 0.32, 0.22, 0); vaho.position.set(VX, 1.45, -0.35); tienda.add(vaho);
  // puerta de vidrio con su chapa y el letrero ABIERTO / CERRADO
  const puerta = new THREE.Group(); puerta.position.set(PX, 0, 0); tienda.add(puerta);
  puerta.add(caja(PUERTA.ancho, 0.08, 0.08, mMarco, 0, PUERTA.alto, 0), caja(PUERTA.ancho, 0.1, 0.08, mMarco, 0, 0.05, 0));
  for (const s of [-1, 1]) puerta.add(caja(0.07, PUERTA.alto, 0.08, mMarco, s * (pa - 0.035), PUERTA.alto / 2, 0));
  const vp = new THREE.Mesh(new THREE.PlaneGeometry(PUERTA.ancho - 0.1, PUERTA.alto - 0.15), vidrio()); vp.position.set(0, PUERTA.alto / 2, 0); vp.layers.set(NOINK); puerta.add(vp);
  puerta.add(caja(0.04, 0.5, 0.06, lambert({ color: "#c9ccc6" }), -pa + 0.14, 1.05, 0.08), caja(0.04, 0.5, 0.06, lambert({ color: "#c9ccc6" }), -pa + 0.14, 1.05, -0.08)); // jaladeras
  const chapa = new THREE.Group(); chapa.position.set(-pa + 0.14, 0.82, -0.06); puerta.add(chapa);
  chapa.add(caja(0.08, 0.12, 0.03, lambert({ color: "#b8a86a" }), 0, 0, 0));
  const pestillo = caja(0.05, 0.016, 0.03, lambert({ color: "#3a3226" }), 0, 0, -0.025); chapa.add(pestillo);
  const texCartel = (t: string, fondo: string) => texTexto(t, fondo, "#ffffff", 256, 96);
  const abierto = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: texCartel("ABIERTO", "#2e8b57"), side: THREE.DoubleSide, toneMapped: false }));
  abierto.position.set(0, 1.86, 0.03); puerta.add(abierto);
  const cerrado = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.16), new THREE.MeshBasicMaterial({ map: texCartel("CERRADO", "#c0392b"), side: THREE.DoubleSide, toneMapped: false }));
  cerrado.position.set(0, 1.86, 0.03); cerrado.visible = false; puerta.add(cerrado);
  // mostrador junto a la fachada, caja registradora, cafetera, libreta
  const mMostrador = lambert({ color: "#7a4e34" });
  tienda.add(caja(3.0, 1.0, 0.6, mMostrador, -1.9, 0.5, -0.42), caja(3.1, 0.05, 0.68, lambert({ color: "#d8d2c4" }), -1.9, 1.02, -0.42));
  tienda.add(caja(0.6, 1.0, 1.6, mMostrador, -3.6, 0.5, -1.4), caja(0.68, 0.05, 1.68, lambert({ color: "#d8d2c4" }), -3.6, 1.02, -1.4));
  const registradora = new THREE.Group(); registradora.position.set(-2.55, 1.05, -0.5); tienda.add(registradora);
  registradora.add(caja(0.42, 0.14, 0.38, lambert({ color: "#2c2f34" }), 0, 0.07, 0), caja(0.36, 0.24, 0.05, lambert({ color: "#2c2f34" }), 0, 0.3, -0.12));
  const pantalla = caja(0.3, 0.17, 0.01, brillo("#56d38a"), 0, 0.31, -0.09); pantalla.layers.set(NOINK); registradora.add(pantalla);
  const cafetera = new THREE.Group(); cafetera.position.set(-3.6, 1.05, -1.9); tienda.add(cafetera);
  cafetera.add(caja(0.4, 0.55, 0.36, lambert({ color: "#2a2a2e" }), 0, 0.27, 0), caja(0.16, 0.14, 0.16, lambert({ color: "#5a3a24" }), 0, 0.08, 0.12));
  const foco = caja(0.04, 0.04, 0.01, brillo("#ff3a26"), 0.12, 0.45, 0.185); foco.layers.set(NOINK); cafetera.add(foco);
  for (let i = 0; i < 4; i++) tienda.add(caja(0.08, 0.1, 0.08, lambert({ color: "#e8e2d0" }), -3.75 + i * 0.1, 1.1, -1.2)); // vasos
  const libreta = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.2), lambert({ map: texLibreta() }));
  libreta.rotation.x = -Math.PI / 2; libreta.rotation.z = Math.PI + 0.12; libreta.position.set(-1.75, 1.062, -0.5); tienda.add(libreta);
  tienda.add(caja(0.52, 0.01, 0.22, lambert({ color: "#24365e" }), -1.75, 1.05, -0.5)); // pasta azul
  const pluma = caja(0.14, 0.012, 0.012, lambert({ color: "#1d2a5a" }), -1.42, 1.055, -0.42); pluma.rotation.y = 0.5; tienda.add(pluma);
  // repisa detrás del mostrador (cigarros, aceites), anaqueles y refrigeradores
  tienda.add(caja(2.4, 1.6, 0.35, lambert({ color: "#5a4030" }), -2.0, 1.4, -2.3));
  const repisaFrente = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.5), lambert({ map: texProductos(2) })); repisaFrente.position.set(-2.0, 1.4, -2.12); tienda.add(repisaFrente);
  for (const [x, z, s] of [[1.6, -2.6, 0], [1.6, -4.4, 3]] as [number, number, number][]) {
    tienda.add(caja(3.0, 1.5, 0.7, lambert({ color: "#9aa0a2" }), x, 0.75, z));
    for (const lado of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.9, 1.3), lambert({ map: texProductos(s + (lado > 0 ? 1 : 0)) })); p.position.set(x, 0.78, z + lado * 0.36); if (lado < 0) p.rotation.y = Math.PI; tienda.add(p); }
  }
  const refri = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 2.1), new THREE.MeshLambertMaterial({ map: texRefri(), emissive: "#ffffff", emissiveMap: texRefri(), emissiveIntensity: 0.55 }));
  refri.position.set(1.8, 1.15, z0 + 0.4); tienda.add(refri); tienda.add(caja(4.6, 2.4, 0.4, lambert({ color: "#c9ccc6" }), 1.8, 1.2, z0 + 0.15));
  // lámparas del plafón
  const tubos: THREE.Mesh[] = [];
  for (const [x, z] of [[-2.2, -1.2], [1.6, -1.6], [-2.2, -4.2], [1.6, -4.8]]) { const t = caja(1.3, 0.04, 0.18, brillo("#fbf6e8"), x, alto - 0.04, z); t.layers.set(NOINK); tienda.add(t); tubos.push(t); }
  const lucesTienda = [new THREE.PointLight("#fbf2dc", 2.2, 9, 1.4), new THREE.PointLight("#fbf2dc", 1.8, 9, 1.4)];
  lucesTienda[0].position.set(-2.0, 2.8, -1.4); lucesTienda[1].position.set(1.6, 2.8, -3.5); lucesTienda.forEach((l) => tienda.add(l));
  const luzRefri = new THREE.PointLight("#bfe4ff", 0.8, 4, 1.5); luzRefri.position.set(1.8, 1.4, z0 + 1.3); tienda.add(luzRefri);
  // por fuera: botes de basura, máquina de hielo, cubeta con limpiavidrios
  raiz.add(caja(1.2, 1.1, 0.7, lambert({ color: "#e9ecee" }), 3.7, 0.55, 0.55), caja(1.16, 0.25, 0.04, lambert({ map: texTexto("HIELO", "#2e7bbf", "#ffffff", 256, 64) }), 3.7, 0.85, 0.91));
  raiz.add(caja(0.5, 0.9, 0.5, lambert({ color: "#3a5a3a" }), -3.9, 0.45, 0.6));

  // ---- techo de las bombas ----
  const techo = new THREE.Group(); raiz.add(techo);
  const tz = (TECHO.z0 + TECHO.z1) / 2, tl = TECHO.z1 - TECHO.z0;
  techo.add(caja(2 * TECHO.x, 0.5, tl, lambert({ color: "#d9d5ca" }), 0, TECHO.alto + 0.25, tz));
  const franjaTex = texFranjaTecho();
  for (const s of [-1, 1]) { const fr = new THREE.Mesh(new THREE.PlaneGeometry(2 * TECHO.x, 0.55), new THREE.MeshLambertMaterial({ map: franjaTex, emissive: "#ffffff", emissiveMap: franjaTex, emissiveIntensity: 0.35 })); fr.position.set(0, TECHO.alto + 0.25, s > 0 ? TECHO.z1 + 0.01 : TECHO.z0 - 0.01); if (s < 0) fr.rotation.y = Math.PI; techo.add(fr); }
  for (const x of [-3.6, 3.6]) for (const z of [3.6, 8.4]) techo.add(caja(0.4, TECHO.alto, 0.4, lambert({ color: "#e6e2d6" }), x, TECHO.alto / 2, z));
  const paneles: THREE.Mesh[] = [];
  for (const x of [-4, 0, 4]) for (const z of [3.5, 6, 8.5]) { const p = caja(1.4, 0.03, 0.8, brillo("#f4f8ff"), x, TECHO.alto - 0.01, z); p.layers.set(NOINK); techo.add(p); paneles.push(p); }
  const lucesTecho = [[-3.5, 4], [3.5, 4], [-3.5, 8], [3.5, 8]].map(([x, z]) => { const l = new THREE.PointLight("#eef4ff", 3.6, 15, 1.2); l.position.set(x, TECHO.alto - 0.4, z); techo.add(l); return l; });
  // bombas
  const bombas = new THREE.Group(); raiz.add(bombas);
  for (const x of BOMBAS_X) {
    bombas.add(caja(0.9, 0.22, 2.6, lambert({ color: "#c9c5b8" }), x, 0.11, BOMBAS_Z));
    bombas.add(caja(0.6, 1.75, 0.95, lambert({ color: "#e8e4da" }), x, 1.1, BOMBAS_Z), caja(0.62, 0.25, 0.97, lambert({ color: "#b83a2c" }), x, 1.95, BOMBAS_Z));
    for (const s of [-1, 1]) {
      const pan = caja(0.02, 0.24, 0.5, brillo("#9fd8b0"), x + s * 0.31, 1.45, BOMBAS_Z); pan.layers.set(NOINK); bombas.add(pan);
      bombas.add(caja(0.08, 0.32, 0.12, lambert({ color: "#2a2a2e" }), x + s * 0.34, 1.0, BOMBAS_Z - 0.25));
      const manguera = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.025, 6, 16, Math.PI), lambert({ color: "#1a1a1e" })); manguera.rotation.y = Math.PI / 2; manguera.position.set(x + s * 0.34, 0.7, BOMBAS_Z - 0.25); bombas.add(manguera);
    }
    bombas.add(caja(0.35, 0.5, 0.35, lambert({ color: "#c0392b" }), x, 0.47, BOMBAS_Z + 1.05)); // extintor/bote
  }
  // poste con precios
  const poste = new THREE.Group(); poste.position.set(7.5, 0, 12.2); raiz.add(poste);
  poste.add(caja(0.3, 6.5, 0.3, lambert({ color: "#6a6c70" }), 0, 3.25, 0));
  const texPoste = lienzo((c, w, h) => {
    c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h); c.fillStyle = "#b83a2c"; c.fillRect(0, 0, w, h * 0.38);
    c.fillStyle = "#fff"; c.font = "bold 72px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("SERVI 214", w / 2, h * 0.27);
    c.fillStyle = "#1a1a1a"; c.fillRect(w * 0.08, h * 0.46, w * 0.84, h * 0.46);
    c.fillStyle = "#ff5a2a"; c.font = "bold 56px 'DejaVu Sans Mono', monospace"; c.fillText("MAGNA  23.89", w / 2, h * 0.62); c.fillText("DIÉSEL 25.40", w / 2, h * 0.82);
  }, 512, 400);
  const cartel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.7, 0.3), [lambert({ color: "#ddd" }), lambert({ color: "#ddd" }), lambert({ color: "#ddd" }), lambert({ color: "#ddd" }), new THREE.MeshLambertMaterial({ map: texPoste, emissive: "#ffffff", emissiveMap: texPoste, emissiveIntensity: 0.6 }), lambert({ color: "#ddd" })]);
  cartel.position.set(0, 6.0, 0); cartel.rotation.y = -0.5; poste.add(cartel);
  // señal de la carretera: pueblo a 40 km
  const senal = new THREE.Group(); senal.position.set(-9, 0, CARRETERA.z0 - 1.1); raiz.add(senal);
  for (const x of [-0.8, 0.8]) senal.add(caja(0.08, 2.4, 0.08, lambert({ color: "#8a8c90" }), x, 1.2, 0));
  const texSenal = lienzo((c, w, h) => { c.fillStyle = "#1f6b3f"; c.fillRect(0, 0, w, h); c.strokeStyle = "#fff"; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20); c.fillStyle = "#fff"; c.font = "bold 64px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("SAN ROQUE", w / 2, 100); c.font = "bold 72px 'DejaVu Sans', sans-serif"; c.fillText("40 km", w / 2, 185); }, 640, 240);
  const senalM = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.9), new THREE.MeshLambertMaterial({ map: texSenal, emissive: "#ffffff", emissiveMap: texSenal, emissiveIntensity: 0.35 })); senalM.position.set(0, 2.3, 0.05); senal.add(senalM);
  senal.add(caja(2.44, 0.94, 0.04, lambert({ color: "#8a8c90" }), 0, 2.3, 0.0));
  // postes de luz apagados y fantasmas de la carretera
  for (let x = -60; x <= 60; x += 20) if (Math.abs(x) > 8) raiz.add(caja(0.15, 0.9, 0.15, lambert({ color: "#d8d5cc" }), x, 0.45, CARRETERA.z0 - 0.9));

  // ---- monte y árboles ----
  const monte = new THREE.Group(); raiz.add(monte);
  const mMonte = lambert({ color: "#141d27" }), mArbol = lambert({ color: "#18261c" }), mTronco = lambert({ color: "#2a2018" });
  for (const [x, z, sx, sy] of [[-30, -45, 40, 16], [15, -55, 50, 22], [55, -40, 35, 14], [-60, 55, 50, 18], [10, 70, 60, 24], [70, 50, 40, 15]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mMonte); m.scale.set(sx, sy, sx * 0.5); m.position.set(x, -0.5, z); monte.add(m);
  }
  const arbol = (x: number, z: number, h: number) => {
    monte.add(caja(0.25, h * 0.3, 0.25, mTronco, x, h * 0.15, z));
    for (let i = 0; i < 3; i++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.32 - i * 0.07), h * 0.45, 8), mArbol); c.position.set(x, h * (0.38 + i * 0.2), z); monte.add(c); }
  };
  for (let i = 0; i < 70; i++) {
    const a = (i * 2.399) % (Math.PI * 2), d = 14 + (i * 7.3) % 30;
    const x = Math.cos(a) * d * 1.6, z = Math.sin(a) * d;
    if (z > CARRETERA.z0 - 2 && z < CARRETERA.z1 + 2) continue; // la carretera queda libre
    if (Math.abs(x) < 9 && z > -10 && z < 13) continue; // la gasolinera queda libre
    arbol(x, z, 4 + (i % 5) * 1.1);
  }
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, map: lienzo((c, w, h) => {
    const g2 = c.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, "#04060a"); g2.addColorStop(0.3, "#0b1322"); g2.addColorStop(0.47, "#24344c"); g2.addColorStop(0.5, "#2a3a52"); g2.addColorStop(0.56, "#0b111a"); g2.addColorStop(1, "#05070a");
    c.fillStyle = g2; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(220,230,255,${0.3 + (i % 5) * 0.12})`; c.fillRect((i * 97) % w, (i * 53) % (h * 0.42), 2, 2); }
  }, 1024, 512) }));
  cielo.layers.set(NOINK); raiz.add(cielo);
  const luna = halo(200, 215, 235, 14, 14, 0.25, false); luna.position.set(-40, 30, -70); raiz.add(luna);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshBasicMaterial({ color: "#d9dfe6", fog: false, toneMapped: false })); disco.position.set(-40, 30, -69.9); disco.layers.set(NOINK); raiz.add(disco);

  // ---- vehículos ----
  const camioneta = carro("#5d6e5a"); camioneta.g.position.set(6.2, 0, 1.6); raiz.add(camioneta.g);
  const tra = trailer(); tra.g.position.set(-200, 0, 1.65); raiz.add(tra.g);
  // carro descompuesto a lo lejos con las intermitentes
  const lejano = carro("#6a6f78"); lejano.g.position.set(-55, 0, 18.6); lejano.g.rotation.y = 0.15; raiz.add(lejano.g);
  [...lejano.faros, ...lejano.calaveras].forEach((m) => { m.material = lambert({ color: "#3a3a3c" }); });
  const intermitentes: THREE.Mesh[] = [];
  for (const [x, z] of [[2.1, -0.75], [2.1, 0.75], [-2.1, -0.75], [-2.1, 0.75]]) {
    const h = halo(255, 150, 30, 1.6, 1.6, 0.9, false); h.position.set(x + Math.sign(x) * 0.1, 0.75, z); h.rotation.y = Math.PI / 2; lejano.g.add(h); intermitentes.push(h);
    const b = caja(0.06, 0.1, 0.2, new THREE.MeshBasicMaterial({ color: "#ffa21e", toneMapped: false, fog: false }), x + Math.sign(x) * 0.02, 0.75, z * 1.1); b.layers.set(NOINK); lejano.g.add(b); intermitentes.push(b);
  }
  const luzIntermitente = new THREE.PointLight("#ffa21e", 0, 8, 1.5); luzIntermitente.position.set(-52, 1.2, 18); raiz.add(luzIntermitente);

  // luz de apoyo exterior (para planos sin techo: carretera, monte)
  const luzLuna = new THREE.DirectionalLight("#8aa2c4", 1.1); luzLuna.position.set(-20, 30, -30); raiz.add(luzLuna);
  const luzExtra = new THREE.PointLight("#eef4ff", 0, 10, 1.4); raiz.add(luzExtra);

  return { raiz, tienda, techo, paneles, lucesTecho, bombas, puerta, pestillo, abierto, cerrado, empanado, vaho, vidrioVent, vidrios, tubos, lucesTienda, registradora, libreta, camioneta, tra, lejano, intermitentes, luzIntermitente, luzExtra, senal, poste };
}
