// Escenario de «La niñera»: casa sola de un piso a las afueras del pueblo, de noche.
//   Sala (sillón que mira al pasillo, mesita con el monitor del bebé, tele, lámpara de pie, tapete con juguetes,
//   ventana con luna, puerta de la calle) · cocina abierta (refri con la hoja de reglas, estufa, fregadero, alacenas,
//   reloj) · pasillo con foco en el techo y dos puertas cerradas · al fondo, el cuarto del bebé (cuna de barrotes con
//   móvil, cómoda con lamparita y la cámara del monitor, mecedora, ventana con luna) · por fuera: casa con techo de
//   teja, porche con foco, campo, camino de tierra, cerca, árbol seco, el pueblo lejos y la luna.
// Guía §8.9 (noche apagada: paredes gris azulado, piso de madera oscura, techo casi negro, una lamparita cálida),
// §8.8 (halos en cada foco), §8.6c (capas ≥ 5 mm; la puerta del cuarto está abierta; nada atraviesa nada) y §8.6d
// (cada objeto con sus piezas típicas).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";

export const SALA = { x0: -3.2, x1: 4.0, z0: 0, z1: 4.2, alto: 2.6 }; // sala + cocina (la cocina es x > 1.0)
export const PASILLO = { x0: -0.55, x1: 0.55, z0: -5.0, z1: 0, alto: 2.45 };
export const CUARTO = { x0: -1.9, x1: 1.9, z0: -8.6, z1: -5.0, alto: 2.45 };
export const SILLON = { x: -1.4, z: 3.55, ancho: 2.0, fondo: 0.8, asiento: 0.38 }; // mira hacia −z (al pasillo)
export const MESITA = { x: -1.4, z: 2.45, alto: 0.42 };
export const MONITOR = new THREE.Vector3(-1.15, MESITA.alto + 0.006, 2.4); // base del monitor de los papás
export const REFRI = { x: 3.62, z: 1.2, alto: 1.75, ancho: 0.72, fondo: 0.7 }; // contra la pared derecha, mira hacia −x
export const HOJA = new THREE.Vector3(REFRI.x - REFRI.fondo / 2 - 0.008, 1.32, REFRI.z + 0.1); // la hoja pegada con imán
export const FOCO_PASILLO = new THREE.Vector3(0, PASILLO.alto - 0.32, -2.3);
export const CUNA = { x: 0.55, z: -7.75, largo: 1.25, ancho: 0.68, colchon: 0.5, barandal: 1.02 }; // largo en x
export const MECEDORA = { x: -1.15, z: -6.3 };
export const COMODA = { x: -1.25, z: -8.25 };
export const PUERTA_CALLE = { x: SALA.x0, z: 3.35 };
export const RELOJ = new THREE.Vector3(-1.0, 2.0, SALA.z0 + 0.02); // en la pared del fondo de la sala, entre la tele y el pasillo

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cil = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 16) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c;
};
const plano = (w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; return p;
};
const suelo = (w: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); return p;
};

