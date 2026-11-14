// Escenario de «El elevador»: elevador viejo de un edificio de departamentos, de noche.
//   Cabina por dentro: paredes de paneles de madera gastada con zoclo de metal, espejo en la pared del fondo (refleja de
//   verdad, `Reflector`), pasamanos en tres paredes, botonera con números 1–14 y PB, interfón con rejilla, indicador de
//   piso arriba de la puerta, puertas corredizas de dos hojas, hoja de reglas pegada con cinta, plafón con luz, luz roja
//   de emergencia y cámara de seguridad en la esquina del techo, piso de losetas.
//   Cubo del elevador (para el gancho): paredes de concreto con el número de cada piso y las puertas de cada piso,
//   rieles guía, cables, contrapeso; la cabina por fuera con su viga y poleas; chispas en los rieles.
//   Pasillo del edificio (se mueve en y para «entre pisos»): piso de losetas, paredes con puertas de departamento,
//   placa con el número del piso, botón de llamar, foco del techo; abajo del piso, el concreto del cubo.
// Guía §8.9 (acabado aprobado: cuartos gastados, noche fría, sin capa de puntitos encima), §8.6c (las puertas se
// abren: nadie las atraviesa; capas ≥ 5 mm) y §8.6d (cada objeto con sus piezas típicas).
import * as THREE from "three";
import { Reflector } from "three/examples/jsm/objects/Reflector.js";
import { NOINK } from "../alejandro/ink";
import { LienzoVivo, caja, lambert, lienzo, resplandor } from "../turno3/comun";

