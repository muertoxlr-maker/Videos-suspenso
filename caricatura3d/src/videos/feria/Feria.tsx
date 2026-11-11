// «La rueda de la feria» — animación completa. Mismo composer, tarjetas y capas de texto que «Gasolinera», con las
// mejoras aprobadas de la guía §8.8 (luz cálida con halos, ropa y luz de borde, utilería, gente, gestos al hablar,
// acercamientos rápidos) y la lista §8.6c (nada atraviesa nada, nada encimado). Cada plano empieza 2 cuadros antes
// de su palabra.
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
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { CASETA, PALANCA, RUEDA, crearFeria } from "./feria";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const FERIA_CUADROS = Math.ceil(74.67 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d8b89a", pelo: "#1d1512", ropa: "#2f5a8a", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", prenda: "chamarra", insignia: { tipo: "gafete" }, semilla: 201 };
const DUENO: Aspecto = { piel: "#c49a7a", pelo: "#8f8a84", ropa: "#7a3a2a", ropaInterior: "#e2d8c4", pantalon: "#3a3530", zapatos: "#2a2422", peinado: "recogido", prenda: "camisa", bigote: true, arrugas: true, barba: "sombra", sombrero: "#c9b48a", semilla: 203 };
const SOFI: Aspecto = { piel: "#e0bea0", pelo: "#2a1d16", ropa: "#e07aa0", ropaInterior: "#f4e8ec", pantalon: "#3a4a6a", zapatos: "#e8e0d8", peinado: "trenza", prenda: "chamarra", semilla: 205 };
const NINA: Aspecto = { piel: "#cbc6be", pelo: "#151214", ropa: "#e6e1d6", ropaInterior: "#d6d0c4", pantalon: "#d6d0c4", zapatos: "#2a2422", peinado: "recogido", cuello: "redondo", semilla: 207 };
const HOMBRE: Aspecto = { piel: "#bdb8ae", pelo: "#2a2622", ropa: "#3a3a40", ropaInterior: "#d8d4ca", pantalon: "#2a2a30", zapatos: "#1a1a1e", peinado: "recogido", prenda: "camisa", bigote: true, semilla: 209 };
const MUJER: Aspecto = { piel: "#c4bfb5", pelo: "#3a2a22", ropa: "#5a2a3a", ropaInterior: "#d8d0c4", pantalon: "#3a2a30", zapatos: "#1a1a1e", peinado: "recogido", cuello: "redondo", semilla: 211 };
const SENOR: Aspecto = { piel: "#bcb6aa", pelo: "#d0ccc4", ropa: "#2a2420", ropaInterior: "#d8d2c4", pantalon: "#2a2420", zapatos: "#1a1a1e", peinado: "recogido", prenda: "uniforme", bigote: true, arrugas: true, sombrero: "#1e1a18", semilla: 213 };
const DAMA: Aspecto = { piel: "#c0bbb1", pelo: "#2a2226", ropa: "#4a3a5a", ropaInterior: "#d8d0c8", pantalon: "#4a3a5a", zapatos: "#1a1a1e", peinado: "recogido", cuello: "v", semilla: 215 };
const CHAMACO: Aspecto = { piel: "#c2bdb3", pelo: "#1f1a18", ropa: "#5a6a4a", ropaInterior: "#d0ccc0", pantalon: "#3a3a30", zapatos: "#1a1a1e", peinado: "revuelto", prenda: "camisa", semilla: 217 };
const SOMBRA: Aspecto = { piel: "#15171c", pelo: "#0b0c0f", ropa: "#0e0f12", ropaInterior: "#0e0f12", pantalon: "#0b0c0f", zapatos: "#0b0c0f", peinado: "revuelto", semilla: 219 };
// los que nadie subió: quietos de más, sin parpadear, sonrisa fija
const FANTASMA: Partial<Pose> = { parpadeo: false, pupila: 0.2, ojos: 1.05, boca: "sonrisa", cejasAlto: 0.25, luzX: -1, borde: "#ffcf8a" };

// gente de la feria (se dibuja una sola vez por vista; solo se mueve de lugar)
const PIELES = ["#e0bea0", "#c9a07e", "#b07c5a", "#8e6346", "#d8b496"], PELOS = ["#1d1512", "#3a2a1e", "#6a4a30", "#141012", "#8f8a84"];
const ROPAS = ["#c8263a", "#2f6fb0", "#3a9a5a", "#e0a82a", "#7a3a8a", "#d06a3a", "#4a5a6a", "#e07aa0", "#2a3a5a", "#8a6a3a"];
const PEINADOS: Aspecto["peinado"][] = ["revuelto", "rizado", "trenza", "recogido", "mono"];
const PRENDAS: Aspecto["prenda"][] = ["chamarra", "camisa", undefined, "chamarra", undefined];
const GENTE: { a: Aspecto; alto: number }[] = Array.from({ length: 24 }, (_, i) => ({
  a: { piel: PIELES[i % 5], pelo: PELOS[(i * 3) % 5], ropa: ROPAS[(i * 7) % 10], ropaInterior: "#e6e0d0", pantalon: ["#2a2d36", "#3a4a6a", "#4a3a30"][i % 3], zapatos: "#2a2422", peinado: PEINADOS[(i * 2) % 5], prenda: PRENDAS[i % 5], mochila: i % 6 === 2 ? "#3d5a7a" : undefined, gorra: i % 7 === 3 ? ROPAS[(i + 3) % 10] : undefined, semilla: 300 + i },
  alto: i % 5 === 4 ? 1.2 : 1.55 + ((i * 13) % 7) * 0.04,
}));

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; t: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; cerca?: number; rapido?: boolean; sigue?: number; hacer: (c: Ctx) => void }; // sigue: la cámara va con esa canastilla (pos y mira relativas a su travesaño)
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= Math.round(P[hasta].fin * FPS) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const camina = (f: number, v = 0.5): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v)) * 0.7, Math.max(0, -Math.sin(f * v)) * 0.7], brazoIzq: [0.08 + 0.25 * Math.sin(f * v), -0.04], brazoDer: [0.08 - 0.25 * Math.sin(f * v), -0.04] });

