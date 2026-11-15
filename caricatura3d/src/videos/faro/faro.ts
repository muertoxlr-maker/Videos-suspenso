// Escenario de «El faro» (zombies). Un solo mundo de noche:
//  · el muelle de pescadores de San Telmo (tablones sobre pilotes, bitas con cuerda, cajas, redes, faroles, bodegas con
//    letrero y lanchas amarradas) y la lancha de don Chema con su motor fuera de borda, remos, tanque y bancas;
//  · el mar (agua que se mueve, reflejo de la luna, espuma detrás de la lancha);
//  · la isla de rocas con su escalera de piedra, la casita del farero y el faro (blanco con franjas rojas, puerta que
//    se abre hacia adentro, ventanitas, balcón con barandal y el cuarto de la lámpara con vidrios y cúpula);
//  · el faro por dentro: escalera de caracol pegada a la pared, la pared con las tres reglas pintadas, la tranca de la
//    puerta, y arriba el cuarto de la lámpara (lente grande que gira con sus dos haces de luz, ventanas alrededor).
// Acabado §8.9; §8.6c (capas ≥ 5 mm, la puerta se abre, nada se atraviesa) y §8.6d (cada cosa con sus piezas).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { cartel } from "../comun/utileria";
import { huacal, lampara, manchas, poste, texConcreto } from "../ambulancia/ambulancia";

export const MUELLE = { x: 1.4, piso: 1.1, z0: -27, z1: 0 }; // tablones: x ∈ [−1.4, 1.4], de z0 a z1 (la punta)
export const LANCHA0 = { x: 2.45, z: -4.2 }; // la lancha amarrada junto a la punta del muelle (proa hacia +z)
export const LAN = { largo: 5.2, ancho: 1.7, borda: 0.62, piso: 0.12, popa: -2.35, proa: 2.6 }; // lancha (coordenadas propias; piso = 0.12)
export const ISLA = { x: 0, z: 72, alto: 3 }; // centro del faro; meseta de roca a y = 3
export const TORRE = { r0: 2.6, r1: 1.95, alto: 16, rIn: 0.25 }; // radio afuera abajo/arriba; la pared mide 0.25
export const CUARTO = { y: ISLA.alto + 16, r: 2.6, pretil: 0.95, vidrio: 2.3, lente: 1.9 }; // la lente va arriba de las cabezas (no tapa a nadie) // cuarto de la lámpara
export const CHOQUE = { x: 2.2, z: 58.6 }; // donde la lancha pega con las rocas
export const PUERTA_F = { ancho: 0.95, alto: 1.95 }; // la puerta del faro (en −z)
export const REGLAS = { th: 0, ancho: 1.7, y0: 0.45, alto: 3.6 }; // panel de reglas (ángulo, ancho, de qué altura, alto)
export const ESC_F = { th0: 0.5, paso: 0.25, sube: 0.205, r0: 1.18 }; // escalera: empieza en θ0, sube `sube` cada `paso` rad

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
/** punto de la pared del faro (por dentro) a un ángulo θ (θ = 0 → +z, θ = π/2 → +x), a la altura y sobre la meseta */
export const enPared = (th: number, r: number, y: number): [number, number, number] => [ISLA.x + r * Math.sin(th), ISLA.alto + y, ISLA.z + r * Math.cos(th)];