export const CAB = { x0: -1.0, x1: 1.0, z0: -0.9, z1: 0.9, alto: 2.5, puertaAncho: 1.0, puertaAlto: 2.15 }; // más grande que uno real: los personajes de cabeza grande caben y la cámara se aleja
export const PISO_ALTO = 2.8; // de un piso al siguiente
export const ESPEJO = { x: 0, y: 1.6, z: CAB.z0 + 0.012, ancho: 1.72, alto: 1.25 };
export const HOJA = new THREE.Vector3(CAB.x0 + 0.006, 1.45, 0.2); // en la pared izquierda, mira hacia +x
export const BOTONERA = new THREE.Vector3(0.75, 1.22, CAB.z1 - 0.012); // en el panel derecho del frente, mira hacia −z
export const INTERFON = new THREE.Vector3(0.75, 0.86, CAB.z1 - 0.012);
export const INDICADOR = new THREE.Vector3(0, 2.32, CAB.z1 - 0.012);
export const EMERGENCIA = new THREE.Vector3(0.62, CAB.alto - 0.03, 0.55);
export const CAMARA = new THREE.Vector3(-0.85, CAB.alto - 0.05, 0.75); // domo de la cámara de seguridad
export const POZO = { x0: -1.9, x1: 1.9, z0: -1.55, z1: 1.45 };

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
const manchas = (c: CanvasRenderingContext2D, w: number, h: number, n: number, col = "18,16,14", a = 0.25) => {
  for (let k = 0; k < n; k++) { const x = (k * 71 + 13) % w, y = (k * 113 + 7) % h, g = c.createRadialGradient(x, y, 2, x, y, 26 + (k % 3) * 16); g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(1, `rgba(${col},0)`); c.fillStyle = g; c.fillRect(0, 0, w, h); }
};
const texLosetas = () => lienzo((c, w, h) => { // losetas de vinil en tablero, gastadas
  for (let y = 0; y < 4; y++) for (let x = 0; x < 4; x++) { c.fillStyle = (x + y) % 2 ? "#3a3c40" : "#6a665e"; c.fillRect(x * w / 4, y * h / 4, w / 4, h / 4); }
  c.fillStyle = "rgba(10,10,12,0.5)"; for (let i = 0; i <= 4; i++) { c.fillRect(i * w / 4 - 1, 0, 2, h); c.fillRect(0, i * h / 4 - 1, w, 2); }
  manchas(c, w, h, 8, "20,18,14", 0.3);
  c.strokeStyle = "rgba(230,225,215,0.12)"; c.lineWidth = 1.5; for (let k = 0; k < 14; k++) { const x = (k * 37) % w, y = (k * 59) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 14, y + 4); c.stroke(); }
}, 256, 256, [3, 3]);
/** paneles de madera gastada con marco de metal y zoclo (paredes de la cabina) */
const texPanel = () => lienzo((c, w, h) => {
  c.fillStyle = "#5e4632"; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 6) { c.fillStyle = x % 12 ? "rgba(30,18,10,0.16)" : "rgba(160,120,80,0.08)"; c.fillRect(x, 0, 2, h); } // vetas
  c.fillStyle = "#8a8c90"; c.fillRect(0, 0, w, 10); c.fillRect(0, h * 0.86, w, h * 0.14); // marco arriba y zoclo de metal
  c.fillStyle = "#4a4c50"; c.fillRect(0, h * 0.86, w, 4); c.fillRect(0, 10, w, 3);
  c.fillStyle = "rgba(20,14,10,0.5)"; c.fillRect(0, 0, 4, h); c.fillRect(w - 4, 0, 4, h); // juntas entre paneles
  for (const y of [h * 0.88, h * 0.97]) for (const x of [16, w - 16]) { c.fillStyle = "#3a3c40"; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); } // tornillos
  manchas(c, w, h, 6, "16,12,8", 0.3);
  c.strokeStyle = "rgba(230,215,195,0.15)"; c.lineWidth = 1.5; for (let k = 0; k < 18; k++) { const x = (k * 41) % w, y = h * 0.35 + (k * 53) % (h * 0.5); c.beginPath(); c.moveTo(x, y); c.lineTo(x + 8 + (k % 4) * 6, y - 2 + (k % 3) * 2); c.stroke(); } // rayones
  const g = c.createLinearGradient(0, h * 0.6, 0, h * 0.86); g.addColorStop(0, "rgba(10,8,6,0)"); g.addColorStop(1, "rgba(10,8,6,0.3)"); c.fillStyle = g; c.fillRect(0, h * 0.6, w, h * 0.26);
}, 128, 512);
const texAcero = (base = "#8e9196") => lienzo((c, w, h) => { // acero cepillado de las puertas, con rayones y huellas
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 2) { c.fillStyle = y % 6 ? "rgba(255,255,255,0.035)" : "rgba(0,0,0,0.05)"; c.fillRect(0, y, w, 1); }
  manchas(c, w, h, 6, "20,22,26", 0.22);
  c.strokeStyle = "rgba(255,255,255,0.18)"; c.lineWidth = 1; for (let k = 0; k < 20; k++) { const x = (k * 31) % w, y = (k * 67) % h; c.beginPath(); c.moveTo(x, y); c.lineTo(x + 18, y + 2); c.stroke(); }
}, 128, 256);
const texTecho = () => lienzo((c, w, h) => { // plafón de lámina con la rejilla de ventilación
  c.fillStyle = "#56585c"; c.fillRect(0, 0, w, h);
  manchas(c, w, h, 5, "40,34,24", 0.35);
  c.fillStyle = "#2a2c30"; for (let x = 20; x < w - 20; x += 12) c.fillRect(x, h * 0.82, 6, h * 0.1);
}, 256, 256);
const texConcreto = (rep: [number, number]) => lienzo((c, w, h) => { // concreto del cubo: manchas, chorreados y una losa por piso
  c.fillStyle = "#4e5056"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 900; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.06)"; c.fillRect((k * 53) % w, (k * 29) % h, 3, 3); }
  manchas(c, w, h, 9, "24,22,20", 0.35);
  c.fillStyle = "#34363a"; c.fillRect(0, 0, w, h * 0.09); // la losa de cada piso
  c.fillStyle = "rgba(16,16,18,0.3)"; for (let k = 0; k < 6; k++) c.fillRect((k * 47) % w, h * 0.09, 3, 20 + (k * 13) % 60); // chorreados
}, 256, 256, rep);
const texLanding = () => lienzo((c, w, h) => { // pared del frente del cubo: la puerta de cada piso, cerrada (por dentro)
  c.fillStyle = "#4e5056"; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 500; k++) { c.fillStyle = k % 2 ? "rgba(0,0,0,0.12)" : "rgba(255,255,255,0.05)"; c.fillRect((k * 53) % w, (k * 29) % h, 3, 3); }
  c.fillStyle = "#34363a"; c.fillRect(0, 0, w, h * 0.09);
  c.fillStyle = "#6a6c70"; c.fillRect(w * 0.35, h * 0.2, w * 0.3, h * 0.73); c.fillStyle = "#2a2c30"; c.fillRect(w * 0.497, h * 0.2, w * 0.006, h * 0.73);
  c.fillStyle = "#24262a"; c.fillRect(w * 0.34, h * 0.93, w * 0.32, h * 0.02); // umbral
}, 256, 256, [1, 12]);
const texNumero = (n: string, color = "#e8e0c8") => lienzo((c, w, h) => { // número pintado del piso en el cubo
  c.clearRect(0, 0, w, h); c.fillStyle = color; c.font = "bold 200px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(n, w / 2, h / 2 + 8);
}, 256, 256);
const texBotonera = () => lienzo((c, w, h) => { // placa de la botonera: 14 botones, PB, abrir/cerrar y alarma
  c.fillStyle = "#b8b4a8"; c.fillRect(0, 0, w, h); c.strokeStyle = "#5a5852"; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
  c.fillStyle = "#2a2a2e"; c.font = "bold 22px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  const nums = ["13", "14", "11", "12", "9", "10", "7", "8", "5", "6", "3", "4", "PB", "2"];
  nums.forEach((t, i) => { const x = w * (0.32 + (i % 2) * 0.36), y = 40 + Math.floor(i / 2) * 50; c.fillStyle = "#e8e4da"; c.beginPath(); c.arc(x, y, 17, 0, 7); c.fill(); c.strokeStyle = "#3a3a3e"; c.lineWidth = 3; c.stroke(); c.fillStyle = "#2a2a2e"; c.fillText(t, x, y + 1); });
  c.fillStyle = "#2a2a2e"; c.fillText("◀▶", w * 0.32, 40 + 7 * 50); c.fillText("▶◀", w * 0.68, 40 + 7 * 50);
  c.fillStyle = "#c8a030"; c.beginPath(); c.arc(w * 0.5, 40 + 8 * 50, 19, 0, 7); c.fill(); c.fillStyle = "#2a2a2e"; c.fillText("!", w * 0.5, 40 + 8 * 50);
  c.font = "bold 16px 'DejaVu Sans', sans-serif"; c.fillText("NO GRITE", w * 0.5, h - 18);
}, 160, 480);
const texRejilla = () => lienzo((c, w, h) => { // interfón: rejilla de bocina y letrero
  c.fillStyle = "#9a968c"; c.fillRect(0, 0, w, h); c.strokeStyle = "#4a4842"; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6);
  c.fillStyle = "#2a2a2e"; for (let y = 22; y < h * 0.72; y += 12) for (let x = 20 + ((y / 12) % 2) * 6; x < w - 14; x += 12) { c.beginPath(); c.arc(x, y, 3.5, 0, 7); c.fill(); }
  c.font = "bold 18px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("INTERFÓN", w / 2, h - 16);
}, 160, 128);
const texHoja = () => lienzo((c, w, h) => { // aviso del edificio, impreso y amarillento
  c.fillStyle = "#ece4cc"; c.fillRect(0, 0, w, h);
  manchas(c, w, h, 4, "120,96,50", 0.2);
  c.fillStyle = "#1c1c20"; c.fillRect(0, 0, w, 74);
  c.fillStyle = "#f0e8d4"; c.font = "bold 40px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("AVISO A RESIDENTES", w / 2, 52);
  c.fillStyle = "#1c1c20"; c.textAlign = "left"; c.font = "bold 31px 'DejaVu Sans', sans-serif";
  ["1. SI SE DETIENE ENTRE", "   PISOS, NO GRITE.", "2. NUNCA CUENTE EN VOZ", "   ALTA A LOS PASAJEROS.", "3. SI ALGUIEN NO TIENE", "   REFLEJO, NO LE DÉ", "   LA ESPALDA."].forEach((t, i) => c.fillText(t, 26, 134 + i * 52 + (i >= 2 ? 18 : 0) + (i >= 4 ? 18 : 0)));
  c.fillStyle = "#b3262f"; c.font = "italic bold 26px 'DejaVu Sans', sans-serif"; c.textAlign = "right"; c.fillText("— LA ADMINISTRACIÓN", w - 24, h - 24);
}, 600, 600);
const texPuertaDepto = (n: string) => lienzo((c, w, h) => { // puerta de departamento con número y mirilla
  c.fillStyle = "#4a3426"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(20,12,8,0.6)"; c.lineWidth = 6; c.strokeRect(20, 30, w - 40, h * 0.4); c.strokeRect(20, h * 0.5, w - 40, h * 0.44);
  manchas(c, w, h, 4, "14,10,6", 0.3);
  c.fillStyle = "#c8a24a"; c.font = "bold 40px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText(n, w / 2, 110);
  c.fillStyle = "#1a1a1c"; c.beginPath(); c.arc(w / 2, 150, 7, 0, 7); c.fill();
}, 128, 320);
const texPasillo = () => lienzo((c, w, h) => { // pared del pasillo: pintura verde vieja, lambrín, manchas de humedad
  c.fillStyle = "#6c7a70"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#3c4842"; c.fillRect(0, h * 0.62, w, h * 0.38); c.fillStyle = "#24282a"; c.fillRect(0, h * 0.615, w, 6); c.fillRect(0, h - 10, w, 10);
  manchas(c, w, h, 6, "60,54,40", 0.3);
  const gt = c.createLinearGradient(0, 0, 0, h * 0.3); gt.addColorStop(0, "rgba(16,18,20,0.4)"); gt.addColorStop(1, "rgba(16,18,20,0)"); c.fillStyle = gt; c.fillRect(0, 0, w, h * 0.3);
}, 256, 256, [3, 1]);
const texPlaca = (n: string) => lienzo((c, w, h) => { // placa del piso junto al elevador
  c.fillStyle = "#c8b48a"; c.fillRect(0, 0, w, h); c.strokeStyle = "#5a4a30"; c.lineWidth = 8; c.strokeRect(4, 4, w - 8, h - 8);
  c.fillStyle = "#2a2018"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("PISO", w / 2, 50);
  c.font = "bold 92px 'DejaVu Sans', sans-serif"; c.fillText(n, w / 2, 148);
}, 160, 180);