const TU_POS: V3 = [2.95, 0, 2.15]; // junto a la palanca (queda a su derecha en pantalla… a la izquierda del personaje)
const TU_PALANCA: Partial<Pose> = { brazoDer: [1.05, 0.55] }; // mano sobre la perilla

/** posición de la rueda: cuál canastilla (1…8, continua) está abajo en cada cuadro */
const llavesRueda = (): [number, number, "lin" | "suave"][] => [
  [0, 5.0, "lin"], [fw(104), 13.0, "lin"], [fw(119), 15.0, "suave"], [fw(127) - 2, 15.0, "suave"], [fw(133), 18.5, "suave"],
  [fw(143), 18.5, "suave"], [fw(148), 18.8, "suave"], [fw(169), 23.0, "lin"], [FERIA_CUADROS + 30, 29.3, "lin"],
];
let LLAVES: ReturnType<typeof llavesRueda> | null = null;
export const abajo = (f: number) => {
  LLAVES ??= llavesRueda();
  for (let i = 1; i < LLAVES.length; i++) {
    const [f0, b0] = LLAVES[i - 1], [f1, b1, tipo] = LLAVES[i];
    if (f <= f1) { const u = Math.max(0, (f - f0) / Math.max(1, f1 - f0)); return lerp(b0, b1, tipo === "suave" ? u * u * (3 - 2 * u) : u); }
  }
  return LLAVES[LLAVES.length - 1][1];
};
/** centro del travesaño de la canastilla n */
const pivote = (n: number, f: number): V3 => {
  const a = -Math.PI / 2 + (n - abajo(f)) * (Math.PI / 4);
  return [Math.cos(a) * RUEDA.r, RUEDA.y + Math.sin(a) * RUEDA.r, 0];
};
const enCanastilla = (n: number, f: number, dx: number, alto: number, dz = 0): V3 => {
  const [x, y, z] = pivote(n, f);
  return [x + dx, y - (alto > 1.4 ? 2.1 : 1.72), z + dz];
};
const S_X = -0.3, N_X = 0.32; // Sofi y la niña dentro de la siete