// ------------------------------------------------------------------ texturas
const texDuela = () => lienzo((c, w, h) => { // duela de madera oscura con vetas y juntas
  for (let i = 0; i < 8; i++) {
    c.fillStyle = ["#4a3326", "#533a2b", "#3f2b20", "#4e3628"][i % 4]; c.fillRect(0, i * h / 8, w, h / 8);
    for (let k = 0; k < 6; k++) { c.fillStyle = "rgba(20,10,6,0.18)"; c.fillRect(0, i * h / 8 + 4 + k * 5, w, 1); }
    c.fillStyle = "#1e140e"; c.fillRect(0, i * h / 8, w, 2); c.fillRect(((i * 97) % w), i * h / 8, 2, h / 8);
  }
  for (let k = 0; k < 6; k++) { const g = c.createRadialGradient((k * 83) % w, (k * 47) % h, 2, (k * 83) % w, (k * 47) % h, 50); g.addColorStop(0, "rgba(140,120,100,0.12)"); g.addColorStop(1, "rgba(140,120,100,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); } // barniz gastado
}, 256, 256, [4, 4]);
const texPared = (base: string, zoclo: string) => lienzo((c, w, h) => { // pintura gris azulada, lambrín abajo con moldura
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) { c.fillStyle = k % 2 ? "rgba(20,26,36,0.06)" : "rgba(255,255,255,0.04)"; c.fillRect((k * 53) % w, (k * 29) % h, 3, 3); }
  c.fillStyle = zoclo; c.fillRect(0, h * 0.66, w, h * 0.34);
  for (let x = 0; x < w; x += 32) { c.fillStyle = "rgba(10,14,20,0.25)"; c.fillRect(x, h * 0.66, 3, h * 0.34); }
  c.fillStyle = "#2a2622"; c.fillRect(0, h * 0.655, w, 7); c.fillRect(0, h - 10, w, 10);
  // desgaste (referencia 7): manchas de humedad que bajan del techo, chorreados, raspones en el lambrín y orillas sucias
  for (let k = 0; k < 5; k++) {
    const x = ((k * 97 + 31) % w), r0 = 30 + (k % 3) * 18;
    const g = c.createRadialGradient(x, 0, 4, x, 0, r0 * 2.2); g.addColorStop(0, "rgba(70,62,48,0.32)"); g.addColorStop(0.6, "rgba(70,62,48,0.14)"); g.addColorStop(1, "rgba(70,62,48,0)");
    c.fillStyle = g; c.fillRect(x - r0 * 2.2, 0, r0 * 4.4, r0 * 2.2);
    c.strokeStyle = "rgba(60,54,44,0.18)"; c.lineWidth = 2 + (k % 2); c.beginPath(); c.moveTo(x + 6, r0); c.lineTo(x + 8, r0 + 40 + k * 14); c.stroke(); // chorreado
  }
  for (let k = 0; k < 14; k++) { c.fillStyle = "rgba(20,22,28,0.22)"; c.fillRect((k * 71) % w, h * 0.72 + ((k * 23) % (h * 0.2)), 8 + (k % 4) * 6, 2); } // raspones
  const go = c.createLinearGradient(0, h, 0, h * 0.55); go.addColorStop(0, "rgba(16,18,24,0.35)"); go.addColorStop(1, "rgba(16,18,24,0)"); c.fillStyle = go; c.fillRect(0, h * 0.55, w, h * 0.45); // suciedad abajo
  const gt = c.createLinearGradient(0, 0, 0, h * 0.25); gt.addColorStop(0, "rgba(16,18,24,0.35)"); gt.addColorStop(1, "rgba(16,18,24,0)"); c.fillStyle = gt; c.fillRect(0, 0, w, h * 0.25); // y arriba, junto al techo
}, 256, 256, [3, 1]);
const texTapete = () => lienzo((c, w, h) => { // tapete redondo de colores apagados
  c.fillStyle = "rgba(0,0,0,0)"; c.fillRect(0, 0, w, h);
  ["#6a3a3a", "#c8b48e", "#3a5a6a", "#c8b48e", "#6a3a3a"].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.ellipse(w / 2, h / 2, w / 2 - i * 22, h / 2 - i * 22, 0, 0, 7); c.fill(); });
}, 256, 256);
const texHoja = () => lienzo((c, w, h) => { // la hoja de reglas, escrita a mano con plumón (se lee a la primera)
  c.fillStyle = "#f4f0e2"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#b8c8dc"; c.lineWidth = 2; for (let y = 70; y < h; y += 46) { c.beginPath(); c.moveTo(16, y); c.lineTo(w - 16, y); c.stroke(); }
  c.strokeStyle = "#e0a0a0"; c.beginPath(); c.moveTo(44, 0); c.lineTo(44, h); c.stroke();
  c.fillStyle = "#b3262f"; c.font = "bold 44px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("¡LÉELA DOS VECES!", w / 2, 54);
  c.fillStyle = "#1c2a4a"; c.textAlign = "left";
  const reglas = ["1. DESPUÉS DE MEDIANOCHE,", "   NUNCA CARGUES AL BEBÉ.", "   AUNQUE LLORE.", "2. LA LUZ DEL PASILLO", "   NO SE APAGA.", "3. SI ALGUIEN CANTA POR EL", "   MONITOR, NO CONTESTES."];
  c.font = "bold 33px 'DejaVu Sans', sans-serif";
  reglas.forEach((t, i) => c.fillText(t, 56, 112 + i * 46 + (i >= 3 ? 14 : 0) + (i >= 5 ? 14 : 0)));
  c.fillStyle = "#1c2a4a"; c.font = "italic bold 30px 'DejaVu Sans', sans-serif"; c.fillText("— Mamá", w - 190, h - 26);
}, 600, 520);
const texCalle = () => lienzo((c, w, h) => { // lo que se ve por las ventanas: noche azul, luna, campo y el pueblo lejos
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0b1424"); g.addColorStop(0.6, "#1c2c44"); g.addColorStop(1, "#141c26"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 30; k++) { c.fillStyle = "rgba(220,230,255,0.7)"; c.fillRect((k * 71) % w, (k * 37) % (h * 0.45), 2, 2); }
  const lu = c.createRadialGradient(w * 0.7, h * 0.22, 4, w * 0.7, h * 0.22, 60); lu.addColorStop(0, "rgba(220,232,255,0.6)"); lu.addColorStop(1, "rgba(220,232,255,0)"); c.fillStyle = lu; c.fillRect(0, 0, w, h);
  c.fillStyle = "#eef3ff"; c.beginPath(); c.arc(w * 0.7, h * 0.22, 18, 0, 7); c.fill();
  c.fillStyle = "#0e141c"; c.beginPath(); c.moveTo(0, h * 0.66); c.quadraticCurveTo(w * 0.5, h * 0.56, w, h * 0.64); c.lineTo(w, h); c.lineTo(0, h); c.fill();
  for (let k = 0; k < 9; k++) { c.fillStyle = "#ffc56e"; c.fillRect(w * 0.08 + k * 11, h * 0.64 - (k % 3) * 3, 3, 3); } // el pueblo, lejos
  c.strokeStyle = "#0a0e14"; c.lineWidth = 6; c.beginPath(); c.moveTo(w * 0.86, h); c.lineTo(w * 0.88, h * 0.5); c.moveTo(w * 0.875, h * 0.62); c.lineTo(w * 0.96, h * 0.48); c.moveTo(w * 0.88, h * 0.55); c.lineTo(w * 0.8, h * 0.42); c.stroke(); // árbol seco
}, 256, 320);
const texCielo = () => lienzo((c, w, h) => {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#060b16"); g.addColorStop(0.7, "#14223a"); g.addColorStop(1, "#1c2c44"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 180; k++) { c.fillStyle = `rgba(220,230,255,${0.3 + (k % 5) * 0.12})`; c.fillRect((k * 131) % w, (k * 61) % (h * 0.75), k % 7 ? 1 : 2, k % 7 ? 1 : 2); }
}, 1024, 512);
const texCampo = () => lienzo((c, w, h) => { // pasto seco de noche
  c.fillStyle = "#1c2420"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { c.fillStyle = k % 3 ? "rgba(70,80,60,0.35)" : "rgba(10,14,12,0.4)"; c.fillRect((k * 37) % w, (k * 91) % h, 2, 6); }
}, 256, 256, [40, 40]);
const texTierra = () => lienzo((c, w, h) => {
  c.fillStyle = "#4a4036"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 600; k++) { c.fillStyle = k % 2 ? "rgba(20,16,12,0.3)" : "rgba(160,140,110,0.15)"; c.fillRect((k * 53) % w, (k * 29) % h, 3, 2); }
  c.fillStyle = "rgba(20,16,12,0.35)"; c.fillRect(w * 0.25, 0, 10, h); c.fillRect(w * 0.72, 0, 10, h); // huellas de llantas
}, 256, 256, [1, 20]);
const texTeja = () => lienzo((c, w, h) => {
  c.fillStyle = "#6a3424"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 12; x < w; x += 24) { c.fillStyle = "rgba(30,10,6,0.4)"; c.fillRect(x, y, 3, 16); c.fillStyle = "rgba(255,180,140,0.1)"; c.fillRect(x + 4, y + 2, 14, 4); }
  for (let y = 0; y < h; y += 16) { c.fillStyle = "rgba(20,8,4,0.5)"; c.fillRect(0, y, w, 2); }
}, 256, 256, [6, 3]);
const texFoto = () => lienzo((c, w, h) => { // foto familiar enmarcada (papás con el bebé, dibujo sencillo)
  c.fillStyle = "#c8d4dc"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#7a9a7a"; c.fillRect(0, h * 0.7, w, h * 0.3);
  for (const [x, col, r] of [[0.3, "#c49a7a", 0.13], [0.7, "#d2ae8e", 0.12], [0.5, "#e2b896", 0.08]] as [number, string, number][]) {
    c.fillStyle = col; c.beginPath(); c.arc(w * x, h * (r < 0.1 ? 0.55 : 0.4), w * r, 0, 7); c.fill();
    c.fillStyle = "#141012"; c.beginPath(); c.arc(w * x - w * r * 0.35, h * (r < 0.1 ? 0.55 : 0.4), 3, 0, 7); c.arc(w * x + w * r * 0.35, h * (r < 0.1 ? 0.55 : 0.4), 3, 0, 7); c.fill();
  }
  c.strokeStyle = "#3a2a1c"; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
}, 200, 160);
const texRejilla = () => lienzo((c, w, h) => { // bocina del monitor: rejilla de agujeritos
  c.fillStyle = "#e8e6e0"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#4a4a50"; for (let y = 10; y < h; y += 14) for (let x = 10 + ((y / 14) % 2) * 7; x < w; x += 14) { c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); }
}, 128, 96);
const texReloj = () => lienzo((c, w, h) => {
  c.fillStyle = "#f2ead6"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 7); c.fill(); c.lineWidth = 12; c.strokeStyle = "#2a2a30"; c.stroke();
  c.fillStyle = "#1a1410"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  for (let i = 1; i <= 12; i++) { const a = (i / 12) * Math.PI * 2 - Math.PI / 2; c.fillText(String(i), w / 2 + Math.cos(a) * w * 0.35, h / 2 + Math.sin(a) * h * 0.35); }
}, 256, 256);
const texTele = () => lienzo((c, w, h) => { // la tele prendida sin volumen: caricatura de colores apagados
  c.fillStyle = "#1a2a3a"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#3a6a8a"; c.fillRect(0, h * 0.6, w, h * 0.4);
  c.fillStyle = "#c8a24a"; c.beginPath(); c.arc(w * 0.3, h * 0.35, h * 0.15, 0, 7); c.fill();
  c.fillStyle = "#e8e4dc"; c.fillRect(w * 0.55, h * 0.3, w * 0.25, h * 0.35);
  c.fillStyle = "rgba(255,255,255,0.08)"; for (let y = 0; y < h; y += 4) c.fillRect(0, y, w, 1);
}, 256, 160);
const texCajon = () => lienzo((c, w, h) => { // frente de cómoda con tres cajones
  c.fillStyle = "#e6dccb"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 3; i++) { c.strokeStyle = "#8a7a62"; c.lineWidth = 5; c.strokeRect(12, 10 + i * h / 3, w - 24, h / 3 - 18); c.fillStyle = "#c8a24a"; c.beginPath(); c.arc(w / 2, 10 + i * h / 3 + (h / 3 - 18) / 2, 8, 0, 7); c.fill(); }
}, 256, 256);

