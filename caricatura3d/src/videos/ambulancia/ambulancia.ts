// Escenario de «La ambulancia»: una avenida de noche con la ciudad caída (coches abandonados, uno ardiendo, postes,
// edificios con ventanas rotas), la ambulancia (por fuera y por dentro: cabina con volante y tablero, y la parte de
// atrás con camilla, banca, gabinete y tanque de oxígeno) y el mercado: fachada con letrero y cortinas de metal, y la
// azotea con pretil, tinaco, tanque de gas, lonas, huacales, catres, linternas y la pared con las tres reglas.
// La ambulancia no se mueve: la avenida corre hacia atrás (`avance`). Acabado §8.9 (lugares gastados, noche fría,
// sin capa de puntitos); §8.6c (capas ≥ 5 mm, nada se atraviesa) y §8.6d (cada objeto con sus piezas típicas).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";

// la ambulancia mira hacia +z; su izquierda (lado del chofer) es +x
export const AMB = { x: 1.05, atras: -3.3, medio: 0.55, cabina: 2.1, nariz: 3.35, piso: 0.62, techoCaja: 2.95, techoCab: 2.35, cofre: 1.32 };
export const CHOFER = new THREE.Vector3(0.48, 0.64, 1.25); // pies de la tarjeta (el tablero tapa el cuerpo)
export const BANCA = { x: 0.62, z: -1.3, alto: AMB.piso + 0.4 }; // banca de atrás, contra la pared del lado del chofer
export const CAMILLA = { x: -0.45, z: -1.35 };
export const CALLE = { ancho: 11, tramo: 48 }; // la avenida se repite cada `tramo` metros
// el mercado queda a la derecha de la ambulancia (−x) cuando se estaciona: su pared de la calle es x = MERC.x1
export const MERC = { x0: -13.5, x1: -2.0, z0: -7, z1: 9, alto: 5.2 };
export const AZOTEA = MERC.alto; // altura del piso de la azotea
export const ESCALERA = new THREE.Vector3(MERC.x1 + 0.09, 0, 1.2); // pegada a la pared de la calle
export const PARED_REGLAS = { x: -9.5, z: MERC.z0 + 2.6, ancho: 4.6, alto: 2.5 }; // cuarto de azotea: su pared mira a +z

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
const rz = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x); };

