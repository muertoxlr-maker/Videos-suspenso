// Escenario de «Hinterkaifeck» (mini documental, caso real de 1922). Todo de noche o al anochecer, con nieve:
//  · afuera: la granja (casa de dos pisos y granero pegados bajo un mismo techo de dos aguas con nieve, chimenea con
//    humo, ventanas con postigos que se prenden y apagan, puerta del granero de dos hojas, puertita del cuarto de
//    máquinas con el candado roto), la nieve con las huellas que vienen del bosque y no regresan, el bosque de pinos
//    alrededor, cerca de palos, leña, carreta, abrevadero, la granja del vecino a lo lejos; versiones «derribada»
//    (escombros) y «hoy» (campo vacío con una cruz de recuerdo);
//  · la cocina (estufa de azulejos verde, mesa, bancas, rincón con la cruz, alacena con platos, lámpara de aceite
//    colgada, ventana con la nieve), el ático (vigas, paja, baúles, la trampilla con su escalera), el granero (vacas
//    en sus establos, pesebre, paja, horquilla, farol) y la oficina de la policía (escritorio, expedientes, máquina de
//    escribir, mapa con alfileres).
// Acabado §8.9; §8.6c (capas ≥ 5 mm, las puertas se abren, nada se atraviesa) y §8.6d (cada cosa con sus piezas).
// Sin sangre ni nada cruel: lo que pasó se cuenta con luces que se apagan, puertas y sombras.
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { manchas } from "../ambulancia/ambulancia";

/** la granja: casa (x0 … casaX1) y granero (casaX1 … x1) bajo el mismo techo; el frente mira a −z (al bosque) */
export const G = { x0: -10, x1: 12, casaX1: -2, z0: -4.5, z1: 4.5, alto: 4.6, cumbre: 8.2, alero: 0.6 };
export const PUERTA_CASA = { x: -6, ancho: 1.0, alto: 2.1 };
export const PORTON = { x: 4, ancho: 3.2, alto: 3.2 }; // puerta del granero (dos hojas que abren hacia afuera)
export const PUERTITA = { x: 10, ancho: 0.95, alto: 2.0 }; // cuarto de máquinas: candado roto; ahí llegan las huellas
export const CHIMENEA = { x: -6, z: 1.0, arriba: 9.4 };
/** ventanas del frente de la casa: [x, y de abajo]; 0–1 abajo, 2–4 arriba */
export const VENTANAS: [number, number][] = [[-8.8, 1.0], [-3.4, 1.0], [-8.8, 3.0], [-6.0, 3.0], [-3.4, 3.0]];
/** huellas: del bosque (z = −26) a la puertita; solo de ida */
export const HUELLAS = { x0: 8.2, z0: -26, x1: PUERTITA.x, z1: G.z0 - 0.45, paso: 0.62 };
/** los cuartos de adentro (cada uno en su lugar, lejos de la granja) */
export const COCINA = { x: 100, z: 0, x0: -3, x1: 3, z0: -2.5, z1: 2.5, alto: 2.5 };
export const MESA = { x: 0, z: 0.3, alto: 0.76, largo: 1.7, ancho: 0.9 };
export const ATICO = { x: 200, z: 0, largo: 14, ancho: 9, alto: 3.6, trampa: { x: -4, z: 1.2 } };
export const GRANERO = { x: 300, z: 0, x0: -6, x1: 6, z0: -4, z1: 4, alto: 4.6 };
export const OFICINA = { x: 400, z: 0, x0: -2.6, x1: 2.6, z0: -2.2, z1: 2.2, alto: 2.8 };
export const ESCRITORIO = { x: 0, z: 0.6, alto: 0.78 };

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cil = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 14) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c;
};
const suelo = (w: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, d), m); p.rotation.x = -Math.PI / 2; p.position.set(x, y, z); return p;
};
const rz = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// ------------------------------------------------------------------ texturas
const texNieve = () => lienzo((c, w, h) => { // nieve: blanco azulado con ondas de viento y sombritas
  c.fillStyle = "#c8d2e0"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) { const x = rz(k) * w, y = rz(k + 50) * h, l = 30 + rz(k + 3) * 90; c.strokeStyle = k % 2 ? "rgba(150,166,190,0.35)" : "rgba(235,240,248,0.5)"; c.lineWidth = 2 + rz(k + 9) * 3; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 6, x + l, y + 2); c.stroke(); }
}, 512, 512, [40, 40]);
const texRevoque = () => lienzo((c, w, h) => { // la casa: cal blanca gastada, base gris y manchas de humedad
  c.fillStyle = "#c4bfb2"; c.fillRect(0, 0, w, h); manchas(c, w, h, 30, "60,56,48", 0.3);
  c.fillStyle = "#7a766c"; c.fillRect(0, h * 0.88, w, h * 0.12);
  c.fillStyle = "rgba(70,66,56,0.35)"; for (let k = 0; k < 40; k++) c.fillRect(rz(k) * w, rz(k + 9) * h * 0.85, 3, 20 + rz(k + 2) * 60);
}, 512, 512, [3, 1]);
const texTablas = (base = "#5a4632", rep: [number, number] = [6, 1]) => lienzo((c, w, h) => { // tablas verticales de madera vieja
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = ["rgba(0,0,0,0.0)", "rgba(0,0,0,0.12)", "rgba(255,240,220,0.05)", "rgba(0,0,0,0.2)"][i % 4]; c.fillRect(i * w / 8, 0, w / 8, h);
    c.fillStyle = "rgba(16,12,8,0.85)"; c.fillRect(i * w / 8, 0, 4, h);
    c.strokeStyle = "rgba(30,20,12,0.35)"; c.lineWidth = 1.5; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(i * w / 8 + 10 + k * 9, 0); c.lineTo(i * w / 8 + 12 + k * 9 + rz(i + k) * 8, h); c.stroke(); }
  }
  manchas(c, w, h, 16, "20,14,8", 0.3);
}, 512, 512, rep);
const texTejas = () => lienzo((c, w, h) => { // tejas oscuras con nieve encima (más nieve abajo, donde se junta)
  c.fillStyle = "#3a3634"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 24) for (let x = (y / 24) % 2 ? 0 : 16; x < w; x += 32) { c.fillStyle = "#2a2624"; c.fillRect(x, y + 18, 30, 6); }
  for (let k = 0; k < 160; k++) { c.fillStyle = `rgba(220,228,240,${0.55 + rz(k) * 0.35})`; c.beginPath(); c.ellipse(rz(k + 4) * w, rz(k + 8) * h, 20 + rz(k + 2) * 40, 6 + rz(k + 6) * 8, 0, 0, 7); c.fill(); }
}, 512, 512, [6, 2]);
const texPiso = () => lienzo((c, w, h) => { // duela ancha gastada
  c.fillStyle = "#5e4a36"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 6; i++) { c.fillStyle = i % 2 ? "rgba(0,0,0,0.12)" : "rgba(255,230,200,0.05)"; c.fillRect(0, i * h / 6, w, h / 6); c.fillStyle = "rgba(18,12,8,0.8)"; c.fillRect(0, i * h / 6, w, 3); }
  manchas(c, w, h, 14, "20,14,8", 0.3);
}, 256, 256, [3, 3]);
const texAzulejo = () => lienzo((c, w, h) => { // estufa de azulejos verde (Kachelofen)
  c.fillStyle = "#2e5a46"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) for (let x = 0; x < w; x += 32) {
    const g = c.createRadialGradient(x + 16, y + 16, 2, x + 16, y + 16, 20); g.addColorStop(0, "#4a8a6a"); g.addColorStop(1, "#24483a"); c.fillStyle = g; c.fillRect(x + 2, y + 2, 28, 28);
    c.strokeStyle = "#cfc8b0"; c.lineWidth = 2; c.strokeRect(x + 1, y + 1, 30, 30);
  }
}, 256, 256, [2, 3]);
const texPaja = () => lienzo((c, w, h) => {
  c.fillStyle = "#a8884a"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 700; k++) { const x = rz(k) * w, y = rz(k + 900) * h, a = rz(k + 3) * 3; c.strokeStyle = ["#c8a860", "#8a6a34", "#d8bc78", "#6a5028"][k % 4]; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * 18, y + Math.sin(a) * 18); c.stroke(); }
}, 256, 256, [2, 2]);
const texVaca = (n: number) => lienzo((c, w, h) => { // pelo blanco con manchas cafés
  c.fillStyle = "#e4dccc"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#5a3a24"; for (let k = 0; k < 7; k++) { c.beginPath(); c.ellipse(rz(n * 7 + k) * w, rz(n * 7 + k + 30) * h, 30 + rz(k + n) * 40, 22 + rz(k + 2 * n) * 30, rz(k) * 3, 0, 7); c.fill(); }
}, 256, 256);
const texHuella = () => lienzo((c, w, h) => { // huella de bota hundida en la nieve (punta hacia arriba del lienzo)
  c.clearRect(0, 0, w, h);
  c.fillStyle = "rgba(46,60,96,0.95)"; c.beginPath(); c.ellipse(w / 2, h * 0.33, w * 0.32, h * 0.25, 0, 0, 7); c.fill(); c.beginPath(); c.ellipse(w / 2, h * 0.76, w * 0.24, h * 0.16, 0, 0, 7); c.fill();
  c.fillStyle = "rgba(40,52,80,0.6)"; for (let k = 0; k < 5; k++) c.fillRect(w * 0.25, h * (0.18 + k * 0.07), w * 0.5, 3); // marcas de la suela
}, 64, 128);
const texPeriodico = () => lienzo((c, w, h) => { // periódico de Múnich (inventado: no copia ningún periódico real)
  c.fillStyle = "#d8d0b8"; c.fillRect(0, 0, w, h); manchas(c, w, h, 10, "120,100,60", 0.25);
  c.fillStyle = "#1a1612"; c.textAlign = "center"; c.font = "bold 58px 'DejaVu Serif', serif"; c.fillText("Münchner Abendblatt", w / 2, 78);
  c.fillRect(30, 96, w - 60, 4); c.font = "22px 'DejaVu Serif', serif"; c.fillText("MÜNCHEN · MÄRZ 1922", w / 2, 128); c.fillRect(30, 140, w - 60, 2);
  c.font = "bold 40px 'DejaVu Serif', serif"; c.fillText("Neue Nachrichten aus Bayern", w / 2, 196);
  for (let col = 0; col < 3; col++) for (let k = 0; k < 22; k++) { c.fillStyle = "rgba(30,26,20,0.75)"; c.fillRect(34 + col * (w - 60) / 3, 222 + k * 16, (w - 90) / 3 * (0.6 + rz(col * 30 + k) * 0.4), 6); }
  c.fillStyle = "#6a6458"; c.fillRect(w * 0.36, 230, w * 0.28, 150);
}, 512, 600);
const texExpediente = () => lienzo((c, w, h) => { // carpeta del caso con el sello rojo
  c.fillStyle = "#c8a870"; c.fillRect(0, 0, w, h); manchas(c, w, h, 12, "90,60,30", 0.3);
  c.fillStyle = "#e8e0cc"; c.fillRect(w * 0.12, h * 0.1, w * 0.76, h * 0.2); c.fillStyle = "#1a1612"; c.textAlign = "center";
  c.font = "bold 40px 'DejaVu Sans Mono', monospace"; c.fillText("CASO HINTERKAIFECK", w / 2, h * 0.18); c.font = "28px 'DejaVu Sans Mono', monospace"; c.fillText("31 · III · 1922", w / 2, h * 0.255);
  c.save(); c.translate(w / 2, h * 0.6); c.rotate(-0.18); c.strokeStyle = "#b8201e"; c.lineWidth = 8; c.strokeRect(-w * 0.36, -52, w * 0.72, 104);
  c.fillStyle = "#b8201e"; c.font = "bold 66px 'DejaVu Sans', sans-serif"; c.fillText("SIN RESOLVER", 0, 24); c.restore();
}, 512, 680);
const texMapa = () => lienzo((c, w, h) => { // mapa de la zona con alfileres
  c.fillStyle = "#d8ceb0"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#8a7a5a"; c.lineWidth = 2; for (let k = 0; k < 14; k++) { c.beginPath(); c.moveTo(rz(k) * w, 0); c.bezierCurveTo(rz(k + 1) * w, h * 0.3, rz(k + 2) * w, h * 0.6, rz(k + 3) * w, h); c.stroke(); }
  c.fillStyle = "rgba(60,100,60,0.35)"; for (let k = 0; k < 8; k++) { c.beginPath(); c.ellipse(rz(k + 7) * w, rz(k + 17) * h, 40 + rz(k) * 50, 30 + rz(k + 1) * 30, 0, 0, 7); c.fill(); }
  c.fillStyle = "#1a1612"; c.font = "bold 22px 'DejaVu Sans', sans-serif"; c.fillText("Gröbern", w * 0.2, h * 0.3); c.fillText("Waidhofen", w * 0.62, h * 0.72); c.fillText("Hinterkaifeck", w * 0.42, h * 0.5);
  for (let k = 0; k < 9; k++) { c.fillStyle = k === 0 ? "#c8201e" : "#2a4a8a"; c.beginPath(); c.arc(k === 0 ? w * 0.5 : rz(k + 40) * w, k === 0 ? h * 0.46 : rz(k + 50) * h, 7, 0, 7); c.fill(); }
}, 512, 384);

