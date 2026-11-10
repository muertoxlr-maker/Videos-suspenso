// «Gasolinera de la carretera» — animación completa. Parte del código y los valores del estándar aprobado (guía §8),
// de «El turno de las 3:00» y de «Último vagón»: mismo composer, mismas tarjetas, cada plano empieza 2 cuadros antes
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
import { PUERTA, VENTANILLA, crearGasolinera } from "./estacion";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const GASO_CUADROS = Math.ceil(77.65 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d8b89a", pelo: "#1d1512", ropa: "#9e2b2b", ropaInterior: "#e6e0d0", pantalon: "#2a2d36", zapatos: "#2a2422", peinado: "revuelto", cuello: "redondo", insignia: { tipo: "gafete" }, semilla: 101 };
const ENCARGADO: Aspecto = { piel: "#c49a7a", pelo: "#8f8a84", ropa: "#4f5d3f", ropaInterior: "#d9d2c0", pantalon: "#3a3530", zapatos: "#2a2422", peinado: "recogido", bigote: true, gorra: "#2f4a7a", cuello: "v", semilla: 103 };
const CHOFER: Aspecto = { piel: "#b98a6a", pelo: "#1b1514", ropa: "#5a3a2a", ropaInterior: "#cfc8b4", pantalon: "#2c2f38", zapatos: "#2a2422", peinado: "revuelto", gorra: "#8a2a24", semilla: 105 };
const NINO: Aspecto = { piel: "#d6b294", pelo: "#2a1d16", ropa: "#cfc9b8", ropaInterior: "#bdb6a2", pantalon: "#3a4a6a", zapatos: "#c9a283", peinado: "revuelto", cuello: "redondo", semilla: 107 };
const SOMBRA: Aspecto = { piel: "#15171c", pelo: "#0b0c0f", ropa: "#0e0f12", ropaInterior: "#0e0f12", pantalon: "#0b0c0f", zapatos: "#0b0c0f", peinado: "revuelto", semilla: 109 };
// el niño: quieto de más, sin parpadear, pupilas un poco chicas
const QUIETO: Partial<Pose> = { parpadeo: false, pupila: 0.24, ojos: 1.08, cejasMiedo: 0.35, cejasAlto: 0.15, boca: "linea", luzX: 1 };
const camina = (f: number, v = 0.5): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v)) * 0.7, Math.max(0, -Math.sin(f * v)) * 0.7], brazoIzq: [0.08 + 0.25 * Math.sin(f * v), -0.04], brazoDer: [0.08 - 0.25 * Math.sin(f * v), -0.04] });

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; t: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; cerca?: number; hacer: (c: Ctx) => void };

const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= Math.round(P[hasta].fin * FPS) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const VX = VENTANILLA.x;
const TU_POS: V3 = [VX, 0, -1.05]; // detrás del mostrador, frente a la ventanilla
const NINO_POS: V3 = [VX, 0.15, 0.55]; // sobre la banqueta, frente a la ventanilla (a 0.55: la charola no lo atraviesa)
const TRA_VENT = VX + 1.05; // posición del tráiler con la ventana del chofer frente a la ventanilla
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });

