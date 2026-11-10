// «Último vagón» — animación completa. Parte del código y los valores del estándar aprobado (guía §8) y de
// «El turno de las 3:00»: mismo composer, mismas tarjetas, cada plano empieza 2 cuadros antes de su palabra.
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
import { POSE, Tarjeta, lerp, parpadea, ruido, suave, texTexto } from "../turno3/comun";
import { ATRAS, ESTACIONES, PALANCA, crearMetro } from "./metro";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const VAGON_CUADROS = Math.ceil(77.63 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#dcc0a4", pelo: "#151210", ropa: "#2b3a52", ropaInterior: "#9aa0a6", pantalon: "#2a2d36", zapatos: "#d9d6cf", peinado: "revuelto", cuello: "capucha", semilla: 61 };
const SENORA: Aspecto = { piel: "#c9a083", pelo: "#a39d94", ropa: "#7a3f5a", ropaInterior: "#d9c7a8", pantalon: "#3c3440", zapatos: "#2a2422", peinado: "recogido", cuello: "redondo", estampado: "puntos", lentes: true, semilla: 63 };
const MAMA: Aspecto = { piel: "#d4ab8c", pelo: "#3a2418", ropa: "#3f7a4e", ropaInterior: "#e6dcc6", pantalon: "#3b3d48", zapatos: "#2a2422", peinado: "recogido", cuello: "v", semilla: 67 };
const PASAJERO = (piel: string, ropa: string, pelo: string, peinado: Aspecto["peinado"], s: number): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#cfcac0", pantalon: "#2c2f38", zapatos: "#2a2422", peinado, cuello: "redondo", semilla: s });
const INFECTADO = (piel: string, ropa: string, pelo: string, peinado: Aspecto["peinado"], s: number): Aspecto => ({ piel, pelo, ropa, ropaInterior: "#6b6a60", pantalon: "#2f3236", zapatos: "#3a3632", peinado, cuello: "redondo", semilla: s });
const MORDIDO: Partial<Pose> = { ojosVacios: true, boca: "dientes", cejasMiedo: 0, cejasAlto: -0.2, pupila: 0.12 };
const golpea = (f: number, fase: number, alto = 1): Partial<Pose> => {
  const u = Math.max(0, Math.sin(f * 0.55 + fase)), v = Math.max(0, Math.sin(f * 0.55 + fase + 2.2));
  return { brazoIzq: [2.55 * alto - 0.35 * u, 0.25 + 0.4 * u], brazoDer: [2.45 * alto - 0.35 * v, 0.3 + 0.4 * v], cuerpoX: 0.03 * Math.sin(f * 0.3 + fase), cabezaX: 0.02 * Math.sin(f * 0.55 + fase) };
};

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; t: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; cerca?: number; hacer: (c: Ctx) => void };

const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= Math.round(P[hasta].fin * FPS) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
// posiciones fijas
const TU_POS: V3 = [0.95, 0, 3.6];
const SENORA_POS: V3 = [0.5, 0, 4.45];
const MAMA_Z = 1.6; // frente a la ventana entre las dos puertas
const CENTRO: Partial<Pose> = {};

