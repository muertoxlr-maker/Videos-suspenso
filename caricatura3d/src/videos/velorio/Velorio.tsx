// «El velorio del pueblo» — animación completa. Mismo composer, tarjetas y capas de texto que «La taquería»
// (estándar §8 + mejoras §8.8). Lo nuevo: personajes sentados (`sentado`), rebozo, velas que titilan (una se apaga y
// se vuelve a prender), reloj de pared que avanza, y la tapa del ataúd que se ABRE con bisagra antes de que «algo se
// siente» (nada atraviesa nada, §8.6c). Cada plano empieza 2 cuadros antes de su palabra.
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
import { Aspecto, LIENZO_H, Pose } from "../prueba_pasillo/personaje";
import { POSE, Tarjeta, lerp, parpadea, ruido, suave } from "../turno3/comun";
import { empuje, hablaGestos, tiembla } from "../comun/movimiento";
import { ATAUD, PUERTA_COCINA, VELAS, crearVelorio } from "./velorio";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const VELORIO_CUADROS = Math.ceil(77.28 * FPS); // duración de voz_final.mp3
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes
const TU: Aspecto = { piel: "#d2ae8e", pelo: "#1d1512", ropa: "#1e1e24", ropaInterior: "#2c2c34", pantalon: "#24242a", zapatos: "#141012", peinado: "revuelto", prenda: "camisa", semilla: 601 };
const ABUELA: Aspecto = { piel: "#b88a66", pelo: "#e6e2da", ropa: "#3a2a3e", ropaInterior: "#e6e0d0", pantalon: "#241c26", zapatos: "#141012", peinado: "recogido", arrugas: true, rebozo: "#1c1c22", semilla: 603 };
const ABUELA_PUERTA: Aspecto = { ...ABUELA, rebozo: undefined }; // en la puerta ya no trae el rebozo (lo dejó en su silla)
const D1: Aspecto = { piel: "#c49a7a", pelo: "#2a2420", ropa: "#2a2a30", ropaInterior: "#e6e0d0", pantalon: "#1e1e22", zapatos: "#141012", peinado: "recogido", arrugas: true, rebozo: "#4a4a52", semilla: 605 };
const D2: Aspecto = { piel: "#a87a5a", pelo: "#1d1512", ropa: "#e8e4dc", ropaInterior: "#e6e0d0", pantalon: "#2a2622", zapatos: "#141012", peinado: "recogido", prenda: "camisa", bigote: true, arrugas: true, sombrero: "#d8c89a", semilla: 607 };
const D3: Aspecto = { piel: "#d6b08e", pelo: "#3a2a20", ropa: "#24242c", ropaInterior: "#e6e0d0", pantalon: "#1e1e22", zapatos: "#141012", peinado: "trenza", rebozo: "#2a3448", semilla: 609 };
const D4: Aspecto = { piel: "#8e6346", pelo: "#141012", ropa: "#3a3430", ropaInterior: "#e6e0d0", pantalon: "#2a2622", zapatos: "#141012", peinado: "revuelto", prenda: "chamarra", bigote: true, semilla: 611 };
const D5: Aspecto = { piel: "#d8b496", pelo: "#3a2a1e", ropa: "#1e1e24", ropaInterior: "#e6e0d0", pantalon: "#24242a", zapatos: "#141012", peinado: "largo", semilla: 613 };
const D6: Aspecto = { piel: "#c9a07e", pelo: "#8a8480", ropa: "#2e3238", ropaInterior: "#e6e0d0", pantalon: "#24242a", zapatos: "#141012", peinado: "recogido", prenda: "camisa", lentes: true, arrugas: true, semilla: 615 };
const NINO: Aspecto = { piel: "#d2ae8e", pelo: "#1d1512", ropa: "#e8e4dc", ropaInterior: "#e6e0d0", pantalon: "#24242a", zapatos: "#141012", peinado: "mono", prenda: "camisa", semilla: 617 };
const MUERTO: Aspecto = { piel: "#16181c", pelo: "#0b0c0f", ropa: "#0e0f12", ropaInterior: "#0e0f12", pantalon: "#0b0c0f", zapatos: "#0b0c0f", peinado: "recogido", sombrero: "#121316", semilla: 619 };
const VELA: Partial<Pose> = { luzX: -1, borde: "#ffb46a" };
const DUERME = (f: number, s: number): Partial<Pose> => ({ parpadeo: true, mirarY: 0.6, cabezaX: (s % 2 ? 1 : -1) * 0.07, hombros: 0.35, respira: 0.5 + 0.5 * Math.sin(f * 0.05 + s), boca: "linea" });

