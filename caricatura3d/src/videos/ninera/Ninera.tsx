// «La niñera» — animación completa. Mismo composer, tarjetas y capas de texto que «Velorio» y «Camión» (estándar §8
// + mejoras §8.8), con lo aprendido del video de referencia del usuario (§8.9): noche más apagada (saturación ≈ 0.32),
// empuje lento en casi todos los planos, insertos de objetos que llenan el cuadro, cuartos vacíos con la cámara casi
// quieta y tomas en primera persona con TUS brazos entrando desde abajo (plano pegado a la cámara).
// Lo nuevo: el bebé (`bebe.ts`) en la cuna, en brazos y en primera persona; el foco del pasillo que parpadea y se
// apaga; el monitor con sus lucecitas de volumen; el móvil que gira y la mecedora que se mece sola.
// Cada plano empieza 2 cuadros antes de su palabra.
import React, { useEffect, useMemo } from "react";
import * as THREE from "three";
import { AbsoluteFill, continueRender, delayRender, staticFile, useCurrentFrame } from "remotion";
import { ThreeCanvas } from "@remotion/three";
import { useFrame, useThree } from "@react-three/fiber";
import {
  BlendFunction, BloomEffect, BrightnessContrastEffect, EffectComposer, EffectPass, HueSaturationEffect, LUT3DEffect, LookupTexture, RenderPass,
  ToneMappingEffect, ToneMappingMode, VignetteEffect,
} from "postprocessing";
import { InkPass, NOINK } from "../alejandro/ink";
import { LensBlur } from "../alejandro/lensblur";
import { Aspecto, Pose } from "../prueba_pasillo/personaje";
import { Bebe, dibujarBebe, dibujarPOV } from "../prueba_pasillo/bebe";
import { LienzoVivo, POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { CUNA, FOCO_PASILLO, HOJA, MONITOR, PUERTA_CALLE, RELOJ, SILLON, crearCasa } from "./ninera";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const NINERA_CUADROS = Math.ceil(72.11 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d6ae8c", pelo: "#2a1a14", ropa: "#5e4a80", ropaInterior: "#2a2a34", pantalon: "#2a3446", zapatos: "#e8e4dc", peinado: "trenza", cuello: "capucha", estilo: "ref7", semilla: 801 };
const MAMA: Aspecto = { piel: "#c49a7a", pelo: "#2a1a14", ropa: "#7a2f3a", ropaInterior: "#e6e0d0", pantalon: "#24242a", zapatos: "#141012", peinado: "largo", prenda: "chamarra", estilo: "ref7", semilla: 803 };
const SOMBRA: Aspecto = { piel: "#14161a", pelo: "#0b0c0f", ropa: "#101216", ropaInterior: "#101216", pantalon: "#0b0c0f", zapatos: "#0b0c0f", peinado: "largo", estilo: "ref7", semilla: 805 };
const CARTAS = { tu: [TU, 1.6], mama: [MAMA, 1.66], sombra: [SOMBRA, 1.8] } as const;
type Quien = keyof typeof CARTAS;
const MANGA = TU.ropa, PIEL = TU.piel;
const LAMPARA: Partial<Pose> = { luzX: 1, borde: "#ffc98a" }; // la lámpara de la sala le pega de lado
const NOCHE: Partial<Pose> = { luzX: -1, borde: "#8fb0ff" }; // luz de luna
const DUERME: Bebe = { ojos: "dormido" };

// posiciones
const SOFA_Y = SILLON.asiento + 0.012 - 0.197 * 1.6; // la cadera de la tarjeta cae sobre el cojín
const TU_SOFA: V3 = [-1.0, SOFA_Y, SILLON.z - SILLON.fondo / 2 - 0.03];
const MAMA_REFRI: V3 = [2.75, 0, 1.75];
const MAMA_PUERTA: V3 = [PUERTA_CALLE.x + 0.62, 0, PUERTA_CALLE.z - 0.62]; // junto a la puerta, del lado donde no pasa la hoja
const SOMBRA_CUNA: V3 = [CUNA.x + CUNA.largo / 2 + 0.35, 0, CUNA.z + 0.1];
const SOMBRA_FONDO: V3 = [0.22, 0, -5.95]; // en la puerta del cuarto, más allá de la luz

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; rapido?: boolean; fuera?: boolean; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const MON = (dx: number, dy: number, dz: number): V3 => [MONITOR.x + dx, MONITOR.y + dy, MONITOR.z + dz];
const TU_CERCA = (dz: number, fov: number) => c([-1.0, 1.08, 1.3 - dz], [-1.0, 1.16, TU_SOFA[2]], fov); // de frente, en el sillón
const POV_SOFA = (dz: number): Cam => c([-1.0, 1.22, 3.12 - dz], [-0.95, 0.45, 2.5], 52); // tus ojos en el sillón mirando al bebé

const PLANOS: Plano[] = [
  // 0 · Imagina que cuidas
  { w: 0, foco: 14, cInf: 3, fuera: true, ini: c([-11.8, 1.6, 7.6], [-1, 1.45, 0.8], 46), fin: c([-10.6, 1.55, 6.7], [-1, 1.45, 0.8], 44), hacer: () => {} },
  // 1 · a un bebé de ocho meses
  { w: 5, foco: 1.05, cInf: 7, ini: c([0.38, 1.78, -7.18], [0.34, 0.55, -7.8], 38), fin: c([0.38, 1.7, -7.25], [0.34, 0.55, -7.8], 35), hacer: ({ m }) => { m.bebeCuna(DUERME); m.luz(0.5, 1.4, -7.0, 0.7, "#ffb070"); } },
  // 2 · en una casa sola, afuera del pueblo.
  { w: 9, foco: 20, cInf: 2, fuera: true, ini: c([-21, 5.2, 3.5], [4, 0.4, 0.8], 44), fin: c([-20.2, 5.0, 3.4], [4, 0.4, 0.8], 43), hacer: () => {} },
  // 3 · Tu primera noche de niñera.
  { w: 16, foco: 2.5, cInf: 7, ini: c([0.45, 1.3, 4.0], [0.0, 1.05, 1.4], 48), fin: c([0.4, 1.28, 3.7], [0.0, 1.05, 1.4], 46), hacer: ({ f, m }) => { m.ver("tu", [0.0, 0, 1.4], { ...LAMPARA, boca: "amable", mirarX: 0.2, cejasMiedo: 0.2, brazoDer: [0.35 + 0.1 * Math.sin(f * 0.2), 1.1], respira: 0.5 + 0.5 * Math.sin(f * 0.08) }); } },
  // 4 · Los papás regresan a las cuatro.
  { w: 21, foco: 2.1, cInf: 7, ini: c([-0.7, 1.35, 1.75], [-2.6, 1.12, 2.85], 48), fin: c([-0.82, 1.33, 1.85], [-2.6, 1.12, 2.85], 46), hacer: ({ f, m }) => { m.puertaCalle(0.9); m.luz(-1.6, 1.6, 2.0, 0.9); m.ver("mama", MAMA_PUERTA, { ...LAMPARA, boca: "amable", mirarX: 0.4, brazoDer: [2.4 + 0.3 * Math.sin(f * 0.5), 0.6], respira: 0.5 }); } },
  // 5 · Antes de irse, la mamá pega una hoja
  { w: 27, foco: 2.2, cInf: 7, ini: c([1.15, 1.45, 3.0], [3.1, 1.2, 1.3], 52), fin: c([1.3, 1.42, 2.85], [3.1, 1.2, 1.3], 50), hacer: ({ k, m }) => { const a = suave(0.2, 0.55, k); m.hojaPegada(k > 0.5); m.ver("mama", MAMA_REFRI, { mirarX: 0.7, mirarY: 0.1, brazoDer: [lerp(0.1, 1.55, a), lerp(0, -0.4, a)], boca: "linea" }); m.cocina(true); } },
  // 6 · en el refri:
  { w: 34, foco: 0.55, cInf: 9, ini: c([HOJA.x - 0.8, 1.34, HOJA.z + 0.04], [HOJA.x, 1.32, HOJA.z], 38), fin: c([HOJA.x - 0.7, 1.33, HOJA.z + 0.02], [HOJA.x, 1.32, HOJA.z], 37), hacer: ({ m }) => { m.hojaPegada(true); m.cocina(true); m.luz(HOJA.x - 0.6, 1.6, HOJA.z, 0.6); } },
  // 7 · «Léela dos veces».
  { w: 38, foco: 1.95, cInf: 8, rapido: true, ini: c([0.95, 1.22, 2.55], [2.75, 1.2, 1.75], 46), fin: c([1.1, 1.21, 2.5], [2.75, 1.2, 1.75], 44), hacer: ({ f, m }) => { m.hojaPegada(true); m.cocina(true); m.ver("mama", MAMA_REFRI, { mirarX: -0.5, cejasAlto: -0.3, cejasMiedo: 0.2, boca: "abierta", bocaAbre: habla(f, 38, 40), ...hablaGestos(f, 3, 0.4) }); m.luz(1.6, 1.6, 2.2, 0.7); } },
  // 8 · Regla número uno: después de medianoche,
  { w: 41, foco: 0.75, cInf: 9, ini: c([RELOJ.x + 0.05, RELOJ.y - 0.05, 0.85], [RELOJ.x, RELOJ.y, RELOJ.z], 40), fin: c([RELOJ.x + 0.04, RELOJ.y - 0.04, 0.72], [RELOJ.x, RELOJ.y, RELOJ.z], 38), hacer: ({ k, m }) => { m.cocina(true); m.reloj = lerp(179, 180, suave(0.1, 0.5, k)); m.luz(RELOJ.x, 1.8, 0.8, 0.5); } },
  // 9 · nunca cargues al bebé. Aunque llore.
  { w: 47, foco: 2.6, cInf: 7, ini: c([0.0, 1.55, -5.15], [0.45, 0.62, -7.75], 46), fin: c([0.05, 1.52, -5.45], [0.45, 0.62, -7.75], 44), hacer: ({ m }) => { m.bebeCuna(DUERME); } },
  // 10 · Regla número dos: la luz del pasillo no se apaga.
  { w: 53, foco: 4.5, cInf: 6, ini: c([0.0, 1.45, 2.4], [0, 1.35, -5], 46), fin: c([0.0, 1.45, 2.2], [0, 1.35, -5], 45), hacer: () => {} },
  // 11 · Lo que vive en esta casa no cruza la luz.
  { w: 63, foco: 5.2, cInf: 6, ini: c([0.0, 0.45, 0.4], [0, 1.15, -5.6], 46), fin: c([0.0, 0.46, 0.15], [0, 1.15, -5.6], 45), hacer: ({ f, m }) => { m.luz(0.0, 1.7, -6.3, 0.7, "#6a88c8"); m.ver("sombra", SOMBRA_FONDO, { ojosVacios: true, parpadeo: false, ojos: 0.9, respira: 0.5 + 0.5 * Math.sin(f * 0.05), hombros: 0.2 }); m.sinContacto("sombra"); } },
  // 12 · Regla número tres: si alguien canta por el monitor,
  { w: 73, foco: 0.42, cInf: 10, ini: c(MON(0.15, 0.13, 0.42), MON(0, 0.09, 0), 38), fin: c(MON(0.13, 0.12, 0.36), MON(0, 0.09, 0), 36), hacer: ({ m }) => { m.monitorNivel(0); m.luz(MONITOR.x + 0.3, 0.9, MONITOR.z + 0.4, 0.5); } },
  // 13 · no contestes. Todavía no sabe dónde estás.
  { w: 82, foco: 1.85, cInf: 8, ini: TU_CERCA(0, 46), fin: TU_CERCA(0.2, 44), hacer: ({ f, m }) => { m.ver("tu", TU_SOFA, { ...LAMPARA, sentado: 1, mirarY: 0.45, mirarX: 0.15, cejasMiedo: 0.45, boca: "linea", respira: 0.5 + 0.5 * Math.sin(f * 0.09) }); m.luz(-0.8, 1.4, 2.4, 0.5); } },
  // 14 · A las doce y media,
  { w: 89, foco: 3.0, cInf: 6, ini: c([-2.55, 1.95, 0.55], [-0.9, 0.75, 3.1], 56), fin: c([-2.45, 1.9, 0.75], [-0.9, 0.75, 3.1], 54), hacer: ({ f, m }) => { m.ver("tu", TU_SOFA, { ...LAMPARA, sentado: 1, mirarX: 0.6, mirarY: 0.1, boca: "linea", parpadeo: parpadea(f, 4), respira: 0.5 + 0.5 * Math.sin(f * 0.07) }); } },
  // 15 · la luz del pasillo parpadea...
  { w: 94, foco: 0.9, cInf: 9, ini: c([0.22, 1.5, -1.55], [FOCO_PASILLO.x, FOCO_PASILLO.y, FOCO_PASILLO.z], 44), fin: c([0.2, 1.55, -1.7], [FOCO_PASILLO.x, FOCO_PASILLO.y, FOCO_PASILLO.z], 42), hacer: () => {} },
  // 16 · y se apaga.
  { w: 99, foco: 4.5, cInf: 6, ini: c([0.0, 1.4, 1.7], [0, 1.3, -5], 46), fin: c([0.0, 1.4, 1.6], [0, 1.3, -5], 45), hacer: () => {} },
  // 17 · El bebé llora.
  { w: 102, foco: 1.75, cInf: 8, rapido: true, ini: c([0.3, 1.38, -6.15], [0.42, 0.6, -7.75], 46), fin: c([0.33, 1.32, -6.4], [0.42, 0.6, -7.75], 42), hacer: ({ f, m }) => { m.bebeCuna({ ojos: "llora", boca: 0.6 + 0.4 * Math.abs(Math.sin(f * 0.5)) }); m.luz(0.5, 1.3, -6.9, 0.5, "#ffb070"); } },
  // 18 · En su cuarto, al otro lado del pasillo.  (desde el pasillo oscuro: tú en la entrada, mirando hacia acá)
  { w: 105, foco: 1.9, cInf: 8, ini: c([0.08, 1.22, -0.95], [0.0, 1.12, 1.0], 46), fin: c([0.07, 1.21, -0.75], [0.0, 1.12, 1.0], 44), hacer: ({ f, m }) => { m.ver("tu", [0.0, 0, 1.0], { ...LAMPARA, mirarY: 0.1, ojos: 1.1, pupila: 0.22, ojeras: 0.8, cejasMiedo: 0.8, boca: "linea", hombros: 0.4, ...tiembla(f, 0.3) }); m.luz(0.1, 1.4, -0.2, 0.6, "#8fb0ff"); } },
  // 19 · Corres y lo cargas.
  { w: 113, foco: 0.75, cInf: 8, rapido: true, ini: c([0.42, 1.78, -7.0], [0.36, 0.45, -7.85], 54), fin: c([0.4, 1.62, -7.3], [0.36, 0.45, -7.85], 52), hacer: ({ f, k, m }) => { m.bebeCuna({ ojos: "llora", boca: 0.8 }); m.pov("alcanza", DUERME, "#a8a4b0", 0.45 + 0.1 * (1 - k), 1.25, 0.3, f); m.luz(0.5, 1.3, -6.9, 0.6, "#ffb070"); } },
  // 20 · Rompiste la primera regla.
  { w: 117, foco: 1.9, cInf: 8, ini: c([0.05, 1.2, -5.2], [0.3, 1.12, -7.0], 46), fin: c([0.08, 1.19, -5.35], [0.3, 1.12, -7.0], 44), hacer: ({ f, m }) => { m.ver("tu", [0.3, 0, -7.0], { ...NOCHE, bebe: DUERME, ojos: 1.08, pupila: 0.24, ojeras: 0.8, cejasMiedo: 0.7, boca: "o", sudor: 0.5, brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], ...tiembla(f, 0.25) }); m.sinCobija(); m.luz(0.2, 1.4, -6.0, 0.6, "#ffb070"); } },
  // 21 · A las dos, en la sala,
  { w: 121, foco: 3.0, cInf: 6, ini: c([-2.55, 1.75, 0.65], [-0.9, 0.8, 3.1], 54), fin: c([-2.45, 1.72, 0.85], [-0.9, 0.8, 3.1], 52), hacer: ({ f, m }) => { m.ver("tu", TU_SOFA, { ...LAMPARA, sentado: 1, bebe: DUERME, mirarY: 0.5, boca: "linea", brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], respira: 0.5 + 0.5 * Math.sin(f * 0.07) }); } },
  // 22 · suena el monitor.
  { w: 127, foco: 0.38, cInf: 10, rapido: true, ini: c(MON(0.13, 0.12, 0.38), MON(0, 0.09, 0), 36), fin: c(MON(0.11, 0.11, 0.3), MON(0, 0.09, 0), 34), hacer: ({ f, m }) => { m.monitorNivel(0.35 + 0.35 * Math.abs(Math.sin(f * 0.3))); m.luz(MONITOR.x + 0.3, 0.9, MONITOR.z + 0.4, 0.4); } },
  // 23 · Alguien le canta una canción de cuna al bebé.
  { w: 130, foco: 1.65, cInf: 8, ini: TU_CERCA(0.15, 44), fin: TU_CERCA(0.4, 42), hacer: ({ f, m }) => { m.ver("tu", TU_SOFA, { ...LAMPARA, sentado: 1, bebe: DUERME, mirarY: 0.45, mirarX: 0.2, ojos: 1.1, pupila: 0.22, ojeras: 0.8, cejasMiedo: 0.8, boca: "o", brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], ...tiembla(f, 0.25) }); m.luz(-0.8, 1.4, 2.4, 0.5); } },
  // 24 · Muy cerca de la cuna.
  { w: 139, foco: 2.6, cInf: 7, ini: c([0.0, 1.5, -5.2], [0.5, 0.85, -7.75], 46), fin: c([0.02, 1.48, -5.4], [0.5, 0.85, -7.75], 44), hacer: ({ m }) => { m.sinCobija(); m.meceSola = true; } },
  // 25 · Pero el bebé está en tus brazos.
  { w: 144, foco: 0.55, cInf: 8, ini: POV_SOFA(0), fin: POV_SOFA(0.05), hacer: ({ f, m }) => { m.pov("carga", DUERME, "#d0c0b0", 0.5, 1.5, 0.15, f); } },
  // 26 · La canción se corta.
  { w: 151, foco: 0.38, cInf: 10, ini: c(MON(0.11, 0.11, 0.3), MON(0, 0.09, 0), 34), fin: c(MON(0.1, 0.1, 0.27), MON(0, 0.09, 0), 33), hacer: ({ f, k, m }) => { m.monitorNivel(k < 0.25 ? 0.5 * Math.abs(Math.sin(f * 0.3)) : 0); m.luz(MONITOR.x + 0.3, 0.9, MONITOR.z + 0.4, 0.4); } },
  // 27 · Una voz de mujer:
  { w: 155, foco: 5, cInf: 6, ini: c([-0.85, 1.25, 3.0], [0, 1.1, -3.5], 46), fin: c([-0.8, 1.25, 2.85], [0, 1.1, -3.5], 45), hacer: () => {} },
  // 28 · «Ya tráemelo. Su cuna está lista».
  { w: 159, foco: 0.3, cInf: 10, rapido: true, ini: c(MON(0.09, 0.1, 0.27), MON(0, 0.1, 0), 30), fin: c(MON(0.07, 0.1, 0.21), MON(0, 0.1, 0), 28), hacer: ({ f, m }) => { m.monitorNivel(habla(f, 159, 164) * 0.9); m.luz(MONITOR.x + 0.3, 0.9, MONITOR.z + 0.4, 0.4); } },
  // 29 · Miras al bebé.
  { w: 165, foco: 1.6, cInf: 8, ini: TU_CERCA(0.3, 42), fin: TU_CERCA(0.45, 40), hacer: ({ f, m }) => { m.ver("tu", TU_SOFA, { ...LAMPARA, sentado: 1, bebe: { ojos: "abiertos", mirar: [0.6, -0.6] }, mirarY: 0.7, ojos: 1.08, pupila: 0.24, ojeras: 0.8, cejasMiedo: 0.6, boca: "linea", brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], ...tiembla(f, 0.2) }); m.luz(-0.8, 1.4, 2.4, 0.5); } },
  // 30 · No ha llorado desde que lo cargaste.
  { w: 168, foco: 0.55, cInf: 8, ini: POV_SOFA(0.02), fin: POV_SOFA(0.1), hacer: ({ f, m }) => { m.pov("carga", { ojos: "abiertos", mirar: [0.3, -0.5], palido: 0.2 }, "#d0c0b0", 0.5, 1.5, 0.2, f); } },
  // 31 · No parpadea.
  { w: 175, foco: 0.45, cInf: 8, ini: POV_SOFA(0.1), fin: POV_SOFA(0.12), hacer: ({ f, k, m }) => { m.pov("carga", { ojos: "fijos", palido: 0.45 }, "#c8beb4", 0.5, lerp(2.1, 2.35, k), 0.1, f); } },
  // 32 · Y está frío.
  { w: 177, foco: 0.5, cInf: 8, ini: POV_SOFA(0.08), fin: POV_SOFA(0.1), hacer: ({ f, m }) => { m.pov("toca", { ojos: "fijos", palido: 0.75 }, "#b8c0d0", 0.5, 1.6, 0.5, f); } },
  // 33 · En el monitor, la cuna cruje.
  { w: 180, foco: 2.4, cInf: 7, ini: c([-0.25, 1.45, -5.25], [1.05, 1.0, -7.6], 46), fin: c([-0.22, 1.43, -5.45], [1.05, 1.0, -7.6], 44), hacer: ({ f, m }) => { m.sinCobija(); m.meceSola = true; m.cunaCruje = 1; m.ver("sombra", SOMBRA_CUNA, { ...NOCHE, ojosVacios: true, parpadeo: false, ojos: 0.9, mirarX: -0.5, mirarY: 0.4, brazoIzq: [0.5, 0.9], respira: 0.5 + 0.5 * Math.sin(f * 0.05), hombros: 0.3 }); m.sinContacto("sombra"); m.luz(1.75, 1.7, -8.35, 1.0, "#6a88c8"); } },
  // 34 · ¿Lo regresas a su cuna...
  { w: 186, foco: 2.6, cInf: 7, ini: c([0.12, 1.25, -1.0], [-0.25, 1.1, 1.6], 46), fin: c([0.1, 1.24, -0.85], [-0.25, 1.1, 1.6], 44), hacer: ({ f, m }) => { m.ver("tu", [-0.25, 0, 1.6], { ...LAMPARA, bebe: { ojos: "fijos", palido: 0.6 }, ojos: 1.12, pupila: 0.2, ojeras: 0.8, cejasMiedo: 1, boca: "linea", sudor: 1, hombros: 0.5, brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], ...tiembla(f, 0.5) }); m.luz(-0.2, 1.4, 0.4, 0.5, "#8fb0ff"); } },
  // 35 · o sales corriendo con él?
  { w: 191, foco: 1.95, cInf: 8, rapido: true, ini: c([-0.35, 1.2, 1.95], [-2.05, 1.13, 3.0], 46), fin: c([-0.45, 1.19, 2.05], [-2.05, 1.13, 3.0], 44), hacer: ({ f, m }) => { m.ver("tu", [-2.05, 0, 3.0], { ...LAMPARA, bebe: { ojos: "fijos", palido: 0.6 }, mirarX: -0.7, ojos: 1.15, pupila: 0.18, ojeras: 0.8, cejasMiedo: 1, boca: "o", sudor: 1, hombros: 0.6, brazoIzq: [0.3, -1.25], brazoDer: [0.3, -1.25], ...tiembla(f, 0.6) }); m.luz(-1.2, 1.4, 2.2, 0.6); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };
const PARPADEA = () => [fw(94) + 4, fw(101)] as const; // el foco del pasillo titila … se apaga en «apaga»
const DOCE_Y_MEDIA = () => fw(89);

// hora del reloj de la cocina (minutos después de las 21:00)
const minutos = (f: number) => (f < fw(41) ? 0 + f / FPS * 0.2 : f < fw(89) ? 180 : f < fw(121) ? 210 : 300);

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearCasa();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  reloj: number | null = null;
  meceSola = false;
  cunaCruje = 0;
  private cam!: THREE.PerspectiveCamera;
  // el bebé acostado en la cuna (tarjeta inclinada hacia la puerta)
  private cunaLienzo = new LienzoVivo(600, 330);
  private bebeEnCuna: THREE.Mesh;
  // tus brazos en primera persona (plano pegado a la cámara)
  private povLienzo = new LienzoVivo(1080, 1080);
  private povMesh: THREE.Mesh;
  constructor() {
    for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; }
    const mB = new THREE.MeshLambertMaterial({ map: this.cunaLienzo.tex, alphaTest: 0.5, emissive: "#ffffff", emissiveMap: this.cunaLienzo.tex, emissiveIntensity: 0.15, side: THREE.DoubleSide });
    this.bebeEnCuna = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.34), mB);
    this.bebeEnCuna.position.set(CUNA.x - 0.02, CUNA.colchon + 0.1, CUNA.z); this.bebeEnCuna.rotation.x = -Math.PI / 2 + 0.55; this.bebeEnCuna.layers.set(NOINK);
    this.h.raiz.add(this.bebeEnCuna);
    const mP = new THREE.MeshBasicMaterial({ map: this.povLienzo.tex, alphaTest: 0.5, toneMapped: false }); // a 0.5 m: queda delante de todo sin quitar la prueba de profundidad
    this.povMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mP); this.povMesh.renderOrder = 999; this.povMesh.layers.set(NOINK);
    this.h.raiz.add(this.povMesh);
  }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; }
    this.h.luzExtra.intensity = 0;
    this.bebeEnCuna.visible = false; this.h.cobijaCuna.visible = true; this.h.cobijaCuna.scale.set(1, 1, 1); this.h.cobijaCuna.position.x = 0.24;
    this.povMesh.visible = false;
    this.reloj = null; this.meceSola = false; this.cunaCruje = 0;
    this.h.pCalle.hoja.rotation.y = 0;
    this.h.hoja.visible = this.f >= fw(32) + 20; // después de que la mamá la pega
    this.cocina(this.f < DOCE_Y_MEDIA());
    this.monitorNivel(0);
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z) dice hacia dónde ve la persona: si la cámara queda detrás, de espaldas */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number]) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(cp.x - pos[0], cp.z - pos[2]);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    if (pose.sentado) c.contacto.visible = false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const, bebe: undefined } : {}) });
  }
  sinContacto(q: Quien) { this.cartas[q].contacto.visible = false; }
  bebeCuna(b: Bebe) {
    this.bebeEnCuna.visible = true; this.h.cobijaCuna.visible = false; // trae su propia cobija dibujada
    this.cunaLienzo.dibujar((ctx) => dibujarBebe(ctx, 150, 170, 118, b, 1, 1));
  }
  sinCobija() { this.h.cobijaCuna.scale.set(0.6, 1, 0.7); this.h.cobijaCuna.position.x = 0.4; } // la cobija revuelta: el bebé ya no está
  pov(modo: "alcanza" | "carga" | "toca", b: Bebe, tinte: string, d: number, escala: number, tiemblaK: number, f: number) {
    const cam = this.cam, m = this.povMesh;
    this.povLienzo.dibujar((ctx, w, h) => dibujarPOV(ctx, w, h, modo, MANGA, PIEL, b, tiemblaK, f));
    (m.material as THREE.MeshBasicMaterial).color.set(tinte);
    const hF = 2 * d * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), wF = hF * (1080 / 1920);
    const lado = wF * escala;
    m.visible = true; m.scale.set(lado, lado, 1);
    const cerca = escala >= 2; // acercamiento: la cara del bebé (x 0.36, y 0.5 del lienzo) al centro del cuadro
    const dir = new THREE.Vector3(cerca ? 0.14 * lado : 0, cerca ? 0.04 * hF : -(hF / 2 - lado / 2), -d).applyQuaternion(cam.quaternion);
    m.position.copy(cam.position).add(dir); m.quaternion.copy(cam.quaternion);
  }
  monitorNivel(n: number) { this.h.leds.forEach((l, i) => { (l.material as THREE.MeshBasicMaterial).color.set(n * 5 > i + 0.2 ? ["#5ad06a", "#5ad06a", "#d8d04a", "#e8963a", "#e8463a"][i] : "#2a3a2c"); }); }
  hojaPegada(v: boolean) { this.h.hoja.visible = v; }
  cocina(on: boolean) { this.h.luzCocina.intensity = on ? 4.5 : 0; this.h.bulboCocina.visible = on; this.h.haloCocina.visible = on; }
  puertaCalle(a: number) { this.h.pCalle.hoja.rotation.y = -a; }
  luces(f: number, fuera: boolean) {
    const h = this.h;
    // foco del pasillo: titila y se apaga a las 12:30
    const [a, b] = PARPADEA();
    let on = 1;
    if (f >= a && f < b) on = ruido(Math.floor(f / 2)) > 0.45 ? (ruido(f) > 0.5 ? 1 : 0.55) : 0.05;
    if (f >= b) on = 0;
    h.luzPasillo.intensity = 4.5 * on; h.haloPasillo.visible = on > 0.3; (h.haloPasillo.material as THREE.SpriteMaterial).opacity = 0.5 * on;
    h.mBulbo.color.set(on > 0.3 ? "#ffeec0" : "#4a4238"); (h.charco.material as THREE.MeshBasicMaterial).opacity = 0.22 * on;
    // tele: cambia de brillo como cuando pasan escenas
    { const n = Math.floor(f / 18), u = suave(0, 1, (f % 18) / 18); h.luzTele.intensity = 1.4 + 0.4 * lerp(ruido(n), ruido(n + 1), u); } // cambia suave (si salta, las paredes parpadean)
    // móvil que gira despacio; la mecedora se mece sola en los planos del cuarto vacío
    h.movil.rotation.y = f * 0.012;
    h.mece.rotation.x = this.meceSola ? 0.07 * Math.sin(f * 0.11) : 0;
    h.cuna.rotation.z = this.cunaCruje ? 0.006 * Math.sin(f * 0.9) * (ruido(Math.floor(f / 6)) > 0.4 ? 1 : 0) : 0;
    // monitor: foco de encendido verde siempre
    // reloj de la cocina
    const m = this.reloj ?? minutos(f); h.manoMin.rotation.z = -(m % 60) / 60 * Math.PI * 2; h.manoHora.rotation.z = -((9 + m / 60) % 12) / 12 * Math.PI * 2;
    // luces de afuera solo cuando la cámara está afuera (si no, atraviesan los muros)
    for (const l of h.lucesFuera) l.visible = fuera;
    h.fuera.visible = fuera; // la casa por fuera, el campo y el cielo solo en los planos de afuera
    h.amb.intensity = fuera ? 0.12 : 0.22; h.hemi.intensity = fuera ? 0.2 : 0.28;
  }
}

