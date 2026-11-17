// Escenario de «Mary Celeste» (mini documental, caso real de 1872). Un solo mundo:
//  · el mar abierto (olas suaves que se mueven, neblina; de día nublado, al atardecer o de noche con luna);
//  · el bergantín: casco negro con franja crema y cobre abajo, cubierta de tablones, borda con pasamanos, dos mástiles
//    con vergas, velas (unas puestas, otras recogidas, una rota), jarcias con flechates, bauprés con foques, caseta del
//    capitán atrás (puerta que se abre, ventanitas, tragaluz), timón de rueda, cocina con su chimenea, escotillas,
//    bomba, campana, anclas, barriles y rollos de cuerda; el lugar vacío del bote salvavidas y la cuerda rota;
//  · otro bergantín igual (el Dei Gratia; de noche, el «barco pirata» con velas negras);
//  · el bote salvavidas (con remos y bancas) y los tentáculos de la teoría del monstruo;
//  · adentro (cada cuarto en su lugar, lejos del mar): el camarote del capitán (mesa, lámpara colgada, litera, cama de
//    la niña con su muñeca, máquina de coser, escritorio con casilleros, caja vacía del sextante, pizarra del diario,
//    la espada debajo de la litera, el desayuno de la leyenda), el rancho de los marineros (literas, baúles, ropa
//    colgada, pipas, botas, farol), la bodega (costillas del casco, barriles de alcohol, agua, víveres) y el estudio
//    del escritor en 1884 (escritorio, lámpara de aceite, libros, ventana);
//  · el puerto de Nueva York al atardecer (muelle, bodegas de ladrillo con ventanas prendidas, faroles, otros barcos).
// Acabado §8.9; §8.6c (las puertas se abren, nada se atraviesa) y §8.6d (cada cosa con sus piezas).
// Texturas suaves (sin rayas finas de mucho contraste) para que nada parpadee.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { manchas } from "../ambulancia/ambulancia";

/** el barco (coordenadas propias): popa en z = −15, proa en z = +15, cubierta a y = 2.2, línea de agua a y = 0 */
export const B = { popa: -15, proa: 15, cubierta: 2.2, quilla: -2.6, manga: 3.4, borda: 0.95 };
export const MASTIL = { proa: 7, popa: -2, alto: 20 };
export const CASETA = { x: 2.2, z0: -12.2, z1: -6.8, alto: 2.0 }; // la caseta del capitán (puerta en z1)
export const RUEDA = { z: -13.6, y: B.cubierta + 1.25 };
export const ESCOTILLA = { z: -4.2 }; // la escotilla grande, con los calzos vacíos del bote encima
/** los cuartos de adentro (cada uno en su lugar) */
export const CAMAROTE = { x: 300, z: 0, x0: -2.4, x1: 2.4, z0: -2.0, z1: 2.0, alto: 2.15 };
export const MESA = { x: 0.35, z: 0.15, alto: 0.74, largo: 1.25, ancho: 0.8 };
export const LITERA = { x: -1.95, z: -0.3 };
export const ESCRITORIO = { x: 0.9, z: -1.62, alto: 0.78 };
export const RANCHO = { x: 340, z: 0, x0: -2.2, x1: 2.2, z0: -2.2, z1: 2.2, alto: 1.95 };
export const BODEGA = { x: 380, z: 0, x0: -3.0, x1: 3.0, z0: -6.5, z1: 6.5, alto: 2.7 };
export const ESTUDIO = { x: 420, z: 0, x0: -2.4, x1: 2.4, z0: -2.0, z1: 2.0, alto: 2.8 };

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
/** palo (cuerda o vara) de a a b */
const palo = (a: THREE.Vector3, b: THREE.Vector3, r: number, m: THREE.Material, seg = 6) => {
  const d = b.clone().sub(a), c = new THREE.Mesh(new THREE.CylinderGeometry(r, r, d.length(), seg), m);
  c.position.copy(a).add(b).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return c;
};
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const rz = (n: number) => { const x = Math.sin(n * 91.7) * 43758.5453; return x - Math.floor(x); };
const sm = (a: number, b: number, x: number) => { const u = Math.max(0, Math.min(1, (x - a) / (b - a))); return u * u * (3 - 2 * u); };

// ------------------------------------------------------------------ texturas (suaves: nada de rayitas finas que brillen)
const texAgua = (base: string, cresta: string, sombraC: string) => lienzo((c, w, h) => {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  c.filter = "blur(10px)";
  for (let k = 0; k < 70; k++) { const x = rz(k) * w, y = rz(k + 300) * h, l = 60 + rz(k + 7) * 120; c.strokeStyle = k % 3 ? cresta : sombraC; c.lineWidth = 10 + rz(k + 3) * 10; c.beginPath(); c.moveTo(x - l / 2, y); c.quadraticCurveTo(x, y - 12, x + l / 2, y); c.stroke(); }
  c.filter = "none";
}, 512, 512, [90, 90]);
const texCasco = (nombre: string, negro: boolean) => lienzo((c, w, h) => { // v = 0 en la quilla, 1 arriba de la borda; agua en v ≈ 0.45
  const yv = (y: number) => h * (1 - (y - B.quilla) / (3.6 - B.quilla));
  c.fillStyle = negro ? "#141418" : "#24272c"; c.fillRect(0, 0, w, h);
  c.fillStyle = negro ? "#2a1e1a" : "#7a3e26"; c.fillRect(0, yv(0.05), w, h - yv(0.05)); // cobre / pintura roja abajo
  c.fillStyle = "#c8c0aa"; c.fillRect(0, yv(0.18), w, yv(0.05) - yv(0.18)); // la línea del agua
  if (!negro) { c.fillStyle = "#cfc6ae"; c.fillRect(0, yv(2.75), w, yv(2.45) - yv(2.75)); } // franja crema
  manchas(c, w, h, 30, "60,50,40", 0.25);
  c.fillStyle = "rgba(110,70,40,0.35)"; for (let k = 0; k < 30; k++) c.fillRect(rz(k) * w, yv(2.4), 4, 20 + rz(k + 4) * 50); // óxido chorreado
  void nombre;
}, 1024, 256);
const texEspejo = (nombre: string) => lienzo((c, w, h) => { // la popa: tablas oscuras con el nombre pintado
  c.fillStyle = "#24272c"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#cfc6ae"; c.fillRect(0, h * 0.12, w, h * 0.07);
  c.fillStyle = "#e0d4a8"; c.textAlign = "center"; c.textBaseline = "middle";
  c.font = "bold 60px 'DejaVu Serif', serif"; c.fillText(nombre, w / 2, h * 0.36);
  c.font = "bold 34px 'DejaVu Serif', serif"; c.fillText("NEW YORK", w / 2, h * 0.5);
  manchas(c, w, h, 14, "60,50,40", 0.25);
}, 512, 512);
const texCubierta = () => lienzo((c, w, h) => { // tablones de pino gastados, juntas suaves
  c.fillStyle = "#9a8462"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { c.fillStyle = ["#9c8664", "#927c5a", "#a28c6a", "#8e7a58"][i % 4]; c.fillRect(i * w / 8 + 1, 0, w / 8 - 2, h); }
  c.filter = "blur(2px)"; c.fillStyle = "rgba(50,38,26,0.45)"; for (let i = 0; i < 8; i++) c.fillRect(i * w / 8 - 2, 0, 4, h); c.filter = "none";
  manchas(c, w, h, 24, "40,30,20", 0.3);
}, 512, 512, [3, 6]);
const texMadera = (base: string, junta = "rgba(30,20,12,0.35)") => lienzo((c, w, h) => { // paredes de tablas barnizadas
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  c.filter = "blur(2px)"; c.fillStyle = junta; for (let i = 0; i <= 6; i++) c.fillRect(0, i * h / 6 - 2, w, 4); c.filter = "none";
  manchas(c, w, h, 20, "30,20,12", 0.25);
}, 256, 256, [2, 1]);
const texVela = (rota: number) => lienzo((c, w, h) => { // lona: costuras suaves, manchas; rota: jirones abajo y agujeros
  c.fillStyle = "#d8d0bc"; c.fillRect(0, 0, w, h);
  c.filter = "blur(1.5px)"; c.fillStyle = "rgba(120,110,90,0.35)"; for (let x = w / 10; x < w; x += w / 10) c.fillRect(x, 0, 3, h); c.filter = "none";
  manchas(c, w, h, 22, "110,96,70", 0.28);
  c.fillStyle = "rgba(120,104,78,0.6)"; c.fillRect(0, 0, w, 8); c.fillRect(0, h - 8, w, 8);
  if (rota) {
    c.globalCompositeOperation = "destination-out";
    c.beginPath(); c.moveTo(0, h); for (let k = 0; k <= 16; k++) c.lineTo(k * w / 16, h - (0.15 + rz(k + rota) * 0.5) * h * rota); c.lineTo(w, h); c.closePath(); c.fill();
    for (let k = 0; k < 3; k++) { c.beginPath(); c.ellipse(rz(k + 9) * w, h * (0.3 + rz(k + 4) * 0.3), 30 + rz(k) * 40, 18 + rz(k + 1) * 30, rz(k + 2), 0, 7); c.fill(); }
    c.globalCompositeOperation = "source-over";
  }
}, 512, 512);
const texRed = () => lienzo((c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = "rgba(60,50,40,0.95)"; for (let y = 6; y < h; y += 32) c.fillRect(0, y, w, 6); }, 64, 256); // flechates (escalones de cuerda)
const texMapaMar = () => lienzo((c, w, h) => { // carta náutica clavada en la pared del camarote
  c.fillStyle = "#d8ccaa"; c.fillRect(0, 0, w, h); manchas(c, w, h, 16, "120,90,50", 0.3);
  c.strokeStyle = "rgba(90,70,40,0.5)"; c.lineWidth = 2; for (let k = 1; k < 6; k++) { c.beginPath(); c.moveTo(k * w / 6, 0); c.lineTo(k * w / 6, h); c.stroke(); c.beginPath(); c.moveTo(0, k * h / 6); c.lineTo(w, k * h / 6); c.stroke(); }
  c.fillStyle = "#8a7a5a"; c.beginPath(); c.moveTo(0, h * 0.2); c.quadraticCurveTo(w * 0.2, h * 0.4, w * 0.12, h); c.lineTo(0, h); c.fill();
  c.beginPath(); c.moveTo(w, h * 0.1); c.quadraticCurveTo(w * 0.8, h * 0.5, w * 0.9, h); c.lineTo(w, h); c.fill();
  c.strokeStyle = "#7a2a1a"; c.setLineDash([10, 8]); c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.14, h * 0.4); c.quadraticCurveTo(w * 0.5, h * 0.3, w * 0.86, h * 0.45); c.stroke();
}, 512, 384);
const texLadrillo = (prendidas: boolean) => lienzo((c, w, h) => { // bodega del puerto: ladrillo con ventanas
  c.fillStyle = "#5a3a2e"; c.fillRect(0, 0, w, h); manchas(c, w, h, 20, "30,20,16", 0.35);
  for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) {
    const x = w * (0.08 + k * 0.23), y = h * (0.12 + r * 0.3), on = prendidas && rz(r * 7 + k) > 0.45;
    c.fillStyle = on ? "#f0c070" : "#1a1c22"; c.fillRect(x, y, w * 0.14, h * 0.18); c.strokeStyle = "#cfc4aa"; c.lineWidth = 5; c.strokeRect(x, y, w * 0.14, h * 0.18);
  }
}, 512, 512);
const texPizarra = () => lienzo((c, w, h) => { // la pizarra del diario: la última anotación
  c.fillStyle = "#4a3a28"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2e30"; c.fillRect(18, 18, w - 36, h - 36);
  c.fillStyle = "rgba(220,220,210,0.9)"; c.font = "italic 34px 'DejaVu Serif', serif"; c.textAlign = "left";
  ["Nov. 25", "8 a.m.  Isla", "Santa María", "al ESE, 6 millas", "Todo en orden"].forEach((s, i) => c.fillText(s, 40, 70 + i * 52));
}, 512, 320);
const texEspada = () => lienzo((c, w, h) => { // hoja de la espada con manchas oscuras
  c.fillStyle = "#b8bcc0"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(255,255,255,0.4)"; c.fillRect(0, h * 0.35, w, h * 0.12);
  for (let k = 0; k < 7; k++) { const g = c.createRadialGradient(w * (0.15 + k * 0.11), h * (0.3 + rz(k) * 0.4), 1, w * (0.15 + k * 0.11), h * 0.5, 14 + rz(k + 2) * 20); g.addColorStop(0, "rgba(110,26,18,0.95)"); g.addColorStop(1, "rgba(90,24,18,0)"); c.fillStyle = g; c.fillRect(0, 0, w, h); }
}, 512, 64);
const texLibros = () => lienzo((c, w, h) => { // librero: lomos de colores
  c.fillStyle = "#3a2a1c"; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 4; r++) { let x = 6; while (x < w - 10) { const bw = 10 + rz(x + r * 50) * 14; c.fillStyle = ["#6a2a22", "#2a3a5a", "#3a5a3a", "#7a6a3a", "#4a2a3a"][Math.floor(rz(x * 3 + r) * 5)]; c.fillRect(x, r * h / 4 + 8 + rz(x) * 8, bw - 2, h / 4 - 14 - rz(x) * 8); x += bw; } c.fillStyle = "#2a1e14"; c.fillRect(0, (r + 1) * h / 4 - 6, w, 6); }
}, 512, 512);
const texRopa = (color: string, tipo: number) => lienzo((c, w, h) => { // camisa o impermeable colgado (recortado)
  c.clearRect(0, 0, w, h); c.fillStyle = color;
  c.beginPath(); c.moveTo(w * 0.35, 0); c.lineTo(w * 0.65, 0); c.lineTo(w, h * 0.25); c.lineTo(w * 0.82, h * 0.42); c.lineTo(w * 0.75, h * 0.3); c.lineTo(w * 0.75, h); c.lineTo(w * 0.25, h); c.lineTo(w * 0.25, h * 0.3); c.lineTo(w * 0.18, h * 0.42); c.lineTo(0, h * 0.25); c.closePath(); c.fill();
  c.fillStyle = "rgba(0,0,0,0.2)"; c.fillRect(w * 0.48, h * 0.05, 4, h * 0.9);
  if (tipo) { c.fillStyle = "rgba(255,255,255,0.15)"; for (let k = 0; k < 5; k++) c.fillRect(w * 0.3, h * (0.2 + k * 0.15), w * 0.4, 3); }
  manchas(c, w, h, 6, "0,0,0", 0.2);
}, 128, 192);
const texCielo = (arriba: string, abajo: string) => lienzo((c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, arriba); g.addColorStop(1, abajo); c.fillStyle = g; c.fillRect(0, 0, w, h); }, 16, 256);
const texCiudad = () => lienzo((c, w, h) => { // la ciudad a lo lejos: siluetas con lucecitas
  c.clearRect(0, 0, w, h);
  let x = 0; while (x < w) { const bw = 20 + rz(x) * 50, bh = h * (0.25 + rz(x + 3) * 0.55); c.fillStyle = "#1e1a24"; c.fillRect(x, h - bh, bw, bh); if (rz(x + 9) > 0.7) { c.fillRect(x + bw / 2 - 3, h - bh - 30, 6, 30); } for (let k = 0; k < 4; k++) if (rz(x * 2 + k) > 0.5) { c.fillStyle = "#e8b060"; c.fillRect(x + 4 + rz(x + k) * (bw - 10), h - bh + 10 + rz(x + k + 1) * (bh - 20), 4, 5); } x += bw + 2; }
}, 1024, 256);