// ------------------------------------------------------------------ planos
type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; rapido?: boolean; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const reza = (f: number, s: number) => 0.2 + 0.25 * Math.abs(Math.sin(f * 0.6 + s)); // labios que se mueven bajito

// asientos: la tarjeta va 2 cm delante de la orilla del asiento (pies en el piso, cadera sobre la silla)
const ASIENTO = (x: number, zSilla: number, haciaMas: boolean): V3 => [x, 0, zSilla + (haciaMas ? 0.22 : -0.22)]; // la silla 3D se esconde y se dibuja en la tarjeta
const TU_POS = ASIENTO(2.05, -1.0, true);
const ABUELA_POS = ASIENTO(2.6, -1.0, true);
const ABUELA_PUERTA_POS: V3 = [PUERTA_COCINA.x, 0, PUERTA_COCINA.z - 0.35];
const INVITADOS: [Quien, V3][] = [
  ["d1", ASIENTO(-1.45, 0.35, false)], ["d3", ASIENTO(-0.9, 0.35, false)], ["d2", ASIENTO(0.9, 0.35, false)],
  ["d4", ASIENTO(-1.45, 1.2, false)], ["nino", ASIENTO(-0.9, 1.2, false)], ["d5", ASIENTO(0.9, 1.2, false)], ["d6", ASIENTO(1.45, 1.2, false)],
];