const PLANOS: Plano[] = [
  // 1 · Imagina que vas en el último metro de la noche,
  { w: 0, foco: 5.0, cInf: 8, ini: { pos: [-0.85, 1.62, 8.4], mira: [0.25, 1.15, -4], fov: 52 }, fin: { pos: [-0.8, 1.6, 7.9], mira: [0.25, 1.15, -4], fov: 52 },
    hacer: ({ f, m }) => { m.tunel(9); m.pasajeros(f); m.ver("tu", TU_POS, { mirarX: 0.5, brazoDer: [2.3, 0.5], luzX: 1 }); m.ver("senora", SENORA_POS, { mirarX: 0.3, luzX: 1 }); } },
  // 2 · y el conductor anuncia
  { w: 10, foco: 1.8, cInf: 6, ini: { pos: [0.45, 1.5, 3.1], mira: [0, 2.22, 1.4], fov: 40 }, fin: { pos: [0.42, 1.52, 2.85], mira: [0, 2.22, 1.4], fov: 40 },
    hacer: ({ m }) => { m.tunel(9); } },
  // 3 · que ya no va a abrir las puertas.
  { w: 14, foco: 2.1, cInf: 8, ini: { pos: [-0.35, 1.45, 4.7], mira: [1.4, 1.5, 3.0], fov: 40 }, fin: { pos: [-0.25, 1.45, 4.5], mira: [1.4, 1.5, 3.0], fov: 40 },
    hacer: ({ f, m }) => { m.tunel(9); m.luzPuerta = f % 16 < 9; } },
  // 4 · En ninguna estación.
  { w: 22, foco: 2.6, cInf: 9, ini: { pos: [0.1, 1.5, 6.25], mira: [0.95, 1.38, 3.6], fov: 38 }, fin: { pos: [0.15, 1.5, 6.0], mira: [0.95, 1.38, 3.6], fov: 38 },
    hacer: ({ f, m }) => { m.tunel(9); m.ver("tu", TU_POS, { mirarX: 0.85, giro: 0.4 * suave(fw(22), fw(22) + 8, f), cejasMiedo: 0.6, cejasAlto: 0.25, hombros: 0.25, brazoDer: [2.3, 0.5], luzX: 1 }); } },
  // 5 · Afuera, en el túnel,
  { w: 25, foco: 1.9, cInf: 9, ini: { pos: [0.15, 1.32, -1.75], mira: [2.5, 1.25, -0.4], fov: 40 }, fin: { pos: [0.3, 1.32, -1.7], mira: [2.5, 1.25, -0.4], fov: 40 },
    hacer: ({ f, m }) => { m.tunel(9); m.pasajeros(f); } },
  // 6 · alguien corre junto al tren.
  { w: 29, foco: 2.3, cInf: 9, ini: { pos: [0.05, 1.3, -2.55], mira: [1.98, 1.1, -0.8], fov: 38 }, fin: { pos: [0.15, 1.3, -2.4], mira: [1.98, 1.1, -0.8], fov: 38 },
    hacer: ({ f, m, k }) => {
      m.tunel(9);
      const z = lerp(-1.6, -0.2, k);
      m.ver("inf1", [1.98, -0.25, z], { ...MORDIDO, boca: "abierta", bocaAbre: 0.7, brazoIzq: [0.9 * Math.sin(f * 0.6), 0.9], brazoDer: [-0.9 * Math.sin(f * 0.6), 0.9], piernas: [Math.max(0, Math.sin(f * 0.6)) * 0.8, Math.max(0, -Math.sin(f * 0.6)) * 0.8], cabezaX: 0.03 * Math.sin(f * 1.2), luzX: -1 });
    } },
  // 7 · Una señora te aprieta el brazo:
  { w: 34, foco: 2.9, cInf: 9, ini: { pos: [-0.45, 1.5, 6.75], mira: [0.75, 1.3, 4.0], fov: 40 }, fin: { pos: [-0.4, 1.5, 6.5], mira: [0.75, 1.3, 4.0], fov: 40 },
    hacer: ({ f, m }) => {
      m.tunel(9); const a = suave(fw(37), fw(37) + 6, f);
      m.ver("tu", TU_POS, { mirarX: -0.6 * a, giro: -0.3 * a, cejasMiedo: 0.5, brazoDer: [2.3, 0.5], hombros: 0.3 * a, luzX: 1 });
      m.ver("senora", SENORA_POS, { mirarX: 0.8, cejasMiedo: 0.7, cejasAlto: 0.3, brazoIzq: [0.08, -0.04], brazoDer: [lerp(0.1, 1.2, a), lerp(-0.04, 0.5, a)], luzX: 1 });
    } },
  // 8 · «No los mires. Ya muerden».
  { w: 40, foco: 2.6, cInf: 9, ini: { pos: [-0.3, 1.47, 7.05], mira: [0.5, 1.42, 4.45], fov: 33 }, fin: { pos: [-0.28, 1.47, 6.85], mira: [0.5, 1.42, 4.45], fov: 33 },
    hacer: ({ f, m }) => { m.tunel(9); m.ver("senora", SENORA_POS, { mirarX: 0.7, cejasMiedo: 0.85, cejasAlto: 0.35, ojos: 1.1, boca: "abierta", bocaAbre: habla(f, 40, 44), brazoDer: [1.2, 0.5], luzX: 1 }); } },
  // 9 · Regla número uno:
  { w: 45, foco: 5.2, cInf: 8, ini: { pos: [0.1, 1.55, -3.2], mira: [0, 1.45, -9], fov: 42 }, fin: { pos: [0.1, 1.55, -3.6], mira: [0, 1.45, -9], fov: 42 },
    hacer: ({ f, m }) => { m.tunel(9); m.ver("pas3", [0.75, 0, -6.2], { mirarX: -0.3, brazoDer: [2.4, 0.4], luzX: -1 }); m.ver("pas2", [-0.85, 0, -4.9], { mirarX: 0.3, luzX: 1 }); void f; } },
  // 10 · las puertas entre vagones no se abren.
  { w: 48, foco: 2.0, cInf: 8, ini: { pos: [0.3, 1.42, -7.0], mira: [0, 1.38, -9], fov: 38 }, fin: { pos: [0.25, 1.42, -7.25], mira: [0, 1.38, -9], fov: 38 },
    hacer: ({ f, m }) => { m.tunel(9); m.atrasGente(f, false); } },
  // 11 · Si uno se llena, se queda así.
  { w: 55, foco: 3.2, cInf: 9, ini: { pos: [0.55, 1.55, ATRAS + 5.8], mira: [-0.2, 1.2, ATRAS + 1.0], fov: 44 }, fin: { pos: [0.5, 1.55, ATRAS + 5.5], mira: [-0.2, 1.2, ATRAS + 1.0], fov: 44 },
    hacer: ({ f, m }) => { m.tunel(9); m.atrasGente(f, true); } },
  // 12 · Regla número dos: apaga tu celular.
  { w: 62, foco: 2.6, cInf: 9, ini: { pos: [0.2, 1.45, 6.15], mira: [0.95, 1.3, 3.6], fov: 36 }, fin: { pos: [0.25, 1.45, 5.9], mira: [0.95, 1.3, 3.6], fov: 36 },
    hacer: ({ f, m }) => {
      m.tunel(9); const on = f < fw(65) + 6;
      m.ver("tu", TU_POS, { mirarX: 0.1, mirarY: 0.5, cejasMiedo: 0.4, sostiene: on ? "celularEncendido" : "celular", brazoIzq: [0.55, -1.25], brazoDer: [2.3, 0.5], luzX: 1 });
      m.celularTu(on);
    } },
  // 13 · La luz los atrae, aunque haya vidrio.
  { w: 68, foco: 2.5, cInf: 9, ini: { pos: [-0.75, 1.4, 0.1], mira: [1.45, 1.3, -2.4], fov: 40 }, fin: { pos: [-0.6, 1.4, -0.1], mira: [1.45, 1.3, -2.4], fov: 40 },
    hacer: ({ f, m }) => {
      m.tunel(2); const llega = suave(fw(71), fw(71) + 8, f);
      m.ver("pas2", [0.85, 0, -2.4], { mirarX: llega > 0.5 ? 0.9 : 0, mirarY: llega > 0.5 ? 0 : 0.5, cejasMiedo: 0.8 * llega, ojos: 1 + 0.15 * llega, boca: llega > 0.5 ? "o" : "linea", sostiene: "celularEncendido", brazoIzq: [0.55, -1.25], luzX: 1 });
      m.luzCelEn(0.85, 1.2, -2.4, 0.9);
      if (llega > 0) { m.ver("inf2", [1.72, -0.25, lerp(-1.2, -2.2, llega)], { ...MORDIDO, ...golpea(f, 0.5), luzX: -1 }); m.ver("inf3", [1.8, -0.25, lerp(-4.2, -3.0, llega)], { ...MORDIDO, ...golpea(f, 2.1), luzX: -1 }); }
    } },
  // 14 · Regla número tres: el tren no frena por nadie.
  { w: 75, foco: 7, cInf: 8, ini: { pos: [-2.0, 0.6, 18], mira: [0.1, 0.9, 0], fov: 46 }, fin: { pos: [-2.0, 0.6, 18], mira: [0.1, 0.9, 4], fov: 46 },
    hacer: ({ k, m }) => { m.tunel(0); m.tren.position.z = lerp(-30, -1, k); m.luzExterior(-1.6, 2.0, 9 + m.tren.position.z + 2.0, 7.0); } },
  // 15 · Si frena, ya no arranca.
  { w: 84, foco: 1.6, cInf: 8, ini: { pos: [0.35, 1.62, 5.35], mira: [1.33, 1.72, 3.95], fov: 34 }, fin: { pos: [0.4, 1.63, 5.1], mira: [1.33, 1.72, 3.95], fov: 34 },
    hacer: ({ m }) => { m.tunel(9); m.ver("tu", TU_POS, { mirarX: 0.9, mirarY: -0.4, cejasMiedo: 0.5, brazoDer: [2.3, 0.5], luzX: 1 }); } },
  // 16 · En la primera estación, el andén está lleno.
  { w: 89, foco: 3.4, cInf: 9, ini: { pos: [-1.2, 1.4, -0.2], mira: [3.0, 1.25, -1.2], fov: 46 }, fin: { pos: [-1.15, 1.4, -0.35], mira: [3.0, 1.25, -1.2], fov: 46 },
    hacer: ({ f, m }) => { m.estacion(1, -1 - (f - fw(89)) * 0.07); m.multitud(f, 1); } },
  // 17 · Golpean los vidrios con las manos abiertas.
  { w: 97, foco: 2.2, cInf: 9, ini: { pos: [-0.55, 1.37, -0.4], mira: [1.5, 1.35, -1.45], fov: 40 }, fin: { pos: [-0.4, 1.37, -0.55], mira: [1.5, 1.35, -1.45], fov: 40 },
    hacer: ({ f, m }) => { m.estacion(1, -1 - (f - fw(89)) * 0.07); m.multitud(f, 1); m.ver("inf2", [1.65, 0, -1.2], { ...MORDIDO, ...golpea(f, 0) }); m.ver("inf3", [1.68, 0, -2.05], { ...MORDIDO, ...golpea(f, 1.7) }); } },
  // 18 · En la segunda,
  { w: 104, foco: 6.0, cInf: 8, ini: { pos: [-1.1, 1.35, -0.75], mira: [6.8, 1.75, 1.0], fov: 40 }, fin: { pos: [-1.05, 1.35, -0.85], mira: [6.8, 1.75, 1.4], fov: 40 },
    hacer: ({ f, m }) => { m.estacion(2, 1.2 - (f - fw(104)) * 0.03); } },
  // 19 · alguien del vagón de atrás enciende su pantalla.
  { w: 107, foco: 2.7, cInf: 9, ini: { pos: [-0.45, 1.5, ATRAS + 1.3], mira: [0.8, 1.3, ATRAS - 1.8], fov: 40 }, fin: { pos: [-0.4, 1.5, ATRAS + 1.05], mira: [0.8, 1.3, ATRAS - 1.8], fov: 40 },
    hacer: ({ f, m }) => {
      m.estacion(2, -14 - (f - fw(104)) * 0.12); const on = f >= fw(112);
      m.ver("atras1", [0.85, 0, ATRAS - 1.8], { mirarY: 0.5, sostiene: on ? "celularEncendido" : "celular", brazoIzq: [0.55, -1.25], luzX: 1 });
      if (on) m.luzCelEn(0.85, 1.2, ATRAS - 1.8, 1.2);
      m.ver("atras2", [-0.8, 0, ATRAS - 4.2], { mirarX: 0.6, cejasMiedo: on ? 0.8 : 0.2, luzX: 1 }); m.ver("atras3", [0.2, 0, ATRAS - 6.5], { mirarX: 0.4, luzX: 1 });
    } },
  // 20 · Tres segundos después,
  { w: 115, foco: 2.6, cInf: 9, ini: { pos: [0.15, 1.5, 6.2], mira: [0.95, 1.4, 3.6], fov: 34 }, fin: { pos: [0.2, 1.5, 5.95], mira: [0.95, 1.4, 3.6], fov: 34 },
    hacer: ({ f, m }) => { m.tunel(4); m.ver("tu", TU_POS, { vista: "frente", mirarX: -0.9, giro: -0.6, cejasMiedo: 0.8, cejasAlto: 0.3, hombros: 0.45, respira: Math.sin(f * 0.8) * 0.5, brazoDer: [2.3, 0.5], luzX: 1 }); } },
  // 21 · su vidrio se rompe.
  { w: 118, foco: 2.4, cInf: 9, ini: { pos: [-0.55, 1.45, ATRAS + 0.6], mira: [1.3, 1.3, ATRAS - 2.5], fov: 42 }, fin: { pos: [-0.62, 1.45, ATRAS + 0.75], mira: [1.3, 1.3, ATRAS - 2.5], fov: 42 },
    hacer: ({ f, m }) => {
      m.estacion(2, -16); const roto = f >= fw(120) - 1;
      m.grieta(roto); m.parpadeoAtras = roto && f % 7 < 2;
      m.ver("atras1", [lerp(0.85, -0.2, suave(fw(120), fw(120) + 8, f)), 0, ATRAS - 1.6], { mirarX: 0.9, giro: 0.5, cejasMiedo: 1, ojos: 1.15, boca: "o", sostiene: "celularEncendido", brazoIzq: [0.55, -1.25], brazoDer: roto ? [1.6, 0.6] : [0.1, 0], hombros: 0.6, luzX: 1 });
      m.luzCelEn(0.4, 1.2, ATRAS - 1.6, 1.0);
      if (roto) { m.ver("inf4", [1.75, 0, ATRAS - 2.5], { ...MORDIDO, ...golpea(f, 0.4, 0.8), luzX: -1 }); m.ver("inf5", [2.0, 0, ATRAS - 3.4], { ...MORDIDO, ...golpea(f, 1.9), luzX: -1 }); }
    } },
  // 22 · La puerta entre vagones aguanta.
  { w: 122, foco: 2.9, cInf: 8, ini: { pos: [0.2, 1.45, -6.1], mira: [0, 1.42, -9], fov: 38 }, fin: { pos: [0.18, 1.45, -6.35], mira: [0, 1.42, -9], fov: 38 },
    hacer: ({ f, m }) => {
      m.tunel(7); m.parpadeoAtras = f % 9 < 2;
      m.ver("atras1", [0.12, 0, -10.05], { cejasMiedo: 1, ojos: 1.15, boca: "abierta", bocaAbre: 0.6 + 0.3 * Math.sin(f * 0.7), ...golpea(f, 0, 0.95), luzX: 1 });
      m.ver("atras2", [-0.25, 0, -10.5], { cejasMiedo: 1, boca: "o", ...golpea(f, 1.3, 0.9), luzX: 1 });
      m.temblor = 0.012 * Math.max(0, Math.sin(f * 0.55));
    } },
  // 23 · La siguiente estación es la tuya.
  { w: 127, foco: 1.6, cInf: 7, ini: { pos: [0.3, 1.78, 4.55], mira: [1.36, 2.04, 3.0], fov: 32 }, fin: { pos: [0.35, 1.79, 4.35], mira: [1.36, 2.04, 3.0], fov: 32 },
    hacer: ({ m }) => { m.tunel(6); } },
  // 24 · En el andén, bajo la única lámpara encendida,
  { w: 133, foco: 4.0, cInf: 9, ini: { pos: [-1.2, 1.45, 2.9], mira: [3.2, 1.5, 1.2], fov: 46 }, fin: { pos: [-1.15, 1.45, 2.75], mira: [3.2, 1.5, 1.2], fov: 46 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3 + (fw(141) - f) * 0.04); m.multitud(f, 3); m.mama(f, { mirarX: -0.6 }); } },
  // 25 · está tu mamá.
  { w: 141, foco: 2.6, cInf: 9, ini: { pos: [-0.3, 1.45, 3.0], mira: [2.5, 1.3, MAMA_Z], fov: 40 }, fin: { pos: [-0.2, 1.45, 2.9], mira: [2.5, 1.3, MAMA_Z], fov: 40 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3); m.mama(f, { mirarX: -0.7 }); } },
  // 26 · Con su suéter verde de siempre.
  { w: 144, foco: 2.6, cInf: 9, ini: { pos: [0.15, 1.4, 2.75], mira: [2.5, 1.2, MAMA_Z], fov: 30 }, fin: { pos: [0.25, 1.4, 2.7], mira: [2.5, 1.2, MAMA_Z], fov: 30 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3); m.mama(f, { mirarX: -0.7 }); } },
  // 27 · No golpea el vidrio.
  { w: 150, foco: 2.6, cInf: 9, ini: { pos: [-0.2, 1.4, 2.95], mira: [2.4, 1.25, MAMA_Z - 0.1], fov: 40 }, fin: { pos: [-0.1, 1.4, 2.85], mira: [2.4, 1.25, MAMA_Z - 0.1], fov: 40 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3); m.mama(f, { mirarX: -0.8 }); m.ver("inf2", [1.66, 0, MAMA_Z - 1.0], { ...MORDIDO, ...golpea(f, 0.3), luzX: 1 }); m.ver("inf3", [1.7, 0, MAMA_Z + 0.85], { ...MORDIDO, ...golpea(f, 2.0), luzX: -1 }); } },
  // 28 · Solo te mira y levanta la mano,
  { w: 154, foco: 2.6, cInf: 9, ini: { pos: [0.1, 1.42, 2.8], mira: [2.5, 1.35, MAMA_Z], fov: 32 }, fin: { pos: [0.2, 1.42, 2.72], mira: [2.5, 1.35, MAMA_Z], fov: 32 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3); m.mama(f, { mirarX: -0.8, mano: suave(fw(158), fw(158) + 10, f) }); } },
  // 29 · como cuando te esperaba en la escuela.
  { w: 161, foco: 2.6, cInf: 9, ini: { pos: [0.15, 1.5, 6.2], mira: [0.95, 1.4, 3.6], fov: 34 }, fin: { pos: [0.2, 1.5, 5.95], mira: [0.95, 1.4, 3.6], fov: 34 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.ver("tu", TU_POS, { mirarX: 0.9, giro: 0.5, cejasMiedo: 0.95, cejasAlto: 0.4, boca: "linea", sudor: 1, respira: Math.sin(f * 0.6) * 0.5, brazoDer: [2.3, 0.5], luzX: 1 }); } },
  // 30 · Todos a su alrededor golpean.
  { w: 168, foco: 3.4, cInf: 9, ini: { pos: [-1.2, 1.42, 2.6], mira: [3.0, 1.3, 1.9], fov: 46 }, fin: { pos: [-1.15, 1.42, 2.45], mira: [3.0, 1.3, 1.9], fov: 46 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3, true); m.mama(f, { mirarX: -0.8, mano: 1 }); } },
  // 31 · Ella no.
  { w: 173, foco: 2.6, cInf: 9, ini: { pos: [0.2, 1.42, 2.7], mira: [2.5, 1.38, MAMA_Z], fov: 28 }, fin: { pos: [0.25, 1.42, 2.65], mira: [2.5, 1.38, MAMA_Z], fov: 28 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3, true); m.mama(f, { mirarX: -0.8, mano: 1 }); } },
  // 32 · Y en su otra mano,
  { w: 175, foco: 2.6, cInf: 9, ini: { pos: [0.2, 1.42, 2.7], mira: [2.5, 1.38, MAMA_Z], fov: 30 }, fin: { pos: [0.25, 1.32, 2.62], mira: [2.5, 1.05, MAMA_Z], fov: 30 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3, true); m.mama(f, { mirarX: -0.8, mano: 1 }); } },
  // 33 · su celular está encendido.
  { w: 180, foco: 2.0, cInf: 9, ini: { pos: [0.55, 1.2, 2.45], mira: [2.45, 1.05, MAMA_Z + 0.1], fov: 24 }, fin: { pos: [0.65, 1.2, 2.38], mira: [2.45, 1.05, MAMA_Z + 0.1], fov: 24 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.multitud(f, 3, true); m.mama(f, { mirarX: -0.8, mano: 1 }); } },
  // 34 · La palanca de emergencia está junto a tu cabeza.
  { w: 184, foco: 2.4, cInf: 9, ini: { pos: [-0.25, 1.6, 6.05], mira: [1.12, 1.6, 3.8], fov: 36 }, fin: { pos: [-0.2, 1.6, 5.8], mira: [1.12, 1.6, 3.8], fov: 36 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); m.ver("tu", TU_POS, { mirarX: 0.8, mirarY: -0.5, giro: 0.4, cejasMiedo: 0.9, sudor: 1, brazoDer: [2.3, 0.5], respira: Math.sin(f * 0.7) * 0.5, luzX: 1 }); } },
  // 35 · ¿La jalas para abrirle...
  { w: 193, foco: 2.0, cInf: 9, ini: { pos: [0.2, 1.72, 5.05], mira: [1.2, 1.68, 3.85], fov: 32 }, fin: { pos: [0.25, 1.72, 4.85], mira: [1.2, 1.68, 3.85], fov: 32 },
    hacer: ({ f, m }) => { m.estacion(3, MAMA_Z - 3); const a = suave(fw(193), fw(196), f); m.ver("tu", TU_POS, { mirarX: 0.8, mirarY: -0.5, giro: 0.45, cejasMiedo: 1, sudor: 1, brazoDer: [lerp(0.2, 2.75, a), lerp(0, 0.35, a)], respira: Math.sin(f * 0.7) * 0.5, luzX: 1 }); } },
  // 36 · o dejas que el tren siga con todos a salvo?
  { w: 197, foco: 5.0, cInf: 8, ini: { pos: [-0.9, 1.65, 8.3], mira: [0.5, 1.2, 0], fov: 52 }, fin: { pos: [-0.85, 1.63, 7.9], mira: [0.5, 1.2, 0], fov: 52 },
    hacer: ({ f, m }) => {
      m.estacion(3, MAMA_Z - 3 - (f - fw(197)) * 0.05); m.multitud(f, 3, true); m.mama(f, { mirarX: -0.8, mano: 1 }); m.pasajeros(f);
      m.ver("tu", TU_POS, { mirarX: 0.8, cejasMiedo: 1, brazoDer: [2.75, 0.35], luzX: 1 }); m.ver("senora", SENORA_POS, { mirarX: 0.6, cejasMiedo: 0.9, brazoDer: [1.2, 0.5], luzX: 1 });
    } },
];
void CENTRO;
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
const CARTAS = {
  tu: [TU, 1.66], senora: [SENORA, 1.52], mama: [MAMA, 1.6],
  pas1: [PASAJERO("#b98a6a", "#5a4a3a", "#1b1514", "mono", 71), 1.7], pas2: [PASAJERO("#e0c2a6", "#6a7a8a", "#5a3a24", "trenza", 73), 1.62], pas3: [PASAJERO("#c99a78", "#3a3a3e", "#2a2420", "revuelto", 75), 1.74],
  atras1: [PASAJERO("#d8b49a", "#8a5a2a", "#1b1514", "revuelto", 77), 1.7], atras2: [PASAJERO("#b98a6a", "#4a5a4a", "#2a1a14", "rizado", 79), 1.6], atras3: [PASAJERO("#e2c4a6", "#5a3a5a", "#3a2a20", "recogido", 81), 1.66],
  inf1: [INFECTADO("#a7b0a0", "#4a4f55", "#2a2420", "revuelto", 83), 1.72], inf2: [INFECTADO("#b3b8a4", "#6a5a48", "#1b1514", "mono", 85), 1.7], inf3: [INFECTADO("#9ea898", "#3f4a5a", "#3a2a20", "rizado", 87), 1.66],
  inf4: [INFECTADO("#aab2a2", "#5a3a3a", "#1b1514", "revuelto", 89), 1.74], inf5: [INFECTADO("#a2ab9a", "#4a4a40", "#5a3a24", "recogido", 91), 1.64], inf6: [INFECTADO("#b0b6a6", "#2f3a48", "#1b1514", "trenza", 93), 1.68],
  inf7: [INFECTADO("#9aa494", "#5a5040", "#2a2420", "revuelto", 95), 1.76], inf8: [INFECTADO("#a8ae9e", "#3a4a3a", "#3a2a20", "mono", 97), 1.62],
} as const;
type Quien = keyof typeof CARTAS;

