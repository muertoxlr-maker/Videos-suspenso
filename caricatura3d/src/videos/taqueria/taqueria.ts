// Escenario de «La taquería de las 2 AM»: puesto de tacos en una esquina de colonia, con un solo foco colgando bajo el
// toldo (la luz principal: de ahí salen las sombras), comal, trompo de pastor, salsas, hielera y tanque de gas; detrás,
// cortinas metálicas cerradas, una farmacia con su cruz verde y ventanas; enfrente, la calle mojada y la esquina oscura.
// Guía §8.8 (luz cálida con halos, utilería) y §8.6c (nada encimado: cada capa a ≥ 5 mm; nada atraviesa nada).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor } from "../turno3/comun";
import { cartel, casa } from "../comun/utileria";
import { carro } from "../gasolinera/estacion";

// medidas que usan los planos
export const FOCO = new THREE.Vector3(0.1, 2.5, 0.55); // el foco bajo el toldo
export const MOSTRADOR = { x: 1.3, z0: -0.38, z1: 0.38, alto: 0.95 }; // ±x, frente en z1
export const COMAL = new THREE.Vector3(-0.55, 1.02, -0.05); // sobre su quemador (abajo en 1.005; la cubierta llega a 0.965)
export const TROMPO = new THREE.Vector3(0.78, 0.97, -0.12);
export const BANQUETA = 3.0; // orilla de la banqueta (z); la calle está 0.15 m más abajo
export const CALLE_Y = -0.15;

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const cilindro = (rt: number, rb: number, h: number, m: THREE.Material, x: number, y: number, z: number, seg = 20) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); c.position.set(x, y, z); return c;
};

