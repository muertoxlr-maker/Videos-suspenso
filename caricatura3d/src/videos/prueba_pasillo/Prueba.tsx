// Prueba original de 3 s (90 cuadros) según GUIA_DE_ESTILO_SUSPENSO.md. Sin voz.
// Plano 1 (0–53, 1.8 s = duración mediana medida): un adulto en el pasillo oye algo al fondo, gira la cabeza y
//   reacciona. Plano 2 (54–89): plano de espaldas; la puerta del fondo se abre y sale otra persona.
// Cámara: acercamiento lento dentro de cada plano (~0.1 %/cuadro), corte duro entre planos.
// Post (del tutorial, MIT): tinta → desenfoque de lente → bloom + tono NEUTRAL + viñeta. Tono azul-verdoso oscuro
// con charcos de luz cálida (guía §4).
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

function textura(dibujar: (c: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 256, rep: [number, number] = [1, 1]) {
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

// ------------------------------------------------------------------ personajes
const ADULTO: Aspecto = { piel: "#e9b58c", pelo: "#2a1b15", ropa: "#c8932c", ropaDetalle: "#7a5414", pantalon: "#2b2a3a", peinado: "corto" };
const OTRA: Aspecto = { piel: "#b98262", pelo: "#a7a7b2", ropa: "#7c1f2f", ropaDetalle: "#d9b9a0", pantalon: "#231c26", peinado: "mono", lentes: true };

const POSE_BASE: Pose = {
  vista: "frente", giro: 0, mirarX: 0, mirarY: 0, ojos: 1, pupila: 0.42, parpadeo: false, cejasAlto: 0, cejasMiedo: 0,
  boca: "linea", sudor: 0, brazos: [0.14, 0.14], piernas: [0, 0], respira: 0,
};

/** Tarjeta plana anclada al suelo por la suela: y = 0 del grupo = línea PIES del lienzo. */
class Tarjeta {
  readonly grupo = new THREE.Group();
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
    const mat = new THREE.MeshLambertMaterial({
      map: this.tex, alphaTest: 0.5, emissive: new THREE.Color("#ffffff"), emissiveMap: this.tex, emissiveIntensity: 0.32,
    });
    const plano = new THREE.Mesh(new THREE.PlaneGeometry(ancho, altura), mat);
    // la suela (y = PIES en el lienzo) queda exactamente en y = 0
    plano.position.y = altura / 2 - altura * ((LIENZO_H - PIES) / LIENZO_H);
    plano.layers.set(NOINK);
    // sombra de contacto bajo los pies
    const sombraTex = textura((g, w, h) => {
      const gr = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      gr.addColorStop(0, "rgba(0,0,0,0.85)"); gr.addColorStop(0.55, "rgba(0,0,0,0.45)"); gr.addColorStop(1, "rgba(0,0,0,0)");
      g.fillStyle = gr; g.fillRect(0, 0, w, h);
    }, 128, 128);
    const sombra = new THREE.Mesh(new THREE.PlaneGeometry(ancho * 0.75, ancho * 0.3),
      new THREE.MeshBasicMaterial({ map: sombraTex, transparent: true, depthWrite: false, color: "#000000" }));
    sombra.material.alphaMap = sombraTex;
    sombra.rotation.x = -Math.PI / 2;
    sombra.position.set(0, 0.004, 0.02);
    sombra.layers.set(NOINK);
    this.grupo.add(sombra, plano);
  }
  dibujar(p: Pose) {
    dibujarPersonaje(this.ctx, this.aspecto, p);
    this.tex.needsUpdate = true;
  }
}

/** Pose del adulto en el plano 1: escucha → gira la cabeza → reacciona. */
function poseAdulto(f: number): { pose: Pose; salto: number; temblor: number } {
  const t = f / 30;
  const giro = -0.85 * suave(14, 24, f);
  const susto = suave(27, 31, f);
  const pose: Pose = {
    ...POSE_BASE,
    respira: Math.sin(t * Math.PI * 2 * 0.45),
    giro,
    mirarX: f < 9 ? 0 : -0.9 * suave(9, 13, f),
    ojos: 1 + 0.16 * susto,
    pupila: 0.42 - 0.18 * susto,
    parpadeo: f >= 4 && f <= 6, // parpadeo de 3 cuadros antes de oír el ruido
    cejasAlto: 0.25 * suave(9, 13, f) + 0.75 * susto,
    cejasMiedo: susto,
    boca: f < 27 ? "linea" : "zigzag",
    sudor: suave(31, 40, f),
    brazos: [0.14 + 0.5 * susto, 0.14 + 0.5 * susto],
  };
  const k = (f - 27) / 9; // respingo: sube y vuelve
  const salto = k > 0 && k < 1 ? Math.sin(Math.PI * k) * 0.05 : 0;
  const temblor = f > 31 ? (ruido(f) - 0.5) * 0.012 : 0;
  return { pose, salto, temblor };
}

// ------------------------------------------------------------------ escenario
const ANCHO = 2.6, ALTO = 2.8, Z0 = 5, ZF = -10;

function crearPasillo() {
  const raiz = new THREE.Group();
  const largo = Z0 - ZF, centroZ = (Z0 + ZF) / 2;
  const piso = textura((g, w, h) => {
    g.fillStyle = "#3a2a22"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { g.fillStyle = i % 2 ? "#33241d" : "#3f2e25"; g.fillRect(i * w / 4, 0, w / 4, h); }
    g.strokeStyle = "#1c120e"; g.lineWidth = 4;
    for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * w / 4, 0); g.lineTo(i * w / 4, h); g.stroke(); }
    g.beginPath(); g.moveTo(0, h * 0.3); g.lineTo(w / 4, h * 0.3); g.moveTo(w / 2, h * 0.7); g.lineTo(w * 0.75, h * 0.7); g.stroke();
  }, 256, 256, [ANCHO / 0.9, largo / 1.6]);
  const papel = textura((g, w, h) => {
    g.fillStyle = "#3d5a5c"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#355052";
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 12, h);
    g.fillStyle = "#4a6a6a";
    for (let y = 16; y < h; y += 64) for (let x = 6; x < w; x += 32) { g.beginPath(); g.arc(x, y, 3, 0, 7); g.fill(); }
  }, 128, 128, [largo / 0.7, ALTO / 0.7]);

  const mat = (opc: THREE.MeshLambertMaterialParameters) => new THREE.MeshLambertMaterial(opc);
  const suelo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, largo), mat({ map: piso }));
  suelo.rotation.x = -Math.PI / 2; suelo.position.set(0, 0, centroZ);
  const techo = new THREE.Mesh(new THREE.PlaneGeometry(ANCHO, largo), mat({ color: "#1b2224" }));
  techo.rotation.x = Math.PI / 2; techo.position.set(0, ALTO, centroZ);
  raiz.add(suelo, techo);
  for (const s of [-1, 1]) {
    const pared = new THREE.Mesh(new THREE.PlaneGeometry(largo, ALTO), mat({ map: papel }));
    pared.rotation.y = -s * Math.PI / 2; pared.position.set(s * ANCHO / 2, ALTO / 2, centroZ);
    const zocalo = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.85, largo), mat({ color: "#2a1d18" }));
    zocalo.position.set(s * (ANCHO / 2 - 0.025), 0.425, centroZ);
    const moldura = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, largo), mat({ color: "#3a2a22" }));
    moldura.position.set(s * (ANCHO / 2 - 0.035), 0.87, centroZ);
    raiz.add(pared, zocalo, moldura);
    // puertas laterales cerradas
    for (const z of s < 0 ? [2.4, -4.2] : [-1.4, -6.6]) {
      const marco = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.2, 1.05), mat({ color: "#24170f" }));
      marco.position.set(s * (ANCHO / 2 - 0.03), 1.1, z);
      const hoja = new THREE.Mesh(new THREE.BoxGeometry(0.05, 2.05, 0.88), mat({ color: "#4a2c1c" }));
      hoja.position.set(s * (ANCHO / 2 - 0.06), 1.03, z);
      const perilla = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mat({ color: "#c9a24a", emissive: "#3a2a08" }));
      perilla.position.set(s * (ANCHO / 2 - 0.1), 1.0, z + 0.32);
      raiz.add(marco, hoja, perilla);
    }
  }
  // pared del fondo con su puerta (se abre hacia el cuarto)
  const muro = new THREE.Group();
  const anchoP = 0.95, altoP = 2.1;
  for (const s of [-1, 1]) {
    const lado = new THREE.Mesh(new THREE.PlaneGeometry((ANCHO - anchoP) / 2, ALTO), mat({ map: papel }));
    lado.position.set(s * (anchoP / 2 + (ANCHO - anchoP) / 4), ALTO / 2, ZF);
    muro.add(lado);
  }
  const dintel = new THREE.Mesh(new THREE.PlaneGeometry(anchoP, ALTO - altoP), mat({ map: papel }));
  dintel.position.set(0, altoP + (ALTO - altoP) / 2, ZF);
  // marco de tres listones (el hueco queda libre)
  const listones = [
    [-(anchoP / 2 + 0.035), altoP / 2, 0.07, altoP + 0.07],
    [anchoP / 2 + 0.035, altoP / 2, 0.07, altoP + 0.07],
    [0, altoP + 0.035, anchoP + 0.14, 0.07],
  ] as const;
  muro.add(dintel);
  for (const [x, y, w, h] of listones) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08), mat({ color: "#24170f" }));
    l.position.set(x, y, ZF + 0.02);
    muro.add(l);
  }
  // cuarto detrás de la puerta: luz fría
  const cuarto = new THREE.Group();
  const fondoCuarto = new THREE.Mesh(new THREE.PlaneGeometry(3, ALTO), new THREE.MeshBasicMaterial({ color: "#a9cdf0", fog: false }));
  fondoCuarto.position.set(0, ALTO / 2, ZF - 2.2);
  const pisoCuarto = new THREE.Mesh(new THREE.PlaneGeometry(3, 2.2), mat({ color: "#4b5a66" }));
  pisoCuarto.rotation.x = -Math.PI / 2; pisoCuarto.position.set(0, 0, ZF - 1.1);
  for (const s of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(2.2, ALTO), mat({ color: "#6f8597" }));
    p.rotation.y = -s * Math.PI / 2; p.position.set(s * 1.5, ALTO / 2, ZF - 1.1); cuarto.add(p);
  }
  cuarto.add(fondoCuarto, pisoCuarto);
  const bisagra = new THREE.Group();
  bisagra.position.set(-anchoP / 2, 0, ZF - 0.02);
  const hojaF = new THREE.Mesh(new THREE.BoxGeometry(anchoP, altoP - 0.02, 0.05), mat({ color: "#4f2e1d" }));
  hojaF.position.set(anchoP / 2, altoP / 2, 0);
  const perillaF = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 12), mat({ color: "#c9a24a", emissive: "#3a2a08" }));
  perillaF.position.set(anchoP - 0.12, 1.0, 0.04);
  bisagra.add(hojaF, perillaF);
  raiz.add(muro, cuarto, bisagra);
  // apliques de pared con su charco de luz cálida
  const apliques: THREE.PointLight[] = [];
  for (const [x, z, i] of [[-1, 1.0, 4.2], [1, -4.0, 3.2], [-1, -8.2, 3.0]] as const) {
    const pantalla = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.14, 0.18, 16),
      new THREE.MeshBasicMaterial({ color: "#ffd59a", toneMapped: false, fog: false }));
    pantalla.position.set(x * (ANCHO / 2 - 0.12), 1.95, z);
    const luz = new THREE.PointLight("#ffc896", i, 6.5, 1.6);
    luz.position.set(x * (ANCHO / 2 - 0.35), 1.85, z);
    raiz.add(pantalla, luz);
    apliques.push(luz);
  }
  const luzCuarto = new THREE.PointLight("#b9d6ff", 0, 9, 1.4);
  luzCuarto.position.set(0, 1.9, ZF - 0.9);
  raiz.add(luzCuarto);
  // ondas de sonido planas que salen de la puerta del fondo (efecto 2D dentro de la escena)
  const ondas: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const o = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.025, 6, 48, Math.PI * 0.7),
      new THREE.MeshBasicMaterial({ color: "#d8f1ff", transparent: true, toneMapped: false, depthWrite: false, fog: false }));
    o.rotation.z = Math.PI * 0.15;
    o.position.set(0, 1.6, ZF + 0.3);
    o.layers.set(NOINK);
    raiz.add(o); ondas.push(o);
  }
  return { raiz, bisagra, luzCuarto, apliques, ondas };
}