const PLANOS: Plano[] = [
  // 1 · Imagina que es la última noche
  { w: 0, foco: 18, cInf: 5, rapido: true, ini: c([6.5, 2.0, 33], [0, 7.5, 2], 50), fin: c([5.2, 2.2, 27.5], [0, 7.5, 2], 50),
    hacer: ({ m }) => { m.gente("feria"); } },
  // 2 · de la feria del pueblo,
  { w: 8, foco: 6, cInf: 7, ini: c([-2.6, 1.55, 25], [3, 2.0, 12], 50), fin: c([-2.2, 1.55, 23.2], [3, 2.0, 12], 50),
    hacer: ({ m }) => { m.gente("feria"); } },
  // 3 · y tú cuidas la rueda de la fortuna.
  { w: 11, foco: 4.6, cInf: 7, rapido: true, ini: c([4.6, 1.6, 6.2], [2.5, 1.95, 1.6], 48), fin: c([4.0, 1.6, 5.1], [2.5, 1.95, 1.6], 48),
    hacer: ({ f, m }) => { m.gente("fila"); m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.4, mirarY: -0.4, boca: "amable", luzX: -1, borde: "#ffcf8a" }); void f; } },
  // 4 · Antes de irse, el dueño te dice:
  { w: 19, foco: 3.6, cInf: 8, ini: c([1.0, 1.6, 7.2], [3.4, 1.35, 3.0], 44), fin: c([1.3, 1.6, 6.6], [3.4, 1.35, 3.0], 44),
    hacer: ({ f, k, m }) => { m.gente("fila"); m.ver("dueno", [lerp(5.2, 3.9, k), 0, lerp(5.2, 3.75, k)], { ...camina(f, 0.45), mirarX: -0.5, luzX: -1, borde: "#ffcf8a" }); m.ver("tu", TU_POS, { mirarX: 0.5, boca: "amable", luzX: -1, borde: "#ffcf8a" }); } },
  // 5 · «Esta feria es más vieja que el pueblo».
  { w: 26, foco: 2.2, cInf: 9, rapido: true, ini: c([2.6, 1.6, 6.4], [3.9, 1.45, 3.75], 40), fin: c([2.95, 1.6, 5.7], [3.9, 1.45, 3.75], 38),
    hacer: ({ f, m }) => { m.ver("dueno", [3.9, 0, 3.75], { mirarX: -0.45, giro: -0.25, cejasMiedo: 0.2, cejasAlto: -0.2, boca: "abierta", bocaAbre: habla(f, 26, 33), luzX: -1, borde: "#ffcf8a", ...hablaGestos(f, 3, 0.8) }); } },
  // 6 · Regla número uno: a las doce se apagan todas las luces de la feria,
  { w: 34, foco: 20, cInf: 4, ini: c([15, 9.5, 33], [0, 3.0, 10], 50), fin: c([13.6, 9.0, 30.5], [0, 3.0, 10], 50),
    hacer: ({ m }) => { m.gente("feria"); } },
  // 7 · menos las de la rueda.
  { w: 48, foco: 8, cInf: 6, ini: c([4.6, 1.4, 8.4], [0, 12.5, 0], 54), fin: c([4.2, 1.4, 7.6], [0, 12.5, 0], 52),
    hacer: () => {} },
  // 8 · Lo que camina en lo oscuro le teme a la luz.
  { w: 53, foco: 14, cInf: 5, ini: c([-17.5, 1.5, 14.5], [-40, 1.4, 12.5], 42), fin: c([-18.2, 1.5, 14.5], [-40, 1.4, 12.5], 40),
    hacer: ({ f, m }) => { m.ver("sombra", [-33, 0, 12.6], { ojosVacios: true, ojos: 0.85, parpadeo: false, mirarX: 0.3, luzX: 1, cuerpoX: Math.sin(f * 0.05) * 0.02 }); } },
  // 9 · Regla número dos: si la rueda empieza a girar sola, no la detengas.
  { w: 64, foco: 1.4, cInf: 9, rapido: true, ini: c([3.2, 1.45, 3.6], [2.35, 1.15, 1.75], 42), fin: c([2.95, 1.4, 3.05], [2.35, 1.15, 1.75], 40),
    hacer: () => {} },
  // 10 · Si la paras, se queda con quien esté hasta arriba.
  { w: 77, foco: 16, cInf: 5, ini: c([1.4, 1.6, 6.5], [0, 17.5, 0], 42), fin: c([1.4, 1.6, 6.5], [0, 17.8, 0], 32),
    hacer: () => {} },
  // 11 · Regla número tres: después de medianoche, no subes a nadie.
  { w: 87, foco: 4.0, cInf: 8, ini: c([-1.6, 1.55, 5.6], [0.9, 1.25, 1.4], 46), fin: c([-1.3, 1.55, 5.1], [0.9, 1.25, 1.4], 46),
    hacer: ({ f, m }) => { m.gente("fila"); m.ver("tu", [1.75, 0, 2.3], { mirarX: -0.6, boca: "linea", cejasAlto: -0.2, luzX: -1, borde: "#ffcf8a", brazoDer: [0.6, 0.4], ...tiembla(f, 0) }); } },
  // 12 · A esa hora ya no son clientes.
  { w: 97, foco: 4.5, cInf: 8, rapido: true, ini: c([0.5, 1.5, 1.7], [-0.2, 1.4, 8], 46), fin: c([0.45, 1.5, 1.8], [-0.2, 1.35, 8], 40),
    hacer: ({ m }) => { m.gente("fila"); } },
  // 13 · A las once y media, la gente se va.
  { w: 104, foco: 9, cInf: 6, ini: c([0.4, 2.1, 7.2], [0, 1.6, 22], 46), fin: c([0.4, 2.1, 7.8], [0, 1.6, 22], 46),
    hacer: ({ f, m }) => { m.gente("sevan", f - fw(104)); } },
  // 14 · Tu hermanita Sofi te ruega una última vuelta.
  { w: 113, foco: 2.4, cInf: 9, rapido: true, ini: c([3.4, 1.25, 5.6], [2.4, 1.05, 2.55], 44), fin: c([3.2, 1.25, 4.9], [2.4, 1.05, 2.55], 42),
    hacer: ({ f, m }) => {
      m.ver("sofi", [2.1, 0, 2.85], { mirarX: 0.7, mirarY: -0.5, cejasMiedo: 0.6, cejasAlto: 0.4, boca: "abierta", bocaAbre: 0.4 + 0.4 * Math.abs(Math.sin(f * 0.6)), luzX: -1, borde: "#ffcf8a", ...hablaGestos(f, 7, 1) });
      m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.5, mirarY: 0.3, boca: "amable", luzX: -1, borde: "#ffcf8a" });
    } },
  // 15 · La subes a la canastilla siete.
  { w: 121, foco: 3.2, cInf: 8, sigue: 7, ini: c([1.7, -0.6, 3.6], [0.1, -0.9, 0], 46), fin: c([1.5, -0.6, 3.2], [0.1, -0.9, 0], 46),
    hacer: ({ f, m }) => {
      m.ver("sofi", enCanastilla(7, f, S_X + 0.15, 1.2), { mirarX: 0.4, boca: "abierta", bocaAbre: 0.55, cejasAlto: 0.3, brazoIzq: [2.2, 0.5 + 0.4 * Math.sin(f * 0.5)], luzX: -1, borde: "#ffcf8a" });
      m.ver("tu", [1.6, 0, 2.3], { mirarX: -0.5, boca: "amable", brazoDer: [0.7, 0.5], luzX: -1, borde: "#ffcf8a" });
    } },
  // 16 · A las doce, se apaga la feria.
  { w: 127, foco: 20, cInf: 4, ini: c([6.5, 6.5, 33], [0, 4.5, 8], 50), fin: c([6.0, 6.3, 31.5], [0, 4.5, 8], 50),
    hacer: () => {} },
  // 17 · Solo brilla la rueda.
  { w: 134, foco: 40, cInf: 3, ini: c([-9, 2.6, 46], [0, 9.5, 0], 40), fin: c([-8.6, 2.6, 44], [0, 9.5, 0], 40),
    hacer: () => {} },
  // 18 · La palanca está en freno.
  { w: 138, foco: 1.2, cInf: 9, rapido: true, ini: c([2.1, 1.5, 3.9], [2.6, 1.25, 1.9], 42), fin: c([2.2, 1.48, 3.5], [2.6, 1.25, 1.9], 40),
    hacer: ({ m }) => { m.luz(1.2, 3.0, 4.0, 2.6); m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.3, mirarY: 0.5, cejasMiedo: 0.4, luzX: -1, borde: "#ffcf8a" }); } },
  // 19 · Aun así, la rueda gira.
  { w: 143, foco: 10, cInf: 6, ini: c([1.6, 0.9, 4.4], [0, 9.5, 0], 52), fin: c([1.6, 0.9, 4.4], [0, 9.5, 0], 46),
    hacer: () => {} },
  // 20 · Las canastillas bajan.
  { w: 148, foco: 8, cInf: 6, ini: c([7.6, 2.0, 8.4], [4.5, 5.0, 0], 50), fin: c([7.2, 2.0, 7.9], [4.5, 4.4, 0], 50),
    hacer: () => {} },
  // 21 · En la tres, una pareja que nunca subiste.
  { w: 151, foco: 2.5, cInf: 9, rapido: true, sigue: 3, ini: c([0.9, -0.5, 3.0], [0, -0.78, 0], 42), fin: c([0.55, -0.58, 2.3], [0, -0.78, 0], 40),
    hacer: () => {} },
  // 22 · En la cinco, un señor con ropa antigua.
  { w: 159, foco: 2.3, cInf: 9, rapido: true, sigue: 5, ini: c([-0.9, -0.5, 2.9], [0, -0.8, 0], 42), fin: c([-0.5, -0.6, 2.2], [0, -0.8, 0], 38),
    hacer: () => {} },
  // 23 · Todos sonríen.
  { w: 167, foco: 3.4, cInf: 8, sigue: 8, ini: c([-0.8, -0.25, 3.6], [0, -0.7, 0], 46), fin: c([-0.6, -0.3, 3.1], [0, -0.7, 0], 44),
    hacer: () => {} },
  // 24 · Baja la siete.
  { w: 169, foco: 4.2, cInf: 8, sigue: 7, ini: c([1.0, 0.05, 4.4], [0, -0.95, 0], 46), fin: c([0.9, 0.0, 3.9], [0, -0.95, 0], 44),
    hacer: () => {} },
  // 25 · Sofi llora: «¡Párala! ¡Quiero bajar!».
  { w: 172, foco: 2.0, cInf: 9, rapido: true, sigue: 7, ini: c([-0.32, -0.72, 2.4], [-0.3, -0.78, 0], 42), fin: c([-0.31, -0.74, 2.0], [-0.3, -0.78, 0], 40),
    hacer: () => {} },
  // 26 · A su lado, abrazándola,
  { w: 177, foco: 2.6, cInf: 9, sigue: 7, ini: c([0.0, -0.68, 2.9], [0.0, -0.85, 0], 44), fin: c([0.0, -0.7, 2.55], [0.0, -0.85, 0], 44),
    hacer: () => {} },
  // 27 · hay una niña que tú no subiste.
  { w: 181, foco: 1.9, cInf: 9, rapido: true, sigue: 7, ini: c([0.38, -0.72, 2.3], [0.32, -0.78, 0], 40), fin: c([0.36, -0.74, 1.85], [0.32, -0.78, 0], 36),
    hacer: () => {} },
  // 28 · Tu mano está en la palanca.
  { w: 188, foco: 1.9, cInf: 9, ini: c([3.9, 1.35, 3.9], [2.6, 1.2, 1.9], 42), fin: c([3.7, 1.33, 3.6], [2.6, 1.2, 1.9], 40),
    hacer: ({ f, m }) => { m.luz(1.2, 3.0, 4.0, 2.6); m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.6, mirarY: 0.4, cejasMiedo: 1, sudor: 1, luzX: -1, borde: "#ffcf8a", ...tiembla(f, 0.8) }); } },
  // 29 · ¿Detienes la rueda...
  { w: 194, foco: 1.7, cInf: 9, rapido: true, ini: c([2.3, 1.6, 4.3], [2.95, 1.5, 2.15], 38), fin: c([2.45, 1.6, 3.85], [2.95, 1.5, 2.15], 36),
    hacer: ({ f, m }) => { m.luz(1.2, 3.0, 4.0, 2.6); m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.7, mirarY: 0.5, ojos: 1.15, pupila: 0.2, cejasMiedo: 1, boca: "o", sudor: 1, luzX: -1, borde: "#ffcf8a", ...tiembla(f, 1) }); } },
  // 30 · o la dejas girar?
  { w: 197, foco: 12, cInf: 5, ini: c([7.5, 2.4, 13.5], [0, 6.5, 0], 50), fin: c([8.6, 2.8, 15.5], [0, 6.5, 0], 50),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...TU_PALANCA, mirarX: -0.7, mirarY: 0.6, cejasMiedo: 1, luzX: -1, borde: "#ffcf8a", ...tiembla(f, 1) }); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
