// Escenario de «El camión escolar». Medidas en metros, en coordenadas DEL CAMIÓN (el camión se queda quieto y la
// carretera se mueve en z, como el túnel de «Último vagón»): piso interior y = 0, techo interior 1.95, x ∈ [-1.15, 1.15]
// por dentro, el frente (parabrisas) en z = 4.9 y el cofre hasta z = 6.4; la carretera está en y = -0.8.
// Guía §8.6d: cada cosa con sus piezas típicas — asientos verdes con respaldo, costuras, tapa redonda y pata; volante
// con columna; tablero con relojes; palanca de la puerta; puerta de dos hojas con vidrio que SE ABRE (§8.6c);
// espejo de atrás que refleja de verdad (render a textura); limpiaparabrisas; letrero «ESCOLAR» y número 7; faros,
// defensa, parrilla, llantas con rin; parada con poste y letrero; puente de fierro con su letrero.
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { cartel } from "../comun/utileria";

export const BUS = { xi: 1.15, xo: 1.25, techo: 1.95, atras: -5.55, frente: 4.9, nariz: 6.4, suelo: -0.8 };
export const FILAS = [2.5, 1.7, 0.9, 0.1, -0.7, -1.5, -2.3, -3.1, -3.9, -4.7]; // centro del asiento de cada fila
export const ASIENTO_X = 0.68; // centro de la banca (±)
export const ASIENTO_Y = 0.44; // altura del cojín
export const PUERTA = { x: 1.2, z0: 3.45, z1: 4.35 };
export const CHOFER = { x: -0.7, z: 3.85 }; // centro del asiento del chofer (mira a +z)
export const VOLANTE = new THREE.Vector3(-0.7, 0.86, 4.3); // casi acostado (como en los camiones): nunca tapa la boca del chofer
export const ESPEJO = new THREE.Vector3(0.05, 1.74, 4.78);
export const PARADAS = [40, 150]; // z (de la carretera) de cada poste de parada
export const PUENTE = { z0: 300, z1: 332 };
export const CASA_SOLA = { x: 7.5, z: 346 };

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cil = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 18) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c;
};
const barraX = (largo: number, r: number, m: THREE.Material, x: number, y: number, z: number) => { const c = cil(r, r, largo, m, x, y, z, 12); c.rotation.z = Math.PI / 2; return c; };
const barraZ = (largo: number, r: number, m: THREE.Material, x: number, y: number, z: number) => { const c = cil(r, r, largo, m, x, y, z, 12); c.rotation.x = Math.PI / 2; return c; };
const plano = (w: number, h: number, m: THREE.Material, x: number, y: number, z: number, ry = 0) => {
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, y, z); p.rotation.y = ry; return p;
};