const PLANOS: Plano[] = [
  // 1 · Imagina que acompañas
  { w: 0, foco: 4.6, cInf: 5, ini: c([-1.3, 1.95, 3.15], [0, 0.95, -1.7], 62), fin: c([-1.1, 1.9, 2.7], [0, 0.95, -1.7], 60),
    hacer: ({ f, m }) => { m.invitados(f, false); m.familia(f); } },
  // 2 · abuela al velorio
  { w: 5, foco: 1.9, cInf: 8, ini: c([2.33, 1.3, 2.35], [2.33, 0.95, -0.78], 50), fin: c([2.33, 1.28, 2.1], [2.33, 0.95, -0.78], 50),
    hacer: ({ f, m }) => { m.familia(f, { mirarX: -0.5 }, { mirarX: -0.6, mirarY: 0.2 }); } },
  // 3 · de don Chuy, en el pueblo.
  { w: 8, foco: 1.75, cInf: 9, ini: c([0.3, 1.78, -0.85], [0, 1.95, -2.58], 36), fin: c([0.24, 1.8, -1.0], [0, 1.95, -2.58], 33),
    hacer: () => {} },
  // 4 · Cuarenta personas,
  { w: 14, foco: 2.0, cInf: 7, ini: c([3.0, 2.2, -0.55], [-0.6, 0.75, 1.0], 60), fin: c([2.95, 2.15, -0.35], [-0.6, 0.75, 1.0], 58),
    hacer: ({ f, m }) => { m.invitados(f, false); } },
  // 5 · café de olla,
  { w: 16, foco: 1.05, cInf: 9, ini: c([-1.95, 1.5, 0.35], [-3.1, 0.98, 1.25], 44), fin: c([-2.05, 1.45, 0.45], [-3.1, 0.98, 1.25], 42),
    hacer: () => {} },
  // 6 · rezos
  { w: 19, foco: 1.0, cInf: 9, ini: c([0.3, 1.25, -1.0], [-1.17, 0.95, 0.13], 50), fin: c([0.2, 1.25, -0.95], [-1.17, 0.95, 0.13], 48),
    hacer: ({ f, m }) => { m.invitados(f, true); } },
  // 7 · y cuatro velas alrededor del ataúd.
  { w: 20, foco: 2.9, cInf: 7, ini: c([-2.4, 1.65, 0.05], [0, 1.05, -1.7], 52), fin: c([-2.2, 1.6, -0.2], [0, 1.05, -1.7], 52),
    hacer: ({ f, m }) => { m.familia(f); } },
  // 8 · A las once, tu abuela te aprieta la mano:
  { w: 26, foco: 1.95, cInf: 8, ini: c([2.33, 1.3, 2.25], [2.33, 0.95, -0.78], 50), fin: c([2.33, 1.28, 2.0], [2.33, 0.95, -0.78], 48),
    hacer: ({ f, k, m }) => { const a = suave(0.35, 0.6, k); m.familia(f, { mirarX: 0.5, cejasAlto: 0.2 * a, brazoIzq: [lerp(0.08, 0.5, a), -0.1] }, { mirarX: -0.6, brazoDer: [lerp(0.08, 0.75, a), -0.2], cejasMiedo: 0.3 }); } },
  // 9 · «Aquí, después de medianoche, el muerto busca compañía».
  { w: 35, foco: 1.1, cInf: 9, rapido: true, ini: c([2.6, 1.12, 1.25], [2.6, 1.02, -0.78], 46), fin: c([2.6, 1.1, 1.05], [2.6, 1.02, -0.78], 44),
    hacer: ({ f, m }) => { m.ver("abuela", ABUELA_POS, { ...VELA, sentado: 1, mirarX: -0.5, mirarY: 0.1, cejasMiedo: 0.4, cejasAlto: -0.2, boca: "abierta", bocaAbre: habla(f, 35, 42), ...hablaGestos(f, 3, 0.5) }); m.luz(2.0, 1.4, 0.0, 0.9); } },
  // 10 · Regla número uno: después de las doce,
  { w: 43, foco: 1.1, cInf: 9, ini: c([-2.05, 1.95, -1.95], [-2.3, 2.05, -2.97], 36), fin: c([-2.1, 1.98, -2.1], [-2.3, 2.05, -2.97], 34),
    hacer: ({ m }) => { m.luz(-2.0, 2.0, -2.0, 0.8); } },
  // 11 · no mires dentro del ataúd.
  { w: 50, foco: 1.25, cInf: 9, ini: c([-0.6, 1.95, -0.8], [-0.45, 1.25, -1.7], 42), fin: c([-0.55, 1.85, -0.95], [-0.45, 1.25, -1.7], 40),
    hacer: () => {} },
  // 12 · Si lo miras, te mira.
  { w: 55, foco: 0.95, cInf: 9, rapido: true, ini: c([2.05, 1.12, 1.1], [2.05, 1.04, -0.78], 46), fin: c([2.05, 1.1, 0.95], [2.05, 1.04, -0.78], 44),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.6, mirarY: 0.3, ojos: 1.08, pupila: 0.24, cejasMiedo: 0.5, boca: "linea", ...tiembla(f, 0.2) }); m.luz(1.6, 1.3, -0.1, 0.8); } },
  // 13 · Regla número dos: las cuatro velas nunca se apagan.
  { w: 60, foco: 0.62, cInf: 10, ini: c([1.08, 1.62, -0.38], [1.3, 1.6, -0.95], 40), fin: c([1.12, 1.63, -0.5], [1.3, 1.6, -0.95], 38),
    hacer: () => {} },
  // 14 · Si una se apaga, la prendes antes de contar diez.
  { w: 69, foco: 0.85, cInf: 9, ini: c([-0.72, 1.22, -0.72], [-1.05, 0.82, -1.42], 42), fin: c([-0.78, 1.18, -0.82], [-1.05, 0.82, -1.42], 40),
    hacer: ({ m }) => { m.luz(-0.8, 1.4, -0.9, 0.6); } },
  // 15 · Regla número tres: si alguien te llama por tu nombre completo, no respondas.
  { w: 79, foco: 3.6, cInf: 7, ini: c([3.0, 1.6, -0.5], [1.3, 1.05, 3.4], 44), fin: c([3.0, 1.6, -0.3], [1.3, 1.05, 3.4], 42),
    hacer: ({ f, m }) => { m.invitados(f, false); } },
  // 16 · Así llaman los muertos: como en el acta.
  { w: 92, foco: 0.75, cInf: 9, ini: c([0.15, 0.9, -0.05], [0, 0.64, -1.18], 42), fin: c([0.12, 0.88, -0.2], [0, 0.64, -1.18], 40),
    hacer: ({ m }) => { m.luz(0.1, 1.0, -0.5, 0.7); } },
  // 17 · A las doce, la tapa del ataúd cruje.
  { w: 100, foco: 1.85, cInf: 8, ini: c([0.35, 1.55, -0.1], [0, 1.08, -1.7], 44), fin: c([0.3, 1.52, -0.25], [0, 1.08, -1.7], 42),
    hacer: () => {} },
  // 18 · Nadie voltea.
  { w: 108, foco: 2.0, cInf: 7, ini: c([3.0, 2.2, -0.55], [-0.6, 0.75, 1.0], 58), fin: c([2.95, 2.15, -0.4], [-0.6, 0.75, 1.0], 56),
    hacer: ({ f, m }) => { m.invitados(f, false, { mirarY: 0.7, cejasMiedo: 0.6, boca: "linea", hombros: 0.3 }); } },
  // 19 · A las doce y cuarto, se apaga una vela.
  { w: 110, foco: 0.62, cInf: 10, ini: c([-1.08, 1.62, -0.38], [-1.3, 1.6, -0.95], 38), fin: c([-1.1, 1.62, -0.45], [-1.3, 1.6, -0.95], 36),
    hacer: () => {} },
  // 20 · Cuentas: uno, dos, tres...
  { w: 119, foco: 0.95, cInf: 9, rapido: true, ini: c([2.05, 1.12, 1.1], [2.05, 1.04, -0.78], 46), fin: c([2.05, 1.1, 0.92], [2.05, 1.04, -0.78], 44),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: -0.6, ojos: 1.1, pupila: 0.22, cejasMiedo: 0.8, boca: "abierta", bocaAbre: habla(f, 119, 122) * 0.6, sudor: 0.6, ...tiembla(f, 0.5) }); m.luz(1.6, 1.3, -0.1, 0.8); } },
  // 21 · La prendes en el siete.
  { w: 123, foco: 0.62, cInf: 10, ini: c([-1.08, 1.62, -0.42], [-1.3, 1.6, -0.95], 38), fin: c([-1.1, 1.62, -0.48], [-1.3, 1.6, -0.95], 36),
    hacer: ({ k, m }) => { m.cerilloEn(lerp(0.35, 0.0, suave(0, 0.75, k)), k); } },
  // 22 · A las doce y media, todos se quedan dormidos en sus sillas.
  { w: 128, foco: 2.0, cInf: 7, ini: c([-3.0, 2.2, -0.55], [0.6, 0.75, 1.0], 60), fin: c([-2.95, 2.15, -0.35], [0.6, 0.75, 1.0], 58),
    hacer: ({ f, k, m }) => { m.invitados(f, false, k > 0.25 ? undefined : { mirarY: 0.4 }, k > 0.25); } },
  // 23 · Solo tú sigues despierto.
  { w: 140, foco: 0.95, cInf: 9, ini: c([2.05, 1.12, 1.15], [2.05, 1.04, -0.78], 46), fin: c([2.05, 1.1, 1.0], [2.05, 1.04, -0.78], 44),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.3, mirarY: 0.1, ojos: 1.05, cejasMiedo: 0.5, boca: "linea", respira: 0.5 + 0.5 * Math.sin(f * 0.2) }); m.luz(1.6, 1.3, -0.1, 0.6); } },
  // 24 · Entonces, desde la puerta de la cocina,
  { w: 144, foco: 4.0, cInf: 7, ini: c([3.0, 1.6, -0.5], [1.3, 1.05, 3.4], 42), fin: c([3.0, 1.6, -0.3], [1.3, 1.05, 3.4], 38),
    hacer: ({ f, k, m }) => { m.invitados(f, false, undefined, true); const x = lerp(2.2, PUERTA_COCINA.x, suave(0.2, 0.7, k)); m.ver("abuela2", [x, 0, ABUELA_PUERTA_POS[2]], { ...m.contraluz(), mirarX: -0.3 }); } },
  // 25 · tu abuela te llama:
  { w: 151, foco: 1.5, cInf: 8, ini: c([1.3, 1.3, 0.6], [1.3, 1.05, 3.05], 46), fin: c([1.3, 1.28, 0.8], [1.3, 1.05, 3.05], 44),
    hacer: ({ m }) => { m.ver("abuela2", ABUELA_PUERTA_POS, { ...m.contraluz(), mirarY: 0.1, cejasMiedo: 0.4 }); m.luz(1.3, 1.6, 2.2, 0.8); } },
  // 26 · «Rodrigo Emiliano Torres Vega, ven acá. Ahora».
  { w: 155, foco: 0.85, cInf: 9, rapido: true, ini: c([1.3, 1.18, 1.25], [1.3, 1.1, 3.05], 44), fin: c([1.3, 1.17, 1.4], [1.3, 1.1, 3.05], 42),
    hacer: ({ f, m }) => { m.ver("abuela2", ABUELA_PUERTA_POS, { ...m.contraluz(), cejasMiedo: 0.2, cejasAlto: -0.4, boca: "abierta", bocaAbre: habla(f, 155, 161), ...hablaGestos(f, 7, 0.6) }); m.luz(1.3, 1.5, 2.4, 0.9); } },
  // 27 · Ella solo usa tu nombre completo cuando estás en problemas.
  { w: 162, foco: 1.95, cInf: 8, ini: c([2.33, 1.25, 2.2], [2.33, 0.9, -0.78], 50), fin: c([2.33, 1.23, 1.95], [2.33, 0.9, -0.78], 48),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: -0.3, mirarY: -0.3, cejasAlto: 0.3, cejasMiedo: 0.6, boca: "o", ...tiembla(f, 0.2) }); m.rebozoDejado(); } },
  // 28 · Te hace señas, asustada.
  { w: 172, foco: 1.25, cInf: 8, ini: c([1.3, 1.25, 0.85], [1.3, 1.0, 3.05], 46), fin: c([1.3, 1.23, 1.0], [1.3, 1.0, 3.05], 44),
    hacer: ({ f, m }) => { m.ver("abuela2", ABUELA_PUERTA_POS, { ...m.contraluz(), ojos: 1.12, pupila: 0.2, cejasMiedo: 1, boca: "o", brazoDer: [2.3 + 0.35 * Math.sin(f * 0.55), 0.9 + 0.5 * Math.sin(f * 0.55)], ...tiembla(f, 0.4) }); m.luz(1.3, 1.6, 2.2, 0.8); } },
  // 29 · Señala detrás de ti.
  { w: 176, foco: 1.25, cInf: 8, rapido: true, ini: c([1.3, 1.25, 0.8], [1.3, 1.0, 3.05], 46), fin: c([1.3, 1.23, 1.05], [1.3, 1.0, 3.05], 44),
    hacer: ({ k, m, f }) => { m.ver("abuela2", ABUELA_PUERTA_POS, { ...m.contraluz(), ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "grito", brazoIzq: [lerp(0.1, 1.45, suave(0, 0.3, k)), 0.05], ...tiembla(f, 0.6) }); m.luz(1.3, 1.6, 2.2, 0.8); } },
  // 30 · A tu espalda, cruje la madera.
  { w: 180, foco: 1.25, cInf: 8, ini: c([2.75, 1.25, 1.3], [1.4, 1.05, -1.3], 46), fin: c([2.72, 1.24, 1.15], [1.4, 1.05, -1.3], 44),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.4, mirarY: -0.1, ojos: 1.12, pupila: 0.2, cejasMiedo: 1, boca: "linea", hombros: 0.6, sudor: 1, ...tiembla(f, 0.6) }); m.rebozoDejado(); m.luz(2.2, 1.3, -0.1, 0.6); } },
  // 31 · Algo se sienta en el ataúd.
  { w: 186, foco: 3.2, cInf: 7, ini: c([3.3, 1.45, 2.4], [1.0, 1.15, -1.3], 50), fin: c([3.28, 1.45, 2.2], [1.0, 1.15, -1.3], 48),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.5, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "linea", hombros: 0.8, sudor: 1, ...tiembla(f, 0.9) }); m.rebozoDejado(); m.muerto(f); } },
  // 32 · ¿Le respondes...
  { w: 192, foco: 0.95, cInf: 9, rapido: true, ini: c([2.05, 1.12, 1.1], [2.05, 1.04, -0.78], 46), fin: c([2.05, 1.1, 0.92], [2.05, 1.04, -0.78], 44),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.3, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "o", sudor: 1, hombros: 0.7, ...tiembla(f, 1) }); m.luz(1.6, 1.3, -0.1, 0.8); m.muerto(f); } },
  // 33 · o te quedas callado?
  { w: 194, foco: 3.4, cInf: 6, ini: c([3.28, 1.45, 2.2], [1.0, 1.15, -1.3], 48), fin: c([3.3, 1.5, 2.6], [1.0, 1.15, -1.3], 52),
    hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.5, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "linea", hombros: 0.8, sudor: 1, ...tiembla(f, 0.8) }); m.rebozoDejado(); m.muerto(f); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };
