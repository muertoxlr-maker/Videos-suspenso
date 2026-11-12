// Escenario de «El velorio del pueblo»: sala de una casa de pueblo. Al fondo, el ataúd sobre su catafalco con paño,
// cuatro blandones con velas altas, flores de cempasúchil y nube, coronas con listón, el retrato de don Chuy con moño
// negro, un crucifijo y un cuadro de la Virgen; sillas plegables en filas; mesa del café de olla; reloj de pared;
// ventana a la calle de tierra; y la puerta de la cocina, con su luz amarilla, en la pared de enfrente.
// Guía §8.8 (luz cálida con halos, utilería) y §8.6c (nada encimado: cada capa a ≥ 5 mm; nada atraviesa nada;
// la tapa del ataúd se ABRE con bisagra, no se atraviesa).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { cartel } from "../comun/utileria";
import { Aspecto, LIENZO_H, LIENZO_W, dibujarPersonaje } from "../prueba_pasillo/personaje";
import { POSE } from "../turno3/comun";

// medidas que usan los planos
export const SALA = { x0: -3.6, x1: 3.6, z0: -3.0, z1: 3.4, alto: 2.8 };
export const ATAUD = { x: 0, z: -1.7, largo: 1.95, ancho: 0.62, base: 0.78, alto: 0.4 }; // caja de 0.78 a 1.18
export const BISAGRA = { y: ATAUD.base + ATAUD.alto, z: ATAUD.z - ATAUD.ancho / 2 }; // la tapa gira sobre su orilla de atrás
export const VELAS: THREE.Vector3[] = [ // punta de la mecha de cada vela (la 0, adelante a la izquierda, es la que se apaga)
  new THREE.Vector3(-1.3, 1.62, -0.95), new THREE.Vector3(1.3, 1.62, -0.95), new THREE.Vector3(-1.3, 1.62, -2.45), new THREE.Vector3(1.3, 1.62, -2.45),
];
export const PUERTA_COCINA = { x: 1.3, z: SALA.z1, ancho: 0.95, alto: 2.05 };
export const RELOJ = new THREE.Vector3(-2.3, 2.05, SALA.z0 + 0.03);
export const OLLA = new THREE.Vector3(-3.1, 0.9, 1.4);

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cilindro = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 20) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c;
};
const plano = (w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; return p;
};