// ------------------------------------------------------------------ texturas
const manchas = (c: CanvasRenderingContext2D, w: number, h: number, n: number, col = "18,16,14", a = 0.25) => {
  for (let k = 0; k < n; k++) { const x = (k * 71 + 13) % w, y = (k * 113 + 7) % h, g = c.createRadialGradient(x, y, 2, x, y, 26 + (k % 3) * 16); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h); }
};
const texAsfalto = () => lienzo((c, w, h) => {
  c.fillStyle = "#2c2e33"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) { c.fillStyle = `rgba(${k % 2 ? "70,72,78" : "14,14,16"},0.35)`; c.fillRect(rz(k) * w, rz(k + 500) * h, 2, 2); }
  manchas(c, w, h, 10, "10,10,12", 0.4);
  c.strokeStyle = "rgba(8,8,10,0.6)"; c.lineWidth = 2; // grietas
  for (let k = 0; k < 5; k++) { c.beginPath(); let x = rz(k * 3) * w, y = rz(k * 5) * h; c.moveTo(x, y); for (let j = 0; j < 5; j++) { x += (rz(k * 7 + j) - 0.5) * 60; y += (rz(k * 11 + j) - 0.3) * 50; c.lineTo(x, y); } c.stroke(); }
}, 256, 256, [4, 16]);
const texBanqueta = () => lienzo((c, w, h) => {
  c.fillStyle = "#56575a"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(20,20,22,0.7)"; c.lineWidth = 3; for (let i = 0; i <= 2; i++) { c.beginPath(); c.moveTo(0, i * h / 2); c.lineTo(w, i * h / 2); c.stroke(); }
  manchas(c, w, h, 6, "20,18,16", 0.35);
}, 128, 128, [1, 24]);
/** fachada de edificio: ventanas (algunas rotas, alguna con luz), manchas de humedad, cortina de local abajo */
const texEdificio = (semilla: number, color: string, pisos: number) => lienzo((c, w, h) => {
  c.fillStyle = color; c.fillRect(0, 0, w, h);
  manchas(c, w, h, 14, "14,14,18", 0.35);
  const ph = h / (pisos + 1);
  for (let p = 0; p < pisos; p++) for (let v = 0; v < 4; v++) {
    const x = 18 + v * (w - 36) / 4 + 8, y = 14 + p * ph, vw = (w - 36) / 4 - 16, vh = ph - 30, r = rz(semilla * 13 + p * 7 + v);
    c.fillStyle = "#15171c"; c.fillRect(x - 4, y - 4, vw + 8, vh + 8);
    c.fillStyle = r > 0.9 ? "#c9a25a" : r > 0.5 ? "#1c2430" : "#0c0e12"; c.fillRect(x, y, vw, vh);
    if (r < 0.35) { c.strokeStyle = "rgba(190,205,225,0.5)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x + vw * 0.2, y + vh); c.lineTo(x + vw * 0.5, y + vh * 0.35); c.lineTo(x + vw * 0.8, y + vh * 0.9); c.moveTo(x + vw * 0.5, y + vh * 0.35); c.lineTo(x + vw * 0.35, y); c.stroke(); }
    c.fillStyle = "#15171c"; c.fillRect(x + vw / 2 - 2, y, 4, vh);
    c.fillStyle = "rgba(10,10,12,0.5)"; c.fillRect(x - 6, y + vh + 4, vw + 12, 5); // repisón
  }
  const y0 = pisos * ph + 6; // planta baja: cortina de metal con grafiti
  c.fillStyle = "#3c4046"; c.fillRect(20, y0, w - 40, ph - 10);
  c.strokeStyle = "rgba(12,12,14,0.6)"; c.lineWidth = 2; for (let y = y0 + 6; y < h - 6; y += 9) { c.beginPath(); c.moveTo(20, y); c.lineTo(w - 20, y); c.stroke(); }
  c.strokeStyle = ["#a83a34", "#3a6aa8", "#c9a23a"][semilla % 3]; c.lineWidth = 5; c.beginPath(); c.moveTo(50, y0 + ph * 0.6); c.bezierCurveTo(90, y0 + 6, 130, h - 12, 190, y0 + ph * 0.4); c.stroke();
}, 256, 512);
const texLamina = (color: string) => lienzo((c, w, h) => { // lámina pintada con rayones (carrocería)
  c.fillStyle = color; c.fillRect(0, 0, w, h);
  manchas(c, w, h, 6, "40,40,48", 0.14);
  c.strokeStyle = "rgba(60,60,70,0.25)"; c.lineWidth = 1.5; for (let k = 0; k < 9; k++) { c.beginPath(); c.moveTo(rz(k) * w, rz(k + 9) * h); c.lineTo(rz(k) * w + 40, rz(k + 9) * h + (rz(k + 3) - 0.5) * 14); c.stroke(); }
}, 128, 128);
/** costado de la ambulancia: franja naranja, letrero, estrella azul de emergencias, manchas de manos */
const texCostado = (espejo: boolean) => lienzo((c, w, h) => {
  c.fillStyle = "#e6e8ea"; c.fillRect(0, 0, w, h);
  manchas(c, w, h, 8, "60,60,70", 0.12);
  c.fillStyle = "#e0661e"; c.fillRect(0, h * 0.52, w, h * 0.13); c.fillStyle = "#2f5fae"; c.fillRect(0, h * 0.66, w, h * 0.035);
  c.save(); if (espejo) { c.translate(w, 0); c.scale(-1, 1); }
  c.fillStyle = "#c8281e"; c.font = "bold 60px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("AMBULANCIA", w * 0.42, h * 0.4);
  const ex = w * 0.84, ey = h * 0.3; c.fillStyle = "#2f5fae"; // estrella de seis brazos
  for (let k = 0; k < 3; k++) { c.save(); c.translate(ex, ey); c.rotate(k * Math.PI / 3); c.fillRect(-13, -46, 26, 92); c.restore(); }
  c.fillStyle = "#ffffff"; c.fillRect(ex - 3, ey - 26, 6, 52);
  c.restore();
  c.fillStyle = "rgba(96,22,18,0.75)"; // manos marcadas
  for (let k = 0; k < 5; k++) { const x = 40 + rz(k * 3 + (espejo ? 9 : 0)) * (w - 80), y = h * 0.72 + rz(k * 5) * h * 0.2; c.beginPath(); c.ellipse(x, y, 13, 16, 0, 0, 7); c.fill(); for (let d = -2; d <= 2; d++) c.fillRect(x + d * 6 - 2, y - 34, 4.5, 22); c.fillRect(x - 3, y, 6, 30 + rz(k) * 30); }
  c.fillStyle = "rgba(20,20,24,0.5)"; c.fillRect(0, h - 10, w, 10);
}, 512, 256);
const texAtras = () => lienzo((c, w, h) => { // puertas de atrás: dos hojas, franja y letrero
  c.fillStyle = "#e6e8ea"; c.fillRect(0, 0, w, h); manchas(c, w, h, 5, "60,60,70", 0.12);
  c.fillStyle = "#e0661e"; c.fillRect(0, h * 0.6, w, h * 0.1);
  c.fillStyle = "#15171c"; c.fillRect(w / 2 - 2, 0, 4, h);
  c.fillStyle = "#c8281e"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("EMERGENCIAS", w / 2, h * 0.86);
  c.fillStyle = "#8a8e96"; c.fillRect(w / 2 - 26, h * 0.5, 16, 6); c.fillRect(w / 2 + 10, h * 0.5, 16, 6); // manijas
}, 256, 256);
const texCofre = () => lienzo((c, w, h) => { // «AMBULANCIA» al revés (para leerse en el espejo) sobre el cofre
  c.fillStyle = "#e6e8ea"; c.fillRect(0, 0, w, h); manchas(c, w, h, 5, "60,60,70", 0.12);
  c.fillStyle = "#e0661e"; c.fillRect(0, h * 0.72, w, h * 0.12);
  c.save(); c.translate(w, 0); c.scale(-1, 1); c.fillStyle = "#c8281e"; c.font = "bold 44px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("AMBULANCIA", w / 2, h * 0.5); c.restore();
}, 256, 128);
const texInterior = () => lienzo((c, w, h) => { // pared interior: paneles claros con remaches y riel
  c.fillStyle = "#b9c2c4"; c.fillRect(0, 0, w, h); manchas(c, w, h, 8, "40,48,52", 0.2);
  c.strokeStyle = "rgba(40,46,50,0.5)"; c.lineWidth = 2; for (let x = 0; x <= w; x += w / 3) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  c.fillStyle = "#7c868a"; c.fillRect(0, h * 0.3, w, 8); c.fillStyle = "rgba(30,34,38,0.6)"; for (let x = 10; x < w; x += 22) c.fillRect(x, h * 0.3 + 2, 3, 3);
}, 256, 256);
const texPisoAmb = () => lienzo((c, w, h) => { // piso antiderrapante
  c.fillStyle = "#4a5258"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(20,24,28,0.45)";
  for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < w; x += 16) { c.beginPath(); c.ellipse(x + 4, y + 4, 4, 2, Math.PI / 4, 0, 7); c.fill(); }
  manchas(c, w, h, 4, "60,14,12", 0.3);
}, 128, 128, [2, 4]);
const texGabinete = () => lienzo((c, w, h) => { // gabinete con puertas, cruz verde de botiquín y cajones
  c.fillStyle = "#d4d8da"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#3a4046"; c.lineWidth = 3; for (let i = 0; i < 3; i++) c.strokeRect(6 + i * (w - 12) / 3, 6, (w - 12) / 3, h * 0.55);
  for (let i = 0; i < 3; i++) { c.fillStyle = "#6a7278"; c.fillRect(6 + (i + 0.5) * (w - 12) / 3 - 10, h * 0.5, 20, 5); }
  c.strokeRect(6, h * 0.62, w - 12, h * 0.32); c.fillStyle = "#6a7278"; c.fillRect(w / 2 - 14, h * 0.76, 28, 5);
  c.fillStyle = "#2f8a4a"; c.fillRect(w / 2 - 6, 26, 12, 40); c.fillRect(w / 2 - 20, 40, 40, 12);
}, 256, 128);
const texConcreto = (rep: [number, number] = [1, 1]) => lienzo((c, w, h) => {
  c.fillStyle = "#6a6a68"; c.fillRect(0, 0, w, h); manchas(c, w, h, 14, "24,22,20", 0.3);
  for (let k = 0; k < 260; k++) { c.fillStyle = `rgba(${k % 2 ? "120,120,116" : "30,30,30"},0.25)`; c.fillRect(rz(k + 3) * w, rz(k + 300) * h, 2, 2); }
}, 256, 256, rep);
const texFachadaMercado = () => lienzo((c, w, h) => { // pared amarilla descarapelada con zoclo rojo y cortinas de metal
  c.fillStyle = "#b99a4e"; c.fillRect(0, 0, w, h); manchas(c, w, h, 22, "40,34,24", 0.3);
  c.fillStyle = "#8a2f28"; c.fillRect(0, h * 0.8, w, h * 0.2);
  for (let k = 0; k < 4; k++) { // cortinas
    const x = 40 + k * (w - 80) / 4 + 14, cw = (w - 80) / 4 - 28, y = h * 0.5;
    if (k === 1) continue; // ahí va la escalera: pared lisa
    c.fillStyle = "#4a4e54"; c.fillRect(x, y, cw, h * 0.47);
    c.strokeStyle = "rgba(14,14,16,0.6)"; c.lineWidth = 2; for (let yy = y + 8; yy < h * 0.97; yy += 12) { c.beginPath(); c.moveTo(x, yy); c.lineTo(x + cw, yy); c.stroke(); }
    c.strokeStyle = "#1c1e22"; c.lineWidth = 5; c.strokeRect(x, y, cw, h * 0.47);
    c.fillStyle = "rgba(96,22,18,0.6)"; for (let j = 0; j < 4; j++) c.fillRect(x + 20 + rz(k * 9 + j) * (cw - 40), h * 0.7 + rz(j + k) * h * 0.1, 7, 60 + rz(j) * 50); // escurrimientos
  }
  c.strokeStyle = "rgba(20,18,14,0.5)"; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); let x = rz(k * 3 + 1) * w, y = rz(k) * h * 0.45; c.moveTo(x, y); for (let j = 0; j < 4; j++) { x += (rz(k * 7 + j) - 0.5) * 50; y += 20 + rz(k + j) * 20; c.lineTo(x, y); } c.stroke(); }
}, 1024, 512);
const texLetreroMercado = () => lienzo((c, w, h) => {
  c.fillStyle = "#1f5f4a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e8dcc0"; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = "#f0e4c4"; c.font = "bold 78px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("MERCADO", w / 2, h * 0.42);
  c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.fillText("SAN JUAN DE LAS FLORES", w / 2, h * 0.8);
  manchas(c, w, h, 6, "10,14,12", 0.35);
}, 512, 160);
const texAzotea = () => lienzo((c, w, h) => { // impermeabilizante rojo gastado, con parches y charcos secos
  c.fillStyle = "#7a4238"; c.fillRect(0, 0, w, h); manchas(c, w, h, 18, "30,18,16", 0.35);
  c.fillStyle = "rgba(150,150,150,0.25)"; for (let k = 0; k < 6; k++) c.fillRect(rz(k) * w, rz(k + 6) * h, 50 + rz(k + 2) * 40, 30 + rz(k + 4) * 30);
  c.strokeStyle = "rgba(20,12,10,0.5)"; c.lineWidth = 2; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(i * w / 4, 0); c.lineTo(i * w / 4, h); c.stroke(); }
}, 256, 256, [4, 5]);
const texTabique = () => lienzo((c, w, h) => { // pared de block pintada de blanco, sucia
  c.fillStyle = "#c9c6bc"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(60,58,52,0.35)"; c.lineWidth = 2; for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (y / 32) % 2 ? 32 : 0; x < w; x += 64) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 32); c.stroke(); } }
  manchas(c, w, h, 12, "40,36,30", 0.28);
}, 256, 256, [2, 1]);
/** la pared con las tres reglas pintadas con brocha (rojo, chorreadas) */
const texReglas = () => lienzo((c, w, h) => {
  c.fillStyle = "#c9c6bc"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(60,58,52,0.3)"; c.lineWidth = 2; for (let y = 0; y < h; y += 46) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); for (let x = (y / 46) % 2 ? 46 : 0; x < w; x += 92) { c.beginPath(); c.moveTo(x, y); c.lineTo(x, y + 46); c.stroke(); } }
  manchas(c, w, h, 16, "40,36,30", 0.25);
  c.fillStyle = "#8a1c16"; c.textAlign = "center"; c.font = "bold 78px 'DejaVu Sans', sans-serif"; c.fillText("REGLAS", w / 2, 92);
  c.fillRect(w * 0.3, 108, w * 0.4, 8);
  c.textAlign = "left"; c.font = "bold 44px 'DejaVu Sans', sans-serif";
  const L = ["1. DE NOCHE, NADIE", "    HACE RUIDO.", "2. LA ESCALERA NO SE", "    BAJA POR NADIE.", "3. EL QUE TENGA FIEBRE,", "    DUERME AMARRADO."];
  L.forEach((t, i) => c.fillText(t, 60, 190 + i * 62 + Math.floor(i / 2) * 22));
  c.fillStyle = "rgba(138,28,22,0.85)"; for (let k = 0; k < 9; k++) c.fillRect(80 + rz(k * 3) * (w - 200), 200 + Math.floor(rz(k) * 6) * 62, 5, 26 + rz(k + 5) * 46); // chorreadas
}, 1024, 600);
const texLona = (color: string) => lienzo((c, w, h) => {
  c.fillStyle = color; c.fillRect(0, 0, w, h); manchas(c, w, h, 6, "10,14,24", 0.3);
  c.strokeStyle = "rgba(255,255,255,0.12)"; c.lineWidth = 2; for (let i = 0; i < 6; i++) { c.beginPath(); c.moveTo(0, i * h / 6); c.lineTo(w, i * h / 6 + 10); c.stroke(); }
}, 128, 128);
const texCobija = (a: string, b: string) => lienzo((c, w, h) => { // cobija de cuadros con orilla
  c.fillStyle = a; c.fillRect(0, 0, w, h);
  c.fillStyle = b; for (let i = 0; i < 4; i++) { c.fillRect(i * w / 4 + w / 16, 0, w / 8, h); }
  c.globalAlpha = 0.55; for (let i = 0; i < 4; i++) c.fillRect(0, i * h / 4 + h / 16, w, h / 8); c.globalAlpha = 1;
  c.strokeStyle = "rgba(15,12,14,0.55)"; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  manchas(c, w, h, 4, "20,16,20", 0.25);
}, 256, 256);
const texMadera = () => lienzo((c, w, h) => {
  c.fillStyle = "#8a6a44"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(40,26,14,0.5)"; c.lineWidth = 3; for (let i = 0; i <= 4; i++) { c.beginPath(); c.moveTo(0, i * h / 4); c.lineTo(w, i * h / 4); c.stroke(); }
  manchas(c, w, h, 5, "30,20,12", 0.3);
}, 128, 128);
/** multitud de zombies vista desde arriba/lejos: cabezas y brazos levantados (para «cientos de manos») */
const texMultitud = (semilla: number) => lienzo((c, w, h) => {
  c.clearRect(0, 0, w, h);
  const pieles = ["#9a9fa8", "#a39aa8", "#8e9a9c", "#a8a6a0"], ropas = ["#3a4654", "#54423a", "#3e5446", "#5a5460", "#6a3a34"];
  for (let k = 0; k < 16; k++) {
    const x = 30 + k * (w - 60) / 15 + (rz(semilla + k) - 0.5) * 22, y = h * 0.62 + rz(semilla * 3 + k) * h * 0.2, r = 30 + rz(semilla * 7 + k) * 8;
    const piel = pieles[k % 4], ropa = ropas[(k + semilla) % 5];
    c.lineWidth = 7; c.strokeStyle = "#141012"; c.lineCap = "round";
    for (const s of [-1, 1]) { // brazos levantados con manos abiertas
      const bx = x + s * r * 0.9, mx = x + s * (r * 0.6 + rz(k * 5 + s) * r), my = y - r * 2.3 - rz(k * 9 + s) * r * 1.2;
      c.strokeStyle = "#141012"; c.lineWidth = 22; c.beginPath(); c.moveTo(bx, y + r * 1.2); c.lineTo(mx, my); c.stroke();
      c.strokeStyle = ropa; c.lineWidth = 14; c.beginPath(); c.moveTo(bx, y + r * 1.2); c.lineTo(mx + (bx - mx) * 0.35, my + (y + r * 1.2 - my) * 0.35); c.stroke();
      c.strokeStyle = piel; c.beginPath(); c.moveTo(mx + (bx - mx) * 0.35, my + (y + r * 1.2 - my) * 0.35); c.lineTo(mx, my); c.stroke();
      c.fillStyle = piel; c.strokeStyle = "#141012"; c.lineWidth = 5; c.beginPath(); c.arc(mx, my - 8, 13, 0, 7); c.fill(); c.stroke();
      for (let d = -2; d <= 2; d++) { c.lineWidth = 9; c.strokeStyle = "#141012"; c.beginPath(); c.moveTo(mx + d * 6, my - 14); c.lineTo(mx + d * 9, my - 34); c.stroke(); c.lineWidth = 4.5; c.strokeStyle = piel; c.stroke(); }
    }
    c.fillStyle = ropa; c.strokeStyle = "#141012"; c.lineWidth = 6; c.beginPath(); c.roundRect(x - r * 0.8, y + r * 0.8, r * 1.6, h, 14); c.fill(); c.stroke();
    c.fillStyle = piel; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); c.stroke();
    c.fillStyle = ["#2a2420", "#3a3430", "#1e1c1c"][k % 3]; c.beginPath(); c.arc(x, y - r * 0.25, r * 1.02, Math.PI * 1.05, Math.PI * 1.95); c.fill(); // pelo
    for (const s of [-1, 1]) { c.fillStyle = "rgba(60,40,70,0.5)"; c.beginPath(); c.arc(x + s * r * 0.38, y + r * 0.02, r * 0.3, 0, 7); c.fill(); c.fillStyle = "#e8e4dc"; c.beginPath(); c.arc(x + s * r * 0.38, y - r * 0.02, r * 0.24, 0, 7); c.fill(); c.lineWidth = 3; c.stroke(); c.fillStyle = "#141012"; c.beginPath(); c.arc(x + s * r * 0.38, y - r * 0.02, r * 0.045, 0, 7); c.fill(); }
    c.fillStyle = "#2a0a10"; c.beginPath(); c.ellipse(x, y + r * 0.52, r * 0.36, r * 0.24, 0, 0, 7); c.fill(); c.lineWidth = 3; c.stroke();
    c.fillStyle = "#e8e2c4"; for (let d = -2; d <= 2; d++) { c.beginPath(); c.moveTo(x + d * r * 0.13 - r * 0.06, y + r * 0.32); c.lineTo(x + d * r * 0.13, y + r * 0.5); c.lineTo(x + d * r * 0.13 + r * 0.06, y + r * 0.32); c.fill(); }
    for (const s of [-1, 1]) { c.strokeStyle = "#141012"; c.lineWidth = 5; c.beginPath(); c.moveTo(x + s * r * 0.62, y - r * 0.34); c.lineTo(x + s * r * 0.14, y - r * 0.12); c.stroke(); }
  }
}, 1024, 384);