const VELA_APAGADA = () => [fw(116), fw(127)] as const; // «apaga» … «siete»
const FOCO_APAGADO = () => fw(133); // a las 12:30 apagan el foco del techo (todos duermen)

// hora del reloj de pared (en minutos después de las 22:00) por cuadro
const HORA: [number, number][] = [[0, 50], [26, 60], [43, 115], [100, 120], [110, 135], [128, 150], [197, 152]];
const minutos = (f: number) => {
  const pts = HORA.map(([w, m]) => [w === 0 ? 0 : fw(w), m]);
  for (let i = 0; i + 1 < pts.length; i++) if (f < pts[i + 1][0]) return lerp(pts[i][1], pts[i + 1][1], (f - pts[i][0]) / Math.max(1, pts[i + 1][0] - pts[i][0]));
  return pts[pts.length - 1][1];
};

// ------------------------------------------------------------------ mundo (estado por cuadro)
const CARTAS = { tu: [TU, 1.62], abuela: [ABUELA, 1.5], abuela2: [ABUELA_PUERTA, 1.5], d1: [D1, 1.55], d2: [D2, 1.7], d3: [D3, 1.58], d4: [D4, 1.72], d5: [D5, 1.6], d6: [D6, 1.66], nino: [NINO, 1.2], muerto: [MUERTO, 1.7] } as const;
type Quien = keyof typeof CARTAS;
const MIRA: Record<Quien, number> = { tu: 1, abuela: 1, abuela2: -1, d1: -1, d2: -1, d3: -1, d4: -1, d5: -1, d6: -1, nino: -1, muerto: 1 }; // hacia dónde mira cada uno (±z)