// ------------------------------------------------------------------ piezas
/** casco, cubierta, borda y todo lo de arriba de un bergantín */
export const crearBarco = (nombre: string, negro = false) => {
  const g = new THREE.Group();
  const NZ = 44, NS = 12;
  const mitad = (u: number) => { if (u > 0.97) return 0.0; const proa = u > 0.58 ? Math.pow(Math.max(0, (1 - u) / 0.42), 0.62) : 1; return B.manga * (u < 0.35 ? 0.78 + 0.22 * sm(0, 0.35, u) : 1) * proa; };
  const arriba = (u: number) => 3.15 + 0.45 * sm(0.62, 1, u) + 0.12 * sm(0.2, 0, u);
  const quilla = (u: number) => B.quilla + 1.6 * sm(0.78, 1, u) + 0.5 * sm(0.12, 0, u);
  const zU = (u: number) => B.popa + u * (B.proa - B.popa);
  // casco: cinta de la borda de babor, por la quilla, a la borda de estribor
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= NZ; i++) {
    const u = i / NZ, half = mitad(u), top = arriba(u), kb = quilla(u), z = zU(u);
    for (let j = 0; j <= 2 * NS; j++) {
      const s = j / NS - 1, a = Math.abs(s); // −1 babor arriba … 0 quilla … 1 estribor arriba
      const x = Math.sign(s) * half * Math.pow(Math.cos((1 - a) * Math.PI / 2), 0.55), y = top + (kb - top) * Math.pow(Math.sin((1 - a) * Math.PI / 2), 1.5);
      pos.push(x, y, z); uv.push(u * 3, (y - B.quilla) / (3.6 - B.quilla));
    }
  }
  const W = 2 * NS + 1;
  for (let i = 0; i < NZ; i++) for (let j = 0; j < 2 * NS; j++) { const a = i * W + j, b = a + W; idx.push(a, b, a + 1, a + 1, b, b + 1); }
  const gc = new THREE.BufferGeometry(); gc.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gc.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gc.setIndex(idx); gc.computeVertexNormals();
  const tCasco = texCasco(nombre, negro); tCasco.wrapT = THREE.ClampToEdgeWrapping;
  g.add(new THREE.Mesh(gc, lambert({ map: tCasco, side: THREE.DoubleSide })));
  // espejo de popa con el nombre
  const sh = new THREE.Shape(); const u0 = 0, h0 = mitad(u0), t0 = arriba(u0), k0 = quilla(u0);
  for (let j = 0; j <= 2 * NS; j++) { const s = j / NS - 1, a = Math.abs(s); const x = Math.sign(s) * h0 * Math.pow(Math.cos((1 - a) * Math.PI / 2), 0.55), y = t0 + (k0 - t0) * Math.pow(Math.sin((1 - a) * Math.PI / 2), 1.5); if (j) sh.lineTo(x, y); else sh.moveTo(x, y); }
  const gEsp = new THREE.ShapeGeometry(sh); const pe = gEsp.attributes.position, ue = gEsp.attributes.uv;
  for (let i = 0; i < pe.count; i++) ue.setXY(i, (pe.getX(i) + h0) / (2 * h0), (pe.getY(i) - 0.2) / (t0 - 0.2));
  const espejo = new THREE.Mesh(gEsp, lambert({ map: texEspejo(nombre), side: THREE.DoubleSide })); espejo.position.z = B.popa - 0.01; g.add(espejo);
  // cubierta (plana) y la borda por dentro (crema), con su pasamanos
  const cu = new THREE.Shape(); const per: [number, number][] = [];
  for (let i = 0; i <= NZ; i++) per.push([mitad(i / NZ) - 0.08, zU(i / NZ)]);
  cu.moveTo(-per[0][0], per[0][1]); per.forEach(([x, z]) => cu.lineTo(-x, z)); [...per].reverse().forEach(([x, z]) => cu.lineTo(x, z));
  const gCu = new THREE.ShapeGeometry(cu); const pc = gCu.attributes.position, ucu = gCu.attributes.uv;
  for (let i = 0; i < pc.count; i++) ucu.setXY(i, pc.getX(i) / 3, pc.getY(i) / 8);
  const cubierta = new THREE.Mesh(gCu, lambert({ map: texCubierta(), side: THREE.DoubleSide })); cubierta.rotation.x = Math.PI / 2; cubierta.position.y = B.cubierta; g.add(cubierta); // la forma se dibujó en (x, z)
  const mBordaIn = lambert({ color: "#c8bea6", side: THREE.DoubleSide }), mPasa = lambert({ color: "#5a4230" });
  for (const s of [-1, 1]) {
    const p2: number[] = [], i2: number[] = [];
    for (let i = 0; i <= NZ; i++) { const u = i / NZ, x = s * (mitad(u) - 0.1), z = zU(u); p2.push(x, B.cubierta, z, x, arriba(u) - 0.04, z); if (i) { const a = (i - 1) * 2; i2.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const gb = new THREE.BufferGeometry(); gb.setAttribute("position", new THREE.Float32BufferAttribute(p2, 3)); gb.setIndex(i2); gb.computeVertexNormals();
    g.add(new THREE.Mesh(gb, mBordaIn));
    for (let i = 1; i <= NZ; i++) { const u = i / NZ, q = (i - 1) / NZ; const a = V(s * (mitad(q) - 0.05), arriba(q) + 0.02, zU(q)), b = V(s * (mitad(u) - 0.05), arriba(u) + 0.02, zU(u)); if (a.distanceTo(b) > 0.01) g.add(palo(a, b, 0.07, mPasa, 5)); }
    // candeleros (barrotes verticales) cada tanto, para que se lea la borda de cerca
    for (let i = 2; i < NZ - 2; i += 2) { const u = i / NZ; g.add(caja(0.08, arriba(u) - B.cubierta - 0.05, 0.08, mPasa, s * (mitad(u) - 0.16), (arriba(u) + B.cubierta) / 2, zU(u))); }
  }
  // espejo de popa por dentro (para que desde cubierta no se vea el agua a través)
  g.add(caja(2 * mitad(0) - 0.2, arriba(0) - B.cubierta, 0.06, mBordaIn, 0, (arriba(0) + B.cubierta) / 2, B.popa + 0.1));

  const mMad = lambert({ color: "#6a5038" }), mOsc = lambert({ color: "#3a2c20" }), mCuerda = lambert({ color: "#a89470" }), mFierro = lambert({ color: "#2a2c30" }), mBlanco = lambert({ color: "#d8d2c0" });
  const mCaseta = lambert({ map: texMadera("#cbbf9e", "rgba(60,50,30,0.3)") });
  // ---- caseta del capitán (atrás): paredes claras, techo, tragaluz, ventanitas y la puerta (gira desde su bisagra)
  const C = CASETA, cz = (C.z0 + C.z1) / 2, cl = C.z1 - C.z0, yb = B.cubierta;
  g.add(caja(C.x * 2, C.alto, cl, mCaseta, 0, yb + C.alto / 2, cz));
  g.add(caja(C.x * 2 + 0.3, 0.1, cl + 0.3, mMad, 0, yb + C.alto + 0.05, cz));
  g.add(caja(1.1, 0.35, 1.3, mMad, 0, yb + C.alto + 0.27, cz - 0.6)); // tragaluz
  for (const s of [-1, 1]) for (const zz of [-0.35, 0.35]) g.add(caja(0.42, 0.24, 0.62, lambert({ color: "#9ab0b8" }), s * 0.28, yb + C.alto + 0.33, cz - 0.6 + zz * 0.6));
  for (const s of [-1, 1]) for (const zz of [cz - 1.5, cz + 1.2]) { g.add(caja(0.04, 0.5, 0.7, mOsc, s * (C.x + 0.01), yb + 1.35, zz)); g.add(caja(0.05, 0.38, 0.58, lambert({ color: "#1c2228" }), s * (C.x + 0.02), yb + 1.35, zz)); }
  g.add(caja(1.0, 1.85, 0.06, mOsc, -0.6, yb + 0.92, C.z1 + 0.01)); // marco de la puerta
  const puerta = new THREE.Group(); puerta.position.set(-1.05, yb, C.z1 + 0.05); g.add(puerta);
  puerta.add(caja(0.86, 1.78, 0.06, lambert({ color: "#7a5a3c" }), 0.43, 0.89, 0));
  puerta.add(caja(0.86, 0.06, 0.07, mOsc, 0.43, 0.6, 0), caja(0.86, 0.06, 0.07, mOsc, 0.43, 1.35, 0));
  puerta.add(cil(0.035, 0.035, 0.06, lambert({ color: "#b89a50" }), 0.75, 0.95, 0.06, 8));
  const hueco = caja(0.84, 1.76, 0.02, brillo("#0a0806"), -0.6, yb + 0.9, C.z1 - 0.02); g.add(hueco); // adentro, oscuro
  for (let k = 0; k < 2; k++) g.add(caja(1.0, 0.16, 0.3 - k * 0.1, mMad, -0.6, yb + 0.08 + k * 0.16, C.z1 + 0.35 - k * 0.1)); // escaloncitos
  // ---- timón de rueda (atrás de la caseta)
  const rueda = new THREE.Group(); rueda.position.set(0, RUEDA.y, RUEDA.z); g.add(rueda);
  const mRueda = lambert({ color: "#7a5434" });
  rueda.add(new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.045, 8, 32), mRueda));
  rueda.add(new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.05, 8, 18), mRueda));
  rueda.add(cil(0.09, 0.09, 0.22, lambert({ color: "#b89a50" }), 0, 0, 0, 12).rotateX(Math.PI / 2));
  for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4; const r = palo(V(0, 0, 0), V(Math.cos(a) * 0.84, Math.sin(a) * 0.84, 0), 0.025, mRueda); rueda.add(r); const m = cil(0.03, 0.02, 0.2, mRueda, Math.cos(a) * 0.93, Math.sin(a) * 0.93, 0, 6); m.rotation.z = a - Math.PI / 2; rueda.add(m); }
  g.add(caja(0.5, 1.0, 0.5, mMad, 0, yb + 0.5, RUEDA.z - 0.35), caja(0.62, 0.08, 0.62, mOsc, 0, yb + 1.04, RUEDA.z - 0.35));
  g.add(caja(0.2, 0.2, 0.5, mMad, 0, RUEDA.y, RUEDA.z - 0.3));
  // bitácora (la cajita de la brújula) junto al timón
  g.add(cil(0.22, 0.26, 1.0, mMad, 0.9, yb + 0.5, RUEDA.z + 0.2, 12), cil(0.24, 0.24, 0.22, lambert({ color: "#b89a50" }), 0.9, yb + 1.1, RUEDA.z + 0.2, 14));
  // ---- escotilla grande con los calzos vacíos del bote (aquí iba el bote salvavidas)
  const E = ESCOTILLA;
  g.add(caja(2.1, 0.45, 2.4, mMad, 0, yb + 0.22, E.z), caja(1.9, 0.06, 2.2, lambert({ color: "#5a4632" }), 0, yb + 0.47, E.z));
  { const cu2 = new THREE.Shape(); cu2.moveTo(-0.95, 0); cu2.lineTo(0.95, 0); cu2.lineTo(0.95, 0.42); for (let k = 0; k <= 12; k++) { const a = k / 12; cu2.lineTo(0.85 - a * 1.7, 0.42 - 0.3 * Math.sin(a * Math.PI)); } cu2.lineTo(-0.95, 0.42); cu2.lineTo(-0.95, 0);
    const gcu = new THREE.ExtrudeGeometry(cu2, { depth: 0.2, bevelEnabled: false });
    for (const zz of [-0.75, 0.75]) { const calzo = new THREE.Mesh(gcu, lambert({ color: "#7a5a3c" })); calzo.position.set(0, yb + 0.5, E.z + zz - 0.1); g.add(calzo); } }
  for (const s of [-1, 1]) { // trincas del bote: cuerdas cortadas que cuelgan
    g.add(palo(V(s * 1.0, yb + 0.55, E.z - 1.0), V(s * 0.8, yb + 0.85, E.z - 0.4), 0.025, mCuerda), palo(V(s * 1.0, yb + 0.55, E.z + 1.0), V(s * 1.05, yb + 0.05, E.z + 1.3), 0.025, mCuerda));
  }
  // ---- escotilla de proa (abierta: la tapa a un lado) y su hueco oscuro
  g.add(caja(1.5, 0.4, 1.5, mMad, 0, yb + 0.2, 10.2), caja(1.2, 0.02, 1.2, brillo("#0a0806"), 0, yb + 0.41, 10.2));
  const tapa = caja(1.3, 0.08, 1.3, lambert({ color: "#5a4632" }), 1.45, yb + 0.12, 10.4); tapa.rotation.z = 0.12; g.add(tapa);
  // ---- caseta de proa (cocina y rancho) con su chimenea
  g.add(caja(3.0, 1.9, 3.2, mCaseta, 0, yb + 0.95, 3.4), caja(3.2, 0.1, 3.4, mMad, 0, yb + 1.95, 3.4));
  g.add(cil(0.14, 0.14, 0.9, mFierro, 0.8, yb + 2.4, 3.8, 10), cil(0.2, 0.2, 0.08, mFierro, 0.8, yb + 2.86, 3.8, 10));
  g.add(caja(0.8, 1.7, 0.06, lambert({ color: "#7a5a3c" }), -0.6, yb + 0.85, 4.99));
  for (const s of [-1, 1]) g.add(caja(0.04, 0.4, 0.5, lambert({ color: "#1c2228" }), s * 1.51, yb + 1.3, 3.0));
  // ---- bomba de achique (junto al palo mayor), campana, barriles, rollos de cuerda, cabillero, anclas
  g.add(cil(0.12, 0.14, 0.9, mOsc, 0.9, yb + 0.45, MASTIL.popa + 1.2, 10));
  const brazoB = palo(V(0.2, yb + 0.95, MASTIL.popa + 1.2), V(1.6, yb + 0.95, MASTIL.popa + 1.2), 0.035, mMad); g.add(brazoB);
  g.add(caja(0.08, 0.35, 0.08, mOsc, 0.9, yb + 1.05, MASTIL.popa + 1.2));
  const sonda = palo(V(-0.9, yb + 0.03, MASTIL.popa + 0.6), V(-0.2, yb + 0.03, MASTIL.popa + 1.4), 0.02, mFierro); g.add(sonda); // la vara de sondeo, tirada
  const campana = new THREE.Group(); campana.position.set(-1.5, yb, 11.9); g.add(campana);
  campana.add(caja(0.1, 1.1, 0.1, mMad, -0.35, 0.55, 0), caja(0.1, 1.1, 0.1, mMad, 0.35, 0.55, 0), caja(0.85, 0.1, 0.14, mMad, 0, 1.1, 0));
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.2, 0.3, 14, 1, true), lambert({ color: "#b8902e", side: THREE.DoubleSide })); bell.position.set(0, 0.88, 0); campana.add(bell);
  const mBarril = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#7a5634"; c.fillRect(0, 0, w, h); for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? "rgba(40,26,14,0.25)" : "rgba(160,120,80,0.15)"; c.fillRect(k * w / 10, 0, w / 10, h); } c.fillStyle = "#2e2a26"; for (const y of [0.12, 0.3, 0.7, 0.88]) c.fillRect(0, y * h - 5, w, 10); }, 256, 128) });
  const barril = (x: number, y: number, z: number, acostado = false, s = 1) => { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3 * s, 0.3 * s, 0.85 * s, 14), mBarril); const ba = new THREE.Mesh(new THREE.SphereGeometry(0.34 * s, 14, 8), mBarril); ba.scale.y = 1.15; const gr = new THREE.Group(); gr.add(b, ba); gr.position.set(x, y + (acostado ? 0.34 * s : 0.45 * s), z); if (acostado) gr.rotation.z = Math.PI / 2; return gr; };
  for (const [x, z] of [[-1.9, 1.0], [-1.25, 1.0], [-1.9, 0.35], [1.9, 6.0], [1.9, 5.35]]) g.add(barril(x, yb, z));
  for (const [x, z] of [[1.6, 8.6], [-2.0, -1.0], [1.2, -9.5]]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.07, 6, 18), mCuerda); r.rotation.x = Math.PI / 2; r.position.set(x, yb + 0.07, z); g.add(r); const r2 = r.clone(); r2.scale.setScalar(0.7); r2.position.y += 0.1; g.add(r2); }
  for (const s of [-1, 1]) for (const zz of [MASTIL.proa, MASTIL.popa]) { const u = (zz - B.popa) / (B.proa - B.popa), x = s * (mitad(u) - 0.3); g.add(caja(0.1, 0.1, 1.6, mMad, x, yb + 0.75, zz)); for (let k = 0; k < 6; k++) g.add(cil(0.025, 0.025, 0.4, mMad, x, yb + 0.8, zz - 0.65 + k * 0.26, 6)); }
  const ancla = () => { const a = new THREE.Group(); a.add(cil(0.06, 0.06, 1.6, mFierro, 0, 0, 0, 8)); a.add(palo(V(0, -0.8, 0), V(0.5, -0.45, 0), 0.06, mFierro), palo(V(0, -0.8, 0), V(-0.5, -0.45, 0), 0.06, mFierro)); a.add(palo(V(0, 0.7, -0.6), V(0, 0.7, 0.6), 0.05, mMad)); a.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.03, 6, 12), mFierro).translateY(0.86)); return a; };
  for (const s of [-1, 1]) { const a = ancla(); const u = 0.86; a.position.set(s * (mitad(u) + 0.15), arriba(u) - 0.6, zU(u)); a.rotation.set(0, 0, s * 0.15); g.add(a); }
  // ---- cuerda rota que cuelga de la popa hasta el agua (la del bote)
  const cuerdaRota = new THREE.Group(); g.add(cuerdaRota);
  { let p = V(0.9, arriba(0.02) + 0.05, B.popa + 0.6); for (let k = 0; k < 7; k++) { const q = V(0.9 + Math.sin(k) * 0.08, p.y - (k < 2 ? 0.25 : 0.7), B.popa - 0.25 - k * 0.45); cuerdaRota.add(palo(p, q, 0.03, mCuerda)); p = q; } }

  // ---- mástiles, vergas, velas, jarcias, bauprés y foques
  const velas: { m: THREE.Mesh; base: Float32Array; fase: number; amp: number }[] = [];
  const mVelaS = lambert({ map: texVela(0), side: THREE.DoubleSide }), mVelaR = lambert({ map: texVela(1), side: THREE.DoubleSide, transparent: true, alphaTest: 0.4 });
  const vela = (ancho: number, alto: number, m: THREE.Material, x: number, y: number, z: number, panza: number, amp: number, fase: number) => { // cuelga de su verga (borde de arriba en y)
    const geo = new THREE.PlaneGeometry(ancho, alto, 10, 8); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const xx = p.getX(i) / (ancho / 2), yy = (p.getY(i) + alto / 2) / alto; p.setZ(i, panza * (1 - xx * xx) * Math.sin((1 - yy) * Math.PI * 0.9)); }
    geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, m); me.position.set(x, y - alto / 2, z); g.add(me); velas.push({ m: me, base: Float32Array.from(p.array as Float32Array), fase, amp }); return me;
  };
  const verga = (y: number, largo: number, z: number) => g.add(palo(V(-largo / 2, y, z), V(largo / 2, y, z), 0.09, mOsc));
  const recogida = (y: number, largo: number, z: number) => { const r = cil(0.18, 0.18, largo * 0.9, mBlanco, 0, y - 0.15, z + 0.12, 10); r.rotation.z = Math.PI / 2; g.add(r); };
  const MP = MASTIL.proa, MM = MASTIL.popa, top = B.cubierta + MASTIL.alto;
  g.add(cil(0.14, 0.25, MASTIL.alto, mOsc, 0, B.cubierta + MASTIL.alto / 2, MP, 12), cil(0.13, 0.25, MASTIL.alto + 1, mOsc, 0, B.cubierta + (MASTIL.alto + 1) / 2, MM, 12));
  for (const zz of [MP, MM]) g.add(caja(1.3, 0.12, 1.1, mOsc, 0, B.cubierta + 9.2, zz), caja(0.8, 0.1, 0.7, mOsc, 0, B.cubierta + 15.2, zz)); // cofas
  // trinquete (cuadras): trinquete puesto, gavia baja perdida (jirones), gavia alta puesta, juanete y sobrejuanete recogidas
  verga(B.cubierta + 8.6, 12, MP + 0.3); vela(11, 4.6, mVelaS, 0, B.cubierta + 8.5, MP + 0.45, 0.9, 0.12, 0);
  verga(B.cubierta + 11.4, 10.4, MP + 0.3); vela(9.6, 1.6, mVelaR, 0, B.cubierta + 11.3, MP + 0.42, 0.4, 0.25, 1.3);
  verga(B.cubierta + 13.6, 9.2, MP + 0.3); vela(8.6, 2.1, mVelaS, 0, B.cubierta + 13.5, MP + 0.42, 0.6, 0.12, 2.1);
  verga(B.cubierta + 16.2, 7.4, MP + 0.3); recogida(B.cubierta + 16.2, 7.4, MP + 0.3);
  verga(B.cubierta + 18.4, 5.6, MP + 0.3); recogida(B.cubierta + 18.4, 5.6, MP + 0.3);
  // palo mayor: botavara y pico con la cangreja recogida
  g.add(palo(V(0, B.cubierta + 1.6, MM - 0.2), V(0, B.cubierta + 1.9, B.popa + 0.5), 0.11, mOsc));
  g.add(palo(V(0, B.cubierta + 9.0, MM - 0.2), V(0, B.cubierta + 10.6, MM - 7.5), 0.09, mOsc));
  { const r = palo(V(0, B.cubierta + 1.85, MM - 0.6), V(0, B.cubierta + 2.0, B.popa + 1.2), 0.24, mBlanco, 10); g.add(r); }
  // jarcias (obenques) con flechates, de las cofas a la borda
  const mJar = lambert({ color: "#2a241e" }), mFle = new THREE.MeshLambertMaterial({ map: texRed(), transparent: true, alphaTest: 0.35, side: THREE.DoubleSide });
  for (const zz of [MP, MM]) for (const s of [-1, 1]) {
    const u = (zz - 1.2 - B.popa) / (B.proa - B.popa), xb = s * (mitad(u) - 0.05), yr = arriba(u);
    const pts = [-0.8, -0.27, 0.27, 0.8].map((d) => [V(s * 0.55, B.cubierta + 9.1, zz + d * 0.4), V(xb, yr, zz - 1.2 + d)] as const);
    pts.forEach(([a, b]) => g.add(palo(a, b, 0.025, mJar, 4)));
    // flechates: un plano con escalones entre los obenques de en medio
    const a0 = pts[0][0], a1 = pts[3][0], b0 = pts[0][1], b1 = pts[3][1];
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute([b0.x, b0.y, b0.z, b1.x, b1.y, b1.z, a0.x, a0.y, a0.z, a1.x, a1.y, a1.z], 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute([0, 0, 1, 0, 0, 1, 1, 1], 2)); geo.setIndex([0, 1, 2, 2, 1, 3]); geo.computeVertexNormals();
    const fl = new THREE.Mesh(geo, mFle); (fl.material as THREE.MeshLambertMaterial).map!.repeat.set(1, 6); g.add(fl);
    g.add(palo(V(s * 0.3, B.cubierta + 15.1, zz), V(xb, yr, zz - 2.4), 0.02, mJar, 4)); // obenque de arriba
  }
  // estays: del tope del trinquete al bauprés; del mayor al trinquete
  const bauA = V(0, arriba(1) - 0.2, B.proa - 0.5), bauB = V(0, arriba(1) + 1.6, B.proa + 6.5);
  g.add(palo(bauA, bauB, 0.12, mOsc, 8), palo(V(0, arriba(1) + 0.8, B.proa + 3), V(0, arriba(1) + 1.25, B.proa + 9), 0.07, mOsc, 6));
  g.add(palo(V(0, top - 1.5, MP), V(0, arriba(1) + 1.6, B.proa + 6.4), 0.025, mJar, 4), palo(V(0, B.cubierta + 9.2, MP), V(0, arriba(1) + 0.2, B.proa), 0.03, mJar, 4));
  g.add(palo(V(0, top, MM), V(0, B.cubierta + 15.3, MP), 0.025, mJar, 4), palo(V(0, B.cubierta + 9.2, MM), V(0, B.cubierta + 2.3, MP - 0.5), 0.03, mJar, 4));
  // foques: uno puesto (triángulo) y otro suelto, colgando roto
  const foque = (a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3, m: THREE.Material, panza: number) => {
    const geo = new THREE.BufferGeometry(); const N = 6, p: number[] = [], uvv: number[] = [], ii: number[] = [];
    for (let i = 0; i <= N; i++) for (let j = 0; j <= N - i; j++) { const u = i / N, v = j / N; const q = a.clone().multiplyScalar(1 - u - v).add(b.clone().multiplyScalar(u)).add(c.clone().multiplyScalar(v)); q.x += panza * u * v * 4 * (1 - u - v + 0.3); p.push(q.x, q.y, q.z); uvv.push(u, v); }
    let k = 0; const fila: number[] = []; for (let i = 0; i <= N; i++) { fila.push(k); k += N - i + 1; }
    for (let i = 0; i < N; i++) for (let j = 0; j < N - i; j++) { const a0 = fila[i] + j, b0 = fila[i + 1] + j; ii.push(a0, b0, a0 + 1); if (j < N - i - 1) ii.push(a0 + 1, b0, b0 + 1); }
    geo.setAttribute("position", new THREE.Float32BufferAttribute(p, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(uvv, 2)); geo.setIndex(ii); geo.computeVertexNormals();
    const me = new THREE.Mesh(geo, m); g.add(me); velas.push({ m: me, base: Float32Array.from(p), fase: a.z, amp: 0.1 }); return me;
  };
  foque(V(0, arriba(1) + 0.5, B.proa + 0.8), V(0, B.cubierta + 12.5, MP + 0.4), V(0, arriba(1) + 1.4, B.proa + 5.8), mVelaS, 0.8);
  foque(V(0, arriba(1) + 1.5, B.proa + 6.2), V(0, B.cubierta + 9.5, B.proa + 2.2), V(0.2, arriba(1) + 0.4, B.proa + 4.0), mVelaR, -0.5);
  // banderín en el tope del mayor
  const banderin = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.4, 6, 1), lambert({ color: negro ? "#101010" : "#8a2a22", side: THREE.DoubleSide })); banderin.position.set(0, top + 0.5, MM - 0.75); banderin.rotation.y = Math.PI / 2; g.add(banderin);
  velas.push({ m: banderin, base: Float32Array.from(banderin.geometry.attributes.position.array as Float32Array), fase: 3, amp: 0.15 });

  /** que se muevan las velas con el viento (t en segundos; fuerza 0 … 1) */
  const ondear = (t: number, fuerza = 1) => {
    for (const v of velas) {
      const p = v.m.geometry.attributes.position as THREE.BufferAttribute, b = v.base;
      for (let i = 0; i < p.count; i++) { const x = b[i * 3], y = b[i * 3 + 1]; p.setXYZ(i, x, y, b[i * 3 + 2] + fuerza * v.amp * Math.sin(t * 2.2 + x * 0.6 + y * 0.9 + v.fase)); }
      p.needsUpdate = true; v.m.geometry.computeVertexNormals();
    }
  };
  // espuma donde el casco toca el agua (suave)
  const mEsp = new THREE.MeshBasicMaterial({ map: lienzo((c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(210,220,224,0)"); gr.addColorStop(0.5, "rgba(210,220,224,0.55)"); gr.addColorStop(1, "rgba(210,220,224,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, 16, 64), transparent: true, depthWrite: false });
  for (const s of [-1, 1]) { const e = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 28), mEsp); e.rotation.x = -Math.PI / 2; e.position.set(s * (B.manga + 0.1), 0.04, 0); e.layers.set(NOINK); g.add(e); }
  return { g, rueda, puerta, cuerdaRota, ondear, campana: bell, hueco };
};
export type Barco = ReturnType<typeof crearBarco>;

