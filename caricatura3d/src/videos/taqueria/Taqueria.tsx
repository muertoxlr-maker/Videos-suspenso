// «La taquería de las 2 AM» — animación completa. Mismo composer, tarjetas y capas de texto que «La rueda de la feria»
// (estándar §8 + mejoras §8.8). Lo nuevo: sombras con la forma de cada personaje, que salen del foco (la pista de la
// historia: todos tienen sombra menos tu papá) y un perro. Lista §8.6c: nada atraviesa nada, nada encimado.
// Cada plano empieza 2 cuadros antes de su palabra.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction, BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, RenderPass,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from "postprocessing";
import { InkPass, NOINK } from "../alejandro/ink";
import { LensBlur } from "../alejandro/lensblur";
import { Aspecto, Pose } from "../prueba_pasillo/personaje";
import { POSE, Tarjeta, lerp, parpadea, resplandor, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { PosePerro, TarjetaPerro, PERRO_H, PERRO_PIES } from "../comun/perro";
import { SombraSilueta } from "../comun/sombra";
import { CALLE_Y, COMAL, FOCO, crearTaqueria } from "./taqueria";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const TAQUERIA_CUADROS = Math.ceil(72.39 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d8b89a", pelo: "#1d1512", ropa: "#2f5a8a", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", gorra: "#c8263a", mandil: "#ece8de", semilla: 501 };
const TIO: Aspecto = { piel: "#b07c5a", pelo: "#1d1512", ropa: "#d8d2c4", ropaInterior: "#e6e0d0", pantalon: "#3a3530", zapatos: "#2a2422", peinado: "recogido", prenda: "camisa", bigote: true, arrugas: true, barba: "sombra", mandil: "#f0ece2", semilla: 503 };
const TAXI1: Aspecto = { piel: "#c9a07e", pelo: "#2a2018", ropa: "#3a4a5a", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", prenda: "chamarra", gorra: "#2a2a30", bigote: true, semilla: 505 };
const TAXI2: Aspecto = { piel: "#8e6346", pelo: "#141012", ropa: "#7a3a2a", ropaInterior: "#e6e0d0", pantalon: "#3a3530", zapatos: "#2a2422", peinado: "recogido", prenda: "camisa", lentes: true, semilla: 507 };
const TAXI3: Aspecto = { piel: "#d8b496", pelo: "#3a2a1e", ropa: "#4a3a30", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "rizado", prenda: "chamarra", barba: "candado", semilla: 509 };
const MUJER: Aspecto = { piel: "#d6d2ca", pelo: "#121014", ropa: "#ecebe6", ropaInterior: "#e0ded8", pantalon: "#e6e4dc", zapatos: "#c8c4bc", peinado: "largo", mojado: true, cuello: "redondo", semilla: 511 };
const PAPA: Aspecto = { piel: "#c49a7a", pelo: "#4a3a2e", ropa: "#4a5a3a", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", prenda: "chamarra", bigote: true, arrugas: true, insignia: { tipo: "etiqueta" }, semilla: 513 };
const SOMBRA: Aspecto = { piel: "#15171c", pelo: "#0b0c0f", ropa: "#0e0f12", ropaInterior: "#0e0f12", pantalon: "#0b0c0f", zapatos: "#0b0c0f", peinado: "revuelto", semilla: 515 };
const LUZ: Partial<Pose> = { luzX: -1, borde: "#ffcf8a" };
const MUJER_POSE: Partial<Pose> = { parpadeo: false, pupila: 0.2, ojos: 1.0, boca: "linea", cejasAlto: -0.1, mirarY: 0.2, luzX: -1, borde: "#cfe0ff" };

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; rapido?: boolean; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const camina = (f: number, v = 0.5): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v)) * 0.7, Math.max(0, -Math.sin(f * v)) * 0.7], brazoIzq: [0.08 + 0.25 * Math.sin(f * v), -0.04], brazoDer: [0.08 - 0.25 * Math.sin(f * v), -0.04] });
const ruta = (pts: V3[], k: number): V3 => { // recorrido por tramos rectos (k de 0 a 1 sobre el largo total)
  const L = pts.slice(1).map((p, i) => Math.hypot(p[0] - pts[i][0], p[2] - pts[i][2])); const tot = L.reduce((a, b) => a + b, 0);
  let d = Math.min(1, Math.max(0, k)) * tot;
  for (let i = 0; i < L.length; i++) { if (d <= L[i] || i === L.length - 1) { const u = Math.min(1, d / Math.max(1e-6, L[i])); return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u), lerp(pts[i][2], pts[i + 1][2], u)]; } d -= L[i]; }
  return pts[pts.length - 1];
};

const TU_POS: V3 = [0.25, 0, -1.0]; // detrás del mostrador (a 0.6 m de su orilla de atrás)
const TIO_POS: V3 = [-0.75, 0, -1.0];
const TIO_RUTA: V3[] = [TIO_POS, [-2.05, 0, -1.0], [-2.05, 0, 0.9]]; // sale por el lado izquierdo, lejos de los postes
const TAXIS: V3[] = [[-0.75, 0, 1.0], [0.05, 0, 1.18], [0.85, 0, 1.0]];
const MUJER_POS: V3 = [-0.45, 0, 1.15];
const MUJER_RUTA: V3[] = [[-6.2, 0, 2.1], [-2.2, 0, 2.1], MUJER_POS];
const PAPA_POS: V3 = [0.15, 0, 1.15];
const PERRO_CASA: V3 = [2.35, 0, 1.75]; // donde se echa el perro (lejos de la mesa y los bancos)
const PERRO_PAPA: V3 = [0.95, 0, 1.6];
const SOMBRA_CALLE: V3 = [-7.6, CALLE_Y, 5.6];