class Mundo {
  h = crearMetro();
  get tren() { return this.h.tren; }
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  texLetreros = ESTACIONES.map((n) => texTexto(n, "#c27a2c", "#ffffff", 512, 96));
  f = 0;
  luzPuerta = true; parpadeoAtras = false; temblor = 0;
  private camPos = new THREE.Vector3();
  private estN = 0;
  constructor() {
    for (const c of Object.values(this.cartas)) this.h.raiz.add(c.grupo);
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    this.h.tren.position.z = 0; this.h.anden.visible = false; this.h.muroDer.visible = true; this.h.banqueta.visible = true;
    this.luzPuerta = true; this.parpadeoAtras = false; this.temblor = 0; this.estN = 0;
    this.h.grieta.visible = false; this.h.luzCel.intensity = 0; this.h.luzCelNos.intensity = 0;
    this.h.lamparas.visible = true; this.h.luzTunel.visible = true; this.h.luzTunel.intensity = 3.0; this.h.luzTunel.distance = 6;
  }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]);
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[2] * 3), ...pose });
  }
  /** túnel que pasa a `v` m/s junto a las ventanas */
  tunel(v: number) {
    const off = -((this.f / FPS) * v % 3.5);
    this.h.lamparas.position.z = off;
    const zc = this.camPos.z, zl = Math.round((zc - off) / 3.5) * 3.5 + off;
    this.h.luzTunel.position.set(2.2, 2.0, zl - 1.5);
  }
  estacion(n: number, z: number) {
    this.estN = n;
    const a = this.h.anden; a.visible = true; a.position.z = z;
    this.h.muroDer.visible = false; this.h.banqueta.visible = false; this.h.lamparas.visible = false; this.h.luzTunel.visible = false;
    this.h.letreros.forEach((m) => { (m.material as THREE.MeshLambertMaterial).map = this.texLetreros[n - 1]; });
    const oscura = n === 3;
    this.h.lamparasA.forEach(({ tubo, halo }, i) => {
      const on = !oscura || i === 4; // en tu estación solo queda una (la de z local 3)
      (tubo.material as THREE.MeshBasicMaterial).color.set(on ? "#f2f6ff" : "#2a2e33"); halo.visible = on;
      tubo.position.x = oscura && i === 4 ? 2.5 : 3.6; halo.position.x = tubo.position.x;
    });
    const [l1, l2] = this.h.luzAnden;
    if (oscura) { l1.position.set(2.5, 3.2, 3); l1.intensity = 2.0; l1.distance = 6; l1.color.set("#fff0d0"); l2.intensity = 0; this.h.cono.visible = true; this.h.cono.position.set(2.5, 2.05, 3); }
    else { l1.position.set(3.4, 3.4, z < 0 ? 4 : -4); l2.position.set(3.4, 3.4, -10); l1.intensity = n === 2 ? 1.4 : 2.4; l2.intensity = n === 2 ? 0.8 : 2.0; l1.distance = l2.distance = 11; l1.color.set("#e8eeff"); this.h.cono.visible = false; }
    // las posiciones de la multitud son locales al andén
  }
  pasajeros(f: number) {
    this.ver("pas1", [-0.95, 0, 0.6], { mirarX: 0.3, brazoDer: [0.08, -0.04], parpadeo: parpadea(f, 5) });
    this.ver("pas2", [-0.85, 0, -2.6], { mirarX: 0.5, brazoIzq: [2.4, 0.4] });
    this.ver("pas3", [0.75, 0, -5.8], { mirarX: -0.3, brazoDer: [2.4, 0.4], luzX: -1 });
  }
  atrasGente(f: number, dentro: boolean) {
    const zs = dentro ? [ATRAS + 2.5, ATRAS + 0.6, ATRAS - 1.8] : [-11.0, -12.2, -13.6];
    this.ver("atras1", [0.2, 0, zs[0]], { mirarX: 0.2, cejasMiedo: 0.6, brazoDer: [2.4, 0.4], luzX: 1 });
    this.ver("atras2", [-0.6, 0, zs[1]], { mirarX: 0.5, cejasMiedo: 0.4, brazoIzq: [2.4, 0.4], luzX: 1 });
    this.ver("atras3", [0.7, 0, zs[2]], { mirarX: -0.4, cejasMiedo: 0.5, luzX: 1 });
    if (dentro) { this.ver("pas1", [-0.2, 0, ATRAS - 3.8], { mirarX: 0.2, cejasMiedo: 0.4 }); this.ver("pas3", [0.5, 0, ATRAS - 5.6], { mirarX: -0.2 }); }
    void f;
  }
  multitud(f: number, n: number, todos = false) {
    const z0 = this.h.anden.position.z;
    const sitios: [Quien, number, number][] = n === 1
      ? [["inf4", 1.75, 1.5], ["inf5", 1.95, 0.3], ["inf6", 1.8, -2.6], ["inf7", 2.3, -0.6], ["inf8", 2.1, 2.9], ["inf1", 2.6, -3.6]]
      : [["inf4", 1.75, 1.9], ["inf5", 1.95, 4.1], ["inf6", 2.1, 0.7], ["inf7", 2.5, 4.9], ["inf8", 2.4, 1.2], ["inf1", 2.8, 5.4]];
    sitios.forEach(([q, x, z], i) => { if (n === 1 || todos || i < 4) this.ver(q, [x, 0, z0 + z], { ...MORDIDO, ...golpea(f, i * 1.3, x > 2.2 ? 0.9 : 1), luzX: z < 3 ? 1 : -1 }); });
  }
  mama(f: number, o: { mirarX: number; mano?: number }) {
    const u = o.mano ?? 0;
    this.ver("mama", [2.5, 0, MAMA_Z], { mirarX: o.mirarX, cejasMiedo: 0.15, boca: "linea", sostiene: "celularEncendido", brazoIzq: [0.5, -2.6], brazoDer: [lerp(0.08, 2.65, u), lerp(-0.04, 0.45, u)], parpadeo: parpadea(f, 9), luzX: -1 });
    this.luzCelEn(2.4, 1.2, MAMA_Z + 0.05, 0.8);
  }
  luzCelEn(x: number, y: number, z: number, i: number) { const l = this.h.luzCel; l.position.set(x - 0.15, y + 0.1, z + 0.15 - this.h.tren.position.z); l.intensity = i * 0.4; }
  celularTu(on: boolean) { const l = this.h.luzCelNos; l.position.set(TU_POS[0] - 0.25, 1.3, TU_POS[2] + 0.3); l.intensity = on ? 0.35 : 0; }
  grieta(v: boolean) { this.h.grieta.visible = v; }
  luzExterior(x: number, y: number, z: number, i: number) { const l = this.h.luzTunel; l.visible = true; l.position.set(x, y, z); l.intensity = i; l.distance = 9; }
  aplicar(f: number) {
    const tuya = 2; // índice de San Lucio en el mapa
    this.h.mapa.dibujar((c, w, h) => {
      c.fillStyle = "#f2efe6"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#c27a2c"; c.fillRect(0, 0, w, 34); c.fillStyle = "#fff"; c.font = "bold 24px 'DejaVu Sans', sans-serif"; c.fillText("LÍNEA 3", 16, 25);
      c.strokeStyle = "#c27a2c"; c.lineWidth = 12; c.beginPath(); c.moveTo(80, 100); c.lineTo(w - 80, 100); c.stroke();
      const nombres = ["CERRO VIEJO", ...ESTACIONES, "MIRADOR"];
      nombres.forEach((n, i) => {
        const x = 80 + i * (w - 160) / (nombres.length - 1), esTuya = i === tuya + 1;
        const prende = !esTuya || Math.floor(f / 8) % 2 === 0;
        c.fillStyle = esTuya && prende ? "#e0302a" : "#ffffff"; c.strokeStyle = "#3a2a1a"; c.lineWidth = 4; c.beginPath(); c.arc(x, 100, esTuya ? 20 : 13, 0, 7); c.fill(); c.stroke();
        c.fillStyle = esTuya ? "#b01f1a" : "#3a2a1a"; c.font = `bold ${esTuya ? 26 : 20}px 'DejaVu Sans', sans-serif`; c.textAlign = "center"; c.fillText(n, x, 158);
      });
      c.textAlign = "left";
    });
    this.h.led.dibujar((c, w, h) => {
      c.fillStyle = "#120606"; c.fillRect(0, 0, w, h);
      c.fillStyle = "#ff3a26"; c.font = "bold 64px 'DejaVu Sans Mono', monospace"; c.textBaseline = "middle";
      const t = "  NO ABRIR · PUERTAS BLOQUEADAS ·", ancho = c.measureText(t).width, x = -((f * 6) % ancho);
      c.fillText(t + t + t, x, h / 2 + 2);
    });
    this.h.nos.luces.forEach((l) => { l.intensity = 1.1; });
    this.h.atras.luces.forEach((l, i) => { l.intensity = this.parpadeoAtras && i < 2 ? 0.12 : 0.9; });
    this.h.nos.g.position.x = this.temblor ? (ruido(f) - 0.5) * this.temblor : 0;
    void this.estN;
  }
}