/** el bote salvavidas (chalupa de remos): casco, bancas, remos */
export const crearBote = () => {
  const g = new THREE.Group(), L = 5.0, A = 1.7;
  const pts: [number, number][] = [];
  for (let i = 0; i <= 24; i++) { const u = i / 24, z = -L / 2 + u * L; const half = A / 2 * (u > 0.6 ? Math.pow((1 - u) / 0.4, 0.6) : 0.85 + 0.15 * sm(0, 0.3, u)); pts.push([half, z]); }
  const pos: number[] = [], idx: number[] = [];
  pts.forEach(([h, z], i) => { pos.push(-h * 0.7, -0.35, z, -h, 0.45, z, h * 0.7, -0.35, z, h, 0.45, z); if (i) { const a = (i - 1) * 4, b = i * 4; idx.push(a, b, a + 1, a + 1, b, b + 1, a + 2, a + 3, b + 2, b + 2, a + 3, b + 3, a, a + 2, b, b, a + 2, b + 2); } });
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, lambert({ color: "#d4ccb4", side: THREE.DoubleSide })));
  const mMad = lambert({ color: "#7a5a3a" });
  g.add(caja(A * 0.85, 0.45, 0.05, lambert({ color: "#d4ccb4" }), 0, 0.05, -L / 2));
  for (let i = 1; i < pts.length; i++) { const [h0, z0] = pts[i - 1], [h1, z1] = pts[i]; for (const s of [-1, 1]) g.add(palo(V(s * h0, 0.47, z0), V(s * h1, 0.47, z1), 0.04, mMad, 5)); }
  for (const z of [-1.4, -0.3, 0.8]) g.add(caja(A * 0.8, 0.05, 0.28, mMad, 0, 0.18, z));
  for (const s of [-1, 1]) { const r = palo(V(s * 0.3, 0.3, -0.3), V(s * 1.9, -0.25, 0.4), 0.025, mMad); g.add(r); const p = caja(0.14, 0.02, 0.5, mMad, s * 1.95, -0.27, 0.42); p.rotation.y = s * 0.3; g.add(p); }
  return g;
};