const PLANOS: Plano[] = [
  // 1 · Imagina que a las dos de la mañana
  { w: 0, foco: 9, cInf: 5, ini: c([5.6, 1.75, 11.5], [0, 1.4, 0], 48), fin: c([4.5, 1.7, 9.0], [0, 1.4, 0], 48),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.6, brazoDer: [0.9 + 0.2 * Math.sin(f * 0.8), 0.9] }); m.ver("tio", TIO_POS, { ...LUZ, mirarX: 0.4 }); m.perro(PERRO_CASA, { cabeza: -0.4 }); } },
  // 2 · atiendes el puesto de tacos de tu tío,
  { w: 8, foco: 3.5, cInf: 8, rapido: true, ini: c([0.6, 1.55, 3.0], [0.15, 1.25, -0.9], 44), fin: c([0.5, 1.55, 2.5], [0.15, 1.25, -0.9], 42),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.7, mirarX: -0.2, boca: "linea", brazoDer: [1.0 + 0.3 * Math.abs(Math.sin(f * 0.7)), 1.0] }); m.ver("tio", TIO_POS, { ...LUZ, mirarX: 0.3, mirarY: 0.5, brazoIzq: [0.9, 0.9] }); m.luz(0.3, 1.8, 1.4, 1.2); } },
  // 3 · en la esquina.
  { w: 16, foco: 8, cInf: 6, ini: c([-6.6, 3.2, 7.6], [-0.5, 1.0, 0], 46), fin: c([-6.1, 3.0, 6.9], [-0.5, 1.0, 0], 46),
    hacer: ({ m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.6 }); m.ver("tio", TIO_POS, { ...LUZ, mirarX: 0.4 }); m.perro(PERRO_CASA, { cabeza: -0.4 }); } },
  // 4 · Antes de ir por tortillas, tu tío te advierte:
  { w: 19, foco: 4.6, cInf: 7, ini: c([-1.0, 1.6, 4.8], [-1.1, 1.2, -0.3], 46), fin: c([-1.15, 1.6, 4.3], [-1.1, 1.2, -0.3], 46),
    hacer: ({ f, k, m }) => {
      const kk = suave(0, 0.85, k), p = ruta(TIO_RUTA, kk);
      m.ver("tio", p, kk < 1 ? { ...LUZ, ...camina(f, 0.45), mirarX: kk < 0.4 ? -0.5 : 0.2 } : { ...LUZ, mirarX: 0.6, giro: 0.4 });
      m.ver("tu", TU_POS, { ...LUZ, mirarX: -0.6, boca: "linea" });
    } },
  // 5 · «A esta hora, no todos
  { w: 28, foco: 2.1, cInf: 9, rapido: true, ini: c([-1.0, 1.4, 2.85], [-2.05, 1.25, 0.9], 46), fin: c([-1.15, 1.38, 2.5], [-2.05, 1.25, 0.9], 44),
    hacer: ({ f, m }) => { m.ver("tio", [-2.05, 0, 0.9], { ...LUZ, mirarX: 0.55, giro: 0.35, cejasMiedo: 0.3, cejasAlto: -0.2, boca: "abierta", bocaAbre: habla(f, 28, 36), ...hablaGestos(f, 5, 0.8) }); m.luz(-1.4, 1.9, 2.0, 1.4); } },
  // 6 · los clientes están vivos».
  { w: 33, foco: 14, cInf: 5, ini: c([-4.4, 1.5, 4.3], [-8.6, 1.1, -12], 44), fin: c([-4.8, 1.5, 3.9], [-8.6, 1.1, -12], 42),
    hacer: () => {} },
  // 7 · Regla número uno: atiende a todos bajo el foco,
  { w: 37, foco: 2.3, cInf: 8, ini: c([0.95, 1.2, 2.7], [0.1, 2.45, 0.55], 46), fin: c([0.8, 1.25, 2.3], [0.1, 2.45, 0.55], 44),
    hacer: ({ m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.6 }); } },
  // 8 · menos a quien no tenga sombra.
  { w: 46, foco: 3.6, cInf: 7, ini: c([0.9, 3.3, 3.5], [0.4, 0, 1.3], 44), fin: c([0.9, 3.1, 3.2], [0.4, 0, 1.3], 44),
    hacer: ({ f, k, m }) => { m.perro([lerp(1.5, 0.1, k), 0, 1.5], { paso: f * 0.45, cola: 0.3 * Math.sin(f * 0.3) }); m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.6 }); } },
  // 9 · Lo que no tiene sombra no viene a comer.
  { w: 52, foco: 7, cInf: 6, ini: c([-1.0, 1.55, 2.5], [-7.6, 1.1, 5.6], 30), fin: c([-1.0, 1.55, 2.5], [-7.6, 1.1, 5.6], 25),
    hacer: ({ f, m }) => { m.ver("sombra", SOMBRA_CALLE, { ojosVacios: true, ojos: 0.85, parpadeo: false, luzX: 1, respira: 0.5 + 0.5 * Math.sin(f * 0.08) }); } },
  // 10 · Regla número dos: nunca aceptes billetes mojados.
  { w: 61, foco: 1.25, cInf: 9, ini: c([-0.75, 1.35, 0.95], [-1.18, 1.05, -0.25], 40), fin: c([-0.85, 1.3, 0.72], [-1.18, 1.05, -0.25], 36),
    hacer: ({ m }) => { m.luz(-0.7, 1.7, 0.9, 1.0); } },
  // 11 · Quien paga con agua del río, regresa a cobrar el cambio.
  { w: 68, foco: 2.3, cInf: 8, ini: c([1.6, 0.25, 6.5], [0.6, -0.1, 4.0], 40), fin: c([1.5, 0.22, 6.0], [0.6, -0.1, 4.0], 40),
    hacer: ({ f, m }) => { m.ondas(f, [0.8, CALLE_Y + 0.018, 4.3]); m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.6 }); } },
  // 12 · Regla número tres: si se va la luz, apaga el comal
  { w: 79, foco: 1.05, cInf: 9, ini: c([-0.35, 1.45, 1.0], [-0.55, 1.02, -0.05], 42), fin: c([-0.4, 1.4, 0.78], [-0.55, 1.02, -0.05], 40),
    hacer: ({ f, m }) => { m.ver("tu", [-0.4, 0, -1.0], { ...LUZ, mirarY: 0.7, brazoDer: [1.1 + 0.2 * Math.sin(f * 0.6), 1.1] }); m.luz(-0.4, 1.6, 0.8, 0.8); } },
  // 13 · y no digas ni una palabra.
  { w: 90, foco: 1.0, cInf: 9, rapido: true, ini: c([0.25, 1.38, 0.95], [0.25, 1.27, -1.0], 48), fin: c([0.25, 1.38, 0.7], [0.25, 1.27, -1.0], 46),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarX: -0.3, cejasMiedo: 0.5, boca: "linea", hombros: 0.4, ...tiembla(f, 0.3) }); m.luz(0.3, 1.9, 0.6, 1.0); } },
  // 14 · En lo oscuro, te encuentran por la voz.
  { w: 96, foco: 4.0, cInf: 7, ini: c([-2.4, 1.5, 3.0], [-6.0, 1.3, 4.7], 34), fin: c([-2.5, 1.5, 3.1], [-6.0, 1.3, 4.7], 29),
    hacer: ({ f, k, m }) => { m.ver("sombra", [-6.0, CALLE_Y, 4.7], { ojosVacios: true, ojos: 0.85, parpadeo: false, luzX: 1, giro: lerp(-0.6, 0.5, suave(0.3, 0.8, k)), respira: 0.5 + 0.5 * Math.sin(f * 0.08) }); } },
  // 15 · A las dos y diez llegan tres taxistas.
  { w: 104, foco: 9, cInf: 6, ini: c([4.6, 1.4, 8.7], [-1.5, 0.8, 4.4], 48), fin: c([4.4, 1.45, 8.3], [-1.5, 0.8, 4.4], 48),
    hacer: ({ k, m }) => { m.taxi(lerp(-18, -3.2, suave(0, 0.8, k)), true); m.ver("tu", TU_POS, { ...LUZ, mirarX: -0.6 }); m.perro(PERRO_CASA, { cabeza: 0.2, orejas: 0.8 }); } },
  // 16 · Los tres tienen sombra.
  { w: 112, foco: 3.3, cInf: 8, ini: c([0.1, 1.6, 4.9], [0.05, 0.3, 1.5], 46), fin: c([0.1, 1.55, 4.6], [0.05, 0.3, 1.5], 46),
    hacer: ({ m }) => { m.taxi(-3.2, false); m.taxistas(0); m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.3 }); } },
  // 17 · Piden doce de pastor.
  { w: 116, foco: 3.2, cInf: 8, ini: c([2.9, 1.55, 3.7], [0.0, 1.3, 0.3], 46), fin: c([2.65, 1.55, 3.3], [0.0, 1.3, 0.3], 46),
    hacer: ({ f, m }) => {
      m.taxi(-3.2, false); m.taxistas(f);
      m.ver("tu", [0.55, 0, -1.0], { ...LUZ, mirarX: 0.4, mirarY: -0.2, brazoDer: [1.6 + 0.2 * Math.sin(f * 0.9), 1.2], boca: "amable" });
      m.perro([1.95, 0, 1.75], { ladra: Math.max(0, Math.sin(f * 0.55)) , orejas: 0.9, cola: -0.6 });
    } },
  // 18 · A las dos y media, una mujer de blanco
  { w: 120, foco: 4.5, cInf: 7, ini: c([1.3, 1.55, 5.5], [-2.4, 1.2, 1.4], 44), fin: c([1.1, 1.55, 5.1], [-2.4, 1.2, 1.4], 44),
    hacer: ({ f, k, m }) => {
      const p = ruta(MUJER_RUTA, suave(0, 0.95, k)); m.mujer(p, { ...camina(f, 0.32), mirarX: 0.4 }, f);
      m.ver("tu", TU_POS, { ...LUZ, mirarX: -0.5, cejasAlto: 0.2 });
      m.perro([lerp(1.95, 2.5, suave(0.2, 0.6, k)), 0, 1.75], { ladra: k > 0.25 ? Math.max(0, Math.sin(f * 0.6)) : 0, orejas: 1, cabeza: 0.2, cola: -1 });
    } },
  // 19 · te da un billete empapado.
  { w: 129, foco: 0.62, cInf: 10, ini: c([0.12, 1.26, 0.85], [0.0, 0.97, 0.3], 36), fin: c([0.1, 1.2, 0.7], [0.0, 0.97, 0.3], 34),
    hacer: ({ f, m }) => { m.billete(0); m.gotasBillete(f); m.luz(-0.2, 1.6, 0.7, 0.8); } },
  // 20 · Se lo regresas.
  { w: 134, foco: 2.6, cInf: 8, ini: c([2.1, 1.55, 2.6], [-0.3, 1.25, 0.1], 44), fin: c([1.9, 1.55, 2.3], [-0.3, 1.25, 0.1], 44),
    hacer: ({ f, k, m }) => {
      m.billete(suave(0.1, 0.6, k) * 0.12);
      m.mujer(MUJER_POS, { mirarX: 0.5, brazoIzq: [0.08, -0.04] }, f);
      m.ver("tu", [-0.2, 0, -1.0], { ...LUZ, mirarX: -0.6, cejasMiedo: 0.6, boca: "linea", brazoDer: [lerp(0.5, 1.45, suave(0.05, 0.4, k)), 0.25], hombros: 0.3 });
    } },
  // 21 · Se va y deja un charco.
  { w: 137, foco: 3.0, cInf: 8, ini: c([1.6, 0.8, 0.62], [-4.0, 0.4, 2.2], 50), fin: c([1.5, 0.8, 0.66], [-4.0, 0.4, 2.2], 50),
    hacer: ({ f, k, m }) => {
      const p = ruta([...MUJER_RUTA].reverse(), 0.12 + suave(0, 1, k) * 0.5); m.mujer(p, { ...camina(f, 0.32), vista: "espalda" }, f);
      m.charco(Math.min(1, 0.4 + k));
    } },
  // 22 · A las tres, se va la luz.
  { w: 143, foco: 4.4, cInf: 7, ini: c([1.6, 1.6, 4.7], [0.1, 1.4, 0], 46), fin: c([1.45, 1.6, 4.3], [0.1, 1.4, 0], 46),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarY: 0.5, ...(f >= fw(147) ? { mirarY: -0.6, ojos: 1.12, pupila: 0.22, cejasMiedo: 0.6, borde: undefined } : {}) }); m.charco(1); m.perro(PERRO_CASA, { cabeza: -0.4 }); } },
  // 23 · Apagas el comal.
  { w: 150, foco: 1.2, cInf: 9, ini: c([-0.2, 1.5, 0.95], [-0.42, 1.2, -0.6], 42), fin: c([-0.22, 1.5, 0.8], [-0.42, 1.2, -0.6], 40),
    hacer: ({ f, k, m }) => { m.ver("tu", [-0.45, 0, -1.0], { luzX: 1, mirarY: 0.7, cejasMiedo: 0.6, boca: "linea", brazoIzq: [lerp(0.4, 1.15, suave(0, 0.3, k)), 1.0], ...tiembla(f, 0.2) }); m.comalLuz(); } },
  // 24 · Algo respira junto a la plancha.
  { w: 153, foco: 2.6, cInf: 8, ini: c([0.95, 1.5, 2.5], [-0.5, 1.3, -0.9], 42), fin: c([0.85, 1.5, 2.1], [-0.5, 1.3, -0.9], 40),
    hacer: ({ f, m }) => {
      m.ver("tu", [0.15, 0, -1.0], { luzX: 1, mirarX: -0.2, ojos: 1.1, pupila: 0.22, cejasMiedo: 0.8, boca: "linea", hombros: 0.6, ...tiembla(f, 0.5) });
      m.ver("sombra", [-1.3, 0, -1.15], { ojosVacios: true, ojos: 0.9, parpadeo: false, luzX: 1, giro: 0.4, respira: 0.5 + 0.5 * Math.sin(f * 0.12) });
      m.aliento(f, [-1.05, 1.55, -0.95]);
    } },
  // 25 · No hablas.
  { w: 159, foco: 0.95, cInf: 9, rapido: true, ini: c([0.15, 1.34, 0.7], [0.15, 1.27, -1.0], 46), fin: c([0.15, 1.34, 0.45], [0.15, 1.27, -1.0], 44),
    hacer: ({ f, m }) => { m.ver("tu", [0.15, 0, -1.0], { luzX: 1, mirarX: -0.7, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "linea", sudor: 1, hombros: 0.7, ...tiembla(f, 0.8) }); m.luz(0.3, 1.8, -0.2, 0.25, "#5a74a8"); } },
  // 26 · Vuelve la luz.
  { w: 161, foco: 4.5, cInf: 7, ini: c([-1.2, 1.6, 4.5], [0.1, 1.3, 0], 46), fin: c([-1.05, 1.6, 4.2], [0.1, 1.3, 0], 46),
    hacer: ({ f, m }) => { m.ver("tu", [0.15, 0, -1.0], { ...LUZ, mirarX: -0.6, ojos: 1.08, cejasMiedo: 0.6, boca: "o", ...tiembla(f, 0.3) }); m.charco(1); m.perro(PERRO_CASA, { cabeza: -0.4 }); } },
  // 27 · Llega tu papá a recogerte.
  { w: 164, foco: 5.0, cInf: 7, ini: c([-1.6, 1.5, 3.1], [5.0, 1.15, 2.3], 40), fin: c([-1.4, 1.5, 3.05], [5.0, 1.15, 2.3], 40),
    hacer: ({ f, k, m }) => {
      const px = lerp(6.6, 1.1, suave(0, 0.95, k)); m.luz(px - 0.5, 2.2, 3.4, 2.0);
      m.ver("papa", [px, 0, 2.45], { ...LUZ, ...camina(f, 0.42), mirarX: -0.5, boca: "amable" });
      m.ver("tu", [0.15, 0, -1.0], { ...LUZ, mirarX: 0.5, cejasAlto: 0.3, boca: "o" });
      m.perro(PERRO_CASA, { cabeza: lerp(-0.4, 0.3, suave(0.2, 0.6, k)), orejas: 0.9, cola: 0.5 * Math.sin(f * 0.5), espejo: true }); m.charco(1);
    } },
  // 28 · «¿Ya cerraste, mijo? Dame dos para el camino».
  { w: 169, foco: 1.35, cInf: 9, ini: c([-0.12, 1.42, -0.62], [0.15, 1.28, 1.15], 52), fin: c([-0.12, 1.4, -0.4], [0.15, 1.28, 1.15], 50),
    hacer: ({ f, m }) => { m.ver("papa", PAPA_POS, { ...LUZ, mirarX: -0.15, mirarY: 0.1, boca: "abierta", bocaAbre: habla(f, 169, 176), cejasAlto: 0.2, ...hablaGestos(f, 9, 0.7) }); m.luz(0.1, 1.9, 0.5, 1.0); } },
  // 29 · Bajo el foco, tu papá no tiene sombra.
  { w: 177, foco: 3.3, cInf: 8, ini: c([0.5, 1.6, 4.9], [0.5, 0.3, 1.5], 46), fin: c([0.5, 1.55, 4.6], [0.5, 0.3, 1.5], 46),
    hacer: ({ f, m }) => { m.ver("papa", PAPA_POS, { ...LUZ, respira: 0.5 + 0.5 * Math.sin(f * 0.1) }); m.perro(PERRO_PAPA, { cabeza: 0.3, orejas: 0.6, cola: 0.6 * Math.sin(f * 0.7), espejo: false }); m.charco(1); } },
  // 30 · Pero el perro de la esquina, que le ladra a todos,
  { w: 185, foco: 1.25, cInf: 9, ini: c([2.7, 0.85, 3.4], [1.2, 0.5, 1.75], 40), fin: c([2.5, 0.8, 3.1], [1.2, 0.5, 1.75], 38),
    hacer: ({ f, m }) => { m.perro(PERRO_PAPA, { cabeza: 0.5, orejas: 0.7, cola: 0.4 * Math.sin(f * 0.5) }); m.ver("papa", PAPA_POS, { ...LUZ }); m.luz(1.9, 1.0, 2.4, 0.6); } },
  // 31 · le mueve la cola.
  { w: 196, foco: 2.0, cInf: 8, ini: c([1.05, 0.9, 3.5], [0.8, 0.45, 1.5], 44), fin: c([1.0, 0.85, 3.15], [0.8, 0.45, 1.5], 44),
    hacer: ({ f, m }) => { m.perro(PERRO_PAPA, { cabeza: 0.4, orejas: 0.5, cola: Math.sin(f * 0.9) }); m.ver("papa", PAPA_POS, { ...LUZ, mirarY: 0.6, mirarX: 0.4, boca: "amable" }); m.charco(1); } },
  // 32 · ¿Le sirves...
  { w: 200, foco: 1.0, cInf: 9, rapido: true, ini: c([0.25, 1.38, 0.95], [0.25, 1.27, -1.0], 48), fin: c([0.25, 1.38, 0.7], [0.25, 1.27, -1.0], 46),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...LUZ, mirarX: 0.2, ojos: 1.12, pupila: 0.2, cejasMiedo: 1, boca: "o", sudor: 1, ...tiembla(f, 1) }); m.luz(0.3, 1.9, 0.6, 1.0); } },
  // 33 · o le cierras?
  { w: 202, foco: 6, cInf: 6, ini: c([0.4, 1.5, 6.0], [0.2, 1.25, 0.5], 44), fin: c([0.4, 1.55, 6.6], [0.2, 1.25, 0.5], 44),
    hacer: ({ f, m }) => {
      m.ver("papa", PAPA_POS, { ...LUZ, mirarX: -0.1, boca: "amable" }); m.ver("tu", TU_POS, { ...LUZ, mirarX: 0.2, cejasMiedo: 1, ...tiembla(f, 0.8) });
      m.perro(PERRO_PAPA, { cabeza: 0.4, cola: Math.sin(f * 0.9) }); m.charco(1);
    } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };
const APAGON = () => [fw(147), inicioPlano(PLANOS.findIndex((p) => p.w === 161))] as const; // de «va» (se va la luz) a «Vuelve la luz»
const COMAL_APAGADO = () => fw(151) + 6;

// ------------------------------------------------------------------ mundo (estado por cuadro)
const CARTAS = { tu: [TU, 1.72], tio: [TIO, 1.7], t1: [TAXI1, 1.72], t2: [TAXI2, 1.68], t3: [TAXI3, 1.75], mujer: [MUJER, 1.65], papa: [PAPA, 1.74], sombra: [SOMBRA, 2.0] } as const;
type Quien = keyof typeof CARTAS;

class Mundo {
  h = crearTaqueria();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  sombras: Partial<Record<Quien, SombraSilueta>> = {};
  dog = new TarjetaPerro(0.6);
  sombraPerro = new SombraSilueta(this.dog.textura, this.dog.ancho, 0.6, (PERRO_H - PERRO_PIES) / PERRO_H, 0.6);
  pies: Partial<Record<Quien | "perro", V3>> = {};
  polillas: THREE.Mesh[] = [];
  anillos: THREE.Mesh[] = [];
  vaho: THREE.Sprite;
  f = 0;
  private camPos = new THREE.Vector3();
  private apagado = new THREE.MeshBasicMaterial({ color: "#2a2622", toneMapped: false });
  private encendido: THREE.Material;
  constructor() {
    for (const [k, c] of Object.entries(this.cartas) as [Quien, Tarjeta][]) {
      this.h.raiz.add(c.grupo);
      c.sombraLarga.visible = false; // la sombra larga de mancha se cambia por la silueta
      if (k === "papa" || k === "sombra") { c.contacto.visible = false; continue; } // tu papá no tiene sombra (y lo oscuro tampoco)
      const plano = c.grupo.children[2] as THREE.Mesh;
      const s = new SombraSilueta((plano.material as THREE.MeshLambertMaterial).map!, c.altura * 0.6, c.altura);
      this.sombras[k] = s; this.h.raiz.add(s.pivote);
    }
    this.h.raiz.add(this.dog.grupo, this.sombraPerro.pivote);
    this.encendido = this.h.bulbo.material as THREE.Material;
    const mPol = new THREE.MeshBasicMaterial({ color: "#2a2018", side: THREE.DoubleSide });
    for (let i = 0; i < 3; i++) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 0.022), mPol); p.layers.set(NOINK); this.h.raiz.add(p); this.polillas.push(p); }
    for (let i = 0; i < 3; i++) { const a = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 40), new THREE.MeshBasicMaterial({ color: "#c8d8ee", transparent: true, depthWrite: false, opacity: 0.4 })); a.rotation.x = -Math.PI / 2; a.layers.set(NOINK); this.h.raiz.add(a); this.anillos.push(a); }
    this.vaho = new THREE.Sprite(new THREE.SpriteMaterial({ map: resplandor(160, 180, 210), transparent: true, opacity: 0, depthWrite: false })); this.vaho.layers.set(NOINK); this.h.raiz.add(this.vaho);
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    for (const s of Object.values(this.sombras)) s!.pivote.visible = false;
    this.dog.grupo.visible = false; this.sombraPerro.pivote.visible = false;
    this.pies = {};
    this.h.luzExtra.intensity = 0;
    this.h.taxi.g.position.x = -60; this.h.luzFaros.intensity = 0;
    this.h.charco.visible = false; this.h.billete.visible = false; this.h.gotaBillete.visible = false;
    this.h.gotas.forEach((g) => { g.visible = false; });
    this.anillos.forEach((a) => { a.visible = false; });
    this.vaho.material.opacity = 0;
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffd9a8") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  private mirar(g: THREE.Group, pos: V3) { g.position.set(...pos); g.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]); }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; this.mirar(c.grupo, pos); this.pies[quien] = pos;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[2] * 3), ...pose });
  }
  perro(pos: V3, pose: Partial<PosePerro>) {
    this.dog.grupo.visible = true; this.pies.perro = pos;
    // de perfil: el plano mira a la cámara solo un poco (hasta 35°) para que no se vea delgado
    this.dog.grupo.position.set(...pos);
    const a = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]);
    this.dog.grupo.rotation.y = Math.max(-0.6, Math.min(0.6, a));
    this.dog.dibujar({ luzX: -1, borde: "#ffcf8a", ...pose });
  }
  taxistas(f: number) {
    const habla2 = f ? habla(f, 116, 119) : 0;
    this.ver("t1", TAXIS[0], { ...LUZ, mirarX: 0.2, mirarY: -0.2, brazoDer: [0.7, 0.9] });
    this.ver("t2", TAXIS[1], { ...LUZ, mirarX: -0.1, mirarY: -0.3, boca: habla2 ? "abierta" : "amable", bocaAbre: habla2, brazoIzq: f ? [1.7, 0.4] : [0.08, -0.04] });
    this.ver("t3", TAXIS[2], { ...LUZ, mirarX: -0.3, boca: "amable", brazoIzq: [0.6, 0.8] });
  }
  taxi(x: number, andando: boolean) { this.h.taxi.g.position.x = x; this.h.luzFaros.intensity = andando ? 6 : 2.5; }
  mujer(pos: V3, pose: Partial<Pose>, f: number) {
    this.ver("mujer", pos, { ...MUJER_POSE, ...pose });
    this.h.gotas.forEach((g, i) => { // gotas que caen del vestido
      const u = ((f * 0.045 + i * 0.37) % 1);
      g.visible = true; g.position.set(pos[0] + ((i * 0.13) % 0.5) - 0.25, 0.62 * (1 - u * u), pos[2] + ((i * 0.07) % 0.12) - 0.06);
    });
  }
  billete(dz: number) { this.h.billete.visible = true; this.h.gotaBillete.visible = true; this.h.billete.position.z = 0.3 + dz * 0.5; this.h.gotaBillete.position.z = 0.3 + dz * 0.3; }
  gotasBillete(f: number) {
    this.h.gotas.forEach((g, i) => { if (i > 3) return; const u = ((f * 0.05 + i * 0.27) % 1); g.visible = true; g.position.set((i - 1.5) * 0.04, 1.3 - u * 0.31, 0.3 + (i % 2) * 0.02); });
  }
  charco(k: number) { this.h.charco.visible = true; this.h.charco.scale.setScalar(Math.max(0.05, k)); }
  ondas(f: number, p: V3) {
    this.anillos.forEach((a, i) => { const u = ((f / 45) + i / 3) % 1; a.visible = true; a.position.set(p[0] + (i - 1) * 0.35, p[1], p[2] + (i % 2) * 0.25); a.scale.setScalar(0.04 + u * 0.3); (a.material as THREE.MeshBasicMaterial).opacity = 0.5 * (1 - u); });
  }
  aliento(f: number, p: V3) { const u = (f % 50) / 50; this.vaho.position.set(p[0] + u * 0.15, p[1] + u * 0.08, p[2]); this.vaho.scale.setScalar(0.12 + u * 0.25); this.vaho.material.opacity = 0.35 * Math.sin(Math.PI * u); }
  comalLuz() { // la lumbre del comal alumbra tu cara desde abajo mientras está prendido
    const on = this.f < COMAL_APAGADO(); if (on) this.luz(COMAL.x, 1.15, COMAL.z - 0.3, 1.3, "#ff9a50");
  }
  luces(f: number) {
    const [a, b] = APAGON(); const off = f >= a && f < b;
    const h = this.h;
    h.luzFoco.intensity = off ? 0 : 7.5; h.haloFoco.visible = !off; (h.bulbo as THREE.Mesh).material = off ? this.apagado : this.encendido;
    h.resistencia.visible = !off; h.haloTrompo.visible = !off;
    h.luzCruz.intensity = off ? 0 : 1.6; h.haloCruz.visible = !off;
    h.ventanas.forEach(({ v, h: hh }) => { (v.material as THREE.MeshBasicMaterial).color.set(off ? "#151a22" : "#ffc56e"); hh.visible = !off; });
    h.luzFarola.intensity = off ? 0 : 3.5; h.haloFarola.visible = !off; (h.farola.material as THREE.MeshBasicMaterial).color.set(off ? "#2a2622" : "#ffb060");
    h.amb.intensity = off ? 0.07 : 0.22; h.hemi.intensity = off ? 0.1 : 0.32; h.luna.intensity = off ? 0.35 : 0.55;
    h.luzApagon.intensity = off ? 1.4 : 0;
    const comalOn = f < COMAL_APAGADO(); // el comal se apaga en el apagón y ya no se vuelve a prender
    h.flama.visible = comalOn; h.haloComal.visible = comalOn;
    h.vapor.forEach((v, i) => { const u = ((f * 0.012 + i / 6) % 1); v.visible = comalOn || f < COMAL_APAGADO() + 45; v.position.set(COMAL.x + Math.sin(i * 2 + f * 0.03) * 0.12, 1.1 + u * 0.7, COMAL.z + Math.cos(i * 3) * 0.1); v.material.opacity = 0.14 * Math.sin(Math.PI * u) * (comalOn ? 1 : Math.max(0, 1 - (f - COMAL_APAGADO()) / 45)); });
    this.polillas.forEach((p, i) => { p.visible = !off; const a2 = f * (0.13 + i * 0.03) + i * 2; p.position.set(FOCO.x + Math.cos(a2) * (0.18 + i * 0.06), FOCO.y - 0.05 + Math.sin(f * 0.21 + i) * 0.08, FOCO.z + Math.sin(a2) * (0.18 + i * 0.06)); p.lookAt(this.camPos); });
    return off;
  }
  aplicar(off: boolean) {
    const foco = off ? null : FOCO;
    for (const [k, s] of Object.entries(this.sombras) as [Quien, SombraSilueta][]) {
      const p = this.pies[k]; if (!p || !this.cartas[k].grupo.visible) continue;
      s.colocar(p[0], p[2], p[1], foco, 0.9, 1.7, this.cartas[k].grupo.rotation.y);
      this.cartas[k].contacto.visible = !off;
    }
    if (this.pies.perro) this.sombraPerro.colocar(this.pies.perro[0], this.pies.perro[2], this.pies.perro[1], foco, 0.3, 1.2, this.dog.grupo.rotation.y);
  }
}