// ------------------------------------------------------------------ piezas
const lampara = (alto = 0.24) => { // linterna de campamento: base, vidrio encendido, tapa y asa
  const g = new THREE.Group(), m = lambert({ color: "#3a5a4a" });
  g.add(cil(0.07, 0.08, 0.05, m, 0, 0.025, 0), cil(0.055, 0.055, alto - 0.1, brillo("#ffd89a"), 0, alto / 2, 0), cil(0.08, 0.07, 0.04, m, 0, alto - 0.03, 0));
  const asa = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.008, 6, 14, Math.PI), m); asa.position.y = alto - 0.01; g.add(asa);
  const h = destello(255, 200, 120, 0.8, 0.4); h.position.y = alto / 2; g.add(h);
  g.children.forEach((o) => { if ((o as THREE.Mesh).material && ((o as THREE.Mesh).material as THREE.Material).type === "MeshBasicMaterial") o.layers.set(NOINK); });
  return g;
};
const huacal = (x: number, y: number, z: number, m: THREE.Material, w = 0.6, h = 0.4, d = 0.45) => { // caja de madera de tablitas
  const g = new THREE.Group(); g.position.set(x, y, z);
  g.add(caja(w, 0.03, d, m, 0, 0.015, 0));
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) g.add(caja(w, 0.09, 0.02, m, 0, 0.08 + k * 0.13, s * (d / 2 - 0.01)), caja(0.02, 0.09, d, m, s * (w / 2 - 0.01), 0.08 + k * 0.13, 0)); }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(caja(0.04, h, 0.04, m, sx * (w / 2 - 0.02), h / 2, sz * (d / 2 - 0.02)));
  g.add(caja(w, 0.03, d, m, 0, h - 0.015, 0)); // tapa (para sentarse)
  return g;
};
const catre = (m: THREE.Material, mTela: THREE.Material) => { // catre: patas en X, largueros y lona
  const g = new THREE.Group();
  g.add(caja(0.75, 0.04, 1.9, mTela, 0, 0.36, 0));
  for (const s of [-1, 1]) g.add(caja(0.04, 0.04, 1.95, m, s * 0.38, 0.35, 0));
  for (const z of [-0.8, 0, 0.8]) for (const s of [-1, 1]) { const p = caja(0.035, 0.52, 0.035, m, 0, 0.18, z); p.rotation.z = s * 0.75; g.add(p); }
  return g;
};
const coche = (color: string, quemado = false) => { // coche abandonado: carrocería, cabina, vidrios, llantas, faros
  const g = new THREE.Group(), m = lambert({ map: texLamina(quemado ? "#2a2624" : color) }), mV = lambert({ color: quemado ? "#0a0a0c" : "#1c2632" }), mLl = lambert({ color: "#151517" });
  g.add(caja(1.8, 0.6, 4.2, m, 0, 0.62, 0), caja(1.6, 0.55, 2.1, m, 0, 1.18, -0.25));
  g.add(caja(1.5, 0.42, 0.03, mV, 0, 1.2, 0.815), caja(1.5, 0.42, 0.03, mV, 0, 1.2, -1.315));
  for (const s of [-1, 1]) g.add(caja(0.03, 0.38, 1.7, mV, s * 0.815, 1.2, -0.25));
  for (const s of [-1, 1]) for (const z of [-1.3, 1.35]) { const l = cil(0.36, 0.36, 0.24, mLl, s * 0.85, 0.36, z, 14); l.rotation.z = Math.PI / 2; g.add(l); const r = cil(0.18, 0.18, 0.25, lambert({ color: "#6a6e74" }), s * 0.85, 0.36, z, 10); r.rotation.z = Math.PI / 2; g.add(r); }
  for (const s of [-1, 1]) g.add(caja(0.3, 0.14, 0.03, lambert({ color: quemado ? "#1a1a1a" : "#d8d2b8" }), s * 0.6, 0.72, 2.115), caja(0.3, 0.12, 0.03, lambert({ color: quemado ? "#1a1a1a" : "#8a2a24" }), s * 0.6, 0.72, -2.115));
  g.add(caja(1.84, 0.12, 0.1, lambert({ color: "#1e2024" }), 0, 0.4, 2.12), caja(1.84, 0.12, 0.1, lambert({ color: "#1e2024" }), 0, 0.4, -2.12));
  return g;
};
const poste = (prendido: boolean) => { // poste de luz: tubo, brazo, luminaria
  const g = new THREE.Group(), m = lambert({ color: "#3a3e44" });
  g.add(cil(0.07, 0.1, 6.2, m, 0, 3.1, 0, 8), caja(1.5, 0.07, 0.07, m, 0.7, 6.15, 0), caja(0.55, 0.1, 0.22, m, 1.35, 6.08, 0));
  const foco = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.03, 0.16), brillo(prendido ? "#ffd9a0" : "#2a2a2e")); foco.position.set(1.35, 6.02, 0); foco.layers.set(NOINK); g.add(foco);
  if (prendido) { const h = destello(255, 205, 140, 1.5, 0.35); h.position.set(1.35, 5.95, 0); g.add(h); const l = new THREE.PointLight("#ffd9a0", 14, 16, 1.4); l.position.set(1.35, 5.6, 0); g.add(l); }
  return g;
};

