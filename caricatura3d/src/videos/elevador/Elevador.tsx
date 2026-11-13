// «El elevador» — animación completa. Mismo composer, tarjetas, capas de texto y acabado aprobado (§8.9: LUT frío,
// neblina, cuartos gastados, SIN capa de puntitos encima) que «La niñera».
// Pedido del usuario: gancho con acción desde el primer cuadro → los primeros 6 s son la caída (el cable truena, la
// cabina cae por el cubo con chispas, frena de golpe, se apaga la luz) y DESPUÉS viene el «Imagina que…».
// El espejo refleja de verdad (`Reflector`): en el reflejo todos se ven de frente (el señor también: te mira), y Leo
// no aparece nunca — ni siquiera en la toma de la regla 3 (pista escondida).
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
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { BOTONERA, CAB, CAMARA, EMERGENCIA, ESPEJO, HOJA, INDICADOR, INTERFON, PISO_ALTO, crearElevador, dibujarIndicador } from "./elevador";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const ELEVADOR_CUADROS = Math.ceil(76.33 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d6ae8c", pelo: "#3a2418", ropa: "#3f6e6a", ropaInterior: "#2a2a34", pantalon: "#2a3446", zapatos: "#e8e4dc", peinado: "revuelto", cuello: "capucha", estilo: "ref7", semilla: 901 };
const LEO: Aspecto = { piel: "#dcb490", pelo: "#2a1a14", ropa: "#d29a2e", ropaInterior: "#f0e6d0", pantalon: "#3a4a6a", zapatos: "#c83a3a", peinado: "rizado", cuello: "redondo", estilo: "ref7", semilla: 903 };
const SENOR: Aspecto = { piel: "#b9b6ae", pelo: "#2a2a2e", ropa: "#6a6e74", ropaInterior: "#e8e6e0", pantalon: "#55585e", zapatos: "#141416", peinado: "recogido", cuello: "v", prenda: "uniforme", arrugas: true, estilo: "ref7", semilla: 905 };
const CARTAS = { tu: [TU, 1.62], leo: [LEO, 1.12], senor: [SENOR, 1.85] } as const;
type Quien = keyof typeof CARTAS;
const FRIA: Partial<Pose> = { luzX: -1, borde: "#c8d8ff" }; // la luz del plafón
const ROJA: Partial<Pose> = { luzX: 1, borde: "#ff5a40" }; // la luz de emergencia (arriba a la derecha)

// posiciones dentro de la cabina (el piso de la cabina es y = 0)
type V3 = [number, number, number];
const TU_P: V3 = [-0.42, 0, -0.3];
const LEO_P: V3 = [0.14, 0, -0.38];
const SENOR_P: V3 = [0.62, 0, 0.45];
const ESPERA_TU: V3 = [-0.42, 0, 1.85]; // en el pasillo del 14, esperando el elevador
const ESPERA_LEO: V3 = [0.14, 0, 1.78];
const SENOR_PASILLO: V3 = [0.02, 0, 1.75];

// ------------------------------------------------------------------ planos
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; rapido?: boolean; pozo?: boolean; pasillo?: boolean; sacude?: (f: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);

// el gancho: la cabina cae tres pisos (8.4 m) por el cubo y frena en «golpe»
const CAE = 8, FRENA = () => fw(7);
const cabY = (f: number) => {
  if (f < CAE) return 3 * PISO_ALTO;
  if (f < FRENA()) { const u = (f - CAE) / (FRENA() - CAE); return 3 * PISO_ALTO * (1 - u ** 1.7); }
  if (f < fw(150)) return Math.max(0, 0.06 * Math.sin((f - FRENA()) * 0.9) * Math.exp(-(f - FRENA()) / 6)); // rebote del freno
  const b = fw(160) - 1; // «baja otro piso»
  if (f < b) return 0;
  if (f < b + 9) return -PISO_ALTO * ((f - b) / 9) ** 1.4;
  return -PISO_ALTO + 0.05 * Math.sin((f - b - 9) * 0.9) * Math.exp(-(f - b - 9) / 5);
};
const golpeCam = (f: number, desde: number, fuerza: number, dura = 14) => (f >= desde && f < desde + dura ? fuerza * (1 - (f - desde) / dura) : 0);
const CABEZA = (q: V3, alto: number, dy = 0): V3 => [q[0], alto * 0.83 + dy, q[2]];
const TU_CARA = CABEZA(TU_P, 1.62), LEO_CARA = CABEZA(LEO_P, 1.12), SENOR_CARA = CABEZA(SENOR_P, 1.85);
const IND = (dx: number, dy: number, dz: number): V3 => [INDICADOR.x + dx, INDICADOR.y + dy, INDICADOR.z + dz];
/** de frente (desde el lado de la puerta, con la pared cortada), a `dist` de la cara */
const FRENTE = (q: V3, dist: number, dx = 0.08, dy = 0.02): V3 => [q[0] + dx, q[1] + dy, q[2] + dist];
/** por encima del hombro: detrás de ti y de Leo, mirando el espejo (el señor queda fuera del cuadro, a la derecha) */
const HOMBRO = (dz: number, fov: number, mira: V3 = [0.0, 1.5, ESPEJO.z]): Cam => c([-0.8, 1.85, 1.85 - dz], mira, fov);
/** desde el lado derecho de la cabina, junto a la pared: Leo y tú de verdad a la izquierda; en el espejo, solo tú */
const LADO = (dz: number, fov: number, mira: V3): Cam => c([0.85, 1.5, -0.2 + dz], mira, fov);
const REFLEJO_SENOR: V3 = [0.15, 1.64, ESPEJO.z], REFLEJO_TU: V3 = [0.17, 1.42, ESPEJO.z], HUECO_LEO: V3 = [0.3, 1.12, ESPEJO.z];
const ANCHA = (dz: number, fov: number): Cam => c([0.3, 1.72, 3.1 - dz], [0.12, 1.0, -0.2], fov + 3); // toda la cabina, con la pared de la puerta cortada

const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.7, cejasMiedo: 0.8, ...tiembla(f, k) });
const TRES = (m: Mundo, f: number, luz: Partial<Pose>, tu: Partial<Pose> = {}, leo: Partial<Pose> = {}, senor: Partial<Pose> = {}) => {
  m.ver("tu", TU_P, { ...luz, ...tu }); m.ver("leo", LEO_P, { ...luz, ...leo }); m.ver("senor", SENOR_P, { ...luz, ojosVacios: true, parpadeo: false, boca: "linea", ...senor });
};
const ESPEJO_ESCENA = (m: Mundo, f: number, k: number) => { // tú y Leo de espaldas frente al espejo; el señor de frente (mira la puerta)
  m.entrePisos(0.5); m.espejoVivo = true;
  m.ver("tu", TU_P, { ...ROJA, brazoIzq: [0.35, 0.1] }, [0, -1]); m.ver("leo", LEO_P, { ...ROJA, brazoDer: [0.4, 0.1] }, [0, -1]); m.ver("senor", SENOR_P, { ...ROJA, ojosVacios: true, parpadeo: false });
  m.reflejo = { tu: { ...ROJA, ...MIEDO(f, 0.3 + 0.3 * k), boca: k > 0.5 ? "o" : "linea", sudor: 0.5, brazoDer: [0.35, 0.1] }, senor: { ...ROJA, ojosVacios: true, parpadeo: false, mirarX: -0.3, mirarY: 0.05, boca: "sonrisa" } };
};