const PLANOS: Plano[] = [
  // 1 · Imagina que es tu primer turno de noche
  { w: 0, foco: 20, cInf: 5, ini: c([-7, 2.3, 25], [0, 2.0, 2], 50), fin: c([-6.2, 2.2, 23.2], [0, 2.0, 2], 50),
    hacer: ({ m }) => { m.ver("tu", TU_POS, { mirarX: 0.2, luzX: 1 }); } },
  // 2 · en una gasolinera de carretera.
  { w: 8, foco: 9, cInf: 6, ini: c([12.5, 1.5, 18], [5, 3.6, 7], 46), fin: c([12.1, 1.5, 17.4], [5, 3.6, 7], 46),
    hacer: () => {} },
  // 3 · El pueblo más cercano está a cuarenta kilómetros.
  { w: 13, foco: 4.2, cInf: 6, ini: c([-8.0, 1.8, 18.2], [-9.0, 2.0, 12.9], 40), fin: c([-8.2, 1.8, 17.7], [-9.0, 2.0, 12.9], 40),
    hacer: ({ m }) => { m.luz(-8.2, 3.2, 15.0, 2.2); } },
  // 4 · El encargado se va a las diez
  { w: 21, foco: 3.3, cInf: 8, ini: c([-0.05, 1.6, -1.75], [2.2, 1.2, -0.3], 46), fin: c([0.1, 1.6, -1.65], [2.5, 1.2, 0.6], 46),
    hacer: ({ f, k, m }) => { m.abrir(suave(0.12, 0.32, k) * (1 - suave(0.78, 0.95, k))); m.ver("encargado", [lerp(2.5, 2.6, k), 0, lerp(-1.4, 1.4, k)], { vista: "espalda", ...camina(f), luzX: -1 }); } },
  // 5 · y te deja una libreta:
  { w: 28, foco: 0.8, cInf: 9, ini: c([-1.75, 1.6, -0.98], [-1.75, 1.04, -0.45], 52), fin: c([-1.75, 1.56, -0.92], [-1.75, 1.04, -0.45], 50),
    hacer: () => {} },
  // 6 · «Léela. Y obedécela».
  { w: 33, foco: 1.9, cInf: 9, ini: c([1.5, 1.6, -1.35], [2.5, 1.55, 0.4], 34), fin: c([1.55, 1.6, -1.25], [2.5, 1.55, 0.4], 34),
    hacer: ({ f, m }) => { m.ver("encargado", [2.55, 0, 0.6], { mirarX: -0.5, giro: -0.25, cejasMiedo: 0.15, cejasAlto: -0.2, boca: "abierta", bocaAbre: habla(f, 33, 35), luzX: -1 }); } },
  // 7 · Regla número uno: después de medianoche,
  { w: 36, foco: 3.1, cInf: 8, ini: c([-0.2, 1.55, -1.85], [2.5, 1.25, 0], 46), fin: c([-0.05, 1.55, -1.7], [2.5, 1.25, 0], 46),
    hacer: () => {} },
  // 8 · la puerta se queda cerrada.
  { w: 42, foco: 0.75, cInf: 9, ini: c([1.85, 1.15, -0.72], [2.14, 0.85, -0.06], 36), fin: c([1.88, 1.13, -0.65], [2.14, 0.85, -0.06], 36),
    hacer: ({ k, m }) => { m.cerrar(suave(0.25, 0.6, k)); } },
  // 9 · Solo atiendes por la ventanilla.
  { w: 47, foco: 2.4, cInf: 8, ini: c([-1.0, 1.45, 2.4], [-1.5, 1.3, 0], 40), fin: c([-1.05, 1.45, 2.15], [-1.5, 1.3, 0], 40),
    hacer: ({ m }) => { m.cerrar(1); m.ver("tu", TU_POS, { mirarX: 0.1, luzX: 1 }); } },
  // 10 · Regla número dos:
  { w: 52, foco: 8, cInf: 6, ini: c([0.5, 1.6, 9.6], [-15, 0.8, 17.5], 46), fin: c([0.3, 1.6, 9.9], [-15, 0.8, 17.5], 46),
    hacer: ({ m }) => { m.cerrar(1); } },
  // 11 · si llega alguien caminando, no le vendas nada.
  { w: 55, foco: 1.35, cInf: 9, ini: c([0.05, 1.5, -0.3], [-1.5, 1.35, -1.05], 46), fin: c([0.0, 1.5, -0.35], [-1.5, 1.35, -1.05], 44),
    hacer: ({ m }) => { m.cerrar(1); m.ver("tu", TU_POS, { mirarX: -0.3, mirarY: 0.6, cejasMiedo: 0.6, cejasAlto: 0.2, hombros: 0.2, luzX: 1 }); } },
  // 12 · Nadie camina por esta carretera.
  { w: 63, foco: 30, cInf: 4, ini: c([-4, 1.15, 13.4], [-60, 0.8, 17.6], 40), fin: c([-4.3, 1.15, 13.4], [-60, 0.8, 17.6], 40),
    hacer: ({ m }) => { m.cerrar(1); } },
  // 13 · Regla número tres:
  { w: 68, foco: 3, cInf: 6, ini: c([0, 1.4, 6.2], [0.6, 4.6, 7.4], 56), fin: c([0, 1.4, 6.0], [0.6, 4.6, 7.4], 56),
    hacer: ({ m }) => { m.cerrar(1); } },
  // 14 · las luces del techo nunca se apagan.
  { w: 71, foco: 11, cInf: 5, ini: c([-11.5, 2.0, 7.0], [0, 2.0, 5.0], 46), fin: c([-11.0, 2.0, 6.8], [0, 2.0, 5.0], 46),
    hacer: ({ m }) => { m.cerrar(1); } },
  // 15 · Lo que baja del monte no cruza la luz.
  { w: 78, foco: 30, cInf: 4, ini: c([-7.5, 1.6, 2.6], [-40, 21, -70], 46), fin: c([-7.5, 1.65, 2.4], [-40, 22, -70], 46),
    hacer: ({ m }) => { m.cerrar(1); } },
  // 16 · A las doce, cierras la puerta.
  { w: 87, foco: 2.4, cInf: 8, ini: c([0.35, 1.65, -1.95], [2.2, 1.15, -0.2], 46), fin: c([0.45, 1.65, -1.8], [2.2, 1.15, -0.2], 46),
    hacer: ({ f, m }) => { const a = suave(fw(90), fw(92), f); m.cerrar(a); m.ver("tu", [1.95, 0, -0.6], { vista: "espalda", brazoDer: [lerp(0.08, 1.3, a), lerp(-0.04, 0.9, a)], luzX: 1 }); } },
  // 17 · A la una, un tráiler se detiene.
  { w: 93, foco: 4.5, cInf: 7, ini: c([0.1, 1.65, -1.9], [-2.2, 1.9, 2.0], 54), fin: c([0.05, 1.65, -1.8], [-2.0, 1.9, 2.0], 54),
    hacer: ({ k, m }) => { m.cerrar(1); m.trailer(lerp(-24, TRA_VENT, 1 - (1 - Math.min(1, k * 1.7)) ** 2), 1); m.ver("tu", TU_POS, { vista: "espalda", luzX: 1 }); } },
  // 18 · El chofer paga su café sin bajarse
  { w: 100, foco: 2.8, cInf: 8, ini: c([-1.25, 1.85, -1.95], [-1.5, 2.2, 1.0], 40), fin: c([-1.28, 1.85, -1.8], [-1.5, 2.2, 1.0], 40),
    hacer: ({ f, m }) => {
      m.cerrar(1); m.trailer(TRA_VENT, 1);
      m.ver("chofer", [VX, 1.08, 0.82], { mirarX: 0.4, mirarY: -0.2, cejasMiedo: 0.5, brazoDer: [1.5, 0.7], boca: "linea", luzX: -1, cabezaX: 0.03 * Math.sin(f * 0.3) });
      m.ver("tu", TU_POS, { vista: "espalda", brazoIzq: [1.1, 0.6], luzX: 1 });
    } },
  // 19 · y arranca rápido, sin mirar atrás.
  { w: 107, foco: 8, cInf: 6, ini: c([15, 1.5, 9.5], [6, 1.9, 1.6], 48), fin: c([15.5, 1.5, 9.2], [12, 1.9, 1.6], 48),
    hacer: ({ k, m }) => { m.cerrar(1); m.trailer(TRA_VENT + 30 * k * k, 0); m.ver("tu", TU_POS, { mirarX: 0.6, cejasMiedo: 0.5, luzX: 1 }); } },
  // 20 · A las dos, las luces del techo parpadean.
  { w: 113, foco: 6, cInf: 7, ini: c([-0.8, 1.6, -3.2], [0, 2.7, 6], 52), fin: c([-0.8, 1.6, -3.0], [0, 2.7, 6], 52),
    hacer: ({ f, m }) => { m.cerrar(1); m.parpadeo(f); m.ver("tu", TU_POS, { vista: "espalda", hombros: 0.3, luzX: 1 }); } },
  // 21 · Detrás de las bombas,
  { w: 121, foco: 7, cInf: 6, ini: c([-4.6, 1.25, 3.4], [2.6, 1.1, 8.2], 44), fin: c([-4.4, 1.25, 3.5], [2.6, 1.1, 8.2], 42),
    hacer: ({ f, m }) => { m.cerrar(1); m.parpadeo(f); } },
  // 22 · algo se mueve... y se aleja.
  { w: 125, foco: 9, cInf: 6, ini: c([-3.6, 1.35, 2.8], [3.4, 1.3, 9.8], 36), fin: c([-3.5, 1.35, 2.9], [4.4, 1.3, 11.0], 36),
    hacer: ({ f, k, m }) => {
      m.cerrar(1); m.parpadeo(f);
      const a = suave(fw(128), fw(130) + 20, f);
      m.ver("sombra", [lerp(3.2, 6.5, a), 0, lerp(9.2, 14.5, a)], { vista: a > 0.05 ? "espalda" : "frente", ojosVacios: true, ojos: 0.8, mirarX: -0.6, ...(a > 0.05 ? camina(f, 0.35) : {}), luzX: -1 });
      void k;
    } },
  // 23 · A las tres, llega un niño.
  { w: 131, foco: 9, cInf: 7, ini: c([-0.85, 1.7, -1.5], [-1.3, 0.9, 12], 46), fin: c([-0.85, 1.7, -1.35], [-1.25, 0.9, 12], 44),
    hacer: ({ f, k, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", [lerp(-1.6, -1.0, k), 0, lerp(15.2, 9.0, k)], { ...QUIETO, ...camina(f, 0.45) }); m.ver("tu", TU_POS, { vista: "espalda", luzX: 1 }); } },
  // 24 · Descalzo.
  { w: 137, foco: 1.6, cInf: 9, ini: c([-0.9, 0.24, 4.85], [-1.0, -0.05, 6.3], 38), fin: c([-0.9, 0.23, 4.9], [-1.0, -0.05, 6.1], 38),
    hacer: ({ f, k, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", [-1.0, 0, lerp(6.6, 6.0, k)], { ...QUIETO, ...camina(f, 0.45) }); } },
  // 25 · Caminando.
  { w: 138, foco: 3.5, cInf: 8, ini: c([-0.4, 1.3, 0.9], [-1.0, 0.8, 6.0], 42), fin: c([-0.4, 1.3, 0.9], [-1.05, 0.8, 4.6], 42),
    hacer: ({ f, k, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", [lerp(-1.0, -1.1, k), 0, lerp(5.8, 3.6, k)], { ...QUIETO, ...camina(f, 0.45) }); } },
  // 26 · «Se descompuso el carro de mi mamá», dice.
  { w: 139, foco: 2.5, cInf: 9, ini: c([-1.15, 2.15, -2.15], [-1.5, 1.15, 0.3], 38), fin: c([-1.2, 2.1, -2.0], [-1.5, 1.15, 0.3], 38),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, boca: "abierta", bocaAbre: habla(f, 139, 145) }); m.ver("tu", TU_POS, { vista: "espalda", hombros: 0.25, luzX: 1 }); } },
  // 27 · «Solo quiero agua».
  { w: 147, foco: 0.9, cInf: 9, ini: c([-1.5, 1.34, -0.8], [-1.5, 1.24, 0.32], 50), fin: c([-1.5, 1.33, -0.72], [-1.5, 1.24, 0.32], 48),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, cejasMiedo: 0.6, boca: "abierta", bocaAbre: habla(f, 147, 149) }); } },
  // 28 · A lo lejos, en la carretera,
  { w: 150, foco: 30, cInf: 4, ini: c([-0.6, 1.55, 1.4], [-55, 0.9, 18.6], 34), fin: c([-0.7, 1.55, 1.5], [-55, 0.9, 18.6], 30),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, vista: "espalda" }); } },
  // 29 · hay un carro con las intermitentes prendidas.
  { w: 156, foco: 49, cInf: 3, ini: c([-6, 1.4, 14], [-55, 0.7, 18.6], 11), fin: c([-6, 1.4, 14], [-55, 0.7, 18.6], 9.5),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); } },
  // 30 · Hace frío.
  { w: 163, foco: 1.2, cInf: 9, ini: c([-2.6, 1.55, -0.18], [-1.5, 1.42, -1.05], 56), fin: c([-2.55, 1.55, -0.22], [-1.5, 1.42, -1.05], 54),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("tu", TU_POS, { mirarX: 0.6, cejasMiedo: 0.5, hombros: 0.6, brazoIzq: [0.6, -1.4], brazoDer: [0.6, -1.4], respira: Math.sin(f * 0.25) * 0.5, luzX: 1 }); m.aliento(f, fw(163)); } },
  // 31 · Tu aliento empaña el vidrio de la ventanilla.
  { w: 165, foco: 0.75, cInf: 9, ini: c([-1.62, 1.5, -0.78], [-1.5, 1.35, 0.3], 40), fin: c([-1.6, 1.48, -0.7], [-1.5, 1.35, 0.3], 40),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO }); m.aliento(f, fw(165)); } },
  // 32 · El suyo no.
  { w: 173, foco: 1.2, cInf: 9, ini: c([-0.75, 1.95, 1.95], [-1.5, 1.22, 0.55], 44), fin: c([-0.77, 1.92, 1.87], [-1.5, 1.22, 0.55], 42),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, mirarX: -0.3 }); m.empanado(0.36); } },
  // 33 · El niño pone la mano en el vidrio.
  { w: 176, foco: 0.85, cInf: 9, ini: c([-1.55, 1.4, -0.8], [-1.48, 1.3, 0.3], 50), fin: c([-1.55, 1.4, -0.72], [-1.48, 1.3, 0.3], 48),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); const a = suave(fw(178), fw(180), f); m.ver("nino", NINO_POS, { ...QUIETO, brazoDer: [lerp(0.08, 2.35, a), lerp(-0.04, 0.4, a)] }); m.empanado(0.34); } },
  // 34 · «Por favor. Mi mamá está sola allá afuera».
  { w: 184, foco: 1.25, cInf: 9, ini: c([-1.15, 1.45, -1.0], [-1.5, 1.25, 0.32], 48), fin: c([-1.2, 1.43, -0.92], [-1.5, 1.25, 0.32], 46),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, cejasMiedo: 0.75, cejasAlto: 0.3, brazoDer: [2.35, 0.4], boca: "abierta", bocaAbre: habla(f, 184, 191) }); m.empanado(0.32); } },
  // 35 · ¿Le abres la puerta...
  { w: 192, foco: 1.6, cInf: 9, ini: c([1.35, 1.35, -1.6], [2.14, 0.95, -0.06], 38), fin: c([1.45, 1.3, -1.4], [2.14, 0.95, -0.06], 36),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.empanado(0.32); } },
  // 36 · o lo ignoras?
  { w: 196, foco: 7, cInf: 7, ini: c([0.3, 1.8, 5.0], [-1.4, 1.25, 0], 44), fin: c([0.5, 1.9, 6.0], [-1.4, 1.25, 0], 46),
    hacer: ({ f, m }) => { m.cerrar(1); m.lejano(f); m.ver("nino", NINO_POS, { ...QUIETO, brazoDer: [2.35, 0.4] }); m.ver("tu", TU_POS, { mirarX: 0.3, cejasMiedo: 1, sudor: 1, luzX: 1 }); m.empanado(0.32); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
const CARTAS = { tu: [TU, 1.72], encargado: [ENCARGADO, 1.7], chofer: [CHOFER, 1.75], nino: [NINO, 1.42], sombra: [SOMBRA, 2.15] } as const;
type Quien = keyof typeof CARTAS;

class Mundo {
  h = crearGasolinera();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  private camPos = new THREE.Vector3();
  private luzTecho = 1;
  constructor() {
    for (const c of Object.values(this.cartas)) this.h.raiz.add(c.grupo);
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    this.h.tra.g.position.x = -200; this.h.tra.g.visible = false;
    this.h.lejano.g.visible = false; this.h.luzIntermitente.intensity = 0;
    this.h.camioneta.g.visible = this.f < fw(36);
    this.cerrar(0); this.empanado(0); this.abrir(0);
    (this.h.vaho.material as THREE.MeshBasicMaterial).opacity = 0;
    this.luzTecho = 1; this.h.luzExtra.intensity = 0;
  }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]);
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[2] * 3), ...pose });
  }
  /** 0 = abierta (letrero ABIERTO), 1 = con llave (pestillo girado, letrero CERRADO) */
  cerrar(a: number) {
    this.h.pestillo.rotation.z = a * Math.PI / 2;
    this.h.abierto.visible = a < 0.5; this.h.cerrado.visible = a >= 0.5;
  }
  /** abre la puerta hacia afuera girando sobre su bisagra (lado derecho); a = 0 cerrada … 1 abierta 80° */
  abrir(a: number) {
    const th = a * 1.4, pa = PUERTA.ancho / 2, p = this.h.puerta;
    p.rotation.y = th; p.position.set(PUERTA.x + pa - pa * Math.cos(th), 0, pa * Math.sin(th));
  }
  luz(x: number, y: number, z: number, i: number) { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; }
  empanado(op: number) { (this.h.empanado.material as THREE.MeshBasicMaterial).opacity = op; }
  /** vaho de tu aliento: bocanadas cada 1.3 s; el vidrio de la ventanilla se va empañando desde `desde` */
  aliento(f: number, desde: number) {
    const t = ((f - desde) % 39) / 39;
    (this.h.vaho.material as THREE.MeshBasicMaterial).opacity = t < 0.5 ? Math.sin(t * Math.PI * 2) * 0.55 : 0;
    this.h.vaho.position.z = -0.75 + t * 0.4;
    this.empanado(Math.min(0.38, Math.max(0, (f - desde) / 70) * 0.38));
  }
  trailer(x: number, frenado: number) {
    const t = this.h.tra; t.g.visible = true; t.g.position.x = x;
    t.calaveras.forEach((c) => ((c.material as THREE.MeshBasicMaterial).color.set(frenado > 0.5 ? "#ff3a26" : "#b0241a")));
  }
  parpadeo(f: number) {
    const a = fw(113) + 6;
    if (f < a) return;
    const n = Math.floor((f - a) / 2);
    this.luzTecho = ruido(n * 1.7 + 3) > 0.42 ? 1 : ruido(n + 9) > 0.5 ? 0.25 : 0.05;
  }
  lejano(f: number) {
    this.h.lejano.g.visible = true;
    const on = Math.floor(f / 13) % 2 === 0;
    this.h.intermitentes.forEach((m) => { m.visible = on; });
    this.h.luzIntermitente.intensity = on ? 3 : 0;
  }
  aplicar(f: number) {
    const k = this.luzTecho;
    this.h.lucesTecho.forEach((l) => { l.intensity = 3.6 * k; });
    this.h.paneles.forEach((p) => (p.material as THREE.MeshBasicMaterial).color.setRGB(0.96 * k + 0.05, 0.97 * k + 0.05, k + 0.06));
    void f;
  }
}

