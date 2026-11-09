// Prueba original de 3 s (90 cuadros) según GUIA_DE_ESTILO_SUSPENSO.md. Sin voz.
// Plano 1 (0–53, 1.8 s = duración mediana medida): un huésped en el pasillo de un hotel oye algo al fondo, gira la
//   cabeza y reacciona. Plano 2 (54–89): por encima de su hombro, la puerta de la escalera de emergencia se abre y
//   sale otra persona.
// Cámara: acercamiento lento dentro de cada plano (~0.1 %/cuadro), corte duro entre planos.
// Post (del tutorial, MIT): tinta → desenfoque de lente → bloom + tono NEUTRAL + color + viñeta.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, useCurrentFrame, interpolate, Easing } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction, BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, RenderPass,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from "postprocessing";
import { InkPass, NOINK } from "../alejandro/ink";
import { LensBlur } from "../alejandro/lensblur";
import { Aspecto, LIENZO_H, LIENZO_W, PIES, Pose, dibujarPersonaje } from "./personaje";

export const PRUEBA_CUADROS = 90;
const CORTE = 54;

// ------------------------------------------------------------------ utilidades
const suave = (a: number, b: number, f: number) => interpolate(f, [a, b], [0, 1], {
  extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.inOut(Easing.cubic),
});
const ruido = (n: number) => { const x = Math.sin(n * 127.1) * 43758.5453; return x - Math.floor(x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lienzo(dibujar: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256, rep: [number, number] = [1, 1]) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  dibujar(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep);
  t.anisotropy = 8;
  return t;
}
const lambert = (o: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(o);
const caja = (w: number, h: number, d: number, m: THREE.Material, x: number, y: number, z: number) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b;
};
const resplandor = lienzo((g, w, h) => {
  const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  gr.addColorStop(0, "rgba(255,214,160,0.9)"); gr.addColorStop(0.3, "rgba(255,190,120,0.35)"); gr.addColorStop(1, "rgba(255,170,100,0)");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
}, 128, 128);

// ------------------------------------------------------------------ texturas del hotel (pintadas a mano con Canvas)
const texAlfombra = (largo: number) => lienzo((g, w, h) => {
  g.fillStyle = "#3f1918"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#7d6436"; g.fillRect(14, 0, 8, h); g.fillRect(w - 22, 0, 8, h); // borde dorado
  g.fillStyle = "#3c0c10"; g.fillRect(26, 0, 6, h); g.fillRect(w - 32, 0, 6, h);
  for (let y = 0; y < h; y += 64) { // medallones
    g.fillStyle = "#4c2220";
    g.beginPath(); g.moveTo(w / 2, y + 8); g.lineTo(w / 2 + 38, y + 32); g.lineTo(w / 2, y + 56); g.lineTo(w / 2 - 38, y + 32); g.closePath(); g.fill();
    g.fillStyle = "#6e5a34"; g.beginPath(); g.arc(w / 2, y + 32, 6, 0, 7); g.fill();
    g.fillStyle = "#4a1014"; for (const s of [-1, 1]) { g.beginPath(); g.arc(w / 2 + s * 70, y + 32, 9, 0, 7); g.fill(); }
  }
}, 256, 256, [1, largo / 1.9]);
const texMadera = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#2e1f17"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#291b14" : "#33231a"; g.fillRect(0, i * h / 8, w, h / 8); }
  g.strokeStyle = "#150d09"; g.lineWidth = 3; for (let i = 0; i <= 8; i++) { g.beginPath(); g.moveTo(0, i * h / 8); g.lineTo(w, i * h / 8); g.stroke(); }
}, 128, 128, rep);
const texPapel = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#26392f"; g.fillRect(0, 0, w, h);
  g.fillStyle = "#2e443a";
  const motivo = (x: number, y: number) => { // damasco simplificado
    g.beginPath(); g.moveTo(x, y - 26);
    g.bezierCurveTo(x + 18, y - 14, x + 16, y + 6, x, y + 26);
    g.bezierCurveTo(x - 16, y + 6, x - 18, y - 14, x, y - 26); g.fill();
    g.beginPath(); g.arc(x, y - 30, 4, 0, 7); g.arc(x + 14, y + 20, 3, 0, 7); g.arc(x - 14, y + 20, 3, 0, 7); g.fill();
  };
  for (let y = 0; y <= h; y += 64) for (let x = 0; x <= w; x += 64) { motivo(x, y); motivo(x + 32, y + 32); }
  g.strokeStyle = "#213229"; g.lineWidth = 2; for (let x = 0; x < w; x += 64) { g.beginPath(); g.moveTo(x + 16, 0); g.lineTo(x + 16, h); g.stroke(); }
}, 128, 128, rep);
const texZocalo = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#3a2418"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#1c100a"; g.lineWidth = 6; g.strokeRect(16, 18, w - 32, h - 36);
  g.strokeStyle = "#54351f"; g.lineWidth = 3; g.strokeRect(22, 24, w - 44, h - 48);
}, 128, 128, rep);
const texPuerta = () => lienzo((g, w, h) => {
  g.fillStyle = "#4a2a1a"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 12; i++) { g.fillStyle = `rgba(30,15,8,${0.08 + (i % 3) * 0.04})`; g.fillRect(i * w / 12, 0, 3, h); }
  g.strokeStyle = "#24130a"; g.lineWidth = 7;
  g.strokeRect(22, 26, w - 44, h * 0.38); g.strokeRect(22, h * 0.48, w - 44, h * 0.46);
  g.strokeStyle = "#6a4128"; g.lineWidth = 3;
  g.strokeRect(30, 34, w - 60, h * 0.38 - 16); g.strokeRect(30, h * 0.48 + 8, w - 60, h * 0.46 - 16);
}, 128, 256);
const texPlaca = (n: string) => lienzo((g, w, h) => {
  g.fillStyle = "#b38f45"; g.fillRect(0, 0, w, h);
  g.strokeStyle = "#5c4318"; g.lineWidth = 6; g.strokeRect(3, 3, w - 6, h - 6);
  g.fillStyle = "#2a1a08"; g.font = "bold 40px 'DejaVu Sans Mono', monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(n, w / 2, h / 2 + 2);
}, 128, 64);
const texTexto = (t: string, fondo: string, color: string, w = 256, h = 96, fuente = "bold 46px 'DejaVu Sans', sans-serif") => lienzo((g) => {
  g.fillStyle = fondo; g.fillRect(0, 0, w, h);
  g.fillStyle = color; g.font = fuente; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(t, w / 2, h / 2 + 3);
}, w, h);
const texCuadro = () => lienzo((g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "#2b3d4a"); gr.addColorStop(0.6, "#4a5a52"); gr.addColorStop(1, "#2a2c22");
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.fillStyle = "#1c241f"; g.beginPath(); g.moveTo(0, h * 0.7); g.lineTo(w * 0.3, h * 0.45); g.lineTo(w * 0.55, h * 0.62); g.lineTo(w * 0.8, h * 0.4); g.lineTo(w, h * 0.6); g.lineTo(w, h); g.lineTo(0, h); g.fill();
  g.fillStyle = "#d8c89a"; g.beginPath(); g.arc(w * 0.72, h * 0.22, 9, 0, 7); g.fill();
}, 128, 96);
const texConcreto = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#56645f"; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 300; i++) { g.fillStyle = `rgba(20,30,28,${Math.random() * 0.15})`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); }
  g.strokeStyle = "#3f4b47"; g.lineWidth = 3; for (let y = 0; y < h; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke(); }
}, 128, 128, rep);