const PLANOS: Plano[] = [
  // ------------------------------------------------------------ GANCHO
  // 0 · ¡Agárrate!  (arriba de la cabina, en el cubo: el cable truena y la cabina se va hacia abajo)
  { w: 0, foco: 3.0, cInf: 6, pozo: true, sacude: (f) => golpeCam(f, 3, 0.04, 10), ini: c([1.3, 3 * PISO_ALTO + 4.3, 1.1], [0, 3 * PISO_ALTO + 2.4, 0], 54), fin: c([1.3, 3 * PISO_ALTO + 4.2, 1.1], [0, 3 * PISO_ALTO + 1.0, 0], 58), hacer: ({ f, m }) => { m.luz(1.2, 3 * PISO_ALTO + 4.6, 1.0, 2.5, "#a8c0f0"); m.cableRoto = f >= 3; m.chispasEn(f >= 3 && f < 16 ? 1 : 0.25, Math.max(cabY(f) + 2.7, 3 * PISO_ALTO + 2.0)); } },
  // 1 · El elevador cae tres pisos...  (al lado de la cabina, cayendo con ella; las lámparas del cubo pasan hacia arriba)
  { w: 1, foco: 3.5, cInf: 6, pozo: true, sacude: (f) => 0.006 + golpeCam(f, FRENA() - 3, 0.05, 10), ini: c([1.35, -1.9, 1.05], [0.0, 4.5, -0.1], 64), fin: c([1.35, -1.95, 1.05], [0.0, 2.6, -0.1], 66), hacer: ({ f, m }) => { m.cableRoto = true; m.chispasEn(0.8, cabY(f) + 0.1); m.luz(0.9, cabY(f) - 0.6, 0.9, 3.0, "#ffb070"); } },
  // 2 · y frena de golpe.  (adentro, toda la cabina: ustedes dos gritan; el señor ni se inmuta)
  { w: 6, foco: 3.0, cInf: 6, rapido: true, sacude: (f) => golpeCam(f, FRENA(), 0.08, 16), ini: ANCHA(0, 50), fin: ANCHA(0.5, 46), hacer: ({ f, m }) => { const g = f >= FRENA() && f < FRENA() + 10 ? 1 : 0; m.luzParpadea = true; TRES(m, f, FRIA, { ...MIEDO(f, 0.6), boca: "grito", brazoDer: [1.9, -0.6], brazoIzq: [0.6, 0.3], agacha: 0.2 + 0.25 * g }, { ...MIEDO(f, 0.6), boca: "grito", lagrimas: 0.6, brazoIzq: [1.5, -0.8], agacha: 0.25 * g }, { mirarX: -0.2 }); } },
  // 3 · Todo se apaga.  (la luz titila y se va: queda la rendija entre las puertas)
  { w: 10, foco: 2.6, cInf: 6, ini: ANCHA(0.4, 46), fin: ANCHA(0.8, 42), hacer: ({ f, m }) => { m.luzParpadea = true; TRES(m, f, FRIA, { ...MIEDO(f, 0.5), boca: "o", brazoDer: [1.4, -0.4], mirarY: 0.3 }, { ...MIEDO(f, 0.5), boca: "o", lagrimas: 0.4, mirarY: 0.4 }, { mirarX: -0.2 }); } },
  // ------------------------------------------------------------ IMAGINA
  // 4 · Imagina que vives en el piso catorce de un edificio viejo.  (pasillo del 14: esperan el elevador)
  { w: 13, foco: 2.6, cInf: 6, pasillo: true, ini: c([0.62, 1.38, 4.7], [-0.05, 1.12, 1.2], 46), fin: c([0.55, 1.36, 4.35], [-0.05, 1.12, 1.2], 44), hacer: ({ f, m }) => { m.aNivel("14", 0); m.ver("tu", ESPERA_TU, { mirarX: 0.25, mirarY: 0.15, boca: "linea", respira: 0.5 + 0.5 * Math.sin(f * 0.08) }, [0, -1]); m.ver("leo", ESPERA_LEO, { mirarX: -0.4, mirarY: 0.3, boca: "sonrisa", brazoIzq: [0.6, 0.4] }, [0, -1]); m.luz(0.2, 1.8, 3.2, 0.6, "#ffd8a0"); } },
  // 5 · Son las once de la noche y bajas con tu hermanito Leo  (adentro, tranquilos; el señor todavía no está)
  { w: 24, foco: 2.2, cInf: 7, ini: c([-0.05, 1.42, 2.25], [-0.12, 1.1, -0.34], 44), fin: c([-0.05, 1.4, 2.0], [-0.12, 1.08, -0.34], 42), hacer: ({ f, m }) => { m.piso = "14"; m.ver("tu", TU_P, { ...FRIA, boca: "amable", mirarX: 0.4, mirarY: 0.2, brazoDer: [0.5, 0.2] }); m.ver("leo", LEO_P, { ...FRIA, boca: "abierta", bocaAbre: 0.4 + 0.3 * Math.abs(Math.sin(f * 0.3)), mirarX: -0.5, mirarY: -0.3, ...hablaGestos(f, 4, 0.5) }); } },
  // 6 · a la farmacia.  (el indicador cuenta hacia abajo)
  { w: 31, foco: 0.85, cInf: 9, ini: c(IND(0.08, -0.3, -0.85), IND(0, 0, 0), 32), fin: c(IND(0.06, -0.28, -0.75), IND(0, 0, 0), 30), hacer: ({ k, m }) => { m.piso = String(13 - Math.min(3, Math.floor(k * 4))); } },
  // 7 · En el piso nueve  (el 9 y el ding)
  { w: 39, foco: 0.7, cInf: 10, rapido: true, ini: c(IND(-0.08, -0.22, -0.8), IND(0, 0, 0), 30), fin: c(IND(-0.06, -0.18, -0.62), IND(0, 0, 0), 28), hacer: ({ m }) => { m.piso = "9"; } },
  // 8 · se sube un señor de traje gris.  (las puertas se abren: él está en el pasillo oscuro)
  { w: 43, foco: 2.6, cInf: 7, ini: c([0.55, 1.45, -0.7], [0.02, 1.3, 1.75], 46), fin: c([0.53, 1.45, -0.6], [0.02, 1.32, 1.75], 42), hacer: ({ k, m }) => { m.piso = "9"; m.aNivel("9", suave(0.05, 0.4, k)); m.pasilloLuz = 0.45; m.ver("tu", TU_P, { ...FRIA }, [0, 1]); m.ver("leo", LEO_P, { ...FRIA }, [0, 1]); m.ver("senor", SENOR_PASILLO, { ojosVacios: true, parpadeo: false, boca: "linea", luzX: -1, borde: "#c8d8ff" }); m.luz(0.0, 1.9, 1.3, 0.6, "#c8d8ff"); } },
  // 9 · No aprieta ningún botón.  (la botonera: solo PB prendido)
  { w: 50, foco: 0.6, cInf: 10, ini: c([BOTONERA.x - 0.3, BOTONERA.y + 0.03, BOTONERA.z - 0.6], [BOTONERA.x, BOTONERA.y - 0.02, BOTONERA.z], 36), fin: c([BOTONERA.x - 0.26, BOTONERA.y, BOTONERA.z - 0.5], [BOTONERA.x, BOTONERA.y - 0.04, BOTONERA.z], 34), hacer: ({ m }) => { m.piso = "8"; m.luz(BOTONERA.x - 0.3, 1.8, 0.2, 0.5, "#e6eeff"); } },
  // 10 · En la pared, una hoja del edificio.
  { w: 54, foco: 1.25, cInf: 8, ini: c([0.3, 1.5, 0.45], [HOJA.x, HOJA.y, HOJA.z], 42), fin: c([0.15, 1.49, 0.4], [HOJA.x, HOJA.y, HOJA.z], 40), hacer: ({ m }) => { m.piso = "7"; m.luz(-0.3, 1.9, 0.4, 0.5, "#e6eeff"); } },
  // 11 · Regla número uno: si se detiene entre pisos, no grites.
  { w: 61, foco: 0.75, cInf: 10, ini: c([HOJA.x + 0.78, HOJA.y + 0.02, HOJA.z + 0.03], [HOJA.x, HOJA.y - 0.01, HOJA.z], 38), fin: c([HOJA.x + 0.7, HOJA.y + 0.01, HOJA.z + 0.02], [HOJA.x, HOJA.y - 0.01, HOJA.z], 37), hacer: ({ m }) => { m.piso = "6"; m.luz(HOJA.x + 0.5, 1.8, 0.4, 0.5, "#e6eeff"); } },
  // 12 · El ruido lo hace bajar.  (debajo de la cabina: el cubo negro hacia abajo, las lámparas se pierden)
  { w: 71, foco: 6, cInf: 5, pozo: true, ini: c([1.2, -0.5, 1.0], [0.0, -14, -0.2], 60), fin: c([1.18, -0.7, 0.98], [0.0, -14, -0.2], 58), hacer: () => {} },
  // 13 · Regla número dos: nunca cuentes en voz alta a los pasajeros.  (desde la cámara del techo)
  { w: 76, foco: 1.8, cInf: 7, ini: c([CAMARA.x + 0.08, CAMARA.y - 0.1, CAMARA.z - 0.08], [0.1, 0.7, -0.4], 70), fin: c([CAMARA.x + 0.1, CAMARA.y - 0.12, CAMARA.z - 0.12], [0.1, 0.7, -0.4], 68), hacer: ({ f, m }) => { m.piso = "5"; TRES(m, f, FRIA, { mirarX: 0.4, mirarY: -0.3 }, { mirarX: -0.3, mirarY: -0.5, respira: 0.5 + 0.5 * Math.sin(f * 0.1) }, { mirarX: -0.4, mirarY: -0.3 }); } },
  // 14 · Regla número tres: si alguien no tiene reflejo en el espejo,  (el espejo: refleja la cabina… y no a Leo)
  { w: 87, foco: 2.3, cInf: 8, ini: HOMBRO(-0.1, 40, [0.0, 1.55, ESPEJO.z]), fin: HOMBRO(0.1, 38, [0.0, 1.55, ESPEJO.z]), hacer: ({ f, m }) => { m.piso = "4"; m.espejoVivo = true; m.ver("tu", TU_P, { ...FRIA, mirarX: 0.4 }, [0, -1]); m.ver("leo", LEO_P, { ...FRIA }, [0, -1]); m.ver("senor", SENOR_P, { ...FRIA, ojosVacios: true, parpadeo: false }); m.reflejo = { tu: { ...FRIA, mirarX: 0.3, boca: "linea" }, senor: { ...FRIA, ojosVacios: true, parpadeo: false, mirarX: -0.2 } }; } },
  // 15 · no le des la espalda.  (tú, mirando de reojo al señor)
  { w: 98, foco: 1.65, cInf: 8, ini: c(FRENTE(TU_CARA, 1.75, -0.05, 0), TU_CARA, 42), fin: c(FRENTE(TU_CARA, 1.55, -0.05, 0), TU_CARA, 40), hacer: ({ f, m }) => { m.piso = "3"; m.ver("tu", TU_P, { ...FRIA, mirarX: 0.75, mirarY: 0.05, cejasMiedo: 0.5, ojeras: 0.4, boca: "linea", parpadeo: parpadea(f, 9) }); } },
  // ------------------------------------------------------------ A OSCURAS
  // 16 · Se prende la luz de emergencia.
  { w: 103, foco: 0.65, cInf: 9, ini: c([EMERGENCIA.x - 0.42, 1.85, EMERGENCIA.z - 0.4], [EMERGENCIA.x, EMERGENCIA.y - 0.06, EMERGENCIA.z], 42), fin: c([EMERGENCIA.x - 0.38, 1.9, EMERGENCIA.z - 0.36], [EMERGENCIA.x, EMERGENCIA.y - 0.06, EMERGENCIA.z], 40), hacer: () => {} },
  // 17 · Roja.  (toda la cabina en rojo)
  { w: 109, foco: 3.0, cInf: 6, ini: ANCHA(0.2, 46), fin: ANCHA(0.5, 44), hacer: ({ f, m }) => { TRES(m, f, ROJA, { ...MIEDO(f, 0.3), boca: "linea", mirarY: 0.5 }, { ...MIEDO(f, 0.3), boca: "linea", mirarY: 0.5 }, { mirarX: -0.2 }); } },
  // 18 · Leo te jala la manga:  (Leo levanta la mano hacia ti)
  { w: 110, foco: 1.75, cInf: 8, ini: c([-0.05, 1.05, 1.45], [-0.13, 1.0, -0.34], 46), fin: c([-0.05, 1.05, 1.3], [-0.13, 1.0, -0.34], 44), hacer: ({ f, k, m }) => { m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.3), mirarX: 0.4, mirarY: 0.5, boca: "linea" }); m.ver("leo", LEO_P, { ...ROJA, ...MIEDO(f, 0.3), mirarX: -0.6, mirarY: -0.6, boca: "linea", brazoDer: [lerp(0.4, 2.2, suave(0, 0.3, k)) + 0.08 * Math.sin(f * 0.8), -0.5] }); } },
  // 19 · «¿Por qué el señor no respira?»  (Leo de cerca, en voz baja)
  { w: 115, foco: 1.25, cInf: 9, ini: c(FRENTE(LEO_CARA, 1.3, 0.06, 0.02), LEO_CARA, 40), fin: c(FRENTE(LEO_CARA, 1.15, 0.06, 0.02), LEO_CARA, 38), hacer: ({ f, m }) => { m.ver("leo", LEO_P, { ...ROJA, ...MIEDO(f, 0.25), mirarX: -0.5, mirarY: -0.6, boca: "abierta", bocaAbre: habla(f, 115, 120) * 0.6 }); } },
  // 20 · El señor sigue mirando la puerta.  (de espaldas, quieto frente a la puerta)
  { w: 121, foco: 1.5, cInf: 8, ini: c([-0.55, 1.55, -0.75], [0.52, 1.45, 0.9], 46), fin: c([-0.5, 1.55, -0.65], [0.52, 1.45, 0.9], 44), hacer: ({ m }) => { m.ver("senor", SENOR_P, { ...ROJA }, [0, 1]); } },
  // 21 · Quieto.  (su cara: no parpadea)
  { w: 127, foco: 1.05, cInf: 10, ini: c(FRENTE(SENOR_CARA, 1.45, -0.06, -0.02), SENOR_CARA, 36), fin: c(FRENTE(SENOR_CARA, 1.4, -0.06, -0.02), SENOR_CARA, 33), hacer: ({ m }) => { m.ver("senor", SENOR_P, { ...ROJA, ojosVacios: true, parpadeo: false, boca: "linea" }); } },
  // 22 · Diez minutos después  (desde la cámara del techo: tú en cuclillas abrazando a Leo)
  { w: 128, foco: 1.8, cInf: 7, ini: c([CAMARA.x + 0.1, CAMARA.y - 0.12, CAMARA.z - 0.12], [0.1, 0.65, -0.4], 70), fin: c([CAMARA.x + 0.12, CAMARA.y - 0.14, CAMARA.z - 0.14], [0.1, 0.65, -0.4], 68), hacer: ({ f, m }) => { TRES(m, f, ROJA, { ...MIEDO(f, 0.2), agacha: 0.55, mirarY: -0.2, brazoDer: [1.3, -0.3] }, { ...MIEDO(f, 0.2), mirarY: -0.3 }, { mirarX: -0.3, mirarY: -0.3 }); } },
  // 23 · suena el interfón:
  { w: 131, foco: 0.6, cInf: 10, rapido: true, ini: c([INTERFON.x - 0.26, INTERFON.y + 0.08, INTERFON.z - 0.62], [INTERFON.x, INTERFON.y, INTERFON.z], 36), fin: c([INTERFON.x - 0.2, INTERFON.y + 0.05, INTERFON.z - 0.48], [INTERFON.x, INTERFON.y, INTERFON.z], 34), hacer: ({ m }) => { m.interfon = true; m.luz(INTERFON.x - 0.3, 1.2, 0.3, 0.3, "#ff4a30"); } },
  // 24 · «Habla el portero.  (tú, escuchando)
  { w: 134, foco: 1.65, cInf: 8, ini: c(FRENTE(TU_CARA, 1.75, 0.15, -0.05), [TU_CARA[0], TU_CARA[1] - 0.08, TU_CARA[2]], 42), fin: c(FRENTE(TU_CARA, 1.6, 0.15, -0.05), [TU_CARA[0], TU_CARA[1] - 0.08, TU_CARA[2]], 40), hacer: ({ f, m }) => { m.interfon = true; m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.2), mirarX: 0.8, mirarY: 0.1, boca: "linea", agacha: 0.1, cuerpoX: 0.05 }); } },
  // 25 · En la cámara del elevador  (el domo de la cámara, su lucecita roja)
  { w: 137, foco: 0.6, cInf: 10, ini: c([CAMARA.x + 0.5, CAMARA.y - 0.5, CAMARA.z - 0.42], [CAMARA.x, CAMARA.y - 0.03, CAMARA.z], 38), fin: c([CAMARA.x + 0.42, CAMARA.y - 0.42, CAMARA.z - 0.35], [CAMARA.x, CAMARA.y - 0.03, CAMARA.z], 34), hacer: ({ m }) => { m.interfon = true; } },
  // 26 · solo se ven dos personas».  (tú: los ojos van de Leo al señor)
  { w: 142, foco: 1.4, cInf: 9, rapido: true, ini: c(FRENTE(TU_CARA, 1.6, -0.04, 0.02), TU_CARA, 40), fin: c(FRENTE(TU_CARA, 1.3, -0.04, 0.02), TU_CARA, 36), hacer: ({ f, k, m }) => { m.interfon = true; m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.35), mirarX: k < 0.45 ? 0.55 : 0.8, mirarY: k < 0.45 ? -0.4 : 0.2, sudor: 0.6, boca: "linea" }); } },
  // 27 · Leo empieza a contar bajito:  (señala con el dedo)
  { w: 147, foco: 1.75, cInf: 8, ini: c([0.32, 1.02, 1.45], [0.1, 0.95, -0.38], 46), fin: c([0.3, 1.0, 1.3], [0.1, 0.95, -0.38], 44), hacer: ({ f, m }) => { m.ver("leo", LEO_P, { ...ROJA, ...MIEDO(f, 0.15), mirarX: 0.5, mirarY: 0.3, boca: "linea", brazoIzq: [1.6, -0.2] }); m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.3), mirarX: 0.4, mirarY: 0.5, boca: "o" }); } },
  // 28 · «Uno... dos...».  (Leo de cerca, contando; el dedo pasa de uno a otro)
  { w: 152, foco: 1.25, cInf: 9, ini: c(FRENTE(LEO_CARA, 1.3, 0.04, 0.0), LEO_CARA, 40), fin: c(FRENTE(LEO_CARA, 1.2, 0.04, 0.0), LEO_CARA, 39), hacer: ({ f, k, m }) => { m.ver("leo", LEO_P, { ...ROJA, mirarX: k < 0.5 ? 0.6 : -0.1, mirarY: 0.2, ojos: 1.05, boca: "abierta", bocaAbre: habla(f, 152, 153) * 0.5, brazoIzq: [k < 0.5 ? 1.8 : 1.2, -0.3] }); } },
  // 29 · Le tapas la boca.  (tu mano sobre su boca)
  { w: 154, foco: 1.15, cInf: 9, rapido: true, ini: c(FRENTE(LEO_CARA, 1.25, 0.04, 0.0), LEO_CARA, 39), fin: c(FRENTE(LEO_CARA, 1.1, 0.04, 0.0), LEO_CARA, 38), hacer: ({ f, m }) => { m.ver("leo", LEO_P, { ...ROJA, ojos: 1.15, pupila: 0.2, mirarX: -0.6, mirarY: -0.5, boca: "linea", manoBoca: { piel: TU.piel, manga: TU.ropa }, ...tiembla(f, 0.3) }); } },
  // 30 · El elevador baja otro piso.  (el cubo: la cabina se hunde un piso de golpe)
  { w: 158, foco: 2.6, cInf: 7, pozo: true, sacude: (f) => golpeCam(f, fw(160) + 8, 0.05, 12), ini: c([1.6, 1.1, 1.3], [0, -0.6, 0], 58), fin: c([1.6, 1.0, 1.3], [0, -1.8, 0], 60), hacer: ({ f, m }) => { m.chispasEn(f >= fw(160) - 1 && f < fw(160) + 12 ? 0.8 : 0, cabY(f) + 0.1); } },
  // 31 · Las puertas se abren a medias.  (entre pisos: el piso del pasillo a la altura del pecho)
  { w: 163, foco: 2.2, cInf: 8, sacude: (f) => golpeCam(f, fw(166), 0.015, 8), ini: c([0.05, 1.85, -0.85], [0.0, 1.45, 0.9], 48), fin: c([0.05, 1.85, -0.72], [0.0, 1.48, 0.9], 46), hacer: ({ k, m }) => { m.entrePisos(Math.min(0.5, suave(0.15, 0.5, k) * 0.5 + (k > 0.32 && k < 0.38 ? -0.04 : 0))); m.ver("tu", TU_P, { ...ROJA }, [0, 1]); m.ver("leo", LEO_P, { ...ROJA }, [0, 1]); m.ver("senor", SENOR_P, { ...ROJA }, [0, 1]); } },
  // 32 · Miras el espejo.  (por encima del hombro: tu cara en el espejo)
  { w: 169, foco: 2.3, cInf: 8, ini: HOMBRO(0, 40), fin: HOMBRO(0.15, 38), hacer: ({ f, k, m }) => ESPEJO_ESCENA(m, f, k * 0.3) },
  // 33 · Ves al señor.  (en el reflejo, él sí te mira… y sonríe)
  { w: 172, foco: 2.6, cInf: 10, rapido: true, ini: HOMBRO(0.1, 26, REFLEJO_SENOR), fin: HOMBRO(0.2, 20, REFLEJO_SENOR), hacer: ({ f, m }) => ESPEJO_ESCENA(m, f, 0.4) },
  // 34 · Te ves a ti.
  { w: 175, foco: 2.6, cInf: 10, ini: LADO(0, 28, REFLEJO_TU), fin: LADO(0.03, 24, REFLEJO_TU), hacer: ({ f, m }) => ESPEJO_ESCENA(m, f, 0.7) },
  // 35 · Pero Leo...  (más abierto: tú y Leo de la mano, de espaldas; en el espejo, solo tú)
  { w: 179, foco: 2.2, cInf: 7, ini: c([-0.12, 1.25, 2.0], [-0.14, 1.08, -0.4], 46), fin: c([-0.12, 1.22, 1.75], [-0.14, 1.06, -0.4], 44), hacer: ({ f, m }) => { m.entrePisos(0.5); m.espejoVivo = true; m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.5), mirarX: 0.5, mirarY: 0.5, boca: "o", sudor: 0.7, brazoIzq: [0.35, 0.1] }); m.ver("leo", LEO_P, { ...ROJA, mirarX: -0.2, mirarY: -0.1, boca: "linea", parpadeo: false, brazoDer: [0.4, 0.1] }); m.reflejo = { tu: { ...ROJA, vista: "espalda" } }; } },
  // 36 · no está en el reflejo.  (el espejo: a tu lado, donde debería estar Leo, no hay nadie)
  { w: 181, foco: 2.6, cInf: 10, ini: LADO(0, 38, HUECO_LEO), fin: LADO(0.03, 32, HUECO_LEO), hacer: ({ f, m }) => ESPEJO_ESCENA(m, f, 1) },
  // 37 · Y su mano sigue en la tuya.  (Leo te mira desde abajo y sonríe; su mano en la tuya)
  { w: 186, foco: 1.6, cInf: 9, ini: c([0.05, 0.85, 1.35], [-0.08, 0.9, -0.34], 46), fin: c([0.05, 0.88, 1.15], [-0.06, 0.92, -0.34], 42), hacer: ({ f, m }) => { m.entrePisos(0.5); m.ver("leo", LEO_P, { ...ROJA, ojos: 1.05, pupila: 0.26, mirarX: -0.55, mirarY: -0.7, boca: "sonrisa", parpadeo: false, brazoDer: [0.55, 0.1] }); m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.4), brazoIzq: [0.55, 0.1], mirarY: 0.6, boca: "o" }); } },
  // 38 · ¿Te quedas en el elevador...
  { w: 193, foco: 1.6, cInf: 8, ini: c(FRENTE(TU_CARA, 1.7, 0.06, 0.0), TU_CARA, 42), fin: c(FRENTE(TU_CARA, 1.45, 0.06, 0.0), TU_CARA, 38), hacer: ({ f, m }) => { m.entrePisos(0.5); m.ver("tu", TU_P, { ...ROJA, ...MIEDO(f, 0.7), cejasMiedo: 1, boca: "o", sudor: 1, mirarX: 0.3, mirarY: 0.4 }); } },
  // 39 · o sales tú solo por la rendija?  (la rendija: el pasillo arriba, el concreto abajo)
  { w: 198, foco: 1.4, cInf: 8, rapido: true, ini: c([0.15, 1.45, -0.4], [0.0, 1.55, 0.9], 48), fin: c([0.08, 1.48, 0.1], [0.0, 1.6, 0.9], 44), hacer: ({ m }) => { m.entrePisos(0.5); m.luz(0.0, 2.0, 0.5, 0.9, "#ff4a30"); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };
const EMERG = () => fw(104) + 2; // se prende la luz roja
const APAGON = () => fw(12); // «se apaga» (en el gancho)
const STORY = () => inicioPlano(4); // desde aquí, la historia desde el principio (luz normal)

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearElevador();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  piso: string | null = null;
  espejoVivo = false;
  reflejo: Partial<Record<Quien, Partial<Pose>>> = {};
  luzParpadea = false;
  cableRoto = false;
  interfon = false;
  camSigue = 0;
  pasilloLuz = 1;
  private poses: Partial<Record<Quien, Pose>> = {};
  private cam!: THREE.PerspectiveCamera;
  constructor() {
    for (const c of Object.values(this.cartas)) { this.h.cabina.add(c.grupo); c.sombraLarga.visible = false; }
    // el espejo: antes de dibujar el reflejo, todos de frente (sí, el señor también) y Leo no está
    const esp = this.h.espejo, orig = esp.onBeforeRender;
    esp.onBeforeRender = (r, s, cam, geo, mat, grupo) => {
      if (!this.espejoVivo) return;
      (esp as unknown as { getReflectionCamera: (c: THREE.Camera) => THREE.Camera }).getReflectionCamera(cam).layers.enableAll();
      for (const q of Object.keys(this.cartas) as Quien[]) {
        const c = this.cartas[q], pr = this.reflejo[q];
        if (!c.grupo.visible) continue;
        if (q === "leo" || !pr) { c.grupo.userData.oculto = true; c.grupo.visible = false; continue; }
        c.dibujar({ ...POSE, parpadeo: parpadea(this.f, q.length * 7), vista: "frente", ...pr });
      }
      orig.call(esp, r, s, cam, geo, mat, grupo);
      for (const q of Object.keys(this.cartas) as Quien[]) {
        const c = this.cartas[q];
        if (c.grupo.userData.oculto) { c.grupo.visible = true; c.grupo.userData.oculto = false; }
        const p = this.poses[q]; if (p && c.grupo.visible) c.dibujar(p);
      }
    };
  }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; }
    this.poses = {};
    this.h.luzExtra.intensity = 0;
    this.piso = null; this.espejoVivo = false; this.reflejo = {}; this.luzParpadea = false; this.cableRoto = false; this.interfon = false; this.camSigue = 0; this.pasilloLuz = 1;
    this.h.puertas.abrir(0); this.h.puertasPiso.abrir(0); this.h.pasillo.position.y = 0; this.h.pasillo.visible = true;
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z) dice hacia dónde ve la persona: si la cámara queda detrás, de espaldas */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number]) {
    const c = this.cartas[quien], cp = this.cam.position, y0 = this.h.cabina.position.y;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(cp.x - pos[0], cp.z - pos[2]);
    void y0;
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    const p: Pose = { ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const, manoBoca: undefined } : {}) };
    this.poses[quien] = p;
    c.dibujar(p);
  }
  /** el pasillo de un piso, al nivel de la cabina; `abre` 0 … 1 las dos puertas */
  aNivel(n: string, abre: number) { this.h.pasillo.position.y = 0; this.h.puertas.abrir(abre); this.h.puertasPiso.abrir(abre); this.placa(n); }
  /** entre pisos: el piso del pasillo queda a la altura del pecho; las puertas abiertas `a` (a medias) */
  entrePisos(a: number) { this.h.pasillo.position.y = 1.2; this.h.puertas.abrir(a); this.h.puertasPiso.abrir(a); this.pasilloLuz = 0.35; }
  private placaActual = "";
  private placa(n: string) { if (n === this.placaActual) return; this.placaActual = n; this.h.placaMat.map = this.h.texPlaca(n); this.h.placaMat.needsUpdate = true; }
  chispasEn(fuerza: number, y: number) {
    const h = this.h, f = this.f;
    h.chispas.forEach((sp, i) => {
      const vivo = fuerza > 0 && ruido(i * 13 + f * 3) < fuerza;
      sp.visible = vivo; if (!vivo) return;
      const s = i % 2 ? 1 : -1, t = ((f * 0.37 + i * 0.61) % 1);
      sp.position.set(s * (CAB.x1 + 0.22) + s * t * 0.35 * ruido(i), y + 0.2 * ruido(i * 7) + t * 0.5, 0.1 * ruido(i * 3) + (ruido(i * 5) - 0.5) * 0.3 * t);
      sp.scale.setScalar(0.03 + 0.05 * (1 - t));
    });
    h.luzChispas.intensity = fuerza > 0 ? 3.5 * fuerza * (0.6 + 0.4 * ruido(f)) : 0; h.luzChispas.position.set(0.9, y + 0.2, 0.3);
  }
  luces(f: number, pl: Plano) {
    const h = this.h;
    // cabina: en el cubo se mueve; adentro siempre en y = 0
    h.cabina.position.y = pl.pozo ? cabY(f) : 0;
    h.fuera.visible = !!pl.pozo; h.pozo.visible = !!pl.pozo; if (pl.pozo) h.pasillo.visible = false;
    if (!pl.pasillo && this.cam.position.z > CAB.z1 + 0.02) h.pasillo.visible = false; // con la pared de la puerta cortada, el pasillo estorbaría
    if (pl.pozo) { for (const c of Object.values(this.cartas)) c.grupo.visible = false; }
    h.contrapeso.position.y = 8 - h.cabina.position.y * 0.9;
    h.luzPozo.position.set(0.8, h.cabina.position.y + 3.2, 0.8);
    if (!pl.pozo) h.chispas.forEach((s) => (s.visible = false));
    // cables: uno se rompe en el gancho (se ve flojo: se dobla hacia un lado)
    h.cables.forEach((cb, i) => { cb.rotation.z = this.cableRoto && i === 1 ? 0.05 : 0; cb.visible = !(this.cableRoto && i === 2); });
    // luz de la cabina: normal; titila al caer; apagada desde «se apaga» hasta que empieza la historia; y desde la regla 3 (ya a oscuras) solo la roja
    let on = 1;
    if (f < STORY()) {
      if (f >= CAE && f < APAGON()) on = ruido(Math.floor(f / 4)) > 0.35 ? 1 : 0.3; // titila (cada 4 cuadros: no estroboscópico)
      if (f >= APAGON()) on = 0;
    } else if (f >= fw(103) - 2) on = 0;
    h.luzTecho.intensity = 3.2 * on; (h.difusor.material as THREE.MeshBasicMaterial).color.set(on > 0.5 ? "#f2f6ff" : on > 0 ? "#6a6e78" : "#1e2026");
    const roja = f >= EMERG() ? 1 : 0;
    const pulso = roja ? 0.88 + 0.12 * Math.sin(f * 0.12) : 0; // late despacio (sin saltos: no parpadea)
    h.luzEmerg.intensity = 2.6 * pulso; h.haloEmerg.material.opacity = 0.75 * pulso; h.mMica.color.set(roja ? "#ff3a24" : "#4a1010");
    h.rendija.visible = on === 0 && !roja && !pl.pozo;
    const oscuro = on === 0;
    h.amb.intensity = pl.pozo ? 0.1 : oscuro ? (roja ? 0.06 : 0.035) : 0.22; h.hemi.intensity = pl.pozo ? 0.14 : oscuro ? (roja ? 0.08 : 0.04) : 0.28;
    (h.amb.color as THREE.Color).set(roja ? "#6a4a5a" : "#7a8cae");
    // indicador de piso: apagado sin corriente
    const piso = this.piso ?? (f < fw(31) ? "14" : "--");
    h.indicador.dibujar((c, w, hh) => dibujarIndicador(c, w, hh, piso, f >= STORY(), oscuro ? 0 : 1));
    // interfón: lucecita verde mientras habla el portero
    (h.ledInterfon.material as THREE.MeshBasicMaterial).color.set(this.interfon ? "#5ad06a" : "#2a3a2c");
    // pasillo
    h.luzPasillo.intensity = 2.6 * this.pasilloLuz; h.haloP.material.opacity = 0.45 * this.pasilloLuz; h.bulboP.visible = this.pasilloLuz > 0.3 || true;
    // el espejo vivo solo cuando se necesita (si no, vidrio mate: ahorra un render)
    h.espejo.visible = this.espejoVivo; h.espejoMate.visible = !this.espejoVivo;
    // corte: las paredes que quedan entre la cámara y la cabina se esconden (con sus objetos)
    const cp = this.cam.position.clone(); cp.y -= h.cabina.position.y;
    for (const { g, p, n } of h.paredes) g.visible = pl.pozo ? false : cp.clone().sub(p).dot(n) > -0.02;
    if (pl.pozo) h.paredes.forEach(({ g }) => (g.visible = false));
  }
}