// ------------------------------------------------------------------ texturas
const texVinil = () => lienzo((c, w, h) => { // vinil verde de los asientos: costuras verticales, brillo y rayones
  c.fillStyle = "#2f6b4a"; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += w / 4) { const g = c.createLinearGradient(x, 0, x + w / 4, 0); g.addColorStop(0, "rgba(0,0,0,0.25)"); g.addColorStop(0.45, "rgba(150,220,180,0.16)"); g.addColorStop(1, "rgba(0,0,0,0.25)"); c.fillStyle = g; c.fillRect(x, 0, w / 4, h); }
  c.strokeStyle = "rgba(10,30,20,0.7)"; c.lineWidth = 3; c.setLineDash([7, 5]);
  for (let x = w / 4; x < w; x += w / 4) { c.beginPath(); c.moveTo(x, 6); c.lineTo(x, h - 6); c.stroke(); }
  c.setLineDash([]); c.strokeStyle = "rgba(200,240,210,0.18)"; c.lineWidth = 2;
  for (let k = 0; k < 7; k++) { c.beginPath(); c.moveTo((k * 61) % w, (k * 37) % h); c.lineTo((k * 61) % w + 20, (k * 37) % h + 6); c.stroke(); }
}, 256, 256);
const texPisoBus = () => lienzo((c, w, h) => { // hule negro con estrías a lo largo
  c.fillStyle = "#2a2b2e"; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 8) { c.fillStyle = "rgba(90,92,96,0.35)"; c.fillRect(x, 0, 3, h); }
  for (let k = 0; k < 60; k++) { c.fillStyle = "rgba(140,120,90,0.12)"; c.fillRect((k * 47) % w, (k * 83) % h, 10, 6); } // lodo
}, 128, 128, [3, 12]);
const texForro = () => lienzo((c, w, h) => { // lámina interior pintada con remaches
  c.fillStyle = "#cfcabd"; c.fillRect(0, 0, w, h);
  c.fillStyle = "rgba(60,55,45,0.35)"; for (let x = 6; x < w; x += 24) for (const y of [6, h - 8]) { c.beginPath(); c.arc(x, y, 2.5, 0, 7); c.fill(); }
  for (let k = 0; k < 30; k++) { c.fillStyle = "rgba(80,70,50,0.07)"; c.fillRect((k * 53) % w, (k * 29) % h, 14, 4); }
}, 256, 128, [6, 1]);
const texAmarillo = (rep: [number, number] = [1, 1]) => lienzo((c, w, h) => { // pintura amarilla con polvo y raspones
  c.fillStyle = "#f0b21a"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 120; k++) { c.fillStyle = k % 3 ? "rgba(120,80,20,0.08)" : "rgba(255,240,180,0.12)"; c.fillRect((k * 37) % w, (k * 71) % h, 8, 3); }
  const g = c.createLinearGradient(0, h * 0.7, 0, h); g.addColorStop(0, "rgba(90,70,40,0)"); g.addColorStop(1, "rgba(90,70,40,0.35)"); c.fillStyle = g; c.fillRect(0, 0, w, h); // lodo abajo
}, 256, 128, rep);
const texCarretera = () => lienzo((c, w, h) => { // un tramo de 6.8 × 8 m: asfalto, línea amarilla discontinua y orilla blanca
  c.fillStyle = "#3a3c40"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) { c.fillStyle = k % 2 ? "rgba(20,20,22,0.25)" : "rgba(110,110,110,0.12)"; c.fillRect((k * 37) % w, (k * 91) % h, 4, 3); }
  const xl = (3.4 / 6.8) * w; c.fillStyle = "#e0b030"; c.fillRect(xl - 4, 0, 8, h * 0.5); // línea central
  c.fillStyle = "#d8d8d0"; c.fillRect(w - 14, 0, 7, h); c.fillRect(7, 0, 7, h); // orillas
  c.fillStyle = "rgba(15,15,18,0.35)"; c.fillRect(w * 0.7, 0, w * 0.12, h); c.fillRect(w * 0.88, 0, w * 0.06, h); // huellas de llantas
}, 256, 300, [1, 60]);
const texPasto = () => lienzo((c, w, h) => {
  c.fillStyle = "#5e7244"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { c.fillStyle = k % 3 ? "rgba(40,60,30,0.3)" : "rgba(150,160,90,0.25)"; c.fillRect((k * 37) % w, (k * 91) % h, 2, 6); }
}, 128, 128, [10, 80]);
const texBanqueta = () => lienzo((c, w, h) => {
  c.fillStyle = "#9a958a"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(50,45,40,0.5)"; c.lineWidth = 3; for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
}, 64, 128, [1, 120]);
const texParrilla = () => lienzo((c, w, h) => { // parrilla negra con barras cromadas
  c.fillStyle = "#16171a"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#b8bcc2"; for (let y = 10; y < h; y += 22) c.fillRect(8, y, w - 16, 6);
  c.strokeStyle = "#d8dce2"; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
}, 256, 128);
const texTablero = () => lienzo((c, w, h) => { // dos relojes (velocidad y gasolina) con agujas, y focos de aviso
  c.fillStyle = "#1c1d20"; c.fillRect(0, 0, w, h);
  for (const [cx, rr, t] of [[w * 0.32, h * 0.38, "km/h"], [w * 0.72, h * 0.3, "GAS"]] as [number, number, string][]) {
    c.fillStyle = "#e8e4d8"; c.beginPath(); c.arc(cx, h * 0.5, rr, 0, 7); c.fill();
    c.lineWidth = 6; c.strokeStyle = "#8a8c90"; c.stroke();
    c.strokeStyle = "#202020"; c.lineWidth = 3;
    for (let k = 0; k <= 8; k++) { const a = Math.PI * (0.8 + k * 0.175); c.beginPath(); c.moveTo(cx + Math.cos(a) * rr * 0.75, h * 0.5 + Math.sin(a) * rr * 0.75); c.lineTo(cx + Math.cos(a) * rr * 0.92, h * 0.5 + Math.sin(a) * rr * 0.92); c.stroke(); }
    c.strokeStyle = "#d02a20"; c.lineWidth = 5; c.beginPath(); c.moveTo(cx, h * 0.5); c.lineTo(cx + Math.cos(Math.PI * 1.35) * rr * 0.8, h * 0.5 + Math.sin(Math.PI * 1.35) * rr * 0.8); c.stroke();
    c.fillStyle = "#202020"; c.font = "bold 16px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText(t, cx, h * 0.5 + rr * 0.5);
  }
  c.fillStyle = "#e0a020"; c.beginPath(); c.arc(w * 0.52, h * 0.82, 7, 0, 7); c.fill();
  c.fillStyle = "#30a040"; c.beginPath(); c.arc(w * 0.58, h * 0.82, 7, 0, 7); c.fill();
}, 256, 128);
const texReglas = () => lienzo((c, w, h) => { // la hoja del chofer viejo: cuadriculada, escrita a mano, con dobleces
  c.fillStyle = "#f2efe4"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(90,130,180,0.35)"; c.lineWidth = 1; for (let y = 0; y < h; y += 16) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let x = 0; x < w; x += 16) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  c.strokeStyle = "rgba(120,110,90,0.45)"; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.moveTo(0, h / 2); c.lineTo(w, h / 2); c.stroke(); // dobleces
  c.fillStyle = "#1a2a5a"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "left";
  c.fillText("CAMIÓN 7 — REGLAS", 26, 50);
  c.font = "bold 22px 'DejaVu Sans', sans-serif";
  ["1. CUENTA A LOS NIÑOS.", "   SI SOBRA UNO, CALLA.", "2. DESPUÉS DE LA ÚLTIMA", "   PARADA, NO MIRES EL", "   ESPEJO DE ATRÁS.", "3. NO TE DETENGAS EN", "   EL PUENTE VIEJO."].forEach((t, i) => c.fillText(t, 26, 104 + i * 40));
  c.fillStyle = "rgba(150,120,70,0.25)"; c.beginPath(); c.arc(w * 0.82, h * 0.85, 30, 0, 7); c.fill(); // mancha de café
}, 384, 420);
const texGotas = () => lienzo((c, w, h) => { // gotas y escurridos sobre el vidrio
  c.clearRect(0, 0, w, h);
  for (let k = 0; k < 140; k++) {
    const x = (k * 97) % w, y = (k * 57) % h, r = 2 + (k % 4);
    c.fillStyle = "rgba(150,175,200,0.35)"; c.beginPath(); c.ellipse(x, y, r * 1.4, r * 1.8, 0, 0, 7); c.fill();
    c.strokeStyle = "rgba(20,30,40,0.35)"; c.lineWidth = 1; c.stroke();
    c.fillStyle = "rgba(255,255,255,0.6)"; c.fillRect(x - 1, y - r * 0.8, 2, 2);
    if (k % 6 === 0) { c.strokeStyle = "rgba(220,235,255,0.35)"; c.lineWidth = 2; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 2, y + 30 + (k % 5) * 8); c.stroke(); }
  }
}, 256, 256);
const texVaho = () => lienzo((c, w, h) => { // vaho que empaña el espejo (blanco lechoso, más denso en las orillas)
  const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.6); g.addColorStop(0, "rgba(225,230,235,0.75)"); g.addColorStop(1, "rgba(235,238,240,0.98)");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { c.fillStyle = "rgba(255,255,255,0.5)"; c.beginPath(); c.arc((k * 53) % w, (k * 31) % h, 3, 0, 7); c.fill(); }
}, 256, 96);
const texOxido = (base: string) => lienzo((c, w, h) => { // fierro viejo con óxido
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 160; k++) { c.fillStyle = k % 2 ? "rgba(150,70,30,0.3)" : "rgba(30,20,15,0.25)"; c.beginPath(); c.arc((k * 37) % w, (k * 71) % h, 2 + (k % 5), 0, 7); c.fill(); }
}, 128, 128);

