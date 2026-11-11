// Escenario de «La rueda de la feria»: rueda de la fortuna con canastillas numeradas, plataforma, caseta y palanca;
// pasillo de puestos con guirnaldas de focos; carrusel; pueblo y monte al fondo. Parte de las mejoras de la guía §8.8
// (luz cálida con halos, utilería, gente) y de las reglas §8.6c (nada encimado: cada capa a ≥ 5 mm).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { caja, lambert, lienzo, resplandor, texTexto } from "../turno3/comun";
import { cartel, casa } from "../comun/utileria";

export const RUEDA = { y: 10.62, r: 8, n: 8 }; // centro, radio y número de canastillas
export const PALANCA = { x: 2.35, z: 1.75 };
export const CASETA = { x: 4.6, z: 2.6 };
export const PASILLO = { z0: 8, z1: 27, x: 5.4 }; // puestos a ±x entre z0 y z1

const brillo = (color: string) => new THREE.MeshBasicMaterial({ color, toneMapped: false });
export const destello = (r: number, g: number, b: number, tam: number, op = 0.5) => {
  const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(r, g, b), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: op }));
  sp.scale.set(tam, tam, 1); sp.layers.set(NOINK); return sp;
};
const barra = (a: THREE.Vector3, b: THREE.Vector3, grueso: number, m: THREE.Material) => {
  const d = b.clone().sub(a), L = d.length();
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(grueso, L, grueso), m);
  mesh.position.copy(a).add(b).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
  return mesh;
};