// ------------------------------------------------------------------ texturas
const texBanqueta = () => lienzo((c, w, h) => {
  c.fillStyle = "#8a8478"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 1400; i++) { c.fillStyle = i % 3 ? "rgba(40,36,30,0.18)" : "rgba(150,140,124,0.18)"; c.fillRect((i * 37) % w, (i * 91) % h, 2 + (i % 3), 2); }
  c.strokeStyle = "rgba(30,26,22,0.7)"; c.lineWidth = 3;
  for (let x = 0; x <= w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 0; y <= h; y += 128) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  for (let i = 0; i < 14; i++) { c.fillStyle = "rgba(25,22,20,0.35)"; c.beginPath(); c.arc((i * 97) % w, (i * 61) % h, 3 + (i % 3), 0, 7); c.fill(); } // chicles
}, 256, 256, [9, 3]);
const texAsfalto = () => lienzo((c, w, h) => {
  c.fillStyle = "#1c1d21"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2000; i++) { c.fillStyle = i % 2 ? "rgba(70,72,80,0.25)" : "rgba(5,5,8,0.3)"; c.fillRect((i * 53) % w, (i * 29) % h, 2, 2); }
  for (let i = 0; i < 6; i++) { c.fillStyle = "rgba(90,100,120,0.12)"; c.beginPath(); c.ellipse((i * 113) % w, (i * 71) % h, 40 + i * 6, 14, 0, 0, 7); c.fill(); } // partes mojadas
}, 256, 256, [12, 4]);
const texCortina = (graffiti: string, color: string) => lienzo((c, w, h) => {
  c.fillStyle = "#5c6066"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 12) { c.fillStyle = "rgba(20,22,26,0.45)"; c.fillRect(0, y, w, 4); c.fillStyle = "rgba(170,175,180,0.15)"; c.fillRect(0, y + 5, w, 2); }
  for (let i = 0; i < 30; i++) { c.fillStyle = "rgba(110,70,40,0.25)"; c.fillRect((i * 41) % w, (i * 67) % h, 6, 18); } // óxido
  c.save(); c.translate(w * 0.5, h * 0.55); c.rotate(-0.12);
  c.font = "bold 78px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.lineWidth = 10; c.strokeStyle = "#141012"; c.strokeText(graffiti, 0, 0);
  c.fillStyle = color; c.fillText(graffiti, 0, 0); c.restore();
}, 512, 384);
const texTrompo = () => lienzo((c, w, h) => {
  c.fillStyle = "#a4401f"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 10) { c.fillStyle = y % 20 ? "rgba(70,20,10,0.45)" : "rgba(230,120,60,0.4)"; c.fillRect(0, y + ((y * 7) % 5), w, 5); }
  for (let i = 0; i < 160; i++) { c.fillStyle = "rgba(40,12,6,0.4)"; c.fillRect((i * 31) % w, (i * 17) % h, 8, 3); }
}, 128, 128);
const texMenu = () => lienzo((c, w, h) => {
  c.fillStyle = "#c8263a"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#f6d24a"; c.fillRect(0, h * 0.78, w, h * 0.22);
  c.textAlign = "center"; c.textBaseline = "middle";
  c.lineWidth = 12; c.strokeStyle = "#3a0e12"; c.font = "bold 120px 'DejaVu Sans', sans-serif";
  c.strokeText("TACOS", w / 2, h * 0.3); c.fillStyle = "#fff6e0"; c.fillText("TACOS", w / 2, h * 0.3);
  c.font = "bold 52px 'DejaVu Sans', sans-serif"; c.fillStyle = "#fff6e0";
  c.fillText("PASTOR · SUADERO · TRIPA · CABEZA", w / 2, h * 0.6);
  c.fillStyle = "#3a0e12"; c.font = "bold 50px 'DejaVu Sans', sans-serif"; c.fillText("3 x $45   ·   CON TODO", w / 2, h * 0.89);
}, 1024, 384);
const texToldo = () => lienzo((c, w, h) => { for (let i = 0; i < 10; i++) { c.fillStyle = i % 2 ? "#e8e2d2" : "#d0662a"; c.fillRect((i * w) / 10, 0, w / 10, h); } }, 256, 64);
const texBillete = (mojado: boolean) => lienzo((c, w, h) => {
  // billete inventado (no copia ninguno real)
  c.fillStyle = mojado ? "#6f8f86" : "#8fae9e"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#2f4a40"; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = "#2f4a40"; c.font = "bold 70px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText("50", w * 0.18, h * 0.3); c.fillText("50", w * 0.82, h * 0.72);
  c.beginPath(); c.arc(w * 0.55, h * 0.5, h * 0.28, 0, 7); c.fillStyle = "rgba(47,74,64,0.35)"; c.fill();
  c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.fillStyle = "#2f4a40"; c.fillText("CINCUENTA PESOS", w * 0.55, h * 0.88);
  if (mojado) {
    for (let i = 0; i < 9; i++) { c.fillStyle = "rgba(20,40,40,0.35)"; c.beginPath(); c.ellipse((i * 67) % w, (i * 43) % h, 30, 18, i, 0, 7); c.fill(); }
    c.strokeStyle = "rgba(220,240,255,0.7)"; c.lineWidth = 4; for (let i = 0; i < 6; i++) { c.beginPath(); c.arc((i * 91 + 30) % w, (i * 53 + 20) % h, 8, 0, 5); c.stroke(); }
  }
}, 512, 256);
const texCharco = () => lienzo((c, w, h) => {
  const g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  g.addColorStop(0, "rgba(120,140,165,0.75)"); g.addColorStop(0.7, "rgba(70,85,105,0.6)"); g.addColorStop(0.95, "rgba(40,50,60,0.0)");
  c.fillStyle = g; c.beginPath();
  for (let i = 0; i <= 24; i++) { const a = (i / 24) * Math.PI * 2, r = w * (0.4 + 0.07 * Math.sin(i * 2.3)); c.lineTo(w / 2 + Math.cos(a) * r, h / 2 + Math.sin(a) * r); }
  c.fill();
  c.fillStyle = "rgba(255,210,140,0.55)"; c.beginPath(); c.ellipse(w * 0.42, h * 0.4, w * 0.08, h * 0.03, -0.3, 0, 7); c.fill(); // reflejo del foco
}, 256, 256);

