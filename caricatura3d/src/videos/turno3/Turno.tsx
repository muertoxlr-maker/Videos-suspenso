// «El turno de las 3:00» — animación completa (82 s). Estándar visual aprobado (guía §8) + ritmo medido (§2, §3, §5).
// Cada plano empieza 2 cuadros antes de su palabra (referencias: el resaltado/acción llega ~1.6 cuadros antes).
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
import { LienzoVivo, POSE, Tarjeta, lerp, parpadea, ruido, suave } from "./comun";
import { CAMA_ABUELA, CAMA_SENOR, PAS, crearHospital } from "./hospital";
import { dibGafete, dibInhalador, dibManos, dibMonitor, dibPantallaElevador, dibPulsera, dibReceta, dibReloj, dibTimbre } from "./insertos";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const TURNO_CUADROS = Math.ceil(82.08 * FPS);
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS); // cuadro en que empieza la palabra i
const NOMBRE = "Diego Ferrer Luna";

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#dcc0a4", pelo: "#151210", ropa: "#26324a", ropaInterior: "#9aa0a6", pantalon: "#2a2d36", zapatos: "#d9d6cf", peinado: "revuelto", cuello: "capucha", insignia: { tipo: "etiqueta" }, semilla: 5 };
const ABUELA: Aspecto = { piel: "#e3c3a8", pelo: "#e4e1da", ropa: "#9db8c8", ropaInterior: "#e9eef0", pantalon: "#9db8c8", zapatos: "#cfd6d8", peinado: "rizado", cuello: "redondo", estampado: "puntos", semilla: 9 };
const TARDE: Aspecto = { piel: "#c99a78", pelo: "#5a3a24", ropa: "#4f8a78", ropaInterior: "#3c6e60", pantalon: "#4f8a78", zapatos: "#e6e3dc", peinado: "trenza", insignia: { tipo: "gafete" }, semilla: 13 };
const OTRO = (piel: string, s: number): Aspecto => ({ piel, pelo: "#1b1514", ropa: "#4f8a78", ropaInterior: "#3c6e60", pantalon: "#4f8a78", zapatos: "#e6e3dc", peinado: "recogido", insignia: { tipo: "gafete" }, semilla: s });
const SENOR: Aspecto = { piel: "#cfa88a", pelo: "#8f8f93", ropa: "#9db8c8", ropaInterior: "#e9eef0", pantalon: "#9db8c8", zapatos: "#cfd6d8", peinado: "revuelto", cuello: "redondo", estampado: "puntos", bigote: true, semilla: 21 };
const PACIENTE: Aspecto = { piel: "#b98a6a", pelo: "#3a2a20", ropa: "#9db8c8", ropaInterior: "#e9eef0", pantalon: "#9db8c8", zapatos: "#cfd6d8", peinado: "revuelto", cuello: "redondo", estampado: "puntos", semilla: 31 };
const SONRISA: Partial<Pose> = { boca: "sonrisa", ojosVacios: true, cejasAlto: 0.15 };

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; t: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; cerca?: number; luzX?: number; hacer: (c: Ctx) => void };

const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= Math.round(P[hasta].fin * FPS) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);