// ------------------------------------------------------------------ acabado de la referencia 7 (§8.9)
/** LUT de color: quita saturación (≈ 0.8), enfría (menos rojo, más azul) y levanta los negros hacia un azul oscuro. */
const lutFrio = () => {
  const n = 32, d = new Float32Array(n ** 3 * 4);
  for (let bi = 0; bi < n; bi++) for (let gi = 0; gi < n; gi++) for (let ri = 0; ri < n; ri++) {
    let r = ri / (n - 1), g = gi / (n - 1), b = bi / (n - 1);
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    r = L + (r - L) * 0.6; g = L + (g - L) * 0.63; b = L + (b - L) * 0.7;
    r = r ** 0.7; g = g ** 0.7; b = b ** 0.7; // más claro en medios y sombras (la referencia mide brillo 0.22)
    r *= 0.92; g *= 0.985; b *= 1.07;
    const s = (1 - L) ** 2; r += 0.03 * s; g += 0.045 * s; b += 0.075 * s; // sombras azul oscuro (no negro puro)
    const i = (ri + gi * n + bi * n * n) * 4;
    d[i] = Math.min(1, r); d[i + 1] = Math.min(1, g); d[i + 2] = Math.min(1, b); d[i + 3] = 1;
  }
  return new LookupTexture(d, n).convertToUint8();
};
/** textura fija de manchas y polvo encima de todo (como lente sucia / película vieja); no se mueve: no parpadea */