// ------------------------------------------------------------------ personajes (tarjetas planas iluminadas por la escena)
const HUESPED: Aspecto = { piel: "#dcc0a4", pelo: "#1c1613", ropa: "#a98a3e", ropaInterior: "#e6e2d6", pantalon: "#2c2a35", zapatos: "#1a1414", peinado: "revuelto", semilla: 3 };
const SENORA: Aspecto = { piel: "#b8876a", pelo: "#a9a8b0", ropa: "#6e2230", ropaInterior: "#cfc3b6", pantalon: "#2a222b", zapatos: "#1c1416", peinado: "mono", lentes: true, semilla: 11 };

const POSE: Pose = {
  vista: "frente", giro: 0, mirarX: 0, mirarY: 0, ojos: 1, pupila: 0.32, parpadeo: false, cejasAlto: 0, cejasMiedo: 0,
  boca: "linea", sudor: 0, brazoIzq: [0.08, -0.04], brazoDer: [0.08, -0.04], piernas: [0, 0], respira: 0, luzX: -1,
};

class Tarjeta {
  readonly grupo = new THREE.Group();
  readonly sombraLarga: THREE.Mesh;
  private ctx: CanvasRenderingContext2D;
  private tex: THREE.CanvasTexture;
  constructor(private aspecto: Aspecto, altura: number) {
    const c = document.createElement("canvas");
    c.width = LIENZO_W; c.height = LIENZO_H;
    this.ctx = c.getContext("2d")!;
    this.tex = new THREE.CanvasTexture(c);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.anisotropy = 8;
    const ancho = altura * (LIENZO_W / LIENZO_H);
    // recibe las luces de la escena; un mínimo de emisión mantiene legible la cara en la penumbra
    const mat = lambert({ map: this.tex, alphaTest: 0.5, emissive: new THREE.Color("#ffffff"), emissiveMap: this.tex, emissiveIntensity: 0.12 });
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(ancho, altura), mat);
    plano.position.y = altura / 2 - altura * ((LIENZO_H - PIES) / LIENZO_H); // suela en y = 0
    plano.layers.set(NOINK);
    const blob = lienzo((g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(0,0,0,1)"); gr.addColorStop(0.5, "rgba(0,0,0,0.55)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 128, 128);
    const matSombra = (op: number) => new THREE.MeshBasicMaterial({ color: "#000000", alphaMap: blob, transparent: true, opacity: op, depthWrite: false });
    const contacto = new THREE.Mesh(new THREE.PlaneGeometry(ancho * 0.5, ancho * 0.15), matSombra(0.9));
    contacto.rotation.x = -Math.PI / 2; contacto.position.set(0, 0.004, 0.0); contacto.layers.set(NOINK);
    // sombra proyectada alargada, en dirección contraria a la luz principal
    this.sombraLarga = new THREE.Mesh(new THREE.PlaneGeometry(ancho * 0.42, altura * 0.8), matSombra(0.7));
    this.sombraLarga.rotation.x = -Math.PI / 2; this.sombraLarga.position.y = 0.003; this.sombraLarga.layers.set(NOINK);
    this.grupo.add(this.sombraLarga, contacto, plano);
  }
  /** angulo (rad, en el suelo) hacia donde cae la sombra larga */
  orientarSombra(ang: number, largo: number) {
    this.sombraLarga.rotation.z = ang;
    this.sombraLarga.position.x = Math.sin(-ang) * largo * -0.5;
    this.sombraLarga.position.z = Math.cos(ang) * largo * 0.5;
  }
  dibujar(p: Pose) { dibujarPersonaje(this.ctx, this.aspecto, p); this.tex.needsUpdate = true; }
}