// ------------------------------------------------------------------ camión
function crearCamion() {
  const g = new THREE.Group();
  const amarillo = lambert({ map: texAmarillo([2, 1]) }), negro = lambert({ color: "#141518" }), cromo = lambert({ color: "#c8ccd2", emissive: "#202428" });
  const forro = lambert({ map: texForro() }), techoM = lambert({ color: "#dedad0" }), vinil = lambert({ map: texVinil() }), vinilOsc = lambert({ color: "#24553a" });
  const metal = lambert({ color: "#6a6e74" }), hule = lambert({ color: "#1d1e22" });
  const vidrio = new THREE.MeshBasicMaterial({ color: "#b8d0dc", transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide });
  const { xi, xo, techo, atras, frente } = BUS;
  const L = frente - atras, zc = (frente + atras) / 2;

  // piso (con el hueco de la escalera en la puerta) y escalones
  const mPiso = lambert({ map: texPisoBus() });
  g.add(caja(xi * 2 - 0.55, 0.08, L, mPiso, -0.275, -0.04, zc));
  g.add(caja(0.55, 0.08, PUERTA.z0 - atras, mPiso, xi - 0.275, -0.04, (PUERTA.z0 + atras) / 2));
  g.add(caja(0.55, 0.08, frente - PUERTA.z1, mPiso, xi - 0.275, -0.04, (frente + PUERTA.z1) / 2));
  const mEsc = lambert({ color: "#2e2f33" }), orilla = lambert({ color: "#d8b020" });
  g.add(caja(0.55, 0.06, 0.88, mEsc, xi - 0.275, -0.29, (PUERTA.z0 + PUERTA.z1) / 2)); g.add(caja(0.55, 0.012, 0.03, orilla, xi - 0.275, -0.254, PUERTA.z0 + 0.03)); // escalón 1 con orilla amarilla
  g.add(caja(0.3, 0.06, 0.88, mEsc, xi - 0.1, -0.56, (PUERTA.z0 + PUERTA.z1) / 2));
  g.add(caja(0.012, 0.3, 0.88, mEsc, xi - 0.56, -0.15, (PUERTA.z0 + PUERTA.z1) / 2)); // contraescalón
  // pasamanos de la puerta
  g.add(barraZ(0.7, 0.018, cromo, xi - 0.5, 0.95, (PUERTA.z0 + PUERTA.z1) / 2));
  g.add(cil(0.018, 0.018, 1.2, cromo, xi - 0.5, 0.35, PUERTA.z0 + 0.1));

  // carrocería: faldón amarillo, franjas negras, banda de ventanas con postes, franja alta con letrero y techo
  const ventanaZ: [number, number][] = [];
  for (let k = 0; k < FILAS.length; k++) ventanaZ.push([FILAS[k] - 0.38, FILAS[k] + 0.32]);
  for (const s of [-1, 1]) {
    const x = s * (xi + 0.05);
    // faldón (por fuera amarillo, por dentro forro): la puerta deja hueco del lado derecho
    const tramos: [number, number][] = s > 0 ? [[atras, PUERTA.z0], [PUERTA.z1, frente]] : [[atras, frente]];
    for (const [a, b] of tramos) {
      g.add(caja(0.1, 1.5, b - a, amarillo, x, 0.2, (a + b) / 2)); // de -0.55 a 0.95
      g.add(plano(b - a, 0.95, forro, s * (xi - 0.006), 0.475, (a + b) / 2, -s * Math.PI / 2)); // forro por dentro
      for (const y of [0.05, 0.45]) g.add(caja(0.012, 0.09, b - a, negro, s * (xo + 0.006), y, (a + b) / 2)); // franjas negras
      g.add(caja(0.12, 0.05, b - a, negro, x, 0.97, (a + b) / 2)); // hule bajo las ventanas
    }
    // franja alta y techo
    g.add(caja(0.1, 0.5, L, amarillo, x, 1.9, zc));
    g.add(plano(L, 0.3, techoM, s * (xi - 0.006), 1.8, zc, -s * Math.PI / 2));
    // postes entre ventanas (y el marco de abajo)
    const postes: [number, number][] = [[(atras + ventanaZ[FILAS.length - 1][0]) / 2, ventanaZ[FILAS.length - 1][0] - atras], ...ventanaZ.slice(0, -1).map(([a]) => [a - 0.03, 0.09] as [number, number]), [ventanaZ[0][1] + 0.03, 0.09], [3.3, 0.09], [frente - 0.06, 0.09]];
    if (s > 0) postes.push([3.39, 0.1], [4.4, 0.09]); else postes.push([4.1, 0.09]);
    for (const [pz, pw] of postes) g.add(caja(0.09, 0.7, pw, amarillo, x, 1.3, pz));
    // vidrios
    const vidrios: [number, number][] = [...ventanaZ, [ventanaZ[0][1] + 0.08, 3.25]];
    if (s > 0) vidrios.push([4.45, frente - 0.11]);
    for (const [a, b] of vidrios) g.add(plano(b - a, 0.68, vidrio, s * (xo - 0.05), 1.3, (a + b) / 2, s * Math.PI / 2));
    if (s < 0) g.add(plano(frente - 3.4, 0.68, vidrio, -(xo - 0.05), 1.3, (frente + 3.35) / 2, -Math.PI / 2)); // ventana del chofer
  }
  // techo con orillas redondeadas
  g.add(caja(xo * 2, 0.06, L, amarillo, 0, 2.18, zc));
  for (const s of [-1, 1]) { const t = barraZ(L, 0.07, amarillo, s * (xo - 0.04), 2.13, zc); g.add(t); }
  g.add(plano(xi * 2, L, techoM, 0, techo, zc)); g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  // tiras de luz en el techo (se prenden con la lluvia)
  const mLuz = brillo("#fff3d8"), lucesTecho: THREE.Mesh[] = [];
  for (const s of [-1, 1]) for (const z of [2.1, -0.3, -2.7]) { const l = caja(0.08, 0.02, 1.1, mLuz, s * 0.45, techo - 0.03, z); l.layers.set(NOINK); g.add(l); lucesTecho.push(l); }
  // pared de atrás con puerta de emergencia
  g.add(caja(xo * 2, 2.75, 0.1, amarillo, 0, 0.82, atras - 0.05));
  g.add(plano(xi * 2, 1.95, forro, 0, 0.975, atras + 0.006));
  g.add(caja(0.82, 1.7, 0.03, lambert({ color: "#b8b4a8" }), 0, 0.9, atras + 0.02)); // puerta de emergencia
  g.add(plano(0.6, 0.55, vidrio, 0, 1.38, atras + 0.04));
  g.add(caja(0.66, 0.04, 0.03, negro, 0, 1.08, atras + 0.04)); g.add(caja(0.66, 0.04, 0.03, negro, 0, 1.67, atras + 0.04));
  g.add(barraX(0.5, 0.025, lambert({ color: "#c0302a" }), 0.0, 0.85, atras + 0.09)); // manija roja
  const sal = cartel(["SALIDA DE", "EMERGENCIA"], "#c0302a", "#ffffff", 0.62, 0.17, 0.15); sal.position.set(0, 1.83, atras + 0.04); g.add(sal);
  for (const s of [-1, 1]) { const t = caja(0.16, 0.22, 0.04, brillo("#8a1410"), s * 0.95, 0.35, atras - 0.12); g.add(t); } // calaveras
  const salAfuera = cartel(["SALIDA DE EMERGENCIA"], "#141518", "#f0b21a", 0.9, 0.12); salAfuera.position.set(0, 1.83, atras - 0.105); salAfuera.rotation.y = Math.PI; g.add(salAfuera);

  // letreros de los costados: «ESCOLAR» y el número 7
  for (const s of [-1, 1]) {
    const t = cartel(["ESCOLAR · RUTA DEL PUEBLO"], "#f0b21a", "#141518", 4.2, 0.32, 0, "#f0b21a"); t.position.set(s * (xo + 0.006), 1.9, -0.3); t.rotation.y = s * Math.PI / 2; g.add(t);
    const n = cartel(["7"], "#f0b21a", "#141518", 0.5, 0.5, 0, "#141518"); n.position.set(s * (xo + 0.022), 0.62, s > 0 ? 2.6 : 3.4); n.rotation.y = s * Math.PI / 2; g.add(n);
  }

  // frente: marco del parabrisas, letrero superior con luces, cofre, parrilla, faros, defensa y salpicaderas
  g.add(caja(xo * 2, 0.08, 0.1, amarillo, 0, 0.93, frente + 0.03));
  g.add(caja(0.1, 0.95, 0.1, negro, 0.05, 1.42, frente + 0.02)); // poste central del parabrisas
  for (const s of [-1, 1]) g.add(caja(0.12, 1.0, 0.12, amarillo, s * (xo - 0.06), 1.42, frente));
  g.add(caja(xo * 2 + 0.02, 0.3, 0.12, amarillo, 0, 2.03, frente + 0.01));
  const esc = cartel(["ESCOLAR"], "#f0b21a", "#141518", 1.2, 0.22, 0, "#f0b21a"); esc.position.set(0, 2.03, frente + 0.075); g.add(esc);
  const luzAmbar: THREE.Mesh[] = [];
  for (const s of [-1, 1]) for (const k of [0, 1]) { const l = cil(0.06, 0.06, 0.04, brillo(k ? "#d83a20" : "#e89a20"), s * (0.85 - k * 0.18), 2.03, frente + 0.08); l.rotation.x = Math.PI / 2; g.add(l); luzAmbar.push(l); }
  g.add(plano(xi * 2 - 0.05, 0.92, vidrio, 0, 1.42, frente));
  const dz = BUS.nariz - frente;
  g.add(caja(2.0, 1.2, dz, amarillo, 0, 0.15, frente + dz / 2)); // cofre
  g.add(caja(1.9, 0.04, dz - 0.1, lambert({ color: "#e0a414" }), 0, 0.77, frente + dz / 2)); // tapa del cofre
  const par = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.6), lambert({ map: texParrilla() })); par.position.set(0, 0.3, BUS.nariz + 0.006); g.add(par);
  const faros: THREE.Object3D[] = [];
  for (const s of [-1, 1]) {
    const aro = cil(0.15, 0.15, 0.06, cromo, s * 0.72, 0.35, BUS.nariz + 0.02); aro.rotation.x = Math.PI / 2; g.add(aro);
    const f = cil(0.12, 0.12, 0.02, brillo("#fff6dc"), s * 0.72, 0.35, BUS.nariz + 0.052); f.rotation.x = Math.PI / 2; f.layers.set(NOINK); g.add(f); faros.push(f);
    const h = destello(255, 240, 210, 1.4, 0.0); h.position.set(s * 0.72, 0.35, BUS.nariz + 0.25); g.add(h); faros.push(h);
    g.add(caja(0.42, 0.1, dz - 0.05, negro, s * 1.06, 0.36, frente + 0.05 + (dz - 0.05) / 2)); // salpicadera
  }
  g.add(caja(xo * 2 + 0.1, 0.2, 0.18, negro, 0, -0.45, BUS.nariz + 0.09)); // defensa
  const placa = cartel(["ESC-07"], "#e8e8e0", "#141518", 0.36, 0.13); placa.position.set(0, -0.45, BUS.nariz + 0.185); g.add(placa);
  // espejos laterales de fuera (en su brazo)
  for (const s of [-1, 1]) {
    g.add(barraX(0.35, 0.015, negro, s * (xo + 0.17), 1.45, frente + 0.1));
    g.add(caja(0.05, 0.38, 0.2, negro, s * (xo + 0.36), 1.45, frente + 0.1));
    g.add(plano(0.16, 0.33, lambert({ color: "#9aaab8", emissive: "#303844" }), s * (xo + 0.36), 1.45, frente - 0.002, Math.PI));
  }
  // llantas (rin, tuercas, cara) — giran con la velocidad
  const llantas: THREE.Group[] = [];
  for (const z of [5.55, -3.2]) for (const s of [-1, 1]) {
    const ll = new THREE.Group(); ll.position.set(s * 1.12, -0.3, z);
    const t = cil(0.5, 0.5, 0.3, hule, 0, 0, 0, 24); t.rotation.z = Math.PI / 2; ll.add(t);
    const rin = cil(0.27, 0.27, 0.31, lambert({ color: "#b8bcc0" }), 0, 0, 0, 16); rin.rotation.z = Math.PI / 2; ll.add(rin);
    for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; ll.add(caja(0.33, 0.035, 0.035, metal, 0, Math.sin(a) * 0.15, Math.cos(a) * 0.15)); }
    g.add(ll); llantas.push(ll);
    const ceja = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.05, 8, 20, Math.PI), negro); ceja.rotation.y = Math.PI / 2; ceja.position.set(s * 1.28, -0.3, z); g.add(ceja); // ceja sobre la llanta
  }
  g.add(caja(xo * 2 - 0.2, 0.25, L - 0.6, lambert({ color: "#1c1c1e" }), 0, -0.62, zc)); // chasis

  // ---- puerta de dos hojas (cada una con vidrio arriba y abajo y hule en la orilla); se abren hacia adentro ----
  const hojas: THREE.Group[] = [];
  for (const [zh, dir] of [[PUERTA.z0, 1], [PUERTA.z1, -1]] as [number, number][]) {
    const piv = new THREE.Group(); piv.position.set(PUERTA.x, 0, zh);
    const w = (PUERTA.z1 - PUERTA.z0) / 2 - 0.01;
    const zm = dir * w / 2;
    piv.add(caja(0.04, 0.12, w, amarillo, 0, -0.5, zm)); piv.add(caja(0.04, 0.12, w, amarillo, 0, 0.85, zm)); piv.add(caja(0.04, 0.08, w, amarillo, 0, 1.57, zm));
    piv.add(caja(0.04, 2.17, 0.06, amarillo, 0, 0.525, dir * 0.03)); piv.add(caja(0.045, 2.17, 0.05, hule, 0, 0.525, dir * (w - 0.025)));
    piv.add(plano(w - 0.12, 0.6, vidrio, 0.0, 1.21, zm, Math.PI / 2)); piv.add(plano(w - 0.12, 1.2, vidrio, 0.0, 0.17, zm, Math.PI / 2));
    g.add(piv); hojas.push(piv);
  }
  const leyenda = cartel(["ALTO"], "#c0302a", "#ffffff", 0.32, 0.32, 0.1, "#ffffff"); leyenda.position.set(-(xo + 0.02), 0.62, 4.25); leyenda.rotation.y = -Math.PI / 2; g.add(leyenda); // letrero de alto del lado del chofer

  // ---- puesto del chofer: tablero con relojes, volante con columna, palanca de la puerta, asiento, mampara ----
  g.add(caja(xi * 2, 0.45, 0.42, lambert({ color: "#2a2c30" }), 0, 0.7, frente - 0.21)); // tablero
  g.add(caja(xi * 2, 0.03, 0.46, lambert({ color: "#1a1b1e" }), 0, 0.94, frente - 0.23));
  const reloj = plano(0.5, 0.25, lambert({ map: texTablero(), emissive: "#ffffff", emissiveIntensity: 0.15 }), CHOFER.x, 0.78, frente - 0.425, Math.PI); g.add(reloj);
  reloj.rotation.y = Math.PI;
  const hoja = plano(0.21, 0.23, lambert({ map: texReglas(), emissive: "#ffffff", emissiveIntensity: 0.08 }), -0.18, 0.962, frente - 0.3); hoja.rotation.x = -Math.PI / 2; hoja.rotation.z = Math.PI + 0.12; g.add(hoja); // la hoja pegada en el tablero
  for (const [x, z] of [[-0.27, 4.5], [-0.09, 4.52]]) g.add(caja(0.05, 0.004, 0.02, lambert({ color: "#e8e0b0" }), x, 0.967, z)); // cinta canela
  const col = cil(0.045, 0.06, 0.34, negro, CHOFER.x, 0.74, 4.42); col.rotation.x = -1.0; g.add(col); // columna
  const volante = new THREE.Group(); volante.position.copy(VOLANTE); volante.rotation.x = -1.15;
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 10, 32), negro); volante.add(aro);
  for (let k = 0; k < 3; k++) { const r = caja(0.2, 0.03, 0.015, metal, 0, 0, 0); r.rotation.z = k * 2.094 + Math.PI / 2; r.position.set(Math.cos(k * 2.094 + Math.PI / 2) * 0.1, Math.sin(k * 2.094 + Math.PI / 2) * 0.1, 0); volante.add(r); }
  volante.add(cil(0.05, 0.05, 0.04, metal, 0, 0, 0)); volante.children[volante.children.length - 1].rotation.x = Math.PI / 2;
  g.add(volante);
  const palanca = new THREE.Group(); palanca.position.set(-0.2, 0.72, frente - 0.5); g.add(caja(0.08, 0.06, 0.04, lambert({ color: "#1a1b1e" }), -0.2, 0.72, frente - 0.44)); // palanca de la puerta, junto al chofer
  palanca.add(cil(0.012, 0.012, 0.42, cromo, 0, 0.21, 0)); palanca.add(new THREE.Mesh(new THREE.SphereGeometry(0.04, 12, 8), lambert({ color: "#141518" })));
  palanca.children[1].position.y = 0.43; palanca.rotation.z = 0.5; g.add(palanca);
  // asiento del chofer: base, cojín, respaldo alto con cabecera
  const asiento = new THREE.Group(); asiento.position.set(CHOFER.x, 0, CHOFER.z);
  asiento.add(cil(0.05, 0.08, 0.36, metal, 0, 0.18, 0));
  asiento.add(caja(0.56, 0.1, 0.5, vinilOsc, 0, 0.42, 0.0));
  asiento.add(caja(0.6, 0.72, 0.12, lambert({ color: "#2a2e36" }), 0, 0.86, -0.28)); asiento.add(caja(0.36, 0.2, 0.1, lambert({ color: "#2a2e36" }), 0, 1.33, -0.29));
  g.add(asiento);
  // mamparas acolchadas detrás de la puerta y del chofer
  for (const s of [-1, 1]) {
    g.add(caja(0.86, 0.72, 0.08, vinil, s * ASIENTO_X, 0.38, 3.08)); g.add(barraX(0.86, 0.05, vinilOsc, s * ASIENTO_X, 0.75, 3.08)); // más baja que la cara de quien va sentado atrás
    g.add(barraX(0.86, 0.016, cromo, s * ASIENTO_X, 0.84, 3.08)); for (const dx of [-0.42, 0.42]) g.add(cil(0.016, 0.016, 0.84, cromo, s * ASIENTO_X + dx, 0.42, 3.08));
  }
  // barra de techo para agarrarse
  for (const s of [-1, 1]) g.add(barraZ(L - 2, 0.016, cromo, s * 0.3, 1.82, zc - 0.5));
  // espejo de atrás (refleja de verdad: se le pone la textura del render del espejo) y el vaho
  const espejo = new THREE.Group(); espejo.position.copy(ESPEJO);
  espejo.add(cil(0.01, 0.01, 0.2, negro, 0, 0.14, 0.02));
  espejo.add(caja(0.56, 0.17, 0.04, negro, 0, 0, 0.02));
  const cristal = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.13), new THREE.MeshBasicMaterial({ color: "#d8dde2", toneMapped: false })); cristal.rotation.y = Math.PI; cristal.position.z = -0.0015; cristal.layers.set(NOINK); espejo.add(cristal);
  const vaho = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.13), new THREE.MeshBasicMaterial({ map: texVaho(), transparent: true, opacity: 0, depthWrite: false })); vaho.rotation.y = Math.PI; vaho.position.z = -0.007; vaho.layers.set(NOINK); espejo.add(vaho);
  espejo.rotation.y = 0.12; espejo.rotation.x = -0.08; g.add(espejo);
  // limpiaparabrisas (pivote abajo del vidrio, por fuera)
  const limpias: THREE.Group[] = [];
  for (const x of [-0.6, 0.45]) { const l = new THREE.Group(); l.position.set(x, 0.99, frente + 0.1); l.add(caja(0.025, 0.85, 0.02, negro, 0, 0.42, 0)); l.add(caja(0.012, 0.85, 0.035, hule, 0.01, 0.42, 0.015)); l.rotation.z = 1.2; g.add(l); limpias.push(l); }
  // gotas sobre el parabrisas y las ventanas (solo con lluvia)
  const tg = texGotas(); tg.wrapS = tg.wrapT = THREE.RepeatWrapping;
  const mGotas = new THREE.MeshBasicMaterial({ map: tg, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const tg2 = texGotas(); tg2.wrapS = tg2.wrapT = THREE.RepeatWrapping; tg2.repeat.set(4, 2); // en el parabrisas, gotas chiquitas (no tapan la cara del chofer)
  const mGotasPara = new THREE.MeshBasicMaterial({ map: tg2, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const gotasPara = plano(xi * 2 - 0.1, 0.9, mGotasPara, 0, 1.42, frente + 0.006); gotasPara.layers.set(NOINK); g.add(gotasPara);
  for (const [s, a, b] of [[-1, atras + 0.2, frente - 0.1], [1, atras + 0.2, 3.3]]) { const gv = plano(b - a, 0.66, mGotas, s * (xo - 0.04), 1.3, (a + b) / 2, s * Math.PI / 2); gv.layers.set(NOINK); g.add(gv); }

  // ---- asientos: banca con cojín, faldón, respaldo con costuras, tapa redonda, agarradera cromada y pata ----
  for (const z of FILAS) for (const s of [-1, 1]) {
    const x = s * ASIENTO_X;
    g.add(caja(0.84, 0.1, 0.44, vinil, x, ASIENTO_Y - 0.05, z));
    g.add(caja(0.84, 0.24, 0.02, vinilOsc, x, ASIENTO_Y - 0.2, z + 0.2));
    g.add(caja(0.84, 0.4, 0.09, vinil, x, ASIENTO_Y + 0.2, z - 0.27));
    g.add(barraX(0.84, 0.05, vinilOsc, x, ASIENTO_Y + 0.4, z - 0.27));
    g.add(barraX(0.22, 0.014, cromo, x - s * 0.3, ASIENTO_Y + 0.48, z - 0.27)); // agarradera
    for (const dx of [-0.11, 0.11]) g.add(cil(0.012, 0.012, 0.08, cromo, x - s * 0.3 + dx, ASIENTO_Y + 0.44, z - 0.27));
    g.add(cil(0.02, 0.02, ASIENTO_Y - 0.1, metal, x - s * 0.36, (ASIENTO_Y - 0.1) / 2, z)); // pata del lado del pasillo
    g.add(caja(0.03, 0.2, 0.3, metal, s * (xi - 0.03), ASIENTO_Y - 0.15, z)); // soporte a la pared
  }
  // utilería: mochila olvidada, cartel de reglamento, bote de basura, extintor
  const reg = cartel(["REGLAMENTO", "NO SACAR LA CABEZA", "NO GRITAR · NO COMER"], "#f2efe4", "#1a2a5a", 0.42, 0.3); reg.position.set(xi - 0.003, 1.82, 1.2); reg.rotation.y = -Math.PI / 2; g.add(reg);
  const ext = new THREE.Group(); ext.position.set(xi - 0.1, 0, 3.3); ext.add(cil(0.07, 0.07, 0.4, lambert({ color: "#c02a20" }), 0, 0.42, 0)); ext.add(cil(0.025, 0.04, 0.08, negro, 0, 0.66, 0)); g.add(ext);
  g.add(cil(0.13, 0.11, 0.35, lambert({ color: "#3a4a5a" }), -xi + 0.15, 0.18, 3.25)); // bote de basura

  const luzInt = [new THREE.PointLight("#fff1d6", 0, 7, 1.3), new THREE.PointLight("#fff1d6", 0, 7, 1.3)];
  luzInt[0].position.set(0, 1.55, 2.0); luzInt[1].position.set(0, 1.55, -2.6); g.add(...luzInt);
  const luzFaros = new THREE.SpotLight("#fff2d8", 0, 40, 0.42, 0.5, 1.2); luzFaros.position.set(0, 0.4, BUS.nariz + 0.2); luzFaros.target.position.set(0, -0.8, 30); g.add(luzFaros, luzFaros.target);
  return { g, hojas, llantas, limpias, cristal, vaho, mGotas, mGotasPara, faros, luzAmbar, lucesTecho, luzInt, luzFaros, espejo };
}


/** casa de pueblo vista desde la calle (frente hacia −x): muros con zoclo, techo de dos aguas de teja, puerta con marco
 *  y perilla, ventanas con marco, cruz y reja, y su letrero si tiene negocio */
const casaPueblo = (ancho: number, alto: number, fondo: number, pared: string, luz: boolean, letrero?: [string[], string]) => {
  const g = new THREE.Group(), xf = -fondo / 2;
  g.add(caja(fondo, alto, ancho, lambert({ color: pared }), 0, alto / 2, 0));
  g.add(caja(0.03, 0.5, ancho, lambert({ color: "#5a4a3a" }), xf - 0.015, 0.25, 0)); // zoclo
  const teja = lambert({ map: texTeja() });
  for (const s of [-1, 1]) { const t = caja(fondo / 2 / Math.cos(0.42) + 0.3, 0.08, ancho + 0.3, teja, s * fondo / 4, alto + Math.tan(0.42) * fondo / 4, 0); t.rotation.z = -s * 0.42; g.add(t); }
  const fr = new THREE.Shape([new THREE.Vector2(-fondo / 2, 0), new THREE.Vector2(fondo / 2, 0), new THREE.Vector2(0, Math.tan(0.42) * fondo / 2)]);
  for (const z of [-ancho / 2, ancho / 2]) { const m = new THREE.Mesh(new THREE.ShapeGeometry(fr), lambert({ color: pared, side: THREE.DoubleSide })); m.position.set(0, alto, z); g.add(m); } // hastiales
  // puerta
  g.add(caja(0.06, 2.1, 1.1, lambert({ color: "#e8e0d0" }), xf - 0.03, 1.05, 0)); // marco
  g.add(caja(0.05, 1.98, 0.92, lambert({ color: "#5a3a22" }), xf - 0.06, 0.99, 0));
  g.add(new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 6), lambert({ color: "#c8a040" }))); g.children[g.children.length - 1].position.set(xf - 0.1, 1.0, 0.33);
  // ventanas a los lados de la puerta
  for (const z of [-ancho * 0.3, ancho * 0.3]) {
    g.add(caja(0.05, 1.1, 1.2, lambert({ color: "#e8e0d0" }), xf - 0.025, 1.55, z));
    const v = plano(1.02, 0.92, new THREE.MeshBasicMaterial({ color: luz ? "#ffc56e" : "#1a2028", toneMapped: false }), xf - 0.056, 1.55, z, -Math.PI / 2); v.layers.set(NOINK); g.add(v);
    g.add(caja(0.02, 0.92, 0.04, lambert({ color: "#e8e0d0" }), xf - 0.065, 1.55, z)); g.add(caja(0.02, 0.04, 1.02, lambert({ color: "#e8e0d0" }), xf - 0.065, 1.55, z)); // cruz
    for (let k = -2; k <= 2; k++) g.add(caja(0.015, 1.0, 0.015, lambert({ color: "#202224" }), xf - 0.11, 1.55, z + k * 0.2)); // reja
  }
  if (letrero) { const c = cartel(letrero[0], "#efe6d0", letrero[1], ancho * 0.7, 0.6); c.position.set(xf - 0.08, alto - 0.42, 0); c.rotation.y = -Math.PI / 2; g.add(c); }
  return g;
};
const texTeja = () => lienzo((c, w, h) => { // teja de barro en hileras
  c.fillStyle = "#9a4a2e"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 16) for (let x = (y / 16) % 2 ? 0 : 12; x < w; x += 24) { c.fillStyle = "rgba(60,20,10,0.35)"; c.fillRect(x, y, 3, 16); c.fillStyle = "rgba(255,180,140,0.12)"; c.fillRect(x + 4, y + 2, 14, 4); }
  for (let y = 0; y < h; y += 16) { c.fillStyle = "rgba(40,15,8,0.45)"; c.fillRect(0, y, w, 2); }
}, 128, 128, [3, 3]);