// ------------------------------------------------------------------ texturas
const texMosaico = () => lienzo((c, w, h) => { // piso de mosaico de pasta, rojo y crema, gastado
  const n = 4, t = w / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    c.fillStyle = (i + j) % 2 ? "#8a3a2a" : "#c8b48e"; c.fillRect(i * t, j * t, t, t);
    c.fillStyle = (i + j) % 2 ? "#c8b48e" : "#8a3a2a"; c.beginPath(); c.arc(i * t + t / 2, j * t + t / 2, t * 0.22, 0, 7); c.fill();
  }
  for (let k = 0; k < 900; k++) { c.fillStyle = k % 2 ? "rgba(30,20,14,0.12)" : "rgba(255,240,210,0.08)"; c.fillRect((k * 37) % w, (k * 91) % h, 3, 2); }
  c.strokeStyle = "rgba(30,20,16,0.6)"; c.lineWidth = 3;
  for (let x = 0; x <= w; x += t) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); }
}, 256, 256, [10, 9]);
const texPared = () => lienzo((c, w, h) => { // cal arriba, pintura verde abajo con guardapolvo, manchas de humedad
  c.fillStyle = "#cdbf9f"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#3f6a62"; c.fillRect(0, h * 0.6, w, h * 0.4);
  c.fillStyle = "#2c4a44"; c.fillRect(0, h * 0.6, w, 8);
  for (let k = 0; k < 9; k++) { const g = c.createRadialGradient((k * 113) % w, h * 0.12 + (k % 3) * 30, 4, (k * 113) % w, h * 0.12 + (k % 3) * 30, 70); g.addColorStop(0, "rgba(90,70,40,0.22)"); g.addColorStop(1, "rgba(90,70,40,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  for (let k = 0; k < 600; k++) { c.fillStyle = "rgba(60,50,30,0.08)"; c.fillRect((k * 53) % w, (k * 29) % h, 2, 2); }
  for (let k = 0; k < 12; k++) { c.fillStyle = "rgba(220,215,200,0.35)"; c.fillRect((k * 71) % w, h * 0.62 + ((k * 37) % (h * 0.36)), 10, 6); } // pintura descarapelada
}, 512, 512, [3, 1]);
const texMadera = (base: string) => lienzo((c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 6) { c.fillStyle = `rgba(30,12,4,${0.1 + ((y * 7) % 5) * 0.03})`; c.fillRect(0, y + Math.sin(y) * 2, w, 2); }
  c.fillStyle = "rgba(255,220,170,0.12)"; c.fillRect(0, h * 0.1, w, h * 0.12);
}, 256, 128);
const texPano = () => lienzo((c, w, h) => { // paño morado del catafalco con pliegues y galón dorado
  c.fillStyle = "#3a2448"; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 22) { const g = c.createLinearGradient(x, 0, x + 22, 0); g.addColorStop(0, "rgba(0,0,0,0.3)"); g.addColorStop(0.5, "rgba(140,100,170,0.15)"); g.addColorStop(1, "rgba(0,0,0,0.3)"); c.fillStyle = g; c.fillRect(x, 0, 22, h); }
  c.fillStyle = "#c8a24a"; c.fillRect(0, 10, w, 10); for (let x = 0; x < w; x += 14) c.fillRect(x, 20, 4, 14);
}, 256, 128);
const texRetrato = () => { // don Chuy dibujado con el mismo estilo que los personajes, en marco
  const c = document.createElement("canvas"); c.width = 360; c.height = 460;
  const g = c.getContext("2d")!;
  g.fillStyle = "#e8dcc0"; g.fillRect(0, 0, 360, 460);
  const gr = g.createRadialGradient(180, 200, 20, 180, 200, 260); gr.addColorStop(0, "#d8c8a0"); gr.addColorStop(1, "#8a7a5a"); g.fillStyle = gr; g.fillRect(20, 20, 320, 420);
  const p = document.createElement("canvas"); p.width = LIENZO_W; p.height = LIENZO_H;
  const DON: Aspecto = { piel: "#b88a66", pelo: "#d8d4cc", ropa: "#3a3430", ropaInterior: "#e6e0d0", pantalon: "#2a2622", zapatos: "#1a1614", peinado: "recogido", bigote: true, arrugas: true, sombrero: "#d8c89a", prenda: "camisa", semilla: 611 };
  dibujarPersonaje(p.getContext("2d")!, DON, { ...POSE, mirarY: 0.1, boca: "amable" });
  g.drawImage(p, 40, 0, 520, 640, 30, 30, 300, 370); // cabeza y pecho
  g.lineWidth = 26; g.strokeStyle = "#3a2414"; g.strokeRect(13, 13, 334, 434);
  g.lineWidth = 6; g.strokeStyle = "#c8a24a"; g.strokeRect(28, 28, 304, 404);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
};
const texVirgen = () => lienzo((c, w, h) => { // estampa religiosa genérica: manto azul con estrellas y resplandor
  c.fillStyle = "#e8c070"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { c.strokeStyle = "rgba(255,240,180,0.6)"; c.lineWidth = 3; const a = (k / 40) * Math.PI * 2; c.beginPath(); c.moveTo(w / 2, h * 0.5); c.lineTo(w / 2 + Math.cos(a) * w, h * 0.5 + Math.sin(a) * h); c.stroke(); }
  c.fillStyle = "#1f5a7a"; c.beginPath(); c.moveTo(w * 0.5, h * 0.12); c.quadraticCurveTo(w * 0.8, h * 0.2, w * 0.78, h * 0.88); c.lineTo(w * 0.22, h * 0.88); c.quadraticCurveTo(w * 0.2, h * 0.2, w * 0.5, h * 0.12); c.fill();
  c.fillStyle = "#c86a6a"; c.beginPath(); c.moveTo(w * 0.42, h * 0.3); c.lineTo(w * 0.58, h * 0.3); c.lineTo(w * 0.6, h * 0.86); c.lineTo(w * 0.4, h * 0.86); c.fill();
  c.fillStyle = "#c89a7a"; c.beginPath(); c.arc(w * 0.5, h * 0.24, w * 0.08, 0, 7); c.fill();
  c.fillStyle = "#f6e6a0"; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc(w * (0.28 + (k % 4) * 0.13), h * (0.35 + Math.floor(k / 4) * 0.13), 4, 0, 7); c.fill(); }
  c.strokeStyle = "#5a3a1a"; c.lineWidth = 16; c.strokeRect(0, 0, w, h);
}, 256, 340);
const texReloj = () => lienzo((c, w, h) => {
  c.fillStyle = "#f2ead6"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 7); c.fill();
  c.lineWidth = 10; c.strokeStyle = "#3a2414"; c.stroke();
  c.fillStyle = "#1a1410"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; c.fillText(String(i), w / 2 + Math.cos(a) * w * 0.35, h / 2 + Math.sin(a) * h * 0.35); }
}, 256, 256);
const texVentana = () => lienzo((c, w, h) => { // noche: calle de tierra, una casa lejana con foco, cerro y luna
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0e1a2e"); g.addColorStop(1, "#24344a"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = "#e8eef8"; c.beginPath(); c.arc(w * 0.75, h * 0.2, 16, 0, 7); c.fill();
  c.fillStyle = "#121a26"; c.beginPath(); c.moveTo(0, h * 0.55); c.quadraticCurveTo(w * 0.4, h * 0.3, w, h * 0.5); c.lineTo(w, h); c.lineTo(0, h); c.fill();
  c.fillStyle = "#2a2a30"; c.fillRect(w * 0.15, h * 0.52, w * 0.3, h * 0.2); c.fillStyle = "#ffc56e"; c.fillRect(w * 0.22, h * 0.58, w * 0.06, h * 0.07);
  c.fillStyle = "#4a3e30"; c.fillRect(0, h * 0.78, w, h * 0.22);
}, 256, 320);
const texListon = (txt: string) => lienzo((c, w, h) => {
  c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#6a2a8a"; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8);
  c.fillStyle = "#3a2448"; c.font = "bold 34px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  txt.split("|").forEach((t, i, a) => c.fillText(t, w / 2, h * (i + 0.5) / a.length));
}, 512, 128);