class Mundo {
  h = crearVelorio();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  private camPos = new THREE.Vector3();
  constructor() {
    for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; }
    this.cartas.muerto.contacto.visible = false;
  }
  reiniciar(cam: THREE.Camera) {
    this.camPos.copy(cam.position);
    for (const c of Object.values(this.cartas)) c.grupo.visible = false;
    for (const s of [...this.h.sillas, this.h.sillaTu, this.h.sillaAbuela]) s.visible = true;
    this.h.luzExtra.intensity = 0;
    this.h.cerillo.visible = false;
    this.h.rebozoSilla.visible = false; this.h.rebozoCuelga.visible = false;
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  ver(quien: Quien, pos: V3, pose: Partial<Pose>) {
    const c = this.cartas[quien];
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.y = Math.atan2(this.camPos.x - pos[0], this.camPos.z - pos[2]);
    const espalda = (this.camPos.z - pos[2]) * MIRA[quien] < 0; // la cámara está detrás de quien mira hacia ±z
    let silla: Pose["silla"];
    if (pose.sentado) { // la silla se dibuja en la tarjeta y se esconde la de 3D (si no, la persona la tapa entera)
      const s3 = [...this.h.sillas, this.h.sillaTu, this.h.sillaAbuela].find((s) => Math.abs(s.position.x - pos[0]) < 0.1 && Math.abs(s.position.z - pos[2]) < 0.3);
      if (s3) { s3.visible = false; silla = { color: "#" + ((s3.children[0] as THREE.Mesh).material as THREE.MeshLambertMaterial).color.getHexString(), k: LIENZO_H / CARTAS[quien][1] }; }
    }
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(silla ? { silla } : {}), ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  invitados(f: number, rezando: boolean, pose?: Partial<Pose>, duermen = false) {
    INVITADOS.forEach(([q, p], i) => {
      const base: Partial<Pose> = { ...VELA, sentado: 1, mirarY: 0.3, respira: 0.5 + 0.5 * Math.sin(f * 0.06 + i), boca: "linea" };
      const r: Partial<Pose> = rezando || i % 3 === 0 ? { boca: "abierta", bocaAbre: reza(f, i), brazoIzq: [0.35, 1.2], brazoDer: [0.35, 1.2], mirarY: 0.5 } : {};
      this.ver(q, p, { ...base, ...r, ...(pose ?? {}), ...(duermen ? DUERME(f, i) : {}) });
    });
  }
  familia(f: number, tu: Partial<Pose> = {}, abuela: Partial<Pose> = {}) {
    this.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: -0.3, respira: 0.5 + 0.5 * Math.sin(f * 0.07), ...tu });
    this.ver("abuela", ABUELA_POS, { ...VELA, sentado: 1, mirarX: -0.5, mirarY: 0.3, brazoIzq: [0.35, 1.2], brazoDer: [0.35, 1.2], respira: 0.5 + 0.5 * Math.sin(f * 0.05 + 2), ...abuela });
  }
  contraluz(): Partial<Pose> { return { luzX: 1, borde: "#ffd27a" }; } // la luz de la cocina le pega por detrás
  rebozoDejado() { this.h.rebozoSilla.visible = true; this.h.rebozoCuelga.visible = true; }
  cerilloEn(dx: number, k: number) { // cerillo encendido que llega a la mecha de la vela 0 desde la derecha
    const v = VELAS[0]; this.h.cerillo.visible = k < 0.92; this.h.cerillo.position.set(v.x + 0.03 + dx, v.y + 0.05 + dx * 0.2, v.z + 0.02); this.h.cerillo.rotation.z = 0.5;
  }
  muerto(f: number) { // se sienta: sube desde dentro del ataúd cuando la tapa ya pasó de vertical
    const u = suave(fw(187), fw(187) + 40, f);
    if (u <= 0) return;
    this.ver("muerto", [ATAUD.x - 0.15, lerp(-0.62, 0.38, u), ATAUD.z], { ojosVacios: true, ojos: 0.9, parpadeo: false, luzX: -1, borde: "#ffb46a", hombros: 0.2, respira: 0.5 + 0.5 * Math.sin(f * 0.1) });
    this.cartas.muerto.contacto.visible = false;
  }
  luces(f: number) {
    const h = this.h;
    // velas que titilan (cada una a su ritmo); la 0 se apaga a las 12:15 y se prende «en el siete»
    const [a, b] = VELA_APAGADA(); const off0 = f >= a && f < b;
    h.llamas.forEach((ll, i) => {
      const t = 0.85 + 0.15 * Math.sin(f * 0.9 + i * 2.1) * Math.sin(f * 0.37 + i);
      const on = !(i === 0 && off0);
      ll.visible = on; h.halos[i].visible = on;
      ll.scale.set(1, 2.1 * t, 1); h.halos[i].material.opacity = 0.6 * t;
      const hu = h.humo[i]; // hilo de humo cuando se apaga
      const uh = i === 0 && f >= a ? Math.min(1, (f - a) / 40) : 1;
      hu.material.opacity = i === 0 && f >= a && f < a + 40 ? 0.35 * (1 - uh) : 0;
      hu.position.y = VELAS[i].y + 0.08 + uh * 0.3; hu.scale.setScalar(0.06 + uh * 0.18);
    });
    const tIzq = 0.9 + 0.1 * Math.sin(f * 0.8) * Math.sin(f * 0.31);
    h.luzVelaIzq.intensity = (off0 ? 1.7 : 3.2) * tIzq; h.luzVelaDer.intensity = 3.2 * (0.9 + 0.1 * Math.sin(f * 0.7 + 1) * Math.sin(f * 0.29));
    h.llamaVeladora.scale.set(1, 1.8 * (0.9 + 0.1 * Math.sin(f * 1.1)), 1);
    // foco del techo
    const focoOn = f < FOCO_APAGADO();
    h.luzTecho.intensity = focoOn ? 5 : 0; h.bulbo.visible = focoOn; h.haloTecho.visible = focoOn;
    h.amb.intensity = focoOn ? 0.26 : 0.16; h.hemi.intensity = focoOn ? 0.3 : 0.18;
    // reloj
    const m = minutos(f); h.manoMin.rotation.z = -(m % 60) / 60 * Math.PI * 2; h.manoHora.rotation.z = -((10 + m / 60) % 12) / 12 * Math.PI * 2;
    // vapor del café
    h.vaporOlla.forEach((v, i) => { const u = ((f * 0.012 + i / 4) % 1); v.position.set(-3.1 + Math.sin(i * 2 + f * 0.03) * 0.05, 1.22 + u * 0.5, 1.2 + Math.cos(i * 3) * 0.04); v.scale.setScalar(0.12 + u * 0.25); v.material.opacity = 0.16 * Math.sin(Math.PI * u); });
    // tapa: cruje a las 12:00 (tiembla tantito), se entreabre en «cruje la madera» y se abre del todo antes de que algo se siente
    let ang = 0;
    const cr = fw(107); if (f >= cr - 3 && f < cr + 14) ang = 0.025 * Math.abs(Math.sin((f - cr) * 1.7));
    if (f >= fw(183)) ang = 0.06 + 0.04 * Math.abs(Math.sin(f * 1.3));
    if (f >= fw(186) - 4) ang = lerp(0.1, 1.95, suave(fw(186) - 4, fw(186) + 16, f));
    h.tapa.rotation.x = -ang;
  }
}