/** el fuego del coche: lenguas hechas con planos que se estiran (se animan con `fuego(t)`) */
const crearFuego = () => {
  const g = new THREE.Group();
  const tex = lienzo((c, w, h) => {
    const gr = c.createRadialGradient(w / 2, h * 0.8, 4, w / 2, h * 0.6, w * 0.5);
    gr.addColorStop(0, "rgba(255,240,170,1)"); gr.addColorStop(0.35, "rgba(255,150,40,0.9)"); gr.addColorStop(0.75, "rgba(200,50,20,0.4)"); gr.addColorStop(1, "rgba(120,20,10,0)");
    c.fillStyle = gr; c.beginPath(); c.moveTo(w * 0.1, h); c.quadraticCurveTo(w * 0.05, h * 0.5, w * 0.5, 0); c.quadraticCurveTo(w * 0.95, h * 0.5, w * 0.9, h); c.fill();
  }, 64, 128);
  const lenguas: THREE.Sprite[] = [];
  for (let k = 0; k < 7; k++) { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.layers.set(NOINK); s.center.set(0.5, 0); s.position.set((k - 3) * 0.3, 0, (rz(k) - 0.5) * 0.8); g.add(s); lenguas.push(s); }
  const luz = new THREE.PointLight("#ff8a3a", 6, 16, 1.6); luz.position.y = 1.2; g.add(luz);
  const halo = destello(255, 140, 50, 3, 0.3); halo.position.y = 1; g.add(halo);
  const animar = (t: number) => { lenguas.forEach((s, k) => { const a = 0.75 + 0.25 * Math.sin(t * 5.1 + k * 1.7) + 0.12 * Math.sin(t * 9.3 + k); s.scale.set(0.7 + 0.15 * Math.sin(t * 4 + k), 1.5 * a, 1); }); luz.intensity = 6 + 1.2 * Math.sin(t * 6.1) + 0.6 * Math.sin(t * 10.7); };
  return { g, animar, luz };
};