const CARTAS = {
  tu: [TU, 1.72], dueno: [DUENO, 1.7], sofi: [SOFI, 1.2], nina: [NINA, 1.2], sombra: [SOMBRA, 2.1],
  hombre: [HOMBRE, 1.68], mujer: [MUJER, 1.6], senor: [SENOR, 1.66], dama: [DAMA, 1.6], chamaco: [CHAMACO, 1.2],
} as const;
type Quien = keyof typeof CARTAS;
const MEDIANOCHE = () => fw(130); // se empiezan a apagar las luces

class Mundo {
  h = crearFeria();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  publico = GENTE.map((g) => ({ t: new Tarjeta(g.a, g.alto), clave: "" }));
  jinetes = [1, 2, 4, 6, 8].map((n, i) => ({ n, t: new Tarjeta(GENTE[(i * 5 + 3) % GENTE.length].a, 1.62), clave: "" }));
  f = 0;
  dentro = false; // plano que sigue a una canastilla
  private camPos = new THREE.Vector3();
  private apagado = new THREE.MeshBasicMaterial({ color: "#2a2622", toneMapped: false });
  constructor() {
    for (const c of Object.values(this.cartas)) this.h.raiz.add(c.grupo);
    for (const g of this.publico) this.h.raiz.add(g.t.grupo);
    for (const j of this.jinetes) { this.h.raiz.add(j.t.grupo); j.t.sinSombras(); }
    for (const q of ["sofi", "nina", "hombre", "mujer", "senor", "dama", "chamaco"] as Quien[]) this.cartas[q].sinSombras();
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    for (const g of this.publico) g.t.grupo.visible = false;
    for (const j of this.jinetes) j.t.grupo.visible = false;
    this.h.luzExtra.intensity = 0;
  }
  luz(x: number, y: number, z: number, i: number) { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; }
  private mirar(g: THREE.Group, pos: V3) { g.position.set(...pos); g.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]); }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; this.mirar(c.grupo, pos);
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[2] * 3), ...pose });
  }
  private fija(x: { t: Tarjeta; clave: string }, clave: string, pose: Partial<Pose>) {
    if (x.clave !== clave) { x.t.dibujar({ ...POSE, ...pose }); x.clave = clave; }
  }
  /** la gente de la feria: «feria» paseando, «fila» formada para subir, «sevan» caminando hacia la salida */
  gente(modo: "feria" | "fila" | "sevan", df = 0) {
    this.publico.forEach((g, i) => {
      let pos: V3, espalda = false;
      if (modo === "fila") {
        if (i >= 7) return;
        pos = [-0.15 + (i % 2) * 0.35, 0, 3.4 + i * 0.75];
      } else {
        const x = -3.2 + ((i * 2.71) % 6.4), z = 9.5 + ((i * 3.37) % 16);
        pos = [x, 0, z];
        if (modo === "sevan") { espalda = true; pos = [x * 0.9, 0, z + df * (0.04 + (i % 3) * 0.01)]; }
      }
      const pose: Partial<Pose> = espalda ? { vista: "espalda", luzX: -1 } : { mirarX: ((i * 37) % 10) / 10 - 0.5, boca: i % 4 === 0 ? "amable" : "linea", luzX: i % 2 ? 1 : -1, borde: "#ffcf8a", brazoDer: i % 5 === 1 ? [1.6, 1.4] : [0.08, -0.04] };
      this.fija(g, `${modo === "sevan" ? "e" : "f"}`, pose);
      g.t.grupo.visible = true; this.mirar(g.t.grupo, pos);
    });
  }
  luces(f: number) {
    const m0 = MEDIANOCHE();
    const fuera = (d: number) => f >= m0 + d; // cada grupo se apaga con su golpe seco, uno tras otro
    const apagar = (list: THREE.Mesh[], off: boolean, i0 = 0) => list.forEach((b, i) => { if (off) b.material = this.apagado; else b.material = this.h.matFocos[(i + i0) % 4]; });
    apagar(this.h.focosArco, fuera(0));
    this.h.focosGuirnalda.forEach((fila, gi) => apagar(fila, fuera(3 + gi * 3), gi));
    this.h.halosGuirnalda.forEach((h, i) => { h.visible = !fuera(3 + Math.floor(i / 4) * 3); });
    this.h.puestos.forEach((p, i) => { const off = fuera(4 + i * 3); p.luz.visible = !off; p.halo.visible = !off; });
    this.h.lucesPasillo.forEach((l, i) => { l.intensity = fuera(6 + i * 6) ? 0 : 4.5; });
    const offC = fuera(20);
    apagar(this.h.focosCarr, offC); this.h.haloCarr.visible = !offC; this.h.luzCarr.intensity = offC ? 0 : 4;
    const offK = fuera(1);
    this.h.luzCaseta.intensity = offK ? 0 : 2.4; this.h.haloCaseta.visible = !offK;
    (this.h.vent.material as THREE.MeshBasicMaterial).color.set(offK ? "#1a1612" : "#ffd79a");
    (this.h.focoCaseta.material as THREE.MeshBasicMaterial).color.set(offK ? "#2a2622" : "#ffe2b0");
    // focos de la rueda: antes de medianoche se «persiguen»; después, fijos y un poco más cálidos
    const despues = f >= m0;
    this.h.matFocos.forEach((mat, i) => {
      const base = new THREE.Color(["#ffcf6a", "#ff6a5a", "#7ad0ff", "#ffe9a8"][i]);
      const k = despues ? 0.92 : 0.55 + 0.45 * ((Math.floor(f / 5) + i) % 4 === 0 ? 1 : 0.35);
      mat.color.copy(base).multiplyScalar(k);
    });
  }
  aplicar(f: number) {
    const b = abajo(f);
    this.h.giro.rotation.z = -Math.PI / 2 - (b - 1) * (Math.PI / 4); // travesaño 0 → canastilla 1
    // en los planos dentro de la rueda, los focos que pasan pegados a la cámara taparían las caras: se ocultan
    this.h.giro.updateMatrixWorld(true);
    const w = new THREE.Vector3();
    this.h.focosRueda.forEach((m) => { m.getWorldPosition(w); m.visible = w.distanceTo(this.camPos) > 1.8; });
    if (this.dentro) this.h.frenteRueda.forEach((o) => { o.visible = false; });
    else this.h.frenteRueda.forEach((o) => { o.visible = true; });
    this.h.canastillas.forEach((g, i) => g.position.set(...pivote(i + 1, f)));
    this.h.girCarr.rotation.y = f >= MEDIANOCHE() + 20 ? this.h.girCarr.rotation.y : f * 0.012;
    // la palanca: en marcha hasta que paras la rueda para que Sofi suba; después, en freno
    const freno = suave(fw(117), fw(119), f);
    this.h.brazo.rotation.x = lerp(-0.5, 0.55, freno);
    // pasajeros antes de medianoche (gente normal) y después (los que nadie subió)
    if (f < MEDIANOCHE()) {
      this.jinetes.forEach((j, i) => {
        this.fija(j, "f", { mirarX: (i % 3) * 0.3 - 0.3, boca: i % 2 ? "amable" : "abierta", bocaAbre: 0.4, luzX: -1, borde: "#ffcf8a", brazoDer: i % 2 ? [2.4, 0.4] : [0.08, -0.04] });
        j.t.grupo.visible = true; this.mirar(j.t.grupo, enCanastilla(j.n, f, (i % 2) * 0.2 - 0.1, 1.62));
      });
    } else {
      this.ver("hombre", enCanastilla(3, f, -0.32, 1.68), { ...FANTASMA, mirarX: 0.2 });
      this.ver("mujer", enCanastilla(3, f, 0.34, 1.6, 0.06), { ...FANTASMA, mirarX: -0.2 });
      this.ver("senor", enCanastilla(5, f, 0, 1.66), { ...FANTASMA });
      this.ver("dama", enCanastilla(1, f, 0, 1.6), { ...FANTASMA, mirarX: 0.3 });
      this.ver("chamaco", enCanastilla(8, f, 0, 1.2), { ...FANTASMA, mirarX: -0.3 });
    }
    if (f >= fw(127) - 2) this.verSofi(f, f >= MEDIANOCHE());
  }
  verSofi(f: number, conNina: boolean) {
    const llora = f >= fw(169) - 2;
    this.ver("sofi", enCanastilla(7, f, S_X, 1.2), llora
      ? { mirarX: 0.5, mirarY: 0.3, ojos: 1.12, pupila: 0.22, cejasMiedo: 1, cejasAlto: 0.4, boca: f >= fw(174) - 1 && f <= Math.round(P[176].fin * FPS) ? "grito" : "triste", lagrimas: Math.min(1, (f - fw(169)) / 30), brazoIzq: [2.5, 0.3 + 0.2 * Math.sin(f * 0.7)], brazoDer: [0.3, -0.2], luzX: -1, borde: "#ffcf8a", ...tiembla(f, 0.6) }
      : { mirarX: 0.2, mirarY: -0.5, cejasMiedo: 0.7, boca: "triste", luzX: -1, borde: "#ffcf8a", brazoIzq: [0.5, 0.6] });
    if (conNina) this.ver("nina", enCanastilla(7, f, N_X, 1.2, 0.05), { ...FANTASMA, boca: "amable", mirarX: f >= fw(181) - 2 ? 0 : -0.6, brazoDer: [2.3, 0.7] });
  }
}