// ------------------------------------------------------------------ escena 3D
// Portada (miniatura de TikTok): un plano propio, sin subtítulos; el título lo pone Portada.
const PORTADA: Plano = { w: 68, foco: 2.25, cInf: 5, ini: { pos: [-1.3, 1.42, 3.12], mira: [1.4, 1.32, 3.38], fov: 47 }, fin: { pos: [-1.3, 1.42, 3.12], mira: [1.4, 1.32, 3.38], fov: 47 },
  hacer: ({ f, m }) => {
    m.tunel(2);
    m.ver("tu", [0.9, 0, 3.55], { parpadeo: 0, vista: "frente", mirarX: -0.35, giro: -0.2, cejasMiedo: 1, cejasAlto: 0.4, ojos: 1.18, boca: "o", hombros: 0.5, sostiene: "celularEncendido", brazoIzq: [0.55, -1.25], brazoDer: [2.3, 0.5], luzX: 1 });
    m.celularTu(true);
    m.luzExterior(2.4, 1.7, 2.4, 3.5);
    m.ver("inf2", [1.7, 0.08, 3.2], { ...MORDIDO, ...golpea(f, 0.5), parpadeo: 0, luzX: -1 });
    m.ver("inf3", [1.75, 0.02, 2.62], { ...MORDIDO, ...golpea(f, 2.1), luzX: -1 });
    m.ver("inf4", [1.85, 0.0, 1.35], { ...MORDIDO, ...golpea(f, 1.1), luzX: -1 });
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
    sat: new HueSaturationEffect({ saturation: -0.42 }),
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : VAGON_CUADROS;
  const k = portada ? 0 : (f - a) / Math.max(1, b - a);
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 80; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0; fx.lens.main.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0;
  scene.background = new THREE.Color("#04070b");
  scene.fog = new THREE.Fog("#070c12", 9, 34);
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
  const reglas: [number, number, string][] = [[45, 62, "REGLA Nº 1"], [62, 75, "REGLA Nº 2"], [75, 89, "REGLA Nº 3"], [89, 97, "1ª ESTACIÓN"], [104, 107, "2ª ESTACIÓN"], [127, 133, "TU ESTACIÓN"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 1 · 11:47 PM · LÍNEA 3 · ÚLTIMO TREN";
  if (f >= inicioPlano(2)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(193) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("FRENAR", "#c8263a", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("SEGUIR", "#2f63d2", 4)}
    </div>
  );
};

export const UltimoVagon: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#04070b" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 80 }}>
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
export const UltimoVagonPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 0.98, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#04070b" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 80 }}>
        <ambientLight intensity={0.3} color="#7a8a9a" />
        <hemisphereLight args={["#5a6f88", "#1a120c", 0.4]} />
        <Escena portada />
      </ThreeCanvas>
      <div style={{ position: "absolute", top: 0, width: "100%", height: 760, background: "linear-gradient(#04070bee 55%, #04070b00)" }} />
      <div style={{ position: "absolute", top: 90, width: "100%", textAlign: "center" }}>
        {linea("NUNCA TE SUBAS", "#ffffff", 112)}
        {linea("AL ÚLTIMO", "#ffffff", 156)}
        {linea("VAGÓN", "#ffd23a", 240)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void PALANCA;