const texTecho = () => lienzo((c, w, h) => { // plafón de paneles (como la referencia 7): gris oscuro con juntas y manchas
  c.fillStyle = "#4a4e56"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 4; k++) { const g = c.createRadialGradient((k * 89) % w, (k * 53) % h, 3, (k * 89) % w, (k * 53) % h, 60); g.addColorStop(0, "rgba(60,50,36,0.35)"); g.addColorStop(1, "rgba(60,50,36,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  c.fillStyle = "#24262c"; for (let x = 0; x < w; x += w / 2) c.fillRect(x, 0, 4, h); for (let y = 0; y < h; y += h / 2) c.fillRect(0, y, w, 4);
}, 256, 256, [6, 6]);
/** desgaste para muebles (referencia 7): el color con manchas oscuras, rayones claros y orillas sucias */
const texGastado = (base: string, rep: [number, number] = [1, 1]) => lienzo((c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 7; k++) { const x = (k * 71) % w, y = (k * 113) % h, g = c.createRadialGradient(x, y, 2, x, y, 30 + (k % 3) * 14); g.addColorStop(0, "rgba(18,16,14,0.28)"); g.addColorStop(1, "rgba(18,16,14,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  c.strokeStyle = "rgba(230,225,215,0.16)"; c.lineWidth = 1.5;
  for (let k = 0; k < 16; k++) { const x = (k * 37) % w, y = (k * 59) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 10 + (k % 5) * 6, y + 3 - (k % 3) * 3); c.stroke(); }
  for (let k = 0; k < 400; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.05)"; c.fillRect((k * 53) % w, (k * 29) % h, 2, 2); }
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(0.8, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(10,10,12,0.3)"); c.fillStyle = g; c.fillRect(0, 0, w, h);
}, 128, 128, rep);
/** la ventana dibujada con luz de luna sobre el piso (cuatro vidrios) */
const texLunaPiso = () => lienzo((c, w, h) => {
  c.clearRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(150,185,255,0.55)"); g.addColorStop(1, "rgba(150,185,255,0.05)");
  c.fillStyle = g; c.fillRect(w * 0.08, h * 0.04, w * 0.84, h * 0.92);
  c.clearRect(w * 0.47, 0, w * 0.06, h); c.clearRect(0, h * 0.47, w, h * 0.06); // la cruz de la ventana
  c.filter = "blur(6px)";
}, 128, 128);

/** Puerta con marco, tableros y perilla. abre: ángulo de la hoja (gira sobre la orilla izquierda, hacia adentro). */
const puerta = (ancho: number, alto: number, color: string, abre = 0) => {
  const g = new THREE.Group(), mMarco = lambert({ color: "#d8d2c4" });
  g.add(caja(0.07, alto + 0.07, 0.14, mMarco, -ancho / 2 - 0.035, (alto + 0.07) / 2, 0), caja(0.07, alto + 0.07, 0.14, mMarco, ancho / 2 + 0.035, (alto + 0.07) / 2, 0), caja(ancho + 0.14, 0.07, 0.14, mMarco, 0, alto + 0.035, 0));
  const hoja = new THREE.Group(); hoja.position.set(-ancho / 2, 0, 0); hoja.rotation.y = abre; g.add(hoja);
  const mH = lambert({ color });
  hoja.add(caja(ancho - 0.01, alto - 0.01, 0.04, mH, ancho / 2, alto / 2, 0));
  for (const y of [alto * 0.3, alto * 0.72]) for (const s of [1, -1]) hoja.add(caja(ancho * 0.7, alto * 0.3, 0.012, lambert({ color: new THREE.Color(color).multiplyScalar(0.85) }), ancho / 2, y, s * 0.026)); // tableros
  for (const s of [1, -1]) { hoja.add(cil(0.03, 0.03, 0.03, lambert({ color: "#c8a24a" }), ancho - 0.08, alto * 0.48, s * 0.05).rotateX(Math.PI / 2)); }
  return { g, hoja };
};

export function crearCasa() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#7a8cae", 0.32); raiz.add(amb);
  const hemi = new THREE.HemisphereLight("#6a7ca8", "#1a140e", 0.36); raiz.add(hemi);
  const mDuela = lambert({ map: texDuela() });
  const mTecho = lambert({ map: texTecho() });
  const mPared = lambert({ map: texPared("#7a8696", "#4f5a6a") });
  const mParedCuarto = lambert({ map: texPared("#8a96a6", "#c8d0dc") }); // cuarto del bebé: azul clarito con lambrín blanco
  const mCocina = lambert({ map: texPared("#8a8e88", "#5a6a62") });

  // ================================================================== SALA + COCINA
  const S = SALA, Wd = S.x1 - S.x0, Dd = S.z1 - S.z0, cx = (S.x0 + S.x1) / 2, cz = (S.z0 + S.z1) / 2;
  raiz.add(suelo(Wd, Dd, mDuela, cx, 0, cz));
  const techo = suelo(Wd, Dd, mTecho, cx, S.alto, cz); techo.rotation.x = Math.PI / 2; raiz.add(techo);
  // pared del fondo (z = 0) con el hueco del pasillo
  const P = PASILLO;
  raiz.add(plano(P.x0 - S.x0, S.alto, mPared, (S.x0 + P.x0) / 2, S.alto / 2, S.z0));
  raiz.add(plano(1.0 - P.x1, S.alto, mPared, (P.x1 + 1.0) / 2, S.alto / 2, S.z0));
  raiz.add(plano(S.x1 - 1.0, S.alto, mCocina, (1.0 + S.x1) / 2, S.alto / 2, S.z0));
  raiz.add(plano(P.x1 - P.x0, S.alto - P.alto, mPared, 0, (S.alto + P.alto) / 2, S.z0));
  const mMarcoB = lambert({ color: "#d8d2c4" });
  raiz.add(caja(0.07, P.alto, 0.14, mMarcoB, P.x0 - 0.035, P.alto / 2, 0), caja(0.07, P.alto, 0.14, mMarcoB, P.x1 + 0.035, P.alto / 2, 0), caja(P.x1 - P.x0 + 0.14, 0.07, 0.14, mMarcoB, 0, P.alto + 0.035, 0));
  // pared izquierda (x0) con ventana y puerta de la calle; derecha (cocina); de enfrente (z1)
  raiz.add(plano(Dd, S.alto, mPared, S.x0, S.alto / 2, cz, Math.PI / 2));
  raiz.add(plano(Dd, S.alto, mCocina, S.x1, S.alto / 2, cz, -Math.PI / 2));
  raiz.add(plano(1.0 - S.x0, S.alto, mPared, (S.x0 + 1.0) / 2, S.alto / 2, S.z1, Math.PI));
  raiz.add(plano(S.x1 - 1.0, S.alto, mCocina, (1.0 + S.x1) / 2, S.alto / 2, S.z1, Math.PI));
  // ventana de la sala (pared izquierda) con cortinas
  const ventana = (x: number, y: number, z: number, ry: number, w = 0.9, h = 1.05, cortina = "#5a3a4a") => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; raiz.add(g);
    g.add(plano(w, h, new THREE.MeshBasicMaterial({ map: texCalle(), toneMapped: false, color: "#b8c4d8" }), 0, 0, 0.006));
    const mM = lambert({ color: "#d8d2c4" });
    g.add(caja(w + 0.12, 0.06, 0.06, mM, 0, h / 2 + 0.03, 0.03), caja(w + 0.12, 0.06, 0.1, mM, 0, -h / 2 - 0.03, 0.05), caja(0.06, h, 0.06, mM, -w / 2 - 0.03, 0, 0.03), caja(0.06, h, 0.06, mM, w / 2 + 0.03, 0, 0.03));
    g.add(caja(0.035, h, 0.035, mM, 0, 0, 0.025), caja(w, 0.035, 0.035, mM, 0, 0, 0.026)); // cruz de la ventana
    g.add(cil(0.012, 0.012, w + 0.7, lambert({ color: "#3a2a1c" }), 0, h / 2 + 0.16, 0.12).rotateZ(Math.PI / 2)); // barra
    for (const s of [-1, 1]) g.add(caja(0.3, h + 0.28, 0.02, lambert({ color: cortina }), s * (w / 2 + 0.12), 0.02, 0.13));
    const luna = new THREE.SpotLight("#9fb6e8", 3.5, 7, 0.75, 0.6, 1.2); luna.position.set(0, 0.3, -0.4); const t = new THREE.Object3D(); t.position.set(0, -1.6, 2.6); g.add(luna, t); luna.target = t;
    return { g, luna };
  };
  const vSala = ventana(S.x0 + 0.012, 1.55, 1.3, Math.PI / 2);
  const lunaPiso = (x: number, z: number, w: number, d: number) => { const m = suelo(w, d, new THREE.MeshBasicMaterial({ map: texLunaPiso(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55 }), x, 0.014, z); m.layers.set(NOINK); m.rotation.z = Math.PI / 2; // 8 mm sobre los tapetes (§8.6c) raiz.add(m); return m; };
  lunaPiso(S.x0 + 1.0, 1.3, 1.0, 1.4);
  // puerta de la calle (pared izquierda, cerca del sillón)
  const pCalle = puerta(0.92, 2.05, "#5a3a2a"); pCalle.g.position.set(PUERTA_CALLE.x + 0.075, 0, PUERTA_CALLE.z); pCalle.g.rotation.y = Math.PI / 2; raiz.add(pCalle.g);
  raiz.add(plano(0.92, 2.05, lambert({ color: "#141820" }), PUERTA_CALLE.x - 0.02, 1.025, PUERTA_CALLE.z, Math.PI / 2)); // hueco oscuro detrás de la hoja

  // ---- sillón (mira hacia −z): base, asiento con dos cojines, respaldo con dos cojines, brazos, patas ----
  const So = SILLON, mTela = lambert({ map: texGastado("#6f8f86") }), mTelaOsc = lambert({ map: texGastado("#587870") }); // verde agua gastado: se distingue del piso y la pared
  const sillon = new THREE.Group(); sillon.position.set(So.x, 0, So.z); raiz.add(sillon);
  sillon.add(caja(So.ancho, 0.22, So.fondo, mTelaOsc, 0, 0.17, 0)); // base
  for (const s of [-0.5, 0.5]) { sillon.add(caja(So.ancho / 2 - 0.2, 0.12, So.fondo - 0.2, mTela, s * (So.ancho / 2 - 0.12), 0.32, -0.08)); } // cojines del asiento (arriba a 0.38)
  sillon.add(caja(So.ancho, 0.52, 0.2, mTelaOsc, 0, 0.52, So.fondo / 2 - 0.1)); // respaldo (hasta 0.78)
  for (const s of [-0.5, 0.5]) { const c2 = caja(So.ancho / 2 - 0.22, 0.4, 0.14, mTela, s * (So.ancho / 2 - 0.12), 0.6, So.fondo / 2 - 0.26); c2.rotation.x = -0.15; sillon.add(c2); } // cojines del respaldo
  for (const s of [-1, 1]) { sillon.add(caja(0.18, 0.52, So.fondo, mTelaOsc, s * (So.ancho / 2 - 0.09), 0.32, 0)); sillon.add(cil(0.1, 0.1, So.fondo, mTela, s * (So.ancho / 2 - 0.09), 0.58, 0).rotateX(Math.PI / 2)); } // brazos con rollo
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) sillon.add(cil(0.025, 0.02, 0.06, lambert({ color: "#2a1e16" }), sx * (So.ancho / 2 - 0.08), 0.03, sz * (So.fondo / 2 - 0.08)));
  const cobijaSillon = caja(0.5, 0.02, 0.45, lambert({ color: "#8a4a4a" }), 0.62, 0.395, -0.06); sillon.add(cobijaSillon); // cobija doblada a un lado
  // ---- mesita de centro con el monitor del bebé, una taza y un libro ----
  const M = MESITA, mMadera = lambert({ map: texGastado("#5a3e2c") });
  raiz.add(caja(1.0, 0.04, 0.55, mMadera, M.x, M.alto - 0.02, M.z));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) raiz.add(caja(0.04, M.alto - 0.04, 0.04, mMadera, M.x + sx * 0.45, (M.alto - 0.04) / 2, M.z + sz * 0.23));
  raiz.add(caja(0.92, 0.02, 0.47, mMadera, M.x, 0.12, M.z)); // repisa de abajo
  raiz.add(cil(0.04, 0.035, 0.09, lambert({ color: "#c8502a" }), M.x - 0.3, M.alto + 0.045, M.z - 0.08)); // taza
  raiz.add(caja(0.22, 0.03, 0.16, lambert({ color: "#2f63a2" }), M.x - 0.05, M.alto + 0.016, M.z + 0.1)); // libro
  // monitor de los papás: cuerpo blanco redondeado, antena, rejilla de bocina, 5 lucecitas de volumen y foco de encendido
  const monitor = new THREE.Group(); monitor.position.copy(MONITOR); monitor.rotation.y = 0.35; raiz.add(monitor);
  const mBlanco = lambert({ color: "#ecebe6" });
  monitor.add(caja(0.09, 0.14, 0.045, mBlanco, 0, 0.07, 0));
  monitor.add(cil(0.045, 0.045, 0.045, mBlanco, 0, 0.14, 0).rotateX(Math.PI / 2)); // tapa redonda de arriba
  monitor.add(cil(0.006, 0.006, 0.12, lambert({ color: "#2a2a30" }), 0.03, 0.22, -0.005)); // antena
  monitor.add(plano(0.07, 0.05, lambert({ map: texRejilla() }), 0, 0.1, 0.0235));
  const leds: THREE.Mesh[] = [];
  ["#5ad06a", "#5ad06a", "#d8d04a", "#e8963a", "#e8463a"].forEach((col, i) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.008, 0.004), new THREE.MeshBasicMaterial({ color: col, toneMapped: false })); l.position.set(-0.028 + i * 0.014, 0.05, 0.0245); l.layers.set(NOINK); monitor.add(l); leds.push(l); });
  const ledOn = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 6), brillo("#6af07a")); ledOn.position.set(0, 0.03, 0.024); ledOn.layers.set(NOINK); monitor.add(ledOn);
  const haloMonitor = destello(110, 240, 130, 0.25, 0.4); haloMonitor.position.set(0, 0.05, 0.05); monitor.add(haloMonitor);
  monitor.add(caja(0.1, 0.012, 0.06, lambert({ color: "#c8c6c0" }), 0, 0.006, 0)); // base
  // ---- tele sobre su mueble (pared del fondo, a la izquierda del pasillo) ----
  raiz.add(caja(1.3, 0.5, 0.42, mMadera, -2.05, 0.25, 0.23));
  for (const s of [-1, 1]) raiz.add(caja(0.58, 0.4, 0.01, lambert({ color: "#4a3222" }), -2.05 + s * 0.31, 0.25, 0.445)); // puertitas
  raiz.add(caja(1.05, 0.62, 0.06, lambert({ color: "#16161a" }), -2.05, 0.86, 0.12));
  const tele = plano(0.97, 0.54, new THREE.MeshBasicMaterial({ map: texTele(), toneMapped: false, color: "#8a9aaa" }), -2.05, 0.86, 0.153); tele.layers.set(NOINK); raiz.add(tele);
  raiz.add(caja(0.3, 0.03, 0.18, lambert({ color: "#16161a" }), -2.05, 0.515, 0.12));
  const luzTele = new THREE.PointLight("#8ab0e0", 1.6, 4.5, 1.5); luzTele.position.set(-2.05, 0.9, 0.7); raiz.add(luzTele);
  // ---- lámpara de pie (la única luz cálida de la sala) ----
  const LAMP = new THREE.Vector3(-0.15, 0, 3.75);
  raiz.add(cil(0.15, 0.17, 0.03, lambert({ color: "#2a2622" }), LAMP.x, 0.015, LAMP.z), cil(0.012, 0.012, 1.45, lambert({ color: "#2a2622" }), LAMP.x, 0.75, LAMP.z));
  const pantalla = cil(0.13, 0.22, 0.28, lambert({ color: "#e8d6b0", emissive: "#ffcf8a", emissiveIntensity: 0.55, side: THREE.DoubleSide }), LAMP.x, 1.52, LAMP.z, 24); raiz.add(pantalla);
  const haloLampara = destello(255, 210, 140, 1.4, 0.45); haloLampara.position.set(LAMP.x, 1.45, LAMP.z - 0.1); raiz.add(haloLampara);
  const luzLampara = new THREE.PointLight("#ffcf98", 3.4, 6.5, 1.3); luzLampara.position.set(LAMP.x, 1.35, LAMP.z - 0.15); raiz.add(luzLampara);
  // ---- tapete con juguetes; cuadros en la pared ----
  const tapete = suelo(2.2, 1.6, lambert({ map: texTapete(), transparent: true, alphaTest: 0.3 }), -1.4, 0.006, 2.5); raiz.add(tapete);
  const sonaja = new THREE.Group(); sonaja.position.set(-0.55, 0.035, 2.0); sonaja.rotation.y = 0.7; raiz.add(sonaja);
  sonaja.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), lambert({ color: "#e8b81c" })).translateX(0.06), cil(0.01, 0.01, 0.1, lambert({ color: "#e04a7a" }), -0.02, 0, 0).rotateZ(Math.PI / 2));
  ["#c8463a", "#3a7ac8", "#e8b81c"].forEach((col, i) => raiz.add(caja(0.07, 0.07, 0.07, lambert({ color: col }), -2.3 + i * 0.09, 0.041 + (i === 2 ? 0.07 : 0), 1.85 + (i === 2 ? -0.045 : 0)))); // cubos
  raiz.add(plano(0.5, 0.4, lambert({ map: texFoto() }), -2.05, 1.75, 0.012));
  raiz.add(plano(0.3, 0.24, lambert({ map: texFoto() }), S.x0 + 0.012, 1.75, 2.6, Math.PI / 2));

  // ---- cocina: refri, barra con estufa y fregadero, alacenas, reloj, frutero, foco ----
  const R = REFRI, mRefri = lambert({ map: texGastado("#dfe2e0") });
  const refri = new THREE.Group(); refri.position.set(R.x, 0, R.z); raiz.add(refri);
  refri.add(caja(R.fondo, R.alto, R.ancho, mRefri, 0, R.alto / 2, 0));
  const xf = -R.fondo / 2; // frente del refri
  refri.add(caja(0.012, 0.012, R.ancho - 0.02, lambert({ color: "#9aa0a2" }), xf - 0.004, 1.2, 0)); // junta entre congelador y refri
  for (const y of [1.45, 0.75]) refri.add(caja(0.04, y > 1 ? 0.3 : 0.5, 0.035, lambert({ color: "#b8bcbe" }), xf - 0.03, y, -R.ancho / 2 + 0.08)); // manijas
  ["#e04a3a", "#3a8ae0", "#e8c21c", "#5ab04a"].forEach((col, i) => refri.add(cil(0.022, 0.022, 0.012, lambert({ color: col }), xf - 0.01, 1.62 - (i % 2) * 0.1 + (i > 1 ? -0.95 : 0), 0.12 + (i % 2) * 0.14).rotateZ(Math.PI / 2))); // imanes
  const hoja = new THREE.Group(); hoja.position.copy(HOJA); hoja.rotation.y = -Math.PI / 2; raiz.add(hoja);
  hoja.add(plano(0.24, 0.21, lambert({ map: texHoja(), emissive: "#ffffff", emissiveMap: texHoja(), emissiveIntensity: 0.1 }), 0, 0, 0));
  hoja.add(cil(0.018, 0.018, 0.012, lambert({ color: "#e04a7a" }), -0.105, 0.095, 0.008).rotateX(Math.PI / 2)); // imán en la esquina (no tapa el texto)
  hoja.visible = false; // aparece cuando la mamá la pega
  const mBarra = lambert({ map: texGastado("#c8c0b0") }), mMueble = lambert({ map: texGastado("#6a4a3a") });
  raiz.add(caja(2.3, 0.86, 0.6, mMueble, 2.15, 0.43, 0.3), caja(2.36, 0.04, 0.64, mBarra, 2.15, 0.88, 0.32));
  for (let i = 0; i < 4; i++) raiz.add(caja(0.5, 0.7, 0.012, lambert({ color: "#5a3e30" }), 1.3 + i * 0.57, 0.42, 0.606), caja(0.012, 0.012, 0.012, lambert({ color: "#c8a24a" }), 1.5 + i * 0.57, 0.7, 0.616)); // puertas y jaladeras
  raiz.add(caja(0.6, 0.02, 0.5, lambert({ color: "#2a2a2e" }), 2.7, 0.91, 0.3)); // parrilla de la estufa
  for (let i = 0; i < 4; i++) raiz.add(cil(0.07, 0.07, 0.015, lambert({ color: "#141418" }), 2.55 + (i % 2) * 0.3, 0.925, 0.18 + Math.floor(i / 2) * 0.24));
  raiz.add(cil(0.12, 0.1, 0.16, lambert({ color: "#8a8e92" }), 2.55, 1.0, 0.42)); // olla
  raiz.add(caja(0.5, 0.025, 0.36, lambert({ color: "#9aa0a6" }), 1.55, 0.9, 0.3), caja(0.42, 0.01, 0.28, lambert({ color: "#3a4048" }), 1.55, 0.909, 0.3)); // fregadero
  raiz.add(cil(0.012, 0.012, 0.22, lambert({ color: "#b8bcc0" }), 1.55, 1.01, 0.08), cil(0.01, 0.01, 0.16, lambert({ color: "#b8bcc0" }), 1.55, 1.12, 0.15).rotateX(Math.PI / 2));
  raiz.add(caja(2.3, 0.62, 0.34, mMueble, 2.15, 1.95, 0.17));
  for (let i = 0; i < 4; i++) raiz.add(caja(0.52, 0.56, 0.012, lambert({ color: "#5a3e30" }), 1.3 + i * 0.57, 1.95, 0.346));
  const frutero = cil(0.13, 0.08, 0.07, lambert({ color: "#c8a060" }), 1.95, 0.935, 0.42); raiz.add(frutero);
  ["#d83a2a", "#e8b81c", "#d83a2a", "#5ab04a"].forEach((col, i) => raiz.add(new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), lambert({ color: col })).translateX(1.9 + (i % 2) * 0.09).translateY(0.99 + (i > 2 ? 0.05 : 0)).translateZ(0.38 + Math.floor(i / 2) * 0.07)));
  const reloj = new THREE.Group(); reloj.position.copy(RELOJ); raiz.add(reloj);
  reloj.add(cil(0.17, 0.17, 0.03, lambert({ color: "#2a2a30" }), 0, 0, 0.015).rotateX(Math.PI / 2));
  reloj.add(plano(0.3, 0.3, lambert({ map: texReloj(), emissive: "#ffffff", emissiveMap: texReloj(), emissiveIntensity: 0.1 }), 0, 0, 0.032));
  const manoHora = new THREE.Group(); manoHora.position.z = 0.04; reloj.add(manoHora); manoHora.add(caja(0.014, 0.08, 0.004, lambert({ color: "#141012" }), 0, 0.035, 0));
  const manoMin = new THREE.Group(); manoMin.position.z = 0.046; reloj.add(manoMin); manoMin.add(caja(0.009, 0.12, 0.004, lambert({ color: "#141012" }), 0, 0.055, 0));
  raiz.add(cil(0.006, 0.006, 0.25, lambert({ color: "#141012" }), 2.4, S.alto - 0.125, 2.0, 6));
  const bulboCocina = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), brillo("#fff0c8")); bulboCocina.position.set(2.4, S.alto - 0.3, 2.0); bulboCocina.layers.set(NOINK); raiz.add(bulboCocina);
  raiz.add(cil(0.06, 0.16, 0.12, lambert({ color: "#e8e2d2", side: THREE.DoubleSide }), 2.4, S.alto - 0.24, 2.0, 18));
  const haloCocina = destello(255, 225, 160, 1.3, 0.4); haloCocina.position.copy(bulboCocina.position); raiz.add(haloCocina);
  const luzCocina = new THREE.PointLight("#ffdcaa", 4.5, 7, 1.3); luzCocina.position.set(2.4, S.alto - 0.45, 2.0); raiz.add(luzCocina);

  // ================================================================== PASILLO
  const Lp = P.z1 - P.z0, czP = (P.z0 + P.z1) / 2;
  raiz.add(suelo(P.x1 - P.x0, Lp, mDuela, 0, 0, czP));
  const tP = suelo(P.x1 - P.x0, Lp, mTecho, 0, P.alto, czP); tP.rotation.x = Math.PI / 2; raiz.add(tP);
  raiz.add(suelo(0.7, Lp - 0.6, lambert({ color: "#5a2e2e" }), 0, 0.006, czP)); // tapete largo
  // paredes del pasillo con dos puertas cerradas (izquierda: baño; derecha: cuarto de los papás)
  const pBano = puerta(0.8, 2.0, "#e2ddd2"), pPapas = puerta(0.8, 2.0, "#e2ddd2");
  pBano.g.position.set(P.x0 + 0.075, 0, -1.4); pBano.g.rotation.y = Math.PI / 2; raiz.add(pBano.g);
  pPapas.g.position.set(P.x1 - 0.075, 0, -3.4); pPapas.g.rotation.y = -Math.PI / 2; raiz.add(pPapas.g);
  const tramo = (x: number, z0: number, z1: number, ry: number) => raiz.add(plano(z1 - z0, P.alto, mPared, x, P.alto / 2, (z0 + z1) / 2, ry));
  tramo(P.x0, P.z0, -1.86, Math.PI / 2); tramo(P.x0, -0.94, P.z1, Math.PI / 2); raiz.add(plano(0.92, P.alto - 2.0, mPared, P.x0, (P.alto + 2.0) / 2, -1.4, Math.PI / 2));
  tramo(P.x1, P.z0, -3.86, -Math.PI / 2); tramo(P.x1, -2.94, P.z1, -Math.PI / 2); raiz.add(plano(0.92, P.alto - 2.0, mPared, P.x1, (P.alto + 2.0) / 2, -3.4, -Math.PI / 2));
  raiz.add(plano(0.92, 2.0, lambert({ color: "#141820" }), P.x0 - 0.03, 1.0, -1.4, Math.PI / 2), plano(0.92, 2.0, lambert({ color: "#141820" }), P.x1 + 0.03, 1.0, -3.4, -Math.PI / 2));
  raiz.add(plano(0.36, 0.28, lambert({ map: texFoto() }), P.x1 - 0.012, 1.55, -1.3, -Math.PI / 2)); // foto de la familia en el pasillo
  // foco del pasillo: socket, bulbo y plafón; se apaga a las 12:30
  raiz.add(cil(0.07, 0.07, 0.03, lambert({ color: "#d8d2c4" }), FOCO_PASILLO.x, P.alto - 0.015, FOCO_PASILLO.z));
  raiz.add(cil(0.02, 0.02, 0.18, lambert({ color: "#2a2622" }), FOCO_PASILLO.x, P.alto - 0.12, FOCO_PASILLO.z));
  const mBulbo = new THREE.MeshBasicMaterial({ color: "#ffeec0", toneMapped: false });
  const bulboPasillo = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), mBulbo); bulboPasillo.scale.set(1, 1.25, 1); bulboPasillo.position.copy(FOCO_PASILLO); bulboPasillo.layers.set(NOINK); raiz.add(bulboPasillo);
  const haloPasillo = destello(255, 220, 150, 1.5, 0.5); haloPasillo.position.copy(FOCO_PASILLO); raiz.add(haloPasillo);
  const luzPasillo = new THREE.PointLight("#ffd8a0", 4.5, 6, 1.2); luzPasillo.position.set(FOCO_PASILLO.x, FOCO_PASILLO.y - 0.12, FOCO_PASILLO.z); raiz.add(luzPasillo);
  const charco = suelo(1.0, 2.4, new THREE.MeshBasicMaterial({ map: resplandor(255, 210, 140), transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }), 0, 0.012, FOCO_PASILLO.z); charco.layers.set(NOINK); raiz.add(charco); // charco de luz en el piso

  // ================================================================== CUARTO DEL BEBÉ
  const C = CUARTO, Wc = C.x1 - C.x0, Dc = C.z1 - C.z0, czC = (C.z0 + C.z1) / 2;
  raiz.add(suelo(Wc, Dc, mDuela, 0, 0, czC));
  const tC = suelo(Wc, Dc, mTecho, 0, C.alto, czC); tC.rotation.x = Math.PI / 2; raiz.add(tC);
  raiz.add(plano(Wc, C.alto, mParedCuarto, 0, C.alto / 2, C.z0));
  raiz.add(plano(Dc, C.alto, mParedCuarto, C.x0, C.alto / 2, czC, Math.PI / 2));
  raiz.add(plano(Dc, C.alto, mParedCuarto, C.x1, C.alto / 2, czC, -Math.PI / 2));
  // pared de la entrada (z = z1) con el hueco de la puerta, que está abierta hacia adentro
  raiz.add(plano(P.x0 - C.x0, C.alto, mParedCuarto, (C.x0 + P.x0) / 2, C.alto / 2, C.z1, Math.PI), plano(C.x1 - P.x1, C.alto, mParedCuarto, (P.x1 + C.x1) / 2, C.alto / 2, C.z1, Math.PI));
  raiz.add(plano(P.x1 - P.x0, P.alto - 2.12, mPared, 0, (P.alto + 2.12) / 2, C.z1 + 0.012)); // desde el pasillo solo se ve la franja sobre la puerta (el hueco queda abierto)
  const pCuarto = puerta(P.x1 - P.x0 - 0.14, 2.05, "#e8e4da", -1.25); pCuarto.g.position.set(0, 0, C.z1); raiz.add(pCuarto.g);
  // tapa la franja entre el marco y el techo (el pasillo es más bajo que la pared)
  raiz.add(plano(P.x1 - P.x0, C.alto - 2.12, mParedCuarto, 0, (C.alto + 2.12) / 2, C.z1 - 0.008, Math.PI));
  const vCuarto = ventana(C.x0 + 0.012, 1.45, -6.6, Math.PI / 2, 0.8, 0.95, "#e8c8d0");
  lunaPiso(C.x0 + 0.9, -6.6, 0.9, 1.2);
  // ---- cuna de barrotes: cuatro postes con perilla, barandales, barrotes, colchón, sábana, cobija, almohadita ----
  const K = CUNA, mCuna = lambert({ color: "#e8e2d6" }), mCunaOsc = lambert({ color: "#d4ccbc" });
  const cuna = new THREE.Group(); cuna.position.set(K.x, 0, K.z); raiz.add(cuna);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { cuna.add(caja(0.05, K.barandal + 0.06, 0.05, mCuna, sx * K.largo / 2, (K.barandal + 0.06) / 2, sz * K.ancho / 2)); cuna.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), mCuna).translateX(sx * K.largo / 2).translateY(K.barandal + 0.09).translateZ(sz * K.ancho / 2)); }
  for (const sz of [-1, 1]) for (const y of [K.colchon - 0.08, K.barandal]) cuna.add(caja(K.largo, 0.04, 0.035, mCunaOsc, 0, y, sz * K.ancho / 2));
  for (const sx of [-1, 1]) for (const y of [K.colchon - 0.08, K.barandal]) cuna.add(caja(0.035, 0.04, K.ancho, mCunaOsc, sx * K.largo / 2, y, 0));
  for (let i = 1; i < 12; i++) for (const sz of [-1, 1]) cuna.add(cil(0.011, 0.011, K.barandal - K.colchon + 0.08, mCuna, -K.largo / 2 + i * K.largo / 12, (K.barandal + K.colchon - 0.08) / 2, sz * K.ancho / 2, 8));
  for (let i = 1; i < 7; i++) for (const sx of [-1, 1]) cuna.add(cil(0.011, 0.011, K.barandal - K.colchon + 0.08, mCuna, sx * K.largo / 2, (K.barandal + K.colchon - 0.08) / 2, -K.ancho / 2 + i * K.ancho / 7, 8));
  cuna.add(caja(K.largo - 0.06, 0.12, K.ancho - 0.06, lambert({ color: "#f2f0ea" }), 0, K.colchon - 0.06, 0)); // colchón (arriba a K.colchon)
  cuna.add(caja(K.largo - 0.1, 0.012, K.ancho - 0.1, lambert({ color: "#d8e8f4" }), 0, K.colchon + 0.006, 0)); // sábana
  cuna.add(caja(0.26, 0.05, 0.4, lambert({ color: "#f8f6f0" }), -K.largo / 2 + 0.2, K.colchon + 0.037, 0)); // almohadita
  const cobijaCuna = caja(0.62, 0.03, K.ancho - 0.14, lambert({ color: "#9cc4e4" }), 0.24, K.colchon + 0.028, 0); cuna.add(cobijaCuna);
  // peluche (osito) en la esquina de la cuna
  const osito = new THREE.Group(); osito.position.set(K.largo / 2 - 0.15, K.colchon + 0.012, -K.ancho / 2 + 0.14); cuna.add(osito);
  const mOso = lambert({ color: "#a87a4a" });
  osito.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), mOso).translateY(0.07), new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 10), mOso).translateY(0.18));
  for (const s of [-1, 1]) osito.add(new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), mOso).translateX(s * 0.04).translateY(0.225));
  // móvil colgante: poste desde la cabecera, brazo, aro y cuatro figuras (estrella, luna, nube, osito) que giran
  const mMovil = lambert({ color: "#e8e2d6" });
  cuna.add(caja(0.025, 0.7, 0.025, mMovil, -K.largo / 2 + 0.03, K.barandal + 0.35, 0));
  cuna.add(caja(0.42, 0.022, 0.022, mMovil, -K.largo / 2 + 0.24, K.barandal + 0.69, 0));
  const movil = new THREE.Group(); movil.position.set(-K.largo / 2 + 0.44, K.barandal + 0.66, 0); cuna.add(movil);
  movil.add(new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.008, 6, 24), mMovil).rotateX(Math.PI / 2));
  const figs: [string, (g: THREE.Group) => void][] = [
    ["#f2d24a", (g) => { const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, rr = i % 2 ? 0.025 : 0.055; s[i ? "lineTo" : "moveTo"](Math.sin(a) * rr, Math.cos(a) * rr); } g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: false }), lambert({ color: "#f2d24a" }))); }],
    ["#e8e2c8", (g) => { const s = new THREE.Shape(); s.absarc(0, 0, 0.05, 0.6, Math.PI * 2 - 0.6, false); s.absarc(0.03, 0, 0.04, Math.PI * 2 - 0.9, 0.9, true); g.add(new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.015, bevelEnabled: false }), lambert({ color: "#e8e2c8" }))); }],
    ["#ffffff", (g) => { for (const [x, r] of [[-0.035, 0.03], [0, 0.042], [0.035, 0.03]]) g.add(new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), lambert({ color: "#f4f6fa" })).translateX(x)); }],
    ["#a87a4a", (g) => { g.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 8), mOso)); for (const s of [-1, 1]) g.add(new THREE.Mesh(new THREE.SphereGeometry(0.015, 8, 6), mOso).translateX(s * 0.03).translateY(0.035)); }],
  ];
  figs.forEach(([, hacer], i) => {
    const a = (i / 4) * Math.PI * 2, g = new THREE.Group(); g.position.set(Math.cos(a) * 0.16, -0.2, Math.sin(a) * 0.16); movil.add(g);
    movil.add(cil(0.002, 0.002, 0.16, lambert({ color: "#c8c0b0" }), Math.cos(a) * 0.16, -0.09, Math.sin(a) * 0.16, 4)); hacer(g);
  });
  // ---- cómoda con lamparita de noche y la cámara del monitor ----
  const Co = COMODA;
  raiz.add(caja(0.9, 0.85, 0.48, lambert({ map: texGastado("#e6dccb") }), Co.x, 0.425, Co.z));
  raiz.add(plano(0.88, 0.8, lambert({ map: texCajon() }), Co.x, 0.425, Co.z + 0.246));
  raiz.add(caja(0.94, 0.03, 0.52, lambert({ color: "#d4c8b2" }), Co.x, 0.865, Co.z));
  const LN = new THREE.Vector3(Co.x - 0.22, 0.88, Co.z - 0.02);
  raiz.add(cil(0.07, 0.08, 0.04, lambert({ color: "#c8a060" }), LN.x, LN.y + 0.02, LN.z), cil(0.012, 0.012, 0.16, lambert({ color: "#c8a060" }), LN.x, LN.y + 0.12, LN.z));
  const pantallaNoche = cil(0.07, 0.12, 0.14, lambert({ color: "#f4c890", emissive: "#ff9a50", emissiveIntensity: 0.6, side: THREE.DoubleSide }), LN.x, LN.y + 0.25, LN.z, 20); raiz.add(pantallaNoche);
  const haloNoche = destello(255, 170, 100, 0.9, 0.45); haloNoche.position.set(LN.x, LN.y + 0.24, LN.z + 0.05); raiz.add(haloNoche);
  const luzNoche = new THREE.PointLight("#ffa860", 2.4, 4.5, 1.4); luzNoche.position.set(LN.x + 0.1, LN.y + 0.3, LN.z + 0.3); raiz.add(luzNoche);
  const camara = new THREE.Group(); camara.position.set(Co.x + 0.22, 0.88, Co.z + 0.05); camara.rotation.y = 0.9; raiz.add(camara); // la cámara del monitor mira a la cuna
  camara.add(caja(0.08, 0.11, 0.06, mBlanco, 0, 0.055, 0), cil(0.03, 0.03, 0.02, lambert({ color: "#141418" }), 0, 0.075, 0.035).rotateX(Math.PI / 2));
  const ledCam = new THREE.Mesh(new THREE.SphereGeometry(0.006, 8, 6), brillo("#6af07a")); ledCam.position.set(0.025, 0.03, 0.031); ledCam.layers.set(NOINK); camara.add(ledCam);
  camara.add(cil(0.005, 0.005, 0.1, lambert({ color: "#2a2a30" }), -0.03, 0.15, 0));
  // ---- mecedora: dos patines curvos, asiento, respaldo de tablas, brazos ----
  const Me = MECEDORA, mMece = lambert({ map: texGastado("#7a5a3e") });
  const mece = new THREE.Group(); mece.position.set(Me.x, 0, Me.z); mece.rotation.y = 0.6; raiz.add(mece);
  for (const s of [-1, 1]) { const t = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.02, 6, 30, 0.75), mMece); t.rotation.set(0, Math.PI / 2, Math.PI / 2 + Math.PI - 0.375 + Math.PI); t.position.set(s * 0.22, 1.125, 0); mece.add(t); }
  mece.add(caja(0.5, 0.04, 0.46, mMece, 0, 0.42, 0));
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) mece.add(caja(0.035, 0.42, 0.035, mMece, sx * 0.22, 0.21, sz * 0.2));
  for (const s of [-1, 1]) mece.add(caja(0.04, 0.9, 0.04, mMece, s * 0.22, 0.85, 0.22));
  for (let i = 0; i < 5; i++) mece.add(caja(0.05, 0.62, 0.02, mMece, -0.16 + i * 0.08, 0.86, 0.225));
  mece.add(caja(0.5, 0.06, 0.04, mMece, 0, 1.28, 0.22));
  for (const s of [-1, 1]) mece.add(caja(0.05, 0.035, 0.5, mMece, s * 0.25, 0.66, 0), caja(0.03, 0.22, 0.03, mMece, s * 0.25, 0.54, -0.2));
  mece.add(caja(0.4, 0.06, 0.36, lambert({ color: "#c8a0b0" }), 0, 0.47, 0)); // cojín
  // repisa con peluches y cuadro de estrellas
  raiz.add(caja(0.8, 0.03, 0.2, lambert({ color: "#e6dccb" }), 1.2, 1.55, C.z0 + 0.1));
  ["#e8a0b0", "#a0c0e8", "#e8d080"].forEach((col, i) => raiz.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), lambert({ color: col })).translateX(0.95 + i * 0.25).translateY(1.625).translateZ(C.z0 + 0.1)));
  raiz.add(plano(0.6, 0.45, lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#1c2a4a"; c.fillRect(0, 0, w, h); c.fillStyle = "#f2d24a"; for (let k = 0; k < 14; k++) { c.beginPath(); c.arc((k * 67) % w, (k * 41) % h, 5 + (k % 3) * 2, 0, 7); c.fill(); } c.strokeStyle = "#e8e2d6"; c.lineWidth = 14; c.strokeRect(0, 0, w, h); }, 256, 192) }), -0.4, 1.85, C.z0 + 0.012));
  const tapeteCuarto = suelo(1.6, 1.2, lambert({ map: texTapete(), transparent: true, alphaTest: 0.3 }), 0, 0.006, -6.6); raiz.add(tapeteCuarto);

  // ================================================================== POR FUERA
  const fuera = new THREE.Group(); raiz.add(fuera);
  const mExt = lambert({ color: "#6a6460" }), mExt2 = lambert({ color: "#5e5854" });
  const gr = 0.15; // grosor de los muros (las caras de afuera quedan 15 cm afuera de las de adentro)
  fuera.add(caja(S.x1 - S.x0 + 2 * gr, S.alto + 0.2, S.z1 - S.z0 + 2 * gr, mExt, cx, (S.alto + 0.2) / 2, cz));
  fuera.add(caja(C.x1 - C.x0 + 2 * gr, C.alto + 0.15, -C.z0 + 2 * gr, mExt2, 0, (C.alto + 0.15) / 2, C.z0 / 2));
  // techo de teja a dos aguas sobre la parte grande; techo plano con pretil sobre el ala de atrás
  const mTeja = lambert({ map: texTeja() }), anchoT = S.x1 - S.x0 + 0.8, fondoT = S.z1 - S.z0 + 0.8, inc = 0.45;
  for (const s of [-1, 1]) { const t = caja(anchoT, 0.08, fondoT / 2 / Math.cos(inc) + 0.05, mTeja, cx, S.alto + 0.2 + Math.tan(inc) * fondoT / 4, cz + s * fondoT / 4); t.rotation.x = s * inc; fuera.add(t); }
  const fr = new THREE.Shape([new THREE.Vector2(-(S.z1 - S.z0) / 2 - gr, 0), new THREE.Vector2((S.z1 - S.z0) / 2 + gr, 0), new THREE.Vector2(0, Math.tan(inc) * ((S.z1 - S.z0) / 2 + gr))]);
  for (const x of [S.x0 - gr, S.x1 + gr]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(fr), lambert({ color: "#6a6460", side: THREE.DoubleSide })); m.position.set(x, S.alto + 0.2, cz); m.rotation.y = Math.PI / 2; fuera.add(m); }
  fuera.add(caja(C.x1 - C.x0 + 2 * gr + 0.1, 0.12, -C.z0 + 2 * gr + 0.1, lambert({ color: "#4a4440" }), 0, C.alto + 0.2, C.z0 / 2));
  // ventanas encendidas por fuera (la de la sala con la luz de la lámpara; la del cuarto, la lamparita)
  const ventFuera = (x: number, y: number, z: number, ry: number, col: string, w = 0.9, h = 1.05) => {
    const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; fuera.add(g);
    g.add(plano(w, h, brillo(col), 0, 0, 0)); g.add(caja(0.04, h, 0.03, lambert({ color: "#2a2622" }), 0, 0, 0.015), caja(w, 0.04, 0.03, lambert({ color: "#2a2622" }), 0, 0, 0.016));
    g.add(caja(w + 0.16, 0.06, 0.12, lambert({ color: "#d8d2c4" }), 0, -h / 2 - 0.03, 0.06), caja(w + 0.1, 0.06, 0.04, lambert({ color: "#d8d2c4" }), 0, h / 2 + 0.03, 0.02));
    const hl = destello(255, 200, 130, w * 2.2, 0.25); hl.position.set(0, 0, 0.1); g.add(hl);
  };
  ventFuera(S.x0 - gr - 0.006, 1.55, 1.3, -Math.PI / 2, "#e8b070");
  ventFuera(C.x0 - gr - 0.006, 1.45, -6.6, -Math.PI / 2, "#c87a48", 0.8, 0.95);
  ventFuera(S.x1 + gr + 0.006, 1.55, 2.6, Math.PI / 2, "#f2d098");
  // puerta de la calle por fuera, escalón y foco del porche
  fuera.add(caja(0.04, 2.05, 0.92, lambert({ color: "#5a3a2a" }), S.x0 - gr - 0.02, 1.025, PUERTA_CALLE.z));
  fuera.add(caja(0.5, 0.1, 1.3, lambert({ color: "#7a746c" }), S.x0 - gr - 0.25, 0.05, PUERTA_CALLE.z));
  const focoPorche = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), brillo("#ffe2a8")); focoPorche.position.set(S.x0 - gr - 0.12, 2.3, PUERTA_CALLE.z - 0.7); focoPorche.layers.set(NOINK); fuera.add(focoPorche);
  const haloPorche = destello(255, 210, 140, 1.8, 0.55); haloPorche.position.copy(focoPorche.position); fuera.add(haloPorche);
  const luzPorche = new THREE.PointLight("#ffcf90", 5, 8, 1.3); luzPorche.position.set(S.x0 - 0.9, 2.2, PUERTA_CALLE.z - 0.6); fuera.add(luzPorche);
  // terreno: campo, camino de tierra, cerca de postes con alambre, árbol seco, buzón; cielo con luna y el pueblo lejos
  fuera.add(suelo(400, 400, lambert({ map: texCampo() }), 0, -0.01, 0));
  fuera.add(suelo(3.2, 200, lambert({ map: texTierra() }), -9.5, -0.004, 0));
  fuera.add(suelo(1.2, 6.0, lambert({ map: texTierra() }), -6.2, -0.002, PUERTA_CALLE.z).rotateZ(Math.PI / 2)); // vereda a la puerta
  const mPoste = lambert({ color: "#3a2e24" });
  for (let i = 0; i < 26; i++) { const z = -30 + i * 2.6; if (Math.abs(z - PUERTA_CALLE.z) < 1.2) continue; fuera.add(caja(0.08, 1.1, 0.08, mPoste, -7.6, 0.55, z)); }
  for (const y of [0.55, 0.95]) fuera.add(cil(0.006, 0.006, 70, lambert({ color: "#4a4440" }), -7.62, y, 4, 4).rotateX(Math.PI / 2));
  const arbol = new THREE.Group(); arbol.position.set(-6.0, 0, -4.5); fuera.add(arbol);
  const mTronco = lambert({ color: "#241c16" });
  arbol.add(cil(0.12, 0.2, 3.2, mTronco, 0, 1.6, 0));
  for (const [a, b, l] of [[0.6, 0, 1.6], [-0.7, 1.2, 1.4], [0.4, 2.4, 1.2], [-0.5, 3.6, 1.1], [0.9, 4.6, 0.9]]) { const r = cil(0.03, 0.07, l, mTronco, 0, 0, 0); r.position.set(Math.sin(b) * Math.sin(a) * l / 2, 2.4 + (b % 2) * 0.5 + Math.cos(a) * l / 2, Math.cos(b) * Math.sin(a) * l / 2); r.rotation.set(Math.cos(b) * a, 0, -Math.sin(b) * a); arbol.add(r); }
  const buzon = new THREE.Group(); buzon.position.set(-8.0, 0, PUERTA_CALLE.z + 1.6); fuera.add(buzon);
  buzon.add(caja(0.06, 1.0, 0.06, mPoste, 0, 0.5, 0), caja(0.22, 0.2, 0.42, lambert({ color: "#3a4a5a" }), 0, 1.1, 0), caja(0.02, 0.14, 0.04, lambert({ color: "#c8263a" }), 0.12, 1.18, 0.12));
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ map: texCielo(), side: THREE.BackSide, toneMapped: false, fog: false })); fuera.add(cielo);
  const luna = new THREE.Mesh(new THREE.CircleGeometry(3.2, 32), brillo("#eef3ff")); luna.position.set(-80, 55, 60); luna.lookAt(0, 0, 0); luna.layers.set(NOINK); fuera.add(luna);
  const haloLuna = destello(200, 215, 255, 26, 0.35); haloLuna.position.copy(luna.position); fuera.add(haloLuna);
  const sol = new THREE.DirectionalLight("#8aa4d8", 1.15); sol.position.set(-40, 50, 30); fuera.add(sol); // luz de luna sobre el campo
  for (let k = 0; k < 40; k++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 6, 4), brillo(k % 4 ? "#ffc56e" : "#f2e8d0")); l.position.set(95 + (k % 7) * 4, 0.8 + (k % 3) * 0.6, -40 + k * 2.2); l.layers.set(NOINK); fuera.add(l); } // el pueblo, lejos
  const haloPueblo = destello(255, 190, 110, 60, 0.18); haloPueblo.position.set(100, 2, 4); fuera.add(haloPueblo);

  const luzExtra = new THREE.PointLight("#ffd9a8", 0, 4, 1.5); raiz.add(luzExtra);

  return {
    raiz, fuera, amb, hemi, luzLampara, haloLampara, pantalla, luzTele, tele, luzCocina, bulboCocina, haloCocina,
    bulboPasillo, mBulbo, haloPasillo, luzPasillo, charco, luzNoche, haloNoche, pantallaNoche, lunaSala: vSala.luna, lunaCuarto: vCuarto.luna,
    monitor, leds, ledOn, haloMonitor, hoja, manoHora, manoMin, movil, cuna, cobijaCuna, pCalle, luzExtra, luzPorche, mece, lucesFuera: [sol, luzPorche],
  };
}
export type Casa = ReturnType<typeof crearCasa>;