/** silla plegable de metal que mira hacia −z (el respaldo queda en z + 0.2) */
const silla = (m: THREE.Material, x: number, z: number, gira = 0) => {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = gira;
  // asiento bajo (0.36 m): los personajes tienen piernas cortas (0.255 de su altura) y así la cadera cae sobre él
  g.add(caja(0.42, 0.03, 0.4, m, 0, 0.36, 0)); // asiento
  g.add(caja(0.42, 0.28, 0.025, m, 0, 0.64, 0.2)); // respaldo
  for (const sx of [-0.19, 0.19]) { g.add(caja(0.025, 0.78, 0.025, m, sx, 0.39, 0.2)); g.add(caja(0.025, 0.36, 0.025, m, sx, 0.18, -0.18)); }
  return g;
};

/** ramo redondo de flores (cempasúchil naranja y nube blanca) */
const ramo = (n: number, r: number, colores: string[], semilla: number) => {
  const g = new THREE.Group();
  const ms = colores.map((col) => lambert({ color: col }));
  for (let i = 0; i < n; i++) {
    const a = i * 2.39 + semilla, rr = r * Math.sqrt((i + 0.5) / n);
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.045 + ((i * 7) % 3) * 0.01, 8, 6), ms[i % ms.length]);
    f.position.set(Math.cos(a) * rr, Math.sqrt(Math.max(0, r * r - rr * rr)) * 0.7, Math.sin(a) * rr); g.add(f);
  }
  return g;
};