// ------------------------------------------------------------------ escena 3D
const PORTADA: Plano = { w: 181, foco: 2.3, cInf: 8, ini: c([0.05, 1.75, 2.9], [0.0, 2.0, 0], 46), fin: c([0.05, 1.75, 2.9], [0.0, 2.0, 0], 46), hacer: () => {} };

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(181) + 10 : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.14 }),
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : FERIA_CUADROS;
  const k0 = portada ? 0 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0; // acercamiento rápido al inicio del plano y luego casi quieto
  const o: V3 = pl.sigue ? pivote(pl.sigue, f) : [0, 0, 0];
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k) + o[j]) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 220; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k) + o[j]) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0; fx.lens.main.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0;
  const noche = f >= MEDIANOCHE() + 10;
  scene.background = new THREE.Color("#05080d");
  scene.fog = noche ? new THREE.Fog("#06090f", 22, 90) : new THREE.Fog("#0b111d", 28, 110);
  mundo.f = f;
  mundo.dentro = !!pl.sigue;
  mundo.reiniciar(cam);
  mundo.luces(f);
  pl.hacer({ f, t: f / FPS, k: k0, m: mundo });
  mundo.aplicar(f);
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
  const reglas: [number, number, string][] = [[34, 64, "REGLA Nº 1"], [64, 87, "REGLA Nº 2"], [87, 104, "REGLA Nº 3"], [104, 113, "11:30 PM"], [127, 134, "12:00 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "ÚLTIMA NOCHE · 11:00 PM · FERIA DEL PUEBLO";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(194) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("DETENER", "#c8263a", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("DEJAR GIRAR", "#2f63d2", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 220 }}>
    <ambientLight intensity={0.28} color="#7a8a9a" />
    <hemisphereLight args={["#5a6f88", "#1a120c", 0.38]} />
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Feria: React.FC = () => {
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
// Portada: la siete con Sofi llorando y la niña que nadie subió; título arriba (blanco + palabra clave en amarillo).
export const FeriaPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 0.98, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05080d" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", top: 0, width: "100%", height: 760, background: "linear-gradient(#05080dee 55%, #05080d00)" }} />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        {linea("NUNCA SUBAS A LA", "#ffffff", 104)}
        {linea("RUEDA DESPUÉS DE", "#ffffff", 104)}
        {linea("MEDIANOCHE", "#ffd23a", 150)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void CASETA; void PALANCA;