// ------------------------------------------------------------------ piezas
/** pino con nieve: tronco y tres conos (geometrías sueltas para juntarlas en una sola malla) */
const pinoGeo = (x: number, z: number, s: number): { verde: THREE.BufferGeometry[]; tronco: THREE.BufferGeometry[] } => {
  const verde: THREE.BufferGeometry[] = [], tronco: THREE.BufferGeometry[] = [];
  const t = new THREE.CylinderGeometry(0.12 * s, 0.18 * s, 1.6 * s, 6); t.translate(x, 0.8 * s, z); tronco.push(t);
  for (let k = 0; k < 3; k++) { const c = new THREE.ConeGeometry((1.7 - k * 0.42) * s, (2.4 - k * 0.3) * s, 8); c.translate(x, (1.6 + k * 1.25 + 1.1) * s, z); verde.push(c); }
  return { verde, tronco };
};
/** farol de aceite de 1922: base, globo de vidrio con jaula de alambre, tapa con chimenea y asa */
export const farol = () => {
  const g = new THREE.Group(), m = lambert({ color: "#3a3a36" });
  g.add(cil(0.07, 0.08, 0.05, m, 0, 0.025, 0), cil(0.03, 0.03, 0.02, m, 0, 0.06, 0));
  const vidrio = new THREE.Mesh(new THREE.SphereGeometry(0.065, 14, 10), brillo("#ffd38a")); vidrio.scale.y = 1.25; vidrio.position.y = 0.13; vidrio.layers.set(NOINK); g.add(vidrio);
  for (let k = 0; k < 4; k++) { const a = k / 4 * Math.PI * 2; g.add(cil(0.004, 0.004, 0.17, m, Math.sin(a) * 0.07, 0.13, Math.cos(a) * 0.07, 4)); }
  g.add(cil(0.05, 0.07, 0.03, m, 0, 0.225, 0), cil(0.02, 0.02, 0.05, m, 0, 0.26, 0));
  const asa = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.005, 5, 14, Math.PI), m); asa.position.y = 0.27; g.add(asa);
  const halo = destello(255, 210, 140, 0.55, 0.55); halo.position.y = 0.13; g.add(halo);
  return g;
};
/** vaca de lado: cuerpo, panza, cabeza con hocico, orejas, cuernos, patas, ubre y cola; mira hacia +x */
const vaca = (n: number) => {
  const g = new THREE.Group(), mP = lambert({ map: texVaca(n) }), mO = lambert({ color: "#2a1e16" }), mR = lambert({ color: "#d8a090" }), mC = lambert({ color: "#e0d8c0" });
  const cuerpo = new THREE.Mesh(new THREE.CapsuleGeometry(0.42, 1.1, 6, 12), mP); cuerpo.rotation.z = Math.PI / 2; cuerpo.position.y = 1.05; g.add(cuerpo);
  for (const [x, z] of [[-0.55, -0.2], [-0.55, 0.2], [0.5, -0.2], [0.5, 0.2]]) { g.add(cil(0.07, 0.06, 0.75, mP, x, 0.38, z, 8), cil(0.075, 0.075, 0.07, mO, x, 0.03, z, 8)); }
  const cabeza = new THREE.Group(); cabeza.position.set(1.0, 1.2, 0); g.add(cabeza);
  const cr = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.34, 0.3), mP); cr.rotation.z = -0.45; cabeza.add(cr);
  const hocico = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.2, 0.28), mR); hocico.position.set(0.2, -0.12, 0); hocico.rotation.z = -0.45; cabeza.add(hocico);
  for (const s of [-1, 1]) { cabeza.add(caja(0.08, 0.05, 0.16, mP, -0.08, 0.12, s * 0.22).rotateX(s * 0.3)); const cu = cil(0.015, 0.03, 0.18, mC, -0.12, 0.22, s * 0.12, 6); cu.rotation.x = s * 0.6; cabeza.add(cu); }
  for (const s of [-1, 1]) cabeza.add(new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), mO).translateX(0.04).translateY(0.05).translateZ(s * 0.15));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mR).translateX(-0.25).translateY(0.62));
  const cola = cil(0.02, 0.02, 0.7, mP, -0.98, 0.8, 0, 5); cola.rotation.z = -0.15; g.add(cola); g.add(cil(0.05, 0.02, 0.12, mO, -1.03, 0.42, 0, 6));
  return { g, cabeza, cola };
};
/** ventana con marco, cruz, vidrio que se prende (material propio) y postigos verdes */
const ventana = (w: number, h: number, mMarco: THREE.Material, mPostigo: THREE.Material | null) => {
  const g = new THREE.Group();
  const mVidrio = new THREE.MeshBasicMaterial({ color: "#141c2a", toneMapped: false }); const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mVidrio); vidrio.position.z = -0.006; g.add(vidrio);
  g.add(caja(w + 0.14, 0.08, 0.1, mMarco, 0, h / 2 + 0.04, 0), caja(w + 0.2, 0.08, 0.16, mMarco, 0, -h / 2 - 0.04, -0.03), caja(0.07, h, 0.1, mMarco, -w / 2 - 0.035, 0, 0), caja(0.07, h, 0.1, mMarco, w / 2 + 0.035, 0, 0));
  g.add(caja(0.04, h, 0.05, mMarco, 0, 0, -0.01), caja(w, 0.04, 0.05, mMarco, 0, h * 0.1, -0.01));
  if (mPostigo) for (const s of [-1, 1]) { const p = caja(w / 2 + 0.05, h + 0.06, 0.04, mPostigo, s * (w * 0.75 + 0.12), 0, -0.03); g.add(p); for (let k = 1; k < 4; k++) g.add(caja(w / 2 - 0.02, 0.02, 0.05, lambert({ color: "#1e3a2a" }), s * (w * 0.75 + 0.12), -h / 2 + k * h / 4, -0.035)); }
  const halo = destello(255, 200, 130, w * 2.6, 0); halo.position.z = 0.25; g.add(halo); // afuera de la ventana
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.6, h + 0.6), brillo("#c88a50")); fondo.position.z = -0.4; fondo.visible = false; g.add(fondo); // el cuarto prendido, detrás del vidrio
  return { g, mVidrio, halo, fondo };
};