export function crearEscenario() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#8a9cc0", 0.5), hemi = new THREE.HemisphereLight("#9fb4dc", "#2a2e38", 0.7);
  const luna = new THREE.DirectionalLight("#aec2ee", 1.5); luna.position.set(-6, 14, -5);
  raiz.add(amb, hemi, luna, luna.target);
  const luzExtra = new THREE.PointLight("#ffc890", 0, 9, 1.6); raiz.add(luzExtra);
  const luzExtra2 = new THREE.PointLight("#ffc890", 0, 9, 1.6); raiz.add(luzExtra2);

  // cielo: luna y nubes (lejos, no reciben tinta)
  const cielo = new THREE.Group(); raiz.add(cielo);
  const lunaDisco = new THREE.Mesh(new THREE.CircleGeometry(5, 32), brillo("#e8eefc")); lunaDisco.position.set(-40, 62, 150); lunaDisco.lookAt(0, 0, 0); lunaDisco.layers.set(NOINK); cielo.add(lunaDisco);
  const lunaHalo = destello(190, 210, 255, 46, 0.5); lunaHalo.position.copy(lunaDisco.position); cielo.add(lunaHalo);

  // ================================================================ la avenida (se repite cada CALLE.tramo)
  const calle = new THREE.Group(); raiz.add(calle);
  const tramos: THREE.Group[] = [];
  const mAsf = lambert({ map: texAsfalto() }), mBan = lambert({ map: texBanqueta() }), mRaya = lambert({ color: "#c9c4b0" }), mAmar = lambert({ color: "#b99a34" });
  const fuego = crearFuego();
  for (let t = 0; t < 4; t++) {
    const g = new THREE.Group(); const L = CALLE.tramo;
    g.add(suelo(CALLE.ancho, L, mAsf, 0, 0, L / 2));
    for (const s of [-1, 1]) {
      g.add(caja(3.2, 0.16, L, mBan, s * (CALLE.ancho / 2 + 1.6), 0.08, L / 2));
      for (let k = 0; k < 8; k++) g.add(suelo(0.14, 3, mRaya, s * 1.9, 0.006, 3 + k * 6)); // rayas de carril
      g.add(suelo(0.12, L, mAmar, s * 0.09, 0.006, L / 2)); // doble raya amarilla
      // edificios (altos distintos) pegados a la banqueta
      let z = 0, n = 0;
      while (z < L - 1) {
        const w = 8 + rz(t * 31 + s * 7 + n) * 6, pisos = 2 + Math.floor(rz(t * 17 + s * 3 + n * 5) * 4), alto = 3.4 * (pisos + 1), ww = Math.min(w, L - z);
        const col = ["#4a4e58", "#5a5048", "#48545a", "#5e5a50", "#3e4450"][(n + t + (s > 0 ? 2 : 0)) % 5];
        const e = caja(7, alto, ww - 0.2, lambert({ map: texEdificio(t * 10 + n + (s > 0 ? 50 : 0), col, pisos) }), s * (CALLE.ancho / 2 + 3.2 + 3.5), alto / 2, z + ww / 2);
        g.add(e); g.add(caja(7.3, 0.25, ww, lambert({ color: "#2a2c32" }), s * (CALLE.ancho / 2 + 3.2 + 3.5), alto + 0.12, z + ww / 2)); // cornisa
        z += ww; n++;
      }
      for (let k = 0; k < 2; k++) { const p = poste((t + k + (s > 0 ? 1 : 0)) % 3 !== 0); p.position.set(s * (CALLE.ancho / 2 + 0.5), 0.16, 8 + k * 24 + (s > 0 ? 12 : 0)); p.rotation.y = s > 0 ? Math.PI : 0; g.add(p); }
    }
    // coches abandonados (fuera del carril central) y basura
    const cs = [["#7a2e2a", -4.45, 9, 0.06], ["#3a5a7a", 4.45, 21, -0.08], ["#8a8a80", -4.5, 34, 3.1], ["#3c6a4a", 4.45, 43, 0.04]] as [string, number, number, number][]; // pegados a la banqueta: el carril central queda libre para la cámara
    cs.forEach(([col, x, z, r], k) => { const quem = t === 1 && k === 1; const cc = coche(col, quem); cc.position.set(x, 0, z); cc.rotation.y = r; g.add(cc); if (quem) { fuego.g.position.set(x, 1.0, z + 0.6); g.add(fuego.g); } });
    for (let k = 0; k < 10; k++) g.add(caja(0.3 + rz(k + t) * 0.3, 0.05 + rz(k * 3 + t) * 0.2, 0.25 + rz(k * 5) * 0.3, lambert({ color: ["#5a544a", "#3a3e44", "#6a5a44"][k % 3] }), (rz(k * 7 + t) > 0.5 ? 1 : -1) * (2.6 + rz(k * 13 + t) * 2.2), 0.06, rz(k * 11 + t * 3) * L));
    calle.add(g); tramos.push(g);
  }
  /** coloca los tramos alrededor de la ambulancia: `avance` = metros recorridos */
  const avanzar = (avance: number) => {
    const L = CALLE.tramo, base = -(((avance % (4 * L)) + 4 * L) % (4 * L));
    tramos.forEach((g, i) => { let z = base + i * L; while (z < -1.5 * L) z += 4 * L; while (z > 2.5 * L) z -= 4 * L; g.position.z = z; });
  };

  // ================================================================ la ambulancia
  const ambu = new THREE.Group(); raiz.add(ambu);
  const A = AMB;
  const mBlanco = lambert({ map: texLamina("#e6e8ea") }), mNegro = lambert({ color: "#1a1c20" }), mGris = lambert({ color: "#6a7078" }), mInt = lambert({ map: texInterior(), side: THREE.DoubleSide });
  const mVidrio = new THREE.MeshLambertMaterial({ color: "#8fb0d0", transparent: true, opacity: 0.16, depthWrite: false });
  const chasis = new THREE.Group(); ambu.add(chasis); // se inclina al frenar
  // --- caja de atrás: cada pared es un grupo que se puede esconder (corte) ---
  const largoCaja = A.medio - A.atras, zc = (A.medio + A.atras) / 2, altoCaja = A.techoCaja - A.piso, yc = (A.techoCaja + A.piso) / 2;
  const paredes: { g: THREE.Group; p: THREE.Vector3; n: THREE.Vector3 }[] = [];
  const pared = (n: [number, number, number], p: [number, number, number]) => { const g = new THREE.Group(); chasis.add(g); paredes.push({ g, p: new THREE.Vector3(...p), n: new THREE.Vector3(...n) }); return g; };
  const gDer = pared([1, 0, 0], [-A.x, yc, zc]), gIzq = pared([-1, 0, 0], [A.x, yc, zc]), gTecho = pared([0, -1, 0], [0, A.techoCaja, zc]), gTras = pared([0, 0, 1], [0, yc, A.atras]);
  for (const [g, s] of [[gDer, -1], [gIzq, 1]] as [THREE.Group, number][]) {
    g.add(caja(0.06, altoCaja, largoCaja, mBlanco, s * A.x, yc, zc));
    g.add(plano(largoCaja, altoCaja, lambert({ map: texCostado(s > 0) }), s * (A.x + 0.036), yc, zc, s * Math.PI / 2));
    g.add(plano(largoCaja - 0.1, altoCaja - 0.1, mInt, s * (A.x - 0.036), yc, zc, -s * Math.PI / 2));
  }
  gTecho.add(caja(2 * A.x + 0.06, 0.07, largoCaja, mBlanco, 0, A.techoCaja, zc));
  const plafon = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 1.3), brillo("#e8f0ff")); plafon.rotation.x = Math.PI / 2; plafon.position.set(0, A.techoCaja - 0.04, zc); plafon.layers.set(NOINK); gTecho.add(plafon);
  const luzCaja = new THREE.PointLight("#dfe8ff", 1.6, 5, 1.5); luzCaja.position.set(0, A.techoCaja - 0.3, zc); chasis.add(luzCaja);
  // torreta (barra de luces) sobre la cabina, con sus dos colores
  const torreta = new THREE.Group(); torreta.position.set(0, A.techoCab + 0.09, (A.medio + A.cabina) / 2); chasis.add(torreta);
  torreta.add(caja(1.5, 0.06, 0.34, mNegro, 0, -0.04, 0));
  const tRoja = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.15, 0.3), brillo("#ff2a20")); tRoja.position.set(0.4, 0.06, 0); tRoja.layers.set(NOINK);
  const tAzul = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.15, 0.3), brillo("#2a55ff")); tAzul.position.set(-0.4, 0.06, 0); tAzul.layers.set(NOINK);
  const haloR = destello(255, 60, 40, 1.3, 0.6), haloA = destello(60, 100, 255, 1.3, 0.6); haloR.position.set(0.4, 0.1, 0); haloA.position.set(-0.4, 0.1, 0);
  const luzR = new THREE.PointLight("#ff3a2a", 0, 14, 1.5), luzA = new THREE.PointLight("#3a66ff", 0, 14, 1.5); luzR.position.set(0.6, 0.9, 0.4); luzA.position.set(-0.6, 0.9, 0.4);
  torreta.add(tRoja, tAzul, haloR, haloA, luzR, luzA);
  // puertas de atrás: dos hojas con ventana (la ventana derecha se rompe)
  gTras.add(caja(2 * A.x, 1.0, 0.06, mBlanco, 0, A.piso + 0.5, A.atras), caja(2 * A.x, 0.35, 0.06, mBlanco, 0, A.techoCaja - 0.17, A.atras));
  for (const x of [-A.x + 0.08, 0, A.x - 0.08]) gTras.add(caja(0.16, altoCaja - 1.35, 0.06, mBlanco, x, A.piso + 1.0 + (altoCaja - 1.35) / 2, A.atras));
  gTras.add(plano(2 * A.x, 1.0, lambert({ map: texAtras() }), 0, A.piso + 0.5, A.atras - 0.036, Math.PI));
  const vidrioTrasIzq = plano(A.x - 0.16, altoCaja - 1.35, mVidrio, A.x / 2 - 0.04, A.piso + 1.0 + (altoCaja - 1.35) / 2, A.atras); gTras.add(vidrioTrasIzq);
  const vidrioTrasDer = plano(A.x - 0.16, altoCaja - 1.35, mVidrio, -A.x / 2 + 0.04, A.piso + 1.0 + (altoCaja - 1.35) / 2, A.atras); gTras.add(vidrioTrasDer);
  // el vidrio roto: picos de vidrio en la orilla del marco
  const texRoto = lienzo((c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(200,225,250,0.75)"; c.strokeStyle = "rgba(255,255,255,0.9)"; c.lineWidth = 2;
    for (let k = 0; k < 9; k++) { const x = k * w / 8; c.beginPath(); c.moveTo(x - 16, 0); c.lineTo(x + (rz(k) - 0.5) * 14, 10 + rz(k + 2) * 22); c.lineTo(x + 16, 0); c.fill(); c.stroke(); c.beginPath(); c.moveTo(x - 16, h); c.lineTo(x + (rz(k + 5) - 0.5) * 14, h - 8 - rz(k + 7) * 18); c.lineTo(x + 16, h); c.fill(); c.stroke(); }
    for (let k = 0; k < 6; k++) { const y = k * h / 5; c.beginPath(); c.moveTo(0, y - 14); c.lineTo(8 + rz(k + 11) * 16, y); c.lineTo(0, y + 14); c.fill(); c.stroke(); c.beginPath(); c.moveTo(w, y - 14); c.lineTo(w - 8 - rz(k + 13) * 16, y); c.lineTo(w, y + 14); c.fill(); c.stroke(); } }, 256, 256);
  const vidrioRoto = plano(A.x - 0.16, altoCaja - 1.35, new THREE.MeshBasicMaterial({ map: texRoto, transparent: true, depthWrite: false, toneMapped: false, opacity: 0.8, side: THREE.DoubleSide }), -A.x / 2 + 0.04, A.piso + 1.0 + (altoCaja - 1.35) / 2, A.atras + 0.006); vidrioRoto.layers.set(NOINK); vidrioRoto.visible = false; gTras.add(vidrioRoto);
  gTras.add(caja(2 * A.x + 0.1, 0.14, 0.2, mNegro, 0, A.piso - 0.1, A.atras - 0.1)); // defensa con escalón
  for (const s of [-1, 1]) { const cal = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.3, 0.03), brillo("#c8281e")); cal.position.set(s * (A.x - 0.1), A.piso + 0.75, A.atras - 0.05); cal.layers.set(NOINK); gTras.add(cal); }
  // piso y mamparo (pared entre la cabina y la caja, con ventanilla)
  chasis.add(caja(2 * A.x, 0.08, A.nariz - A.atras - 0.2, mNegro, 0, A.piso - 0.04, (A.nariz + A.atras) / 2 - 0.1));
  chasis.add(suelo(2 * A.x - 0.14, largoCaja - 0.1, lambert({ map: texPisoAmb() }), 0, A.piso + 0.006, zc));
  const gMamp = pared([0, 0, -1], [0, yc, A.medio]);
  gMamp.add(caja(2 * A.x, altoCaja, 0.05, mBlanco, 0, yc, A.medio), plano(2 * A.x - 0.14, altoCaja - 0.1, mInt, 0, yc, A.medio - 0.03, Math.PI));
  gMamp.add(plano(1.5, 0.75, lambert({ map: texGabinete() }), 0, A.piso + 1.75, A.medio - 0.036, Math.PI));
  // adentro: camilla (colchón, barandal, ruedas, almohada, correas), banca con cojín, tanque de oxígeno, suero
  const interior = new THREE.Group(); chasis.add(interior);
  const mCam = lambert({ color: "#9aa2a8" }), mColchon = lambert({ color: "#2f5a8a" });
  const cam = new THREE.Group(); cam.position.set(CAMILLA.x, A.piso, CAMILLA.z); interior.add(cam);
  cam.add(caja(0.62, 0.05, 1.95, mCam, 0, 0.5, 0), caja(0.56, 0.1, 1.85, mColchon, 0, 0.575, 0), caja(0.4, 0.09, 0.34, lambert({ color: "#e8e8e4" }), 0, 0.67, 0.7));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cam.add(caja(0.035, 0.42, 0.035, mCam, sx * 0.27, 0.27, sz * 0.8)); const r = cil(0.06, 0.06, 0.04, mNegro, sx * 0.27, 0.06, sz * 0.8, 10); r.rotation.z = Math.PI / 2; cam.add(r); }
  for (const z of [-0.35, 0.25]) cam.add(caja(0.6, 0.012, 0.07, lambert({ color: "#c8a23a" }), 0, 0.632, z)); // correas
  for (const sx of [-1, 1]) cam.add(caja(0.025, 0.025, 1.2, mCam, sx * 0.31, 0.74, -0.1), caja(0.025, 0.2, 0.025, mCam, sx * 0.31, 0.64, 0.5), caja(0.025, 0.2, 0.025, mCam, sx * 0.31, 0.64, -0.7));
  const ban = new THREE.Group(); ban.position.set(BANCA.x, A.piso, BANCA.z); interior.add(ban);
  ban.add(caja(0.5, 0.34, 2.1, lambert({ color: "#c2c8ca" }), 0.1, 0.17, 0), caja(0.5, 0.07, 2.1, lambert({ color: "#3a6a9a" }), 0.1, 0.375, 0), caja(0.07, 0.6, 2.1, lambert({ color: "#3a6a9a" }), 0.3, 0.75, 0));
  const tanque = new THREE.Group(); tanque.position.set(A.x - 0.2, A.piso, A.medio - 0.3); interior.add(tanque);
  tanque.add(cil(0.1, 0.1, 0.8, lambert({ color: "#3a8a5a" }), 0, 0.4, 0), cil(0.05, 0.1, 0.12, lambert({ color: "#3a8a5a" }), 0, 0.86, 0), cil(0.035, 0.035, 0.08, mGris, 0, 0.95, 0), caja(0.1, 0.07, 0.07, mGris, 0.05, 0.98, 0));
  const suero = new THREE.Group(); suero.position.set(-A.x + 0.14, A.piso, A.atras + 0.3); interior.add(suero);
  suero.add(cil(0.012, 0.012, 1.7, mGris, 0, 0.85, 0, 6), caja(0.3, 0.015, 0.015, mGris, 0, 1.7, 0), caja(0.13, 0.22, 0.04, new THREE.MeshLambertMaterial({ color: "#cfe4f0", transparent: true, opacity: 0.8 }), 0.1, 1.56, 0));
  // --- cabina y cofre ---
  const gCab = new THREE.Group(); chasis.add(gCab);
  const altoCab = A.techoCab - A.piso;
  gCab.add(caja(2 * A.x, 0.07, A.cabina - A.medio, mBlanco, 0, A.techoCab, (A.medio + A.cabina) / 2)); // techo
  for (const s of [-1, 1]) { // puertas: parte baja de lámina, ventana, poste
    gCab.add(caja(0.06, 0.78, A.cabina - A.medio, mBlanco, s * A.x, A.piso + 0.39, (A.medio + A.cabina) / 2));
    gCab.add(plano(A.cabina - A.medio, 0.78, lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#e6e8ea"; c.fillRect(0, 0, w, h); c.fillStyle = "#e0661e"; c.fillRect(0, h * 0.25, w, h * 0.22); c.fillStyle = "#2f5fae"; c.fillRect(0, h * 0.5, w, h * 0.06); c.strokeStyle = "#3a3e44"; c.lineWidth = 3; c.strokeRect(6, 4, w - 12, h - 8); c.fillStyle = "#3a3e44"; c.fillRect(w * 0.12, h * 0.08, 34, 8); }, 256, 128) }), s * (A.x + 0.036), A.piso + 0.39, (A.medio + A.cabina) / 2, s * Math.PI / 2));
    gCab.add(caja(0.06, altoCab - 0.78, 0.09, mBlanco, s * A.x, A.piso + 0.78 + (altoCab - 0.78) / 2, A.medio + 0.05), caja(0.07, altoCab - 0.78, 0.09, mBlanco, s * A.x, A.piso + 0.78 + (altoCab - 0.78) / 2, A.cabina - 0.05));
    gCab.add(plano(A.cabina - A.medio - 0.2, altoCab - 0.82, mVidrio, s * A.x, A.piso + 0.78 + (altoCab - 0.78) / 2, (A.medio + A.cabina) / 2, s * Math.PI / 2));
    // espejo lateral
    gCab.add(caja(0.2, 0.03, 0.03, mNegro, s * (A.x + 0.12), A.piso + 1.0, A.cabina - 0.12), caja(0.05, 0.3, 0.18, mNegro, s * (A.x + 0.24), A.piso + 1.05, A.cabina - 0.12));
  }
  const parabrisas = plano(2 * A.x - 0.16, altoCab - 0.8, mVidrio, 0, A.piso + 0.76 + (altoCab - 0.76) / 2, A.cabina + 0.012); gCab.add(parabrisas);
  gCab.add(caja(2 * A.x, 0.09, 0.07, mBlanco, 0, A.techoCab - 0.06, A.cabina)); // marco de arriba del parabrisas
  // cofre con letrero, parrilla, faros, defensa
  const gCofre = new THREE.Group(); chasis.add(gCofre);
  gCofre.add(caja(2 * A.x, A.cofre - A.piso + 0.12, A.nariz - A.cabina, mBlanco, 0, (A.cofre + A.piso - 0.12) / 2, (A.nariz + A.cabina) / 2));
  const letCofre = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), lambert({ map: texCofre() })); letCofre.rotation.x = -Math.PI / 2; letCofre.position.set(0, A.cofre + 0.006, (A.nariz + A.cabina) / 2); gCofre.add(letCofre);
  gCofre.add(caja(1.1, 0.3, 0.04, mNegro, 0, A.piso + 0.32, A.nariz + 0.02), caja(2 * A.x + 0.14, 0.2, 0.16, mGris, 0, A.piso - 0.02, A.nariz + 0.06));
  for (let k = 0; k < 5; k++) gCofre.add(caja(1.04, 0.02, 0.02, mGris, 0, A.piso + 0.22 + k * 0.05, A.nariz + 0.045));
  const faros: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const f = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.22, 0.03), brillo("#fff2c8")); f.position.set(s * 0.78, A.piso + 0.34, A.nariz + 0.02); f.layers.set(NOINK); gCofre.add(f); faros.push(f); const h = destello(255, 240, 200, 0.9, 0.5); h.position.set(s * 0.78, A.piso + 0.34, A.nariz + 0.1); gCofre.add(h); }
  const luzFaros = new THREE.SpotLight("#fff0c8", 9, 30, 0.5, 0.6, 1.2); luzFaros.position.set(0, A.piso + 0.4, A.nariz); luzFaros.target.position.set(0, 0, A.nariz + 12); chasis.add(luzFaros, luzFaros.target);
  // tablero, volante (casi acostado y bajo: nunca tapa la boca), asientos con cabecera
  const gTab = new THREE.Group(); chasis.add(gTab);
  gTab.add(caja(2 * A.x - 0.12, 0.3, 0.34, mNegro, 0, A.piso + 0.62, A.cabina - 0.2));
  const vol = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 8, 20), mNegro); vol.position.set(CHOFER.x, A.piso + 0.78, A.cabina - 0.44); vol.rotation.x = -1.05; gTab.add(vol);
  gTab.add(caja(0.05, 0.05, 0.3, mNegro, CHOFER.x, A.piso + 0.72, A.cabina - 0.32));
  for (const s of [-1, 1]) gTab.add(caja(0.56, 0.75, 0.1, lambert({ color: "#2c3038" }), s * 0.48, A.piso + 0.75, A.medio + 0.16), caja(0.3, 0.2, 0.09, lambert({ color: "#2c3038" }), s * 0.48, A.piso + 1.25, A.medio + 0.16));
  const luzCab = new THREE.PointLight("#bcd0ff", 0.9, 3.5, 1.5); luzCab.position.set(0, A.piso + 1.0, A.cabina + 0.5); chasis.add(luzCab);
  // llantas (giran) y salpicaderas
  const llantas: THREE.Group[] = [];
  const mLl = lambert({ color: "#131315" }), mRin = lambert({ color: "#8a8e96" });
  for (const s of [-1, 1]) for (const z of [-2.0, 2.45]) {
    const g = new THREE.Group(); g.position.set(s * (A.x - 0.08), 0.46, z); ambu.add(g);
    const ll = cil(0.46, 0.46, 0.3, mLl, 0, 0, 0, 18); ll.rotation.z = Math.PI / 2; g.add(ll);
    const rin = cil(0.24, 0.24, 0.31, mRin, 0, 0, 0, 12); rin.rotation.z = Math.PI / 2; g.add(rin);
    for (let k = 0; k < 3; k++) { const b = caja(0.32, 0.07, 0.44, mNegro, 0, 0, 0); b.rotation.x = k * Math.PI / 3; g.add(b); }
    llantas.push(g);
    chasis.add(caja(0.1, 0.1, 1.15, mNegro, s * (A.x + 0.02), 0.98, z));
  }

  // ================================================================ el mercado (al lado derecho de la ambulancia)
  const mercado = new THREE.Group(); raiz.add(mercado);
  const M = MERC, mw = M.x1 - M.x0, md = M.z1 - M.z0, mxc = (M.x0 + M.x1) / 2, mzc = (M.z0 + M.z1) / 2;
  mercado.add(caja(mw, M.alto, md, lambert({ map: texConcreto([3, 1]) }), mxc, M.alto / 2 - 0.02, mzc));
  mercado.add(plano(md, M.alto, lambert({ map: texFachadaMercado() }), M.x1 + 0.012, M.alto / 2, mzc, Math.PI / 2)); // fachada a la calle
  mercado.add(plano(6.4, 1.6, lambert({ map: texLetreroMercado() }), M.x1 + 0.04, 3.7, mzc + 3.6, Math.PI / 2));
  mercado.add(caja(0.9, 0.12, md, lambert({ color: "#7a2a24" }), M.x1 + 0.45, 2.75, mzc)); // marquesina
  // banqueta y calle frente al mercado
  const zonaMercado = new THREE.Group(); mercado.add(zonaMercado);
  zonaMercado.add(suelo(40, 60, mAsf, 8, -0.004, 1), caja(1.6, 0.16, md + 6, mBan, M.x1 + 0.8, 0.08, mzc));
  for (let k = 0; k < 3; k++) { const e = caja(8, 9 + k * 3, 14, lambert({ map: texEdificio(70 + k, ["#4a4e58", "#5a5048", "#48545a"][k], 3 + k) }), 16, (9 + k * 3) / 2, -16 + k * 15); zonaMercado.add(e); }
  const posteM = poste(false); posteM.position.set(M.x1 + 1.3, 0.16, -4.5); zonaMercado.add(posteM);
  // --- azotea ---
  const az = new THREE.Group(); az.position.y = AZOTEA; mercado.add(az);
  az.add(suelo(mw, md, lambert({ map: texAzotea() }), mxc, 0.006, mzc));
  const mPretil = lambert({ map: texConcreto([4, 1]) });
  // pretil (barda baja) en las cuatro orillas; el de la calle tiene un hueco donde se amarra la escalera
  const pretilCalle = new THREE.Group(); az.add(pretilCalle);
  pretilCalle.add(caja(0.22, 0.75, ESCALERA.z - 0.55 - M.z0, mPretil, M.x1 - 0.11, 0.375, (M.z0 + ESCALERA.z - 0.55) / 2), caja(0.22, 0.75, M.z1 - ESCALERA.z - 0.55, mPretil, M.x1 - 0.11, 0.375, (M.z1 + ESCALERA.z + 0.55) / 2));
  az.add(caja(0.22, 0.75, md, mPretil, M.x0 + 0.11, 0.375, mzc), caja(mw, 0.75, 0.22, mPretil, mxc, 0.375, M.z1 - 0.11), caja(mw, 0.75, 0.22, mPretil, mxc, 0.375, M.z0 + 0.11));
  // cuarto de azotea con la pared de las reglas, puerta de lámina y foco
  const cuarto = new THREE.Group(); az.add(cuarto);
  const R = PARED_REGLAS;
  cuarto.add(caja(R.ancho, R.alto, 2.4, lambert({ map: texTabique() }), R.x, R.alto / 2, R.z - 1.2 - 0.004));
  cuarto.add(plano(R.ancho - 1.1, R.alto, lambert({ map: texReglas() }), R.x - 0.55, R.alto / 2, R.z + 0.008));
  cuarto.add(caja(0.9, 1.95, 0.05, lambert({ color: "#3e5a6a" }), R.x + R.ancho / 2 - 0.55, 0.975, R.z + 0.02), caja(0.06, 0.12, 0.04, mGris, R.x + R.ancho / 2 - 0.9, 1.0, R.z + 0.06));
  cuarto.add(caja(R.ancho + 0.3, 0.12, 2.7, lambert({ color: "#4a4a48" }), R.x, R.alto + 0.06, R.z - 1.2));
  // tinaco con base, tanque de gas, tendedero, antena
  const tin = new THREE.Group(); tin.position.set(R.x + 0.4, R.alto + 0.12, R.z - 1.3); cuarto.add(tin);
  tin.add(cil(0.62, 0.7, 1.15, lambert({ color: "#1e1e22" }), 0, 0.72, 0, 20), cil(0.3, 0.62, 0.22, lambert({ color: "#1e1e22" }), 0, 1.4, 0, 20), caja(1.5, 0.14, 1.5, mPretil, 0, 0.07, 0), cil(0.03, 0.03, 1.4, mGris, 0.72, 0.5, 0.2, 6));
  const gas = new THREE.Group(); gas.position.set(M.x0 + 1.4, 0, M.z1 - 1.4); az.add(gas);
  const gz = cil(0.34, 0.34, 1.5, lambert({ color: "#d8d8d2" }), 0, 0.6, 0, 14); gz.rotation.z = Math.PI / 2; gas.add(gz, caja(0.08, 0.5, 0.5, mGris, -0.5, 0.25, 0), caja(0.08, 0.5, 0.5, mGris, 0.5, 0.25, 0), cil(0.05, 0.05, 0.14, mGris, 0, 0.98, 0, 8));
  const mPalo = lambert({ color: "#5a4a3a" });
  for (const z of [M.z0 + 0.9, M.z1 - 3.4]) az.add(cil(0.035, 0.035, 2.1, mPalo, M.x0 + 0.8, 1.05, z, 6));
  az.add(caja(0.012, 0.012, md - 4.3, lambert({ color: "#c8c4b8" }), M.x0 + 0.8, 2.0, (M.z0 + 0.9 + M.z1 - 3.4) / 2));
  for (let k = 0; k < 4; k++) az.add(caja(0.02, 0.55 + (k % 2) * 0.2, 0.6, lambert({ color: ["#8a9ab0", "#b0a08a", "#7a8a7a", "#a88a8a"][k], side: THREE.DoubleSide }), M.x0 + 0.8, 1.7 - (k % 2) * 0.1, M.z0 + 3 + k * 1.5));
  // lona de refugio: cuatro palos y una lona azul inclinada; abajo, catres y huacales
  const mLona = lambert({ map: texLona("#2f5f9a"), side: THREE.DoubleSide });
  const refugio = new THREE.Group(); refugio.position.set(-9.1, 0, 5.2); az.add(refugio);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) refugio.add(cil(0.035, 0.035, sz > 0 ? 2.3 : 1.9, mPalo, sx * 2.2, (sz > 0 ? 2.3 : 1.9) / 2, sz * 1.5, 6));
  const lona = new THREE.Mesh(new THREE.PlaneGeometry(4.7, 3.3), mLona); lona.rotation.x = -Math.PI / 2 + 0.133; lona.position.set(0, 2.1, 0); refugio.add(lona);
  const mMad = lambert({ map: texMadera() }), mTela = lambert({ color: "#6a7a5a" });
  const catres: THREE.Group[] = [];
  for (let k = 0; k < 3; k++) { const ct = catre(mPalo, mTela); ct.position.set(-1.5 + k * 1.5, 0, 0); refugio.add(ct); catres.push(ct); }
  // el catre con cuerdas (regla 3): postes en las esquinas y cuerdas amarradas
  const catreAmarre = catre(mPalo, lambert({ color: "#7a6a5a" })); catreAmarre.position.set(-4.6, 0, -2.0); catreAmarre.rotation.y = 0.25; az.add(catreAmarre);
  const mCuerda = lambert({ color: "#c9b48a" });
  for (const z of [-0.5, 0.1, 0.6]) { const cu = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.018, 6, 20), mCuerda); cu.rotation.y = Math.PI / 2; cu.rotation.x = 0; cu.scale.set(1, 0.32, 1); cu.position.set(0, 0.4, z); cu.rotation.set(0, 0, 0); catreAmarre.add(cu); }
  const rollo = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.05, 8, 16), mCuerda); rollo.rotation.x = Math.PI / 2; rollo.position.set(0.1, 0.43, -0.75); catreAmarre.add(rollo);
  // huacales, garrafones, botes, fogata apagada de tabiques
  const cajas = new THREE.Group(); az.add(cajas);
  cajas.add(huacal(-4.6, 0, 6.8, mMad), huacal(-4.55, 0.4, 6.85, mMad, 0.55, 0.36, 0.42), huacal(-3.8, 0, 6.9, mMad));
  for (let k = 0; k < 3; k++) { const g = new THREE.Group(); g.position.set(-10.6 + k * 0.42, 0, 4.2); g.add(cil(0.17, 0.17, 0.42, new THREE.MeshLambertMaterial({ color: "#6aa8d8", transparent: true, opacity: 0.75 }), 0, 0.21, 0, 12), cil(0.06, 0.15, 0.1, new THREE.MeshLambertMaterial({ color: "#6aa8d8", transparent: true, opacity: 0.75 }), 0, 0.47, 0, 12), cil(0.045, 0.045, 0.05, lambert({ color: "#2a4a8a" }), 0, 0.54, 0, 8)); az.add(g); }
  // linternas colgadas y en el piso
  const linternas: THREE.Group[] = [];
  for (const [x, y, z] of [[R.x - 2.0, 0.006, R.z + 0.9], [-9.1, 0.006, 3.3], [M.x1 - 0.6, 0.76, ESCALERA.z + 1.6], [-4.2, 0.8, 6.85]] as [number, number, number][]) { const l = lampara(); l.position.set(x, y, z); az.add(l); linternas.push(l); }
  const luzAz1 = new THREE.PointLight("#ffc888", 3.2, 9, 1.5); luzAz1.position.set(R.x - 1.6, 1.2, R.z + 1.4); az.add(luzAz1);
  const luzAz2 = new THREE.PointLight("#ffc888", 2.6, 8, 1.5); luzAz2.position.set(-8.3, 1.3, 4.0); az.add(luzAz2);
  const luzAz3 = new THREE.PointLight("#ffc888", 1.6, 6, 1.5); luzAz3.position.set(M.x1 - 1.0, 1.2, ESCALERA.z + 1.4); az.add(luzAz3);
  // el lugar de ustedes: dos huacales contra el pretil del fondo (para sentarse) y la cobija
  const LUGAR = new THREE.Vector3(-5.6, 0, M.z1 - 0.62);
  const asientos = new THREE.Group(); az.add(asientos);
  asientos.add(huacal(LUGAR.x - 0.45, 0, LUGAR.z, mMad, 0.8, 0.38, 0.5), huacal(LUGAR.x + 0.45, 0, LUGAR.z, mMad, 0.8, 0.38, 0.5));
  const mCob = lambert({ map: texCobija("#8a3a34", "#c9b48a"), side: THREE.DoubleSide });
  /** cobija sobre las piernas y el pecho de los dos (delante de las tarjetas; nunca llega a la boca) */
  const cobija = new THREE.Group(); cobija.position.copy(LUGAR); az.add(cobija);
  const cobFrente = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5, 8, 3), mCob); cobFrente.position.set(0, 0.24, -0.5); cobija.add(cobFrente);
  const cobArriba = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.5, 8, 2), mCob); cobArriba.rotation.x = -Math.PI / 2 + 0.4; cobArriba.position.set(0, 0.57, -0.27); cobija.add(cobArriba);
  { const p = cobFrente.geometry.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.04 * Math.sin(p.getX(i) * 7) * (0.5 - p.getY(i))); p.needsUpdate = true; cobFrente.geometry.computeVertexNormals(); }
  cobija.visible = false;
  // cobija doblada (la que te dan)
  const cobijaDoblada = new THREE.Group(); cobijaDoblada.add(caja(0.5, 0.12, 0.36, mCob, 0, 0.06, 0), caja(0.5, 0.02, 0.37, lambert({ color: "#c9b48a" }), 0, 0.125, 0)); cobijaDoblada.visible = false; az.add(cobijaDoblada);

  // --- la escalera de aluminio (se baja desde la azotea y se sube) ---
  const escalera = new THREE.Group(); escalera.position.copy(ESCALERA); mercado.add(escalera);
  const mAlu = lambert({ color: "#aab2ba" }), ALTO_ESC = AZOTEA + 1.0;
  for (const s of [-1, 1]) escalera.add(caja(0.05, ALTO_ESC, 0.07, mAlu, 0, ALTO_ESC / 2, s * 0.24));
  for (let k = 0; k < 19; k++) escalera.add(caja(0.035, 0.035, 0.48, mAlu, 0, 0.3 + k * 0.32, 0));
  for (const s of [-1, 1]) escalera.add(caja(0.07, 0.05, 0.09, mNegro, 0, 0.025, s * 0.24)); // tapones de hule
  // cuerda con la que la amarran arriba
  const cuerdaEsc = caja(0.5, 0.025, 0.025, mCuerda, -0.3, ALTO_ESC - 0.2, 0.24); escalera.add(cuerdaEsc);

  // --- multitud de zombies al pie de la pared (planos con cabezas y manos) ---
  const multitud = new THREE.Group(); mercado.add(multitud);
  const filas: THREE.Mesh[] = [];
  for (let k = 0; k < 5; k++) {
    const m = new THREE.MeshLambertMaterial({ map: texMultitud(k * 4 + 1), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 0.1 });
    m.emissiveMap = m.map;
    const geo = new THREE.PlaneGeometry(13, 4.9); geo.translate(0, 2.45, 0);
    const p = new THREE.Mesh(geo, m); p.rotation.y = -Math.PI / 2; p.layers.set(NOINK);
    const sop = new THREE.Group(); sop.position.set(M.x1 + 0.7 + k * 0.95, -1.3 - k * 0.04, 1.2 + (k % 2 ? 0.45 : -0.3)); sop.add(p); multitud.add(sop); filas.push(sop as unknown as THREE.Mesh);
  }
  multitud.visible = false;

  // haces de las linternas de la gente de la azotea (conos de luz suaves)
  const texHaz = lienzo((c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,240,200,0.75)"); g.addColorStop(1, "rgba(255,240,200,0)"); c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.46, 0); c.lineTo(w * 0.54, 0); c.lineTo(w, h); c.lineTo(0, h); c.fill(); }, 128, 256);
  const haces: THREE.Mesh[] = [];
  for (let k = 0; k < 3; k++) { const hz = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 6.5), new THREE.MeshBasicMaterial({ map: texHaz, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.16, side: THREE.DoubleSide })); hz.geometry.translate(0, -3.25, 0); hz.layers.set(NOINK); hz.visible = false; mercado.add(hz); haces.push(hz); }
  const luzLinterna = new THREE.SpotLight("#fff0c8", 0, 16, 0.42, 0.5, 1.0); mercado.add(luzLinterna, luzLinterna.target);

  return {
    raiz, amb, hemi, luna, luzExtra, luzExtra2, cielo,
    calle, avanzar, fuego,
    ambu, chasis, paredes, interior, llantas, torreta, tRoja, tAzul, haloR, haloA, luzR, luzA, luzCaja, luzCab, luzFaros, faros, vidrioTrasDer, vidrioRoto, gCab, gCofre, gTab, plafon,
    mercado, zonaMercado, az, escalera, ALTO_ESC, pretilCalle, cuarto, refugio, catres, catreAmarre, asientos, cobija, cobijaDoblada, LUGAR, linternas, luzAz1, luzAz2, luzAz3,
    multitud, filas, haces, luzLinterna,
  };
}
export type Escenario = ReturnType<typeof crearEscenario>;