// ------------------------------------------------------------------ cámara
type Llave = { f: number; pos: [number, number, number]; mira: [number, number, number]; fov: number };
const PLANOS: { a: number; b: number; llaves: Llave[]; foco: () => number; cInf: number }[] = [
  { a: 0, b: CORTE - 1, cInf: 9, foco: () => 3.4, llaves: [
    { f: 0, pos: [0.12, 1.05, 3.55], mira: [0.0, 1.0, 0], fov: 40 },
    { f: CORTE - 1, pos: [0.08, 1.07, 3.3], mira: [0.0, 1.03, 0], fov: 40 }, // acercamiento lento ~0.13 %/cuadro
  ] },
  { a: CORTE, b: PRUEBA_CUADROS - 1, cInf: 11, foco: () => 11.0, llaves: [
    { f: CORTE, pos: [0.55, 2.0, 2.7], mira: [0.0, 0.95, -9], fov: 27 },
    { f: PRUEBA_CUADROS - 1, pos: [0.54, 2.0, 2.45], mira: [0.0, 0.95, -9], fov: 26 },
  ] },
];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
function camara(f: number) {
  const p = PLANOS.find((x) => f >= x.a && f <= x.b)!;
  const [k0, k1] = p.llaves;
  const t = (f - k0.f) / Math.max(1, k1.f - k0.f); // lineal: velocidad constante, la cámara nunca se detiene
  return {
    plano: p,
    pos: k0.pos.map((v, i) => lerp(v, k1.pos[i], t)) as [number, number, number],
    mira: k0.mira.map((v, i) => lerp(v, k1.mira[i], t)) as [number, number, number],
    fov: lerp(k0.fov, k1.fov, t),
  };
}