/** tentáculos (la teoría del monstruo): salen del agua junto al barco */
const crearTentaculos = () => {
  const g = new THREE.Group(), m = lambert({ color: "#6a4a62", emissive: "#1e0e1a" }), mv = lambert({ color: "#c8a0b0" });
  const tent = (x: number, z: number, alto: number, giro: number, semilla: number) => {
    const t = new THREE.Group(); t.position.set(x, -0.5, z); t.rotation.y = giro; g.add(t);
    const c = new THREE.CatmullRomCurve3([V(0, 0, 0), V(0.3, alto * 0.35, 0.2), V(-0.2, alto * 0.7, 0.6 + rz(semilla)), V(0.5, alto, 1.4), V(1.2, alto * 0.92, 1.9)]);
    const geo = new THREE.TubeGeometry(c, 40, 0.75, 10, false); const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = Math.floor(i / 11) / 40, q = c.getPoint(k), r = 1 - k * 0.85; p.setXYZ(i, q.x + (p.getX(i) - q.x) * r, q.y + (p.getY(i) - q.y) * r, q.z + (p.getZ(i) - q.z) * r); }
    geo.computeVertexNormals(); t.add(new THREE.Mesh(geo, m));
    for (let k = 2; k < 14; k++) { const q = c.getPoint(k / 16); const v = new THREE.Mesh(new THREE.SphereGeometry(0.11 * (1 - k / 18), 8, 6), mv); v.position.set(q.x - 0.4 * (1 - k / 16), q.y, q.z); v.scale.z = 0.4; t.add(v); }
    return t;
  };
  return { g, tents: [tent(-5.2, 1, 7, 0.3, 1), tent(-4.6, 6, 5.5, -0.4, 2), tent(-5.6, -4, 6.2, 0.8, 3)] };
};