/** dígitos del indicador de piso (luz ámbar) */
export const dibujarIndicador = (c: CanvasRenderingContext2D, w: number, h: number, piso: string, baja: boolean, on: number) => {
  c.fillStyle = "#0c0a08"; c.fillRect(0, 0, w, h);
  c.globalAlpha = on;
  c.fillStyle = "#ffb43a"; c.font = "bold 92px 'DejaVu Sans Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
  c.shadowColor = "#ff9a20"; c.shadowBlur = 16; c.fillText(piso, w * 0.6, h / 2 + 4);
  if (baja) { c.beginPath(); c.moveTo(w * 0.12, h * 0.36); c.lineTo(w * 0.28, h * 0.36); c.lineTo(w * 0.2, h * 0.66); c.fill(); }
  c.shadowBlur = 0; c.globalAlpha = 1;
};

/** puerta corrediza de dos hojas (acero): abre 0 cerrada … 1 abierta; las hojas se esconden detrás de los paneles */
const corrediza = (ancho: number, alto: number, m: THREE.Material, z: number) => {
  const g = new THREE.Group();
  const hojas = [-1, 1].map((s) => {
    const h = new THREE.Group(); h.add(caja(ancho / 2, alto, 0.025, m, 0, alto / 2, 0));
    h.add(caja(0.012, alto, 0.03, lambert({ color: "#3a3c40" }), s * -(ancho / 4) , alto / 2, 0)); // canto de goma donde se juntan
    g.add(h); return h;
  });
  g.position.z = z;
  const abrir = (a: number) => { hojas[0].position.x = -ancho / 4 - a * ancho / 2; hojas[1].position.x = ancho / 4 + a * ancho / 2; };
  abrir(0);
  return { g, abrir };
};