// ------------------------------------------------------------------ texturas
const texAgua = () => lienzo((c, w, h) => {
  c.fillStyle = "#16303a"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 160; k++) { // crestas: rayitas claras y sombras de ola
    const x = rz(k) * w, y = rz(k + 300) * h, l = 20 + rz(k + 7) * 60;
    c.strokeStyle = k % 3 ? "rgba(70,120,130,0.45)" : "rgba(8,20,26,0.6)"; c.lineWidth = 2 + rz(k + 3) * 3;
    c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y - 5, x + l, y); c.stroke();
  }
}, 512, 512, [60, 60]);
const texTablones = () => lienzo((c, w, h) => { // tablones gastados con clavos y huecos
  c.fillStyle = "#6a5440"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) {
    c.fillStyle = ["#6e5642", "#5e4a38", "#76604a", "#624e3c"][i % 4]; c.fillRect(i * w / 8 + 2, 0, w / 8 - 4, h);
    c.fillStyle = "rgba(20,14,8,0.8)"; c.fillRect(i * w / 8, 0, 4, h);
    c.fillStyle = "#2a2622"; for (const y of [h * 0.1, h * 0.6]) { c.fillRect(i * w / 8 + 10, y, 5, 5); c.fillRect(i * w / 8 + w / 8 - 15, y, 5, 5); }
    c.strokeStyle = "rgba(40,28,18,0.4)"; c.lineWidth = 1.5; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(i * w / 8 + 8 + k * 7, 0); c.lineTo(i * w / 8 + 10 + k * 7 + rz(i + k) * 6, h); c.stroke(); }
  }
  manchas(c, w, h, 14, "20,16,10", 0.35);
}, 512, 256, [1, 10]);
const texCasco = (nombre: string, franja: string) => lienzo((c, w, h) => { // costado de la lancha: blanco, franja y nombre
  c.fillStyle = "#d6d2c6"; c.fillRect(0, 0, w, h);
  c.fillStyle = franja; c.fillRect(0, h * 0.18, w, h * 0.13); c.fillStyle = "#2e3a44"; c.fillRect(0, h * 0.72, w, h * 0.28);
  c.fillStyle = "#1e2630"; c.font = "bold 64px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText(nombre, w * 0.62, h * 0.6);
  manchas(c, w, h, 20, "60,50,40", 0.35);
  c.fillStyle = "rgba(120,70,40,0.5)"; for (let k = 0; k < 12; k++) c.fillRect(rz(k) * w, h * 0.32, 3, 10 + rz(k + 4) * 40); // óxido chorreado
}, 1024, 256);
const texFaro = () => lienzo((c, w, h) => { // la torre: blanca con dos franjas rojas, ventanitas y manchas de salitre
  c.fillStyle = "#d8d6cc"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#a8282a"; c.fillRect(0, h * 0.18, w, h * 0.14); c.fillRect(0, h * 0.52, w, h * 0.14);
  manchas(c, w, h, 40, "50,60,60", 0.3);
  c.fillStyle = "rgba(90,80,60,0.35)"; for (let k = 0; k < 40; k++) c.fillRect(rz(k) * w, rz(k + 9) * h, 3, 30 + rz(k + 2) * 90);
  for (let k = 0; k < 4; k++) { // ventanitas en espiral (siguen la escalera)
    const x = ((k * 0.27 + 0.12) % 1) * w, y = h * (0.82 - k * 0.2);
    c.fillStyle = "#1a2228"; c.fillRect(x, y, 36, 60); c.strokeStyle = "#5a5650"; c.lineWidth = 6; c.strokeRect(x, y, 36, 60);
  }
}, 1024, 2048);
const texParedIn = () => lienzo((c, w, h) => { // por dentro: cal blanca con salitre y la base gris
  c.fillStyle = "#bdb9ae"; c.fillRect(0, 0, w, h); manchas(c, w, h, 26, "50,56,52", 0.3);
  c.fillStyle = "rgba(60,70,64,0.4)"; for (let k = 0; k < 30; k++) c.fillRect(rz(k) * w, rz(k + 5) * h, 2, 20 + rz(k + 1) * 80);
}, 512, 512, [3, 6]);
const texRoca = () => lienzo((c, w, h) => {
  c.fillStyle = "#4a4e50"; c.fillRect(0, 0, w, h); manchas(c, w, h, 30, "20,22,24", 0.4); manchas(c, w, h, 14, "110,116,110", 0.25);
  c.strokeStyle = "rgba(20,20,20,0.5)"; c.lineWidth = 2; for (let k = 0; k < 20; k++) { const x = rz(k) * w, y = rz(k + 40) * h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rz(k + 3) - 0.5) * 60, y + rz(k + 8) * 40); c.stroke(); }
}, 256, 256, [2, 2]);
const texBodega = (letrero: boolean) => lienzo((c, w, h) => { // bodega de lámina con cortina y letrero
  c.fillStyle = "#4e5a5c"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(20,26,28,0.5)"; c.lineWidth = 3; for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  c.fillStyle = "#3a3e40"; c.fillRect(w * 0.3, h * 0.42, w * 0.4, h * 0.58); c.strokeStyle = "rgba(10,10,10,0.6)"; for (let y = h * 0.42; y < h; y += 10) { c.beginPath(); c.moveTo(w * 0.3, y); c.lineTo(w * 0.7, y); c.stroke(); }
  manchas(c, w, h, 16, "60,40,20", 0.35);
  if (letrero) { c.fillStyle = "#d8d0b8"; c.fillRect(w * 0.08, h * 0.08, w * 0.84, h * 0.24); c.fillStyle = "#1e3a6a"; c.textAlign = "center"; c.font = "bold 46px 'DejaVu Sans', sans-serif"; c.fillText("COOPERATIVA PESQUERA", w / 2, h * 0.19); c.font = "bold 38px 'DejaVu Sans', sans-serif"; c.fillText("SAN TELMO", w / 2, h * 0.28); }
}, 640, 512);
/** las reglas pintadas a brocha en la pared de la escalera (rojo, chorreadas), una debajo de otra */
const REGLAS_TXT = [
  ["1. LA LUZ", "DEL FARO", "NUNCA SE", "APAGA."],
  ["2. SI OYES A", "ALGUIEN NADAR", "HACIA LA ISLA,", "NO BAJES."],
  ["3. SI LA LUZ", "SE APAGA,", "CUENTA A LOS", "DE ARRIBA.", "SI SOBRA UNO,", "NO DIGAS NADA."],
];
/** altura (sobre el piso del faro) del centro de cada regla en la pared (misma cuenta que el dibujo de abajo) */
export const REGLA_Y = (() => {
  const out: number[] = []; const lh = 1 / 16.2; let y = lh * 0.9;
  REGLAS_TXT.forEach((lin) => { const y0 = y; y += lin.length * lh; out.push(REGLAS.y0 + REGLAS.alto * (1 - ((y0 + y - lh) / 2))); y += lh * 0.55; });
  return out;
})();
const texReglas = () => {
  const W = 900, H = Math.round(W * REGLAS.alto / REGLAS.ancho);
  const t = lienzo((c, w, h) => {
    c.clearRect(0, 0, w, h);
    const lh = h / 16.2; let y = lh * 0.9;
    REGLAS_TXT.forEach((lin, r) => {
      const y0 = y;
      lin.forEach((s, i) => {
        let tam = lh * (i === 0 ? 0.86 : 0.8); c.font = `bold ${Math.round(tam)}px 'DejaVu Sans', sans-serif`;
        while (c.measureText(s).width > w * 0.9) { tam -= 2; c.font = `bold ${Math.round(tam)}px 'DejaVu Sans', sans-serif`; }
        c.fillStyle = "#9a1c18"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(s, w / 2, y);
        for (let k = 0; k < 2; k++) { c.fillStyle = "rgba(154,28,24,0.85)"; c.fillRect(w * (0.15 + rz(r * 9 + i * 3 + k) * 0.7), y + tam * 0.35, 5, 14 + rz(r + i + k * 7) * 34); } // chorreadas
        y += lh;
      });
      void y0;
      if (r < 2) { c.fillStyle = "rgba(154,28,24,0.7)"; c.fillRect(w * 0.35, y - lh * 0.15, w * 0.3, 6); }
      y += lh * 0.55;
    });
  }, W, H);
  t.wrapS = THREE.RepeatWrapping; t.repeat.x = -1; t.offset.x = 1; // se ve desde adentro del cilindro
  return t;
};
const texRed = () => lienzo((c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = "rgba(60,80,70,0.95)"; c.lineWidth = 2; for (let k = 0; k < w; k += 12) { c.beginPath(); c.moveTo(k, 0); c.lineTo(k + 30, h); c.stroke(); c.beginPath(); c.moveTo(k, h); c.lineTo(k + 30, 0); c.stroke(); } }, 256, 256);
const texEspuma = () => lienzo((c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.shadowColor = "rgba(225,238,244,0.9)"; c.shadowBlur = 18;
  for (let k = 0; k < 90; k++) { const y = rz(k) * h, x = w / 2 + (rz(k + 9) - 0.5) * w * (0.2 + 0.6 * y / h); c.fillStyle = `rgba(220,235,240,${0.12 + rz(k + 3) * 0.2})`; c.beginPath(); c.ellipse(x, y, 14 + rz(k + 5) * 22, 8 + rz(k + 6) * 10, 0, 0, 7); c.fill(); }
}, 256, 512);
const texHaz = () => lienzo((c, w, h) => { // haz de luz: más fuerte cerca de la lámpara y en el centro
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "rgba(255,240,200,0.9)"); g.addColorStop(0.4, "rgba(255,230,180,0.35)"); g.addColorStop(1, "rgba(255,230,180,0)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, "rgba(0,0,0,1)"); s.addColorStop(0.5, "rgba(0,0,0,0)"); s.addColorStop(1, "rgba(0,0,0,1)");
  c.globalCompositeOperation = "destination-out"; c.fillStyle = s; c.fillRect(0, 0, w, h);
}, 128, 256);
const texReflejo = () => lienzo((c, w, h) => { // reflejo de la luna en el agua: rayitas que se cortan
  c.clearRect(0, 0, w, h);
  for (let k = 0; k < 90; k++) { const y = rz(k) * h, a = (1 - Math.abs(y / h - 0.5) * 2) * 0.8; const ww = w * (0.2 + rz(k + 3) * 0.6) * (0.4 + y / h); c.fillStyle = `rgba(200,215,240,${a})`; c.fillRect(w / 2 - ww / 2 + (rz(k + 7) - 0.5) * 30, y, ww, 3); }
}, 128, 512);