// ------------------------------------------------------------------ texturas
const texTierra = (rep: [number, number]) => lienzo((c, w, h) => {
  c.fillStyle = "#4a3c2e"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${i % 3 ? 30 : 110},${i % 3 ? 24 : 92},${i % 3 ? 18 : 70},0.25)`; c.fillRect((i * 37) % w, (i * 91) % h, 3 + (i % 4), 2 + (i % 3)); }
}, 256, 256, rep);
const texPasto = (rep: [number, number]) => lienzo((c, w, h) => {
  c.fillStyle = "#1d2a1c"; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { c.fillStyle = i % 2 ? "rgba(40,60,36,0.5)" : "rgba(12,20,12,0.5)"; c.fillRect((i * 53) % w, (i * 29) % h, 2, 6); }
}, 256, 256, rep);
const texRayas = (a: string, b: string) => lienzo((c, w, h) => { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? a : b; c.fillRect((i * w) / 8, 0, w / 8, h); } }, 256, 64);
const texMadera = () => lienzo((c, w, h) => {
  c.fillStyle = "#6a4a30"; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 32) { c.fillStyle = "#4a321f"; c.fillRect(0, y, w, 3); }
  for (let i = 0; i < 80; i++) { c.fillStyle = "rgba(40,26,14,0.35)"; c.fillRect((i * 71) % w, (i * 13) % h, 40, 2); }
}, 256, 256, [2, 1]);
const texNumero = (n: number, fondo: string) => lienzo((c, w, h) => {
  c.fillStyle = fondo; c.fillRect(0, 0, w, h);
  c.fillStyle = "#fff6e0"; c.beginPath(); c.arc(w / 2, h / 2, h * 0.42, 0, Math.PI * 2); c.fill();
  c.strokeStyle = "#1a1416"; c.lineWidth = 8; c.stroke();
  c.fillStyle = "#1a1416"; c.font = "bold 92px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(String(n), w / 2, h / 2 + 6);
}, 256, 128);

const COLORES_FOCO = ["#ffcf6a", "#ff6a5a", "#7ad0ff", "#ffe9a8"];
const COLORES_CANASTILLA = ["#c8263a", "#e0a82a", "#2f6fb0", "#3a9a5a"];

export function crearFeria() {
  const raiz = new THREE.Group();

  // ---- suelo (capas separadas: pasto −0.02, tierra 0, pasillo 0.01) ----
  const pasto = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), lambert({ map: texPasto([70, 70]) })); pasto.rotation.x = -Math.PI / 2; pasto.position.y = -0.02; raiz.add(pasto);
  const tierra = new THREE.Mesh(new THREE.PlaneGeometry(44, 44), lambert({ map: texTierra([10, 10]) })); tierra.rotation.x = -Math.PI / 2; tierra.position.set(0, 0, 6); raiz.add(tierra);

  // ---- rueda de la fortuna ----
  const rueda = new THREE.Group(); rueda.position.set(0, RUEDA.y, 0); raiz.add(rueda);
  const giro = new THREE.Group(); rueda.add(giro); // aros, rayos y focos (giran)
  const mBlanco = lambert({ color: "#e2ddd0" }), mRojo = lambert({ color: "#b8323a" }), mGris = lambert({ color: "#6a6c70" });
  for (const z of [-0.75, 0.75]) {
    const aro = new THREE.Mesh(new THREE.TorusGeometry(RUEDA.r, 0.09, 8, 96), mBlanco); aro.position.z = z; giro.add(aro);
    const aro2 = new THREE.Mesh(new THREE.TorusGeometry(RUEDA.r * 0.55, 0.06, 8, 64), mRojo); aro2.position.z = z; giro.add(aro2);
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * Math.PI * 2;
      giro.add(barra(new THREE.Vector3(0, 0, z), new THREE.Vector3(Math.cos(a) * RUEDA.r, Math.sin(a) * RUEDA.r, z), 0.07, i % 2 ? mBlanco : mRojo));
    }
  }
  for (let i = 0; i < RUEDA.n; i++) { // travesaños donde cuelgan las canastillas
    const a = (i / RUEDA.n) * Math.PI * 2;
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), mGris); t.rotation.x = Math.PI / 2; t.position.set(Math.cos(a) * RUEDA.r, Math.sin(a) * RUEDA.r, 0); giro.add(t);
  }
  // focos del aro: 4 materiales que se «persiguen» (chase) mientras la feria está encendida
  const matFocos = COLORES_FOCO.map((c) => brillo(c));
  const geoFoco = new THREE.SphereGeometry(0.11, 8, 6);
  const focosRueda: THREE.Mesh[] = [];
  for (const z of [-0.85, 0.85]) for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const f = new THREE.Mesh(geoFoco, matFocos[i % 4]); f.position.set(Math.cos(a) * RUEDA.r, Math.sin(a) * RUEDA.r, z); f.layers.set(NOINK); giro.add(f); focosRueda.push(f);
  }
  for (const z of [-0.8, 0.8]) for (let i = 0; i < 16; i++) for (let k = 1; k <= 3; k++) {
    const a = (i / 16) * Math.PI * 2, rr = RUEDA.r * (0.22 + 0.22 * k);
    const f = new THREE.Mesh(geoFoco, matFocos[(i + k) % 4]); f.position.set(Math.cos(a) * rr, Math.sin(a) * rr, z); f.scale.setScalar(0.8); f.layers.set(NOINK); giro.add(f); focosRueda.push(f);
  }
  // lo que queda del lado de la cámara (aro, rayos y focos de enfrente): se oculta en los planos dentro de la rueda
  const frenteRueda = giro.children.filter((o) => o.position.z > 0.3 || (o as THREE.Mesh).geometry?.type === "BoxGeometry" && (o.position.z > 0.3));
  const estrella = new THREE.Mesh(new THREE.CircleGeometry(0.9, 10), brillo("#ffe2a0")); estrella.position.z = 0.95; estrella.layers.set(NOINK); giro.add(estrella);
  const haloRueda = destello(255, 205, 140, 22, 0.22); haloRueda.position.z = 1.2; rueda.add(haloRueda);
  // eje y patas en A (no giran)
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 3.0, 12), mGris); eje.rotation.x = Math.PI / 2; rueda.add(eje);
  for (const z of [-1.35, 1.35]) for (const s of [-1, 1]) {
    raiz.add(barra(new THREE.Vector3(s * 4.6, 0, z * 1.2), new THREE.Vector3(0, RUEDA.y, z), 0.3, mBlanco));
  }
  for (const z of [-1.62, 1.62]) raiz.add(barra(new THREE.Vector3(-2.6, 4.6, z), new THREE.Vector3(2.6, 4.6, z), 0.16, mBlanco));

  // canastillas: cuelgan del travesaño y siempre quedan derechas; la caja es cerrada (las piernas de quien va
  // sentado quedan dentro y no se ven); el número va al frente
  const canastillas: THREE.Group[] = [];
  for (let n = 1; n <= RUEDA.n; n++) {
    const g = new THREE.Group(); raiz.add(g); canastillas.push(g);
    const col = COLORES_CANASTILLA[(n - 1) % 4];
    const mC = lambert({ color: col });
    g.add(caja(0.08, 0.3, 0.08, mGris, 0, -0.15, 0));
    g.add(caja(1.7, 0.08, 1.3, lambert({ color: "#f1ead8" }), 0, -0.34, 0)); // techito
    const ton = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.35, 4), mC); ton.rotation.y = Math.PI / 4; ton.position.y = -0.12; g.add(ton);
    for (const sx of [-0.75, 0.75]) for (const sz of [-0.5, 0.5]) g.add(caja(0.05, 0.78, 0.05, mGris, sx, -0.77, sz));
    g.add(caja(1.6, 1.2, 1.12, mC, 0, -1.76, 0)); // tina
    g.add(caja(1.66, 0.08, 1.18, mBlanco, 0, -1.19, 0)); // borde (1 cm sobre la tina: no se encima)
    const num = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.31), new THREE.MeshLambertMaterial({ map: texNumero(n, col), emissive: "#ffffff", emissiveMap: texNumero(n, col), emissiveIntensity: 0.35 }));
    num.position.set(0, -1.66, 0.57); g.add(num);
    const num2 = num.clone(); num2.rotation.y = Math.PI; num2.position.z = -0.57; g.add(num2);
  }

  // plataforma de abordar, escalones, cadena y letrero
  const mMadera = lambert({ map: texMadera() });
  raiz.add(caja(3.4, 0.24, 2.6, mMadera, 0, 0.12, 0.2));
  raiz.add(caja(1.4, 0.12, 0.5, mMadera, 0, 0.06, 1.75));
  for (const s of [-1, 1]) raiz.add(caja(0.08, 1.0, 0.08, lambert({ color: "#d8c27a" }), s * 1.1, 0.74, 1.4));
  const cadena = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.025, 6, 24, Math.PI), lambert({ color: "#c9c4b4" })); cadena.rotation.z = Math.PI; cadena.scale.set(1, 0.25, 1); cadena.position.set(0, 1.12, 1.4); raiz.add(cadena);
  const suba = cartel(["SUBA AQUÍ", "$20 · 3 VUELTAS"], "#f2c94c", "#5a2a14", 1.0, 0.6, 0.3); suba.position.set(-2.6, 2.3, 6.36); raiz.add(suba); // en el poste izquierdo del arco

  // arco de entrada con focos
  const arco = new THREE.Group(); arco.position.set(0, 0, 6.2); raiz.add(arco);
  for (const s of [-1, 1]) arco.add(caja(0.25, 3.6, 0.25, mRojo, s * 2.6, 1.8, 0));
  const letrero = cartel(["RUEDA DE LA FORTUNA"], "#7a1e2a", "#ffe08a", 5.4, 0.8, 0.6, "#ffe08a"); letrero.position.set(0, 3.9, 0.05); arco.add(letrero);
  arco.add(caja(5.6, 1.0, 0.12, lambert({ color: "#3a1418" }), 0, 3.9, -0.04));
  const focosArco: THREE.Mesh[] = [];
  for (let i = 0; i < 18; i++) { const f = new THREE.Mesh(geoFoco, matFocos[i % 4]); f.position.set(-2.7 + (i * 5.4) / 17, 4.5, 0.08); f.layers.set(NOINK); arco.add(f); focosArco.push(f); }

  // caseta del operador y palanca
  const caseta = new THREE.Group(); caseta.position.set(CASETA.x, 0, CASETA.z); raiz.add(caseta);
  caseta.add(caja(1.6, 2.2, 1.4, lambert({ color: "#d9cfb8" }), 0, 1.1, 0));
  caseta.add(caja(1.9, 0.12, 1.7, mRojo, 0, 2.3, 0));
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.6), brillo("#ffd79a")); vent.position.set(0, 1.45, 0.71); vent.layers.set(NOINK); caseta.add(vent);
  const boletos = cartel(["BOLETOS"], "#2f6fb0", "#ffffff", 1.1, 0.3, 0.4); boletos.position.set(0, 2.0, 0.72); caseta.add(boletos);
  const focoCaseta = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), brillo("#ffe2b0")); focoCaseta.position.set(0, 2.5, 0.75); focoCaseta.layers.set(NOINK); caseta.add(focoCaseta);
  const haloCaseta = destello(255, 220, 160, 2.0, 0.45); haloCaseta.position.set(0, 2.5, 0.8); caseta.add(haloCaseta);
  const palanca = new THREE.Group(); palanca.position.set(PALANCA.x, 0, PALANCA.z); raiz.add(palanca);
  palanca.add(caja(0.5, 0.9, 0.4, mGris, 0, 0.45, 0));
  const placa = cartel(["MARCHA", "FRENO"], "#2a2c30", "#ffd23a", 0.42, 0.3, 0.3); placa.position.set(0, 0.62, 0.205); palanca.add(placa);
  const brazo = new THREE.Group(); brazo.position.set(0, 0.92, 0); palanca.add(brazo);
  brazo.add(caja(0.06, 0.7, 0.06, lambert({ color: "#9a9c9e" }), 0, 0.35, 0));
  const perilla = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), lambert({ color: "#c8263a" })); perilla.position.y = 0.72; brazo.add(perilla);

  // ---- pasillo de puestos (se miran de frente a través del pasillo) ----
  const puestos: { g: THREE.Group; luz: THREE.Mesh; halo: THREE.Sprite }[] = [];
  const puesto = (nombre: string[], color: string, x: number, z: number, cosas: string[]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = x < 0 ? Math.PI / 2 : -Math.PI / 2; raiz.add(g);
    g.add(caja(3.0, 2.6, 0.12, lambert({ color: "#3a3230" }), 0, 1.3, -1.2)); // fondo
    for (const s of [-1, 1]) g.add(caja(0.12, 2.6, 2.4, lambert({ color: "#4a3a32" }), s * 1.5, 1.3, 0));
    g.add(caja(3.0, 1.0, 0.5, lambert({ color }), 0, 0.5, 0.75)); // mostrador
    g.add(caja(3.1, 0.06, 0.6, lambert({ color: "#e8e0cc" }), 0, 1.03, 0.75));
    const toldo = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 1.2), lambert({ map: texRayas(color, "#f1ead8"), side: THREE.DoubleSide })); toldo.position.set(0, 2.85, 1.0); toldo.rotation.x = -0.9; g.add(toldo);
    const c = cartel(nombre, color, "#ffffff", 2.4, 0.6, 0.45, "#ffffff"); c.position.set(0, 3.45, 0.9); g.add(c);
    cosas.forEach((cc, i) => { g.add(caja(0.28, 0.28 + (i % 3) * 0.1, 0.25, lambert({ color: cc }), -1.1 + i * 0.37, 1.2 + (i % 2) * 0.9, -1.0)); });
    g.add(caja(3.0, 0.05, 0.4, lambert({ color: "#5a4a3a" }), 0, 1.86, -1.0)); // repisa
    const luz = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), brillo("#ffe0a8")); luz.position.set(0, 2.45, 0.4); luz.layers.set(NOINK); g.add(luz);
    const halo = destello(255, 214, 150, 2.4, 0.4); halo.position.set(0, 2.45, 0.5); g.add(halo);
    puestos.push({ g, luz, halo });
  };
  const premios = ["#e05a7a", "#ffd23a", "#5ab0e0", "#8a5ad0", "#ff8a3a", "#5ad08a", "#e0e0e0"];
  puesto(["ELOTES", "Y ESQUITES"], "#2f8a4a", -PASILLO.x, 10.5, ["#e8c85a", "#e8c85a", "#d0b048", "#e8c85a"]);
  puesto(["ALGODONES"], "#d0567a", PASILLO.x, 11.5, ["#ff9ac0", "#9ad0ff", "#ff9ac0", "#ffffff", "#9ad0ff"]);
  puesto(["TIRO AL", "BLANCO"], "#c8263a", -PASILLO.x, 15.5, premios);
  puesto(["LOTERÍA"], "#2f6fb0", PASILLO.x, 16.5, premios.slice(2));
  puesto(["AGUAS", "FRESCAS"], "#e0a82a", -PASILLO.x, 20.5, ["#ff6a5a", "#ffd23a", "#7ad08a", "#ff6a5a"]);
  puesto(["CANICAS", "Y DARDOS"], "#5a3a8a", PASILLO.x, 21.5, premios);

  // guirnaldas de focos y banderines cruzando el pasillo
  const focosGuirnalda: THREE.Mesh[][] = [];
  const halosGuirnalda: THREE.Sprite[] = [];
  const mPoste = lambert({ color: "#3a3230" });
  const bander = ["#c8263a", "#ffd23a", "#2f6fb0", "#3a9a5a", "#e05a7a"];
  [9.2, 13.2, 17.4, 21.6, 25.6].forEach((z, gi) => {
    for (const s of [-1, 1]) raiz.add(caja(0.14, 4.4, 0.14, mPoste, s * 4.2, 2.2, z));
    const fila: THREE.Mesh[] = [];
    for (let i = 0; i <= 16; i++) {
      const t = i / 16, x = -4.2 + 8.4 * t, y = 4.25 - Math.sin(t * Math.PI) * 0.7;
      const f = new THREE.Mesh(geoFoco, matFocos[(i + gi) % 4]); f.position.set(x, y - 0.1, z); f.layers.set(NOINK); raiz.add(f); fila.push(f);
      if (i % 4 === 2) { const h = destello(255, 205, 140, 1.4, 0.3); h.position.set(x, y - 0.1, z + 0.05); raiz.add(h); halosGuirnalda.push(h); }
      if (i < 16) { // banderín triangular
        const b = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.36, 3), lambert({ color: bander[(i + gi) % 5] })); b.rotation.z = Math.PI; b.position.set(x + 0.26, y - 0.32, z + 0.3); raiz.add(b);
      }
    }
    focosGuirnalda.push(fila);
  });
  // guirnaldas entre la rueda y el arco
  for (const s of [-1, 1]) {
    const fila: THREE.Mesh[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10, x = s * (2.7 + 6 * t), y = 4.4 - Math.sin(t * Math.PI) * 0.6 - t * 0.6, z = 6.2 - t * 1.0;
      const f = new THREE.Mesh(geoFoco, matFocos[i % 4]); f.position.set(x, y, z); f.layers.set(NOINK); raiz.add(f); fila.push(f);
    }
    raiz.add(caja(0.14, 3.8, 0.14, mPoste, s * 8.7, 1.9, 5.2));
    focosGuirnalda.push(fila);
  }

  // ---- carrusel (a la izquierda, detrás) ----
  const carrusel = new THREE.Group(); carrusel.position.set(-13, 0, 2); raiz.add(carrusel);
  const girCarr = new THREE.Group(); carrusel.add(girCarr);
  carrusel.add(new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.4, 0.4, 24), lambert({ color: "#d8c27a" }))).position.y = 0.2;
  const techoC = new THREE.Mesh(new THREE.ConeGeometry(4.8, 2.0, 16, 1, true), lambert({ map: texRayas("#c8263a", "#f1ead8"), side: THREE.DoubleSide })); techoC.position.y = 4.8; girCarr.add(techoC);
  girCarr.add(new THREE.Mesh(new THREE.CylinderGeometry(4.75, 4.75, 0.4, 24, 1, true), lambert({ color: "#e0a82a", side: THREE.DoubleSide }))).position.y = 3.7;
  girCarr.add(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 4.0, 10), lambert({ color: "#e2ddd0" }))).position.y = 2.2;
  const focosCarr: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    girCarr.add(caja(0.06, 3.3, 0.06, lambert({ color: "#e0c070" }), Math.cos(a) * 3.3, 2.05, Math.sin(a) * 3.3));
    const cab = new THREE.Group(); cab.position.set(Math.cos(a) * 3.3, 1.3 + (i % 2) * 0.3, Math.sin(a) * 3.3); cab.rotation.y = -a; girCarr.add(cab);
    cab.add(caja(0.25, 0.4, 0.9, lambert({ color: i % 3 ? "#f1ead8" : "#3a2a20" }), 0, 0, 0), caja(0.22, 0.45, 0.22, lambert({ color: i % 3 ? "#f1ead8" : "#3a2a20" }), 0, 0.3, 0.42));
    const f = new THREE.Mesh(geoFoco, matFocos[i % 4]); f.position.set(Math.cos(a) * 4.76, 3.95, Math.sin(a) * 4.76); f.layers.set(NOINK); girCarr.add(f); focosCarr.push(f);
  }
  const haloCarr = destello(255, 190, 120, 9, 0.25); haloCarr.position.set(0, 3.6, 0); carrusel.add(haloCarr);

  // ---- cerca, árboles, pueblo y cielo ----
  const mCerca = lambert({ color: "#5a4a3a" });
  for (let x = -22; x <= 22; x += 2) raiz.add(caja(0.1, 1.0, 0.1, mCerca, x, 0.5, -6));
  raiz.add(caja(44, 0.08, 0.06, mCerca, 0, 0.85, -6));
  for (let z = -6; z <= 28; z += 2) for (const x of [-22, 22]) raiz.add(caja(0.1, 1.0, 0.1, mCerca, x, 0.5, z));
  for (const x of [-22, 22]) raiz.add(caja(0.06, 0.08, 34, mCerca, x, 0.85, 11));
  const monte = new THREE.Group(); raiz.add(monte);
  const mMonte = lambert({ color: "#141d27" }), mArbol = lambert({ color: "#18261c" }), mTronco = lambert({ color: "#2a2018" });
  for (const [x, z, sx, sy] of [[-40, -60, 50, 18], [20, -70, 60, 24], [70, -50, 40, 14], [-80, 20, 40, 14], [80, 30, 40, 16]]) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), mMonte); m.scale.set(sx, sy, sx * 0.5); m.position.set(x, -0.5, z); monte.add(m);
  }
  for (let i = 0; i < 60; i++) {
    const a = (i * 2.399) % (Math.PI * 2), d = 30 + (i * 7.3) % 25;
    const x = Math.cos(a) * d * 1.3, z = Math.sin(a) * d * 0.9 + 4;
    if (z > 0 && Math.abs(x) < 26) continue;
    const h = 4 + (i % 5) * 1.1;
    monte.add(caja(0.25, h * 0.3, 0.25, mTronco, x, h * 0.15, z));
    for (let k = 0; k < 3; k++) { const c = new THREE.Mesh(new THREE.ConeGeometry(h * (0.32 - k * 0.07), h * 0.45, 8), mArbol); c.position.set(x, h * (0.38 + k * 0.2), z); monte.add(c); }
  }
  // el pueblo detrás de la feria: casas con ventanas encendidas y la torre de la iglesia
  const pueblo = new THREE.Group(); raiz.add(pueblo);
  [[-30, -24, 0.2], [-22, -30, -0.1], [-12, -28, 0.15], [12, -27, -0.2], [22, -31, 0.1], [32, -25, -0.25], [-38, -14, 0.9], [38, -12, -0.9]].forEach(([x, z, ry], i) => {
    const k = casa(4 + (i % 3), 3 + (i % 2) * 0.8, 4, [i % 2 === 0, true, i % 3 === 0], ["#3a3530", "#4a3a30", "#35302a"][i % 3]); k.position.set(x, 0, z); k.rotation.y = ry; pueblo.add(k);
  });
  const torre = new THREE.Group(); torre.position.set(4, 0, -36); pueblo.add(torre);
  torre.add(caja(3, 12, 3, lambert({ color: "#5a4e44" }), 0, 6, 0));
  const cupula = new THREE.Mesh(new THREE.ConeGeometry(2.2, 3, 4), lambert({ color: "#3a2a24" })); cupula.position.y = 13.5; cupula.rotation.y = Math.PI / 4; torre.add(cupula);
  const reloj = new THREE.Mesh(new THREE.CircleGeometry(0.8, 20), brillo("#ffe2b0")); reloj.position.set(0, 9.5, 1.52); reloj.layers.set(NOINK); torre.add(reloj);
  const haloReloj = destello(255, 220, 160, 3.0, 0.35); haloReloj.position.set(0, 9.5, 1.7); torre.add(haloReloj);

  const cielo = new THREE.Mesh(new THREE.SphereGeometry(150, 32, 16), new THREE.MeshBasicMaterial({ side: THREE.BackSide, fog: false, depthWrite: false, map: lienzo((c, w, h) => {
    const g2 = c.createLinearGradient(0, 0, 0, h); g2.addColorStop(0, "#04060a"); g2.addColorStop(0.3, "#0b1322"); g2.addColorStop(0.47, "#26344c"); g2.addColorStop(0.5, "#2c3a52"); g2.addColorStop(0.56, "#0b111a"); g2.addColorStop(1, "#050709");
    c.fillStyle = g2; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(220,230,255,${0.3 + (i % 5) * 0.12})`; c.fillRect((i * 97) % w, (i * 53) % (h * 0.42), 2, 2); }
  }, 1024, 512) }));
  cielo.layers.set(NOINK); raiz.add(cielo);
  const luna = destello(200, 215, 235, 16, 0.3); luna.position.set(30, 38, -80); raiz.add(luna);
  const disco = new THREE.Mesh(new THREE.CircleGeometry(1.8, 24), new THREE.MeshBasicMaterial({ color: "#d9dfe6", fog: false, toneMapped: false })); disco.position.set(30, 38, -79.9); disco.lookAt(0, 5, 10); disco.layers.set(NOINK); raiz.add(disco);

  // ---- luces ----
  const luzRueda = new THREE.PointLight("#ffcf8a", 9, 26, 1.2); luzRueda.position.set(0, RUEDA.y, 3.0); raiz.add(luzRueda);
  const luzPlataforma = new THREE.PointLight("#ffd9a0", 3.2, 9, 1.4); luzPlataforma.position.set(0, 4.2, 5.4); raiz.add(luzPlataforma);
  const lucesPasillo = [11, 17, 23].map((z) => { const l = new THREE.PointLight("#ffc77a", 4.5, 11, 1.3); l.position.set(0, 3.6, z); raiz.add(l); return l; });
  const luzCaseta = new THREE.PointLight("#ffe0b0", 2.4, 5, 1.5); luzCaseta.position.set(CASETA.x, 2.4, CASETA.z + 1.0); raiz.add(luzCaseta);
  const luzCarr = new THREE.PointLight("#ffb070", 4, 11, 1.3); luzCarr.position.set(-13, 4.2, 4.5); raiz.add(luzCarr);
  const luzLuna = new THREE.DirectionalLight("#8aa2c4", 0.9); luzLuna.position.set(30, 40, -30); raiz.add(luzLuna);
  const luzExtra = new THREE.PointLight("#ffe2b0", 0, 8, 1.4); raiz.add(luzExtra);

  return {
    raiz, giro, canastillas, focosRueda, frenteRueda, matFocos, focosArco, focosGuirnalda, halosGuirnalda, puestos, focosCarr, girCarr, haloCarr, haloRueda,
    estrella, brazo, vent, focoCaseta, haloCaseta, luzRueda, luzPlataforma, lucesPasillo, luzCaseta, luzCarr, luzExtra, pueblo,
  };
}
void texTexto;