// ------------------------------------------------------------------ escena 3D
const PORTADA: Plano = { w: 177, foco: 2.6, cInf: 8, ini: c([0.6, 1.0, 3.7], [0.4, 0.95, 1.2], 46), fin: c([0.6, 1.0, 3.7], [0.4, 0.95, 1.2], 46),
  hacer: ({ f, m }) => { m.ver("papa", PAPA_POS, { ...LUZ, boca: "amable", mirarY: -0.2 }); m.perro(PERRO_PAPA, { cabeza: 0.4, cola: 0.8 }); m.charco(1); void f; } };

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(177) + 10 : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.1 }),
    luz: new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.16 }),
    vin: new VignetteEffect({ offset: 0.3, darkness: 0.7 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const cc = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    cc.addPass(new RenderPass(scene, cam)); cc.addPass(fx.ink);
    cc.addPass(new EffectPass(cam, fx.lens.pre)); cc.addPass(new EffectPass(cam, fx.lens.main));
    cc.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.sat, fx.luz, fx.vin));
    return cc;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : TAQUERIA_CUADROS;
  const k0 = portada ? 0 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 220; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#05080d");
  scene.fog = new THREE.Fog("#070a12", 16, 70);
  mundo.f = f;
  mundo.reiniciar(cam);
  const off = mundo.luces(f);
  pl.hacer({ f, k: k0, m: mundo });
  mundo.aplicar(off);
  return <primitive object={mundo.h.raiz} dispose={null} />;
};