// ------------------------------------------------------------------ escena 3D
// Portada (miniatura de TikTok): desde dentro de la tienda, por encima de tu hombro; el niño con la mano en el
// vidrio empañado y, al fondo junto a las bombas, la sombra. Sin subtítulos; el título lo pone GasolineraPortada.
const PORTADA: Plano = { w: 176, foco: 1.7, cInf: 7, ini: c([-1.25, 1.55, -2.5], [-1.45, 1.78, 0.32], 42), fin: c([-1.25, 1.55, -2.5], [-1.45, 1.78, 0.32], 42),
  hacer: ({ f, m }) => {
    m.cerrar(1); m.lejano(f); m.empanado(0.3);
    m.ver("nino", [NINO_POS[0], NINO_POS[1] + 0.24, 0.32], { ...QUIETO, brazoDer: [2.35, 0.4] });
    m.ver("sombra", [0.4, 0, 8.6], { ojosVacios: true, ojos: 0.8, mirarX: -0.3, parpadeo: false, luzX: -1 });
  } };

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 0.72, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.18 }),
    luz: new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.06 }),
    vin: new VignetteEffect({ offset: 0.3, darkness: 0.7 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    c.addPass(new RenderPass(scene, cam)); c.addPass(fx.ink);
    c.addPass(new EffectPass(cam, fx.lens.pre)); c.addPass(new EffectPass(cam, fx.lens.main));
    c.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.sat, fx.luz, fx.vin));
    return c;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : GASO_CUADROS;
  const k = portada ? 0 : (f - a) / Math.max(1, b - a);
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 220; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0; fx.lens.main.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0;
  scene.background = new THREE.Color("#05080d");
  scene.fog = new THREE.Fog("#0c1422", 16, 85);
  mundo.f = f;
  mundo.reiniciar(cam);
  pl.hacer({ f, t: f / FPS, k, m: mundo });
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
  const reglas: [number, number, string][] = [[36, 52, "REGLA Nº 1"], [52, 68, "REGLA Nº 2"], [68, 87, "REGLA Nº 3"], [87, 93, "12:00 AM"], [93, 100, "1:00 AM"], [113, 121, "2:00 AM"], [131, 139, "3:00 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "NOCHE 1 · 10:00 PM · KM 214 · GASOLINERA";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(192) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("ABRIR", "#c8263a", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("IGNORAR", "#2f63d2", 4)}
    </div>
  );
};

export const Gasolinera: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05080d" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 220 }}>
        <ambientLight intensity={0.3} color="#7a8a9a" />
        <hemisphereLight args={["#5a6f88", "#1a120c", 0.4]} />
        <Escena />
      </ThreeCanvas>
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: 1080×1920, título arriba como en las demás portadas del canal (blanco + palabra clave en amarillo).
export const GasolineraPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 0.98, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05080d" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 220 }}>
        <ambientLight intensity={0.3} color="#7a8a9a" />
        <hemisphereLight args={["#5a6f88", "#1a120c", 0.4]} />
        <Escena portada />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 0, width: "100%", height: 760, background: "linear-gradient(#05080dee 55%, #05080d00)" }} />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        {linea("NUNCA LE ABRAS", "#ffffff", 118)}
        {linea("AL NIÑO DE LAS", "#ffffff", 124)}
        {linea("3:00 AM", "#ffd23a", 230)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