// ------------------------------------------------------------------ carretera, pueblo, paradas, puente
function crearCarretera() {
  const g = new THREE.Group();
  const Y = BUS.suelo;
  const tramos: [number, number][] = [[-80, PUENTE.z0 - 4], [PUENTE.z1 + 4, 520]];
  for (const [a, b] of tramos) {
    const t = texCarretera(); t.repeat.set(1, (b - a) / 8);
    const r = new THREE.Mesh(new THREE.PlaneGeometry(6.8, b - a), lambert({ map: t })); r.rotation.x = -Math.PI / 2; r.position.set(-1.6, Y, (a + b) / 2); g.add(r);
    const tb = texBanqueta(); tb.repeat.set(1, (b - a) / 3);
    g.add(caja(1.6, 0.12, b - a, lambert({ map: tb }), 2.6, Y + 0.05, (a + b) / 2)); // banqueta
    g.add(caja(0.12, 0.13, b - a, lambert({ color: "#c8c2b0" }), 1.84, Y + 0.055, (a + b) / 2)); // guarnición
    for (const [x0, x1] of [[3.4, 40], [-40, -5.0]]) {
      const tp = texPasto(); tp.repeat.set((x1 - x0) / 6, (b - a) / 6);
      const p = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, b - a), lambert({ map: tp })); p.rotation.x = -Math.PI / 2; p.position.set((x0 + x1) / 2, Y - 0.01, (a + b) / 2); g.add(p);
    }
  }
  // casas del pueblo a la derecha (y algunas a la izquierda), con letreros pintados
  const colores = ["#c97a5a", "#d8c08a", "#7a9ab0", "#b8a0c8", "#9ab88a", "#d89a7a", "#e0d0b0"];
  const letreros: [number, string[], string][] = [[2, ["TORTILLERÍA", "LA GÜERA"], "#2a7a3a"], [5, ["ABARROTES", "DOÑA LUPE"], "#b8262e"], [9, ["PAPELERÍA"], "#2f5aa8"], [13, ["FARMACIA"], "#2a7a3a"], [17, ["TALLER", "EL GÜERO"], "#3a3a3a"]];
  for (let i = 0; i < 26; i++) {
    const z = -40 + i * 11; if (z > 255) break;
    const h = 2.6 + (i % 3) * 0.4, w = 6 + (i % 2) * 2;
    const l = letreros.find(([k]) => k === i);
    const c = casaPueblo(w, h, 5, colores[i % colores.length], i % 2 === 0, l ? [l[1], l[2]] : undefined); c.position.set(8, Y, z); g.add(c);
    if (i % 3 === 1) { const c2 = casaPueblo(7, 2.8, 6, colores[(i + 3) % colores.length], true); c2.position.set(-13, Y, z + 3); c2.rotation.y = Math.PI; g.add(c2); }
  }
  // árboles y postes de luz con cables
  const tronco = lambert({ color: "#4a3a2a" }), copa = lambert({ color: "#3e6a3a" }), copa2 = lambert({ color: "#4e7a40" });
  for (let i = 0; i < 40; i++) {
    const z = -30 + i * 13.3 + (i % 3) * 2; if (z > PUERTA.z0 + 500) break;
    if (z > PUENTE.z0 - 8 && z < PUENTE.z1 + 8) continue;
    const x = i % 2 ? 4.4 : -6.5;
    g.add(cil(0.14, 0.2, 2.4, tronco, x, Y + 1.2, z));
    for (const [dx, dy, r, m] of [[0, 3.0, 1.2, copa], [0.6, 2.6, 0.9, copa2], [-0.5, 2.7, 0.85, copa2]] as [number, number, number, THREE.Material][]) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), m); s.position.set(x + dx, Y + dy, z); g.add(s); }
  }
  const mPoste = lambert({ color: "#7a746a" }), mCable = lambert({ color: "#16171a" });
  for (let i = 0; i < 24; i++) {
    const z = -40 + i * 22; if (z > PUENTE.z0 - 6 && z < PUENTE.z1 + 6) continue;
    g.add(cil(0.09, 0.12, 7, mPoste, 3.0, Y + 3.5, z));
    g.add(caja(1.4, 0.1, 0.1, mPoste, 3.0, Y + 6.6, z));
    for (const dx of [-0.6, 0.6]) g.add(caja(0.015, 0.015, 22, mCable, 3.0 + dx, Y + 6.4, z + 11));
  }
  // paradas: poste con letrero y techito con banca
  const paradas: THREE.Group[] = [];
  for (const zp of PARADAS) {
    const p = new THREE.Group(); p.position.set(0, Y, zp);
    p.add(cil(0.035, 0.035, 2.4, lambert({ color: "#9a9ea4" }), 2.2, 1.2, 0));
    const s = cartel(["PARADA", "ESCOLAR"], "#f0b21a", "#141518", 0.55, 0.42, 0.05); s.position.set(2.2, 2.2, 0.04); p.add(s);
    const s2 = cartel(["PARADA", "ESCOLAR"], "#f0b21a", "#141518", 0.55, 0.42, 0.05); s2.position.set(2.2, 2.2, -0.04); s2.rotation.y = Math.PI; p.add(s2);
    // techito de lámina con su banca, detrás del poste
    for (const dz of [-1.0, 1.0]) p.add(cil(0.04, 0.04, 2.3, lambert({ color: "#4a5a6a" }), 3.3, 1.15, dz - 6.5));
    p.add(caja(1.2, 0.05, 2.5, lambert({ color: "#3a6a8a" }), 3.3, 2.32, -6.5));
    p.add(caja(0.4, 0.06, 1.8, lambert({ color: "#7a5a3a" }), 3.3, 0.45, -6.5)); for (const dz of [-0.8, 0.8]) p.add(caja(0.35, 0.42, 0.05, lambert({ color: "#4a5a6a" }), 3.3, 0.21, dz - 6.5));
    g.add(p); paradas.push(p);
  }
  // río y puente viejo de fierro (armadura con diagonales, óxido) con su letrero; la casa sola al otro lado
  const zr0 = PUENTE.z0 - 4, zr1 = PUENTE.z1 + 4;
  const rio = new THREE.Mesh(new THREE.PlaneGeometry(80, zr1 - zr0), lambert({ color: "#4a5a62" })); rio.rotation.x = -Math.PI / 2; rio.position.set(0, Y - 3.2, (zr0 + zr1) / 2); g.add(rio);
  for (const [z, dir] of [[zr0, 1], [zr1, -1]] as [number, number][]) { // taludes
    const t = caja(80, 3.4, 4, lambert({ color: "#5a5040" }), 0, Y - 1.7, z - dir * 2); t.rotation.x = dir * 0.35; g.add(t);
  }
  const ox = lambert({ map: texOxido("#5a4a42") }), ox2 = lambert({ map: texOxido("#6a4a36") });
  const largo = PUENTE.z1 - PUENTE.z0 + 8, zm = (PUENTE.z0 + PUENTE.z1) / 2;
  g.add(caja(7.2, 0.3, largo, lambert({ color: "#3a3a3a" }), -1.6, Y - 0.15, zm)); // tablero del puente
  const tp = texCarretera(); tp.repeat.set(1, largo / 8);
  const dk = new THREE.Mesh(new THREE.PlaneGeometry(6.8, largo), lambert({ map: tp })); dk.rotation.x = -Math.PI / 2; dk.position.set(-1.6, Y + 0.006, zm); g.add(dk);
  for (const x of [-5.4, 2.2]) {
    g.add(caja(0.25, 0.25, largo, ox, x, Y + 3.8, zm)); // cuerda de arriba
    g.add(caja(0.25, 0.3, largo, ox, x, Y + 0.15, zm)); // cuerda de abajo
    for (let k = 0; k <= 8; k++) {
      const z = PUENTE.z0 - 4 + k * largo / 8;
      g.add(caja(0.2, 3.8, 0.2, ox2, x, Y + 1.9, z));
      if (k < 8) { const d = caja(0.12, Math.hypot(3.6, largo / 8), 0.12, ox, x, Y + 1.95, z + largo / 16); d.rotation.x = (k % 2 ? 1 : -1) * Math.atan2(largo / 8, 3.6); g.add(d); }
    }
    g.add(caja(0.08, 0.08, largo, ox2, x, Y + 1.0, zm)); // barandal
  }
  for (let k = 0; k <= 8; k += 2) g.add(caja(7.6, 0.2, 0.2, ox, -1.6, Y + 3.8, PUENTE.z0 - 4 + k * largo / 8)); // vigas de arriba
  const letrero = new THREE.Group(); letrero.position.set(2.9, Y, PUENTE.z0 - 7);
  letrero.add(cil(0.05, 0.05, 2.2, ox2, -0.4, 1.1, 0)); letrero.add(cil(0.05, 0.05, 2.2, ox2, 0.4, 1.1, 0));
  const lt = cartel(["PUENTE VIEJO", "1958"], "#d8d0b8", "#3a2a20", 1.3, 0.6); lt.position.set(0, 1.9, 0.06); letrero.add(lt);
  letrero.rotation.y = Math.PI + 0.35; g.add(letrero); // mira hacia quien llega al puente
  const sola = casaPueblo(7, 3.0, 6, "#6a6258", false); sola.position.set(CASA_SOLA.x + 3, Y, CASA_SOLA.z);
  for (const dz of [-2.1, 2.1]) for (const dy of [1.35, 1.75]) { const tab = caja(0.04, 0.12, 1.2, lambert({ color: "#5a4030" }), -3.16, dy, dz); tab.rotation.x = dy > 1.5 ? 0.25 : -0.2; sola.add(tab); } // tablas clavadas en las ventanas
  sola.children.forEach((o) => { if ((o as THREE.Mesh).geometry instanceof THREE.BoxGeometry && Math.abs(o.position.z) < 0.01 && Math.abs(o.position.y - 0.99) < 0.01) ((o as THREE.Mesh).material = lambert({ color: "#0c0a08" })); }); // la puerta, abierta (hueco negro)
  g.add(sola);
  // cerros al fondo
  for (const [x, z, r] of [[40, 120, 18], [-45, 200, 22], [35, 330, 20], [-40, 420, 25], [30, 470, 18]]) { const c = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 10), lambert({ color: "#5a6a5a" })); c.scale.y = 0.35; c.position.set(x, Y, z); g.add(c); }
  return { g, paradas };
}