export function crearTaqueria() {
  const raiz = new THREE.Group();
  // ---- luces generales (aquí y no en el lienzo: en el apagón se bajan) ----
  const amb = new THREE.AmbientLight("#7a8a9a", 0.3); raiz.add(amb);
  const hemi = new THREE.HemisphereLight("#4a5f7a", "#1a120c", 0.42); raiz.add(hemi);
  const luna = new THREE.DirectionalLight("#7f96bc", 0.55); luna.position.set(-20, 30, 25); raiz.add(luna);

  // ---- suelo: banqueta (arriba en y = 0), guarnición y calle 0.15 m abajo ----
  const banq = new THREE.Mesh(new THREE.BoxGeometry(40, 0.25, 6.2), [lambert({ color: "#4e4a44" }), lambert({ color: "#4e4a44" }), lambert({ map: texBanqueta() }), lambert({ color: "#3a3631" }), lambert({ color: "#5a554d" }), lambert({ color: "#3a3631" })]);
  banq.position.set(4, -0.125, BANQUETA - 3.1); raiz.add(banq);
  raiz.add(caja(40, 0.27, 0.2, lambert({ color: "#8a8478" }), 4, -0.125 + 0.01, BANQUETA - 0.05)); // guarnición (1 cm más alta)
  const calle = new THREE.Mesh(new THREE.PlaneGeometry(80, 30), lambert({ map: texAsfalto() })); calle.rotation.x = -Math.PI / 2; calle.position.set(4, CALLE_Y, BANQUETA + 15 - 0.2); raiz.add(calle);
  // calle de la esquina (sale hacia el fondo, a la izquierda)
  const calle2 = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), lambert({ map: texAsfalto() })); calle2.rotation.x = -Math.PI / 2; calle2.position.set(-8.6, CALLE_Y - 0.005, -20 + BANQUETA - 0.2); raiz.add(calle2);
  for (let i = 0; i < 9; i++) raiz.add(caja(1.6, 0.01, 0.16, lambert({ color: "#8a8470" }), -14 + i * 4, CALLE_Y + 0.006, BANQUETA + 4.4)); // raya central
  // charcos de la calle con el reflejo del foco
  const mCharco = new THREE.MeshLambertMaterial({ map: texCharco(), transparent: true, depthWrite: false, emissive: "#ffffff", emissiveMap: texCharco(), emissiveIntensity: 0.25 });
  for (const [x, z, s] of [[0.8, 4.3, 1.8], [-3.2, 5.4, 1.2], [3.6, 6.2, 1.4]]) { const ch = new THREE.Mesh(new THREE.PlaneGeometry(s * 1.6, s), mCharco); ch.rotation.x = -Math.PI / 2; ch.position.set(x, CALLE_Y + 0.012, z); ch.layers.set(NOINK); raiz.add(ch); }

  // ---- el puesto ----
  const puesto = new THREE.Group(); raiz.add(puesto);
  const mAcero = lambert({ color: "#9aa0a6" }), mAceroOsc = lambert({ color: "#5a6066" });
  puesto.add(caja(MOSTRADOR.x * 2, 0.92, 0.76, mAceroOsc, 0, 0.46, 0)); // cuerpo
  puesto.add(caja(MOSTRADOR.x * 2 + 0.1, 0.04, 0.86, mAcero, 0, 0.945, 0)); // cubierta (abajo en 0.925, el cuerpo llega a 0.92)
  const menu = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.78), new THREE.MeshLambertMaterial({ map: texMenu(), emissive: "#ffffff", emissiveMap: texMenu(), emissiveIntensity: 0.1 })); menu.position.set(0, 0.48, 0.386); puesto.add(menu);
  // comal con lumbre abajo y carne; trompo con su piña y la resistencia detrás
  puesto.add(cilindro(0.42, 0.42, 0.03, lambert({ color: "#24201e" }), COMAL.x, COMAL.y, COMAL.z, 32));
  puesto.add(cilindro(0.12, 0.14, 0.038, mAceroOsc, COMAL.x, 0.985, COMAL.z, 16)); // quemador (de 0.966 a 1.004)
  const flama = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.012, 6, 32), brillo("#ff8a3a")); flama.rotation.x = Math.PI / 2; flama.position.set(COMAL.x, 0.985, COMAL.z); flama.layers.set(NOINK); puesto.add(flama);
  const haloComal = destello(255, 150, 70, 1.2, 0.35); haloComal.position.set(COMAL.x, 1.02, COMAL.z + 0.1); puesto.add(haloComal);
  const mCarne = lambert({ color: "#6a3a22" }), mCarne2 = lambert({ color: "#8a4a2a" });
  for (let i = 0; i < 34; i++) { const a = i * 2.39, r = 0.05 + (i % 6) * 0.045; const pz = caja(0.04, 0.012, 0.028, i % 2 ? mCarne : mCarne2, COMAL.x + Math.cos(a) * r, COMAL.y + 0.021, COMAL.z + Math.sin(a) * r); pz.rotation.y = i * 0.7; puesto.add(pz); }
  // vapor del comal (sprites que suben; se animan en el video)
  const vapor: THREE.Sprite[] = [];
  for (let i = 0; i < 6; i++) { const v = destello(220, 215, 205, 0.5, 0.12); v.position.set(COMAL.x, 1.1, COMAL.z); puesto.add(v); vapor.push(v); }
  puesto.add(cilindro(0.015, 0.015, 0.85, mAcero, TROMPO.x, TROMPO.y + 0.42, TROMPO.z)); // varilla
  const carneTrompo = cilindro(0.15, 0.21, 0.52, lambert({ map: texTrompo() }), TROMPO.x, TROMPO.y + 0.33, TROMPO.z, 18); puesto.add(carneTrompo);
  puesto.add(cilindro(0.075, 0.08, 0.12, lambert({ color: "#e0b030" }), TROMPO.x, TROMPO.y + 0.66, TROMPO.z)); // piña
  const hojas = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.14, 7), lambert({ color: "#3a7a3a" })); hojas.position.set(TROMPO.x, TROMPO.y + 0.79, TROMPO.z); puesto.add(hojas);
  puesto.add(caja(0.34, 0.6, 0.04, lambert({ color: "#3a3a3a" }), TROMPO.x, TROMPO.y + 0.33, TROMPO.z - 0.3)); // respaldo de la resistencia
  const resistencia = caja(0.26, 0.5, 0.012, brillo("#ff6a2a"), TROMPO.x, TROMPO.y + 0.33, TROMPO.z - 0.274); resistencia.layers.set(NOINK); puesto.add(resistencia);
  const haloTrompo = destello(255, 120, 50, 0.9, 0.4); haloTrompo.position.set(TROMPO.x, TROMPO.y + 0.33, TROMPO.z - 0.22); puesto.add(haloTrompo);
  // tabla, salsas, limones, platos y servilletero
  puesto.add(caja(0.45, 0.03, 0.3, lambert({ color: "#a07a4a" }), 0.1, 0.985, 0.0));
  for (const [x, col] of [[-1.05, "#b8261e"], [-0.85, "#3f8a2a"], [1.1, "#c2421e"]] as [number, string][]) {
    puesto.add(cilindro(0.08, 0.06, 0.07, lambert({ color: "#3a2a24" }), x, 1.0, 0.28)); // molcajete
    puesto.add(cilindro(0.07, 0.07, 0.01, lambert({ color: col }), x, 1.04, 0.28));
  }
  puesto.add(cilindro(0.09, 0.07, 0.06, lambert({ color: "#e8e0c8" }), 0.62, 0.995, 0.3));
  for (let i = 0; i < 5; i++) puesto.add(cilindro(0.045, 0.045, 0.04, lambert({ color: "#7ab03a" }), 0.6 + Math.cos(i * 1.3) * 0.04, 1.045, 0.3 + Math.sin(i * 1.3) * 0.04, 10)); // limones
  for (let i = 0; i < 6; i++) puesto.add(cilindro(0.11, 0.09, 0.012, lambert({ color: i % 2 ? "#e8e4dc" : "#d6d0c2" }), 0.85, 0.972 + i * 0.016, 0.27, 20)); // platos
  puesto.add(caja(0.12, 0.14, 0.08, lambert({ color: "#c0c4c8" }), 0.38, 1.04, 0.3)); // servilletero
  const caja$ = cilindro(0.08, 0.08, 0.14, lambert({ color: "#c8b060" }), -1.18, 1.035, -0.25, 16); puesto.add(caja$); // lata del dinero
  // toldo con postes y el letrero al frente
  for (const x of [-1.4, 1.4]) for (const z of [-1.4, 0.82]) puesto.add(caja(0.06, 2.7, 0.06, mAceroOsc, x, 1.35, z));
  const toldo = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.5), lambert({ map: texToldo(), side: THREE.DoubleSide }));
  toldo.rotation.x = -Math.PI / 2 + 0.08; toldo.position.set(0, 2.78, -0.2); puesto.add(toldo);
  const letrero = cartel(["TACOS «LA ESQUINA»"], "#f6d24a", "#7a1a14", 3.0, 0.42, 0.25, "#7a1a14"); letrero.position.set(0, 2.62, 1.08); puesto.add(letrero);
  // el foco: cable, foco y halo (la luz principal de toda la historia)
  puesto.add(cilindro(0.006, 0.006, 0.22, lambert({ color: "#141012" }), FOCO.x, FOCO.y + 0.17, FOCO.z, 6));
  const bulbo = new THREE.Mesh(new THREE.SphereGeometry(0.055, 16, 12), brillo("#ffe2a8")); bulbo.position.copy(FOCO); bulbo.layers.set(NOINK); puesto.add(bulbo);
  const haloFoco = destello(255, 205, 130, 2.2, 0.55); haloFoco.position.copy(FOCO); puesto.add(haloFoco);
  const luzFoco = new THREE.PointLight("#ffbf78", 16, 14, 1.0); luzFoco.position.copy(FOCO); puesto.add(luzFoco);
  // hielera, garrafón y tanque de gas
  puesto.add(caja(0.6, 0.42, 0.42, lambert({ color: "#c8263a" }), 1.95, 0.21, -0.35), caja(0.62, 0.05, 0.44, lambert({ color: "#e8e2d2" }), 1.95, 0.445, -0.35));
  puesto.add(cilindro(0.15, 0.15, 0.42, lambert({ color: "#7ab0d0", transparent: true, opacity: 0.75 }), 1.95, 0.68, -0.35));
  puesto.add(cilindro(0.17, 0.17, 0.85, lambert({ color: "#d8d8d0" }), -1.05, 0.425, -0.62), cilindro(0.05, 0.05, 0.08, mAceroOsc, -1.05, 0.89, -0.62));
  // mesa plegable con dos bancos rojos a la derecha
  puesto.add(caja(0.8, 0.03, 0.6, lambert({ color: "#e8e4dc" }), 3.4, 0.74, 1.3));
  for (const [x, z] of [[3.1, 1.1], [3.7, 1.1], [3.1, 1.5], [3.7, 1.5]]) puesto.add(caja(0.03, 0.73, 0.03, mAceroOsc, x, 0.365, z));
  for (const [x, z] of [[2.75, 1.95], [4.05, 1.95]]) { puesto.add(cilindro(0.17, 0.15, 0.04, lambert({ color: "#c8263a" }), x, 0.45, z)); for (const a of [0.8, 2.4, 3.9, 5.5]) puesto.add(caja(0.03, 0.43, 0.03, lambert({ color: "#a01e2e" }), x + Math.cos(a) * 0.11, 0.215, z + Math.sin(a) * 0.11)); }

  // ---- edificios de atrás: cortinas cerradas, farmacia, ventanas ----
  const fachada = caja(16, 6.5, 0.4, lambert({ color: "#6a5a4c" }), 2.5, 3.25, -2.8); raiz.add(fachada);
  raiz.add(caja(16.1, 0.2, 0.5, lambert({ color: "#4a3e34" }), 2.5, 3.3, -2.8)); // cornisa entre pisos
  const cortinas: [number, string, string][] = [[-2.6, "LUPE ♥", "#e07aa0"], [1.2, "EL CHATO", "#7ad0ff"], [6.0, "SFE 13", "#f6d24a"]];
  for (const [x, gr, col] of cortinas) {
    const ct = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.6), lambert({ map: texCortina(gr, col) })); ct.position.set(x, 1.3, -2.594); raiz.add(ct);
  }
  const abarrotes = cartel(["ABARROTES «LUPITA»"], "#2f6fb0", "#fff6e0", 2.8, 0.5, 0.0); abarrotes.position.set(-2.6, 2.95, -2.594); raiz.add(abarrotes);
  const farmacia = cartel(["FARMACIA 24 H"], "#e8efe4", "#1f7a3a", 2.8, 0.5, 0.0); farmacia.position.set(6.0, 2.95, -2.594); raiz.add(farmacia);
  // cruz verde de la farmacia (encendida: color frío que contrasta con el foco)
  const cruz = new THREE.Group(); cruz.position.set(8.0, 2.95, -2.5); raiz.add(cruz);
  cruz.add(caja(0.5, 0.16, 0.06, brillo("#3adf6a"), 0, 0, 0), caja(0.16, 0.5, 0.06, brillo("#3adf6a"), 0, 0, 0.005));
  cruz.children.forEach((o) => o.layers.set(NOINK));
  const haloCruz = destello(80, 230, 120, 2.2, 0.45); haloCruz.position.set(0, 0, 0.12); cruz.add(haloCruz);
  const luzCruz = new THREE.PointLight("#5aff8a", 1.6, 6, 1.5); luzCruz.position.set(0, 0, 0.6); cruz.add(luzCruz);
  // ventanas del segundo piso (algunas encendidas; en el apagón se apagan)
  const ventanas: { v: THREE.Mesh; h: THREE.Sprite }[] = [];
  for (const [x, on] of [[-4.2, false], [-1.4, true], [1.6, false], [4.4, false], [7.6, true]] as [number, boolean][]) {
    const v = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.3), brillo(on ? "#ffc56e" : "#151a22")); v.position.set(x, 4.7, -2.594); raiz.add(v);
    raiz.add(caja(1.3, 0.08, 0.2, lambert({ color: "#4a3e34" }), x, 3.98, -2.5));
    if (on) { const h = destello(255, 200, 120, 1.8, 0.25); h.position.set(x, 4.7, -2.45); raiz.add(h); ventanas.push({ v, h }); }
  }
  // poste de luz con cables (el foco del poste está fundido: la esquina queda oscura)
  raiz.add(cilindro(0.1, 0.13, 7.5, lambert({ color: "#5a5a58" }), -4.8, 3.75, 2.7, 10));
  raiz.add(caja(1.4, 0.08, 0.08, lambert({ color: "#5a5a58" }), -4.2, 7.1, 2.7), caja(0.5, 0.12, 0.25, lambert({ color: "#3a3a38" }), -3.6, 7.0, 2.7));
  for (const [z, y] of [[2.6, 6.8], [2.8, 6.6]]) raiz.add(caja(40, 0.015, 0.015, lambert({ color: "#141012" }), 12, y, z));
  // farola lejana encendida (sodio) al fondo de la calle
  raiz.add(cilindro(0.08, 0.1, 6.5, lambert({ color: "#4a4a48" }), 15, 3.25, 3.0, 8));
  const farola = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), brillo("#ffb060")); farola.position.set(15, 6.4, 3.4); farola.layers.set(NOINK); raiz.add(farola);
  const haloFarola = destello(255, 170, 90, 4, 0.35); haloFarola.position.set(15, 6.4, 3.6); raiz.add(haloFarola);
  const luzFarola = new THREE.PointLight("#ffaa5a", 3.5, 14, 1.3); luzFarola.position.set(15, 6.0, 4); raiz.add(luzFarola);
  // farola fría al fondo de la calle de la esquina (para que lo oscuro se lea y no sea negro)
  raiz.add(cilindro(0.08, 0.1, 6.0, lambert({ color: "#4a4a48" }), -11.6, 3.0, -9, 8));
  const farola2 = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), brillo("#cfe0ff")); farola2.position.set(-11.0, 5.9, -9); farola2.layers.set(NOINK); raiz.add(farola2);
  const haloFarola2 = destello(170, 200, 255, 3.5, 0.3); haloFarola2.position.set(-10.8, 5.9, -8.8); raiz.add(haloFarola2);
  const luzFarola2 = new THREE.PointLight("#8aa8e0", 5, 22, 1.1); luzFarola2.position.set(-10.5, 5.5, -8.5); raiz.add(luzFarola2);
  // edificio de la esquina de enfrente (otro lado de la calle 2) y casas del otro lado de la calle
  raiz.add(caja(8, 5.5, 8, lambert({ color: "#4a4440" }), -15.6, 2.75, -2));
  const c1 = casa(5, 3.2, 4, [false, true, false], "#5a4a44"); c1.position.set(-2, CALLE_Y, 16); c1.rotation.y = Math.PI; raiz.add(c1);
  const c2 = casa(6, 3.6, 4, [false, false, true], "#4a5058"); c2.position.set(5, CALLE_Y, 16.5); c2.rotation.y = Math.PI; raiz.add(c2);
  const c3 = casa(5, 3.0, 4, [true, false], "#5a5446"); c3.position.set(11.5, CALLE_Y, 16); c3.rotation.y = Math.PI; raiz.add(c3);
  raiz.add(caja(60, 0.25, 3, lambert({ color: "#4e4a44" }), 4, CALLE_Y + 0.12, 13.2)); // banqueta de enfrente

  // ---- el taxi (llega a las 2:10) ----
  const taxi = carro("#e6e2d8");
  for (const z of [-0.905, 0.905]) taxi.g.add(caja(3.6, 0.12, 0.01, lambert({ color: "#b8262e" }), 0, 0.62, z));
  const tTaxi = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.22), new THREE.MeshLambertMaterial({ map: lienzo((c, w, h) => { c.fillStyle = "#f6d24a"; c.fillRect(0, 0, w, h); c.fillStyle = "#141012"; c.font = "bold 44px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("TAXI", w / 2, h / 2 + 2); }, 160, 64), emissive: "#ffffff", emissiveIntensity: 0.5 }));
  tTaxi.position.set(-0.3, 1.65, 0); taxi.g.add(tTaxi);
  const luzFaros = new THREE.SpotLight("#fff2d8", 0, 18, 0.5, 0.5, 1.2); luzFaros.position.set(2.2, 0.75, 0); luzFaros.target.position.set(8, 0, 0); taxi.g.add(luzFaros, luzFaros.target);
  taxi.g.position.set(-30, CALLE_Y, 4.6); raiz.add(taxi.g);

  // ---- charco que deja la mujer de blanco ----
  const charco = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), new THREE.MeshLambertMaterial({ map: texCharco(), transparent: true, depthWrite: false, emissive: "#ffffff", emissiveMap: texCharco(), emissiveIntensity: 0.7 }));
  charco.rotation.x = -Math.PI / 2; charco.position.set(-0.45, 0.02, 1.15); charco.layers.set(NOINK); charco.visible = false; raiz.add(charco);
  // gotas que caen de la mujer (se mueven en el video)
  const gotas: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) { const g = new THREE.Mesh(new THREE.SphereGeometry(0.012, 6, 4), brillo("#bcd6f0")); g.layers.set(NOINK); g.visible = false; raiz.add(g); gotas.push(g); }
  // billetes sobre el mostrador (el mojado y el seco de la lata)
  const billete = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.08), lambert({ map: texBillete(true) })); billete.rotation.x = -Math.PI / 2; billete.position.set(0.0, 0.977, 0.3); billete.visible = false; raiz.add(billete);
  const gotaBillete = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.16), new THREE.MeshLambertMaterial({ map: texCharco(), transparent: true, depthWrite: false })); gotaBillete.rotation.x = -Math.PI / 2; gotaBillete.position.set(0.0, 0.971, 0.3); gotaBillete.visible = false; gotaBillete.layers.set(NOINK); raiz.add(gotaBillete);
  for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.05), lambert({ map: texBillete(false), side: THREE.DoubleSide })); b.position.set(-1.18 + (i - 1) * 0.015, 1.13, -0.25); b.rotation.set(0.1 * i, 0.4 * i, 0.12); raiz.add(b); }

  // luz extra para planos cerrados (rebote del foco en las caras)
  const luzExtra = new THREE.PointLight("#ffd9a8", 0, 4, 1.5); raiz.add(luzExtra);
  // luz fría y tenue del apagón (para que lo oscuro no sea negro total)
  const luzApagon = new THREE.PointLight("#5a74a8", 0, 9, 1.4); luzApagon.position.set(1.5, 3.2, 4.5); raiz.add(luzApagon);

  return {
    raiz, amb, hemi, luna, luzFoco, bulbo, haloFoco, flama, haloComal, vapor, resistencia, haloTrompo, carneTrompo,
    luzCruz, haloCruz, taxi, luzFaros, charco, gotas, billete, gotaBillete, luzExtra, luzApagon,
    luzFarola, haloFarola, farola, ventanas, luzFarola2, haloFarola2, farola2,
  };
}
export type Taqueria = ReturnType<typeof crearTaqueria>;