// ------------------------------------------------------------------ piezas
/** la lancha: casco con proa en punta, bordas, bancas, motor fuera de borda (tapa, pata, hélice y cordón), remos, tanque, red */
export const crearLancha = (nombre: string, franja: string) => {
  const g = new THREE.Group(), L = LAN;
  const mCasco = lambert({ map: texCasco(nombre, franja), side: THREE.DoubleSide }), mIn = lambert({ color: "#b8b4a6", side: THREE.DoubleSide }), mMad = lambert({ color: "#7a5a3a" }), mBorde = lambert({ color: "#3a4a58" });
  // contorno visto desde arriba: popa recta, costados rectos y proa en punta
  const forma = new THREE.Shape();
  const a = L.ancho / 2, zr = L.proa - 1.5;
  forma.moveTo(-a, L.popa); forma.lineTo(a, L.popa); forma.lineTo(a, zr); forma.quadraticCurveTo(a * 0.9, L.proa - 0.4, 0, L.proa); forma.quadraticCurveTo(-a * 0.9, L.proa - 0.4, -a, zr); forma.lineTo(-a, L.popa);
  const pts = forma.getSpacedPoints(60);
  // costado: una cinta vertical que sigue el contorno (de y = −0.25 a la borda), un poco más angosta abajo
  const pos: number[] = [], uv: number[] = [], idx: number[] = [];
  let acum = 0; const largo = pts.reduce((s, p, i) => (i ? s + p.distanceTo(pts[i - 1]) : 0), 0);
  pts.forEach((p, i) => {
    if (i) acum += p.distanceTo(pts[i - 1]);
    pos.push(p.x * 0.82, -0.25, p.y * 0.97, p.x, L.borda, p.y);
    uv.push(acum / largo * 2 % 2, 0, acum / largo * 2 % 2, 1);
    if (i) { const b = (i - 1) * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); }
  });
  const gc = new THREE.BufferGeometry(); gc.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); gc.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); gc.setIndex(idx); gc.computeVertexNormals();
  g.add(new THREE.Mesh(gc, mCasco));
  // fondo y piso de adentro
  const fondo = new THREE.Mesh(new THREE.ShapeGeometry(forma), mBorde); fondo.rotation.x = Math.PI / 2; fondo.scale.set(0.82, 0.97, 1); fondo.position.y = -0.25; g.add(fondo);
  const piso = new THREE.Mesh(new THREE.ShapeGeometry(forma), mIn); piso.rotation.x = Math.PI / 2; piso.scale.set(0.9, 0.97, 1); piso.position.y = L.piso; g.add(piso);
  for (let k = 0; k < 7; k++) g.add(caja(L.ancho * 0.8, 0.02, 0.06, mMad, 0, L.piso + 0.01, L.popa + 0.4 + k * 0.6)); // tablitas del piso
  // la orilla (borda) de madera encima del casco
  pts.forEach((p, i) => { if (!i || i % 2) return; const q = pts[i - 2]; const d = Math.hypot(p.x - q.x, p.y - q.y); const b = caja(0.07, 0.05, d + 0.03, mMad, (p.x + q.x) / 2, L.borda + 0.025, (p.y + q.y) / 2); b.rotation.y = Math.atan2(p.x - q.x, p.y - q.y); g.add(b); });
  // bancas transversales y la de la popa
  for (const z of [-1.55, 0.05, 1.3]) { g.add(caja(L.ancho * (z > 1 ? 0.8 : 0.98), 0.05, 0.3, mMad, 0, 0.42, z)); g.add(caja(0.06, 0.3, 0.06, mMad, 0, 0.27, z)); }
  // motor fuera de borda colgado del espejo de popa
  const motor = new THREE.Group(); motor.position.set(0, L.borda, L.popa - 0.1); g.add(motor);
  const mMotor = lambert({ color: "#c8c4b8" }), mNegro = lambert({ color: "#1e2226" });
  motor.add(caja(0.42, 0.42, 0.55, mMotor, 0, 0.2, -0.12)); // tapa
  motor.add(caja(0.44, 0.06, 0.57, lambert({ color: "#2a5aa0" }), 0, 0.02, -0.12)); // franja azul
  motor.add(caja(0.12, 0.85, 0.16, mNegro, 0, -0.42, -0.15)); // pata
  motor.add(caja(0.18, 0.14, 0.36, mNegro, 0, -0.85, -0.18)); // aleta
  motor.add(caja(0.06, 0.06, 0.6, mNegro, 0, 0.18, 0.25)); // caña del timón
  const helice = new THREE.Group(); helice.position.set(0, -0.82, -0.4); motor.add(helice);
  for (let k = 0; k < 3; k++) { const p = caja(0.05, 0.22, 0.02, lambert({ color: "#8a8a86" }), 0, 0.1, 0); const pg = new THREE.Group(); pg.rotation.z = k * 2.094; pg.add(p); helice.add(pg); }
  const jalon = new THREE.Group(); jalon.position.set(0.15, 0.3, -0.38); motor.add(jalon); // el cordón para arrancar (con su mango)
  const cordon = cil(0.006, 0.006, 1, lambert({ color: "#e0dccc" }), 0, 0.5, 0, 5); jalon.add(cordon);
  const mango = caja(0.12, 0.035, 0.035, lambert({ color: "#c8301e" }), 0, 1, 0); jalon.add(mango);
  // tanque de gasolina rojo con su manguera, remos, red y una cubeta
  g.add(caja(0.4, 0.26, 0.28, lambert({ color: "#b8281e" }), 0.45, L.piso + 0.13, L.popa + 0.45));
  g.add(caja(0.05, 0.05, 0.12, lambert({ color: "#222" }), 0.45, L.piso + 0.29, L.popa + 0.45));
  const remo = (x: number) => { const r = new THREE.Group(); r.add(cil(0.025, 0.025, 2.1, mMad, 0, 0, 0, 6)); const pala = caja(0.16, 0.5, 0.02, mMad, 0, 1.2, 0); r.add(pala); r.rotation.x = Math.PI / 2; r.position.set(x, L.piso + 0.1, 0.25); return r; };
  const remoA = remo(-0.55), remoB = remo(0.6); g.add(remoA, remoB);
  const red = new THREE.Mesh(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#3a5a4e" })); red.scale.set(1.2, 0.5, 1); red.position.set(-0.35, L.piso, 1.0); g.add(red);
  g.add(cil(0.13, 0.11, 0.26, lambert({ color: "#d8a020" }), 0.5, L.piso + 0.13, 0.75));
  // espuma (detrás) y salpicadura (proa): se encienden al avanzar
  const mEsp = new THREE.MeshBasicMaterial({ map: texEspuma(), transparent: true, depthWrite: false, opacity: 0 });
  const estela = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 12), mEsp); estela.rotation.x = -Math.PI / 2; estela.position.set(0, -0.3, L.popa - 6.2); estela.layers.set(NOINK); g.add(estela);
  const mSal = new THREE.MeshBasicMaterial({ map: texEspuma(), transparent: true, depthWrite: false, opacity: 0, side: THREE.DoubleSide });
  const salpica: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.6), mSal); p.position.set(s * 0.85, -0.05, L.proa - 0.9); p.rotation.set(-1.1, s * 0.5, 0); p.layers.set(NOINK); g.add(p); salpica.push(p); }
  const humo = destello(160, 170, 180, 0.6, 0); humo.material.blending = THREE.NormalBlending; humo.position.set(0, L.borda + 0.4, L.popa - 0.4); g.add(humo);
  return { g, motor, helice, jalon, cordon, mango, remoA, remoB, estela, mEsp, mSal, salpica, humo };
};
export type Lancha = ReturnType<typeof crearLancha>;