const PLANOS: Plano[] = [
  // 1 · Imagina que cuidas a tu abuela
  { w: 0, foco: 4.6, cInf: 8, ini: { pos: [0.7, 1.6, 2.75], mira: [-0.15, 0.95, -1.6], fov: 52 }, fin: { pos: [0.62, 1.58, 2.5], mira: [-0.15, 0.95, -1.6], fov: 52 },
    hacer: ({ f, m }) => {
      m.ver("tu", [-0.1, 0, -1.3], { mirarX: 0.6, brazoDer: [0.05, -0.6], parpadeo: false });
      m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true, mirarX: -0.3 });
      m.ver("senor", [CAMA_SENOR.x, 0, -2.2], { parpadeo: true });
      m.ver("tarde", [-0.95, 0, -0.55], { mirarX: 0.7, boca: "amable", brazoIzq: [2.4 + 0.25 * Math.sin(f * 0.5), -0.4], piernas: [0, 0] });
      m.cortina(0.45);
    } },
  // 2 · en el hospital, y a las tres en punto
  { w: 6, foco: 2.0, cInf: 6, ini: { pos: [-0.95, 1.85, -1.0], mira: [-0.95, 2.1, -3], fov: 38 }, fin: { pos: [-0.95, 1.87, -1.25], mira: [-0.95, 2.1, -3], fov: 38 },
    hacer: ({ f, m }) => { m.relojMin = f >= fw(12) - 1 ? 180 : 179; } },
  // 3 · todas las enfermeras
  { w: 15, foco: 3.4, cInf: 8, ini: { pos: [-0.4, 1.5, 1.55], mira: [-3.9, 1.25, 1.45], fov: 38 }, fin: { pos: [-0.55, 1.5, 1.55], mira: [-3.9, 1.25, 1.45], fov: 38 },
    hacer: ({ f, m }) => {
      m.ver("otra1", [-3.75, 0, 1.0], { vista: "espalda" }); m.ver("otra2", [-3.75, 0, 1.9], { vista: "espalda" });
      m.parpadeoLuz = f % 9 < 2 || (f % 23) < 1;
    } },
  // 4 · cambian de cara.
  { w: 18, foco: 2.65, cInf: 10, ini: { pos: [-1.15, 1.3, 1.5], mira: [-3.82, 1.25, 1.5], fov: 38 }, fin: { pos: [-1.3, 1.3, 1.5], mira: [-3.82, 1.25, 1.5], fov: 38 },
    hacer: ({ f, m }) => {
      const gira = f >= fw(20) - 3;
      m.ver("otra1", [-3.82, 0, 1.5], gira ? { ...SONRISA, giro: -0.3 * (1 - suave(fw(20) - 3, fw(20) + 3, f)) } : { vista: "espalda" });
      m.parpadeoLuz = f >= fw(20) - 4 && f <= fw(20) + 1;
    } },
  // 5 · Mismo uniforme. Mismas sonrisas.
  { w: 21, foco: 4.3, cInf: 8, ini: { pos: [0.55, 1.35, 1.55], mira: [-3.8, 1.2, 1.55], fov: 40 }, fin: { pos: [0.4, 1.35, 1.55], mira: [-3.8, 1.2, 1.55], fov: 40 },
    hacer: ({ f, m }) => {
      const ladea = 0.05 * Math.sin(f * 0.12); // las tres inclinan la cabeza AL MISMO TIEMPO
      m.ver("otra1", [-3.75, 0, 0.95], { ...SONRISA, cabezaX: ladea }); m.ver("otra2", [-3.95, 0, 1.55], { ...SONRISA, cabezaX: ladea }); m.ver("otra3", [-3.75, 0, 2.15], { ...SONRISA, cabezaX: ladea });
    } },
  // 6 · Pero ninguna... es la de hace un minuto.  (reacción con la coreografía aprobada)
  { w: 25, foco: 2.7, cInf: 9, ini: { pos: [0.05, 1.22, 1.45], mira: [0.05, 1.2, -1.25], fov: 38 }, fin: { pos: [0.05, 1.22, 1.25], mira: [0.05, 1.2, -1.25], fov: 38 }, luzX: 1,
    hacer: ({ f, k, m }) => {
      const a = fw(25), mirada = suave(a + 4, a + 9, f), giro = suave(a + 10, a + 20, f), susto = suave(fw(27), fw(27) + 5, f);
      m.ver("tu", [0.05, 0, -1.25], { mirarX: -0.9 * mirada, giro: -0.5 * giro, cejasAlto: 0.3 * mirada + 0.5 * susto, cejasMiedo: susto, ojos: 1 + 0.12 * susto, pupila: 0.32 - 0.1 * susto, hombros: 0.25 * mirada + 0.4 * susto, cuerpoX: -0.03 * giro, boca: susto > 0.5 ? "dientes" : "linea", luzX: 1 });
      void k;
    } },
  // 7 · Tu abuela te aprieta la mano:
  { w: 33, foco: 1.4, cInf: 0, ini: { pos: [40, 1, 1.45], mira: [40, 1, 0], fov: 35 }, fin: { pos: [40, 1, 1.3], mira: [40, 1, 0], fov: 35 },
    hacer: ({ f, m }) => { m.insertar(0, (c, w, h) => dibManos(c, w, h, suave(fw(36), fw(36) + 8, f))); } },
  // 8 · «Ya llegó el otro turno».
  { w: 39, foco: 2.7, cInf: 9, ini: { pos: [0.95, 1.25, 0.5], mira: [0.95, 1.1, -2.2], fov: 38 }, fin: { pos: [0.95, 1.25, 0.3], mira: [0.95, 1.1, -2.2], fov: 38 }, luzX: -1,
    hacer: ({ f, m }) => { m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { mirarX: -0.5, cejasMiedo: 0.5, boca: "abierta", bocaAbre: habla(f, 39, 43), parpadeo: parpadea(f, 2) }); } },
  // 9 · Regla número uno:
  { w: 44, foco: 3.6, cInf: 9, ini: { pos: [1.25, 1.35, 2.2], mira: [0.05, 1.0, -1.25], fov: 40 }, fin: { pos: [1.15, 1.33, 2.0], mira: [0.05, 1.0, -1.25], fov: 40 }, luzX: 1,
    hacer: ({ f, m }) => { m.ver("tu", [0.05, 0, -1.25], { mirarX: -0.9, giro: -0.4, cejasMiedo: 0.4, hombros: 0.3, parpadeo: parpadea(f, 1), luzX: 1 }); m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true }); } },
  // 10 · si te llaman por tu nombre completo, no contestes.
  { w: 47, foco: 2.4, cInf: 8, ini: { pos: [-2.35, 1.45, 0.6], mira: [-4.4, 1.3, -1.0], fov: 44 }, fin: { pos: [-2.4, 1.45, 0.45], mira: [-4.4, 1.3, -1.0], fov: 44 },
    hacer: ({ f, m }) => { m.ver("otra2", [-4.05, 0, -0.35], { ...SONRISA, mirarX: -0.8, giro: -0.3, brazoIzq: [1.7 + 0.05 * Math.sin(f * 0.2), -0.3] }); } },
  // 11 · Así saben a quién llevarse.
  { w: 56, foco: 7.0, cInf: 8, ini: { pos: [-3.0, 1.5, 0.6], mira: [-3.85, 1.05, -7.0], fov: 38 }, fin: { pos: [-3.0, 1.5, 0.3], mira: [-3.85, 1.05, -7.0], fov: 38 },
    hacer: ({ f, m }) => {
      const k = suave(fw(56), fw(61), f);
      m.ver("paciente", [-4.25, 0, -7.4], { mirarX: 0.6, boca: "o", cejasAlto: 0.4 });
      m.camilla([-3.3, 0, lerp(-4.6, -6.4, k)], -0.35 * k); m.ver("otra3", [-3.3, 0, lerp(-4.6, -6.4, k) + 1.15], { vista: "espalda", brazoIzq: [0.9, -0.4], brazoDer: [0.9, -0.4], piernas: [Math.max(0, Math.sin(f * 0.45)) * 0.6, Math.max(0, -Math.sin(f * 0.45)) * 0.6] });
    } },
  // 12 · Regla número dos: el elevador solo baja.
  { w: 61, foco: 4.4, cInf: 7, ini: { pos: [-3.45, 1.6, -9.6], mira: [-3.45, 1.75, -14], fov: 44 }, fin: { pos: [-3.45, 1.6, -9.9], mira: [-3.45, 1.75, -14], fov: 44 },
    hacer: ({ m }) => { m.elevador("6", true, 1); } },
  // 13 · Nadie que entró ha vuelto a subir.
  { w: 68, foco: 4.2, cInf: 6, ini: { pos: [-3.45, 1.6, -9.8], mira: [-3.45, 1.75, -14], fov: 44 }, fin: { pos: [-3.45, 1.6, -10.05], mira: [-3.45, 1.75, -14], fov: 44 },
    hacer: ({ f, m }) => {
      const cierra = suave(fw(70), fw(70) + 12, f);
      const pisos = ["6", "5", "4", "3", "2", "1", "S"];
      const i = Math.min(pisos.length - 1, Math.max(0, Math.floor((f - fw(70) - 14) / 6)));
      m.elevador(f < fw(70) + 14 ? "6" : pisos[i], true, 1 - cierra);
    } },
  // 14 · Regla número tres:
  { w: 75, foco: 1.7, cInf: 9, ini: { pos: [-3.2, 1.35, -4.1], mira: [-4.2, 0.9, -5.4], fov: 40 }, fin: { pos: [-3.3, 1.32, -4.3], mira: [-4.2, 0.9, -5.4], fov: 40 },
    hacer: ({ f, m }) => { m.parpadeoLuz5 = f % 13 < 2; } },
  // 15 · nadie recibe medicina después de las tres.
  { w: 78, foco: 0.32, cInf: 14, ini: { pos: [-4.02, 1.15, -5.08], mira: [-4.13, 0.99, -5.35], fov: 30 }, fin: { pos: [-4.05, 1.13, -5.14], mira: [-4.13, 0.99, -5.35], fov: 30 },
    hacer: () => {} },
  // 16 · Lo que traen no está en ninguna receta.
  { w: 85, foco: 1.4, cInf: 0, ini: { pos: [43, 1, 1.45], mira: [43, 1, 0], fov: 35 }, fin: { pos: [43, 1, 1.3], mira: [43, 1, 0], fov: 35 },
    hacer: ({ f, m }) => { m.insertar(1, (c, w, h) => dibReceta(c, w, h, suave(fw(88), fw(92) + 10, f))); } },
  // 17 · A las tres y veinte,
  { w: 93, foco: 3.6, cInf: 9, ini: { pos: [1.25, 1.35, 2.2], mira: [0.05, 1.0, -1.25], fov: 40 }, fin: { pos: [1.15, 1.33, 2.0], mira: [0.05, 1.0, -1.25], fov: 40 }, luzX: 1,
    hacer: ({ f, m }) => {
      const a = fw(93), giro = suave(a + 6, a + 16, f);
      m.ver("tu", [0.05, 0, -1.25], { mirarX: -0.9 * suave(a + 1, a + 6, f), giro: -0.7 * giro, cejasMiedo: 0.5, hombros: 0.35, cuerpoX: -0.03 * giro, luzX: 1 });
      m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true });
    } },
  // 18 · una camilla pasa frente a la puerta.
  { w: 98, foco: 4.2, cInf: 8, ini: { pos: [0.6, 1.35, -0.9], mira: [-3.0, 1.0, 1.5], fov: 42 }, fin: { pos: [0.5, 1.35, -0.8], mira: [-3.0, 1.0, 1.5], fov: 42 },
    hacer: ({ f, m }) => {
      const k = suave(fw(98) - 2, fw(105) - 2, f), z = lerp(-1.8, 4.6, k);
      m.camilla([-3.4, 0, z], 0); m.ver("otra1", [-3.4, 0, z - 1.25], { ...SONRISA, mirarX: 0.9, giro: 0.5, brazoIzq: [0.9, -0.4], brazoDer: [0.9, -0.4], piernas: [Math.max(0, Math.sin(f * 0.45)) * 0.6, Math.max(0, -Math.sin(f * 0.45)) * 0.6] });
    } },
  // 19 · El señor de la cama de al lado ya no está.
  { w: 105, foco: 2.6, cInf: 8, ini: { pos: [0.4, 1.45, 0.9], mira: [-1.3, 0.8, -1.9], fov: 42 }, fin: { pos: [0.35, 1.42, 0.65], mira: [-1.3, 0.8, -1.9], fov: 42 },
    hacer: ({ f, m }) => { m.cortina(1 - suave(fw(105), fw(105) + 18, f) * 0.85); m.camaVacia = true; m.ver("tu", [0.05, 0, -1.25], { vista: "espalda", hombros: 0.4, cabezaX: 0.03 * Math.sin(f) }); } },
  // 20 · Su cama, tendida.
  { w: 116, foco: 1.4, cInf: 0, ini: { pos: [46, 1, 1.45], mira: [46, 1, 0], fov: 35 }, fin: { pos: [46, 1, 1.3], mira: [46, 1, 0], fov: 35 },
    hacer: ({ m }) => { m.insertar(2, (c, w, h) => dibPulsera(c, w, h)); } },
  // 21 · A las tres y cuarenta,
  { w: 119, foco: 1.75, cInf: 9, ini: { pos: [1.18, 1.45, -0.61], mira: [1.78, 1.45, -2.2], fov: 40 }, fin: { pos: [1.25, 1.45, -0.8], mira: [1.78, 1.45, -2.2], fov: 40 },
    hacer: ({ f, m }) => { m.spo2 = lerp(94, 88, suave(fw(119), fw(124), f)); m.ritmo = 0.4; m.camaVacia = true; } },
  // 22 · tu abuela empieza a ahogarse.
  { w: 124, foco: 2.7, cInf: 9, ini: { pos: [0.95, 1.25, 0.5], mira: [0.95, 1.1, -2.2], fov: 38 }, fin: { pos: [0.95, 1.25, 0.3], mira: [0.95, 1.1, -2.2], fov: 38 }, luzX: -1,
    hacer: ({ f, m }) => {
      const tos = Math.sin(f * 0.8) > 0.2;
      m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true, boca: tos ? "o" : "abierta", bocaAbre: 0.4, cejasMiedo: 0.8, hombros: tos ? 0.6 : 0.2, brazoIzq: [0.5, -2.4], brazoDer: [0.5, -2.4], respira: Math.sin(f * 1.6) });
      m.spo2 = 86; m.ritmo = 0.7; m.camaVacia = true;
    } },
  // 23 · Su inhalador está vacío.
  { w: 129, foco: 1.4, cInf: 0, ini: { pos: [49, 1, 1.45], mira: [49, 1, 0], fov: 35 }, fin: { pos: [49, 1, 1.32], mira: [49, 1, 0], fov: 35 },
    hacer: ({ f, m }) => { const a = fw(130); m.insertar(3, (c, w, h) => dibInhalador(c, w, h, Math.max(suave(a, a + 3, f) - suave(a + 6, a + 9, f), suave(a + 14, a + 17, f) - suave(a + 20, a + 23, f)))); } },
  // 24 · Tocas el timbre.
  { w: 133, foco: 1.4, cInf: 0, ini: { pos: [52, 1, 1.45], mira: [52, 1, 0], fov: 35 }, fin: { pos: [52, 1, 1.32], mira: [52, 1, 0], fov: 35 },
    hacer: ({ f, m }) => { const a = fw(135); const pr = suave(a - 4, a, f) - suave(a + 6, a + 10, f); m.insertar(4, (c, w, h) => dibTimbre(c, w, h, pr, f >= a ? 0.6 + 0.4 * Math.sin(f * 0.5) : 0)); } },
  // 25 · Nadie viene.
  { w: 136, foco: 3.0, cInf: 7, ini: { pos: [-0.2, 1.4, -0.6], mira: [-2.25, 1.25, 1.5], fov: 42 }, fin: { pos: [-0.3, 1.4, -0.45], mira: [-2.25, 1.25, 1.5], fov: 42 },
    hacer: ({ f, m }) => { m.puerta = 0; m.camaVacia = true; m.parpadeoLuz = f % 11 < 2; } },
  // 26 · Se abre la puerta.
  { w: 138, foco: 4.4, cInf: 7, ini: { pos: [0.4, 1.4, -1.0], mira: [-2.4, 1.15, 1.5], fov: 40 }, fin: { pos: [0.3, 1.4, -0.85], mira: [-2.4, 1.15, 1.5], fov: 40 },
    hacer: ({ f, m }) => { m.puerta = suave(fw(139), fw(139) + 14, f); m.camaVacia = true; m.ver("tarde", [-2.75, 0, 1.5], { boca: "linea", luzX: 1 }); } },
  // 27 · Es la enfermera de la tarde,
  { w: 142, foco: 3.05, cInf: 9, ini: { pos: [0.9, 1.35, -0.9], mira: [-1.55, 1.15, 0.95], fov: 38 }, fin: { pos: [0.8, 1.35, -0.8], mira: [-1.55, 1.15, 0.95], fov: 38 }, luzX: 1,
    hacer: ({ f, m }) => { m.puerta = 1; m.camaVacia = true; m.ver("tarde", [-1.55, 0, 0.95], { boca: "amable", mirarX: 0.3, parpadeo: parpadea(f, 4), luzX: 1 }); } },
  // 28 · la única que no cambió.
  { w: 148, foco: 3.1, cInf: 8, cerca: 0.3, ini: { pos: [0.9, 1.45, -1.4], mira: [-3.0, 1.25, 1.9], fov: 34 }, fin: { pos: [0.82, 1.45, -1.3], mira: [-3.0, 1.25, 1.9], fov: 34 }, luzX: 1,
    hacer: ({ f, m }) => { m.puerta = 1; m.camaVacia = true; m.ver("tarde", [-1.2, 0, -0.5], { boca: "amable", luzX: 1 }); m.ver("otra2", [-3.55, 0, 2.3], { ...SONRISA, cabezaX: 0.04 * Math.sin(f * 0.1) }); } },
  // 29 · Trae un inhalador nuevo y te sonríe.
  { w: 153, foco: 2.8, cInf: 9, ini: { pos: [0.85, 1.3, -0.75], mira: [-1.45, 1.1, 0.85], fov: 38 }, fin: { pos: [0.75, 1.3, -0.65], mira: [-1.45, 1.1, 0.85], fov: 38 }, luzX: 1,
    hacer: ({ f, m }) => { m.puerta = 1; m.camaVacia = true; m.ver("tarde", [-1.45, 0, 0.85], { boca: f >= fw(159) - 2 ? "amable" : "linea", sostiene: "inhalador", brazoDer: [0.6, -1.3], parpadeo: parpadea(f, 4), luzX: 1 }); } },
  // 30 · Pero en su gafete, escrito a mano,
  { w: 160, foco: 1.4, cInf: 0, ini: { pos: [55, 1, 1.45], mira: [55, 1, 0], fov: 35 }, fin: { pos: [55, 1, 1.25], mira: [55, 1, 0], fov: 35 },
    hacer: ({ m }) => { m.insertar(5, (c, w, h) => dibGafete(c, w, h, NOMBRE)); } },
  // 31 · está tu nombre completo.
  { w: 167, foco: 2.7, cInf: 9, ini: { pos: [0.05, 1.18, 1.45], mira: [0.05, 1.12, -1.25], fov: 38 }, fin: { pos: [0.05, 1.18, 1.25], mira: [0.05, 1.12, -1.25], fov: 38 }, luzX: 1,
    hacer: ({ f, m }) => {
      const s = suave(fw(169), fw(169) + 5, f);
      m.camaVacia = true; m.puerta = 1;
      m.ver("tu", [0.05, 0, -1.25], { mirarY: 0.6 * (1 - s), mirarX: -0.3, ojos: 1 + 0.18 * s, pupila: 0.32 - 0.13 * s, cejasAlto: 0.8 * s, cejasMiedo: s, boca: s > 0.5 ? "dientes" : "linea", hombros: 0.6 * s, agacha: 0.3 * s, sudor: s, luzX: 1 });
    } },
  // 32 · «Lo vi en el expediente, mi amor.
  { w: 171, foco: 2.6, cInf: 9, ini: { pos: [1.2, 1.3, 1.4], mira: [-0.7, 1.2, -0.4], fov: 38 }, fin: { pos: [1.1, 1.3, 1.25], mira: [-0.7, 1.2, -0.4], fov: 38 }, luzX: 1,
    hacer: ({ f, m }) => { m.puerta = 1; m.camaVacia = true; m.ver("tarde", [-0.7, 0, -0.4], { boca: "abierta", bocaAbre: habla(f, 171, 177), sostiene: "inhalador", brazoDer: [0.5, -1.2], mirarX: 0.5, parpadeo: parpadea(f, 4), luzX: 1 }); } },
  // 33 · Es para ella».
  { w: 178, foco: 3.6, cInf: 8, ini: { pos: [-1.0, 1.6, 2.7], mira: [0.2, 0.95, -1.6], fov: 50 }, fin: { pos: [-0.95, 1.58, 2.45], mira: [0.2, 0.95, -1.6], fov: 50 }, luzX: 1,
    hacer: ({ f, m }) => {
      const ext = suave(fw(178), fw(180), f);
      m.puerta = 1; m.camaVacia = true;
      m.ver("tarde", [-0.7, 0, -0.4], { boca: "abierta", bocaAbre: habla(f, 178, 180), sostiene: "inhalador", brazoDer: [0.5 + 1.0 * ext, -1.2 + 1.0 * ext], mirarX: 0.8, luzX: 1 });
      m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true, boca: "abierta", bocaAbre: 0.3, respira: Math.sin(f * 1.6) });
      m.ver("tu", [0.05, 0, -1.25], { mirarX: -0.8, cejasMiedo: 0.7, hombros: 0.5 });
    } },
  // 34 · Tu abuela respira cada vez menos,
  { w: 181, foco: 2.6, cInf: 9, ini: { pos: [0.2, 1.3, 0.3], mira: [1.25, 1.12, -2.25], fov: 40 }, fin: { pos: [0.25, 1.3, 0.1], mira: [1.25, 1.12, -2.25], fov: 40 }, luzX: -1,
    hacer: ({ f, m }) => { m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true, boca: "abierta", bocaAbre: 0.2 + 0.15 * Math.sin(f * 0.35), respira: Math.sin(f * 0.35) }); m.spo2 = lerp(84, 81, suave(fw(181), fw(187), f)); m.ritmo = 1; m.camaVacia = true; m.puerta = 1; } },
  // 35 · y el pasillo está lleno de camillas.  (por encima del hombro: nuca en el tercio izquierdo)
  { w: 187, foco: 9.5, cInf: 7, cerca: 0.3, ini: { pos: [-2.45, 1.65, 4.1], mira: [-3.8, 1.05, -12], fov: 34 }, fin: { pos: [-2.47, 1.65, 3.85], mira: [-3.8, 1.05, -12], fov: 34 }, luzX: -0.4,
    hacer: ({ f, m }) => { m.puerta = 1; m.camaVacia = true; m.filaCamillas = true; m.ver("tu", [-3.15, 0, 0.75], { vista: "espalda", hombros: 0.55, agacha: 0.3, cabezaX: (ruido(f) - 0.5) * 0.012, luzX: -0.4 }); m.elevador("6", true, 1); } },
  // 36 · ¿Dejas que le dé la medicina...
  { w: 194, foco: 4.2, cInf: 8, ini: { pos: [-1.3, 1.6, 2.75], mira: [0.25, 1.0, -1.6], fov: 50 }, fin: { pos: [-1.2, 1.58, 2.5], mira: [0.25, 1.0, -1.6], fov: 50 }, luzX: 1,
    hacer: ({ f, m }) => {
      m.puerta = 1; m.camaVacia = true;
      m.ver("tarde", [-0.7, 0, -0.4], { boca: "amable", sostiene: "inhalador", brazoDer: [1.4, -0.3], mirarX: 0.6, parpadeo: parpadea(f, 4), luzX: 1 });
      m.ver("abuela", [CAMA_ABUELA.x, 0, -2.2], { parpadeo: true, boca: "abierta", bocaAbre: 0.2, respira: Math.sin(f * 0.35) });
      m.ver("tu", [0.05, 0, -1.25], { mirarX: -0.7, cejasMiedo: 0.8, hombros: 0.5, sudor: 1, luzX: 1 });
      m.spo2 = 80; m.ritmo = 1;
    } },
  // 37 · o sacas a tu abuela del cuarto tú solo?
  { w: 200, foco: 2.7, cInf: 9, ini: { pos: [0.05, 1.22, 1.45], mira: [0.05, 1.2, -1.25], fov: 38 }, fin: { pos: [0.05, 1.22, 1.2], mira: [0.05, 1.2, -1.25], fov: 38 }, luzX: 1,
    hacer: ({ f, m }) => {
      const mira = Math.sin((f - fw(200)) * 0.09) > 0 ? -0.8 : 0.8; // mira a la enfermera, luego a la abuela
      m.puerta = 1; m.camaVacia = true;
      m.ver("tu", [0.05, 0, -1.25], { mirarX: mira, cejasMiedo: 0.85, cejasAlto: 0.4, hombros: 0.55, sudor: 1, boca: "linea", respira: Math.sin(f * 0.9) * 0.6, luzX: 1 });
    } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
type Personajes = "tu" | "abuela" | "senor" | "tarde" | "otra1" | "otra2" | "otra3" | "paciente";
class Mundo {
  h = crearHospital();
  cartas: Record<Personajes, Tarjeta> = {
    tu: new Tarjeta(TU, 1.66), abuela: new Tarjeta(ABUELA, 1.5).sinSombras(), senor: new Tarjeta(SENOR, 1.48).sinSombras(), tarde: new Tarjeta(TARDE, 1.7),
    otra1: new Tarjeta(OTRO("#d8b49a", 41), 1.72), otra2: new Tarjeta(OTRO("#b98a6a", 43), 1.68), otra3: new Tarjeta(OTRO("#e2c4a6", 47), 1.74), paciente: new Tarjeta(PACIENTE, 1.64),
  };
  insertos = [0, 1, 2, 3, 4, 5].map(() => new LienzoVivo(576, 1024));
  mallasInserto: THREE.Mesh[] = [];
  // estado del cuadro
  relojMin = 179; spo2 = 95; ritmo = 0.2; puerta = 1; camaVacia = false; filaCamillas = false; parpadeoLuz = false; parpadeoLuz5 = false;
  private camPos = new THREE.Vector3();
  constructor() {
    for (const c of Object.values(this.cartas)) this.h.raiz.add(c.grupo);
    this.insertos.forEach((l, i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5 * 1.12, 0.889 * 1.12), new THREE.MeshBasicMaterial({ map: l.tex, color: "#6f7f7a" }));
      m.position.set([40, 43, 46, 49, 52, 55][i], 1, 0); m.layers.set(NOINK); this.h.raiz.add(m); this.mallasInserto.push(m);
    });
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    this.relojMin = 179; this.spo2 = 95; this.ritmo = 0.2; this.puerta = 1; this.camaVacia = false; this.filaCamillas = false; this.parpadeoLuz = false; this.parpadeoLuz5 = false;
    this.h.camillaMovil.visible = false; this.elevador("6", true, 1);
    const despues = this.f >= inicioPlano(18); // plano 19: se corre la cortina
    this.cortina(despues ? 0.15 : 1); this.camaVacia = despues;
  }
  ver(quien: Personajes, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]); // la tarjeta mira a la cámara
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[2] * 3), ...pose });
  }
  f = 0;
  cortina(abierta: number) { this.h.cortinaPivote.scale.z = Math.max(0.12, abierta); }
  camilla(pos: V3, giro: number) { this.h.camillaMovil.visible = true; this.h.camillaMovil.position.set(...pos); this.h.camillaMovil.rotation.y = giro; }
  elevador(piso: string, flecha: boolean, abiertas: number) {
    this.h.pantallaEl.dibujar((c, w, h) => dibPantallaElevador(c, w, h, piso, flecha));
    this.h.hojasEl.forEach((m, i) => { m.position.x = (i ? 1 : -1) * (0.225 + 0.42 * abiertas); });
    this.h.camillaElev.visible = abiertas > 0.02 || piso === "6";
  }
  insertar(i: number, fn: (c: CanvasRenderingContext2D, w: number, h: number) => void) { this.insertos[i].dibujar(fn); }
  aplicar(f: number) {
    this.h.reloj.dibujar((c, w, h) => dibReloj(c, w, h, this.relojMin));
    this.h.monitor.dibujar((c, w, h) => dibMonitor(c, w, h, this.spo2, f, this.ritmo));
    this.h.bisagra.rotation.y = -1.45 * this.puerta;
    this.h.tendida.visible = this.camaVacia; this.h.senorCama.cobija.visible = !this.camaVacia;
    if (this.camaVacia) this.cartas.senor.grupo.visible = false;
    this.h.fila.visible = this.filaCamillas;
    this.h.fluorescentes.forEach((l, i) => {
      const apagada = (i === 1 && this.parpadeoLuz) || (i === 3 && this.parpadeoLuz5);
      l.luz.intensity = apagada ? 0.12 : 1.7; (l.tubo.material as THREE.MeshBasicMaterial).color.set(apagada ? "#3a4440" : "#eefcf4");
    });
  }
}