function poseHuesped(f: number): Pose {
  // 0–8 quieto (parpadea en 4–6) · 9–13 la mirada se adelanta · 12–16 se tensa · 14–24 gira la cabeza
  // 16–28 el torso acompaña con retraso · 27–31 susto: se encoge y dobla las rodillas · 31–40 se asienta y tiembla
  const tension = suave(12, 16, f);
  const giro = -0.85 * suave(14, 24, f);
  const torso = suave(16, 28, f);
  const susto = suave(27, 31, f);
  const asienta = suave(31, 40, f); // pequeño rebote después del pico del susto
  const tiembla = f > 31 ? (ruido(f) - 0.5) : 0;
  return {
    ...POSE,
    respira: Math.sin((f / 30) * Math.PI * 2 * 0.45) * (1 - susto) + Math.sin(f * 1.7) * 0.6 * susto, // respiración agitada
    giro,
    mirarX: -0.9 * suave(9, 13, f),
    ojos: 1 + 0.18 * susto,
    pupila: 0.32 - 0.13 * susto,
    parpadeo: f >= 4 && f <= 6,
    cejasAlto: 0.25 * suave(9, 13, f) + 0.75 * susto,
    cejasMiedo: susto,
    boca: f < 27 ? "linea" : "dientes",
    sudor: suave(31, 40, f),
    hombros: 0.3 * tension + 0.7 * susto - 0.2 * asienta,
    agacha: 0.65 * susto - 0.3 * asienta,
    cuerpoX: -0.05 * torso + 0.01 * tiembla,
    cabezaX: -0.05 * suave(14, 24, f) + 0.012 * tiembla,
    brazoIzq: [0.08 + 0.1 * tension + 0.72 * susto, -0.04 - 0.2 * tension - 3.0 * susto + 0.25 * asienta], // codos fuera, manos a la cara
    brazoDer: [0.08 + 0.1 * tension + 0.72 * susto, -0.04 - 0.2 * tension - 3.0 * susto + 0.25 * asienta],
    luzX: -1,
  };
}