/** roca: piedra irregular de caras planas */
const roca = (x: number, y: number, z: number, s: number, m: THREE.Material, semilla: number) => {
  const geo = new THREE.IcosahedronGeometry(1, 1), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const k = 0.75 + rz(semilla * 13 + i) * 0.45; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.8, p.getZ(i) * k); }
  geo.computeVertexNormals();
  const r = new THREE.Mesh(geo, m); r.position.set(x, y, z); r.scale.set(s * (0.8 + rz(semilla) * 0.5), s * (0.6 + rz(semilla + 1) * 0.5), s * (0.8 + rz(semilla + 2) * 0.5)); r.rotation.set(rz(semilla + 3), rz(semilla + 4) * 6, rz(semilla + 5)); return r;
};

// ------------------------------------------------------------------ escenario
export function crearEscenario() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#8a9cc0", 0.5), hemi = new THREE.HemisphereLight("#9fb4dc", "#1e2a30", 0.7);
  const luna = new THREE.DirectionalLight("#aec2ee", 1.5); luna.position.set(-20, 30, 60); luna.target.position.set(0, 0, 30);
  raiz.add(amb, hemi, luna, luna.target);
  const luzExtra = new THREE.PointLight("#ffc890", 0, 9, 1.6); raiz.add(luzExtra);
  const luzExtra2 = new THREE.PointLight("#ffc890", 0, 6, 1.6); raiz.add(luzExtra2);

  // cielo: luna (sobre el mar, adelante del muelle) y su reflejo
  const cielo = new THREE.Group(); raiz.add(cielo);
  const lunaDisco = new THREE.Mesh(new THREE.CircleGeometry(6, 32), brillo("#e8eefc")); lunaDisco.position.set(-55, 60, 210); lunaDisco.lookAt(0, 0, 0); lunaDisco.layers.set(NOINK); cielo.add(lunaDisco);
  const lunaHalo = destello(190, 210, 255, 54, 0.5); lunaHalo.position.copy(lunaDisco.position); cielo.add(lunaHalo);
  // costa lejana detrás del muelle: cerros oscuros con lucecitas
  for (let k = 0; k < 9; k++) {
    const cerro = new THREE.Mesh(new THREE.SphereGeometry(30 + rz(k) * 20, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#141c24" }));
    cerro.scale.y = 0.35 + rz(k + 3) * 0.25; cerro.position.set(-160 + k * 40, -2, -110 - rz(k + 5) * 30); cielo.add(cerro);
  }
  for (let k = 0; k < 26; k++) { const l = destello(255, 200, 130, 1.6 + rz(k) * 1.4, 0.7); l.position.set(-100 + rz(k + 2) * 200, 1.5 + rz(k + 4) * 8, -70 - rz(k + 6) * 25); cielo.add(l); }

  // ================================================================ el mar
  const tAgua = texAgua();
  const mar = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), lambert({ color: "#ffffff", map: tAgua, emissive: "#0a1a22" })); mar.rotation.x = -Math.PI / 2; raiz.add(mar);
  const reflejo = new THREE.Mesh(new THREE.PlaneGeometry(14, 160), new THREE.MeshBasicMaterial({ map: texReflejo(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55 }));
  reflejo.rotation.x = -Math.PI / 2; reflejo.position.set(-22, 0.02, 120); reflejo.rotation.z = -0.25; reflejo.layers.set(NOINK); raiz.add(reflejo);

  // ================================================================ el muelle
  const muelle = new THREE.Group(); raiz.add(muelle);
  const M = MUELLE, mTab = lambert({ map: texTablones() }), mPil = lambert({ color: "#3a3026" }), mMad = lambert({ color: "#6a5236" }), mCuerda = lambert({ color: "#b8a47a" }), mFierro = lambert({ color: "#2e3236" });
  const largoM = M.z1 - M.z0;
  muelle.add(caja(M.x * 2, 0.12, largoM, mTab, 0, M.piso - 0.06, (M.z0 + M.z1) / 2));
  for (const s of [-1, 1]) muelle.add(caja(0.14, 0.22, largoM, mMad, s * (M.x - 0.07), M.piso - 0.2, (M.z0 + M.z1) / 2)); // vigas de la orilla
  for (let z = M.z0 + 1; z <= M.z1; z += 3) for (const s of [-1, 1]) { // pilotes con sus amarres
    muelle.add(cil(0.15, 0.17, M.piso + 2.2, mPil, s * (M.x - 0.05), (M.piso - 2.2) / 2 + 0.25, z, 9));
    muelle.add(cil(0.17, 0.17, 0.08, mCuerda, s * (M.x - 0.05), 0.45, z, 9));
  }
  for (let z = M.z0 + 2; z < M.z1; z += 6) for (const s of [-1, 1]) { // bitas de fierro
    muelle.add(cil(0.09, 0.11, 0.35, mFierro, s * (M.x - 0.25), M.piso + 0.17, z, 10), cil(0.14, 0.14, 0.05, mFierro, s * (M.x - 0.25), M.piso + 0.37, z, 10));
  }
  // faroles del muelle (uno apagado), cajas, redes, cubetas, boyas y un rollo de cuerda
  [[-1.25, -22, true], [1.25, -14, false], [-1.25, -6, true]].forEach(([x, z, on], i) => { const p = poste(on as boolean); p.scale.setScalar(0.62); p.position.set(x as number, M.piso, z as number); p.rotation.y = (x as number) < 0 ? 0 : Math.PI; muelle.add(p); void i; });
  const mHuacal = lambert({ color: "#8a6a44" });
  [[-0.9, -19.5], [-0.95, -18.9], [1.0, -10.5], [0.95, -2.2]].forEach(([x, z], i) => { const h = huacal(x, M.piso, z, mHuacal); h.rotation.y = rz(i) * 0.6; muelle.add(h); });
  const mRed = new THREE.MeshLambertMaterial({ map: texRed(), transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  const redM = new THREE.Mesh(new THREE.SphereGeometry(0.6, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#2e5048" })); redM.scale.set(1.3, 0.45, 1); redM.position.set(0.8, M.piso, -16.5); muelle.add(redM);
  const redColgada = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.4), mRed); redColgada.position.set(-1.3, M.piso + 0.9, -12); redColgada.rotation.y = Math.PI / 2; muelle.add(redColgada);
  const rollo = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 6, 16), mCuerda); rollo.rotation.x = Math.PI / 2; rollo.position.set(-0.95, M.piso + 0.06, -3.4); muelle.add(rollo);
  for (const [x, z, col] of [[0.9, -7.5, "#d84a20"], [-1.0, -14.5, "#e0d0b0"]] as [number, number, string][]) { muelle.add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), lambert({ color: col })).translateX(x).translateY(M.piso + 0.2).translateZ(z)); }
  muelle.add(cil(0.15, 0.12, 0.3, lambert({ color: "#3a6ab0" }), 0.95, M.piso + 0.15, -9.6));
  // letrero del muelle
  const letrero = cartel(["MUELLE SAN TELMO", "PROHIBIDO PESCAR AQUÍ"], "#d8d0b8", "#1e3a6a", 1.8, 0.7); letrero.position.set(-1.33, M.piso + 1.6, -24.5); letrero.rotation.y = Math.PI / 2; muelle.add(letrero);
  muelle.add(caja(0.08, 1.6, 0.08, mPil, -1.33, M.piso + 0.8, -25.2), caja(0.08, 1.6, 0.08, mPil, -1.33, M.piso + 0.8, -23.8));
  // tierra firme: el malecón de concreto y las bodegas
  const mCon = lambert({ map: texConcreto([6, 2]) });
  muelle.add(caja(70, 1.6, 18, mCon, 0, 0.3, M.z0 - 9));
  [[-12, true], [0, false], [12, false], [-24, false]].forEach(([x, l], i) => {
    const b = new THREE.Mesh(new THREE.BoxGeometry(10, 6, 7), [lambert({ color: "#3e4a4c" }), lambert({ color: "#3e4a4c" }), lambert({ color: "#2a3032" }), lambert({ color: "#2a3032" }), lambert({ map: texBodega(l as boolean) }), lambert({ color: "#3e4a4c" })]);
    b.position.set((x as number) + (i === 1 ? 9 : 0), 4.1, M.z0 - 13); muelle.add(b);
    const techo = caja(10.4, 0.2, 7.4, lambert({ color: "#5a4a3a" }), b.position.x, 7.2, b.position.z); techo.rotation.x = 0.06; muelle.add(techo);
    if (i < 2) { const fo = destello(255, 200, 130, 1.8, 0.6); fo.position.set(b.position.x, 6.0, b.position.z + 3.7); muelle.add(fo); }
  });
  const luzMuelle = new THREE.PointLight("#ffd0a0", 8, 18, 1.5); luzMuelle.position.set(0, 6, M.z0 - 9); muelle.add(luzMuelle);
  // lanchas amarradas a los lados (las de otros pescadores)
  const otras: THREE.Group[] = [];
  [[-2.45, -20, "LUPITA", "#c8402a", 0.06], [-2.5, -11.5, "EL GÜERO", "#2a7a4a", -0.05], [2.5, -17, "SANTA FE", "#d8a020", 0.04]].forEach(([x, z, n, c, r]) => {
    const l = crearLancha(n as string, c as string); l.g.position.set(x as number, 0.05, z as number); l.g.rotation.set(0, 0, r as number); l.g.scale.setScalar(0.95); muelle.add(l.g); otras.push(l.g);
  });

  // ================================================================ la lancha de don Chema
  const lancha = crearLancha("LA GAVIOTA", "#2a62b0");
  raiz.add(lancha.g);
  const cuerdaAmarre = cil(0.015, 0.015, 1.3, mCuerda, 0, 0, 0, 5); raiz.add(cuerdaAmarre); // de la proa a la bita

  // ================================================================ la isla y el faro
  const isla = new THREE.Group(); raiz.add(isla);
  const mRoca = lambert({ map: texRoca(), flatShading: true }), mRocaOsc = lambert({ map: texRoca(), color: "#7a8080", flatShading: true });
  const I = ISLA;
  const meseta = cil(10, 13, I.alto + 1.5, mRoca, I.x, (I.alto - 1.5) / 2, I.z, 24); isla.add(meseta);
  isla.add(suelo(19.6, 19.6, lambert({ map: texRoca() }), I.x, I.alto + 0.005, I.z).rotateZ(0.3)); // tapa de la meseta (pasto ralo y piedra)
  isla.children[isla.children.length - 1].visible = false; // (la tapa del cilindro ya cubre)
  for (let k = 0; k < 34; k++) { // rocas sueltas alrededor, más grandes del lado de la llegada
    const a = k / 34 * Math.PI * 2 + rz(k) * 0.2, r = 11.5 + rz(k + 2) * 3;
    if (Math.abs(Math.atan2(Math.sin(a - Math.PI), Math.cos(a - Math.PI))) < 0.22) continue; // la entrada de la escalera queda libre
    isla.add(roca(I.x + r * Math.sin(a), 0.4 + rz(k + 4) * 1.2, I.z + r * Math.cos(a), 1.4 + rz(k + 6) * 1.8, k % 3 ? mRoca : mRocaOsc, k));
  }
  [[CHOQUE.x + 1.6, 0.3, CHOQUE.z + 0.6, 1.6], [CHOQUE.x - 2.4, 0.2, CHOQUE.z + 1.2, 1.3], [CHOQUE.x + 0.4, 0.1, CHOQUE.z + 2.0, 1.4]].forEach(([x, y, z, s], k) => isla.add(roca(x, y, z, s, mRocaOsc, 90 + k)));
  // escalera de piedra desde la orilla hasta la meseta (sube hacia +z) y luego el caminito a la puerta
  const mPiedra = lambert({ color: "#6a6a64" });
  for (let k = 0; k < 9; k++) isla.add(caja(1.3, 0.34, 0.5, mPiedra, 0.6, 0.2 + k * 0.33, CHOQUE.z + 1.2 + k * 0.42));
  for (let k = 0; k < 9; k++) isla.add(caja(0.08, 0.7, 0.08, mFierro, -0.05, 0.6 + k * 0.33, CHOQUE.z + 1.2 + k * 0.42)); // postes del pasamanos
  const pasamanos = cil(0.025, 0.025, 4.6, mFierro, -0.05, 2.3, CHOQUE.z + 2.9, 6); pasamanos.rotation.x = Math.PI / 2 - Math.atan2(2.64, 3.36); isla.add(pasamanos);
  for (let k = 0; k < 5; k++) isla.add(caja(0.9, 0.05, 0.6, mPiedra, 0.4 - k * 0.08, I.alto + 0.03, CHOQUE.z + 5.6 + k * 0.75)); // lajas del camino
  // la casita del farero, tambos, boya vieja, tendedero y una lancha de remos volteada
  const casita = new THREE.Group(); casita.position.set(I.x - 5.2, I.alto, I.z - 2.5); isla.add(casita);
  casita.add(caja(3.2, 2.4, 2.6, lambert({ color: "#c8c0ae" }), 0, 1.2, 0));
  const techoC = caja(3.6, 0.15, 3.0, lambert({ color: "#7a2a22" }), 0, 2.5, 0); techoC.rotation.z = 0.12; casita.add(techoC);
  casita.add(caja(0.8, 1.8, 0.05, lambert({ color: "#3a5a6a" }), 0.6, 0.9, -1.32), caja(0.7, 0.6, 0.05, brillo("#ffcf8a"), -0.8, 1.4, -1.32));
  casita.children[casita.children.length - 1].layers.set(NOINK);
  const ventC = destello(255, 200, 130, 1.4, 0.5); ventC.position.set(-0.8, 1.4, -1.45); casita.add(ventC);
  [[I.x + 4.2, I.z - 3.5, "#3a5a7a"], [I.x + 4.9, I.z - 2.8, "#8a3a2a"]].forEach(([x, z, c]) => isla.add(cil(0.3, 0.3, 0.9, lambert({ color: c as string }), x as number, I.alto + 0.45, z as number)));
  isla.add(new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 8), lambert({ color: "#c8402a" })).translateX(I.x + 3.6).translateY(I.alto + 0.4).translateZ(I.z - 5.2));
  const voltea = crearLancha("", "#7a6a4a"); voltea.g.scale.setScalar(0.6); voltea.g.rotation.z = Math.PI; voltea.g.position.set(I.x - 4.5, I.alto + 0.45, I.z - 7.2); voltea.motor.visible = false; isla.add(voltea.g);
  for (const x of [-7.5, -4.6]) isla.add(caja(0.06, 1.8, 0.06, mMad, I.x + x, I.alto + 0.9, I.z - 5.5));
  const tendedero = cil(0.008, 0.008, 2.9, mCuerda, I.x - 6.05, I.alto + 1.75, I.z - 5.5, 4); tendedero.rotation.z = Math.PI / 2; isla.add(tendedero);
  isla.add(caja(0.5, 0.7, 0.02, lambert({ color: "#c8a030", side: THREE.DoubleSide }), I.x - 6.6, I.alto + 1.4, I.z - 5.5), caja(0.4, 0.5, 0.02, lambert({ color: "#e0dccc", side: THREE.DoubleSide }), I.x - 5.4, I.alto + 1.5, I.z - 5.5));

  // ---------------- la torre (por fuera): blanca con franjas rojas; abajo deja el hueco de la puerta
  const T = TORRE, faro = new THREE.Group(); faro.position.set(I.x, I.alto, I.z); isla.add(faro);
  const mFaro = lambert({ map: texFaro() }), mIn = lambert({ map: texParedIn(), side: THREE.BackSide });
  const hueco = PUERTA_F.ancho / 2 / T.r0 + 0.02, rA = (y: number) => lerp(T.r0, T.r1, y / T.alto);
  const tramo = (y0: number, y1: number, conHueco: boolean, m: THREE.Material, dr: number) => {
    const geo = conHueco ? new THREE.CylinderGeometry(rA(y1) - dr, rA(y0) - dr, y1 - y0, 40, 1, true, Math.PI + hueco, Math.PI * 2 - 2 * hueco) : new THREE.CylinderGeometry(rA(y1) - dr, rA(y0) - dr, y1 - y0, 40, 1, true);
    const c = new THREE.Mesh(geo, m); c.position.y = (y0 + y1) / 2; return c;
  };
  const mFaroA = mFaro.clone(); mFaroA.map = texFaro(); mFaroA.map.repeat.set(1, PUERTA_F.alto / T.alto); mFaroA.map.offset.y = 0;
  const mFaroB = mFaro.clone(); mFaroB.map = texFaro(); mFaroB.map.repeat.set(1, 1 - PUERTA_F.alto / T.alto); mFaroB.map.offset.y = PUERTA_F.alto / T.alto;
  faro.add(tramo(0, PUERTA_F.alto, true, mFaroA, 0), tramo(PUERTA_F.alto, T.alto, false, mFaroB, 0));
  faro.add(tramo(0, PUERTA_F.alto, true, mIn, T.rIn), tramo(PUERTA_F.alto, T.alto, false, mIn, T.rIn));
  // marco de la puerta (tapa el grueso del muro) y escalón
  const mMarco = lambert({ color: "#5a4a3a" });
  for (const s of [-1, 1]) faro.add(caja(0.1, PUERTA_F.alto, T.rIn + 0.04, mMarco, s * (PUERTA_F.ancho / 2 + 0.05), PUERTA_F.alto / 2, -T.r0 + T.rIn / 2));
  faro.add(caja(PUERTA_F.ancho + 0.3, 0.12, T.rIn + 0.06, mMarco, 0, PUERTA_F.alto + 0.06, -T.r0 + T.rIn / 2));
  faro.add(caja(1.5, 0.12, 0.7, mPiedra, 0, 0.06, -T.r0 - 0.3));
  const letreroF = cartel(["FARO SAN TELMO", "1931"], "#2a3a5a", "#e8e0c8", 1.1, 0.42); letreroF.position.set(0, PUERTA_F.alto + 0.45, -T.r0 - 0.03); letreroF.rotation.y = Math.PI; faro.add(letreroF);
  // la puerta: hoja de tablones verde con herrajes; abre hacia adentro (bisagra a la izquierda vista desde afuera)
  const puerta = new THREE.Group(); puerta.position.set(PUERTA_F.ancho / 2, 0, -T.r0 + T.rIn + 0.02); faro.add(puerta);
  const mPuerta = lambert({ color: "#2e5a4a" });
  puerta.add(caja(PUERTA_F.ancho, PUERTA_F.alto - 0.02, 0.07, mPuerta, -PUERTA_F.ancho / 2, PUERTA_F.alto / 2, 0));
  for (const y of [0.35, PUERTA_F.alto - 0.35]) puerta.add(caja(PUERTA_F.ancho * 0.92, 0.08, 0.1, mFierro, -PUERTA_F.ancho / 2, y, 0));
  for (let k = 1; k < 5; k++) puerta.add(caja(0.012, PUERTA_F.alto - 0.1, 0.075, lambert({ color: "#1e3a30" }), -k * PUERTA_F.ancho / 5, PUERTA_F.alto / 2, 0));
  puerta.add(cil(0.035, 0.035, 0.05, lambert({ color: "#a08a40" }), -PUERTA_F.ancho + 0.1, 1.0, -0.06).rotateX(Math.PI / 2));
  // la tranca: soportes de fierro a los lados (por dentro) y la viga que Elías deja caer
  for (const s of [-1, 1]) faro.add(caja(0.08, 0.16, 0.14, mFierro, s * (PUERTA_F.ancho / 2 + 0.16), 1.05, -T.r0 + T.rIn + 0.13));
  const tranca = caja(PUERTA_F.ancho + 0.55, 0.12, 0.1, lambert({ color: "#5a3e26" }), 0, 0, 0); faro.add(tranca);
  // ---------------- por dentro: la escalera de caracol pegada a la pared y la pared de las reglas
  const E = ESC_F, mEsc = lambert({ color: "#5a5a58" }), escalones: THREE.Mesh[] = [];
  const nEsc = Math.ceil(T.alto / E.sube) - 1;
  for (let k = 0; k < nEsc; k++) {
    const th = E.th0 + k * E.paso, y = (k + 1) * E.sube, r = rA(y) - T.rIn;
    const w = r - E.r0, s = caja(w, 0.07, r * E.paso * 1.15, mEsc, 0, 0, 0);
    s.position.set(Math.sin(th) * (E.r0 + w / 2), y - 0.035, Math.cos(th) * (E.r0 + w / 2)); s.rotation.y = th + Math.PI / 2; faro.add(s); escalones.push(s);
    if (k % 2 === 0) faro.add(cil(0.015, 0.015, 0.9, mFierro, Math.sin(th) * (E.r0 + 0.04), y + 0.45, Math.cos(th) * (E.r0 + 0.04), 5)); // barandal
  }
  const curva = new THREE.CatmullRomCurve3(Array.from({ length: nEsc }, (_, k) => new THREE.Vector3(Math.sin(E.th0 + k * E.paso) * (E.r0 + 0.04), (k + 1) * E.sube + 0.9, Math.cos(E.th0 + k * E.paso) * (E.r0 + 0.04))));
  faro.add(new THREE.Mesh(new THREE.TubeGeometry(curva, nEsc * 3, 0.022, 5), lambert({ color: "#6a3a22" })));
  faro.add(suelo(2 * (T.r0 - T.rIn), 2 * (T.r0 - T.rIn), lambert({ map: texConcreto([2, 2]) }), 0, 0.006, 0)); // piso de adentro
  const reglas = new THREE.Mesh(new THREE.CylinderGeometry(rA(REGLAS.y0 + REGLAS.alto) - T.rIn - 0.012, rA(REGLAS.y0) - T.rIn - 0.012, REGLAS.alto, 24, 1, true, REGLAS.th - REGLAS.ancho / (T.r0 - T.rIn) / 2, REGLAS.ancho / (T.r0 - T.rIn)),
    new THREE.MeshLambertMaterial({ map: texReglas(), transparent: true, side: THREE.BackSide, depthWrite: false }));
  reglas.position.y = REGLAS.y0 + REGLAS.alto / 2; reglas.layers.set(NOINK); faro.add(reglas);
  // cosas de adentro: lámparas de aceite en la pared, un garrafón, un salvavidas colgado y un banco
  const salvavidas = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 8, 20), lambert({ color: "#d8402a" }));
  const pS = enPared(-1.3, T.r0 - T.rIn - 0.1, 1.5); salvavidas.position.set(pS[0] - I.x, 1.5, pS[2] - I.z); salvavidas.rotation.y = -1.3; faro.add(salvavidas);
  const banco = huacal(-1.2, 0, -0.8, mHuacal); faro.add(banco);
  faro.add(cil(0.16, 0.16, 0.45, lambert({ color: "#4a7aa0", transparent: true, opacity: 0.85 }), -1.5, 0.23, 0.2));
  // ---------------- arriba: balcón, cuarto de la lámpara (pretil, vidrios con su herrería, cúpula) y la lámpara
  const C = CUARTO, yC = C.y - I.alto, mVerde = lambert({ color: "#2a3e38" });
  faro.add(cil(C.r + 0.75, C.r + 0.6, 0.18, mFierro, 0, T.alto - 0.1, 0, 40)); for (let k = 0; k < 16; k++) { const a = k / 16 * Math.PI * 2; const mensula = caja(0.12, 0.5, C.r + 0.6 - T.r1, mFierro, Math.sin(a) * (T.r1 + C.r + 0.6) / 2, T.alto - 0.2, Math.cos(a) * (T.r1 + C.r + 0.6) / 2); mensula.rotation.y = a; faro.add(mensula); } // piso del balcón (y techo de la torre)
  for (let k = 0; k < 36; k++) { const a = k / 36 * Math.PI * 2; faro.add(caja(0.035, 1.0, 0.035, mFierro, Math.sin(a) * (C.r + 0.68), T.alto + 0.68, Math.cos(a) * (C.r + 0.68))); }
  const aro = new THREE.Mesh(new THREE.TorusGeometry(C.r + 0.68, 0.03, 6, 48), mFierro); aro.rotation.x = Math.PI / 2; aro.position.y = T.alto + 1.18; faro.add(aro);
  const cuarto = new THREE.Group(); cuarto.position.y = yC; faro.add(cuarto);
  const pretilF = new THREE.Mesh(new THREE.CylinderGeometry(C.r, C.r, C.pretil, 12, 1, true), mVerde); pretilF.position.y = C.pretil / 2; cuarto.add(pretilF); // pretil (por fuera)
  const pretilIn = new THREE.Mesh(new THREE.CylinderGeometry(C.r - 0.06, C.r - 0.06, C.pretil, 12, 1, true), lambert({ color: "#5a6a62", side: THREE.BackSide })); pretilIn.position.y = C.pretil / 2; cuarto.add(pretilIn);
  cuarto.add(suelo(2 * C.r - 0.1, 2 * C.r - 0.1, lambert({ color: "#4a4a46" }), 0, 0.01, 0).rotateZ(0)); // piso del cuarto
  const mVidrio = new THREE.MeshLambertMaterial({ color: "#9fb8c8", transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide });
  const vidrios = new THREE.Mesh(new THREE.CylinderGeometry(C.r - 0.03, C.r - 0.03, C.vidrio, 12, 1, true), mVidrio); vidrios.position.y = C.pretil + C.vidrio / 2; vidrios.layers.set(NOINK); cuarto.add(vidrios);
  for (let k = 0; k < 12; k++) { const a = (k + 0.5) / 12 * Math.PI * 2; cuarto.add(caja(0.06, C.vidrio, 0.06, mVerde, Math.sin(a) * (C.r - 0.03), C.pretil + C.vidrio / 2, Math.cos(a) * (C.r - 0.03))); } // herrería
  for (const y of [C.pretil, C.pretil + C.vidrio * 0.5, C.pretil + C.vidrio]) { const t = new THREE.Mesh(new THREE.TorusGeometry(C.r - 0.03, 0.03, 4, 12), mVerde); t.rotation.x = Math.PI / 2; t.position.y = y; cuarto.add(t); }
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(C.r + 0.25, 1.2, 24, 1, true), lambert({ color: "#2a3e38", side: THREE.DoubleSide })); cupula.position.y = C.pretil + C.vidrio + 0.6; cuarto.add(cupula);
  cuarto.add(cil(0.12, 0.12, 0.35, mVerde, 0, C.pretil + C.vidrio + 1.3, 0, 10), new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 8), mVerde).translateY(C.pretil + C.vidrio + 1.6));
  // la lámpara: pedestal de fierro, lente grande (anillos de vidrio) con el foco adentro y dos haces que giran
  cuarto.add(cil(0.16, 0.3, C.lente, mVerde, 0, C.lente / 2, 0, 16), cil(0.45, 0.4, 0.12, mVerde, 0, C.lente - 0.02, 0, 20));
  const lente = new THREE.Group(); lente.position.y = C.lente + 0.04; cuarto.add(lente);
  const mLenteOn = new THREE.MeshLambertMaterial({ color: "#f8e8c0", emissive: "#ffd890", emissiveIntensity: 0.9, transparent: true, opacity: 0.75 });
  for (let k = 0; k < 8; k++) { const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.52 - Math.abs(k - 3.5) * 0.03, 0.045, 6, 24), mLenteOn); anillo.rotation.x = Math.PI / 2; anillo.position.y = 0.1 + k * 0.13; lente.add(anillo); }
  for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI * 2; lente.add(caja(0.03, 1.1, 0.03, lambert({ color: "#8a7a4a" }), Math.sin(a) * 0.55, 0.55, Math.cos(a) * 0.55)); } // marco de bronce
  const foco = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 10), brillo("#fff2cc")); foco.position.y = 0.55; foco.layers.set(NOINK); lente.add(foco);
  const halo = destello(255, 230, 170, 3.2, 0.7); halo.position.y = 0.55; lente.add(halo);
  const haces = new THREE.Group(); haces.position.y = 0.55; lente.add(haces);
  const mHaz = new THREE.MeshBasicMaterial({ map: texHaz(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, side: THREE.DoubleSide, opacity: 0.55 });
  for (const s of [1, -1]) for (const r of [0, Math.PI / 2]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(5, 80), mHaz); p.geometry.translate(0, 40, 0); p.rotation.set(0, 0, 0); const pg = new THREE.Group(); pg.rotation.set(s * Math.PI / 2, 0, 0); pg.add(p); p.rotation.y = r; p.scale.x = 1; pg.scale.set(1, 1, 1); haces.add(pg); p.layers.set(NOINK); }
  const luzLampara = new THREE.PointLight("#ffd890", 14, 14, 1.4); luzLampara.position.y = C.lente + 0.55; cuarto.add(luzLampara);
  const luzLuna = new THREE.PointLight("#9ab4ff", 0, 7, 1.4); luzLuna.position.set(Math.sin(-0.4) * 1.9, 1.9, Math.cos(-0.4) * 1.9); cuarto.add(luzLuna); // la luna que entra por las ventanas (de noche sin lámpara)
  // el charco que va creciendo bajo «el cuarto» y sus gotas
  const charco = new THREE.Mesh(new THREE.CircleGeometry(0.4, 24), new THREE.MeshLambertMaterial({ color: "#1a2a34", transparent: true, opacity: 0.8, depthWrite: false })); charco.rotation.x = -Math.PI / 2; charco.position.y = 0.012; charco.layers.set(NOINK); cuarto.add(charco);
  const gotas: THREE.Mesh[] = [];
  for (let k = 0; k < 8; k++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), new THREE.MeshBasicMaterial({ color: "#c8dcec", toneMapped: false })); g.scale.y = 2.4; g.layers.set(NOINK); cuarto.add(g); gotas.push(g); }

  // salpicadura (cuando alguien cae al agua o la ola pega en las rocas) y el que nada
  const mSalp = new THREE.SpriteMaterial({ map: resplandor(225, 238, 245), transparent: true, depthWrite: false, opacity: 0 });
  const salpicadura = new THREE.Sprite(mSalp); salpicadura.layers.set(NOINK); raiz.add(salpicadura);
  const ondas: THREE.Mesh[] = [];
  for (let k = 0; k < 3; k++) { const o = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 32), new THREE.MeshBasicMaterial({ color: "#a8c0cc", transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); o.rotation.x = -Math.PI / 2; o.layers.set(NOINK); raiz.add(o); ondas.push(o); }
  // el encendedor de don Chema: cuerpo, chispa y flamita (con su luz)
  const encendedor = new THREE.Group(); raiz.add(encendedor);
  encendedor.add(caja(0.035, 0.07, 0.015, lambert({ color: "#c8302a" }), 0, 0, 0), caja(0.03, 0.02, 0.016, lambert({ color: "#9a9a9a" }), 0, 0.045, 0));
  const chispa = destello(255, 220, 160, 0.25, 0); chispa.position.y = 0.07; encendedor.add(chispa);
  const luzEnc = new THREE.PointLight("#ffb060", 0, 3, 1.6); luzEnc.position.y = 0.08; encendedor.add(luzEnc);
  // la lámpara de mano de Elías
  const lamparaE = lampara(0.28); raiz.add(lamparaE);
  const luzLamE = new THREE.PointLight("#ffcf8a", 0, 7, 1.5); lamparaE.add(luzLamE); luzLamE.position.y = 0.14;
  // el remo que usa don Chema (aparte de los de la lancha, para moverlo en su mano)
  const remoMano = new THREE.Group(); raiz.add(remoMano);
  remoMano.add(cil(0.028, 0.028, 2.0, mMad, 0, 0, 0, 6), caja(0.17, 0.52, 0.025, mMad, 0, 1.18, 0));

  const animarAgua = (t: number) => { tAgua.offset.set(t * 0.004, t * 0.012); (reflejo.material as THREE.MeshBasicMaterial).opacity = 0.45 + 0.1 * Math.sin(t * 1.3); };
  return {
    raiz, amb, hemi, luna, luzExtra, luzExtra2, cielo, mar, reflejo, muelle, otras, lancha, cuerdaAmarre, isla, faro, puerta, tranca, reglas, escalones,
    cuarto, lente, haces, foco, halo, mLenteOn, luzLampara, luzLuna, vidrios, charco, gotas, salpicadura, mSalp, ondas, encendedor, chispa, luzEnc,
    lamparaE, luzLamE, remoMano, luzMuelle, animarAgua,
  };
}
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