/** lluvia: líneas que caen alrededor del camión (nunca dentro de él) */
function crearLluvia(n = 1600) {
  const pos = new Float32Array(n * 6), base: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    let x = 0, z = 0;
    do { x = (Math.random() - 0.5) * 26; z = -12 + Math.random() * 40; } while (Math.abs(x) < 1.45 && z > BUS.atras - 0.3 && z < BUS.nariz + 0.4);
    base.push([x, BUS.suelo + Math.random() * 9, z]);
  }
  const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  const lineas = new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: "#c8d6e4", transparent: true, opacity: 0.45, depthWrite: false }));
  lineas.layers.set(NOINK); lineas.frustumCulled = false;
  const mover = (f: number) => {
    for (let i = 0; i < n; i++) {
      const [x, y0, z] = base[i];
      const y = BUS.suelo + ((((y0 - BUS.suelo - f * 0.42) % 9) + 9) % 9);
      pos.set([x, y, z, x + 0.03, y + 0.38, z + 0.06], i * 6);
    }
    geo.attributes.position.needsUpdate = true;
  };
  return { lineas, mover };
}

export function crearEscenario() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#ffffff", 0.3);
  const hemi = new THREE.HemisphereLight("#c8d2dc", "#5a5a4a", 0.9);
  const sol = new THREE.DirectionalLight("#fff4e0", 1.2); sol.position.set(-6, 10, 8);
  raiz.add(amb, hemi, sol, sol.target);
  const bus = crearCamion(); raiz.add(bus.g);
  const carretera = crearCarretera(); raiz.add(carretera.g);
  const lluvia = crearLluvia(); raiz.add(lluvia.lineas);
  const luzExtra = new THREE.PointLight("#ffe2c0", 0, 4, 1.5); raiz.add(luzExtra);
  return { raiz, amb, hemi, sol, bus, carretera, lluvia, luzExtra };
}
export type Escenario = ReturnType<typeof crearEscenario>;