// ------------------------------------------------------------------ escenario: pasillo del hotel
const ANCHO = 2.4, ALTO = 2.75, Z0 = 6, ZF = -10, ZOC = 0.95;

function crearHotel() {
  const raiz = new THREE.Group();
  const largo = Z0 - ZF, cz = (Z0 + ZF) / 2;
  const mMadera = lambert({ color: "#3a2418" }), mMolde = lambert({ color: "#4a3020" }), mLaton = lambert({ color: "#c9a24a", emissive: "#2a1c06" });
  const mMarco = lambert({ color: "#2a170e" });
  // suelo: tablas a los lados y alfombra roja con borde dorado
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, largo), lambert({ map: texMadera([4, largo / 0.9]) }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, 0, cz);
  const alfombra = new THREE.Mesh(new THREE.PlaneGeometry(1.75, largo), lambert({ map: texAlfombra(largo) }));
  alfombra.rotation.x = -Math.PI / 2; alfombra.position.set(0, 0.002, cz);
  // techo con moldura
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, largo), lambert({ color: "#1d1f1c" }));
  techo.rotation.x = Math.PI / 2; techo.position.set(0, ALTO, cz);
  raiz.add(suelo, alfombra, techo);
  for (const z of [3, -2, -7]) raiz.add(caja(0.1, 0.03, 0.1, lambert({ color: "#d8d6cc" }), 0, ALTO - 0.015, z)); // detectores de humo

  for (const s of [-1, 1]) {
    const x = s * ANCHO / 2;
    const papel = new THREE.Mesh(new THREE.PlaneGeometry(largo, ALTO - ZOC), lambert({ map: texPapel([largo / 0.55, (ALTO - ZOC) / 0.55]) }));
    papel.rotation.y = -s * Math.PI / 2; papel.position.set(x, ZOC + (ALTO - ZOC) / 2, cz);
    const zocalo = new THREE.Mesh(new THREE.PlaneGeometry(largo, ZOC), lambert({ map: texZocalo([largo / 0.8, 1]) }));
    zocalo.rotation.y = -s * Math.PI / 2; zocalo.position.set(x - s * 0.001, ZOC / 2, cz);
    raiz.add(papel, zocalo,
      caja(0.06, 0.06, largo, mMolde, x - s * 0.03, ZOC, cz), // moldura de silla
      caja(0.05, 0.12, largo, mMadera, x - s * 0.025, 0.06, cz), // rodapié
      caja(0.09, 0.1, largo, mMolde, x - s * 0.045, ALTO - 0.05, cz)); // cornisa

    // puertas de habitaciones
    const zs = s < 0 ? [2.6, -2.2, -6.6] : [0.4, -4.4, -8.4];
    zs.forEach((z, i) => {
      const num = String(400 + (s < 0 ? 1 : 2) + i * 2);
      const g = new THREE.Group();
      g.position.set(x - s * 0.02, 0, z);
      g.rotation.y = -s * Math.PI / 2;
      // marco
      g.add(caja(0.08, 2.24, 0.06, mMarco, -0.5, 1.12, 0), caja(0.08, 2.24, 0.06, mMarco, 0.5, 1.12, 0), caja(1.08, 0.08, 0.06, mMarco, 0, 2.24, 0));
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.92, 2.18, 0.04), lambert({ map: texPuerta() }));
      hoja.position.set(0, 1.09, -0.01);
      const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.1), lambert({ map: texPlaca(num), emissive: "#20160a" }));
      placa.position.set(0, 1.72, 0.015);
      const mirilla = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), mLaton);
      mirilla.rotation.x = Math.PI / 2; mirilla.position.set(0, 1.5, 0.02);
      const manija = caja(0.14, 0.025, 0.04, mLaton, 0.3, 1.0, 0.03);
      const roseta = caja(0.05, 0.12, 0.02, mLaton, 0.36, 1.0, 0.015);
      g.add(hoja, placa, mirilla, manija, roseta);
      if (num === "403") { // letrero de «No molestar» colgado de la manija
        const c = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.24), lambert({ map: texTexto("NO MOLESTAR", "#7a1a20", "#f0e2c8", 96, 220, "bold 15px 'DejaVu Sans', sans-serif"), side: THREE.DoubleSide }));
        c.position.set(0.3, 0.86, 0.06); c.rotation.z = 0.05; g.add(c);
      }
      if (num === "404") { // luz bajo la puerta: hay alguien despierto dentro
        const l = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.25), new THREE.MeshBasicMaterial({ color: "#a8723e", transparent: true, opacity: 0.18, alphaMap: resplandor, depthWrite: false, toneMapped: false }));
        l.rotation.x = -Math.PI / 2; l.position.set(0, 0.004, 0.12); l.layers.set(NOINK); g.add(l);
      }
      raiz.add(g);
    });
  }
  // bandeja de servicio a la habitación en el suelo, junto a la 406
  const bandeja = new THREE.Group();
  bandeja.add(caja(0.42, 0.02, 0.3, lambert({ color: "#6e6e6a" }), 0, 0.01, 0));
  const cupula = new THREE.Mesh(new THREE.SphereGeometry(0.12, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert({ color: "#7e7e79" }));
  cupula.position.set(-0.06, 0.02, 0); bandeja.add(cupula);
  bandeja.add(caja(0.05, 0.1, 0.05, lambert({ color: "#5a1a22" }), 0.13, 0.07, 0.05));
  bandeja.position.set(-ANCHO / 2 + 0.3, 0, -5.6);
  raiz.add(bandeja);
  // mesa de consola con jarrón y cuadro encima (pared derecha)
  raiz.add(caja(0.32, 0.04, 0.8, mMadera, ANCHO / 2 - 0.18, 0.78, -2.2), caja(0.03, 0.76, 0.03, mMadera, ANCHO / 2 - 0.3, 0.38, -2.5), caja(0.03, 0.76, 0.03, mMadera, ANCHO / 2 - 0.3, 0.38, -1.9));
  const jarron = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.26, 14), lambert({ color: "#2e4a5e" }));
  jarron.position.set(ANCHO / 2 - 0.18, 0.93, -2.2); raiz.add(jarron);
  for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.ConeGeometry(0.03, 0.3, 5), lambert({ color: "#3b5e33" })); t.position.set(ANCHO / 2 - 0.18 + (i - 2) * 0.03, 1.18, -2.2 + (i % 2) * 0.04); t.rotation.z = (i - 2) * 0.25; raiz.add(t); }
  const cuadro = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.46), lambert({ map: texCuadro() }));
  cuadro.rotation.y = -Math.PI / 2; cuadro.position.set(ANCHO / 2 - 0.035, 1.6, -2.2);
  raiz.add(cuadro, caja(0.03, 0.54, 0.7, lambert({ color: "#7a5a2a" }), ANCHO / 2 - 0.02, 1.6, -2.2));
  // extintor en su caja (pared izquierda)
  raiz.add(caja(0.06, 0.62, 0.32, lambert({ color: "#7a1416" }), -ANCHO / 2 + 0.03, 1.2, -4.4 + 1.4));
  // apliques de pared de dos focos, con halo sobre el papel tapiz
  const apliques: THREE.PointLight[] = [];
  for (const [s, z, i] of [[-1, 1.2, 3.4], [1, -1.2, 2.2], [-1, -4.4, 2.6], [1, -6.4, 2.4], [-1, -8.6, 2.2]] as const) {
    const x = s * (ANCHO / 2 - 0.02);
    const g = new THREE.Group();
    g.add(caja(0.04, 0.04, 0.34, mLaton, 0, 0, 0));
    for (const dz of [-0.15, 0.15]) {
      const pant = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.07, 0.11, 14), new THREE.MeshBasicMaterial({ color: "#ffe2b8", toneMapped: false, fog: false }));
      pant.position.set(-s * 0.08, 0.07, dz); g.add(pant);
    }
    g.position.set(x - s * 0.02, 1.9, z);
    const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 1.1), new THREE.MeshBasicMaterial({ map: resplandor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.55 }));
    halo.rotation.y = -s * Math.PI / 2; halo.position.set(x - s * 0.01, 1.98, z); halo.layers.set(NOINK);
    const luz = new THREE.PointLight("#ffcf9a", i, 5.5, 1.7);
    luz.position.set(x - s * 0.4, 1.85, z);
    raiz.add(g, halo, luz);
    apliques.push(luz);
  }
  // pared del fondo: puerta de la escalera de emergencia con letrero de SALIDA
  const anchoP = 0.95, altoP = 2.15;
  for (const s of [-1, 1]) {
    const w = (ANCHO - anchoP) / 2;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(w, ALTO - ZOC), lambert({ map: texPapel([w / 0.55, (ALTO - ZOC) / 0.55]) }));
    p.position.set(s * (anchoP / 2 + w / 2), ZOC + (ALTO - ZOC) / 2, ZF);
    const zc = new THREE.Mesh(new THREE.PlaneGeometry(w, ZOC), lambert({ map: texZocalo([w / 0.8, 1]) }));
    zc.position.set(s * (anchoP / 2 + w / 2), ZOC / 2, ZF + 0.001);
    raiz.add(p, zc);
  }
  const dintel = new THREE.Mesh(new THREE.PlaneGeometry(anchoP, ALTO - altoP), lambert({ map: texPapel([anchoP / 0.55, (ALTO - altoP) / 0.55]) }));
  dintel.position.set(0, altoP + (ALTO - altoP) / 2, ZF);
  raiz.add(dintel,
    caja(0.08, altoP + 0.08, 0.08, mMarco, -(anchoP / 2 + 0.04), altoP / 2, ZF + 0.02),
    caja(0.08, altoP + 0.08, 0.08, mMarco, anchoP / 2 + 0.04, altoP / 2, ZF + 0.02),
    caja(anchoP + 0.16, 0.08, 0.08, mMarco, 0, altoP + 0.04, ZF + 0.02));
  const salida = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.16, 0.05), [
    lambert({ color: "#1a5a2a" }), lambert({ color: "#1a5a2a" }), lambert({ color: "#1a5a2a" }), lambert({ color: "#1a5a2a" }),
    new THREE.MeshBasicMaterial({ map: texTexto("SALIDA", "#12a04a", "#eaffef"), toneMapped: false, fog: false }), lambert({ color: "#1a5a2a" }),
  ]);
  salida.position.set(0, altoP + 0.26, ZF + 0.05);
  raiz.add(salida);
  const luzSalida = new THREE.PointLight("#3cff8a", 0.6, 2.2, 2); luzSalida.position.set(0, altoP + 0.15, ZF + 0.4); raiz.add(luzSalida);
  // la hoja: puerta metálica pintada con barra antipánico; gira hacia la escalera
  const bisagra = new THREE.Group();
  bisagra.position.set(-anchoP / 2, 0, ZF - 0.03);
  const hojaF = caja(anchoP, altoP - 0.02, 0.05, lambert({ color: "#4f5a56" }), anchoP / 2, altoP / 2, 0);
  bisagra.add(hojaF, caja(anchoP * 0.7, 0.05, 0.05, lambert({ color: "#b7b7b0" }), anchoP / 2 + 0.05, 1.0, 0.05));
  const ventanilla = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.42), new THREE.MeshBasicMaterial({ color: "#7d9a96", fog: false }));
  ventanilla.position.set(anchoP / 2, 1.55, 0.03); bisagra.add(ventanilla);
  raiz.add(bisagra);
  // la escalera de emergencia detrás de la puerta: concreto, peldaños, barandal y un tubo fluorescente
  const esc = new THREE.Group();
  const mConc = lambert({ map: texConcreto([2, 2]) });
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.6), mConc); fondo.position.set(0, 1.6, ZF - 2.4);
  const piso = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.4), lambert({ color: "#4c5753" })); piso.rotation.x = -Math.PI / 2; piso.position.set(0, 0, ZF - 1.2);
  esc.add(fondo, piso);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.6), mConc); p.rotation.y = -s * Math.PI / 2; p.position.set(s * 1.7, 1.6, ZF - 1.2); esc.add(p); }
  for (let i = 0; i < 7; i++) { // escalones que suben hacia la derecha
    esc.add(caja(0.28, 0.17, 1.1, lambert({ color: i % 2 ? "#5c6863" : "#55615c" }), 0.35 + i * 0.28, 0.085 + i * 0.17, ZF - 1.9));
  }
  for (let i = 0; i < 4; i++) { // barandal
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.9, 8), lambert({ color: "#c2b23a" }));
    b.position.set(0.4 + i * 0.5, 0.45 + i * 0.5 * 0.6 + 0.4, ZF - 1.4); esc.add(b);
  }
  const pasa = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 2.3, 8), lambert({ color: "#c2b23a" }));
  pasa.rotation.z = -Math.PI / 2 + 0.55; pasa.position.set(1.15, 1.6, ZF - 1.4); esc.add(pasa);
  const tubo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 0.1), new THREE.MeshBasicMaterial({ color: "#eaf6ff", toneMapped: false, fog: false }));
  tubo.position.set(-0.2, 3.0, ZF - 1.4); esc.add(tubo);
  esc.add(caja(0.42, 0.3, 0.02, lambert({ map: texTexto("PISO 4", "#d8d0a0", "#2a2410", 256, 180, "bold 64px 'DejaVu Sans', sans-serif") }), -0.9, 1.6, ZF - 2.38));
  raiz.add(esc);
  const luzEscalera = new THREE.PointLight("#cfe6ff", 0, 8, 1.3);
  luzEscalera.position.set(-0.2, 2.6, ZF - 1.3);
  raiz.add(luzEscalera);
  return { raiz, bisagra, luzEscalera, apliques };
}