// ------------------------------------------------------------------ escena
const Escena: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => {
    const m = crearPasillo();
    const adulto = new Tarjeta(ADULTO, 1.72);
    adulto.grupo.position.set(0.05, 0, 0);
    const otra = new Tarjeta(OTRA, 1.95);
    m.raiz.add(adulto.grupo, otra.grupo);
    return { ...m, adulto, otra };
  }, []);
  const fx = useMemo(() => {
    const bloom = new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.9, luminanceThreshold: 0.75, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 });
    return {
      ink: new InkPass(scene, cam, { widthNear: 4.2, widthFar: 2.6, distNear: 2, distFar: 14 }),
      lens: new LensBlur({ maxCoC: 22, nearScale: 1.4 }),
      bloom,
      tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
      sat: new HueSaturationEffect({ saturation: -0.3 }),
      luz: new BrightnessContrastEffect({ brightness: 0.07, contrast: 0.05 }),
      vin: new VignetteEffect({ offset: 0.28, darkness: 0.72 }),
    };
  }, [scene, cam]);
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

  // --- cámara del cuadro ---
  const c = camara(f);
  cam.layers.enable(NOINK);
  cam.position.set(...c.pos);
  cam.fov = c.fov;
  cam.near = 0.1; cam.far = 40;
  cam.updateProjectionMatrix();
  cam.lookAt(...c.mira);
  fx.lens.focus = c.plano.foco();
  fx.lens.cInf = c.plano.cInf;
  scene.background = new THREE.Color("#05090b");
  scene.fog = new THREE.Fog("#0a1518", 7, 26);

  // --- adulto ---
  if (f < CORTE) {
    const { pose, salto, temblor } = poseAdulto(f);
    mundo.adulto.dibujar(pose);
    mundo.adulto.grupo.position.set(0.05 + temblor, salto, 0);
  } else {
    // plano de espaldas: ya se volteó hacia la puerta; sigue temblando
    mundo.adulto.dibujar({ ...POSE_BASE, vista: "espalda", brazos: [0.9, 0.9], respira: Math.sin(f * 0.5) });
    mundo.adulto.grupo.position.set(0.16 + (ruido(f) - 0.5) * 0.01, 0, 1.0);
  }

  // --- puerta del fondo y la otra persona (solo en el plano 2) ---
  const abre = f < CORTE ? 0 : suave(CORTE + 2, CORTE + 12, f);
  mundo.bisagra.rotation.y = abre * 1.75; // gira hacia dentro del cuarto
  mundo.luzCuarto.intensity = 9 * abre;
  const paso = suave(CORTE + 8, PRUEBA_CUADROS - 4, f);
  const visible = f >= CORTE + 8;
  mundo.otra.grupo.visible = visible;
  if (visible) {
    const ciclo = Math.sin((f - CORTE) * Math.PI * 2 / 14); // ~2 pasos por segundo
    const camina = paso < 1;
    mundo.otra.dibujar({
      ...POSE_BASE,
      mirarX: 0.15, pupila: 0.36, parpadeo: f >= 80 && f <= 82,
      boca: "linea",
      brazos: camina ? [0.12 + 0.12 * ciclo, 0.12 - 0.12 * ciclo] : [0.12, 0.12],
      piernas: camina ? [Math.max(0, ciclo) * 0.8, Math.max(0, -ciclo) * 0.8] : [0, 0],
      respira: Math.sin(f * 0.2),
    });
    // sale del cuarto (z detrás de la pared) hacia el pasillo; los pies siempre en y = 0 (el paso lo dan las piernas)
    mundo.otra.grupo.position.set(-0.05, 0, lerp(ZF - 0.5, ZF + 0.8, paso));
  }

  // --- luz cálida que tiembla un poco (lámpara vieja) ---
  mundo.apliques[0].intensity = 4.2 * (0.92 + 0.08 * ruido(Math.floor(f / 3)));

  // --- ondas de sonido: aparecen en el cuadro 6 y se apagan antes de girar la cabeza ---
  mundo.ondas.forEach((o, i) => {
    const t = (f - 6 - i * 4) / 14;
    const vis = f < CORTE && t > 0 && t < 1;
    o.visible = vis;
    if (vis) {
      const s = 0.6 + t * 1.6;
      o.scale.set(s, s, 1);
      (o.material as THREE.MeshBasicMaterial).opacity = Math.sin(Math.PI * t) * 0.9;
    }
  });

  return <primitive object={mundo.raiz} dispose={null} />;
};

// ------------------------------------------------------------------ rótulo (guía §3)
const Rotulo: React.FC = () => {
  const f = useCurrentFrame();
  const texto = "DÍA 1 · 3:12 AM · PASILLO · PISO 4";
  const n = Math.round(interpolate(f, [0, 22], [0, texto.length], { extrapolateRight: "clamp" }));
  if (f >= CORTE) return null;
  return (
    <div style={{
      position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8,
      background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f",
      fontFamily: "'JetBrains Mono', 'DejaVu Sans Mono', monospace", fontWeight: 700, fontSize: 30, color: "#efe3da",
      letterSpacing: 1,
    }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};

export const PruebaPasillo: React.FC = () => (
  <AbsoluteFill style={{ background: "#05090b" }}>
    <ThreeCanvas width={1080} height={1920}
      gl={{ antialias: false, stencil: false, toneMappingExposure: 1.45 }} camera={{ fov: 40, near: 0.1, far: 40 }}>
      <ambientLight intensity={0.35} color="#4d7a86" />
      <hemisphereLight args={["#3d6670", "#120c0a", 0.45]} />
      <Escena />
    </ThreeCanvas>
    <Rotulo />
  </AbsoluteFill>
);
