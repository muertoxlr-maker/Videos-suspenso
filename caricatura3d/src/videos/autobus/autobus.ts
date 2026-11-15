// Escenario de «El autobús escolar» (zombies). Se reusan la avenida de noche de «La ambulancia» (ciudad caída) y el
// camión de «El camión escolar» (por fuera y por dentro). Lo nuevo:
//  · el parque de donde salen los zombies (reja con su entrada, letrero, árboles, juegos, bancas y faroles), puesto en
//    el tramo de avenida donde arranca el camión;
//  · el puesto de periódicos que el camión tumba (sus piezas salen volando, con las hojas);
//  · la escuela por fuera: barda, portón de reja de dos hojas que se cierra con cadena y candado, letrero, patio con
//    cancha, asta bandera, canasta y el edificio con su puerta;
//  · el salón: pizarrón con las tres reglas escritas con gis, escritorio de la maestra con la lista, doce mesabancos con
//    su número, ventanas con cortinas cerradas (y sombras de manos detrás), reloj, abecedario, mapa, lámparas de techo y
//    la puerta con ventanita esmerilada (detrás, la silueta del pasillo) y su perilla que gira.
// Acabado §8.9; §8.6c (capas ≥ 5 mm, puertas que se abren, nada se atraviesa) y §8.6d (cada cosa con sus piezas).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { cartel } from "../comun/utileria";
import { crearEscenario as crearAvenida, coche, manchas, poste, texAsfalto, texBanqueta, texConcreto, texEdificio } from "../ambulancia/ambulancia";
import { crearCamion } from "../camion/camion";