// ------------------------------------------------------------------ cámara
type Llave = { pos: [number, number, number]; mira: [number, number, number]; fov: number };
const PLANOS = [
  { a: 0, b: CORTE - 1, foco: 4.3, cInf: 9, cerca: 1.2, ini: { pos: [0.14, 1.05, 4.5], mira: [0.0, 0.98, 0], fov: 40 } as Llave, fin: { pos: [0.1, 1.06, 4.15], mira: [0.0, 1.0, 0], fov: 40 } as Llave },
  // por encima del hombro derecho del huésped: su cabeza y su hombro ocupan el tercio izquierdo, la puerta queda libre
  { a: CORTE, b: PRUEBA_CUADROS - 1, foco: 11.5, cInf: 7, cerca: 0.3, ini: { pos: [0.62, 1.55, 2.15], mira: [-0.9, 1.12, -10], fov: 32 } as Llave, fin: { pos: [0.61, 1.55, 1.95], mira: [-0.9, 1.12, -10], fov: 31 } as Llave },
];
function camara(f: number) {
  const p = PLANOS.find((x) => f >= x.a && f <= x.b)!;
  const t = (f - p.a) / Math.max(1, p.b - p.a);
  return {
    p,
    pos: p.ini.pos.map((v, i) => lerp(v, p.fin.pos[i], t)) as [number, number, number],
    mira: p.ini.mira.map((v, i) => lerp(v, p.fin.mira[i], t)) as [number, number, number],
    fov: lerp(p.ini.fov, p.fin.fov, t),
  };
}