// ------------------------------------------------------------------ acabado aprobado (§8.9)
const lutFrio = () => {
  const n = 32, d = new Float32Array(n ** 3 * 4);
  for (let bi = 0; bi < n; bi++) for (let gi = 0; gi < n; gi++) for (let ri = 0; ri < n; ri++) {
    let r = ri / (n - 1), g = gi / (n - 1), b = bi / (n - 1);
    const L = 0.299 * r + 0.587 * g + 0.114 * b;
    r = L + (r - L) * 0.6; g = L + (g - L) * 0.63; b = L + (b - L) * 0.7;
    r = r ** 0.7; g = g ** 0.7; b = b ** 0.7;
    r *= 0.92; g *= 0.985; b *= 1.07;
    const s = (1 - L) ** 2; r += 0.03 * s; g += 0.045 * s; b += 0.075 * s;
    const i = (ri + gi * n + bi * n * n) * 4;
    d[i] = Math.min(1, r); d[i + 1] = Math.min(1, g); d[i + 2] = Math.min(1, b); d[i + 3] = 1;
  }
  return new LookupTexture(d, n).convertToUint8();
};

// ------------------------------------------------------------------ escena 3D
const PORTADA: Plano = PLANOS[35];

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(180) : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 14 }),
    lens: new LensBlur({ maxCoC: 22, nearScale: 1.0 }),
    bloom: new BloomEffect({ blendFunction: BlendFunction.ADD, intensity: 1.0, luminanceThreshold: 0.62, luminanceSmoothing: 0.25, mipmapBlur: true, radius: 0.7 }),
    tone: new ToneMappingEffect({ mode: ToneMappingMode.NEUTRAL }),
    sat: new HueSaturationEffect({ saturation: -0.06 }),
    lut: new LUT3DEffect(lutFrio()),
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : ELEVADOR_CUADROS;
  const k0 = portada ? 1 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  const pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  const mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  mundo.f = f;
    const s = pl.sacude ? pl.sacude(f) : 0;
  if (s) { pos[0] += s * Math.sin(f * 1.3); pos[1] += s * Math.sin(f * 1.7 + 1); mira[0] += s * 1.5 * Math.sin(f * 1.1 + 2); } // ≈ 6 Hz: sacude sin vibrar cuadro a cuadro
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 320; cam.updateProjectionMatrix();
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#05070c");
  scene.fog = pl.pozo ? new THREE.Fog("#0a0e16", 4, 22) : new THREE.Fog("#141a24", 3.5, 15);
  mundo.reiniciar(cam);
  pl.hacer({ f, k: k0, m: mundo });
  mundo.luces(f, pl);
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
  const reglas: [number, number, string][] = [[61, 76, "REGLA Nº 1"], [76, 87, "REGLA Nº 2"], [87, 103, "REGLA Nº 3"], [128, 137, "10 MINUTOS DESPUÉS"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "11:00 PM · PISO 14 → PLANTA BAJA";
  const a = inicioPlano(4);
  if (f < a || f >= inicioPlano(7)) return null;
  const n = Math.round(Math.min(1, (f - a) / 24) * texto.length);
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
    <div style={{ transform: `scale(${pop(f - a - d)})`, background: color, color: "#fff", fontFamily: "Titulo", fontSize: 40, padding: "12px 30px", borderRadius: 40, border: "4px solid #ffffff", boxShadow: "0 6px 16px rgba(0,0,0,0.5)" }}>{txt}</div>
  );
  return (
    <div style={{ position: "absolute", top: 150, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
      {boton("QUEDARTE", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("SALIR SOLO", "#c8263a", 4)}
    </div>
  );
};
/** destello blanco de un cuadro en el frenazo (el golpe del gancho) */
const Golpe: React.FC<{ f: number }> = ({ f }) => {
  const d = f - FRENA();
  if (d < 0 || d > 3) return null;
  return <div style={{ position: "absolute", inset: 0, background: "#ffffff", opacity: 0.55 * (1 - d / 3) }} />;
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 320 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Elevador: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D />
      <Golpe f={f} />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: tú y Leo de la mano, de espaldas; en el espejo solo estás tú (y el señor te mira).
export const ElevadorPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 760, background: "linear-gradient(#05070c00, #05070cee 45%)" }} />
      <div style={{ position: "absolute", bottom: 260, width: "100%", textAlign: "center" }}>
        {linea("SI NO TIENE", "#ffffff", 104)}
        {linea("REFLEJO,", "#ffffff", 104)}
        {linea("NO LE DES LA ESPALDA", "#ffd23a", 84)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void ESPEJO;