// ------------------------------------------------------------------ escenario
export function crearEscenario() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#9aa6b8", 0.6), hemi = new THREE.HemisphereLight("#b8c4d6", "#2a3238", 0.8);
  const sol = new THREE.DirectionalLight("#d8dce4", 1.4); sol.position.set(-40, 50, 30); sol.target.position.set(0, 0, 0);
  raiz.add(amb, hemi, sol, sol.target);
  const luzExtra = new THREE.PointLight("#ffc890", 0, 9, 1.6); raiz.add(luzExtra);
  const luzExtra2 = new THREE.PointLight("#ffc890", 0, 7, 1.6); raiz.add(luzExtra2);

  // ================================================================ afuera: cielo, mar, barcos
  const afuera = new THREE.Group(); raiz.add(afuera);
  const mCielo = new THREE.MeshBasicMaterial({ map: texCielo("#5a6676", "#a8b0ba"), side: THREE.BackSide, fog: false, depthWrite: false });
  const cielo = new THREE.Mesh(new THREE.SphereGeometry(480, 24, 16), mCielo); cielo.layers.set(NOINK); afuera.add(cielo);
  const cielos = { dia: texCielo("#5a6676", "#a8b0ba"), tarde: texCielo("#2e2a44", "#d89a6a"), noche: texCielo("#05080e", "#18243a") };
  const luna = new THREE.Group(); afuera.add(luna);
  const lunaDisco = new THREE.Mesh(new THREE.CircleGeometry(9, 32), brillo("#e8eefc")); lunaDisco.position.set(-120, 110, 330); lunaDisco.lookAt(0, 0, 0); lunaDisco.layers.set(NOINK); luna.add(lunaDisco);
  const lunaHalo = destello(190, 210, 255, 90, 0.45); lunaHalo.position.copy(lunaDisco.position); luna.add(lunaHalo);
  const aguas = { dia: texAgua("#4e5e68", "rgba(150,166,172,0.35)", "rgba(30,40,48,0.35)"), tarde: texAgua("#3a3c4a", "rgba(200,150,120,0.3)", "rgba(20,20,30,0.4)"), noche: texAgua("#0e1a24", "rgba(80,110,130,0.3)", "rgba(4,8,12,0.5)") };
  const mMar = lambert({ color: "#ffffff", map: aguas.dia, emissive: "#0a1418" });
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), mMar); mar.rotation.x = -Math.PI / 2; afuera.add(mar);
  const reflejo = new THREE.Mesh(new THREE.PlaneGeometry(30, 300), new THREE.MeshBasicMaterial({ map: lienzo((c, w, h) => { c.clearRect(0, 0, w, h); c.filter = "blur(3px)"; for (let k = 0; k < 60; k++) { const y = rz(k) * h, a = (1 - Math.abs(y / h - 0.5) * 2) * 0.6; const ww = w * (0.2 + rz(k + 3) * 0.6); c.fillStyle = `rgba(200,215,240,${a})`; c.fillRect(w / 2 - ww / 2, y, ww, 5); } }, 128, 512), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.5 }));
  reflejo.rotation.x = -Math.PI / 2; reflejo.layers.set(NOINK); afuera.add(reflejo);
  const mc = crearBarco("MARY CELESTE"); afuera.add(mc.g);
  const otro = crearBarco("DEI GRATIA"); otro.g.visible = false; afuera.add(otro.g);
  const pirata = crearBarco("", true); pirata.g.visible = false; afuera.add(pirata.g);
  pirata.g.traverse((o) => { const m = (o as THREE.Mesh).material as THREE.MeshLambertMaterial; if (m && m.map && m.side === THREE.DoubleSide && m.map.image && (m.map.image as HTMLCanvasElement).width === 512 && (m.map.image as HTMLCanvasElement).height === 512) { const n = m.clone(); n.color.set("#2a2a2e"); (o as THREE.Mesh).material = n; } });
  const bote = crearBote(); bote.visible = false; afuera.add(bote);
  const boteOtro = crearBote(); boteOtro.visible = false; afuera.add(boteOtro); // el del Dei Gratia (para subir a revisar)
  const cuerdaBote = new THREE.Group(); afuera.add(cuerdaBote); // cuerda del bote al barco (se arma en cada cuadro)
  const mCuerdaB = lambert({ color: "#b8a47a" });
  const tentaculos = crearTentaculos(); tentaculos.g.visible = false; afuera.add(tentaculos.g);
  const vapor: THREE.Sprite[] = []; // vapores que salen de la escotilla de proa (teoría del alcohol)
  for (let k = 0; k < 6; k++) { const v = destello(150, 200, 150, 2.5, 0); v.material.blending = THREE.NormalBlending; afuera.add(v); vapor.push(v); }
  // el puerto de Nueva York (atardecer): muelle, bodegas, faroles, barcos amarrados y la ciudad a lo lejos
  const puerto = new THREE.Group(); puerto.visible = false; afuera.add(puerto);
  {
    const mTab = lambert({ map: texCubierta() }), mPil = lambert({ color: "#3a3026" });
    puerto.add(caja(8, 0.3, 60, mTab, 8.2, 1.6, 0));
    for (let z = -28; z <= 28; z += 4) for (const x of [4.4, 12]) puerto.add(cil(0.2, 0.22, 3.2, mPil, x, 0.2, z, 9));
    for (let k = 0; k < 4; k++) { const b = caja(10, 7 + rz(k) * 3, 12, lambert({ map: texLadrillo(true) }), 19, 4 + rz(k) * 1.5, -24 + k * 14); puerto.add(b); puerto.add(caja(10.6, 0.4, 12.6, lambert({ color: "#2a2228" }), 19, 7.6 + rz(k) * 3, -24 + k * 14)); }
    for (let z = -20; z <= 20; z += 10) { puerto.add(cil(0.06, 0.08, 3.2, lambert({ color: "#1a1c1e" }), 11.5, 3.3, z, 8)); puerto.add(caja(0.35, 0.45, 0.35, brillo("#ffd8a0"), 11.5, 5.1, z)); const d = destello(255, 200, 130, 3.2, 0.7); d.position.set(11.5, 5.1, z); puerto.add(d); }
    for (const [x, z] of [[9, -6], [9.6, -5.4], [7, 8], [10, 14]]) puerto.add(caja(0.9, 0.8, 0.9, lambert({ color: "#7a5a3a" }), x, 2.15, z));
    const ciudad = new THREE.Mesh(new THREE.PlaneGeometry(320, 60), new THREE.MeshBasicMaterial({ map: texCiudad(), transparent: true, fog: false })); ciudad.position.set(120, 18, 40); ciudad.rotation.y = -Math.PI / 2; ciudad.layers.set(NOINK); puerto.add(ciudad);
    for (const [z, h] of [[-45, 16], [48, 18]]) { puerto.add(cil(0.2, 0.3, h, lambert({ color: "#2a2228" }), 3, h / 2, z, 8)); puerto.add(palo(V(-4, h * 0.6, z), V(4, h * 0.6, z), 0.1, lambert({ color: "#2a2228" }))); }
  }

  // ================================================================ el camarote del capitán
  const camarote = new THREE.Group(); camarote.position.set(CAMAROTE.x, 0, CAMAROTE.z); raiz.add(camarote);
  const CA = CAMAROTE, mPared = lambert({ map: texMadera("#8a6a48") }), mPiso = lambert({ map: texCubierta() }), mMueble = lambert({ color: "#6a4a30" }), mOscuro = lambert({ color: "#3a2a1c" }), mLaton = lambert({ color: "#b89a50" }), mTela = lambert({ color: "#6a3a34" });
  camarote.add(suelo(CA.x1 - CA.x0, CA.z1 - CA.z0, mPiso, 0, 0, 0));
  camarote.add(caja(CA.x1 - CA.x0, 0.06, CA.z1 - CA.z0, lambert({ color: "#5a4632" }), 0, CA.alto + 0.03, 0));
  for (let x = CA.x0 + 0.6; x < CA.x1; x += 0.8) camarote.add(caja(0.14, 0.14, CA.z1 - CA.z0, mOscuro, x, CA.alto - 0.07, 0)); // vigas del techo
  camarote.add(caja(0.08, CA.alto, CA.z1 - CA.z0, mPared, CA.x0 - 0.04, CA.alto / 2, 0), caja(0.08, CA.alto, CA.z1 - CA.z0, mPared, CA.x1 + 0.04, CA.alto / 2, 0));
  // pared de atrás (la popa) con dos ventanas de luz de día
  camarote.add(caja(CA.x1 - CA.x0, CA.alto, 0.08, mPared, 0, CA.alto / 2, CA.z0 - 0.04));
  for (const x of [-1.2, 1.9]) { camarote.add(caja(0.7, 0.5, 0.04, mOscuro, x, 1.6, CA.z0 + 0.01), caja(0.58, 0.38, 0.03, brillo("#b8c4cc"), x, 1.6, CA.z0 + 0.03)); camarote.add(caja(0.04, 0.38, 0.04, mOscuro, x, 1.6, CA.z0 + 0.05)); }
  // pared de enfrente con la puerta a la cubierta (gira hacia adentro)
  const PX = 1.4;
  camarote.add(caja(PX - 0.45 - CA.x0, CA.alto, 0.08, mPared, (CA.x0 + PX - 0.45) / 2, CA.alto / 2, CA.z1 + 0.04), caja(CA.x1 - PX - 0.45, CA.alto, 0.08, mPared, (CA.x1 + PX + 0.45) / 2, CA.alto / 2, CA.z1 + 0.04), caja(0.9, CA.alto - 1.85, 0.08, mPared, PX, (CA.alto + 1.85) / 2, CA.z1 + 0.04));
  const luzPuerta = caja(2.4, 2.2, 0.02, brillo("#c8d0d8"), PX, 1.1, CA.z1 + 1.1); camarote.add(luzPuerta); // la cubierta allá afuera (luz del día)
  const puertaCam = new THREE.Group(); puertaCam.position.set(PX - 0.45, 0, CA.z1); camarote.add(puertaCam);
  puertaCam.add(caja(0.88, 1.84, 0.05, lambert({ color: "#7a5a3c" }), 0.44, 0.92, -0.03), cil(0.03, 0.03, 0.05, mLaton, 0.78, 0.95, -0.08, 8).rotateX(Math.PI / 2));
  // mesa con patas, sillas, lámpara colgada
  const M = MESA;
  camarote.add(caja(M.largo, 0.05, M.ancho, mMueble, M.x, M.alto, M.z), caja(M.largo - 0.1, 0.06, M.ancho - 0.1, mOscuro, M.x, M.alto - 0.05, M.z));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) camarote.add(caja(0.06, M.alto, 0.06, mOscuro, M.x + dx * (M.largo / 2 - 0.08), M.alto / 2, M.z + dz * (M.ancho / 2 - 0.08)));
  camarote.add(caja(M.largo + 0.06, 0.04, 0.03, mOscuro, M.x, M.alto + 0.04, M.z + M.ancho / 2), caja(M.largo + 0.06, 0.04, 0.03, mOscuro, M.x, M.alto + 0.04, M.z - M.ancho / 2)); // pretil (para que no se caigan los platos)
  const silla = (x: number, z: number, giro: number) => { const s = new THREE.Group(); s.position.set(x, 0, z); s.rotation.y = giro; s.add(caja(0.42, 0.04, 0.42, mMueble, 0, 0.46, 0), caja(0.42, 0.5, 0.04, mMueble, 0, 0.73, -0.19)); for (const [a, b] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) s.add(caja(0.04, 0.46, 0.04, mOscuro, a * 0.18, 0.23, b * 0.18)); camarote.add(s); return s; };
  silla(M.x - 0.3, M.z - 0.65, 0); silla(M.x + 0.35, M.z + 0.68, Math.PI); silla(M.x + M.largo / 2 + 0.35, M.z, -Math.PI / 2);
  const lampara = new THREE.Group(); lampara.position.set(M.x, CA.alto, M.z); camarote.add(lampara);
  lampara.add(cil(0.006, 0.006, 0.5, mOscuro, 0, -0.25, 0, 4), cil(0.08, 0.12, 0.08, mLaton, 0, -0.52, 0, 12), cil(0.07, 0.07, 0.2, new THREE.MeshBasicMaterial({ color: "#ffe0a0", transparent: true, opacity: 0.6 }), 0, -0.66, 0, 12), cil(0.1, 0.1, 0.04, mLaton, 0, -0.78, 0, 12));
  const haloLamp = destello(255, 210, 140, 1.4, 0.5); haloLamp.position.set(0, -0.66, 0); lampara.add(haloLamp);
  const luzLamp = new THREE.PointLight("#ffc888", 2.5, 6, 1.6); luzLamp.position.set(0, -0.7, 0); lampara.add(luzLamp);
  // carta náutica y barómetro en la pared
  const carta = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.75), lambert({ map: texMapaMar() })); carta.position.set(CA.x1 - 0.01, 1.45, 0.4); carta.rotation.y = -Math.PI / 2; camarote.add(carta);
  camarote.add(cil(0.09, 0.09, 0.03, mLaton, CA.x1 - 0.03, 1.5, -0.7, 16).rotateZ(Math.PI / 2));
  // litera del capitán (cajón con cortina, cobija, almohada) y la espada debajo
  const L = LITERA;
  camarote.add(caja(0.85, 0.5, 1.9, mMueble, L.x, 0.25, L.z), caja(0.78, 0.14, 1.84, lambert({ color: "#d8d0bc" }), L.x + 0.02, 0.57, L.z), caja(0.8, 0.12, 1.2, lambert({ color: "#4a5a6a" }), L.x + 0.02, 0.67, L.z + 0.3), caja(0.5, 0.12, 0.35, lambert({ color: "#e8e0cc" }), L.x, 0.69, L.z - 0.7));
  camarote.add(caja(0.9, 0.08, 1.95, mOscuro, L.x, 1.75, L.z), caja(0.05, 1.3, 0.05, mOscuro, L.x + 0.42, 1.1, L.z - 0.95), caja(0.05, 1.3, 0.05, mOscuro, L.x + 0.42, 1.1, L.z + 0.95));
  camarote.add(caja(0.86, 0.08, 0.06, mOscuro, L.x, 0.75, L.z + 0.95), caja(0.86, 0.08, 0.06, mOscuro, L.x, 0.75, L.z - 0.95));
  const cortina = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 1.0), mTela); cortina.position.set(L.x + 0.44, 1.2, L.z - 0.6); cortina.rotation.y = Math.PI / 2; camarote.add(cortina);
  for (let k = 0; k < 2; k++) camarote.add(caja(0.7, 0.03, 0.85, mOscuro, L.x + 0.05, 0.12 + k * 0.2, L.z + (k ? 0.45 : -0.45)).translateX(0.42).translateX(-0.4)); // cajones (frente)
  const espada = new THREE.Group(); espada.position.set(L.x + 0.55, 0.035, L.z + 0.35); espada.rotation.y = 0.35; camarote.add(espada);
  { const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.015, 0.06), lambert({ map: texEspada() })); hoja.position.x = -0.2; espada.add(hoja); espada.add(caja(0.03, 0.03, 0.18, mLaton, 0.24, 0, 0), caja(0.16, 0.035, 0.035, lambert({ color: "#2a1e18" }), 0.33, 0, 0), new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 6), mLaton).translateX(0.42)); }
  // cama de la niña con barandal y su muñeca; juguetes en el piso
  const cama = new THREE.Group(); cama.position.set(-1.0, 0, -1.45); camarote.add(cama);
  cama.add(caja(1.1, 0.3, 0.6, mMueble, 0, 0.2, 0), caja(1.04, 0.08, 0.54, lambert({ color: "#e0d8c4" }), 0, 0.38, 0), caja(0.7, 0.07, 0.56, lambert({ color: "#a8606a" }), 0.15, 0.44, 0));
  for (let k = 0; k <= 8; k++) cama.add(caja(0.03, 0.32, 0.03, mOscuro, -0.52 + k * 0.13, 0.55, 0.29)); cama.add(caja(1.1, 0.04, 0.04, mOscuro, 0, 0.72, 0.29));
  const muneca = new THREE.Group(); muneca.position.set(-0.3, 0.45, 0.05); muneca.scale.setScalar(1.6); cama.add(muneca);
  muneca.add(new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 10), lambert({ color: "#f0d8c0" })).translateY(0.2), caja(0.14, 0.18, 0.09, lambert({ color: "#3a6aa0" }), 0, 0.08, 0), new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 8, 0, Math.PI * 2, 0, 1.6), lambert({ color: "#e0b040" })).translateY(0.21));
  muneca.rotation.z = -0.4;
  const caballito = new THREE.Group(); caballito.position.set(-0.2, 0, -0.55); camarote.add(caballito); // caballito de madera con ruedas
  caballito.add(caja(0.3, 0.12, 0.1, lambert({ color: "#c89a5a" }), 0, 0.17, 0), caja(0.07, 0.14, 0.07, lambert({ color: "#c89a5a" }), 0.15, 0.27, 0), caja(0.12, 0.07, 0.07, lambert({ color: "#c89a5a" }), 0.2, 0.33, 0), caja(0.34, 0.02, 0.14, mOscuro, 0, 0.06, 0));
  for (const [x, z] of [[-0.12, -0.07], [0.12, -0.07], [-0.12, 0.07], [0.12, 0.07]]) caballito.add(cil(0.035, 0.035, 0.02, lambert({ color: "#a03a2a" }), x, 0.035, z, 10).rotateX(Math.PI / 2));
  for (let k = 0; k < 3; k++) camarote.add(caja(0.08, 0.08, 0.08, lambert({ color: ["#c84a3a", "#3a7ac8", "#e0b040"][k] }), 0.15 + k * 0.12, 0.04 + (k === 2 ? 0.08 : 0), -0.75 + (k === 2 ? -0.06 : 0)));
  // máquina de coser de pedal (de la señora Briggs)
  const coser = new THREE.Group(); coser.position.set(CA.x1 - 0.35, 0, -1.05); coser.rotation.y = -Math.PI / 2; camarote.add(coser);
  coser.add(caja(0.8, 0.04, 0.45, mMueble, 0, 0.74, 0));
  for (const s of [-1, 1]) { coser.add(caja(0.05, 0.72, 0.4, lambert({ color: "#1e1e22" }), s * 0.34, 0.36, 0)); }
  coser.add(caja(0.6, 0.04, 0.3, lambert({ color: "#1e1e22" }), 0, 0.1, 0)); // pedal
  const mNegro = lambert({ color: "#141418" }), mOro = lambert({ color: "#c8a040" });
  coser.add(caja(0.42, 0.06, 0.18, mNegro, 0, 0.79, 0), caja(0.08, 0.22, 0.12, mNegro, 0.17, 0.91, 0), caja(0.4, 0.07, 0.11, mNegro, 0.0, 1.02, 0), caja(0.06, 0.12, 0.08, mNegro, -0.18, 0.94, 0));
  coser.add(cil(0.012, 0.012, 0.08, lambert({ color: "#c8c8c8" }), -0.18, 0.84, 0, 6), caja(0.3, 0.012, 0.115, mOro, 0.0, 1.0, 0.0));
  coser.add(cil(0.07, 0.07, 0.03, mLaton, 0.24, 0.98, 0, 16).rotateX(Math.PI / 2).translateY(0)); // volante
  coser.add(cil(0.02, 0.02, 0.05, lambert({ color: "#e0dccc" }), 0.05, 1.08, 0, 8)); // carrete de hilo
  // escritorio con casilleros (vacíos), caja del sextante (abierta, vacía), caja del cronómetro (vacía) y la pizarra
  const esc = new THREE.Group(); esc.position.set(CA.x0 + 0.01 + ESCRITORIO.x + 2.4, 0, ESCRITORIO.z); camarote.add(esc);
  esc.add(caja(1.2, 0.05, 0.6, mMueble, 0, ESCRITORIO.alto, 0));
  for (const s of [-1, 1]) esc.add(caja(0.3, ESCRITORIO.alto, 0.56, mOscuro, s * 0.44, ESCRITORIO.alto / 2, 0));
  esc.add(caja(1.2, 0.6, 0.06, mOscuro, 0, ESCRITORIO.alto + 0.33, -0.27));
  for (let r = 0; r < 2; r++) for (let k = 0; k < 5; k++) { esc.add(caja(0.2, 0.24, 0.24, mMueble, -0.46 + k * 0.23, ESCRITORIO.alto + 0.18 + r * 0.27, -0.14)); esc.add(caja(0.17, 0.2, 0.02, brillo("#140e0a"), -0.46 + k * 0.23, ESCRITORIO.alto + 0.18 + r * 0.27, -0.015)); }
  const cajaSext = new THREE.Group(); cajaSext.position.set(-0.25, ESCRITORIO.alto + 0.03, 0.12); esc.add(cajaSext);
  cajaSext.add(caja(0.36, 0.1, 0.3, mMueble, 0, 0.05, 0), caja(0.31, 0.02, 0.25, lambert({ color: "#3a1a3a" }), 0, 0.09, 0));
  const hueca = new THREE.Mesh(new THREE.CircleGeometry(0.1, 3, 0.4, 1.0), lambert({ color: "#1e0c1e" })); hueca.rotation.x = -Math.PI / 2; hueca.position.set(0, 0.105, 0); cajaSext.add(hueca); // la forma del sextante, sin sextante
  const tapaS = caja(0.36, 0.03, 0.3, mMueble, 0, 0.25, -0.17); tapaS.rotation.x = -1.3; cajaSext.add(tapaS);
  const cajaCrono = new THREE.Group(); cajaCrono.position.set(0.25, ESCRITORIO.alto + 0.03, 0.12); esc.add(cajaCrono);
  cajaCrono.add(caja(0.22, 0.14, 0.22, mMueble, 0, 0.07, 0), cil(0.07, 0.07, 0.02, lambert({ color: "#1e0c1e" }), 0, 0.14, 0, 16));
  const pizarra = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.23), lambert({ map: texPizarra() })); pizarra.rotation.x = -Math.PI / 2 + 0.25; pizarra.position.set(0.0, ESCRITORIO.alto + 0.05, 0.18); esc.add(pizarra);
  esc.add(caja(0.012, 0.012, 0.16, lambert({ color: "#d8d8d0" }), 0.24, ESCRITORIO.alto + 0.035, 0.26));
  // el desayuno de la leyenda (se prende solo en esa toma): platos, tazas con vapor, pan, tetera
  const desayuno = new THREE.Group(); desayuno.position.set(M.x, M.alto + 0.025, M.z); camarote.add(desayuno); desayuno.visible = false;
  const mPlato = lambert({ color: "#e8e4dc" }), vaporD: THREE.Sprite[] = [];
  for (const [x, z] of [[-0.35, -0.2], [0.35, 0.2], [0.45, -0.2]]) {
    desayuno.add(cil(0.12, 0.1, 0.02, mPlato, x, 0.01, z, 18), caja(0.1, 0.03, 0.05, lambert({ color: "#c8902a" }), x - 0.02, 0.035, z), new THREE.Mesh(new THREE.SphereGeometry(0.04, 10, 6, 0, 6.3, 0, 1.6), lambert({ color: "#f0e0a0" })).translateX(x + 0.04).translateY(0.02).translateZ(z));
    desayuno.add(cil(0.04, 0.035, 0.07, mPlato, x + 0.16, 0.035, z + 0.1, 12), cil(0.035, 0.035, 0.005, lambert({ color: "#4a2a14" }), x + 0.16, 0.068, z + 0.1, 12));
    const v = destello(230, 230, 230, 0.22, 0.35); v.material.blending = THREE.NormalBlending; v.position.set(x + 0.16, 0.18, z + 0.1); desayuno.add(v); vaporD.push(v);
  }
  desayuno.add(cil(0.08, 0.1, 0.16, lambert({ color: "#e8e4dc" }), 0, 0.08, 0.05, 14), cil(0.02, 0.02, 0.1, mPlato, 0.11, 0.1, 0.05, 6).rotateZ(-0.8));
  desayuno.add(caja(0.26, 0.08, 0.12, lambert({ color: "#b8803a" }), -0.05, 0.04, -0.28));

  // ================================================================ el rancho de los marineros
  const rancho = new THREE.Group(); rancho.position.set(RANCHO.x, 0, RANCHO.z); raiz.add(rancho);
  const R = RANCHO, mParedR = lambert({ map: texMadera("#7a6a54", "rgba(30,24,16,0.3)") });
  rancho.add(suelo(R.x1 - R.x0, R.z1 - R.z0, mPiso, 0, 0, 0), caja(R.x1 - R.x0, 0.06, R.z1 - R.z0, lambert({ color: "#4a3a2a" }), 0, R.alto + 0.03, 0));
  for (let z = R.z0 + 0.5; z < R.z1; z += 0.9) rancho.add(caja(R.x1 - R.x0, 0.12, 0.12, mOscuro, 0, R.alto - 0.06, z));
  rancho.add(caja(0.08, R.alto, R.z1 - R.z0, mParedR, R.x0 - 0.04, R.alto / 2, 0), caja(0.08, R.alto, R.z1 - R.z0, mParedR, R.x1 + 0.04, R.alto / 2, 0), caja(R.x1 - R.x0, R.alto, 0.08, mParedR, 0, R.alto / 2, R.z0 - 0.04), caja(R.x1 - R.x0, R.alto, 0.08, mParedR, 0, R.alto / 2, R.z1 + 0.04));
  for (const s of [-1, 1]) for (let k = 0; k < 2; k++) for (const y of [0.35, 1.15]) { // literas de dos pisos
    const x = s * (R.x1 - 0.42), z = -1.0 + k * 1.95;
    rancho.add(caja(0.8, 0.06, 1.85, mMueble, x, y, z), caja(0.72, 0.1, 1.75, lambert({ color: ["#8a8070", "#6a7080", "#7a6a5a"][(k + (y > 1 ? 1 : 0)) % 3] }), x, y + 0.08, z), caja(0.06, 0.25, 1.85, mOscuro, x - s * 0.4, y + 0.1, z));
    rancho.add(caja(0.42, 0.1, 0.3, lambert({ color: "#d8d0bc" }), x, y + 0.17, z - 0.7));
  }
  for (const s of [-1, 1]) for (const z of [-1.95, 0.0, 1.95]) rancho.add(caja(0.06, R.alto, 0.06, mOscuro, s * (R.x1 - 0.82), R.alto / 2, z));
  // baúles de marinero (con su tapa curva y herrajes)
  for (const [x, z, c] of [[-0.95, -1.6, "#4a5a6a"], [0.95, -1.5, "#6a4a3a"], [-0.95, 1.6, "#5a5a3a"], [0.9, 0.5, "#3a4a5a"]] as [number, number, string][]) {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.rotation.y = x > 0 ? Math.PI / 2 : -Math.PI / 2; rancho.add(b);
    b.add(caja(0.75, 0.38, 0.42, lambert({ color: c }), 0, 0.19, 0)); const tp = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.75, 12, 1, false, 0, Math.PI), lambert({ color: c })); tp.rotation.z = Math.PI / 2; tp.position.y = 0.38; b.add(tp);
    for (const xx of [-0.25, 0.25]) b.add(caja(0.05, 0.4, 0.44, mFierroR(), xx, 0.2, 0));
  }
  // ropa colgada de ganchos, impermeables y botas
  const ganchos: [number, number, string, number][] = [[-1.3, R.z1 - 0.06, "#c8c0a8", 0], [-0.75, R.z1 - 0.06, "#3a4a6a", 0], [0.5, R.z1 - 0.06, "#c8a030", 1], [1.05, R.z1 - 0.06, "#8a3a2a", 0]];
  for (const [x, z, c, t] of ganchos) { const r = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.75), new THREE.MeshLambertMaterial({ map: texRopa(c, t), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); r.position.set(x, 1.3, z); r.rotation.y = Math.PI; rancho.add(r); rancho.add(cil(0.015, 0.015, 0.08, mOscuro, x, 1.68, z + 0.02, 5).rotateX(Math.PI / 2)); }
  for (const [x, z] of [[-0.3, 1.9], [-0.12, 1.88]]) { rancho.add(caja(0.1, 0.32, 0.12, lambert({ color: "#1e1e1e" }), x, 0.16, z), caja(0.1, 0.06, 0.24, lambert({ color: "#1e1e1e" }), x, 0.03, z - 0.06)); }
  // repisa con las pipas, la bolsa de tabaco y una taza
  rancho.add(caja(1.0, 0.04, 0.2, mMueble, 0.0, 1.45, R.z0 + 0.1), caja(1.0, 0.18, 0.03, mOscuro, 0.0, 1.38, R.z0 + 0.02));
  const pipa = (x: number, giro: number) => { const p = new THREE.Group(); p.position.set(x, 1.49, R.z0 + 0.12); p.rotation.y = giro; p.add(cil(0.038, 0.03, 0.08, lambert({ color: "#6a3e20" }), 0, 0.04, 0, 12), cil(0.03, 0.03, 0.005, lambert({ color: "#1a1008" }), 0, 0.081, 0, 12), palo(V(0.03, 0.015, 0), V(0.24, 0.05, 0), 0.014, lambert({ color: "#2a1a10" }), 6)); rancho.add(p); };
  pipa(-0.42, 0.1); pipa(-0.12, -0.12); pipa(0.12, 0.15);
  rancho.add(new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), lambert({ color: "#8a6a40" })).translateX(0.32).translateY(1.51).translateZ(R.z0 + 0.12), cil(0.04, 0.035, 0.08, lambert({ color: "#d8d4c8" }), 0.42, 1.51, R.z0 + 0.12, 10));
  const farolR = new THREE.Group(); farolR.position.set(0, R.alto - 0.15, 0.2); rancho.add(farolR);
  farolR.add(caja(0.14, 0.2, 0.14, lambert({ color: "#2a2a2a" }), 0, -0.25, 0), caja(0.1, 0.14, 0.1, brillo("#ffd090"), 0, -0.25, 0));
  const haloR = destello(255, 200, 130, 1.0, 0.45); haloR.position.set(0, -0.25, 0); farolR.add(haloR);
  const luzR = new THREE.PointLight("#ffc080", 1.6, 5, 1.6); luzR.position.set(0, -0.3, 0); farolR.add(luzR);
  // escalera a la escotilla, con luz que baja
  for (let k = 0; k < 6; k++) rancho.add(caja(0.6, 0.04, 0.14, mMueble, -0.2, 0.25 + k * 0.3, R.z1 - 0.5 - k * 0.04));
  const rayo = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.0), new THREE.MeshBasicMaterial({ map: lienzo((c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(220,228,236,0.45)"); gr.addColorStop(1, "rgba(220,228,236,0)"); c.fillStyle = gr; c.fillRect(0, 0, w, h); }, 16, 64), transparent: true, depthWrite: false, toneMapped: false })); rayo.position.set(-0.2, 1.0, R.z1 - 0.7); rayo.layers.set(NOINK); void rayo;

  // ================================================================ la bodega: barriles, agua, víveres
  const bodega = new THREE.Group(); bodega.position.set(BODEGA.x, 0, BODEGA.z); raiz.add(bodega);
  const BO = BODEGA, mParedB = lambert({ map: texMadera("#5a4a38", "rgba(20,14,8,0.35)"), side: THREE.DoubleSide });
  bodega.add(suelo(BO.x1 - BO.x0, BO.z1 - BO.z0, lambert({ color: "#3a2e22" }), 0, 0, 0));
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(BO.z1 - BO.z0, BO.alto + 0.4), mParedB); p.position.set(s * (BO.x1 - 0.2), BO.alto / 2, 0); p.rotation.set(0, -s * Math.PI / 2, -s * 0.0); p.rotateX(s * 0.18); bodega.add(p); }
  bodega.add(caja(BO.x1 - BO.x0, 0.08, BO.z1 - BO.z0, lambert({ color: "#4a3a2a" }), 0, BO.alto + 0.04, 0), caja(BO.x1 - BO.x0, BO.alto, 0.08, mParedB, 0, BO.alto / 2, BO.z0), caja(BO.x1 - BO.x0, BO.alto, 0.08, mParedB, 0, BO.alto / 2, BO.z1));
  for (let z = BO.z0 + 0.6; z < BO.z1; z += 1.1) { for (const s of [-1, 1]) bodega.add(palo(V(s * (BO.x1 - 0.35), 0.0, z), V(s * (BO.x1 - 0.05), BO.alto, z), 0.08, mOscuro, 6)); bodega.add(caja(BO.x1 - BO.x0, 0.14, 0.14, mOscuro, 0, BO.alto - 0.07, z)); } // costillas y baos
  bodega.add(caja(0.35, BO.alto, 0.35, mOscuro, 0, BO.alto / 2, 1.0)); // el palo atraviesa la bodega
  // barriles de alcohol acostados en dos pisos, a los lados
  const barriles = new THREE.Group(); bodega.add(barriles);
  const mBarrilB = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#7a4a2c"; c.fillRect(0, 0, w, h); for (let k = 0; k < 10; k++) { c.fillStyle = k % 2 ? "rgba(40,20,10,0.25)" : "rgba(170,110,70,0.15)"; c.fillRect(k * w / 10, 0, w / 10, h); } c.fillStyle = "#2e2a26"; for (const y of [0.12, 0.3, 0.7, 0.88]) c.fillRect(0, y * h - 5, w, 10); }, 256, 128) });
  const mTapaB = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#8a5a34"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(40,20,10,0.4)"; c.lineWidth = 3; for (let k = 1; k < 5; k++) { c.beginPath(); c.moveTo(k * w / 5, 0); c.lineTo(k * w / 5, h); c.stroke(); } c.fillStyle = "#2a1e14"; c.font = "bold 22px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("ALCOHOL", w / 2, h / 2 + 8); }, 128, 128) });
  const barrilB = (x: number, y: number, z: number) => { const gr = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 14), [mBarrilB, mTapaB, mTapaB]); const ba = new THREE.Mesh(new THREE.SphereGeometry(0.335, 14, 8), mBarrilB); ba.scale.y = 1.12; gr.add(ba, b); gr.position.set(x, y, z); gr.rotation.set(0, 0, Math.PI / 2); return gr; };
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) for (let k = 0; k < 11; k++) { const z = BO.z0 + 0.8 + k * 0.72 + r * 0.36; if (z > BO.z1 - 0.5) continue; for (let c2 = 0; c2 < 2; c2++) barriles.add(barrilB(s * (BO.x1 - 0.75 - c2 * 0.9 - r * 0.15), 0.35 + r * 0.62, z)); }
  // los nueve vacíos: parados al frente, sin tapa (uno volcado)
  const vacios = new THREE.Group(); bodega.add(vacios);
  const mDentro = lambert({ color: "#1a120c", side: THREE.BackSide });
  for (let k = 0; k < 9; k++) {
    const x = -1.0 + (k % 3) * 0.7, z = BO.z1 - 1.4 - Math.floor(k / 3) * 0.7, gr = new THREE.Group(); gr.position.set(x, 0.45, z); vacios.add(gr);
    gr.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 14, 1, true), lambert({ map: mBarrilB.map, side: THREE.DoubleSide })), new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.88, 14, 1, true), mDentro));
    if (k === 7) { gr.rotation.z = Math.PI / 2; gr.position.y = 0.3; }
  }
  for (const [x, z] of [[-1.5, BO.z1 - 0.6], [0.8, BO.z1 - 0.7]]) { const t = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.29, 0.04, 14), mTapaB); t.position.set(x, 0.02, z); t.rotation.z = 0.05; bodega.add(t); }
  // víveres (atrás): costales, barricas de agua, cajas de provisiones, jamones colgados
  const viveres = new THREE.Group(); viveres.position.set(0, 0, BO.z0 + 1.3); bodega.add(viveres);
  for (let k = 0; k < 6; k++) { const s2 = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), lambert({ color: "#c8b890" })); s2.scale.set(1, 0.65 + rz(k) * 0.15, 0.75); s2.position.set(-1.2 + (k % 3) * 0.55, 0.2 + Math.floor(k / 3) * 0.36, -0.2 + rz(k + 3) * 0.2); viveres.add(s2); }
  const mAgua = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#6a5a40"; c.fillRect(0, 0, w, h); c.fillStyle = "#2a2a2a"; for (const y of [0.15, 0.85]) c.fillRect(0, y * h - 6, w, 12); c.fillStyle = "#e8e0cc"; c.font = "bold 40px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("AGUA", w / 2, h / 2 + 14); }, 256, 128) });
  for (const x of [0.6, 1.25]) viveres.add(cil(0.32, 0.32, 1.0, mAgua, x, 0.5, -0.1, 16));
  const mCajaP = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#9a7a4a"; c.fillRect(0, 0, w, h); c.strokeStyle = "rgba(50,34,18,0.6)"; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = "#2a1e12"; c.font = "bold 26px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("PROVISIONES", w / 2, h / 2 + 8); }, 256, 128) });
  for (const [x, y] of [[-0.6, 0.25], [-0.6, 0.75], [0.0, 0.25]]) viveres.add(caja(0.55, 0.5, 0.45, mCajaP, x, y, 0.55));
  for (const x of [-0.9, -0.5, 0.2]) { viveres.add(cil(0.006, 0.006, 0.4, mOscuro, x, BO.alto - 0.2, 0.2, 4)); const j = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), lambert({ color: "#8a4a2a" })); j.scale.set(0.8, 1.4, 0.8); j.position.set(x, BO.alto - 0.55, 0.2); viveres.add(j); }
  // el agua que entró (casi un metro): plano transparente que sube y baja
  const aguaB = new THREE.Mesh(new THREE.PlaneGeometry(BO.x1 - BO.x0 - 0.3, BO.z1 - BO.z0 - 0.2), new THREE.MeshLambertMaterial({ color: "#4a7a82", transparent: true, opacity: 0.62, emissive: "#0e2226", depthWrite: false }));
  aguaB.rotation.x = -Math.PI / 2; aguaB.position.y = 0.72; aguaB.visible = false; bodega.add(aguaB);
  const farolB = new THREE.Group(); farolB.position.set(0.6, BO.alto - 0.1, 2.2); bodega.add(farolB);
  farolB.add(cil(0.006, 0.006, 0.3, mOscuro, 0, -0.15, 0, 4), caja(0.15, 0.22, 0.15, lambert({ color: "#2a2a2a" }), 0, -0.4, 0), caja(0.1, 0.15, 0.1, brillo("#ffd090"), 0, -0.4, 0));
  const haloB = destello(255, 200, 130, 1.2, 0.45); haloB.position.set(0, -0.4, 0); farolB.add(haloB);
  const luzB = new THREE.PointLight("#ffc080", 2.2, 7, 1.5); luzB.position.set(0, -0.45, 0); farolB.add(luzB);
  for (let k = 0; k < 7; k++) bodega.add(caja(0.6, 0.04, 0.14, mMueble, -1.9, 0.2 + k * 0.36, BO.z0 + 2.6 + k * 0.05)); // escalera
  
  const vapB: THREE.Sprite[] = []; // vapores (teoría): verdosos, suben de los barriles
  for (let k = 0; k < 8; k++) { const v = destello(160, 210, 160, 1.4, 0); v.material.blending = THREE.NormalBlending; bodega.add(v); vapB.push(v); }

  // ================================================================ el estudio del escritor (1884)
  const estudio = new THREE.Group(); estudio.position.set(ESTUDIO.x, 0, ESTUDIO.z); raiz.add(estudio);
  const ES = ESTUDIO, mPapel = lambert({ map: lienzo((c, w, h) => { c.fillStyle = "#5a3a3a"; c.fillRect(0, 0, w, h); c.fillStyle = "rgba(200,160,100,0.18)"; for (let x = 0; x < w; x += 32) for (let y = 0; y < h; y += 32) { c.beginPath(); c.arc(x + 16, y + 16, 5, 0, 7); c.fill(); } manchas(c, w, h, 10, "20,10,10", 0.3); }, 256, 256, [3, 2]) });
  estudio.add(suelo(ES.x1 - ES.x0, ES.z1 - ES.z0, lambert({ map: texMadera("#5a3a24") }), 0, 0, 0), caja(ES.x1 - ES.x0, 0.06, ES.z1 - ES.z0, lambert({ color: "#d8d0c0" }), 0, ES.alto, 0));
  estudio.add(caja(ES.x1 - ES.x0, ES.alto, 0.08, mPapel, 0, ES.alto / 2, ES.z0), caja(0.08, ES.alto, ES.z1 - ES.z0, mPapel, ES.x0, ES.alto / 2, 0), caja(0.08, ES.alto, ES.z1 - ES.z0, mPapel, ES.x1, ES.alto / 2, 0));
  estudio.add(caja(ES.x1 - ES.x0, 0.9, 0.1, lambert({ color: "#3a2418" }), 0, 0.45, ES.z0 + 0.05)); // lambrín
  const libros = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.9), lambert({ map: texLibros() })); libros.position.set(ES.x0 + 0.06, 1.25, 0.3); libros.rotation.y = Math.PI / 2; estudio.add(libros);
  estudio.add(caja(0.35, 2.1, 1.7, lambert({ color: "#2a1a10" }), ES.x0 + 0.2, 1.05, 0.3).translateX(-0.12));
  // ventana con la noche y su cortina
  estudio.add(caja(1.0, 1.3, 0.04, lambert({ color: "#3a2418" }), 1.2, 1.6, ES.z0 + 0.06), caja(0.86, 1.16, 0.02, brillo("#1a2638"), 1.2, 1.6, ES.z0 + 0.09), caja(0.04, 1.16, 0.03, lambert({ color: "#3a2418" }), 1.2, 1.6, ES.z0 + 0.11), caja(0.86, 0.04, 0.03, lambert({ color: "#3a2418" }), 1.2, 1.6, ES.z0 + 0.11));
  estudio.add(caja(0.3, 1.5, 0.06, lambert({ color: "#6a2a2a" }), 0.55, 1.55, ES.z0 + 0.14));
  // escritorio, papeles, tintero con pluma, lámpara de aceite, libros apilados, silla
  const escE = new THREE.Group(); escE.position.set(0.2, 0, -0.9); estudio.add(escE);
  escE.add(caja(1.5, 0.06, 0.75, lambert({ color: "#4a2a18" }), 0, 0.76, 0), caja(0.4, 0.73, 0.7, lambert({ color: "#3a2010" }), -0.52, 0.365, 0), caja(0.4, 0.73, 0.7, lambert({ color: "#3a2010" }), 0.52, 0.365, 0));
  escE.add(caja(1.2, 0.005, 0.5, lambert({ color: "#3a5a3a" }), 0, 0.792, 0.02)); // cuero verde
  for (let k = 0; k < 4; k++) { const p = caja(0.22, 0.004, 0.3, lambert({ color: "#e8e0cc" }), -0.15 + k * 0.08, 0.796 + k * 0.003, 0.08 + rz(k) * 0.05); p.rotation.y = (rz(k + 4) - 0.5) * 0.5; escE.add(p); }
  escE.add(cil(0.04, 0.045, 0.05, lambert({ color: "#1a1a2a" }), 0.32, 0.82, -0.12, 12), palo(V(0.32, 0.84, -0.12), V(0.38, 1.02, -0.05), 0.006, lambert({ color: "#e8e4d8" }), 5));
  const lampE = new THREE.Group(); lampE.position.set(-0.5, 0.79, -0.15); escE.add(lampE);
  lampE.add(cil(0.08, 0.1, 0.04, lambert({ color: "#b89a50" }), 0, 0.02, 0, 14), cil(0.025, 0.04, 0.22, lambert({ color: "#b89a50" }), 0, 0.15, 0, 10), new THREE.Mesh(new THREE.SphereGeometry(0.09, 14, 10), lambert({ color: "#3a6a4a", transparent: true, opacity: 0.9 })).translateY(0.3), cil(0.035, 0.045, 0.16, new THREE.MeshBasicMaterial({ color: "#ffe8b0", transparent: true, opacity: 0.6 }), 0, 0.44, 0, 12));
  const haloE = destello(255, 210, 140, 1.4, 0.55); haloE.position.set(0, 0.38, 0); lampE.add(haloE);
  const luzE = new THREE.PointLight("#ffc888", 2.6, 6, 1.5); luzE.position.set(0, 0.45, 0.2); lampE.add(luzE);
  for (let k = 0; k < 3; k++) escE.add(caja(0.28, 0.06, 0.2, lambert({ color: ["#6a2a22", "#2a3a5a", "#3a5a3a"][k] }), 0.55, 0.82 + k * 0.06, -0.2).rotateY(k * 0.2));

  /** animación de fondo (agua, velas, lámparas) */
  const animar = (t: number, viento: number) => {
    for (const a of Object.values(aguas)) { a.offset.set(t * 0.004, t * 0.011); }
    mc.ondear(t, viento); if (otro.g.visible) otro.ondear(t + 3, viento * 0.8); if (pirata.g.visible) pirata.ondear(t + 5, viento * 0.8);
    lampara.rotation.z = 0.1 * Math.sin(t * 1.3); lampara.rotation.x = 0.05 * Math.sin(t * 0.9 + 1);
    farolR.rotation.z = 0.08 * Math.sin(t * 1.1 + 2); farolB.rotation.z = 0.07 * Math.sin(t * 1.2);
    vaporD.forEach((v, k) => { v.position.y = 0.16 + 0.04 * Math.sin(t * 2 + k); v.material.opacity = 0.25 + 0.1 * Math.sin(t * 3 + k * 2); });
  };
  return {
    raiz, amb, hemi, sol, luzExtra, luzExtra2, afuera, cielo, mCielo, cielos, luna, mMar, aguas, reflejo, mar, mc, otro, pirata, bote, boteOtro, cuerdaBote, mCuerdaB, tentaculos, vapor, puerto,
    camarote, puertaCam, luzPuerta, lampara, luzLamp, desayuno, espada, cajaSext, cajaCrono, pizarra, rancho, luzR, bodega, aguaB, vacios, luzB, vapB, estudio, luzE, animar, palo,
  };
}
function mFierroR() { return lambert({ color: "#2a2c30" }); }