// ------------------------------------------------------------------ escena
const Escena: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => {
    const m = crearHotel();
    const huesped = new Tarjeta(HUESPED, 1.72);
    const senora = new Tarjeta(SENORA, 1.84);
    m.raiz.add(huesped.grupo, senora.grupo);
    return { ...m, huesped, senora };
  }, []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 2, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.8, luminanceThreshold: 0.7, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.12 }),
    luz: new BrightnessContrastEffect({ brightness: 0.135, contrast: 0.04 }),
    vin: new VignetteEffect({ offset: 0.3, darkness: 0.7 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, cam));
    c.addPass(fx.ink);
    c.addPass(new EffectPass(cam, fx.lens.pre));
    c.addPass(new EffectPass(cam, fx.lens.main));
    c.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.sat, fx.luz, fx.vin));
    return c;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);

  const c = camara(f);
  cam.layers.enable(NOINK);
  cam.position.set(...c.pos); cam.fov = c.fov; cam.near = 0.1; cam.far = 40; cam.updateProjectionMatrix(); cam.lookAt(...c.mira);
  fx.lens.focus = c.p.foco; fx.lens.cInf = c.p.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = c.p.cerca; fx.lens.main.uniforms.get("nearScale")!.value = c.p.cerca;
  scene.background = new THREE.Color("#05090b");
  scene.fog = new THREE.Fog("#0b1416", 6, 24);

  // huésped
  if (f < CORTE) {
    mundo.huesped.dibujar(poseHuesped(f));
    mundo.huesped.grupo.position.set(0.05, 0, 0); // los pies no se mueven: el cuerpo se mueve en el dibujo
    mundo.huesped.orientarSombra(-0.85, 1.25); // la lámpara está atrás a su derecha (pantalla izquierda)
  } else {
    mundo.huesped.dibujar({ ...POSE, vista: "espalda", brazoIzq: [0.3, -1.1], brazoDer: [0.3, -1.1], respira: Math.sin(f * 1.2) * 0.6, luzX: -0.4,
      hombros: 0.55, agacha: 0.3, cabezaX: (ruido(f) - 0.5) * 0.012 });
    mundo.huesped.grupo.position.set(-0.25, 0, -1.3);
    mundo.huesped.orientarSombra(-0.85, 1.25);
  }

  // puerta de la escalera y la señora
  const abre = f < CORTE ? 0 : suave(CORTE + 2, CORTE + 12, f);
  mundo.bisagra.rotation.y = abre * 1.7;
  mundo.luzEscalera.intensity = 7 * (0.25 + 0.75 * abre);
  const paso = suave(CORTE + 8, PRUEBA_CUADROS - 4, f);
  mundo.senora.grupo.visible = f >= CORTE + 8;
  if (mundo.senora.grupo.visible) {
    const ciclo = Math.sin((f - CORTE) * Math.PI * 2 / 14);
    const camina = paso < 1;
    mundo.senora.dibujar({
      ...POSE, mirarX: 0.2, pupila: 0.28, parpadeo: f >= 80 && f <= 82, luzX: -0.6,
      brazoIzq: camina ? [0.06 + 0.1 * ciclo, -0.1] : [0.06, -0.1], brazoDer: camina ? [0.06 - 0.1 * ciclo, -0.1] : [0.06, -0.1],
      piernas: camina ? [Math.max(0, ciclo) * 0.8, Math.max(0, -ciclo) * 0.8] : [0, 0],
      respira: Math.sin(f * 0.2),
    });
    mundo.senora.grupo.position.set(-0.05, 0, lerp(ZF - 0.5, ZF + 0.8, paso));
    mundo.senora.orientarSombra(0, 1.6); // la luz de la escalera viene de atrás: su sombra cae hacia el pasillo
  }
  mundo.apliques[0].intensity = 3.4 * (0.93 + 0.07 * ruido(Math.floor(f / 3)));
  return <primitive object={mundo.raiz} dispose={null} />;
};

const Rotulo: React.FC = () => {
  const f = useCurrentFrame();
  const texto = "DÍA 1 · 3:12 AM · HOTEL · PISO 4";
  const n = Math.round(interpolate(f, [0, 22], [0, texto.length], { extrapolateRight: "clamp" }));
  if (f >= CORTE) return null;
  return (
    <div style={{
      position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8,
      background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f",
      fontFamily: "'JetBrains Mono', 'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 30, color: "#efe3da", letterSpacing: 1,
    }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};

export const PruebaPasillo: React.FC = () => (
  <AbsoluteFill style={{ background: "#05090b" }}>
    <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.4 }} camera={{ fov: 40, near: 0.1, far: 40 }}>
      <ambientLight intensity={0.32} color="#5a8088" />
      <hemisphereLight args={["#40626a", "#140d0a", 0.4]} />
      <Escena />
    </ThreeCanvas>
    <Rotulo />
  </AbsoluteFill>
);