// ------------------------------------------------------------------ escena 3D
const PORTADA: Plano = PLANOS[34];

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(190) : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.06 }),
    lut: new LUT3DEffect(lutFrio()), // color de la referencia 7 (§8.9): azul gris, apagado, negros azul oscuro
    luz: new BrightnessContrastEffect({ brightness: -0.01, contrast: 0.16 }),
    vin: new VignetteEffect({ offset: 0.28, darkness: 0.78 }),
  }), [scene, cam]);
  useEffect(() => () => fx.ink.dispose(), [fx]);
  const composer = useMemo(() => {
    const cc = new EffectComposer(gl, { multisampling: 4, frameBufferType: THREE.HalfFloatType });
    cc.addPass(new RenderPass(scene, cam)); cc.addPass(fx.ink);
    cc.addPass(new EffectPass(cam, fx.lens.pre)); cc.addPass(new EffectPass(cam, fx.lens.main));
    cc.addPass(new EffectPass(cam, fx.bloom, fx.tone, fx.lut, fx.sat, fx.luz, fx.vin));
    return cc;
  }, [gl, scene, cam, fx]);
  useEffect(() => { composer.setSize(size.width, size.height); }, [composer, size.width, size.height]);
  useFrame(() => { composer.render(); }, 1);

  const i = planoEn(f);
  const pl = portada ? PORTADA : PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : NINERA_CUADROS;
  const k0 = portada ? 1 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 320; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#05070c");
  scene.fog = pl.fuera ? new THREE.Fog("#0e1626", 30, 160) : new THREE.Fog("#141a24", 3.5, 15); // adentro: neblina azul que apaga lo lejano (referencia 7)
  mundo.f = f;
  mundo.reiniciar(cam);
  pl.hacer({ f, k: k0, m: mundo });
  mundo.luces(f, !!pl.fuera);
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
  const reglas: [number, number, string][] = [[41, 53, "REGLA Nº 1"], [53, 73, "REGLA Nº 2"], [73, 89, "REGLA Nº 3"], [89, 102, "12:30 AM"], [121, 130, "2:00 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "SÁBADO · 9:00 PM · TU PRIMERA NOCHE DE NIÑERA";
  if (f >= inicioPlano(3)) return null;
  const n = Math.round(Math.min(1, f / 24) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 28, color: "#efe3da", letterSpacing: 1 }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Botones: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(186) - 2;
  if (f < a) return null;
  const pop = (x: number) => { const u = Math.min(1, Math.max(0, x / 6)); return u <= 0 ? 0 : 1 + 0.18 * Math.sin(u * Math.PI) * (1 - u); };
  const boton = (txt: string, color: string, d: number) => (
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 30px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
      {boton("A SU CUNA", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("CORRER CON ÉL", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 320 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Ninera: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: tú con el bebé de ojos fijos, frente al pasillo oscuro.
export const NineraPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", top: 0, width: "100%", height: 760, background: "linear-gradient(#05070cee 55%, #05070c00)" }} />
      <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center" }}>
        {linea("SI CANTAN POR", "#ffffff", 104)}
        {linea("EL MONITOR,", "#ffffff", 104)}
        {linea("NO CONTESTES", "#ffd23a", 124)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