// ------------------------------------------------------------------ capas de texto (guía §3)
const FUENTES = [["Titulo", "fuentes/InterDisplay-Black.otf"], ["Texto", "fuentes/InterDisplay-ExtraBold.otf"], ["Mono", "fuentes/JetBrainsMono-Bold.ttf"]];
const useFuentes = () => {
  const [h] = React.useState(() => delayRender("fuentes"));
  useEffect(() => {
    Promise.all(FUENTES.map(([n, u]) => new FontFace(n, `url(${staticFile(u)})`).load().then((ff) => { (document.fonts as unknown as { add: (x: FontFace) => void }).add(ff); })))
      .then(() => continueRender(h)).catch(() => continueRender(h));
  }, [h]);
};
const contornoTexto = (px: number) => ({ WebkitTextStroke: `${px}px #0d0a0c`, paintOrder: "stroke fill" as const, textShadow: "0 6px 14px rgba(0,0,0,0.55)" });

const BLOQUES: number[][] = (() => {
  const out: number[][] = []; let cur: number[] = [];
  P.forEach((w, i) => {
    if (cur.length && (cur.length >= 3 || w.ini - P[i - 1].fin > 0.32 || /[.,:;?!»…]$/.test(P[i - 1].txt))) { out.push(cur); cur = []; }
    cur.push(i);
  });
  if (cur.length) out.push(cur);
  return out;
})();
const Subtitulos: React.FC<{ f: number }> = ({ f }) => {
  const t = f / FPS + 1.6 / FPS;
  const bi = BLOQUES.findIndex((b, j) => t >= P[b[0]].ini && (j + 1 >= BLOQUES.length || t < P[BLOQUES[j + 1][0]].ini));
  if (bi < 0) return null;
  const b = BLOQUES[bi];
  if (t > P[b[b.length - 1]].fin + 0.6) return null;
  const actual = b.filter((i) => t >= P[i].ini).pop();
  const pop = Math.min(1, (t - P[b[0]].ini) * 30 / 3);
  return (
    <div style={{ position: "absolute", top: 1517 - 50, width: "100%", textAlign: "center", fontFamily: "Texto", fontSize: 66, lineHeight: "100px", transform: `scale(${0.9 + 0.1 * pop})`, ...contornoTexto(11) }}>
      {b.map((i) => <span key={i} style={{ color: i === actual ? "#ffd23a" : "#ffffff", margin: "0 9px" }}>{P[i].txt.replace(/[«»]/g, "")}</span>)}
    </div>
  );
};
const Titulo: React.FC<{ f: number }> = ({ f }) => {
  const reglas: [number, number, string][] = [[37, 61, "REGLA Nº 1"], [61, 79, "REGLA Nº 2"], [79, 104, "REGLA Nº 3"], [104, 112, "2:10 AM"], [120, 129, "2:30 AM"], [143, 150, "3:00 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "2:00 AM · TACOS «LA ESQUINA» · COL. SANTA FE";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(200) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("LE SIRVES", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("LE CIERRAS", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 220 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Taqueria: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05080d" }}>
      <Lienzo3D />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: tu papá bajo el foco, sin sombra, junto al perro (que sí tiene); título arriba (blanco + palabra en amarillo).
export const TaqueriaPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 0.98, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05080d" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", top: 0, width: "100%", height: 1000, background: "linear-gradient(#05080dee 62%, #05080d00)" }} />
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center" }}>
        {linea("NUNCA ATIENDAS", "#ffffff", 112)}
        {linea("A QUIEN NO TENGA", "#ffffff", 104)}
        {linea("SOMBRA", "#ffd23a", 170)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