export function crearElevador() {
  const raiz = new THREE.Group();
  const amb = new THREE.AmbientLight("#7a8cae", 0.22); raiz.add(amb);
  const hemi = new THREE.HemisphereLight("#6a7ca8", "#1a140e", 0.28); raiz.add(hemi);
  const C = CAB, W = C.x1 - C.x0, D = C.z1 - C.z0;
  const mPanel = lambert({ map: texPanel() });
  const mAcero = lambert({ map: texAcero() });
  const mAceroOsc = lambert({ map: texAcero("#6a6e74") });
  const mMarco = lambert({ color: "#7a7c80" });
  const mNegro = lambert({ color: "#1c1c20" });

  // ================================================================== CABINA (se mueve en y en el cubo)
  const cabina = new THREE.Group(); raiz.add(cabina);
  /** cada pared es un grupo con su normal hacia adentro: si la cámara queda detrás de ella, se esconde (corte) */
  const paredes: { g: THREE.Group; p: THREE.Vector3; n: THREE.Vector3 }[] = [];
  const pared = (p: THREE.Vector3, n: THREE.Vector3) => { const g = new THREE.Group(); cabina.add(g); paredes.push({ g, p, n }); return g; };
  // piso y techo
  cabina.add(suelo(W, D, lambert({ map: texLosetas() }), 0, 0, 0));
  const gTecho = pared(new THREE.Vector3(0, C.alto, 0), new THREE.Vector3(0, -1, 0));
  const techo = suelo(W, D, lambert({ map: texTecho() }), 0, C.alto, 0); techo.rotation.x = Math.PI / 2; gTecho.add(techo);
  // plafón de luz (difusor lechoso con marco)
  const difusor = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.5), brillo("#f2f6ff")); difusor.rotation.x = Math.PI / 2; difusor.position.set(0, C.alto - 0.012, -0.05); difusor.layers.set(NOINK); gTecho.add(difusor);
  gTecho.add(caja(0.96, 0.02, 0.04, mMarco, 0, C.alto - 0.012, 0.22), caja(0.96, 0.02, 0.04, mMarco, 0, C.alto - 0.012, -0.32), caja(0.04, 0.02, 0.56, mMarco, -0.47, C.alto - 0.012, -0.05), caja(0.04, 0.02, 0.56, mMarco, 0.47, C.alto - 0.012, -0.05));
  const luzTecho = new THREE.PointLight("#e6eeff", 3.2, 6, 1.6); luzTecho.position.set(0, C.alto - 0.25, -0.05); cabina.add(luzTecho);
  // luz roja de emergencia (caja con mica roja) y su luz
  const mMica = brillo("#4a1010");
  gTecho.add(caja(0.2, 0.06, 0.12, mNegro, EMERGENCIA.x, C.alto - 0.03, EMERGENCIA.z));
  const mica = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.025, 0.09), mMica); mica.position.set(EMERGENCIA.x, C.alto - 0.07, EMERGENCIA.z); mica.layers.set(NOINK); gTecho.add(mica);
  const haloEmerg = destello(255, 50, 30, 0.7, 0.0); haloEmerg.position.set(EMERGENCIA.x, C.alto - 0.1, EMERGENCIA.z); gTecho.add(haloEmerg);
  const luzEmerg = new THREE.PointLight("#ff2a18", 0, 5, 1.4); luzEmerg.position.set(EMERGENCIA.x - 0.1, C.alto - 0.2, EMERGENCIA.z - 0.1); cabina.add(luzEmerg);
  // cámara de seguridad: domo negro con su lucecita roja
  gTecho.add(cil(0.07, 0.07, 0.02, lambert({ color: "#d8d6d0" }), CAMARA.x, C.alto - 0.01, CAMARA.z));
  const domo = new THREE.Mesh(new THREE.SphereGeometry(0.06, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#141418" })); domo.rotation.x = Math.PI; domo.position.set(CAMARA.x, C.alto - 0.02, CAMARA.z); gTecho.add(domo);
  const ledCam = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), brillo("#ff2020")); ledCam.position.set(CAMARA.x + 0.035, C.alto - 0.06, CAMARA.z - 0.035); gTecho.add(ledCam);
  const haloCam = destello(255, 40, 40, 0.08, 0.6); haloCam.position.copy(ledCam.position); gTecho.add(haloCam);

  // pared izquierda (x0) con la hoja de reglas
  const gIzq = pared(new THREE.Vector3(C.x0, 1, 0), new THREE.Vector3(1, 0, 0));
  gIzq.add(plano(D, C.alto, mPanel, C.x0, C.alto / 2, 0, Math.PI / 2));
  const hoja = plano(0.44, 0.44, lambert({ map: texHoja() }), HOJA.x, HOJA.y, HOJA.z, Math.PI / 2); gIzq.add(hoja);
  for (const [dy, dz] of [[0.21, -0.2], [0.21, 0.2], [-0.21, -0.2], [-0.21, 0.2]]) { const t = plano(0.07, 0.025, lambert({ color: "#d8d0b0", transparent: true, opacity: 0.85 }), HOJA.x + 0.004, HOJA.y + dy, HOJA.z + dz, Math.PI / 2); t.rotation.x = 0.6 * Math.sign(dy * dz); gIzq.add(t); } // cinta en las esquinas
  // pared derecha (x1)
  const gDer = pared(new THREE.Vector3(C.x1, 1, 0), new THREE.Vector3(-1, 0, 0));
  gDer.add(plano(D, C.alto, mPanel, C.x1, C.alto / 2, 0, -Math.PI / 2));
  // pared del fondo (z0) con el espejo
  const gFondo = pared(new THREE.Vector3(0, 1, C.z0), new THREE.Vector3(0, 0, 1));
  gFondo.add(plano(W, C.alto, mPanel, 0, C.alto / 2, C.z0));
  const E = ESPEJO;
  for (const [w, h, x, y] of [[E.ancho + 0.08, 0.04, 0, E.y + E.alto / 2 + 0.02], [E.ancho + 0.08, 0.04, 0, E.y - E.alto / 2 - 0.02], [0.04, E.alto, -E.ancho / 2 - 0.02, E.y], [0.04, E.alto, E.ancho / 2 + 0.02, E.y]] as number[][]) gFondo.add(caja(w, h, 0.03, mMarco, x, y, C.z0 + 0.015));
  const espejo = new Reflector(new THREE.PlaneGeometry(E.ancho, E.alto), { textureWidth: 640, textureHeight: 560, color: new THREE.Color("#b8bec6"), clipBias: 0.003, multisample: 0 });
  espejo.position.set(E.x, E.y, E.z); espejo.layers.set(NOINK); gFondo.add(espejo);
  // espejo apagado (cuando no se necesita el reflejo): vidrio gris azulado con un brillo diagonal
  const espejoMate = plano(E.ancho, E.alto, new THREE.MeshBasicMaterial({ map: lienzo((c, w, h) => { const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#3a4250"); g.addColorStop(0.45, "#55606e"); g.addColorStop(0.5, "#6a7482"); g.addColorStop(0.55, "#4a5462"); g.addColorStop(1, "#2a3038"); c.fillStyle = g; c.fillRect(0, 0, w, h); }, 128, 128), toneMapped: true }), E.x, E.y, E.z); espejoMate.layers.set(NOINK); gFondo.add(espejoMate);
  // pasamanos (tubo con soportes) en fondo y lados
  const mTubo = lambert({ color: "#b8bcc2" });
  const tubo = (largo: number, x: number, z: number, ry: number, g: THREE.Group) => {
    const t = cil(0.018, 0.018, largo, mTubo, x, 0.92, z, 10); t.rotation.z = Math.PI / 2; t.rotation.y = ry; g.add(t);
    for (const s of [-0.38, 0.38]) { const sx = x + (ry ? 0 : s * largo), sz = z + (ry ? s * largo : 0); const so = cil(0.012, 0.012, 0.07, mTubo, sx + (ry ? Math.sign(-x) * 0.035 : 0), 0.92, sz + (ry ? 0 : Math.sign(-z) * 0.035), 8); so.rotation.x = ry ? 0 : Math.PI / 2; so.rotation.z = ry ? Math.PI / 2 : 0; g.add(so); }
  };
  tubo(W - 0.2, 0, C.z0 + 0.07, 0, gFondo);
  tubo(D - 0.5, C.x0 + 0.07, -0.15, Math.PI / 2, gIzq);
  tubo(D - 0.5, C.x1 - 0.07, -0.15, Math.PI / 2, gDer);
  // pared del frente (z1): paneles a los lados de la puerta, dintel, botonera, interfón e indicador
  const gFrente = pared(new THREE.Vector3(0, 1, C.z1), new THREE.Vector3(0, 0, -1));
  const lado = (C.x1 - C.puertaAncho / 2);
  for (const s of [-1, 1]) gFrente.add(plano(lado - 0, C.alto, mAceroOsc, s * (C.puertaAncho / 2 + lado / 2), C.alto / 2, C.z1, Math.PI));
  gFrente.add(plano(C.puertaAncho, C.alto - C.puertaAlto, mAceroOsc, 0, (C.alto + C.puertaAlto) / 2, C.z1, Math.PI));
  gFrente.add(caja(C.puertaAncho + 0.06, 0.03, 0.03, mMarco, 0, C.puertaAlto + 0.015, C.z1 - 0.015)); // marco de la puerta
  for (const s of [-1, 1]) gFrente.add(caja(0.03, C.puertaAlto, 0.03, mMarco, s * (C.puertaAncho / 2 + 0.015), C.puertaAlto / 2, C.z1 - 0.015));
  gFrente.add(caja(C.puertaAncho, 0.012, 0.06, lambert({ color: "#9a9a9e" }), 0, 0.006, C.z1 - 0.01)); // riel del piso
  const botonera = plano(0.17, 0.5, lambert({ map: texBotonera() }), BOTONERA.x, BOTONERA.y, BOTONERA.z - 0.004, Math.PI); gFrente.add(botonera);
  // aro de luz ámbar alrededor del botón «PB» (abajo a la izquierda de la botonera): el único que está prendido
  const pbLuz = new THREE.Mesh(new THREE.RingGeometry(0.0115, 0.0145, 24), brillo("#ffb43a")); pbLuz.rotation.y = Math.PI; pbLuz.layers.set(NOINK);
  pbLuz.position.set(BOTONERA.x - 0.17 * (0.32 - 0.5), BOTONERA.y + 0.25 - (40 + 6 * 50) / 480 * 0.5, BOTONERA.z - 0.006); gFrente.add(pbLuz);
  const interfon = plano(0.15, 0.12, lambert({ map: texRejilla() }), INTERFON.x, INTERFON.y, INTERFON.z - 0.004, Math.PI); gFrente.add(interfon);
  const ledInterfon = new THREE.Mesh(new THREE.CircleGeometry(0.008, 12), brillo("#2a3a2c")); ledInterfon.position.set(INTERFON.x - 0.055, INTERFON.y + 0.045, INTERFON.z - 0.008); ledInterfon.rotation.y = Math.PI; ledInterfon.layers.set(NOINK); gFrente.add(ledInterfon);
  gFrente.add(caja(0.34, 0.14, 0.04, mNegro, INDICADOR.x, INDICADOR.y, INDICADOR.z - 0.02));
  const indicador = new LienzoVivo(256, 96);
  const pantallaInd = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.11), new THREE.MeshBasicMaterial({ map: indicador.tex, toneMapped: false })); pantallaInd.position.set(INDICADOR.x, INDICADOR.y, INDICADOR.z - 0.042); pantallaInd.rotation.y = Math.PI; pantallaInd.layers.set(NOINK); gFrente.add(pantallaInd);
  // puertas de la cabina (por fuera de los paneles: al abrir se esconden detrás, no los atraviesan)
  const puertas = corrediza(C.puertaAncho, C.puertaAlto, mAcero, C.z1 + 0.02); gFrente.add(puertas.g);
  // rendija de luz entre las hojas (solo cuando la cabina está a oscuras)
  const rendija = new THREE.Mesh(new THREE.PlaneGeometry(0.006, C.puertaAlto - 0.1), brillo("#9fb8e8")); rendija.position.set(0, C.puertaAlto / 2, C.z1 + 0.004); rendija.rotation.y = Math.PI; rendija.layers.set(NOINK); rendija.visible = false; gFrente.add(rendija);

  // por fuera (solo en el cubo): caja de lámina, viga, poleas y cables
  const fuera = new THREE.Group(); cabina.add(fuera);
  const mLamina = lambert({ map: texAcero("#5a5e64") });
  const shell = new THREE.Mesh(new THREE.BoxGeometry(W + 0.08, C.alto + 0.1, D + 0.08), mLamina); shell.position.y = C.alto / 2; fuera.add(shell);
  fuera.add(caja(W + 0.3, 0.14, 0.18, mNegro, 0, C.alto + 0.16, 0)); // viga de arriba
  for (const s of [-1, 1]) { fuera.add(caja(0.12, C.alto + 0.4, 0.14, mNegro, s * (W / 2 + 0.1), C.alto / 2, 0)); fuera.add(caja(0.08, 0.14, 0.1, lambert({ color: "#c8a030" }), s * (W / 2 + 0.2), C.alto - 0.2, 0)); } // largueros y zapatas de guía
  const polea = cil(0.13, 0.13, 0.06, lambert({ color: "#3a3c40" }), 0, C.alto + 0.36, 0, 20); polea.rotation.x = Math.PI / 2; fuera.add(polea);
  const mCable = lambert({ color: "#202024" });
  const cables: THREE.Mesh[] = [];
  for (const dx of [-0.06, -0.02, 0.02, 0.06]) { const cb = cil(0.008, 0.008, 40, mCable, dx, C.alto + 0.36 + 20, 0, 6); fuera.add(cb); cables.push(cb); }
  fuera.add(caja(W + 0.1, 0.1, D + 0.1, mNegro, 0, -0.08, 0)); // fondo de la cabina
  fuera.visible = false;

  // ================================================================== CUBO (solo para el gancho y las tomas de afuera)
  const pozo = new THREE.Group(); raiz.add(pozo);
  const Z = POZO, alto = 60, yc = -10;
  const mConc = lambert({ map: texConcreto([2, alto / PISO_ALTO]) });
  const mLand = lambert({ map: texLanding() }); (mLand.map as THREE.Texture).repeat.set(1, alto / PISO_ALTO);
  pozo.add(plano(Z.x1 - Z.x0, alto, mConc, 0, yc, Z.z0));
  pozo.add(plano(Z.x1 - Z.x0, alto, mLand, 0, yc, Z.z1, Math.PI));
  pozo.add(plano(Z.z1 - Z.z0, alto, mConc, Z.x0, yc, (Z.z0 + Z.z1) / 2, Math.PI / 2));
  pozo.add(plano(Z.z1 - Z.z0, alto, mConc, Z.x1, yc, (Z.z0 + Z.z1) / 2, -Math.PI / 2));
  for (const s of [-1, 1]) { pozo.add(caja(0.08, alto, 0.08, lambert({ color: "#6a6c70" }), s * (W / 2 + 0.24), yc, 0)); for (let y = -38; y < 20; y += 1.4) pozo.add(caja(0.18, 0.04, 0.05, mNegro, s * (W / 2 + 0.32), y, 0)); } // rieles guía con sus soportes
  const contrapeso = new THREE.Group(); contrapeso.add(caja(0.9, 1.6, 0.22, lambert({ map: texAcero("#4a4c50") }), 0, 0, 0)); for (let k = 0; k < 8; k++) contrapeso.add(caja(0.86, 0.015, 0.24, mNegro, 0, -0.7 + k * 0.2, 0));
  const cableCp = cil(0.01, 0.01, 40, mCable, 0, 20.8, 0, 6); contrapeso.add(cableCp);
  contrapeso.position.set(0, 0, Z.z0 + 0.25); pozo.add(contrapeso);
  for (let p = -7; p <= 7; p++) { // números de piso pintados junto a cada puerta (piso 14 a la altura 0 del gancho → 14 + p)
    const n = 14 + p - 3; if (n < 1 || n > 14) continue;
    const num = plano(0.5, 0.5, lambert({ map: texNumero(String(n)), transparent: true, alphaTest: 0.3 }), Z.x1 - 0.32, p * PISO_ALTO + 1.75, Z.z1 - 0.006, Math.PI); pozo.add(num);
    const num2 = plano(0.5, 0.5, lambert({ map: texNumero(String(n)), transparent: true, alphaTest: 0.3 }), Z.x0 + 0.006, p * PISO_ALTO + 1.75, 0.6, Math.PI / 2); pozo.add(num2);
  }
  const luzPozo = new THREE.PointLight("#9ab4e8", 5.0, 14, 1.2); pozo.add(luzPozo);
  // lámparas de jaula en la pared del cubo, una por piso (se ven pasar al caer y bajan hacia el fondo negro)
  const mJaula = lambert({ color: "#2a2c30" });
  for (let p = -12; p <= 6; p++) {
    for (const lado of [-1, 1]) {
      const y = p * PISO_ALTO + 1.2 + (lado > 0 ? 0.9 : 0), x = lado < 0 ? Z.x0 + 0.06 : Z.x1 - 0.06, z = lado < 0 ? -0.5 : -0.2;
      pozo.add(caja(0.06, 0.16, 0.12, mJaula, x, y, z));
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), brillo("#ffe6b0")); b.position.set(x - lado * 0.06, y, z); b.layers.set(NOINK); pozo.add(b);
      const hl = destello(255, 220, 160, 0.5, 0.55); hl.position.set(x - lado * 0.08, y, z); pozo.add(hl);
    }
  }
  // chispas: puntitos naranjas que saltan de las zapatas al frenar (se colocan por cuadro)
  const chispas: THREE.Sprite[] = [];
  for (let k = 0; k < 28; k++) { const sp = destello(255, 170, 60, 0.06, 0.9); chispas.push(sp); pozo.add(sp); }
  const luzChispas = new THREE.PointLight("#ffa040", 0, 4, 1.5); pozo.add(luzChispas);
  pozo.visible = false;

  // ================================================================== PASILLO (se mueve en y: «a nivel» o «entre pisos»)
  const pasillo = new THREE.Group(); raiz.add(pasillo);
  const P0 = C.z1 + 0.08, P1 = 5.6, PX = 1.8, PA = 2.5;
  const mPas = lambert({ map: texPasillo() });
  pasillo.add(suelo(2 * PX, P1 - P0, lambert({ map: texLosetas() }), 0, 0, (P0 + P1) / 2));
  const tP = suelo(2 * PX, P1 - P0, lambert({ map: texTecho() }), 0, PA, (P0 + P1) / 2); tP.rotation.x = Math.PI / 2; pasillo.add(tP);
  pasillo.add(plano(P1 - P0, PA, mPas, -PX, PA / 2, (P0 + P1) / 2, Math.PI / 2), plano(P1 - P0, PA, mPas, PX, PA / 2, (P0 + P1) / 2, -Math.PI / 2), plano(2 * PX, PA, mPas, 0, PA / 2, P1, Math.PI));
  // pared del elevador (lado del pasillo) con el hueco de la puerta
  const anchoLado = PX - C.puertaAncho / 2;
  for (const s of [-1, 1]) pasillo.add(plano(anchoLado, PA, mPas, s * (C.puertaAncho / 2 + anchoLado / 2), PA / 2, P0));
  pasillo.add(plano(C.puertaAncho, PA - C.puertaAlto, mPas, 0, (PA + C.puertaAlto) / 2, P0));
  // y del lado del cubo: el concreto que se ve cuando la cabina queda entre pisos (abajo y arriba del hueco)
  const mConc2 = lambert({ map: texConcreto([1, 1]) });
  pasillo.add(plano(2 * PX, 3.0, mConc2, 0, -1.5, P0 - 0.004, Math.PI));
  pasillo.add(plano(2 * PX, 3.0, mConc2, 0, C.puertaAlto + 1.5, P0 - 0.004, Math.PI));
  pasillo.add(caja(C.puertaAncho + 0.1, 0.03, 0.08, lambert({ color: "#9a9a9e" }), 0, -0.015, P0 - 0.03)); // umbral de metal
  // marco plano y sin contorno: como caja, su orilla casi de canto salía como rayita punteada que temblaba
  for (const s of [-1, 1]) { const m = plano(0.06, C.puertaAlto + 0.06, mMarco, s * (C.puertaAncho / 2 + 0.03), (C.puertaAlto + 0.06) / 2, P0 + 0.004); m.layers.set(NOINK); pasillo.add(m); }
  { const m = plano(C.puertaAncho + 0.12, 0.06, mMarco, 0, C.puertaAlto + 0.03, P0 + 0.004); m.layers.set(NOINK); pasillo.add(m); }
  const puertasPiso = corrediza(C.puertaAncho, C.puertaAlto, mAcero, P0 - 0.0135); pasillo.add(puertasPiso.g); // puertas del piso, al ras y detrás de la pared (se esconden al abrir); un escalón de 1–3 cm a 3 m queda justo en el umbral de la tinta y sale punteado
  const placaMat = lambert({ map: texPlaca("14") });
  const placa = plano(0.2, 0.225, placaMat, -0.78, 1.6, P0 + 0.006); pasillo.add(placa);
  pasillo.add(caja(0.1, 0.18, 0.02, lambert({ color: "#b8b4a8" }), 0.66, 1.1, P0 + 0.01)); // botón de llamar
  const llamar = new THREE.Mesh(new THREE.CircleGeometry(0.022, 16), brillo("#ffb43a")); llamar.position.set(0.66, 1.1, P0 + 0.022); llamar.layers.set(NOINK); pasillo.add(llamar);
  // puertas de departamentos y un foco en el techo
  const deptos: [number, number, string][] = [[-PX, 2.4, "1402"], [PX, 3.4, "1403"], [-PX, 4.6, "1404"]];
  for (const [x, z, n] of deptos) { const pu = plano(0.9, 2.05, lambert({ map: texPuertaDepto(n) }), x - Math.sign(x) * 0.006, 1.025, z, Math.sign(x) > 0 ? -Math.PI / 2 : Math.PI / 2); pasillo.add(pu); }
  pasillo.add(plano(1.0, 2.05, lambert({ map: texPuertaDepto("ESC") }), 0, 1.025, P1 - 0.006, Math.PI)); // escaleras al fondo
  pasillo.add(cil(0.012, 0.012, 0.2, mNegro, 0, PA - 0.1, 2.8));
  const bulboP = new THREE.Mesh(new THREE.SphereGeometry(0.05, 14, 10), brillo("#ffe2b0")); bulboP.position.set(0, PA - 0.24, 2.8); bulboP.layers.set(NOINK); pasillo.add(bulboP);
  const haloP = destello(255, 220, 170, 0.5, 0.45); haloP.position.copy(bulboP.position); pasillo.add(haloP);
  const luzPasillo = new THREE.PointLight("#ffd8a0", 2.6, 7, 1.5); luzPasillo.position.set(0, PA - 0.35, 2.8); pasillo.add(luzPasillo);

  const luzExtra = new THREE.PointLight("#ffc890", 0, 5, 1.6); raiz.add(luzExtra);
  return {
    raiz, amb, hemi, cabina, paredes, fuera, cables, pozo, contrapeso, chispas, luzChispas, luzPozo, pasillo, puertas, puertasPiso, placaMat, texPlaca,
    luzTecho, difusor, luzEmerg, haloEmerg, mMica, espejo, espejoMate, indicador, ledInterfon, pbLuz, rendija, bulboP, haloP, luzPasillo, llamar, luzExtra,
  };
}