export function crearVelorio() {
  const raiz = new THREE.Group();
  // ---- luces generales ----
  const amb = new THREE.AmbientLight("#8a7a6a", 0.26); raiz.add(amb);
  const hemi = new THREE.HemisphereLight("#6a5a4a", "#1a120c", 0.3); raiz.add(hemi);

  // ---- cuarto: piso, techo y cuatro paredes (la de enfrente con el hueco de la puerta de la cocina) ----
  const W = SALA.x1 - SALA.x0, D = SALA.z1 - SALA.z0, cxS = (SALA.x0 + SALA.x1) / 2, czS = (SALA.z0 + SALA.z1) / 2;
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert({ map: texMosaico() })); piso.rotation.x = -Math.PI / 2; piso.position.set(cxS, 0, czS); raiz.add(piso);
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(W, D), lambert({ color: "#5a4a3a", side: THREE.DoubleSide })); techo.rotation.x = Math.PI / 2; techo.position.set(cxS, SALA.alto, czS); raiz.add(techo);
  for (let i = 0; i < 6; i++) raiz.add(caja(W - 0.02, 0.12, 0.1, lambert({ color: "#3a2a1c" }), cxS, SALA.alto - 0.07, SALA.z0 + 0.6 + i * 1.1)); // vigas
  const mPared = lambert({ map: texPared() });
  raiz.add(plano(W, SALA.alto, mPared, cxS, SALA.alto / 2, SALA.z0)); // fondo
  raiz.add(plano(D, SALA.alto, mPared, SALA.x0, SALA.alto / 2, czS, Math.PI / 2)); // izquierda
  raiz.add(plano(D, SALA.alto, mPared, SALA.x1, SALA.alto / 2, czS, -Math.PI / 2)); // derecha
  // pared de enfrente en tres piezas alrededor de la puerta
  const P = PUERTA_COCINA, xa = P.x - P.ancho / 2, xb = P.x + P.ancho / 2;
  raiz.add(plano(xa - SALA.x0, SALA.alto, mPared, (SALA.x0 + xa) / 2, SALA.alto / 2, SALA.z1, Math.PI));
  raiz.add(plano(SALA.x1 - xb, SALA.alto, mPared, (xb + SALA.x1) / 2, SALA.alto / 2, SALA.z1, Math.PI));
  raiz.add(plano(P.ancho, SALA.alto - P.alto, mPared, P.x, (SALA.alto + P.alto) / 2, SALA.z1, Math.PI));
  const mMarco = lambert({ color: "#5a3a22" });
  raiz.add(caja(0.08, P.alto, 0.14, mMarco, xa - 0.04, P.alto / 2, SALA.z1), caja(0.08, P.alto, 0.14, mMarco, xb + 0.04, P.alto / 2, SALA.z1), caja(P.ancho + 0.16, 0.08, 0.14, mMarco, P.x, P.alto + 0.04, SALA.z1));
  // la cocina detrás de la puerta: cuarto amarillo con alacena y estufa (se ve por el hueco)
  const cocina = new THREE.Group(); raiz.add(cocina);
  cocina.add(plano(3, 2.6, lambert({ color: "#d8b25a" }), P.x, 1.3, SALA.z1 + 1.8, Math.PI));
  cocina.add(plano(1.8, 2.6, lambert({ color: "#c89a4a" }), P.x - 1.0, 1.3, SALA.z1 + 0.9, Math.PI / 2), plano(1.8, 2.6, lambert({ color: "#c89a4a" }), P.x + 1.0, 1.3, SALA.z1 + 0.9, -Math.PI / 2));
  const pisoCoc = new THREE.Mesh(new THREE.PlaneGeometry(2, 1.8), lambert({ color: "#7a5a3a" })); pisoCoc.rotation.x = -Math.PI / 2; pisoCoc.position.set(P.x, 0.001, SALA.z1 + 0.9); cocina.add(pisoCoc);
  cocina.add(caja(0.9, 0.85, 0.5, lambert({ color: "#e8e4dc" }), P.x + 0.25, 0.425, SALA.z1 + 1.5)); // estufa
  for (let i = 0; i < 4; i++) cocina.add(cilindro(0.11, 0.11, 0.04, lambert({ color: "#2a2422" }), P.x + 0.05 + (i % 2) * 0.4, 0.87, SALA.z1 + 1.38 + Math.floor(i / 2) * 0.24));
  cocina.add(caja(0.8, 0.5, 0.3, lambert({ color: "#8a5a3a" }), P.x - 0.3, 1.75, SALA.z1 + 1.6)); // alacena
  for (let i = 0; i < 4; i++) cocina.add(cilindro(0.06, 0.05, 0.12, lambert({ color: ["#c8502a", "#e0b030", "#3a7a8a", "#e8e0c8"][i] }), P.x - 0.6 + i * 0.2, 2.06, SALA.z1 + 1.6));
  const focoCocina = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), brillo("#fff0c0")); focoCocina.position.set(P.x, 2.3, SALA.z1 + 0.9); focoCocina.layers.set(NOINK); cocina.add(focoCocina);
  const haloCocina = destello(255, 220, 140, 1.6, 0.5); haloCocina.position.set(P.x, 2.3, SALA.z1 + 0.85); cocina.add(haloCocina);
  const luzCocina = new THREE.PointLight("#ffd28a", 7, 7, 1.2); luzCocina.position.set(P.x, 2.1, SALA.z1 + 0.7); raiz.add(luzCocina);
  // rayo de luz de la cocina sobre el piso de la sala
  const rayo = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.2), new THREE.MeshBasicMaterial({ map: resplandor(255, 210, 130), transparent: true, opacity: 0.35, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  rayo.rotation.x = -Math.PI / 2; rayo.position.set(P.x, 0.006, SALA.z1 - 0.9); rayo.layers.set(NOINK); raiz.add(rayo);

  // ---- foco del techo (se apaga a las 12:30; quedan las velas y la cocina) ----
  raiz.add(cilindro(0.006, 0.006, 0.4, lambert({ color: "#141012" }), 0, SALA.alto - 0.2, 0.4, 6));
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), brillo("#ffe8b8")); bulbo.position.set(0, SALA.alto - 0.43, 0.4); bulbo.layers.set(NOINK); raiz.add(bulbo);
  const haloTecho = destello(255, 215, 150, 1.6, 0.45); haloTecho.position.copy(bulbo.position); raiz.add(haloTecho);
  const luzTecho = new THREE.PointLight("#ffd29a", 5, 9, 1.1); luzTecho.position.set(0, SALA.alto - 0.5, 0.4); raiz.add(luzTecho);

  // ---- el ataúd sobre el catafalco ----
  const A = ATAUD;
  raiz.add(caja(A.largo + 0.5, A.base, A.ancho + 0.4, lambert({ map: texPano() }), A.x, A.base / 2, A.z)); // catafalco con paño (hasta el piso)
  const mAtaud = lambert({ map: texMadera("#6a3a1e") });
  const ataud = new THREE.Group(); ataud.position.set(A.x, A.base, A.z); raiz.add(ataud);
  const g0 = 0.04; // grosor de las tablas
  ataud.add(caja(A.largo, 0.04, A.ancho, mAtaud, 0, 0.02, 0)); // fondo
  ataud.add(caja(A.largo, A.alto, g0, mAtaud, 0, A.alto / 2, A.ancho / 2 - g0 / 2), caja(A.largo, A.alto, g0, mAtaud, 0, A.alto / 2, -A.ancho / 2 + g0 / 2));
  ataud.add(caja(g0, A.alto, A.ancho - 2 * g0, mAtaud, A.largo / 2 - g0 / 2, A.alto / 2, 0), caja(g0, A.alto, A.ancho - 2 * g0, mAtaud, -A.largo / 2 + g0 / 2, A.alto / 2, 0));
  ataud.add(caja(A.largo - 2 * g0, 0.012, A.ancho - 2 * g0, lambert({ color: "#e8e2d6" }), 0, 0.046, 0)); // forro blanco del fondo
  const mDorado = lambert({ color: "#c8a24a", emissive: "#3a2a08" });
  for (const x of [-0.6, 0, 0.6]) ataud.add(caja(0.18, 0.035, 0.035, mDorado, x, A.alto * 0.55, A.ancho / 2 + 0.018)); // agarraderas
  ataud.add(caja(A.largo + 0.02, 0.03, 0.02, mDorado, 0, A.alto - 0.02, A.ancho / 2 + 0.011)); // moldura
  // tapa con bisagra en la orilla de atrás (el pivote está en la bisagra; la tapa se extiende hacia +z)
  const tapa = new THREE.Group(); tapa.position.set(A.x, BISAGRA.y, BISAGRA.z); raiz.add(tapa);
  tapa.add(caja(A.largo + 0.04, 0.06, A.ancho + 0.04, mAtaud, 0, 0.03, A.ancho / 2));
  tapa.add(caja(A.largo - 0.2, 0.05, A.ancho - 0.16, lambert({ map: texMadera("#7a4426") }), 0, 0.085, A.ancho / 2)); // segundo nivel de la tapa
  tapa.add(caja(0.42, 0.012, 0.26, lambert({ color: "#1a1a22", emissive: "#202838", emissiveIntensity: 0.4 }), -0.55, 0.116, A.ancho / 2)); // ventanita (oscura: no se ve adentro)
  tapa.add(caja(0.46, 0.014, 0.03, mDorado, -0.55, 0.117, A.ancho / 2 - 0.145), caja(0.46, 0.014, 0.03, mDorado, -0.55, 0.117, A.ancho / 2 + 0.145));
  const crucifijoTapa = new THREE.Group(); crucifijoTapa.position.set(0.45, 0.115, A.ancho / 2); tapa.add(crucifijoTapa);
  crucifijoTapa.add(caja(0.05, 0.012, 0.26, mDorado, 0, 0, 0), caja(0.18, 0.013, 0.05, mDorado, 0, 0.001, -0.05));

  // ---- cuatro blandones con velas (llamas que titilan; la 0 se apaga y se vuelve a prender) ----
  const llamas: THREE.Mesh[] = [], halos: THREE.Sprite[] = [], humo: THREE.Sprite[] = [];
  const mFierro = lambert({ color: "#2a2422" }), mCera = lambert({ color: "#f2ead2", emissive: "#3a2a10", emissiveIntensity: 0.3 });
  VELAS.forEach((v, i) => {
    raiz.add(cilindro(0.16, 0.2, 0.05, mFierro, v.x, 0.025, v.z), cilindro(0.025, 0.03, 1.1, mFierro, v.x, 0.6, v.z), cilindro(0.09, 0.05, 0.08, mFierro, v.x, 1.18, v.z)); // pie, tubo y plato
    raiz.add(cilindro(0.04, 0.04, 0.38, mCera, v.x, 1.41, v.z, 14)); // vela (de 1.22 a 1.60)
    raiz.add(cilindro(0.003, 0.003, 0.03, lambert({ color: "#141012" }), v.x, 1.61, v.z, 4)); // mecha
    const ll = new THREE.Mesh(new THREE.SphereGeometry(0.022, 10, 8), brillo("#ffcf6a")); ll.scale.set(1, 2.1, 1); ll.position.set(v.x, v.y + 0.035, v.z); ll.layers.set(NOINK); raiz.add(ll); llamas.push(ll);
    const h = destello(255, 180, 90, 0.7, 0.6); h.position.set(v.x, v.y + 0.04, v.z); raiz.add(h); halos.push(h);
    const hu = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(170, 165, 160), transparent: true, opacity: 0, depthWrite: false })); hu.layers.set(NOINK); hu.position.set(v.x, v.y + 0.1, v.z); raiz.add(hu); humo.push(hu);
    void i;
  });
  // dos luces de vela (izquierda y derecha) para no cargar el render con cuatro
  const luzVelaIzq = new THREE.PointLight("#ffa850", 3.2, 6, 1.4); luzVelaIzq.position.set(-1.3, 1.75, -1.7); raiz.add(luzVelaIzq);
  const luzVelaDer = new THREE.PointLight("#ffa850", 3.2, 6, 1.4); luzVelaDer.position.set(1.3, 1.75, -1.7); raiz.add(luzVelaDer);
  // caja de cerillos sobre el catafalco, junto a la vela 0
  const cerillos = new THREE.Group(); cerillos.position.set(-1.05, A.base + 0.012, -1.42); raiz.add(cerillos);
  cerillos.add(caja(0.1, 0.022, 0.06, lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#c8263a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f6d24a"; c.font = "bold 40px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("LA CENTRAL", w / 2, h / 2); }, 256, 96) }), 0, 0, 0));
  // cerillo encendido (se mueve en el plano del «siete»)
  const cerillo = new THREE.Group(); raiz.add(cerillo); cerillo.visible = false;
  cerillo.add(caja(0.004, 0.06, 0.004, lambert({ color: "#e8d8b0" }), 0, -0.03, 0));
  const llamaCerillo = new THREE.Mesh(new THREE.SphereGeometry(0.012, 8, 6), brillo("#ffd27a")); llamaCerillo.scale.set(1, 1.8, 1); llamaCerillo.layers.set(NOINK); cerillo.add(llamaCerillo);
  const haloCerillo = destello(255, 190, 100, 0.35, 0.7); cerillo.add(haloCerillo);

  // ---- flores, coronas y retrato ----
  for (const [x, z] of [[-1.85, -2.6], [1.85, -2.6]] as [number, number][]) { // jarrones altos junto a la pared
    raiz.add(cilindro(0.14, 0.1, 0.55, lambert({ color: "#7a5a3a" }), x, 0.275, z));
    const r = ramo(26, 0.28, ["#e8820a", "#f2a020", "#f2efe6"], x); r.position.set(x, 0.62, z); raiz.add(r);
  }
  for (const [x, z] of [[-0.75, -2.62], [0.75, -2.62]] as [number, number][]) { // coronas en tripié
    for (const s of [-1, 1]) raiz.add(caja(0.025, 1.4, 0.025, mFierro, x + s * 0.2, 0.7, z - 0.1));
    const corona = new THREE.Group(); corona.position.set(x, 1.55, z); raiz.add(corona);
    for (let i = 0; i < 22; i++) { const a = (i / 22) * Math.PI * 2; const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), lambert({ color: i % 3 ? "#f2efe6" : "#e8820a" })); f.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, 0); corona.add(f); }
    const l = plano(0.42, 0.11, lambert({ map: texListon(x < 0 ? "DESCANSE EN PAZ" : "TU FAMILIA|NO TE OLVIDA") }), 0, -0.05, 0.07); corona.add(l);
  }
  // listón con el nombre completo (el del acta) sobre la orilla del catafalco, al frente
  const listonNombre = plano(0.95, 0.16, lambert({ map: texListon("JESÚS RAMÍREZ SOTO|1941 – 2026"), side: THREE.DoubleSide }), A.x, A.base - 0.14, A.z + A.ancho / 2 + 0.2 + 0.006);
  raiz.add(listonNombre);
  // retrato de don Chuy en caballete con moño negro, detrás del ataúd
  for (const s of [-1, 1]) raiz.add(caja(0.03, 1.75, 0.03, lambert({ color: "#3a2414" }), A.x + s * 0.24, 0.875, -2.62));
  const retrato = plano(0.56, 0.72, lambert({ map: texRetrato(), emissive: "#ffffff", emissiveMap: texRetrato(), emissiveIntensity: 0.08 }), A.x, 1.95, -2.58); raiz.add(retrato);
  const mono = new THREE.Group(); mono.position.set(A.x + 0.2, 2.24, -2.57); raiz.add(mono);
  for (const s of [-1, 1]) { const ala = new THREE.Mesh(new THREE.CircleGeometry(0.07, 3), lambert({ color: "#0e0e10" })); ala.rotation.z = s > 0 ? 0 : Math.PI; ala.position.x = s * 0.06; mono.add(ala); }
  // crucifijo y estampa de la Virgen en la pared del fondo
  const cruz = new THREE.Group(); cruz.position.set(A.x, 2.5, SALA.z0 + 0.03); raiz.add(cruz);
  cruz.add(caja(0.05, 0.4, 0.03, lambert({ color: "#3a2414" }), 0, 0, 0), caja(0.26, 0.05, 0.03, lambert({ color: "#3a2414" }), 0, 0.08, 0.005));
  raiz.add(plano(0.55, 0.72, lambert({ map: texVirgen() }), 1.9, 1.75, SALA.z0 + 0.012));
  const veladora = cilindro(0.04, 0.04, 0.1, lambert({ color: "#c8263a", emissive: "#5a1008" }), 1.9, 1.06, SALA.z0 + 0.2); raiz.add(veladora);
  raiz.add(caja(0.5, 0.04, 0.25, lambert({ color: "#5a3a22" }), 1.9, 0.99, SALA.z0 + 0.14)); // repisa
  const llamaVeladora = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brillo("#ffcf6a")); llamaVeladora.scale.set(1, 1.8, 1); llamaVeladora.position.set(1.9, 1.135, SALA.z0 + 0.2); llamaVeladora.layers.set(NOINK); raiz.add(llamaVeladora);
  const haloVeladora = destello(255, 120, 80, 0.45, 0.5); haloVeladora.position.set(1.9, 1.14, SALA.z0 + 0.25); raiz.add(haloVeladora);
  // reloj de pared (las manecillas se mueven en el video)
  const reloj = new THREE.Group(); reloj.position.copy(RELOJ); raiz.add(reloj);
  reloj.add(plano(0.36, 0.36, lambert({ map: texReloj(), emissive: "#ffffff", emissiveMap: texReloj(), emissiveIntensity: 0.12 }), 0, 0, 0.012));
  reloj.add(caja(0.38, 0.38, 0.02, lambert({ color: "#3a2414" }), 0, 0, 0.0));
  const manoHora = new THREE.Group(); manoHora.position.z = 0.02; reloj.add(manoHora); manoHora.add(caja(0.016, 0.09, 0.004, lambert({ color: "#141012" }), 0, 0.04, 0));
  const manoMin = new THREE.Group(); manoMin.position.z = 0.026; reloj.add(manoMin); manoMin.add(caja(0.01, 0.14, 0.004, lambert({ color: "#141012" }), 0, 0.065, 0));
  // ventana a la calle (pared izquierda) con cortinas
  raiz.add(plano(0.9, 1.1, brillo("#1a2638"), SALA.x0 + 0.012, 1.6, -0.6, Math.PI / 2));
  raiz.add(plano(0.84, 1.04, new THREE.MeshBasicMaterial({ map: texVentana(), toneMapped: false }), SALA.x0 + 0.018, 1.6, -0.6, Math.PI / 2));
  for (const [dy, dz, hh, ww] of [[0.58, 0, 0.06, 1.0], [-0.58, 0, 0.06, 1.0], [0, 0.48, 1.22, 0.06], [0, -0.48, 1.22, 0.06]]) raiz.add(caja(0.04, hh, ww, lambert({ color: "#5a3a22" }), SALA.x0 + 0.03, 1.6 + dy, -0.6 + dz)); // marco
  for (const s of [-1, 1]) raiz.add(plano(0.32, 1.25, lambert({ color: "#8a2a3a", side: THREE.DoubleSide }), SALA.x0 + 0.1, 1.58, -0.6 + s * 0.55, Math.PI / 2));

  // ---- mesa del café de olla (pared izquierda) ----
  raiz.add(caja(0.7, 0.04, 1.4, lambert({ color: "#e8e2d2" }), OLLA.x, 0.76, OLLA.z));
  for (const [dx, dz] of [[-0.3, -0.65], [0.3, -0.65], [-0.3, 0.65], [0.3, 0.65]]) raiz.add(caja(0.04, 0.74, 0.04, lambert({ color: "#5a3a22" }), OLLA.x + dx, 0.37, OLLA.z + dz));
  raiz.add(caja(0.72, 0.18, 0.012, lambert({ color: "#c8502a" }), OLLA.x, 0.69, OLLA.z + 0.705)); // mantel colgando
  const olla = new THREE.Mesh(new THREE.SphereGeometry(0.2, 18, 12), lambert({ color: "#9a4a24" })); olla.scale.set(1, 0.85, 1); olla.position.set(OLLA.x, 0.95, OLLA.z - 0.2); raiz.add(olla);
  raiz.add(cilindro(0.12, 0.15, 0.08, lambert({ color: "#8a4220" }), OLLA.x, 1.13, OLLA.z - 0.2));
  for (const s of [-1, 1]) raiz.add(new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.012, 6, 12), lambert({ color: "#8a4220" })).translateX(OLLA.x + s * 0.21).translateY(1.02).translateZ(OLLA.z - 0.2));
  const vaporOlla: THREE.Sprite[] = [];
  for (let i = 0; i < 4; i++) { const v = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(230, 220, 205), transparent: true, opacity: 0.12, depthWrite: false })); v.layers.set(NOINK); v.position.set(OLLA.x, 1.25, OLLA.z - 0.2); raiz.add(v); vaporOlla.push(v); }
  for (let i = 0; i < 6; i++) raiz.add(cilindro(0.04, 0.032, 0.08, lambert({ color: "#a85a2a" }), OLLA.x - 0.18 + (i % 2) * 0.16, 0.82, OLLA.z + 0.15 + Math.floor(i / 2) * 0.16, 12)); // jarritos
  raiz.add(cilindro(0.17, 0.13, 0.08, lambert({ color: "#c8a060" }), OLLA.x + 0.12, 0.82, OLLA.z - 0.45)); // canasta de pan
  for (let i = 0; i < 4; i++) { const pan = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 6), lambert({ color: i % 2 ? "#d8a060" : "#e8c890" })); pan.scale.set(1, 0.55, 1); pan.position.set(OLLA.x + 0.08 + (i % 2) * 0.08, 0.875, OLLA.z - 0.48 + Math.floor(i / 2) * 0.07); raiz.add(pan); }

  // ---- sillas: filas de invitados (miran al ataúd, −z) y las de la familia junto al ataúd (miran a la sala, +z) ----
  const mSilla = lambert({ color: "#7a7e84" }), mSillaOsc = lambert({ color: "#5a5e64" });
  const FILAS_Z = [0.35, 1.2, 2.05];
  const COLS_X = [-2.0, -1.45, -0.9, 0.9, 1.45, 2.0];
  const sillas: THREE.Group[] = [];
  FILAS_Z.forEach((z, j) => COLS_X.forEach((x, i) => { const s = silla((i + j) % 2 ? mSilla : mSillaOsc, x, z); raiz.add(s); sillas.push(s); }));
  // la familia: tú y tu abuela, a la derecha del ataúd (miran hacia la sala)
  const sillaTu = silla(mSilla, 2.05, -1.0, Math.PI); raiz.add(sillaTu);
  const sillaAbuela = silla(mSillaOsc, 2.6, -1.0, Math.PI); raiz.add(sillaAbuela);
  const rebozoSilla = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.02, 0.3), lambert({ color: "#1a1a1e" })); rebozoSilla.position.set(2.6, 0.39, -1.0); rebozoSilla.visible = false; raiz.add(rebozoSilla); // el rebozo que dejó en la silla
  const rebozoCuelga = caja(0.44, 0.2, 0.012, lambert({ color: "#1a1a1e" }), 2.6, 0.29, -1.0 + 0.212); // cuelga por el frente del asiento rebozoCuelga.visible = false; raiz.add(rebozoCuelga);

  // luz extra para planos cerrados
  const luzExtra = new THREE.PointLight("#ffd9a8", 0, 4, 1.5); raiz.add(luzExtra);

  return {
    raiz, amb, hemi, luzTecho, bulbo, haloTecho, luzCocina, haloCocina, rayo, tapa, ataud, llamas, halos, humo, luzVelaIzq, luzVelaDer,
    cerillo, cerillos, manoHora, manoMin, vaporOlla, sillas, sillaTu, sillaAbuela, rebozoSilla, rebozoCuelga, luzExtra, llamaVeladora, haloVeladora,
    FILAS_Z, COLS_X,
  };
}
export type Velorio = ReturnType<typeof crearVelorio>;