// ------------------------------------------------------------------ escena 3D
const Escena: React.FC = () => {
  const f = useCurrentFrame();
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 0.7, luminanceThreshold: 0.72, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.2 }),
    luz: new BrightnessContrastEffect({ brightness: 0.04, contrast: 0.06 }),
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
  const pl = PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : TURNO_CUADROS;
  const k = (f - a) / Math.max(1, b - a); // acercamiento lento y constante dentro del plano
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 60; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0; fx.lens.main.uniforms.get("nearScale")!.value = pl.cerca ?? 1.0;
  scene.background = new THREE.Color("#05090b");
  scene.fog = new THREE.Fog("#0b1416", 7, 26);
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

// bloques de subtítulos: hasta 3 palabras, se corta en pausas largas y en la puntuación
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
  const t = f / FPS + 1.6 / FPS; // el resaltado llega ~1.6 cuadros antes de la palabra (medido)
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
  const reglas: [number, number, string][] = [[44, 61, "REGLA Nº 1"], [61, 75, "REGLA Nº 2"], [75, 93, "REGLA Nº 3"], [93, 98, "3:20 AM"], [119, 124, "3:40 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "DÍA 1 · 2:58 AM · HOSPITAL · PISO 6";
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
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u) + (u < 1 ? -0.0 : 0); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 34px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 26 }}>
      {boton("DEJARLA", "#c8263a", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("SACARLA", "#2f63d2", 4)}
    </div>
  );
};

export const TurnoDeLas3: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05090b" }}>
      <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 60 }}>
        <ambientLight intensity={0.34} color="#6a8f8c" />
        <hemisphereLight args={["#4a6f72", "#140d0a", 0.42]} />
        <Escena />
      </ThreeCanvas>
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void PAS;