// ------------------------------------------------------------------ escenario
export function crearEscenario() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#8a9cc0", 0.45), hemi = new THREE.HemisphereLight("#9fb4dc", "#2a3040", 0.6);
  const luna = new THREE.DirectionalLight("#aec2ee", 1.3); luna.position.set(-30, 40, -40); luna.target.position.set(0, 0, 0);
  raiz.add(amb, hemi, luna, luna.target);
  const luzExtra = new THREE.PointLight("#ffc890", 0, 9, 1.6); raiz.add(luzExtra);
  const luzExtra2 = new THREE.PointLight("#ffc890", 0, 6, 1.6); raiz.add(luzExtra2);

  // ================================================================ afuera
  const afuera = new THREE.Group(); raiz.add(afuera);
  const lunaDisco = new THREE.Mesh(new THREE.CircleGeometry(5, 32), brillo("#e8eefc")); lunaDisco.position.set(-90, 75, -170); lunaDisco.lookAt(0, 0, 0); lunaDisco.layers.set(NOINK); afuera.add(lunaDisco);
  const lunaHalo = destello(190, 210, 255, 46, 0.45); lunaHalo.position.copy(lunaDisco.position); afuera.add(lunaHalo);
  const nieve = suelo(600, 600, lambert({ map: texNieve() }), 0, 0, 0); afuera.add(nieve);
  // el bosque: pinos alrededor (abierto hacia el camino de la izquierda); todo en dos mallas para que sea ligero
  const verdes: THREE.BufferGeometry[] = [], troncos: THREE.BufferGeometry[] = [];
  for (let k = 0; k < 420; k++) {
    const a = rz(k) * Math.PI * 2, r = 24 + rz(k + 1) * 50, x = Math.sin(a) * r * 1.2, z = Math.cos(a) * r;
    if (x < -20 && Math.abs(z + 2) < 7) continue; // el camino
    if (Math.hypot(x + 31, z + 11) < 8 || Math.hypot(x + 24, z + 32) < 9) continue; // donde se paran las cámaras de lejos
    const p = pinoGeo(x, z, 1.4 + rz(k + 2) * 1.6); verdes.push(...p.verde); troncos.push(...p.tronco);
  }
  // la orilla del bosque de donde vienen las huellas (más cerca y tupida)
  for (let k = 0; k < 40; k++) { const x = -14 + k * 0.85 + rz(k + 5) * 0.6, z = -27 - rz(k + 9) * 5; const p = pinoGeo(x, z, 1.6 + rz(k + 3) * 1.3); verdes.push(...p.verde); troncos.push(...p.tronco); }
  const bosque = new THREE.Mesh(mergeGeometries(verdes), lambert({ color: "#1e3a32" })); afuera.add(bosque);
  const bosqueNieve = new THREE.Mesh(mergeGeometries(verdes.map((v) => v.clone().scale(1.0, 0.25, 1.0))), lambert({ color: "#b8c4d4" })); bosqueNieve.visible = false; // (reservado)
  afuera.add(new THREE.Mesh(mergeGeometries(troncos), lambert({ color: "#3a2a20" })));
  void bosqueNieve;

  // ---------------- la granja
  const granja = new THREE.Group(); afuera.add(granja);
  const mRev = lambert({ map: texRevoque() }), mTab = lambert({ map: texTablas() }), mMarco = lambert({ color: "#4a3a2a" }), mPost = lambert({ color: "#2e5a3e" }), mFierro = lambert({ color: "#2a2c30" });
  const largoCasa = G.casaX1 - G.x0, largoGr = G.x1 - G.casaX1, fondo = G.z1 - G.z0;
  // muros de la casa (frente con hueco de puerta) y del granero (con hueco del portón y de la puertita)
  const muroConHuecos = (x0: number, x1: number, z: number, m: THREE.Material, huecos: { x: number; w: number; h: number }[]) => {
    const forma = new THREE.Shape(); forma.moveTo(x0, 0); forma.lineTo(x1, 0); forma.lineTo(x1, G.alto); forma.lineTo(x0, G.alto); forma.lineTo(x0, 0);
    for (const hh of huecos) { const p = new THREE.Path(); p.moveTo(hh.x - hh.w / 2, 0.001); p.lineTo(hh.x - hh.w / 2, hh.h); p.lineTo(hh.x + hh.w / 2, hh.h); p.lineTo(hh.x + hh.w / 2, 0.001); p.lineTo(hh.x - hh.w / 2, 0.001); forma.holes.push(p); }
    const geo = new THREE.ShapeGeometry(forma); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) - x0) / (x1 - x0), uv.getY(i) / G.alto);
    const mm = new THREE.Mesh(geo, m); mm.position.z = z; if (z > 0) mm.rotation.y = Math.PI; return mm;
  };
  const mRevF = mRev.clone(); mRevF.map = texRevoque(); mRevF.map.repeat.set(1, 1);
  granja.add(muroConHuecos(G.x0, G.casaX1, G.z0, mRevF, [{ x: PUERTA_CASA.x, w: PUERTA_CASA.ancho, h: PUERTA_CASA.alto }]));
  const mTabF = lambert({ map: texTablas("#5a4632", [8, 1]) });
  granja.add(muroConHuecos(G.casaX1, G.x1, G.z0, mTabF, [{ x: PORTON.x, w: PORTON.ancho, h: PORTON.alto }, { x: PUERTITA.x, w: PUERTITA.ancho, h: PUERTITA.alto }]));
  granja.add(caja(largoCasa, G.alto, 0.2, mRev, (G.x0 + G.casaX1) / 2, G.alto / 2, G.z1 - 0.1), caja(largoGr, G.alto, 0.2, mTab, (G.casaX1 + G.x1) / 2, G.alto / 2, G.z1 - 0.1));
  granja.add(caja(0.2, G.alto, fondo, mRev, G.x0 + 0.1, G.alto / 2, 0), caja(0.2, G.alto, fondo, mTab, G.x1 - 0.1, G.alto / 2, 0));
  granja.add(caja(largoCasa + largoGr - 0.4, 0.2, fondo - 0.4, lambert({ color: "#1a1612" }), (G.x0 + G.x1) / 2, G.alto - 0.1, 0)); // techo interior (oscuro)
  granja.add(caja(largoCasa + largoGr - 0.4, G.alto - 0.2, fondo - 0.6, lambert({ color: "#0c0a0a" }), (G.x0 + G.x1) / 2, G.alto / 2, 0.2)); // adentro oscuro (lo que se ve por las puertas)
  granja.add(caja(0.12, G.alto, 0.12, mMarco, G.casaX1, G.alto / 2, G.z0 - 0.02)); // esquina casa / granero
  // hastiales (triángulos de los extremos) de tablas
  for (const [x, rot] of [[G.x0, -Math.PI / 2], [G.x1, Math.PI / 2]] as [number, number][]) {
    const f = new THREE.Shape(); f.moveTo(-G.z1, 0); f.lineTo(G.z1, 0); f.lineTo(0, G.cumbre - G.alto); f.lineTo(-G.z1, 0);
    const h = new THREE.Mesh(new THREE.ShapeGeometry(f), lambert({ map: texTablas("#4a3a2a", [0.5, 0.5]), side: THREE.DoubleSide })); h.position.set(x, G.alto, 0); h.rotation.y = rot; granja.add(h);
  }
  // techo de dos aguas con nieve (con alero), canto y caballete
  const mTejas = lambert({ map: texTejas(), side: THREE.DoubleSide });
  const pend = Math.hypot(G.z1 + G.alero, G.cumbre - G.alto + G.alero * (G.cumbre - G.alto) / G.z1), ang = Math.atan2(G.cumbre - G.alto, G.z1);
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(G.x1 - G.x0 + 2 * G.alero, 0.18, pend), [mTejas, mTejas, mTejas, lambert({ color: "#2a2422" }), mTejas, mTejas]);
    t.position.set((G.x0 + G.x1) / 2, (G.alto + G.cumbre) / 2 - G.alero * Math.tan(ang) / 2 + 0.05, s * (G.z1 + G.alero) / 2); t.rotation.x = s * ang; granja.add(t);
  }
  granja.add(caja(G.x1 - G.x0 + 2 * G.alero, 0.14, 0.3, lambert({ color: "#d8e0ec" }), (G.x0 + G.x1) / 2, G.cumbre + 0.12, 0)); // caballete con nieve
  for (const s of [-1, 1]) granja.add(caja(G.x1 - G.x0 + 2 * G.alero, 0.12, 0.16, mMarco, (G.x0 + G.x1) / 2, G.alto - G.alero * Math.tan(ang) - 0.02, s * (G.z1 + G.alero))); // canto del alero
  // chimenea de ladrillo con su tapa
  const mLadrillo = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#6a3a2e"; c.fillRect(0, 0, w, h); c.fillStyle = "#3a2420"; for (let y = 0; y < h; y += 16) { c.fillRect(0, y, w, 3); for (let x = (y / 16) % 2 ? 0 : 16; x < w; x += 32) c.fillRect(x, y, 3, 16); } }, 128, 128, [1, 3]) });
  granja.add(caja(0.75, CHIMENEA.arriba - 6.4, 0.75, mLadrillo, CHIMENEA.x, (CHIMENEA.arriba + 6.4) / 2, CHIMENEA.z), caja(0.95, 0.1, 0.95, lambert({ color: "#d0d8e4" }), CHIMENEA.x, CHIMENEA.arriba + 0.05, CHIMENEA.z));
  // ventanas de la casa (se prenden y apagan); ventanitas altas del granero (siempre oscuras)
  const ventanas = VENTANAS.map(([x, y]) => { const v = ventana(0.85, 1.0, mMarco, mPost); v.g.position.set(x, y + 0.5, G.z0 - 0.06); v.g.rotation.y = Math.PI; granja.add(v.g); return v; });
  for (const x of [1, 7, 11]) { const v = ventana(0.6, 0.45, mMarco, null); v.g.position.set(x, 3.4, G.z0 - 0.06); v.g.rotation.y = Math.PI; granja.add(v.g); }
  // puerta de la casa (tablas, cerrada) con su escalón y su farol apagado
  granja.add(caja(PUERTA_CASA.ancho, PUERTA_CASA.alto, 0.08, lambert({ color: "#4a3424" }), PUERTA_CASA.x, PUERTA_CASA.alto / 2, G.z0 + 0.06));
  for (let k = 1; k < 4; k++) granja.add(caja(0.015, PUERTA_CASA.alto - 0.1, 0.09, lambert({ color: "#2a1c12" }), PUERTA_CASA.x - PUERTA_CASA.ancho / 2 + k * PUERTA_CASA.ancho / 4, PUERTA_CASA.alto / 2, G.z0 + 0.05));
  granja.add(caja(PUERTA_CASA.ancho + 0.2, 0.08, 0.12, mMarco, PUERTA_CASA.x, PUERTA_CASA.alto + 0.04, G.z0 - 0.02), caja(1.5, 0.18, 0.8, lambert({ color: "#6a6a66" }), PUERTA_CASA.x, 0.09, G.z0 - 0.4));
  granja.add(cil(0.03, 0.03, 0.06, lambert({ color: "#a08a40" }), PUERTA_CASA.x + 0.35, 1.0, G.z0 - 0.02).rotateX(Math.PI / 2));
  // portón del granero: dos hojas con bisagras a los lados; abren hacia afuera (rotation.y)
  const hoja = (s: number) => {
    const g = new THREE.Group(); g.position.set(PORTON.x + s * PORTON.ancho / 2, 0, G.z0 - 0.02);
    const w = PORTON.ancho / 2 - 0.02, m = lambert({ map: texTablas("#4e3a28", [2, 1]) });
    g.add(caja(w, PORTON.alto - 0.04, 0.08, m, -s * w / 2, PORTON.alto / 2, 0));
    g.add(caja(w, 0.1, 0.1, mMarco, -s * w / 2, 0.4, -0.02), caja(w, 0.1, 0.1, mMarco, -s * w / 2, PORTON.alto - 0.4, -0.02));
    const diag = caja(0.1, Math.hypot(w, PORTON.alto - 0.8), 0.1, mMarco, -s * w / 2, PORTON.alto / 2, -0.02); diag.rotation.z = s * Math.atan2(w, PORTON.alto - 0.8); g.add(diag);
    for (const y of [0.5, PORTON.alto - 0.5]) g.add(caja(0.5, 0.06, 0.03, mFierro, -s * 0.25, y, -0.07));
    granja.add(g); return g;
  };
  const portonI = hoja(-1), portonD = hoja(1);
  granja.add(caja(PORTON.ancho + 0.3, 0.14, 0.14, mMarco, PORTON.x, PORTON.alto + 0.07, G.z0 - 0.04));
  // la puertita del cuarto de máquinas: entreabierta, con el candado roto colgando
  const puertita = new THREE.Group(); puertita.position.set(PUERTITA.x - PUERTITA.ancho / 2, 0, G.z0 - 0.03); granja.add(puertita);
  puertita.add(caja(PUERTITA.ancho, PUERTITA.alto - 0.03, 0.06, lambert({ map: texTablas("#4e3a28", [1.5, 1]) }), PUERTITA.ancho / 2, PUERTITA.alto / 2, 0));
  puertita.add(caja(0.18, 0.05, 0.03, mFierro, PUERTITA.ancho - 0.12, 1.05, -0.05));
  const candado = new THREE.Group(); candado.position.set(PUERTITA.ancho - 0.02, 0.92, -0.08); puertita.add(candado);
  candado.add(caja(0.08, 0.09, 0.03, lambert({ color: "#6a5a3a" }), 0, -0.05, 0)); const arco = new THREE.Mesh(new THREE.TorusGeometry(0.03, 0.007, 5, 10, Math.PI * 0.8), mFierro); arco.position.y = 0.01; arco.rotation.z = 0.6; candado.add(arco);
  candado.rotation.z = 0.5; candado.scale.setScalar(1.8);
  granja.add(caja(PUERTITA.ancho + 0.2, 0.08, 0.1, mMarco, PUERTITA.x, PUERTITA.alto + 0.04, G.z0 - 0.04));
  // nieve amontonada al pie de los muros y en los alféizares
  for (const [x0, x1] of [[G.x0, PUERTA_CASA.x - 0.8], [PUERTA_CASA.x + 0.8, PORTON.x - PORTON.ancho / 2 - 0.2], [PORTON.x + PORTON.ancho / 2 + 0.2, PUERTITA.x - 0.7]]) { const n = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, x1 - x0, 10, 1, false, 0, Math.PI), lambert({ color: "#c8d2e0" })); n.rotation.z = Math.PI / 2; n.position.set((x0 + x1) / 2, 0, G.z0 - 0.05); n.scale.set(1, 1, 0.8); granja.add(n); }
  // leña, carreta, abrevadero, cerca y el camino
  const mLena = lambert({ color: "#6a4a30" }), mCorte = lambert({ color: "#c8a070" });
  for (let k = 0; k < 4; k++) for (let j = 0; j < 9; j++) { const l = cil(0.11, 0.11, 0.9, mLena, G.x0 - 0.35, 0.12 + k * 0.21, G.z0 + 0.8 + j * 0.23 + (k % 2) * 0.11, 7); l.rotation.x = 0; l.rotation.z = Math.PI / 2; granja.add(l); granja.add(new THREE.Mesh(new THREE.CircleGeometry(0.1, 7), mCorte).translateX(G.x0 - 0.8).translateY(0.12 + k * 0.21).translateZ(G.z0 + 0.8 + j * 0.23 + (k % 2) * 0.11).rotateY(-Math.PI / 2)); }
  granja.add(caja(0.95, 0.06, 2.3, lambert({ color: "#d0d8e4" }), G.x0 - 0.35, 0.95, G.z0 + 1.7));
  const carreta = new THREE.Group(); carreta.position.set(-1.5, 0, -8.5); carreta.rotation.y = 0.4; granja.add(carreta);
  carreta.add(caja(1.3, 0.08, 2.4, mLena, 0, 0.7, 0)); for (const s of [-1, 1]) carreta.add(caja(0.06, 0.35, 2.4, mLena, s * 0.62, 0.9, 0));
  for (const s of [-1, 1]) for (const z of [-0.8, 0.8]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.045, 6, 18), mMarco); r.position.set(s * 0.72, 0.45, z); r.rotation.y = Math.PI / 2; carreta.add(r); for (let k = 0; k < 4; k++) { const ry = caja(0.03, 0.82, 0.03, mMarco, s * 0.72, 0.45, z); ry.rotation.x = k * Math.PI / 4; carreta.add(ry); } }
  const lanza = caja(0.07, 0.07, 1.6, mLena, 0, 0.55, -1.9); lanza.rotation.x = 0.25; carreta.add(lanza);
  carreta.add(caja(1.2, 0.06, 2.3, lambert({ color: "#d0d8e4" }), 0, 0.77, 0));
  granja.add(caja(1.8, 0.5, 0.6, lambert({ color: "#5a5a56" }), 7.5, 0.25, -6.3), caja(1.6, 0.03, 0.45, lambert({ color: "#9ab0c8" }), 7.5, 0.47, -6.3)); // abrevadero con agua congelada
  for (let k = 0; k < 16; k++) { const x = -22 + k * 1.3; granja.add(cil(0.05, 0.06, 1.2, mLena, x, 0.6, -9.5, 6)); if (k) { granja.add(caja(1.3, 0.06, 0.04, mLena, x - 0.65, 0.95, -9.5), caja(1.3, 0.06, 0.04, mLena, x - 0.65, 0.55, -9.5)); } }
  afuera.add(suelo(4, 60, lambert({ color: "#a8b4c6" }), -40, 0.003, -2).rotateZ(Math.PI / 2)); // el camino (nieve pisada)
  // la granja del vecino a lo lejos, con una ventana prendida
  const vecino = new THREE.Group(); vecino.position.set(-70, 0, -55); vecino.rotation.y = 0.5; afuera.add(vecino);
  vecino.add(caja(10, 4, 6, lambert({ color: "#8a8478" }), 0, 2, 0)); const tv = caja(11, 0.2, 4.2, lambert({ color: "#c8d2e0" }), 0, 5.2, -1.6); tv.rotation.x = -0.6; vecino.add(tv); const tv2 = tv.clone(); tv2.position.z = 1.6; tv2.rotation.x = 0.6; vecino.add(tv2);
  vecino.add(caja(0.8, 0.8, 0.05, brillo("#ffcf8a"), -2, 2, -3.03)); const hv = destello(255, 200, 130, 3, 0.6); hv.position.set(-2, 2, -3.3); vecino.add(hv);
  // humo de la chimenea: bolitas que suben y se abren
  const mHumo = (k: number) => new THREE.SpriteMaterial({ map: resplandor(255, 255, 255), transparent: true, depthWrite: false, opacity: 0, color: k % 2 ? "#c8ccd6" : "#aeb4c0" });
  const humo = Array.from({ length: 10 }, (_, k) => { const s = new THREE.Sprite(mHumo(k)); s.layers.set(NOINK); afuera.add(s); return s; });
  // huellas: de la orilla del bosque a la puertita (solo de ida)
  const H = HUELLAS, mHuella = new THREE.MeshBasicMaterial({ map: texHuella(), transparent: true, depthWrite: false, toneMapped: false });
  const largoH = Math.hypot(H.x1 - H.x0, H.z1 - H.z0), nH = Math.floor(largoH / H.paso), dirH = Math.atan2(H.x1 - H.x0, H.z1 - H.z0);
  const huellas: THREE.Mesh[] = [];
  for (let k = 0; k < nH; k++) {
    const t = k / nH, lado = k % 2 ? 1 : -1, x = lerp(H.x0, H.x1, t) + Math.cos(dirH) * lado * 0.13 + (rz(k) - 0.5) * 0.05, z = lerp(H.z0, H.z1, t) - Math.sin(dirH) * lado * 0.13;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.38), mHuella); p.rotation.order = "YXZ"; p.rotation.set(-Math.PI / 2, dirH + (rz(k + 3) - 0.5) * 0.15, 0); p.position.set(x, 0.008, z); p.layers.set(NOINK); afuera.add(p); huellas.push(p);
  }
  // derribada (1923): muros rotos, vigas y piedras; la chimenea quedó parada
  const ruinas = new THREE.Group(); ruinas.visible = false; afuera.add(ruinas);
  for (let k = 0; k < 14; k++) { const x = lerp(G.x0, G.x1, rz(k + 1)), z = lerp(G.z0, G.z1, rz(k + 2)), v = caja(0.18, 0.18, 2 + rz(k) * 3, mMarco, x, 0.2 + rz(k + 4) * 0.6, z); v.rotation.set(rz(k + 5) * 0.6, rz(k + 6) * 3, rz(k + 7) * 0.5); ruinas.add(v); }
  for (let k = 0; k < 30; k++) { const s = 0.25 + rz(k + 11) * 0.5; ruinas.add(caja(s, s * 0.6, s, lambert({ color: k % 3 ? "#8a8478" : "#6a3a2e" }), lerp(G.x0, G.x1, rz(k + 12)), s * 0.3, lerp(G.z0, G.z1, rz(k + 13)))); }
  for (const [x0, x1, h] of [[G.x0, -6, 1.6], [-4, G.casaX1, 0.9]] as [number, number, number][]) ruinas.add(caja(x1 - x0, h, 0.2, mRev, (x0 + x1) / 2, h / 2, G.z0 + 0.1));
  ruinas.add(caja(0.75, 3.2, 0.75, mLadrillo, CHIMENEA.x, 1.6, CHIMENEA.z));
  ruinas.add(caja(G.x1 - G.x0, 0.12, fondo, lambert({ color: "#c8d2e0" }), (G.x0 + G.x1) / 2, 0.02, 0)); // nieve sobre lo que quedó
  // hoy: la cruz de recuerdo (de madera, con su techito) en el campo vacío
  const cruz = new THREE.Group(); cruz.visible = false; cruz.position.set(1.0, 0, -1.0); afuera.add(cruz);
  cruz.add(caja(0.6, 0.4, 0.6, lambert({ color: "#7a7670" }), 0, 0.2, 0), caja(0.12, 2.2, 0.12, mLena, 0, 1.4, 0), caja(0.9, 0.12, 0.12, mLena, 0, 2.0, 0));
  for (const s of [-1, 1]) { const t = caja(0.5, 0.04, 0.4, mLena, s * 0.2, 2.65, 0); t.rotation.z = -s * 0.6; cruz.add(t); }
  cruz.add(caja(0.5, 0.3, 0.02, lambert({ color: "#d8d0b8" }), 0, 1.55, -0.07));
  const flores = [0.2, -0.15, 0.05].map((x, k) => { const f = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), lambert({ color: ["#b82a2a", "#d8c040", "#b82a2a"][k] })); f.position.set(x, 0.45, -0.25); cruz.add(f); return f; });
  void flores;

  // ================================================================ la cocina
  const cocina = new THREE.Group(); cocina.position.set(COCINA.x, 0, COCINA.z); raiz.add(cocina);
  const C = COCINA, anchoC = C.x1 - C.x0, fondoC = C.z1 - C.z0;
  const mParedC = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#b8ae98"; c.fillRect(0, 0, w, h); manchas(c, w, h, 20, "70,60,40", 0.3); c.fillStyle = "#5a4430"; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = "rgba(0,0,0,0.3)"; for (let x = 0; x < w; x += 32) c.fillRect(x, h * 0.62, 3, h * 0.38); c.fillStyle = "#3a2a1c"; c.fillRect(0, h * 0.6, w, 8); }, 256, 256, [4, 1]), side: THREE.BackSide });
  const cuartoC = new THREE.Mesh(new THREE.BoxGeometry(anchoC, C.alto, fondoC), mParedC); cuartoC.position.y = C.alto / 2; cocina.add(cuartoC);
  cocina.add(suelo(anchoC - 0.01, fondoC - 0.01, lambert({ map: texPiso() }), 0, 0.006, 0));
  const techoC = new THREE.Mesh(new THREE.PlaneGeometry(anchoC, fondoC), lambert({ map: texTablas("#3e3024", [5, 1]) })); techoC.rotation.x = Math.PI / 2; techoC.position.y = C.alto - 0.01; cocina.add(techoC);
  for (let k = 0; k < 5; k++) cocina.add(caja(0.16, 0.18, fondoC, lambert({ color: "#2e2218" }), C.x0 + 0.6 + k * 1.2, C.alto - 0.1, 0)); // vigas del techo
  // estufa de azulejos (Kachelofen) en la esquina con su banca alrededor y su tubo
  const mAz = lambert({ map: texAzulejo() });
  cocina.add(caja(1.1, 1.5, 1.0, mAz, C.x1 - 0.65, 0.75, C.z1 - 0.6), caja(1.2, 0.08, 1.1, lambert({ color: "#cfc8b0" }), C.x1 - 0.65, 1.54, C.z1 - 0.6), caja(0.9, 0.5, 0.8, mAz, C.x1 - 0.65, 1.83, C.z1 - 0.6));
  cocina.add(caja(0.5, 0.35, 0.05, lambert({ color: "#1a1a18" }), C.x1 - 0.65, 0.5, C.z1 - 1.12), cil(0.12, 0.12, 0.5, mFierro, C.x1 - 0.65, 2.3, C.z1 - 0.4));
  const fuegoC = destello(255, 150, 70, 0.6, 0.5); fuegoC.position.set(C.x1 - 0.65, 0.5, C.z1 - 1.16); cocina.add(fuegoC);
  cocina.add(caja(1.6, 0.06, 0.4, mMarco, C.x1 - 1.0, 0.45, C.z1 - 1.3), caja(0.06, 0.45, 0.4, mMarco, C.x1 - 1.75, 0.22, C.z1 - 1.3));
  // la mesa, dos bancas y una silla
  const M = MESA, mMesa = lambert({ color: "#7a5a3a" });
  cocina.add(caja(M.largo, 0.06, M.ancho, mMesa, M.x, M.alto - 0.03, M.z));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cocina.add(caja(0.07, M.alto - 0.06, 0.07, mMarco, M.x + sx * (M.largo / 2 - 0.1), (M.alto - 0.06) / 2, M.z + sz * (M.ancho / 2 - 0.1)));
  cocina.add(caja(M.largo - 0.2, 0.08, 0.12, mMarco, M.x, M.alto - 0.12, M.z - M.ancho / 2 + 0.1));
  for (const s of [-1, 1]) { cocina.add(caja(M.largo, 0.05, 0.3, mMesa, M.x, 0.45, M.z + s * (M.ancho / 2 + 0.3))); for (const sx of [-1, 1]) cocina.add(caja(0.05, 0.43, 0.25, mMarco, M.x + sx * (M.largo / 2 - 0.15), 0.215, M.z + s * (M.ancho / 2 + 0.3))); }
  const silla = new THREE.Group(); silla.position.set(M.x + M.largo / 2 + 0.45, 0, M.z + 0.05); silla.rotation.y = -0.35; cocina.add(silla); // la silla «echada para atrás»
  silla.add(caja(0.42, 0.05, 0.42, mMesa, 0, 0.45, 0)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) silla.add(caja(0.04, 0.45, 0.04, mMarco, sx * 0.18, 0.225, sz * 0.18));
  silla.add(caja(0.42, 0.5, 0.04, mMesa, 0, 0.72, 0.19));
  // cosas en la mesa: el periódico, plato con pan, taza (con vapor), cuchara; mantel a cuadros
  cocina.add(caja(M.largo * 0.7, 0.005, M.ancho * 0.8, lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#d8d0c0"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(160,40,40,0.5)"; for (let x = 0; x < w; x += 32) c.fillRect(x, 0, 14, h); for (let y = 0; y < h; y += 32) c.fillRect(0, y, w, 14); }, 128, 128, [3, 2]) }), M.x, M.alto + 0.003, M.z));
  const periodico = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.5), lambert({ map: texPeriodico() })); periodico.rotation.x = -Math.PI / 2; periodico.rotation.z = 0.25 + Math.PI; periodico.position.set(M.x - 0.35, M.alto + 0.012, M.z - 0.05); periodico.visible = false; cocina.add(periodico);
  const comida = new THREE.Group(); comida.visible = false; comida.position.set(M.x + 0.45, M.alto + 0.006, M.z + 0.05); cocina.add(comida);
  comida.add(cil(0.14, 0.11, 0.025, lambert({ color: "#e8e4d8" }), 0, 0.012, 0, 20), cil(0.07, 0.08, 0.06, lambert({ color: "#a87838" }), 0.02, 0.05, 0, 12).rotateZ(Math.PI / 2));
  comida.add(cil(0.045, 0.04, 0.09, lambert({ color: "#d8d4c4" }), -0.2, 0.045, -0.12, 14), caja(0.02, 0.005, 0.14, lambert({ color: "#9a9a96" }), 0.18, 0.004, 0.08));
  const vapor = destello(220, 225, 235, 0.25, 0); vapor.material.blending = THREE.NormalBlending; vapor.position.set(-0.2, 0.18, -0.12); comida.add(vapor);
  // rincón con la cruz (repisa en la esquina) y la alacena con platos
  cocina.add(caja(0.5, 0.04, 0.5, mMarco, C.x0 + 0.3, 1.75, C.z1 - 0.3).rotateY(Math.PI / 4), caja(0.03, 0.4, 0.02, lambert({ color: "#3a2a1a" }), C.x0 + 0.25, 2.0, C.z1 - 0.25), caja(0.22, 0.03, 0.02, lambert({ color: "#3a2a1a" }), C.x0 + 0.25, 2.08, C.z1 - 0.25));
  const alacena = new THREE.Group(); alacena.position.set(-1.0, 0, C.z1 - 0.25); cocina.add(alacena);
  alacena.add(caja(1.3, 0.9, 0.45, mMesa, 0, 0.45, 0), caja(1.3, 0.04, 0.48, mMarco, 0, 0.92, 0), caja(1.2, 0.9, 0.08, mMesa, 0, 1.4, 0.16));
  for (const y of [1.2, 1.55]) alacena.add(caja(1.2, 0.03, 0.22, mMarco, 0, y, 0.06));
  for (let k = 0; k < 5; k++) for (const y of [1.36, 1.71]) { const p = cil(0.09, 0.09, 0.015, lambert({ color: k % 2 ? "#e0dcd0" : "#4a6a9a" }), -0.48 + k * 0.24, y, 0.1, 18); p.rotation.x = Math.PI / 2 - 0.2; alacena.add(p); }
  for (const s of [-1, 1]) alacena.add(caja(0.58, 0.8, 0.02, lambert({ color: "#6a4a30" }), s * 0.32, 0.46, -0.235), cil(0.02, 0.02, 0.03, lambert({ color: "#a08a40" }), s * 0.08, 0.6, -0.25));
  // ventana (noche con nieve afuera) y la puerta
  const vC = ventana(0.8, 0.9, mMarco, null); vC.g.position.set(-1.0, 1.45, C.z0 + 0.06); cocina.add(vC.g); vC.mVidrio.color.set("#30406a");
  cocina.add(caja(0.95, 2.0, 0.06, lambert({ color: "#4a3424" }), C.x0 + 0.04, 1.0, -0.8).rotateY(Math.PI / 2));
  // la lámpara de aceite colgada sobre la mesa (se mece) con su luz
  const lamparaC = new THREE.Group(); lamparaC.position.set(M.x, C.alto, M.z); cocina.add(lamparaC);
  lamparaC.add(cil(0.006, 0.006, 0.6, mFierro, 0, -0.3, 0, 4)); const pantalla = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.14, 16, 1, true), lambert({ color: "#e0d8c0", side: THREE.DoubleSide })); pantalla.position.y = -0.62; lamparaC.add(pantalla);
  const vidrioC = new THREE.Mesh(new THREE.SphereGeometry(0.06, 12, 8), brillo("#ffd890")); vidrioC.position.y = -0.72; vidrioC.layers.set(NOINK); lamparaC.add(vidrioC);
  const luzC = new THREE.PointLight("#ffc880", 4, 7, 1.4); luzC.position.y = -0.8; lamparaC.add(luzC);
  const haloC = destello(255, 200, 130, 0.8, 0.5); haloC.position.y = -0.72; lamparaC.add(haloC);

  // ================================================================ el ático
  const atico = new THREE.Group(); atico.position.set(ATICO.x, 0, ATICO.z); raiz.add(atico);
  const A = ATICO, mViga = lambert({ color: "#4a3626" }), mVigaO = lambert({ color: "#3a2a1e" });
  atico.add(suelo(A.largo, A.ancho, lambert({ map: texPiso() }), 0, 0, 0));
  const angA = Math.atan2(A.alto, A.ancho / 2), lA = Math.hypot(A.alto, A.ancho / 2);
  for (const s of [-1, 1]) { const t = caja(A.largo, 0.06, lA + 0.2, lambert({ map: texTablas("#3a2c20", [10, 1]), side: THREE.DoubleSide }), 0, A.alto / 2, s * A.ancho / 4); t.rotation.x = s * angA; atico.add(t); }
  for (const x of [-A.largo / 2, A.largo / 2]) { const f = new THREE.Shape(); f.moveTo(-A.ancho / 2, 0); f.lineTo(A.ancho / 2, 0); f.lineTo(0, A.alto); f.lineTo(-A.ancho / 2, 0); const h = new THREE.Mesh(new THREE.ShapeGeometry(f), lambert({ map: texTablas("#33271c", [0.6, 0.6]), side: THREE.DoubleSide })); h.position.x = x; h.rotation.y = Math.PI / 2; atico.add(h); }
  for (let x = -A.largo / 2 + 0.5; x < A.largo / 2; x += 0.95) for (const s of [-1, 1]) { const v = caja(0.12, 0.16, lA, mViga, x, A.alto / 2 - 0.08, s * A.ancho / 4); v.rotation.x = s * angA; atico.add(v); } // pares (vigas inclinadas)
  atico.add(caja(A.largo, 0.2, 0.2, mVigaO, 0, A.alto - 0.12, 0)); // caballete
  for (let x = -A.largo / 2 + 1.45; x < A.largo / 2; x += 2.85) { atico.add(caja(0.12, 0.14, A.ancho * 0.45, mViga, x, A.alto * 0.62, 0)); atico.add(caja(0.16, A.alto * 0.62, 0.16, mVigaO, x, A.alto * 0.31, 0)); } // tirantes y postes
  // la trampilla (hueco en el piso) con la escalera que sube de abajo y su tapa levantada
  const T = A.trampa; atico.add(caja(1.0, 0.02, 0.08, mVigaO, T.x, 0.012, T.z - 0.45), caja(1.0, 0.02, 0.08, mVigaO, T.x, 0.012, T.z + 0.45));
  const hoyo = suelo(0.9, 0.82, brillo("#060504"), T.x, 0.004, T.z); atico.add(hoyo);
  for (const s of [-1, 1]) atico.add(caja(0.06, 1.2, 0.06, mViga, T.x + s * 0.3, 0.1, T.z - 0.2));
  const tapa = caja(0.9, 0.05, 0.82, lambert({ map: texTablas("#4a3828", [2, 1]) }), 0, 0, 0.41); const tapaG = new THREE.Group(); tapaG.position.set(T.x, 0.03, T.z + 0.41); tapaG.rotation.x = -1.6; tapaG.add(tapa); tapa.position.set(0, 0, -0.41); atico.add(tapaG);
  // paja, baúles, costales, una silla rota, una rueca vieja; el rincón oscuro (al fondo, detrás de la paja)
  const mPaja = lambert({ map: texPaja() });
  for (const [x, z, s] of [[4.2, -2.2, 1.5], [5.4, -0.8, 1.2], [4.8, 1.8, 1.0], [-2.0, -2.6, 0.9]] as [number, number, number][]) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mPaja); p.scale.set(s * 1.2, s * 0.8, s); p.position.set(x, 0, z); atico.add(p); }
  const baul = (x: number, z: number, r: number) => { const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = r; b.add(caja(0.9, 0.5, 0.5, lambert({ color: "#5a3e28" }), 0, 0.25, 0), caja(0.92, 0.06, 0.52, mVigaO, 0, 0.5, 0)); for (const xx of [-0.3, 0.3]) b.add(caja(0.05, 0.52, 0.53, mFierro, xx, 0.26, 0)); b.add(caja(0.08, 0.1, 0.03, lambert({ color: "#a08a40" }), 0, 0.4, -0.27)); atico.add(b); };
  baul(2.4, -2.4, 0.3); baul(-5.2, -1.8, -0.2); baul(3.0, 2.6, 2.9);
  for (const [x, z] of [[-0.8, 2.5], [-0.4, 2.7], [1.0, -2.8]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), lambert({ color: "#9a8a6a" })); c.scale.set(1, 1.3, 0.8); c.position.set(x, 0.36, z); atico.add(c); }
  const sR = new THREE.Group(); sR.position.set(-3.0, 0, 2.6); sR.rotation.set(0, 0.6, 0.5); atico.add(sR); sR.add(caja(0.4, 0.04, 0.4, mViga, 0, 0.45, 0), caja(0.4, 0.5, 0.04, mViga, 0, 0.72, 0.18)); for (const [a, b] of [[-1, -1], [1, -1], [1, 1]]) sR.add(caja(0.04, 0.45, 0.04, mVigaO, a * 0.17, 0.22, b * 0.17));
  const rueca = new THREE.Group(); rueca.position.set(-5.6, 0, 1.6); atico.add(rueca); const ru = new THREE.Mesh(new THREE.TorusGeometry(0.35, 0.025, 6, 20), mViga); ru.position.y = 0.75; rueca.add(ru); for (let k = 0; k < 4; k++) { const r = caja(0.02, 0.7, 0.02, mVigaO, 0, 0.75, 0); r.rotation.z = k * Math.PI / 4; rueca.add(r); } rueca.add(caja(0.8, 0.06, 0.25, mViga, 0.1, 0.3, 0)); for (const x of [-0.25, 0.4]) rueca.add(caja(0.04, 0.35, 0.04, mVigaO, x, 0.15, 0));
  // la luna entra por rendijas entre las tablas del techo
  const rendijas: THREE.Mesh[] = [];
  for (let k = 0; k < 6; k++) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 1.6), new THREE.MeshBasicMaterial({ color: "#8aa4d8", toneMapped: false, transparent: true, opacity: 0.6 })); r.position.set(-4 + k * 1.7, A.alto * 0.55, -A.ancho / 4 - 0.15 + 0.03); r.rotation.x = -angA - Math.PI / 2 + Math.PI / 2; r.rotation.set(angA - Math.PI / 2 + Math.PI / 2, 0, 0); r.layers.set(NOINK); atico.add(r); rendijas.push(r); }
  // ventanita del hastial (al fondo, detrás del rincón): entra la luna; quien esté parado ahí se ve a contraluz
  const ventAt = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.0), brillo("#7d94c4")); ventAt.position.set(A.largo / 2 - 0.02, 1.55, 0.6); ventAt.rotation.y = -Math.PI / 2; ventAt.layers.set(NOINK); atico.add(ventAt);
  atico.add(caja(0.08, 0.06, 0.95, mVigaO, A.largo / 2 - 0.05, 2.08, 0.6), caja(0.08, 0.06, 0.95, mVigaO, A.largo / 2 - 0.05, 1.02, 0.6), caja(0.08, 1.1, 0.06, mVigaO, A.largo / 2 - 0.05, 1.55, 0.6), caja(0.08, 1.1, 0.06, mVigaO, A.largo / 2 - 0.05, 1.55, 0.18), caja(0.08, 1.1, 0.06, mVigaO, A.largo / 2 - 0.05, 1.55, 1.02));
  const haloAt = destello(150, 175, 230, 2.2, 0.35); haloAt.position.set(A.largo / 2 - 0.3, 1.55, 0.6); atico.add(haloAt);
  const luzAtico = new THREE.PointLight("#8aa4d8", 1.0, 10, 1.4); luzAtico.position.set(0, A.alto - 0.6, -1.0); atico.add(luzAtico);

  // ================================================================ el granero (adentro)
  const granero = new THREE.Group(); granero.position.set(GRANERO.x, 0, GRANERO.z); raiz.add(granero);
  const GR = GRANERO, anchoG = GR.x1 - GR.x0, fondoG = GR.z1 - GR.z0;
  const paredG = (w: number, x: number, z: number, ry: number) => { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, GR.alto), lambert({ map: texTablas("#4a3828", [w / 1.2, 1]) })); p.position.set(x, GR.alto / 2, z); p.rotation.y = ry; granero.add(p); };
  paredG(anchoG, 0, GR.z1, Math.PI); paredG(fondoG, GR.x0, 0, Math.PI / 2); paredG(fondoG, GR.x1, 0, -Math.PI / 2);
  // pared del frente con el hueco del portón (mismo ancho que el de afuera); afuera de día se ve nieve clara
  for (const s of [-1, 1]) { const w = (anchoG - PORTON.ancho) / 2; const p = new THREE.Mesh(new THREE.PlaneGeometry(w, GR.alto), lambert({ map: texTablas("#4a3828", [w / 1.2, 1]) })); p.position.set(s * (PORTON.ancho / 2 + w / 2), GR.alto / 2, GR.z0); granero.add(p); }
  const dintel = new THREE.Mesh(new THREE.PlaneGeometry(PORTON.ancho, GR.alto - PORTON.alto), lambert({ map: texTablas("#4a3828", [2, 0.3]) })); dintel.position.set(0, (GR.alto + PORTON.alto) / 2, GR.z0); granero.add(dintel);
  const hojasG = [-1, 1].map((s) => { const g = new THREE.Group(); g.position.set(s * PORTON.ancho / 2, 0, GR.z0); const w = PORTON.ancho / 2 - 0.02; g.add(caja(w, PORTON.alto - 0.04, 0.08, lambert({ map: texTablas("#4e3a28", [2, 1]) }), -s * w / 2, PORTON.alto / 2, 0)); g.add(caja(w, 0.1, 0.1, mMarco, -s * w / 2, 0.4, 0.05), caja(w, 0.1, 0.1, mMarco, -s * w / 2, PORTON.alto - 0.4, 0.05)); granero.add(g); return g; });
  const afueraDia = suelo(40, 30, brillo("#b8c4d8"), 0, 0.002, GR.z0 - 15.2); granero.add(afueraDia);
  const cieloDia = new THREE.Mesh(new THREE.PlaneGeometry(40, 20), brillo("#8a9ab8")); cieloDia.position.set(0, 10, GR.z0 - 25); granero.add(cieloDia);
  for (let k = 0; k < 9; k++) { const p = pinoGeo(-14 + k * 3.4, GR.z0 - 22 + rz(k) * 2, 1.6 + rz(k + 1)); const m = new THREE.Mesh(mergeGeometries(p.verde), lambert({ color: "#3a5048" })); granero.add(m); }
  granero.add(suelo(anchoG, fondoG, lambert({ map: texPaja() }), 0, 0.004, 0));
  const techoG = new THREE.Mesh(new THREE.PlaneGeometry(anchoG, fondoG), lambert({ map: texTablas("#2e2218", [8, 1]) })); techoG.rotation.x = Math.PI / 2; techoG.position.y = GR.alto; granero.add(techoG);
  for (let x = GR.x0 + 1; x < GR.x1; x += 2) granero.add(caja(0.2, 0.25, fondoG, mVigaO, x, GR.alto - 0.15, 0), caja(0.2, GR.alto, 0.2, mVigaO, x, GR.alto / 2, GR.z1 - 1.6));
  // establos: pesebre de madera contra la pared del fondo, divisiones, y tres vacas que comen (cabeza hacia la pared)
  granero.add(caja(anchoG - 1, 0.6, 0.6, mMesa, 0, 0.5, GR.z1 - 0.5), caja(anchoG - 1, 0.08, 0.5, mPaja, 0, 0.82, GR.z1 - 0.5));
  for (let k = 0; k < 4; k++) { const x = -4.5 + k * 3; granero.add(caja(0.08, 1.3, 2.4, mMarco, x, 0.65, GR.z1 - 1.8)); granero.add(caja(0.1, 0.08, 2.4, mMarco, x, 1.32, GR.z1 - 1.8)); }
  const vacas = [0, 1, 2].map((k) => { const v = vaca(k + 2); v.g.position.set(-3 + k * 3, 0, GR.z1 - 2.0); v.g.rotation.y = -Math.PI / 2; granero.add(v.g); return v; });
  // paja amontonada, horquilla recargada, cubetas, banco de ordeña y el farol colgado
  for (const [x, z, s] of [[-4.6, -2.4, 1.3], [4.8, -2.8, 1.0]] as [number, number, number][]) { const p = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), mPaja); p.scale.set(s * 1.1, s, s); p.position.set(x, 0, z); granero.add(p); }
  const horquilla = new THREE.Group(); horquilla.position.set(GR.x1 - 0.12, 0, -0.6); horquilla.rotation.z = 0.2; granero.add(horquilla);
  horquilla.add(cil(0.02, 0.02, 1.6, mLena, 0, 0.8, 0, 6)); for (const z of [-0.06, 0, 0.06]) horquilla.add(cil(0.008, 0.008, 0.3, mFierro, 0, 1.75, z, 4));
  for (const [x, z] of [[2.2, -1.0], [-1.2, -0.6]]) granero.add(cil(0.16, 0.13, 0.3, lambert({ color: "#7a7a76" }), x, 0.15, z, 14));
  granero.add(cil(0.15, 0.15, 0.04, mMesa, 1.6, 0.35, -0.8, 12)); for (let k = 0; k < 3; k++) { const p = cil(0.02, 0.02, 0.36, mMarco, 1.6 + Math.sin(k * 2.1) * 0.09, 0.17, -0.8 + Math.cos(k * 2.1) * 0.09, 5); granero.add(p); }
  const farolG = farol(); farolG.position.set(-1.5, 2.0, GR.z1 - 1.6); granero.add(farolG); granero.add(cil(0.005, 0.005, GR.alto - 2.3, mFierro, -1.5, (GR.alto + 2.3) / 2, GR.z1 - 1.6, 4));
  const luzG = new THREE.PointLight("#ffc880", 3, 10, 1.4); luzG.position.set(-1.5, 2.1, GR.z1 - 1.8); granero.add(luzG);

  // ================================================================ la oficina de la policía
  const oficina = new THREE.Group(); oficina.position.set(OFICINA.x, 0, OFICINA.z); raiz.add(oficina);
  const O = OFICINA, anchoO = O.x1 - O.x0, fondoO = O.z1 - O.z0;
  const cuartoO = new THREE.Mesh(new THREE.BoxGeometry(anchoO, O.alto, fondoO), lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#8a8a72"; c.fillRect(0, 0, w, h); manchas(c, w, h, 20, "40,40,30", 0.3); c.fillStyle = "#4a4a3a"; c.fillRect(0, h * 0.7, w, h * 0.3); c.fillStyle = "#2e2e24"; c.fillRect(0, h * 0.69, w, 6); }, 256, 256, [3, 1]), side: THREE.BackSide }));
  cuartoO.position.y = O.alto / 2; oficina.add(cuartoO); oficina.add(suelo(anchoO - 0.01, fondoO - 0.01, lambert({ map: texPiso() }), 0, 0.006, 0));
  const E = ESCRITORIO;
  oficina.add(caja(1.6, 0.06, 0.8, mMesa, E.x, E.alto - 0.03, E.z)); for (const s of [-1, 1]) oficina.add(caja(0.45, E.alto - 0.06, 0.75, mMesa, E.x + s * 0.55, (E.alto - 0.06) / 2, E.z));
  for (let k = 0; k < 3; k++) { oficina.add(caja(0.4, 0.015, 0.03, lambert({ color: "#a08a40" }), E.x + 0.55, 0.15 + k * 0.22, E.z - 0.38)); }
  // pilas de expedientes, la máquina de escribir, el tintero, la lámpara verde
  const mExp = [lambert({ color: "#c8a870" }), lambert({ color: "#b89860" }), lambert({ color: "#d8c8a0" })];
  for (const [x, z, n] of [[-0.6, 0.85, 9], [-0.35, 0.8, 6], [0.62, 0.85, 12]] as [number, number, number][]) for (let k = 0; k < n; k++) { const e = caja(0.32, 0.022, 0.24, mExp[k % 3], E.x + x + (rz(k + n) - 0.5) * 0.03, E.alto + 0.011 + k * 0.023, z); e.rotation.y = (rz(k + x * 10) - 0.5) * 0.15; oficina.add(e); }
  const expediente = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.4), lambert({ map: texExpediente() })); expediente.rotation.x = -Math.PI / 2; expediente.rotation.z = -0.08 + Math.PI; expediente.position.set(E.x + 0.05, E.alto + 0.01, E.z + 0.42 - 0.6 + 0.5); oficina.add(expediente);
  const maquina = new THREE.Group(); maquina.position.set(E.x - 0.25, E.alto, E.z + 0.7 - 0.55); oficina.add(maquina);
  maquina.add(caja(0.34, 0.1, 0.26, lambert({ color: "#1e1e20" }), 0, 0.05, 0), caja(0.3, 0.05, 0.14, lambert({ color: "#1e1e20" }), 0, 0.12, 0.06), cil(0.025, 0.025, 0.38, lambert({ color: "#2a2a2a" }), 0, 0.17, 0.1, 10).rotateZ(Math.PI / 2));
  for (let r = 0; r < 3; r++) for (let k = 0; k < 8; k++) maquina.add(cil(0.012, 0.012, 0.01, lambert({ color: "#d8d8d0" }), -0.12 + k * 0.034, 0.105 + r * 0.008, -0.08 + r * 0.03, 8));
  maquina.add(caja(0.2, 0.18, 0.004, lambert({ color: "#e8e4d8" }), 0, 0.24, 0.12));
  oficina.add(cil(0.04, 0.06, 0.03, mFierro, E.x + 0.62, E.alto + 0.015, E.z - 0.2), cil(0.015, 0.015, 0.32, mFierro, E.x + 0.62, E.alto + 0.18, E.z - 0.2));
  const pantallaO = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.13, 0.1, 16, 1, true), lambert({ color: "#2e5a3e", side: THREE.DoubleSide })); pantallaO.position.set(E.x + 0.62, E.alto + 0.36, E.z - 0.1); oficina.add(pantallaO);
  const luzO = new THREE.PointLight("#ffd090", 3, 6, 1.4); luzO.position.set(E.x + 0.62, E.alto + 0.3, E.z - 0.05); oficina.add(luzO);
  const haloO = destello(255, 210, 140, 0.4, 0.6); haloO.position.set(E.x + 0.62, E.alto + 0.3, E.z - 0.1); oficina.add(haloO);
  // sillas (policía detrás del escritorio; el interrogado enfrente), mapa con alfileres, archivero, perchero con casco
  for (const [z, r] of [[E.z + 0.75, Math.PI], [E.z - 0.75, 0]] as [number, number][]) { const s = new THREE.Group(); s.position.set(E.x, 0, z); s.rotation.y = r; s.add(caja(0.44, 0.05, 0.42, mMesa, 0, 0.46, 0), caja(0.44, 0.55, 0.04, mMesa, 0, 0.75, -0.2)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.add(caja(0.04, 0.46, 0.04, mMarco, sx * 0.19, 0.23, sz * 0.18)); oficina.add(s); }
  const mapa = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.05), lambert({ map: texMapa() })); mapa.position.set(-0.6, 1.75, O.z1 - 0.02); mapa.rotation.y = Math.PI; oficina.add(mapa);
  for (let k = 0; k < 4; k++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.26), lambert({ color: k % 2 ? "#d8d0bc" : "#c8c0a8" })); p.position.set(0.55 + (k % 2) * 0.28, 1.55 + Math.floor(k / 2) * 0.32, O.z1 - 0.02); p.rotation.set(0, Math.PI, (rz(k) - 0.5) * 0.2); oficina.add(p); }
  oficina.add(caja(0.6, 1.3, 0.5, lambert({ color: "#5a6a5a" }), O.x1 - 0.4, 0.65, O.z1 - 0.4)); for (let k = 0; k < 4; k++) oficina.add(caja(0.12, 0.03, 0.02, lambert({ color: "#c8c0a0" }), O.x1 - 0.4, 0.25 + k * 0.3, O.z1 - 0.66));
  oficina.add(cil(0.025, 0.025, 1.8, mMarco, O.x0 + 0.35, 0.9, O.z1 - 0.35, 6)); const casco = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#1e2a20" })); casco.position.set(O.x0 + 0.35, 1.82, O.z1 - 0.35); oficina.add(casco); oficina.add(cil(0.012, 0.004, 0.1, lambert({ color: "#a08a40" }), O.x0 + 0.35, 1.98, O.z1 - 0.35, 6));
  const vO = ventana(0.9, 1.0, mMarco, null); vO.g.position.set(1.4, 1.6, O.z0 + 0.06); oficina.add(vO.g); vO.mVidrio.color.set("#5a6a8a");

  // ================================================================ la sombra de la lámpara de mano (farol de Andreas / de los vecinos)
  const farolMano = farol(); raiz.add(farolMano);
  const luzMano = new THREE.PointLight("#ffcf8a", 0, 7, 1.5); farolMano.add(luzMano); luzMano.position.y = 0.14;
  const farolMano2 = farol(); raiz.add(farolMano2);

  const animar = (t: number) => {
    humo.forEach((s, k) => { const u = ((t * 0.18 + k / humo.length) % 1); s.position.set(CHIMENEA.x + u * 1.6 + Math.sin(t + k) * 0.15, CHIMENEA.arriba + 0.3 + u * 4.5, CHIMENEA.z - u * 0.8); s.scale.setScalar(1.2 + u * 3.4); (s.material as THREE.SpriteMaterial).opacity = humoOn.v * 0.8 * Math.sin(Math.min(1, u * 1.4) * Math.PI); });
    lamparaC.rotation.z = 0.03 * Math.sin(t * 1.3); lamparaC.rotation.x = 0.02 * Math.sin(t * 0.9);
    vacas.forEach((v, k) => { v.cabeza.rotation.z = 0.15 * Math.sin(t * 1.5 + k * 2) - 0.1; v.cola.rotation.x = 0.2 * Math.sin(t * 1.1 + k); });
  };
  const humoOn = { v: 1 };
  return {
    raiz, amb, hemi, luna, luzExtra, luzExtra2, afuera, granja, ventanas, portonI, portonD, puertita, huellas, humo, humoOn, ruinas, cruz, bosque, vecino,
    cocina, lamparaC, luzC, haloC, vidrioC, periodico, comida, vapor, silla, fuegoC, atico, tapaG, rendijas, luzAtico, granero, hojasG, afueraDia, cieloDia, luzG, farolG, vacas,
    oficina, expediente, luzO, farolMano, luzMano, farolMano2, animar,
  };
}
export type Escenario = ReturnType<typeof crearEscenario>;