// ------------------------------------------------------------------ escena 3D
const PORTADA: Plano = { w: 194, foco: 3.2, cInf: 7, ini: c([3.28, 1.45, 2.3], [1.0, 1.15, -1.3], 50), fin: c([3.28, 1.45, 2.3], [1.0, 1.15, -1.3], 50),
  hacer: ({ f, m }) => { m.ver("tu", TU_POS, { ...VELA, sentado: 1, mirarX: 0.5, ojos: 1.15, pupila: 0.18, cejasMiedo: 1, boca: "linea", hombros: 0.8, sudor: 1 }); m.rebozoDejado(); m.muerto(f); } };

const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? fw(194) + 10 : f0;
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
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : VELORIO_CUADROS;
  const k0 = portada ? 0 : (f - a) / Math.max(1, b - a);
  const k = pl.rapido ? empuje(k0, 3) : k0;
  cam.position.set(...(pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3));
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.05; cam.far = 60; cam.updateProjectionMatrix();
  cam.lookAt(...(pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3));
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color("#0a0806");
  scene.fog = null;
  mundo.f = f;
  mundo.reiniciar(cam);
  mundo.luces(f);
  pl.hacer({ f, k: k0, m: mundo });
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
  const reglas: [number, number, string][] = [[26, 35, "11:00 PM"], [43, 60, "REGLA Nº 1"], [60, 79, "REGLA Nº 2"], [79, 100, "REGLA Nº 3"], [100, 108, "12:00 AM"], [110, 119, "12:15 AM"], [128, 140, "12:30 AM"]];
  const r = reglas.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = Math.min(1, (f - fw(r[0]) + 2) / 5);
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 76, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Cuenta: React.FC<{ f: number }> = ({ f }) => { // «uno, dos, tres… (siete)»: el número grande en pantalla
  const nums: [number, string][] = [[120, "1"], [121, "2"], [122, "3"], [127, "7"]];
  const n = [...nums].reverse().find(([w]) => f >= fw(w) - 1);
  if (!n || f > fin(n[0]) + 12 || (n[0] === 122 && f >= fw(123) - 2)) return null;
  const k = Math.min(1, (f - fw(n[0]) + 1) / 4);
  return <div style={{ position: "absolute", top: 300, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 230, color: n[1] === "7" ? "#ffd23a" : "#ffffff", transform: `scale(${1.3 - 0.3 * k})`, opacity: k, ...contornoTexto(14) }}>{n[1]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "10:30 PM · VELORIO DE DON CHUY · SAN MIGUEL";
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
      {boton("RESPONDES", "#2f63d2", 0)}<span style={{ color: "#fff", fontFamily: "Texto", fontSize: 40, opacity: f - a > 4 ? 1 : 0 }}>•</span>{boton("TE CALLAS", "#c8263a", 4)}
    </div>
  );
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.05, far: 60 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Velorio: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#0a0806" }}>
      <Lienzo3D />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Cuenta f={f} />
      <Botones f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
// Portada: tú sentado, aterrado, sin voltear; detrás, algo se sienta en el ataúd entre las velas.
export const VelorioPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 0.98, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#0a0806" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", top: 0, width: "100%", height: 1000, background: "linear-gradient(#0a0806ee 62%, #0a080600)" }} />
      <div style={{ position: "absolute", top: 330, width: "100%", textAlign: "center" }}>
        {linea("SI TE LLAMAN POR", "#ffffff", 104)}
        {linea("TU NOMBRE COMPLETO,", "#ffffff", 92)}
        {linea("NO RESPONDAS", "#ffd23a", 150)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