export const BUS_Y = 0.8; // el piso del camión queda 0.8 m sobre la calle
export const AV0 = 30; // metros de avenida al arrancar (así ningún coche estorba la puerta)
export const SALON = { x: 4, z: 4.5, alto: 3 }; // salón: x ∈ [−4, 4], z ∈ [−4.5, 4.5]; el pizarrón en z = −4.5
export const PUPITRES: [number, number][] = []; // (x, z) de cada silla: 4 columnas × 3 filas; el 12 (tú) atrás a la derecha
for (const z of [-1.7, -0.2, 1.3]) for (const x of [-2.4, -0.8, 0.8, 2.4]) PUPITRES.push([x, z]);
export const PUERTA_S = { x: 4, z: 3.0, ancho: 0.95, alto: 2.1 }; // puerta del salón (pared derecha)
export const ESCRITORIO = new THREE.Vector3(-1.7, 0, -3.35);
export const ESC = { barda: 8.7, porton: 3.0, edificio: 27 }; // escuela: barda en x = 8.7, portón z ∈ [−3, 3]

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cil = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 14) => {
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
const texPasto = () => lienzo((c, w, h) => {
  c.fillStyle = "#2e4630"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { c.strokeStyle = `rgba(${k % 3 ? "70,100,60" : "20,34,22"},0.6)`; c.lineWidth = 1.5; const x = rz(k) * w, y = rz(k + 900) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rz(k + 7) - 0.5) * 4, y - 6); c.stroke(); }
  manchas(c, w, h, 8, "60,50,30", 0.3);
}, 256, 256, [6, 10]);
const texTierra = () => lienzo((c, w, h) => { c.fillStyle = "#5a4a38"; c.fillRect(0, 0, w, h); manchas(c, w, h, 10, "30,22,14", 0.35); for (let k = 0; k < 300; k++) { c.fillStyle = "rgba(140,120,90,0.4)"; c.fillRect(rz(k) * w, rz(k + 5) * h, 2, 2); } }, 128, 128, [2, 4]);
const texCancha = () => lienzo((c, w, h) => { // patio de concreto con la cancha pintada (líneas blancas gastadas)
  c.fillStyle = "#7a7a76"; c.fillRect(0, 0, w, h); manchas(c, w, h, 24, "30,30,28", 0.3);
  c.strokeStyle = "rgba(230,226,210,0.75)"; c.lineWidth = 6; c.strokeRect(60, 80, w - 120, h - 160);
  c.beginPath(); c.moveTo(60, h / 2); c.lineTo(w - 60, h / 2); c.stroke(); c.beginPath(); c.arc(w / 2, h / 2, 70, 0, 7); c.stroke();
  c.strokeStyle = "rgba(200,60,50,0.6)"; c.lineWidth = 5; c.strokeRect(w / 2 - 120, 80, 240, 120); c.strokeRect(w / 2 - 120, h - 200, 240, 120);
  c.strokeStyle = "rgba(20,20,20,0.5)"; c.lineWidth = 2; for (let k = 0; k < 6; k++) { c.beginPath(); c.moveTo(0, k * h / 6); c.lineTo(w, k * h / 6); c.stroke(); }
}, 1024, 1024);
const texBarda = () => lienzo((c, w, h) => { // barda de la escuela: blanca arriba, guinda abajo, con un mural infantil gastado
  c.fillStyle = "#d8d2c0"; c.fillRect(0, 0, w, h); c.fillStyle = "#7a2a2e"; c.fillRect(0, h * 0.68, w, h * 0.32);
  manchas(c, w, h, 16, "40,34,26", 0.3);
  const col = ["#e0a030", "#3a7ab0", "#c84a3a", "#4a9a5a"];
  for (let k = 0; k < 4; k++) { const x = 60 + k * (w - 120) / 4; c.fillStyle = col[k]; c.beginPath(); c.arc(x + 40, h * 0.35, 30, 0, 7); c.fill(); c.fillRect(x + 30, h * 0.4, 20, 60); }
  c.fillStyle = "#e8c030"; c.beginPath(); c.arc(w - 70, 50, 34, 0, 7); c.fill();
  c.fillStyle = "rgba(96,22,18,0.75)"; for (let k = 0; k < 6; k++) { const x = 30 + rz(k * 3) * (w - 60), y = h * 0.55 + rz(k * 5) * h * 0.3; c.beginPath(); c.ellipse(x, y, 10, 13, 0, 0, 7); c.fill(); for (let d = -2; d <= 2; d++) c.fillRect(x + d * 5 - 2, y - 26, 4, 16); }
}, 512, 256);
const texFachada = () => lienzo((c, w, h) => { // edificio de la escuela: dos pisos, ventanas con reja, puerta al centro
  c.fillStyle = "#c9b98e"; c.fillRect(0, 0, w, h); c.fillStyle = "#7a2a2e"; c.fillRect(0, h * 0.9, w, h * 0.1); c.fillRect(0, h * 0.46, w, h * 0.03);
  manchas(c, w, h, 20, "40,34,26", 0.3);
  for (let p = 0; p < 2; p++) for (let v = 0; v < 6; v++) {
    if (p === 1 && (v === 2 || v === 3)) continue; // la puerta
    const x = 30 + v * (w - 60) / 6 + 14, y = 40 + p * h * 0.46, vw = (w - 60) / 6 - 28, vh = h * 0.3;
    const luz = rz(p * 7 + v) > 0.75;
    c.fillStyle = luz ? "#c9b070" : "#1a2230"; c.fillRect(x, y, vw, vh);
    c.strokeStyle = "#2a2a2c"; c.lineWidth = 4; c.strokeRect(x, y, vw, vh); for (let b = 1; b < 5; b++) { c.beginPath(); c.moveTo(x + b * vw / 5, y); c.lineTo(x + b * vw / 5, y + vh); c.stroke(); }
  }
}, 1024, 512);
const texLetreroEsc = () => lienzo((c, w, h) => {
  c.fillStyle = "#e6dcc2"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1f3f6a"; c.lineWidth = 10; c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = "#1f3f6a"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 60px 'DejaVu Sans', sans-serif"; c.fillText("ESCUELA PRIMARIA", w / 2, h * 0.36);
  c.fillStyle = "#8a2a2e"; c.font = "bold 70px 'DejaVu Sans', sans-serif"; c.fillText("«LA ESPERANZA»", w / 2, h * 0.72);
  manchas(c, w, h, 8, "40,34,26", 0.25);
}, 1024, 256);
const texParque = () => lienzo((c, w, h) => {
  c.fillStyle = "#2f5a3a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#e8e0c8"; c.lineWidth = 8; c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = "#f0e8d0"; c.textAlign = "center"; c.textBaseline = "middle"; c.font = "bold 64px 'DejaVu Sans', sans-serif"; c.fillText("PARQUE", w / 2, h * 0.38);
  c.font = "bold 34px 'DejaVu Sans', sans-serif"; c.fillText("LOS FRESNOS", w / 2, h * 0.75); manchas(c, w, h, 5, "10,14,12", 0.35);
}, 512, 200);
const texPeriodico = (k: number) => lienzo((c, w, h) => { // hoja de periódico: cabeza, foto y columnas
  c.fillStyle = "#e8e4d8"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#1a1a1a"; c.font = "bold 22px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText(["¡ALERTA!", "CAOS", "¡HUYAN!"][k % 3], w / 2, 26);
  c.fillStyle = "#6a6a6a"; c.fillRect(10, 36, w * 0.5, h * 0.35);
  c.fillStyle = "#4a4a4a"; for (let y = 40; y < h - 6; y += 7) { c.fillRect(w * 0.56, y, w * 0.38, 3); if (y > h * 0.45) c.fillRect(10, y, w * 0.5, 3); }
}, 128, 160);
const texRevistas = () => lienzo((c, w, h) => { // el exhibidor de revistas del puesto
  c.fillStyle = "#2a2c30"; c.fillRect(0, 0, w, h);
  const col = ["#c83a3a", "#e0b030", "#3a7ab0", "#e86aa0", "#4aa05a", "#f0f0e8", "#8a4ab0"];
  for (let r = 0; r < 3; r++) for (let k = 0; k < 6; k++) { const x = 8 + k * (w - 16) / 6, y = 8 + r * (h - 16) / 3; c.fillStyle = col[(r * 6 + k) % 7]; c.fillRect(x + 3, y + 3, (w - 16) / 6 - 6, (h - 16) / 3 - 8); c.fillStyle = "rgba(20,20,20,0.6)"; c.fillRect(x + 8, y + 10, (w - 16) / 6 - 16, 6); c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.arc(x + (w - 16) / 12, y + (h - 16) / 6, 10, 0, 7); c.fill(); }
}, 512, 256);
const texPizarron = () => lienzo((c, w, h) => { // pizarrón verde con las reglas escritas con gis en tres columnas (cada una cabe en la pantalla)
  c.fillStyle = "#24443a"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 10; k++) { const x = rz(k) * w, y = rz(k + 10) * h, g = c.createRadialGradient(x, y, 4, x, y, 90 + rz(k + 3) * 80); g.addColorStop(0, "rgba(200,210,200,0.12)"); g.addColorStop(1, "rgba(200,210,200,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
  c.fillStyle = "rgba(240,240,232,0.95)"; c.textAlign = "center"; c.font = "bold 84px 'DejaVu Sans', sans-serif"; c.fillText("REGLAS", w / 2, 92);
  c.fillRect(w * 0.4, 106, w * 0.2, 6);
  const C = [["1.", "LAS", "CORTINAS", "SIEMPRE", "CERRADAS."], ["2.", "SI ALGUIEN", "TOCA LA", "PUERTA,", "NADIE", "CONTESTA."], ["3.", "CADA HORA", "SE PASA", "LISTA.", "SI ALGUIEN", "FALTA, NO", "SE LE BUSCA."]];
  C.forEach((L, k) => {
    const x = (k + 0.5) * w / 3;
    c.font = "bold 72px 'DejaVu Sans', sans-serif"; c.fillText(L[0], x, 196);
    c.font = "bold 54px 'DejaVu Sans', sans-serif"; L.slice(1).forEach((t, i) => c.fillText(t, x, 262 + i * 58));
    if (k > 0) { c.fillStyle = "rgba(240,240,232,0.25)"; c.fillRect(k * w / 3 - 2, 150, 4, h - 190); c.fillStyle = "rgba(240,240,232,0.95)"; }
  });
  c.strokeStyle = "rgba(240,240,232,0.85)"; c.lineWidth = 5; c.beginPath(); c.moveTo(w * 5 / 6 - 190, 618); c.lineTo(w * 5 / 6 + 190, 622); c.stroke(); // subrayado de la regla 3
  c.fillStyle = "rgba(240,240,232,0.35)"; c.font = "bold 36px 'DejaVu Sans', sans-serif"; c.fillText("LUNES 14", w - 140, 54);
}, 1536, 640);
const texCortina = () => lienzo((c, w, h) => { // cortina de tela amarillo pálido con pliegues verticales
  const g = c.createLinearGradient(0, 0, w, 0);
  for (let k = 0; k <= 12; k++) g.addColorStop(k / 12, k % 2 ? "#cdb98a" : "#a8925e");
  c.fillStyle = g; c.fillRect(0, 0, w, h); manchas(c, w, h, 8, "60,46,24", 0.2);
  c.fillStyle = "#6a4a2a"; c.fillRect(0, 0, w, 10);
}, 512, 256);
const texSombras = () => lienzo((c, w, h) => { // sombras de manos y cabezas detrás de la cortina
  c.clearRect(0, 0, w, h); c.fillStyle = "rgba(10,10,16,0.85)";
  for (let k = 0; k < 5; k++) {
    const x = 50 + k * (w - 100) / 4 + (rz(k) - 0.5) * 30, y = h * 0.62 + rz(k + 3) * 40;
    c.beginPath(); c.ellipse(x, y, 34, 42, 0, 0, 7); c.fill(); // cabeza
    c.fillRect(x - 46, y + 30, 92, h); // hombros
    for (const s of [-1, 1]) { const mx = x + s * (40 + rz(k * 5 + s) * 30), my = h * 0.25 + rz(k * 3 + s) * 60; c.beginPath(); c.ellipse(mx, my, 16, 20, 0, 0, 7); c.fill(); c.lineWidth = 16; c.strokeStyle = "rgba(10,10,16,0.85)"; c.beginPath(); c.moveTo(x + s * 30, y + 40); c.lineTo(mx, my + 14); c.stroke(); for (let d = -2; d <= 2; d++) c.fillRect(mx + d * 7 - 3, my - 40, 6, 26); }
  }
}, 512, 256);
const texEsmerilado = () => lienzo((c, w, h) => { // vidrio esmerilado de la ventanita de la puerta
  c.fillStyle = "rgba(225,232,226,1)"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 400; k++) { c.fillStyle = `rgba(${k % 2 ? "255,255,255" : "170,180,176"},0.35)`; c.fillRect(rz(k) * w, rz(k + 400) * h, 3, 3); }
}, 128, 128);
const texSilueta = () => lienzo((c, w, h) => { // silueta borrosa de un niño (cabeza y hombros) para detrás del vidrio
  c.clearRect(0, 0, w, h); c.shadowColor = "rgba(14,14,20,1)"; c.shadowBlur = 18; c.fillStyle = "rgba(14,14,20,0.95)";
  c.beginPath(); c.ellipse(w / 2, h * 0.36, w * 0.2, h * 0.17, 0, 0, 7); c.fill();
  c.beginPath(); c.ellipse(w / 2, h * 0.95, w * 0.32, h * 0.42, 0, 0, 7); c.fill(); // hombros
}, 256, 256);
const texReloj = () => lienzo((c, w, h) => { // reloj de pared: las 9 en punto
  c.fillStyle = "#f2efe6"; c.beginPath(); c.arc(w / 2, h / 2, w * 0.46, 0, 7); c.fill();
  c.strokeStyle = "#1a1a1a"; c.lineWidth = 10; c.stroke();
  c.fillStyle = "#1a1a1a"; c.font = "bold 26px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  for (let k = 1; k <= 12; k++) { const a = k / 12 * Math.PI * 2; c.fillText(String(k), w / 2 + Math.sin(a) * w * 0.36, h / 2 - Math.cos(a) * h * 0.36); }
}, 256, 256);
const texAbecedario = () => lienzo((c, w, h) => {
  const col = ["#c83a3a", "#e0a030", "#3a7ab0", "#4aa05a"]; const L = "ABCDEFGHIJKLMNÑOPQRSTUVWXYZ";
  for (let k = 0; k < L.length; k++) { const x = k * w / L.length; c.fillStyle = col[k % 4]; c.fillRect(x + 2, 2, w / L.length - 4, h - 4); c.fillStyle = "#ffffff"; c.font = `bold ${h * 0.6}px 'DejaVu Sans', sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(L[k], x + w / L.length / 2, h / 2); }
}, 2048, 80);
const texMapa = () => lienzo((c, w, h) => { // mapa de la república (formas simples) con su marco
  c.fillStyle = "#9ac8e0"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#e6d48a"; c.beginPath(); c.moveTo(w * 0.05, h * 0.15); c.lineTo(w * 0.55, h * 0.1); c.lineTo(w * 0.75, h * 0.35); c.lineTo(w * 0.7, h * 0.6); c.lineTo(w * 0.92, h * 0.68); c.lineTo(w * 0.8, h * 0.88); c.lineTo(w * 0.55, h * 0.8); c.lineTo(w * 0.3, h * 0.55); c.lineTo(w * 0.18, h * 0.3); c.closePath(); c.fill();
  c.beginPath(); c.moveTo(w * 0.06, h * 0.2); c.lineTo(w * 0.12, h * 0.22); c.lineTo(w * 0.22, h * 0.62); c.lineTo(w * 0.17, h * 0.6); c.closePath(); c.fill();
  c.strokeStyle = "rgba(90,70,40,0.6)"; c.lineWidth = 2; for (let k = 0; k < 10; k++) { c.beginPath(); c.moveTo(w * (0.2 + rz(k) * 0.5), h * (0.15 + rz(k + 3) * 0.6)); c.lineTo(w * (0.25 + rz(k + 5) * 0.5), h * (0.2 + rz(k + 7) * 0.6)); c.stroke(); }
  c.strokeStyle = "#5a3a22"; c.lineWidth = 14; c.strokeRect(0, 0, w, h);
}, 512, 384);
const texLista = () => lienzo((c, w, h) => { // la lista de asistencia: doce nombres con sus casillas
  c.fillStyle = "#f2efe4"; c.fillRect(0, 0, w, h); c.fillStyle = "#1a2a5a"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.fillText("LISTA · 3º B", 20, 40);
  const N = ["Ana", "Beto", "Carla", "Diego", "Elena", "Fer", "Gabi", "Hugo", "Iris", "Javi", "Mateo", "Tú"];
  c.font = "24px 'DejaVu Sans', sans-serif";
  N.forEach((n, i) => { const y = 80 + i * 34; c.fillStyle = "#1a1a1a"; c.fillText(`${i + 1}. ${n}`, 24, y); c.strokeStyle = "#1a2a5a"; c.lineWidth = 2; c.strokeRect(w - 70, y - 22, 26, 26); if (i < 10) { c.strokeStyle = "#2a6a3a"; c.lineWidth = 4; c.beginPath(); c.moveTo(w - 66, y - 9); c.lineTo(w - 58, y); c.lineTo(w - 46, y - 20); c.stroke(); } });
}, 320, 500);
const texPiso = () => lienzo((c, w, h) => { // mosaico de salón (granito gastado en cuadros)
  c.fillStyle = "#a8a296"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 600; k++) { c.fillStyle = `rgba(${k % 3 ? "60,56,50" : "220,216,206"},0.4)`; c.fillRect(rz(k) * w, rz(k + 600) * h, 2, 2); }
  c.strokeStyle = "rgba(50,46,40,0.55)"; c.lineWidth = 3; for (let i = 0; i <= 2; i++) { c.beginPath(); c.moveTo(i * w / 2, 0); c.lineTo(i * w / 2, h); c.stroke(); c.beginPath(); c.moveTo(0, i * h / 2); c.lineTo(w, i * h / 2); c.stroke(); }
  manchas(c, w, h, 5, "40,36,30", 0.25);
}, 256, 256, [8, 9]);
const texMuro = (base: string, abajo: string) => lienzo((c, w, h) => { // muro del salón: pintura clara arriba, color abajo
  c.fillStyle = base; c.fillRect(0, 0, w, h); c.fillStyle = abajo; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = "rgba(30,26,20,0.5)"; c.fillRect(0, h * 0.62, w, 6);
  manchas(c, w, h, 12, "40,36,30", 0.18);
}, 512, 256);
const texNumero = (n: number) => lienzo((c, w, h) => { c.fillStyle = "#f2efe4"; c.fillRect(0, 0, w, h); c.strokeStyle = "#1a2a5a"; c.lineWidth = 6; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = "#1a2a5a"; c.font = "bold 60px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), w / 2, h / 2 + 3); }, 128, 96);
const texPeriodicoMural = () => lienzo((c, w, h) => { // periódico mural con dibujos de niños
  c.fillStyle = "#c8a46a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#5a3a22"; c.lineWidth = 12; c.strokeRect(0, 0, w, h);
  const col = ["#f2efe4", "#f0d8d8", "#d8e8f0", "#f0ecc8"];
  for (let k = 0; k < 6; k++) { const x = 20 + (k % 3) * (w - 40) / 3, y = 20 + Math.floor(k / 3) * (h - 40) / 2; c.fillStyle = col[k % 4]; c.fillRect(x + 6, y + 6, (w - 40) / 3 - 12, (h - 40) / 2 - 12); c.fillStyle = ["#e0a030", "#3a7ab0", "#c84a3a"][k % 3]; c.beginPath(); c.arc(x + 50, y + 50, 24, 0, 7); c.fill(); c.fillRect(x + 30, y + 80, 60, 30); }
}, 512, 320);

// ------------------------------------------------------------------ piezas
const arbol = (alto: number, s: number) => { // tronco y copa de tres bolas
  const g = new THREE.Group(), mT = lambert({ color: "#4a3a2a" }), mC = lambert({ color: ["#2e4a2e", "#36522e", "#2a4234"][s % 3] });
  g.add(cil(0.12, 0.18, alto * 0.5, mT, 0, alto * 0.25, 0, 8));
  for (let k = 0; k < 3; k++) { const b = new THREE.Mesh(new THREE.IcosahedronGeometry(alto * (0.26 + rz(s + k) * 0.08), 1), mC); b.position.set((k - 1) * alto * 0.18, alto * (0.62 + rz(s * 3 + k) * 0.12), (rz(s + k * 5) - 0.5) * alto * 0.2); g.add(b); }
  return g;
};
const banca = (m: THREE.Material, mF: THREE.Material) => { // banca de parque: tablas, respaldo y patas de fierro
  const g = new THREE.Group();
  for (let k = 0; k < 3; k++) g.add(caja(1.6, 0.04, 0.1, m, 0, 0.45, -0.12 + k * 0.12));
  for (let k = 0; k < 2; k++) g.add(caja(1.6, 0.1, 0.03, m, 0, 0.62 + k * 0.14, -0.2));
  for (const s of [-1, 1]) g.add(caja(0.05, 0.45, 0.4, mF, s * 0.7, 0.225, -0.02), caja(0.05, 0.4, 0.05, mF, s * 0.7, 0.65, -0.21));
  return g;
};
/** reja: barrotes con punta, dos travesaños; hoja de `ancho` × `alto` a lo largo de z desde el pivote (dir ±1) */
const reja = (ancho: number, alto: number, dir: number, m: THREE.Material, paso = 0.2) => {
  const g = new THREE.Group();
  g.add(caja(0.05, 0.06, ancho, m, 0, 0.12, dir * ancho / 2), caja(0.05, 0.06, ancho, m, 0, alto - 0.25, dir * ancho / 2), caja(0.05, 0.06, ancho, m, 0, alto * 0.5, dir * ancho / 2));
  for (let z = 0.05; z < ancho - 0.02; z += paso) {
    g.add(caja(0.03, alto - 0.1, 0.03, m, 0, (alto - 0.1) / 2 + 0.05, dir * z));
    const p = new THREE.Mesh(new THREE.ConeGeometry(0.035, 0.12, 4), m); p.position.set(0, alto + 0.01, dir * z); g.add(p);
  }
  g.add(caja(0.06, alto, 0.06, m, 0, alto / 2, dir * (ancho - 0.03)));
  return g;
};

export function crearEscenario() {
  // ================================================================ avenida de noche (de «La ambulancia») + el camión
  const h = crearAvenida();
  h.ambu.visible = false; h.mercado.visible = false;
  const busG = new THREE.Group(); h.raiz.add(busG);
  const bus = crearCamion(); bus.g.position.y = BUS_Y; busG.add(bus.g);
  bus.luzInt.forEach((l) => (l.intensity = 0.9));
  // lo que hay en la banqueta derecha (+x) de cada tramo: postes y coches (se esconden cuando el camión se sube a ella)
  const derecha: THREE.Object3D[] = [];
  const tramos = h.calle.children as THREE.Group[];
  tramos.forEach((t) => t.children.forEach((o) => { if ((o instanceof THREE.Group) && o.position.x > 3.5 && o.position.x < 7) derecha.push(o); }));

  // ---------------------------------------------------------------- el parque (en el tramo 0, a la derecha)
  const parque = new THREE.Group(); tramos[0].add(parque);
  const Z0 = 6, Z1 = 48; // tramo local: el camión queda en z ≈ 30 al arrancar
  const ocultos = tramos[0].children.filter((o) => o !== parque && o.position.x > 9 && o.position.z > Z0 - 2 && o.position.z < Z1 + 6);
  ocultos.forEach((o) => (o.visible = false));
  const BX = 8.75; // reja del parque
  parque.add(suelo(16, Z1 - Z0, lambert({ map: texPasto() }), BX + 8, 0.17, (Z0 + Z1) / 2));
  parque.add(caja(0.4, 0.5, Z1 - Z0, lambert({ map: texConcreto([6, 1]) }), BX, 0.25, (Z0 + Z1) / 2)); // murete
  const mFierro = lambert({ color: "#1e2a24" });
  const ENTRADA = 22; // entrada del parque (local z ∈ [22, 25])
  const r1 = reja(ENTRADA - Z0, 1.6, 1, mFierro, 0.22); r1.position.set(BX, 0.5, Z0); parque.add(r1);
  const r2 = reja(Z1 - ENTRADA - 3, 1.6, 1, mFierro, 0.22); r2.position.set(BX, 0.5, ENTRADA + 3); parque.add(r2);
  for (const z of [ENTRADA, ENTRADA + 3]) parque.add(caja(0.45, 2.6, 0.45, lambert({ map: texConcreto([1, 2]) }), BX, 1.3, z)); // pilares de la entrada
  parque.add(caja(0.3, 0.3, 3.4, mFierro, BX, 2.75, ENTRADA + 1.5));
  const letP = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.98), lambert({ map: texParque(), emissive: "#ffffff", emissiveIntensity: 0.12 })); letP.position.set(BX - 0.16, 3.25, ENTRADA + 1.5); letP.rotation.y = -Math.PI / 2; parque.add(letP);
  const hojaRota = reja(1.5, 1.6, 1, mFierro, 0.22); hojaRota.position.set(BX + 0.1, 0.02, ENTRADA + 0.1); hojaRota.rotation.y = 1.2; hojaRota.rotation.z = 0.08; parque.add(hojaRota); // la puerta del parque, abierta y chueca
  parque.add(suelo(3, 14, lambert({ map: texTierra() }), BX + 1.5, 0.18, ENTRADA + 1.5)); // andador de tierra
  const mMad = lambert({ color: "#6a4a30" });
  [[12, 12, 4.2], [15, 30, 5.0], [11.5, 38, 4.4], [17, 18, 4.8], [13, 44, 4.0], [18.5, 40, 5.2]].forEach(([x, z, a], i) => { const t = arbol(a, i); t.position.set(x, 0.17, z); parque.add(t); });
  const b1 = banca(mMad, mFierro); b1.position.set(BX + 1.2, 0.17, 30); b1.rotation.y = -Math.PI / 2; parque.add(b1);
  const b2 = banca(mMad, mFierro); b2.position.set(BX + 1.2, 0.17, 15); b2.rotation.y = -Math.PI / 2; parque.add(b2);
  // juegos: resbaladilla (escalera, rampa) y columpios (marco en A y dos asientos con cadenas)
  const mRojo = lambert({ color: "#b03a2e" }), mAz = lambert({ color: "#2f5f9a" }), mAm = lambert({ color: "#d8a42a" });
  const resb = new THREE.Group(); resb.position.set(14.5, 0.17, 24); parque.add(resb);
  for (const s of [-1, 1]) resb.add(caja(0.05, 2.0, 0.05, mAz, -0.6, 1.0, s * 0.3));
  for (let k = 0; k < 6; k++) resb.add(caja(0.04, 0.04, 0.6, mAz, -0.6, 0.3 + k * 0.3, 0));
  resb.add(caja(0.6, 0.06, 0.7, mRojo, -0.35, 1.9, 0));
  const ramp = caja(2.4, 0.04, 0.55, mAm, 0.7, 1.05, 0); ramp.rotation.z = -0.68; resb.add(ramp);
  for (const s of [-1, 1]) { const o = caja(2.4, 0.12, 0.03, mAm, 0.7, 1.1, s * 0.28); o.rotation.z = -0.68; resb.add(o); }
  const colum = new THREE.Group(); colum.position.set(16, 0.17, 35); parque.add(colum);
  for (const s of [-1, 1]) for (const d of [-1, 1]) { const p = cil(0.04, 0.04, 2.6, mRojo, d * 0.5, 1.2, s * 1.4, 8); p.rotation.x = d * 0.32; colum.add(p); }
  colum.add(caja(0.08, 0.08, 3.0, mRojo, 0, 2.42, 0));
  for (const z of [-0.6, 0.6]) { for (const s of [-1, 1]) colum.add(cil(0.006, 0.006, 1.8, lambert({ color: "#9a9ea4" }), 0, 1.5, z + s * 0.2, 4)); colum.add(caja(0.25, 0.04, 0.48, lambert({ color: "#1a1a1a" }), 0, 0.6, z)); }
  for (const z of [12, 34]) { const p = poste(true); p.position.set(BX + 0.6, 0.17, z); p.rotation.y = Math.PI; parque.add(p); }
  for (let k = 0; k < 3; k++) parque.add(caja(10, 14 + k * 4, 10, lambert({ map: texEdificio(80 + k, ["#4a4e58", "#48545a", "#5a5048"][k], 4 + k) }), 30, (14 + k * 4) / 2, Z0 + 6 + k * 14));

  // ---------------------------------------------------------------- el puesto de periódicos (en la banqueta derecha)
  const puesto = new THREE.Group(); h.raiz.add(puesto);
  const mVerde = lambert({ color: "#2f6a4a" }), mLam = lambert({ color: "#3a4a3e" });
  const piezas: { o: THREE.Object3D; p0: THREE.Vector3; r0: THREE.Euler; v: THREE.Vector3; w: THREE.Vector3 }[] = [];
  const pieza = (o: THREE.Object3D, v: [number, number, number], w: [number, number, number]) => { puesto.add(o); piezas.push({ o, p0: o.position.clone(), r0: o.rotation.clone(), v: new THREE.Vector3(v[0], v[1], v[2] + 9), w: new THREE.Vector3(...w) }); }; // + 12 m/s: el camión lo empuja hacia adelante
  pieza(caja(1.2, 1.05, 1.8, mVerde, 0, 0.52, 0), [1.5, 2.5, 5], [0.4, 0.2, -0.6]); // cuerpo
  pieza(caja(1.6, 0.08, 2.3, mLam, -0.1, 2.0, 0), [0.8, 5, 7], [1.2, 0.4, 0.8]); // techo
  for (const z of [-0.85, 0.85]) pieza(caja(0.06, 0.95, 0.06, mLam, -0.55, 1.5, z), [z > 0 ? 1 : -1, 3.5, 6], [0, 0, 2]); // postes
  const rev = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.85), lambert({ map: texRevistas() })); rev.position.set(-0.62, 1.5, 0); rev.rotation.y = -Math.PI / 2; pieza(rev, [-0.5, 4, 8], [0.3, 1.2, 0.5]);
  const let2 = cartel(["PERIÓDICOS", "Y REVISTAS"], "#e0b030", "#1a1a1a", 1.6, 0.36); let2.position.set(-0.94, 1.86, 0); let2.rotation.y = -Math.PI / 2; pieza(let2, [0, 6, 6], [2, 0.5, 0.3]);
  const mPer = [0, 1, 2].map((k) => lambert({ map: texPeriodico(k), side: THREE.DoubleSide }));
  for (let k = 0; k < 4; k++) pieza(caja(0.42, 0.12, 0.32, mPer[k % 3], -0.85, 1.11 + (k % 2) * 0.13, -0.6 + k * 0.4), [-1 + rz(k) * 2, 3 + rz(k + 2) * 3, 4 + rz(k + 4) * 4], [rz(k) * 4, rz(k + 1) * 4, rz(k + 2) * 4]); // pilas en el mostrador
  const hojas: { o: THREE.Mesh; v: THREE.Vector3; w: THREE.Vector3; p0: THREE.Vector3 }[] = [];
  for (let k = 0; k < 26; k++) { const o = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.44), mPer[k % 3]); o.visible = false; puesto.add(o); hojas.push({ o, p0: new THREE.Vector3(-0.8, 1.2, -0.6 + (k % 6) * 0.25), v: new THREE.Vector3(-1.5 + rz(k) * 4, 2 + rz(k + 30) * 4, 13 + rz(k + 60) * 6), w: new THREE.Vector3(rz(k) * 6, rz(k + 9) * 6, rz(k + 19) * 6) }); }
  /** t = segundos desde el golpe (< 0: entero) */
  const tumbar = (t: number) => {
    const g = 9.8;
    piezas.forEach(({ o, p0, r0, v, w }) => {
      if (t <= 0) { o.position.copy(p0); o.rotation.copy(r0); return; }
      const tt = Math.min(t, 0.9 + 0.1 * v.y / 3);
      const y = Math.max(0.2, p0.y + v.y * tt - 0.5 * g * tt * tt);
      o.position.set(p0.x + v.x * tt, y, p0.z + v.z * tt); o.rotation.set(r0.x + w.x * tt, r0.y + w.y * tt, r0.z + w.z * tt);
    });
    hojas.forEach(({ o, v, w, p0 }) => { o.visible = t > 0; if (t <= 0) return; const tt = Math.min(t, 2.5), caida = 1.2; o.position.set(p0.x + v.x * tt * 0.7, Math.max(0.2, p0.y + v.y * Math.min(tt, 0.4) - caida * Math.max(0, tt - 0.4)), p0.z + v.z * tt * 0.7); o.rotation.set(w.x * tt, w.y * tt, w.z * tt); });
  };
  puesto.visible = false;

  // ================================================================ la escuela por fuera (su propia calle)
  const escuela = new THREE.Group(); h.raiz.add(escuela); escuela.visible = false;
  const mAsf = lambert({ map: texAsfalto() }), mBan = lambert({ map: texBanqueta() });
  escuela.add(suelo(12, 120, mAsf, 0, 0, 0));
  for (const s of [-1, 1]) escuela.add(caja(3.2, 0.16, 120, mBan, s * 7.1, 0.08, 0));
  for (let k = 0; k < 7; k++) { const pisos = 2 + (k % 3), alto = 3.4 * (pisos + 1); escuela.add(caja(7, alto, 9.6, lambert({ map: texEdificio(90 + k, ["#4a4e58", "#5a5048", "#48545a", "#5e5a50"][k % 4], pisos) }), -12.2, alto / 2, -30 + k * 10)); }
  for (const z of [-14, 10]) { const p = poste(true); p.position.set(-6, 0.16, z); escuela.add(p); }
  { const cc = coche("#5a6a7a"); cc.position.set(-4.4, 0, 14); escuela.add(cc); const c2 = coche("#7a3a2a"); c2.position.set(-4.4, 0, -16); c2.rotation.y = 3.1; escuela.add(c2); }
  // barda con mural y el portón
  const mBarda = lambert({ map: texBarda() }), B = ESC.barda, P0 = ESC.porton;
  for (const s of [-1, 1]) {
    const largo = 30 - P0;
    escuela.add(caja(0.3, 2.6, largo, lambert({ color: "#d8d2c0" }), B + 0.15, 1.3, s * (P0 + 0.25 + largo / 2)));
    escuela.add(plano(largo, 2.6, mBarda, B - 0.006, 1.3, s * (P0 + 0.25 + largo / 2), -Math.PI / 2));
    escuela.add(caja(0.5, 3.4, 0.5, lambert({ map: texConcreto([1, 2]) }), B + 0.15, 1.7, s * P0)); // pilar
    const foco = destello(255, 220, 160, 1.2, 0.5); foco.position.set(B - 0.3, 3.5, s * P0); escuela.add(foco);
  }
  escuela.add(caja(0.4, 0.4, 2 * P0 + 0.5, lambert({ color: "#1f3f6a" }), B + 0.15, 3.6, 0)); // arco sobre el portón
  const letE = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 1.2), lambert({ map: texLetreroEsc(), emissive: "#ffffff", emissiveIntensity: 0.15 })); letE.position.set(B - 0.1, 4.4, 0); letE.rotation.y = -Math.PI / 2; escuela.add(letE);
  escuela.add(caja(0.12, 1.5, 0.12, lambert({ color: "#1f3f6a" }), B + 0.15, 4.0, -1.9), caja(0.12, 1.5, 0.12, lambert({ color: "#1f3f6a" }), B + 0.15, 4.0, 1.9));
  const mReja = lambert({ color: "#2a3a5a" });
  const hojaA = new THREE.Group(); hojaA.position.set(B + 0.15, 0, -P0 + 0.25); hojaA.add(reja(P0 - 0.27, 2.5, 1, mReja, 0.2)); escuela.add(hojaA); // gira hacia el patio (+x)
  const hojaB = new THREE.Group(); hojaB.position.set(B + 0.15, 0, P0 - 0.25); hojaB.add(reja(P0 - 0.27, 2.5, -1, mReja, 0.2)); escuela.add(hojaB);
  // cadena y candado (en el centro del portón, del lado del patio)
  const cadena = new THREE.Group(); cadena.position.set(B + 0.24, 1.25, 0); escuela.add(cadena);
  const mCad = lambert({ color: "#9aa0a8", emissive: "#202428" });
  for (let k = 0; k < 7; k++) { const e = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 12), mCad); e.position.set(0, 0.2 - k * 0.07, (k % 2 ? 0.02 : -0.02)); e.rotation.y = k % 2 ? Math.PI / 2 : 0; e.scale.set(1, 1.4, 1); cadena.add(e); }
  const candado = new THREE.Group(); candado.position.set(0.02, -0.32, 0); candado.add(caja(0.06, 0.12, 0.1, lambert({ color: "#b89a3a" }), 0, 0, 0)); const arco = new THREE.Mesh(new THREE.TorusGeometry(0.035, 0.01, 6, 12, Math.PI), mCad); arco.position.y = 0.06; arco.rotation.y = Math.PI / 2; candado.add(arco); cadena.add(candado);
  cadena.visible = false;
  // patio, asta, canasta y el edificio
  const patio = new THREE.Group(); escuela.add(patio);
  patio.add(suelo(ESC.edificio - B, 60, lambert({ map: texCancha() }), (B + ESC.edificio) / 2, 0.01, 0));
  patio.add(cil(0.05, 0.07, 9, lambert({ color: "#b8bcc0" }), 14, 4.5, -8, 8), caja(0.9, 0.5, 0.9, lambert({ map: texConcreto() }), 14, 0.25, -8));
  const can = new THREE.Group(); can.position.set(18, 0, 9); patio.add(can);
  can.add(cil(0.07, 0.07, 3.0, lambert({ color: "#3a3e44" }), 0, 1.5, 0, 8), caja(0.04, 1.0, 1.6, lambert({ color: "#e8e4dc" }), -0.3, 3.2, 0));
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.23, 0.02, 6, 16), lambert({ color: "#d0582a" })); aro.rotation.x = Math.PI / 2; aro.position.set(-0.58, 2.95, 0); can.add(aro);
  patio.add(caja(6, 9, 60, lambert({ color: "#bfae84" }), ESC.edificio + 3, 4.5, 0));
  patio.add(plano(24, 9, lambert({ map: texFachada() }), ESC.edificio - 0.006, 4.5, 0, -Math.PI / 2));
  const puertaEd = new THREE.Group(); puertaEd.position.set(ESC.edificio - 0.03, 0, 0); patio.add(puertaEd);
  puertaEd.add(caja(0.06, 2.5, 2.4, lambert({ color: "#5a3a26" }), 0, 1.25, 0), caja(0.1, 0.2, 2.8, lambert({ color: "#2a2a2c" }), -0.02, 2.6, 0));
  const lamEd = destello(255, 220, 160, 1.6, 0.6); lamEd.position.set(ESC.edificio - 0.4, 3.0, 0); patio.add(lamEd);
  const luzPatio = new THREE.PointLight("#ffd6a0", 6, 16, 1.4); luzPatio.position.set(ESC.edificio - 2, 3.2, 0); patio.add(luzPatio);
  const luzPorton = new THREE.PointLight("#ffd6a0", 5, 12, 1.4); luzPorton.position.set(B + 1.2, 3.2, 0); escuela.add(luzPorton);
  for (const z of [-20, 20]) { const t = arbol(4.5, z > 0 ? 1 : 2); t.position.set(B + 1.6, 0.01, z); patio.add(t); }

  // ================================================================ el salón
  const salon = new THREE.Group(); h.raiz.add(salon); salon.visible = false;
  const S = SALON;
  salon.add(suelo(2 * S.x, 2 * S.z, lambert({ map: texPiso() }), 0, 0, 0));
  const techo = suelo(2 * S.x, 2 * S.z, lambert({ color: "#d8d4c8" }), 0, S.alto, 0); techo.rotation.x = Math.PI / 2; salon.add(techo);
  const mMuro = lambert({ map: texMuro("#d6d0b8", "#4a6a7a") });
  salon.add(plano(2 * S.x, S.alto, mMuro, 0, S.alto / 2, -S.z)); // frente
  salon.add(plano(2 * S.x, S.alto, mMuro, 0, S.alto / 2, S.z, Math.PI)); // atrás
  // pared izquierda (−x) con tres ventanas: muro arriba y abajo, y entre ventanas
  const VZ = [-2.6, 0, 2.6], VW = 1.8, VY0 = 0.95, VY1 = 2.45;
  const mMuroL = lambert({ map: texMuro("#d6d0b8", "#4a6a7a") });
  salon.add(plano(2 * S.z, VY0, lambert({ color: "#4a6a7a" }), -S.x, VY0 / 2, 0, Math.PI / 2), plano(2 * S.z, S.alto - VY1, lambert({ color: "#d6d0b8" }), -S.x, (S.alto + VY1) / 2, 0, Math.PI / 2));
  const cortes = [-S.z, ...VZ.flatMap((z) => [z - VW / 2, z + VW / 2]), S.z];
  for (let k = 0; k < cortes.length; k += 2) salon.add(plano(cortes[k + 1] - cortes[k], VY1 - VY0, lambert({ color: "#d6d0b8" }), -S.x, (VY0 + VY1) / 2, (cortes[k] + cortes[k + 1]) / 2, Math.PI / 2));
  void mMuroL;
  const mCort = lambert({ map: texCortina(), side: THREE.DoubleSide, emissive: "#3a3424", emissiveIntensity: 0.4 });
  const mSomb = new THREE.MeshBasicMaterial({ map: texSombras(), transparent: true, depthWrite: false, opacity: 0 });
  const sombras: THREE.Mesh[] = [];
  for (const z of VZ) {
    salon.add(caja(0.08, 0.06, VW + 0.2, lambert({ color: "#2a2a2c" }), -S.x + 0.04, VY0 - 0.03, z)); // repisón
    salon.add(plano(VW, VY1 - VY0, lambert({ color: "#0c1220" }), -S.x - 0.01, (VY0 + VY1) / 2, z, Math.PI / 2)); // noche detrás
    const geo = new THREE.PlaneGeometry(VW + 0.3, VY1 - VY0 + 0.25, 24, 1); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.035 * Math.sin(p.getX(i) * 18)); geo.computeVertexNormals();
    const cort = new THREE.Mesh(geo, mCort); cort.position.set(-S.x + 0.12, (VY0 + VY1) / 2 + 0.05, z); cort.rotation.y = Math.PI / 2; salon.add(cort);
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(VW + 0.2, VY1 - VY0), mSomb); sm.position.set(-S.x + 0.165, (VY0 + VY1) / 2, z); sm.rotation.y = Math.PI / 2; sm.layers.set(NOINK); salon.add(sm); sombras.push(sm);
    salon.add(barraZ(VW + 0.5, 0.018, lambert({ color: "#8a8e94" }), -S.x + 0.12, VY1 + 0.2, z));
  }
  // pared derecha (+x) con la puerta y el periódico mural
  const PS = PUERTA_S, pz0 = PS.z - PS.ancho / 2, pz1 = PS.z + PS.ancho / 2;
  salon.add(plano(pz0 + S.z, S.alto, mMuro, S.x, S.alto / 2, (pz0 - S.z) / 2, -Math.PI / 2), plano(S.z - pz1, S.alto, mMuro, S.x, S.alto / 2, (pz1 + S.z) / 2, -Math.PI / 2));
  salon.add(plano(PS.ancho, S.alto - PS.alto, lambert({ color: "#d6d0b8" }), S.x, (S.alto + PS.alto) / 2, PS.z, -Math.PI / 2));
  const mMarco = lambert({ color: "#5a3a26" });
  salon.add(caja(0.08, PS.alto + 0.08, 0.08, mMarco, S.x - 0.03, PS.alto / 2, pz0 - 0.04), caja(0.08, PS.alto + 0.08, 0.08, mMarco, S.x - 0.03, PS.alto / 2, pz1 + 0.04), caja(0.08, 0.08, PS.ancho + 0.16, mMarco, S.x - 0.03, PS.alto + 0.04, PS.z));
  // la hoja (pivote en z0, se abre hacia el pasillo) con ventanita esmerilada y perilla
  const puerta = new THREE.Group(); puerta.position.set(S.x + 0.03, 0, pz0); salon.add(puerta);
  const mHoja = lambert({ color: "#7a5236" });
  const PW = PS.ancho - 0.02;
  puerta.add(caja(0.045, PS.alto - 0.02, PW, mHoja, 0, (PS.alto - 0.02) / 2, PW / 2));
  // la ventanita se hace con cuatro tablas alrededor del hueco (para que la silueta se vea a través del vidrio)
  const vy0 = 1.3, vy1 = 1.85, vz0 = 0.2, vz1 = PW - 0.2;
  puerta.children.pop(); // se rehace la hoja con el hueco
  puerta.add(caja(0.045, vy0, PW, mHoja, 0, vy0 / 2, PW / 2), caja(0.045, PS.alto - 0.02 - vy1, PW, mHoja, 0, (PS.alto - 0.02 + vy1) / 2, PW / 2));
  puerta.add(caja(0.045, vy1 - vy0, vz0, mHoja, 0, (vy0 + vy1) / 2, vz0 / 2), caja(0.045, vy1 - vy0, PW - vz1, mHoja, 0, (vy0 + vy1) / 2, (vz1 + PW) / 2));
  const mEsm = new THREE.MeshBasicMaterial({ map: texEsmerilado(), transparent: true, opacity: 0.42, depthWrite: false, color: "#b8c4b8" });
  const vidrioP = plano(vz1 - vz0, vy1 - vy0, mEsm, 0, (vy0 + vy1) / 2, (vz0 + vz1) / 2, -Math.PI / 2); vidrioP.layers.set(NOINK); puerta.add(vidrioP);
  for (const y of [vy0, vy1]) puerta.add(caja(0.06, 0.025, vz1 - vz0 + 0.05, mMarco, -0.004, y, (vz0 + vz1) / 2));
  const perilla = new THREE.Group(); perilla.position.set(-0.07, 1.0, PW - 0.1); puerta.add(perilla); // del lado del salón (−x)
  const mLat = lambert({ color: "#c9a24a", emissive: "#3a2a10" });
  perilla.add(cil(0.035, 0.035, 0.012, mLat, 0.03, 0, 0, 16)); perilla.children[0].rotation.z = Math.PI / 2;
  const cuello = cil(0.012, 0.016, 0.05, mLat, 0.0, 0, 0, 10); cuello.rotation.z = Math.PI / 2; perilla.add(cuello);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), mLat); bola.position.x = -0.035; perilla.add(bola);
  const ranura = caja(0.008, 0.045, 0.008, lambert({ color: "#3a2a10" }), -0.064, 0, 0); perilla.add(ranura); // marca para que se note que gira
  // pasillo detrás de la puerta: luz y la silueta del niño
  const luzPasillo = new THREE.PointLight("#e8f0d8", 0, 4, 1.5); luzPasillo.position.set(S.x + 1.2, 1.9, PS.z); salon.add(luzPasillo);
  salon.add(plano(3, S.alto, lambert({ color: "#9aa294" }), S.x + 1.6, S.alto / 2, PS.z, -Math.PI / 2));
  const fondoPas = plano(PS.ancho + 0.4, S.alto, brillo("#a8b4a4"), S.x + 1.5, S.alto / 2, PS.z, -Math.PI / 2); fondoPas.layers.set(NOINK); salon.add(fondoPas);
  const silueta = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.9), new THREE.MeshBasicMaterial({ map: texSilueta(), transparent: true, depthWrite: false })); silueta.position.set(S.x + 0.35, 1.55, PS.z + 0.05); silueta.rotation.y = -Math.PI / 2; silueta.layers.set(NOINK); silueta.visible = false; salon.add(silueta);
  const mural = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.1), lambert({ map: texPeriodicoMural() })); mural.position.set(S.x - 0.01, 1.55, -0.6); mural.rotation.y = -Math.PI / 2; salon.add(mural);
  // frente: pizarrón con marco y repisa de gises, reloj, abecedario, mapa, bandera en su asta
  const piz = new THREE.Group(); piz.position.set(0.3, 0, -S.z); salon.add(piz);
  piz.add(caja(4.0, 1.55, 0.06, lambert({ color: "#6a4a30" }), 0, 1.6, 0.03));
  piz.add(plano(3.84, 1.4, lambert({ map: texPizarron(), emissive: "#ffffff", emissiveIntensity: 0.06 }), 0, 1.6, 0.065));
  piz.add(caja(3.9, 0.04, 0.12, lambert({ color: "#6a4a30" }), 0, 0.84, 0.1));
  for (let k = 0; k < 4; k++) piz.add(caja(0.08, 0.02, 0.02, lambert({ color: ["#f0f0e8", "#f0e070", "#f0a0a0", "#f0f0e8"][k] }), -1.4 + k * 0.15, 0.87, 0.1));
  piz.add(caja(0.16, 0.05, 0.06, lambert({ color: "#3a3a3a" }), 1.5, 0.88, 0.1)); // borrador
  const reloj = new THREE.Mesh(new THREE.CircleGeometry(0.22, 32), lambert({ map: texReloj(), emissive: "#ffffff", emissiveIntensity: 0.1 })); reloj.position.set(0.3, 2.68, -S.z + 0.02); salon.add(reloj);
  const manecillas = new THREE.Group(); manecillas.position.set(0.3, 2.68, -S.z + 0.035); salon.add(manecillas);
  const mMan = lambert({ color: "#141414" });
  const horaM = caja(0.018, 0.11, 0.006, mMan, 0, 0.05, 0), minM = caja(0.012, 0.17, 0.006, mMan, 0, 0.08, 0.004);
  const horaG = new THREE.Group(); horaG.add(horaM); const minG = new THREE.Group(); minG.add(minM); manecillas.add(horaG, minG);
  const abc = new THREE.Mesh(new THREE.PlaneGeometry(7.6, 0.3), lambert({ map: texAbecedario() })); abc.position.set(0, 2.85, -S.z + 0.01); salon.add(abc);
  const mapa = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), lambert({ map: texMapa() })); mapa.position.set(3.1, 1.7, -S.z + 0.01); salon.add(mapa);
  const asta = new THREE.Group(); asta.position.set(-3.3, 0, -S.z + 0.35); salon.add(asta);
  asta.add(cil(0.15, 0.18, 0.08, lambert({ color: "#2a2a2c" }), 0, 0.04, 0), cil(0.015, 0.015, 2.2, lambert({ color: "#c9a24a" }), 0, 1.1, 0, 8));
  const tela = lienzo((c, w, h2) => { c.fillStyle = "#1f6a3a"; c.fillRect(0, 0, w / 3, h2); c.fillStyle = "#f2efe4"; c.fillRect(w / 3, 0, w / 3, h2); c.fillStyle = "#b02a2a"; c.fillRect(2 * w / 3, 0, w / 3, h2); c.fillStyle = "#7a5a2a"; c.beginPath(); c.arc(w / 2, h2 / 2, h2 * 0.16, 0, 7); c.fill(); }, 192, 128);
  const geoB = new THREE.PlaneGeometry(0.75, 0.5, 8, 1); { const p = geoB.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, 0.05 * Math.sin(p.getX(i) * 8)); }
  const bandera = new THREE.Mesh(geoB, lambert({ map: tela, side: THREE.DoubleSide })); bandera.position.set(0.39, 1.9, 0.0); asta.add(bandera);
  // escritorio de la maestra (cubierta, cajones con jaladera, patas), silla, la lista, libros, lámpara y manzana
  const esc = new THREE.Group(); esc.position.copy(ESCRITORIO); salon.add(esc);
  const mEsc = lambert({ color: "#7a5a3a" }), mEsc2 = lambert({ color: "#5a3e26" });
  esc.add(caja(1.5, 0.05, 0.75, mEsc, 0, 0.76, 0), caja(0.45, 0.7, 0.7, mEsc2, 0.5, 0.38, 0), caja(1.4, 0.55, 0.03, mEsc2, 0, 0.45, 0.34));
  for (let k = 0; k < 3; k++) esc.add(caja(0.12, 0.025, 0.02, lambert({ color: "#c9a24a" }), 0.5, 0.18 + k * 0.22, 0.36));
  for (const x of [-0.7]) for (const z of [-0.33, 0.33]) esc.add(caja(0.05, 0.74, 0.05, mEsc2, x, 0.37, z));
  const lista = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.36), lambert({ map: texLista(), emissive: "#ffffff", emissiveIntensity: 0.1 })); lista.rotation.x = -Math.PI / 2; lista.rotation.z = 0.15; lista.position.set(-0.1, 0.788, 0.12); esc.add(lista);
  esc.add(caja(0.3, 0.08, 0.22, lambert({ color: "#2f5f9a" }), -0.5, 0.82, -0.15), caja(0.28, 0.06, 0.2, lambert({ color: "#b03a2e" }), -0.5, 0.89, -0.15));
  const manz = new THREE.Mesh(new THREE.SphereGeometry(0.045, 12, 8), lambert({ color: "#b02a2a" })); manz.position.set(0.35, 0.83, 0.12); esc.add(manz);
  const lamp = new THREE.Group(); lamp.position.set(0.55, 0.785, -0.15); esc.add(lamp);
  lamp.add(cil(0.08, 0.09, 0.03, mMan, 0, 0.015, 0), cil(0.012, 0.012, 0.36, mMan, 0, 0.2, 0, 6));
  const pant = cil(0.05, 0.13, 0.13, lambert({ color: "#2f6a4a", side: THREE.DoubleSide }), 0.03, 0.4, 0, 16); pant.rotation.z = 0.3; lamp.add(pant);
  const focoL = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), brillo("#ffe2a8")); focoL.position.set(0.04, 0.35, 0); focoL.layers.set(NOINK); lamp.add(focoL);
  const luzLamp = new THREE.PointLight("#ffd7a0", 2.2, 5, 1.4); luzLamp.position.set(ESCRITORIO.x + 0.6, 1.0, ESCRITORIO.z + 0.2); salon.add(luzLamp);
  const sillaM = new THREE.Group(); sillaM.position.set(ESCRITORIO.x, 0, ESCRITORIO.z - 0.6); salon.add(sillaM);
  sillaM.add(caja(0.45, 0.04, 0.42, mEsc, 0, 0.45, 0), caja(0.45, 0.45, 0.04, mEsc, 0, 0.7, -0.2)); for (const sx of [-1, 1]) for (const sz of [-1, 1]) sillaM.add(caja(0.035, 0.45, 0.035, mEsc2, sx * 0.2, 0.225, sz * 0.18));
  // mesabancos: mesa (cubierta con canalito, cajón de rejilla, patas de tubo) y silla; su número al frente
  const mMesa = lambert({ color: "#c8a46a" }), mTubo = lambert({ color: "#3a4a5a" }), mSilla = lambert({ color: "#2f5f9a" });
  const sillas: THREE.Group[] = [], mesas: THREE.Group[] = [];
  const mochilas: THREE.Mesh[] = [];
  PUPITRES.forEach(([x, z], i) => {
    const m = new THREE.Group(); m.position.set(x, 0, z - 0.5); salon.add(m); mesas.push(m); // la mesa queda delante de la silla (hacia el pizarrón)
    m.add(caja(0.66, 0.035, 0.46, mMesa, 0, 0.6, 0), caja(0.66, 0.02, 0.04, lambert({ color: "#8a6a3a" }), 0, 0.625, -0.18));
    m.add(caja(0.6, 0.12, 0.36, mTubo, 0, 0.52, -0.02)); // cajón
    for (const sx of [-1, 1]) { m.add(caja(0.03, 0.58, 0.03, mTubo, sx * 0.29, 0.29, -0.18), caja(0.03, 0.58, 0.03, mTubo, sx * 0.29, 0.29, 0.18), caja(0.03, 0.03, 0.4, mTubo, sx * 0.29, 0.02, 0)); }
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), lambert({ map: texNumero(i + 1), emissive: "#ffffff", emissiveIntensity: 0.12 })); num.position.set(0, 0.52, -0.205); num.rotation.y = Math.PI; m.add(num); // número hacia el pizarrón
    const num2 = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.1), lambert({ map: texNumero(i + 1), emissive: "#ffffff", emissiveIntensity: 0.12 })); num2.rotation.x = -Math.PI / 2; num2.position.set(0.2, 0.619, 0.12); m.add(num2); // y en la cubierta
    const s = new THREE.Group(); s.position.set(x, 0, z); salon.add(s); sillas.push(s);
    s.add(caja(0.42, 0.035, 0.4, mSilla, 0, 0.38, 0), caja(0.42, 0.3, 0.03, mSilla, 0, 0.62, 0.2));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) s.add(caja(0.025, 0.38, 0.025, mTubo, sx * 0.19, 0.19, sz * 0.17));
    for (const sx of [-1, 1]) s.add(caja(0.025, 0.36, 0.025, mTubo, sx * 0.19, 0.55, 0.19));
    const mo = caja(0.26, 0.32, 0.14, lambert({ color: ["#c43a2c", "#2f6fb0", "#3a9a5a", "#8a4ab0", "#e07a20", "#2aa0a0"][i % 6] }), 0.26, 0.16, 0.12); s.add(mo); mochilas.push(mo); // mochila en el piso, junto a la silla
  });
  // lámparas de techo (dos tubos en su gabinete)
  const tubos: THREE.Mesh[] = [];
  for (const x of [-1.8, 1.8]) for (const z of [-2.4, 0.4, 3.0]) { salon.add(caja(0.4, 0.06, 1.3, lambert({ color: "#c8c8c0" }), x, S.alto - 0.03, z)); for (const dx of [-0.08, 0.08]) { const t = caja(0.05, 0.03, 1.2, brillo("#f2f6ff"), x + dx, S.alto - 0.075, z); t.layers.set(NOINK); salon.add(t); tubos.push(t); } }
  const luzSalon = [new THREE.PointLight("#eef2ff", 3.2, 9, 1.4), new THREE.PointLight("#eef2ff", 3.2, 9, 1.4)];
  luzSalon[0].position.set(-1.5, 2.6, -1.2); luzSalon[1].position.set(1.8, 2.6, 1.6); salon.add(...luzSalon);
  const ambSalon = new THREE.HemisphereLight("#d8dcf0", "#3a3a40", 0.0); salon.add(ambSalon);

  return {
    ...h, busG, bus, derecha, parque, ocultos, puesto, tumbar, escuela, hojaA, hojaB, cadena, patio, salon, puerta, perilla, silueta, luzPasillo, vidrioP,
    sombras, sillas, mesas, mochilas, tubos, luzSalon, ambSalon, luzLamp, horaG, minG,
  };
}
export type Escenario = ReturnType<typeof crearEscenario>;
const barraZ = (largo: number, r: number, m: THREE.Material, x: number, y: number, z: number) => { const c = cil(r, r, largo, m, x, y, z, 10); c.rotation.x = Math.PI / 2; return c; };
