// «Hinterkaifeck» — mini documental de un caso real (Baviera, 1922). Narrador en tercera persona; una frase de gancho y
// luego todo en orden. Mismo composer, tarjetas, capas de texto y acabado aprobado (§8.9: personajes ref7, lugares
// gastados, LUT frío, SIN puntitos). Nada de sangre: los asesinatos se cuentan con luces que se apagan, una puerta
// entreabierta y una sombra; a quien lo hizo nunca se le ve la cara (es una silueta de espaldas).
// Lugares: afuera (la granja con nieve), la cocina, el ático, el granero y la oficina de la policía. Cada plano
// empieza 2 cuadros antes de su palabra.
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
import { tiembla } from "../comun/movimiento";
import { ATICO, COCINA, ESCRITORIO, G, GRANERO, MESA, OFICINA, PORTON, PUERTA_CASA, PUERTITA, VENTANAS, crearEscenario } from "./granja";
import PALABRAS from "./palabras.json";

export const FPS = 30;
export const HINTER_CUADROS = Math.ceil(133.9 * FPS); // duración de voz_final.mp3 (gancho nuevo + versión más cruda)
const P = PALABRAS as { txt: string; ini: number; fin: number }[];
const fw = (i: number) => Math.round(P[i].ini * FPS);
const fin = (i: number) => Math.round(P[i].fin * FPS);

// ------------------------------------------------------------------ personajes (todos ref7; ropa de campo de 1922; no se parecen a nadie real)
const ANDREAS: Aspecto = { piel: "#d4aa88", pelo: "#c8c4ba", ropa: "#4a3a2e", ropaInterior: "#d8d0bc", pantalon: "#3a3530", zapatos: "#2a2018", peinado: "revuelto", prenda: "chamarra", sombrero: "#2e2a26", bigote: true, barba: "sombra", arrugas: true, estilo: "ref7", semilla: 1401 };
const CAZILIA: Aspecto = { piel: "#e0bc9c", pelo: "#d8d4cc", ropa: "#3a3e4a", ropaInterior: "#e0d8c4", pantalon: "#2e2a2e", zapatos: "#2a2018", peinado: "recogido", rebozo: "#5a3a3a", mandil: "#c8c0a8", arrugas: true, estilo: "ref7", semilla: 1403 };
const VIKTORIA: Aspecto = { piel: "#e2c0a0", pelo: "#4a3020", ropa: "#5a6a4a", ropaInterior: "#e8e0cc", pantalon: "#34302c", zapatos: "#2a2018", peinado: "trenza", mandil: "#d8d0b8", estilo: "ref7", semilla: 1405 };
const NINA: Aspecto = { piel: "#e6c4a4", pelo: "#5a3a22", ropa: "#8a3a3a", ropaInterior: "#e8e0cc", pantalon: "#3a3030", zapatos: "#2a2018", peinado: "trenza", coletas: "#c8402a", estilo: "ref7", semilla: 1407 };
const VIEJA: Aspecto = { piel: "#d8b090", pelo: "#2a2018", ropa: "#4a4a5a", ropaInterior: "#d8d0bc", pantalon: "#2e2c30", zapatos: "#2a2018", peinado: "recogido", rebozo: "#6a5a40", estilo: "ref7", semilla: 1409 };
const MARIA: Aspecto = { piel: "#d8b090", pelo: "#6a5a4a", ropa: "#3a4a6a", ropaInterior: "#e0d8c4", pantalon: "#2e2c30", zapatos: "#2a2018", peinado: "recogido", mandil: "#e0dccc", estilo: "ref7", semilla: 1411 };
const VECINO = (n: number, ropa: string, extra: Partial<Aspecto>): Aspecto => ({ piel: ["#d4a888", "#c89a78", "#dcb898"][n], pelo: ["#3a2a1e", "#5a4a3a", "#2a2018"][n], ropa, ropaInterior: "#d8d0bc", pantalon: "#34302c", zapatos: "#2a2018", peinado: "revuelto", prenda: "chamarra", estilo: "ref7", semilla: 1420 + n, ...extra });
const POLICIA: Aspecto = { piel: "#d4aa88", pelo: "#3a2a1e", ropa: "#3e4a3a", ropaInterior: "#d8d0bc", pantalon: "#2e3228", zapatos: "#1a1614", peinado: "revuelto", prenda: "uniforme", gorra: "#2a3424", bigote: true, estilo: "ref7", semilla: 1431 };
const INTERROGADO: Aspecto = { piel: "#c89a78", pelo: "#4a3a2a", ropa: "#5a5048", ropaInterior: "#d8d0bc", pantalon: "#34302c", zapatos: "#2a2018", peinado: "revuelto", prenda: "chamarra", estilo: "ref7", semilla: 1433 };
const SOMBRA: Aspecto = { piel: "#16181e", pelo: "#0c0c10", ropa: "#101216", ropaInterior: "#101216", pantalon: "#0c0e12", zapatos: "#08080a", peinado: "revuelto", prenda: "chamarra", sombrero: "#0c0c10", estilo: "ref7", semilla: 1441 };
const CARTAS = {
  andreas: [ANDREAS, 1.74], cazilia: [CAZILIA, 1.58], viktoria: [VIKTORIA, 1.66], nina: [NINA, 1.18], vieja: [VIEJA, 1.6], maria: [MARIA, 1.62],
  v1: [VECINO(0, "#5a4a3a", { sombrero: "#3a3228", bigote: true }), 1.78], v2: [VECINO(1, "#3a4a40", { gorra: "#3a3a3a", barba: "sombra" }), 1.72], v3: [VECINO(2, "#6a5a48", { sombrero: "#4a3a2a", arrugas: true }), 1.7],
  policia: [POLICIA, 1.78], interrogado: [INTERROGADO, 1.72], sombra: [SOMBRA, 1.8],
} as const;
type Quien = keyof typeof CARTAS;
const ALTO = (q: Quien) => CARTAS[q][1];
const NOCHE: Partial<Pose> = { luzX: -1, borde: "#a8c0ff" };
const CALIDA: Partial<Pose> = { luzX: 1, borde: "#ffd7a0" };
const DIA: Partial<Pose> = { luzX: -1, borde: "#e8eeff" };
const SILUETA: Partial<Pose> = { vista: "espalda", luzX: -1, borde: "#5a6a8a", parpadeo: false };

type V3 = [number, number, number];
type Cam = { pos: V3; mira: V3; fov: number };
type Ctx = { f: number; k: number; m: Mundo };
type Lugar = "afuera" | "cocina" | "atico" | "granero" | "oficina";
type Plano = { w: number; ini: Cam; fin: Cam; foco: number; cInf: number; lugar: Lugar; dia?: boolean; sacude?: (f: number) => number; ease?: (k: number) => number; hacer: (c: Ctx) => void };
const c = (pos: V3, mira: V3, fov: number): Cam => ({ pos, mira, fov });
const habla = (f: number, desde: number, hasta: number) => (f >= fw(desde) - 1 && f <= fin(hasta) ? 0.35 + 0.65 * Math.abs(Math.sin(f * 0.9 + ruido(f) * 0.6)) : 0);
const MIEDO = (f: number, k = 0.4): Partial<Pose> => ({ ojos: 1.1, pupila: 0.2, ojeras: 0.4, cejasMiedo: 0.8, ...tiembla(f, k) });
const CAMINA = (f: number, n: number, v = 0.35): Partial<Pose> => ({ piernas: [Math.max(0, Math.sin(f * v + n)) * 0.6, Math.max(0, -Math.sin(f * v + n)) * 0.6], brazoIzq: [0.25 + 0.2 * Math.sin(f * v + n), 0.3], brazoDer: [0.25 - 0.2 * Math.sin(f * v + n), 0.3] });
const BEBE = { bebe: { ojos: "dormido" as const, cobija: "#c8b890" }, brazoIzq: [0.3, -1.25] as [number, number], brazoDer: [0.3, -1.25] as [number, number] };
/** puntos dentro de cada cuarto (cada uno está en su propio lugar del mundo) */
const CO = (x: number, y: number, z: number): V3 => [COCINA.x + x, y, COCINA.z + z];
const AT = (x: number, y: number, z: number): V3 => [ATICO.x + x, y, ATICO.z + z];
const GA = (x: number, y: number, z: number): V3 => [GRANERO.x + x, y, GRANERO.z + z];
const OF = (x: number, y: number, z: number): V3 => [OFICINA.x + x, y, OFICINA.z + z];
const SENTADO = (q: Quien, x: number, z: number, asiento = 0.475): V3 => [x, asiento + 0.012 - 0.197 * ALTO(q), z];
const banca = MESA.z + MESA.ancho / 2 + 0.3; // la banca de atrás de la mesa (los que se sientan ahí ven hacia la cámara)

// ventanas del frente (0–1 abajo, 2–4 arriba): cuáles están prendidas en cada momento
const APAGON = () => fw(137); // «alguien los fue llevando al granero»: se apagan la de arriba y la de la cocina
const ventanasEn = (f: number, i: number): number => {
  if (f < fw(134) - 2) return [0, 1, 3].includes(i) ? 1 : 0;
  if (f < fw(211) - 2) { if (i === 0) return f < fw(195) ? 1 : 0; const orden = [3, 1]; const k = orden.indexOf(i); if (k < 0) return 0; return f < APAGON() + k * 26 ? 1 : 0; } // la del cuarto de María se apaga en «cuarto…»
  return i === 1 ? 1 : 0; // después: solo la cocina (alguien sigue ahí)
};

const PLANOS: Plano[] = [
  // 0 · Hinterkaifeck: el crimen sin resolver más famoso de Alemania.  (la granja de noche desde el camino; letrero CASO HINTERKAIFECK)
  { w: 0, lugar: "afuera", foco: 24, cInf: 5, ini: c([7.4, 4.6, -23.5], [-2.5, 2.4, -4.5], 48), fin: c([6.6, 4.0, -20.5], [-2.5, 2.4, -4.5], 46), hacer: () => {} },
  // 1 · Durante tres días, el asesino vivió en la granja...  (la casa de noche; una sombra pasa por la ventana prendida)
  { w: 9, lugar: "afuera", foco: 10, cInf: 6, ini: c([-3.2, 1.7, -15.5], [-3.4, 1.6, -4.5], 44), fin: c([-3.3, 1.65, -12.0], [-3.4, 1.55, -4.5], 42), hacer: ({ f, m }) => { m.sombraVentana(f, 1, fw(9) + 8, fw(9) + 70); } },
  // 2 · con la familia muerta.  (el portón del granero, entreabierto y oscuro)
  { w: 18, lugar: "afuera", foco: 6, cInf: 6, ini: c([7.8, 1.9, -15.5], [4, 2.2, -4.5], 46), fin: c([6.6, 1.75, -12.0], [4, 2.0, -4.5], 44), hacer: ({ m }) => { m.porton(0.22); m.luz(5, 3.2, -8, 4, "#b8c8ff"); } },
  // 2 · Hinterkaifeck era una granja aislada, rodeada de bosque.  (desde arriba: la granja sola en la nieve, el bosque alrededor)
  { w: 22, lugar: "afuera", foco: 30, cInf: 5, ini: c([-26, 26, -34], [0, 1, 0], 42), fin: c([-23, 24, -30], [0, 1, 0], 40), hacer: () => {} },
  // 3 · Ahí vivía Andreas Gruber con su esposa,
  { w: 30, lugar: "afuera", foco: 4, cInf: 7, ini: c([-6.0, 1.5, -9.8], [-6.0, 1.25, -5.3], 44), fin: c([-6.0, 1.5, -8.9], [-6.0, 1.25, -5.3], 42), hacer: ({ f, m }) => { m.familia(f, false); } },
  // 4 · su hija Viktoria y los dos hijos de ella.
  { w: 37, lugar: "afuera", foco: 4, cInf: 7, ini: c([-3.9, 1.35, -9.4], [-3.9, 1.05, -5.6], 44), fin: c([-3.9, 1.3, -8.6], [-3.9, 1.0, -5.6], 42), hacer: ({ f, m }) => { m.familia(f, true); } },
  // 5 · Meses antes, la sirvienta renunció.  (se va por el camino con su bulto; voltea a ver la casa)
  { w: 46, lugar: "afuera", foco: 6, cInf: 6, ini: c([-19.2, 1.55, -8.9], [-14.0, 1.2, -7.0], 46), fin: c([-19.6, 1.55, -8.9], [-15.8, 1.2, -7.3], 46), hacer: ({ f, m }) => { m.seVa(f); } },
  // 6 · Según contaron después, decía que oía ruidos en el ático.  (en la cocina, viendo el techo)
  { w: 51, lugar: "cocina", foco: 1.8, cInf: 8, ini: c(CO(0.7, 0.95, -2.15), CO(-1.9, 1.5, 0.3), 54), fin: c(CO(0.6, 0.9, -2.0), CO(-1.9, 1.65, 0.3), 52), hacer: ({ f, m }) => { m.viejaTecho(f); } },
  // 7 · A finales de marzo, Andreas les contó a sus vecinos algo raro.  (en la cerca del camino)
  { w: 61, lugar: "afuera", foco: 4, cInf: 7, ini: c([-12.2, 1.55, -15.2], [-12.1, 1.35, -10.2], 50), fin: c([-12.2, 1.5, -14.4], [-12.1, 1.35, -10.2], 48), hacer: ({ f, m }) => { m.cerca(f); } },
  // 8 · En la nieve había huellas.  (de cerca, bajito)
  { w: 73, lugar: "afuera", foco: 2.5, cInf: 8, ini: c([7.9, 0.95, -17.2], [9.0, 0, -12.5], 46), fin: c([8.2, 0.8, -15.8], [9.1, 0, -11.5], 44), hacer: ({ m }) => { m.luz(8.6, 2.5, -14, 6, "#b8c8ff"); } },
  // 9 · Venían del bosque hasta la casa...  (la cámara sigue las huellas desde el bosque hasta la granja)
  { w: 78, lugar: "afuera", foco: 8, cInf: 6, ini: c([7.4, 1.8, -28.5], [9.6, 0.8, -4.5], 48), fin: c([8.6, 1.7, -16.5], [10, 0.9, -4.5], 46), hacer: () => {} },
  // 10 · y ninguna regresaba.  (la puertita con el candado roto; ahí terminan)
  { w: 84, lugar: "afuera", foco: 2.6, cInf: 7, ini: c([8.9, 1.35, -9.4], [9.9, 0.8, -4.6], 46), fin: c([9.2, 1.25, -8.2], [9.9, 0.8, -4.6], 44), hacer: ({ m }) => { m.luz(9.6, 2.2, -6.5, 5, "#b8c8ff"); } },
  // 11 · Esa noche, la familia oyó pasos arriba, en el ático.  (en la mesa, todos viendo el techo)
  { w: 87, lugar: "cocina", foco: 2.2, cInf: 7, sacude: () => 0.003, ini: c(CO(0, 1.3, -1.95), CO(0, 1.25, 1.0), 54), fin: c(CO(0, 1.25, -1.6), CO(0, 1.3, 1.0), 52), hacer: ({ f, m }) => { m.mesaTecho(f); } },
  // 12 · Andreas subió con una lámpara.  (sale por la trampilla del ático con el farol)
  { w: 97, lugar: "atico", foco: 2.5, cInf: 7, ini: c(AT(-1.8, 1.3, -1.5), AT(-4, 0.8, 1.2), 50), fin: c(AT(-2.1, 1.25, -1.1), AT(-4, 0.9, 1.2), 48), hacer: ({ f, m }) => { m.subeAtico(f); } },
  // 13 · No había nadie.  (desde el rincón oscuro, detrás de la paja: él busca con el farol)
  { w: 102, lugar: "atico", foco: 8, cInf: 6, sacude: () => 0.004, ini: c(AT(3.6, 1.0, -2.4), AT(-3.0, 1.2, 0.6), 44), fin: c(AT(3.4, 1.0, -2.3), AT(-3.0, 1.2, 0.6), 42), hacer: ({ f, m }) => { m.buscaAtico(f); } },
  // 14 · Después apareció en la granja un periódico de Múnich.  (el periódico en la mesa)
  { w: 105, lugar: "cocina", foco: 0.6, cInf: 9, ini: c(CO(-0.35, 1.35, -0.3), CO(-0.35, 0.76, 0.25), 40), fin: c(CO(-0.35, 1.2, -0.12), CO(-0.35, 0.76, 0.25), 40), hacer: ({ m }) => { m.h.periodico.visible = true; } },
  // 15 · Nadie en la casa lo había comprado.  (Andreas con el periódico en la mano; Viktoria lo ve)
  { w: 114, lugar: "cocina", foco: 2.4, cInf: 7, ini: c(CO(-0.9, 1.5, 1.35), CO(-0.95, 1.3, -1.3), 46), fin: c(CO(-0.9, 1.45, 1.05), CO(-0.95, 1.3, -1.3), 44), hacer: ({ f, m }) => { m.periodicoMano(f); } },
  // 16 · El 31 de marzo llegó una sirvienta nueva, María.  (llega a la puerta con su bulto)
  { w: 121, lugar: "afuera", foco: 5, cInf: 7, ini: c([-6.5, 1.6, -12.5], [-6.5, 1.2, -6.0], 44), fin: c([-6.4, 1.55, -11.2], [-6.4, 1.2, -6.0], 42), hacer: ({ f, m }) => { m.llegaMaria(f); } },
  // 17 · Era su primer día.  (María en la cocina, junto a la estufa)
  { w: 130, lugar: "cocina", foco: 1.9, cInf: 8, ini: c(CO(0.3, 1.5, -1.6), CO(1.1, 1.25, 1.45), 46), fin: c(CO(0.42, 1.48, -1.3), CO(1.1, 1.25, 1.45), 44), hacer: ({ f, m }) => { m.mariaCocina(f); } },
  // 18 · Esa misma noche, alguien los fue llevando al granero, uno por uno...  (la granja de noche: las ventanas se apagan)
  { w: 134, lugar: "afuera", foco: 14, cInf: 5, ini: c([-14, 3.2, -22], [-2, 2.5, 0], 44), fin: c([-13, 3.1, -19.5], [-2, 2.5, 0], 42), hacer: () => {} },
  // 18b · y los mató a golpes con un azadón.  (en el granero: la sombra del asesino con el azadón en alto, en la pared)
  { w: 146, lugar: "granero", foco: 5.0, cInf: 7, sacude: () => 0.002, ini: c(GA(-0.6, 1.8, 0.4), GA(-6, 2.1, 0.6), 52), fin: c(GA(-1.4, 1.8, 0.5), GA(-6, 2.1, 0.6), 50), hacer: ({ f, k, m }) => { m.sombraAzadon(f, k); } },
  // 18c · Andreas, su esposa, Viktoria... y la pequeña Cäzilia, de siete años.  (las cuatro víctimas, una por una, frente a la casa)
  { w: 154, lugar: "afuera", foco: 3.4, cInf: 7, ease: (k) => suave(0, 0.7, k), ini: c([-6.8, 1.3, -8.8], [-6.8, 1.05, -5.5], 46), fin: c([-4.7, 1.2, -8.8], [-4.7, 1.0, -5.5], 46), hacer: ({ f, m }) => { m.victimas(f); } },
  // 18d · La autopsia reveló algo peor: la niña siguió viva varias horas, tirada en la paja... arrancándose el cabello.  (su listón y mechones de pelo en la paja con sangre)
  { w: 165, lugar: "granero", foco: 1.15, cInf: 8, ini: c(GA(3.2, 1.05, -2.8), GA(3.0, 0, -1.8), 44), fin: c(GA(3.15, 0.9, -2.55), GA(3.0, 0, -1.8), 42), hacer: ({ m }) => { m.cabello(); } },
  // 18e · Después, el asesino entró a la casa.  (la sombra camina hacia la puerta de la casa, de espaldas)
  { w: 183, lugar: "afuera", foco: 5, cInf: 7, ini: c([-6.5, 1.6, -12.5], [-6.5, 1.2, -6.0], 44), fin: c([-6.4, 1.55, -11.2], [-6.4, 1.2, -6.0], 42), hacer: ({ f, m }) => { m.vaALaCasa(f); } },
  // 18f · Mató a María en su cuarto...  (su ventana se apaga)
  { w: 190, lugar: "afuera", foco: 3.5, cInf: 7, ini: c([-8.8, 1.5, -8.2], [-8.8, 1.5, -4.5], 40), fin: c([-8.8, 1.5, -7.3], [-8.8, 1.5, -4.5], 38), hacer: ({ f, m }) => { m.ventana(0, f < fw(195) ? 1 : 0); } },
  // 18g · y al pequeño Josef, de dos años, en su cuna.  (la cuna vacía, a oscuras)
  { w: 196, lugar: "cocina", foco: 2.0, cInf: 8, ini: c(CO(-0.7, 1.35, -0.7), CO(-2.25, 0.45, 1.0), 46), fin: c(CO(-1.1, 1.2, -0.35), CO(-2.25, 0.45, 1.0), 44), hacer: ({ f, m }) => { m.cunaVacia(f); } },
  // 18h · Tapó los cuerpos con paja.  (el granero: montones de paja, botas que se asoman, sangre y el azadón tirado)
  { w: 206, lugar: "granero", foco: 4.4, cInf: 7, ini: c(GA(1.1, 3.2, -3.75), GA(-0.4, 0.0, -0.1), 60), fin: c(GA(0.95, 2.95, -3.5), GA(-0.4, 0.0, -0.1), 58), hacer: ({ m }) => { m.tapados(); } },
  // 21 · Pero eso no fue lo más extraño.  (la cocina a oscuras; la silla echada para atrás)
  { w: 211, lugar: "cocina", foco: 2.2, cInf: 7, ini: c(CO(1.9, 1.6, -1.95), CO(0.2, 0.9, 0.4), 50), fin: c(CO(1.3, 1.5, -1.4), CO(0.2, 0.9, 0.4), 48), hacer: ({ m }) => { m.cocinaOscura(); } },
  // 22 · Los días siguientes, los vecinos vieron humo saliendo de la chimenea.  (desde el camino: dos vecinos ven el humo)
  { w: 218, lugar: "afuera", foco: 6, cInf: 6, ini: c([-31.4, 2.3, -11.3], [-6, 3.4, -4.5], 48), fin: c([-31.0, 2.3, -11.2], [-6, 3.8, -4.5], 46), hacer: ({ f, m }) => { m.vecinosHumo(f); } },
  // 23 · Alguien les daba de comer a los animales...  (en el granero: las vacas comen; una sombra de espaldas)
  { w: 229, lugar: "granero", foco: 3.2, cInf: 7, ini: c(GA(-1.7, 1.65, -2.6), GA(0.5, 1.0, 1.4), 52), fin: c(GA(-1.45, 1.6, -2.2), GA(0.5, 1.0, 1.4), 50), hacer: ({ f, m }) => { m.daComer(f); } },
  // 24 · y comía en la cocina.  (la sombra sentada a la mesa, de espaldas: pan, taza con vapor)
  { w: 237, lugar: "cocina", foco: 1.9, cInf: 8, ini: c(CO(1.7, 1.55, -2.25), CO(0.15, 0.9, 0.2), 56), fin: c(CO(1.55, 1.5, -2.05), CO(0.15, 0.9, 0.2), 54), hacer: ({ f, m }) => { m.come(f); } },
  // 25 · El asesino se quedó a vivir ahí... con ellos.  (afuera: la sombra parada en la ventana de la cocina)
  { w: 242, lugar: "afuera", foco: 8, cInf: 6, ini: c([-3.0, 1.6, -13.5], [-3.4, 1.5, -4.5], 42), fin: c([-3.1, 1.6, -9.8], [-3.4, 1.5, -4.5], 38), hacer: ({ f, m }) => { m.sombraVentana(f, 1, -1, -1); } },
  // 26 · El 4 de abril, como nadie había visto a la familia en días,  (de día: tres vecinos caminan hacia la granja)
  { w: 251, lugar: "afuera", dia: true, foco: 5, cInf: 7, ini: c([-7.4, 1.55, -7.4], [-13, 1.25, -13], 46), fin: c([-7.7, 1.55, -7.9], [-12.5, 1.25, -12.5], 46), hacer: ({ f, m }) => { m.vecinosVan(f); } },
  // 27 · los vecinos entraron...  (desde adentro del granero: el portón se abre; ellos, a contraluz)
  { w: 264, lugar: "granero", dia: true, foco: 4.5, cInf: 7, ini: c(GA(0.2, 1.5, -0.6), GA(0, 1.4, -5), 50), fin: c(GA(0.1, 1.5, -1.3), GA(0, 1.4, -5), 48), hacer: ({ f, m }) => { m.abren(f); } },
  // 28 · y los encontraron.  (sus caras)
  { w: 267, lugar: "granero", dia: true, foco: 1.9, cInf: 8, sacude: () => 0.003, ini: c(GA(0, 1.55, -1.3), GA(0, 1.5, -3.4), 50), fin: c(GA(0, 1.55, -1.6), GA(0, 1.5, -3.4), 48), hacer: ({ f, m }) => { m.caras(f); } },
  // 29 · La policía interrogó a más de cien personas.
  { w: 270, lugar: "oficina", foco: 2.0, cInf: 7, ini: c(OF(0.95, 1.5, -1.7), OF(0, 1.0, 0.8), 48), fin: c(OF(0.8, 1.45, -1.35), OF(0, 1.0, 0.8), 46), hacer: ({ f, m }) => { m.interroga(f); } },
  // 30 · Nunca encontró al culpable.  (el expediente: SIN RESOLVER)
  { w: 278, lugar: "oficina", foco: 0.45, cInf: 9, ini: c(OF(0.05, 1.32, 0.5), OF(0.05, 0.79, 0.92), 42), fin: c(OF(0.05, 1.25, 0.58), OF(0.05, 0.79, 0.92), 42), hacer: () => {} },
  // 31 · Un año después, derribaron la granja.  (lo que quedó: escombros con nieve y la chimenea sola)
  { w: 282, lugar: "afuera", dia: true, foco: 18, cInf: 5, ini: c([-18, 5, -21], [0, 1, 0], 42), fin: c([-16, 4.6, -18.5], [0, 1, 0], 42), hacer: ({ m }) => { m.derribada(); } },
  // 31b · Al derribarla, encontraron el azadón escondido adentro.  (el azadón entre los escombros con nieve)
  { w: 288, lugar: "afuera", dia: true, foco: 2.1, cInf: 8, ini: c([-5.4, 1.2, -3.9], [-4.7, 0.18, -2.2], 42), fin: c([-5.3, 1.0, -3.55], [-4.7, 0.18, -2.2], 40), hacer: ({ m }) => { m.derribada(); m.h.azadonR.visible = true; } },
  // 31c · Los cráneos de las víctimas se mandaron a videntes en Múnich... y se perdieron en la guerra.  (la caja «MÜNCHEN» en la oficina)
  { w: 295, lugar: "oficina", foco: 1.6, cInf: 8, ini: c(OF(0.5, 1.1, -2.0), OF(1.4, 0.3, -0.7), 46), fin: c(OF(0.75, 0.95, -1.75), OF(1.4, 0.3, -0.7), 44), hacer: ({ m }) => { m.h.cajaM.visible = true; } },
  // 32 · Hoy, cien años después, nadie sabe quién estaba  (el campo vacío con la cruz)
  { w: 312, lugar: "afuera", foco: 5, cInf: 7, ini: c([1.0, 1.4, -7.0], [1.0, 1.4, -1.0], 46), fin: c([1.0, 1.35, -5.6], [1.0, 1.45, -1.0], 44), hacer: ({ m }) => { m.hoy(); } },
  // 33 · en ese ático... ni cuánto tiempo llevaba ahí.  (el ático a oscuras: la cámara avanza hacia el rincón; ahí, alguien)
  { w: 320, lugar: "atico", foco: 6, cInf: 6, ini: c(AT(-2.0, 1.5, 0.6), AT(6.0, 1.1, 0.6), 46), fin: c(AT(2.4, 1.45, 0.6), AT(6.0, 1.1, 0.6), 44), hacer: ({ f, m }) => { m.rincon(f); } },
  // 34 · ¿Tú qué crees que pasó?  (más cerca de la silueta)
  { w: 328, lugar: "atico", foco: 2.4, cInf: 7, ini: c(AT(3.3, 1.45, 0.6), AT(6.0, 1.2, 0.6), 46), fin: c(AT(3.7, 1.45, 0.6), AT(6.0, 1.2, 0.6), 44), hacer: ({ f, m }) => { m.rincon(f); } },
];
const inicioPlano = (i: number) => (i === 0 ? 0 : fw(PLANOS[i].w) - 2);
export const planoEn = (f: number) => { let i = 0; while (i + 1 < PLANOS.length && f >= inicioPlano(i + 1)) i++; return i; };

// ------------------------------------------------------------------ mundo (estado por cuadro)
class Mundo {
  h = crearEscenario();
  cartas = Object.fromEntries(Object.entries(CARTAS).map(([k, [a, alto]]) => [k, new Tarjeta(a as Aspecto, alto)])) as Record<Quien, Tarjeta>;
  f = 0;
  private cam!: THREE.PerspectiveCamera;
  constructor() { for (const c of Object.values(this.cartas)) { this.h.raiz.add(c.grupo); c.sombraLarga.visible = false; } }
  reiniciar(cam: THREE.PerspectiveCamera) {
    this.cam = cam;
    for (const c of Object.values(this.cartas)) { c.grupo.visible = false; c.contacto.visible = true; c.grupo.rotation.set(0, 0, 0); }
    const h = this.h;
    h.luzExtra.intensity = 0; h.luzExtra2.intensity = 0; h.adentro.position.z = 0.2; h.adentro.scale.z = 1;
    h.portonI.rotation.y = 0; h.portonD.rotation.y = 0; h.puertita.rotation.y = -0.12;
    h.granja.visible = true; h.ruinas.visible = false; h.cruz.visible = false; h.huellas.forEach((x) => (x.visible = true)); h.humoOn.v = 1;
    h.periodico.visible = false; h.comida.visible = false; h.luzC.intensity = 4; h.haloC.visible = true; h.vidrioC.visible = true;
    h.farolMano.visible = false; h.luzMano.intensity = 0; h.farolMano2.visible = false;
    h.hojasG.forEach((g) => (g.rotation.y = 0));
    h.crimenG.visible = false; h.cabelloG.visible = false; h.sombraMuro.visible = false; h.cuna.visible = false; h.azadonR.visible = false; h.cajaM.visible = false;
    for (let i = 0; i < VENTANAS.length; i++) this.ventana(i, ventanasEn(this.f, i));
  }
  /** tarjeta que mira a la cámara; `mira` (±x, ±z): hacia dónde ve la persona (si la cámara queda detrás, de espaldas) */
  ver(quien: Quien, pos: V3, pose: Partial<Pose>, mira?: [number, number], giro = 0) {
    const c = this.cartas[quien], cp = this.cam.position;
    c.grupo.visible = true; c.grupo.position.set(...pos);
    c.grupo.rotation.set(0, Math.atan2(cp.x - pos[0], cp.z - pos[2]), giro);
    const espalda = mira ? (cp.x - pos[0]) * mira[0] + (cp.z - pos[2]) * mira[1] < 0 : false;
    c.dibujar({ ...POSE, parpadeo: parpadea(this.f, quien.length * 7 + pos[0] * 3), ...pose, ...(espalda ? { vista: "espalda" as const } : {}) });
  }
  ventana(i: number, on: number) {
    const v = this.h.ventanas[i];
    if (on > 0) { v.mVidrio.color.set("#ffd090"); v.mVidrio.transparent = true; v.mVidrio.opacity = 0.35; v.fondo.visible = true; (v.halo.material as THREE.SpriteMaterial).opacity = 0.35 * on; }
    else { v.mVidrio.color.set("#141c2a"); v.mVidrio.transparent = false; v.mVidrio.opacity = 1; v.fondo.visible = false; (v.halo.material as THREE.SpriteMaterial).opacity = 0; }
  }
  luz(x: number, y: number, z: number, i: number, color = "#ffc890") { const l = this.h.luzExtra; l.position.set(x, y, z); l.intensity = i; l.color.set(color); }
  farol(p: V3, i: number) { const h = this.h; h.farolMano.visible = true; h.farolMano.position.set(...p); h.luzMano.intensity = i; }

  // ---------------- afuera
  /** una sombra pasa (o se queda parada) detrás de una ventana prendida de abajo */
  sombraVentana(f: number, i: number, a: number, b: number) {
    const [x] = VENTANAS[i]; this.ventana(i, 1);
    const u = a < 0 ? 0.5 : suave(a, b, f), xx = a < 0 ? x : lerp(x - 1.0, x + 1.0, u);
    if (a >= 0 && (u <= 0 || u >= 1)) return;
    this.ver("sombra", [xx, 0.12, G.z0 + 0.22], { ...SILUETA, ...(a < 0 ? {} : CAMINA(f, 0)) });
    this.cartas.sombra.contacto.visible = false;
  }
  porton(a: number) { this.h.portonI.rotation.y = -a; this.h.portonD.rotation.y = a * 0.9; }
  /** la familia frente a la casa (Andreas y su esposa; luego Viktoria con el bebé y la niña) */
  familia(f: number, hijos: boolean) {
    this.luz(PUERTA_CASA.x, 2.2, G.z0 - 1.2, 3.5);
    if (!hijos) {
      this.ver("andreas", [-6.55, 0, -5.4], { ...CALIDA, boca: "linea", mirarX: 0.2, brazoIzq: [0.3, 0.2], brazoDer: [0.2, 0.2] });
      this.ver("cazilia", [-5.5, 0, -5.3], { ...CALIDA, boca: "linea", mirarX: -0.3, brazoIzq: [0.3, -0.6], brazoDer: [0.3, -0.6] });
    } else {
      this.ver("viktoria", [-4.25, 0, -5.6], { ...CALIDA, ...BEBE, boca: "linea", mirarX: 0.3 });
      this.ver("nina", [-3.5, 0, -5.85], { ...CALIDA, boca: "linea", mirarX: -0.4, mirarY: 0.3, brazoIzq: [0.4, 0.3] });
    }
    void f;
  }
  seVa(f: number) {
    const u = Math.min(1, (f - fw(46) + 2) / (fw(51) - fw(46)));
    this.ver("vieja", [lerp(-12.5, -16.5, u), 0, lerp(-7.0, -7.5, u)], { ...NOCHE, ...CAMINA(f, 0), abraza: "#7a6a50", boca: "triste", giro: -0.6, mirarX: 0.8, cejasMiedo: 0.5 }, [-1, 0]);
  }
  cerca(f: number) {
    this.ver("andreas", [-12.1, 0, -10.3], { ...NOCHE, boca: "abierta", bocaAbre: habla(f, 65, 72), mirarX: 0.4, brazoDer: [1.2 + 0.2 * Math.sin(f * 0.2), -0.3], cejasMiedo: 0.4 });
    this.ver("v1", [-13.3, 0, -10.0], { ...NOCHE, boca: "linea", mirarX: 0.6, brazoIzq: [0.2, 0.2] });
    this.ver("v2", [-10.9, 0, -10.6], { ...NOCHE, boca: "o", mirarX: -0.6, brazoIzq: [0.3, -0.5], brazoDer: [0.3, -0.5] });
    this.luz(-12, 3, -12.5, 3, "#b8c8ff");
  }
  /** «alguien los mató»: el farol adentro del granero, y una sombra que pasa por la rendija */
  granEnLuz(f: number) {
    const parpadeo = [fw(143), fw(146) - 4, fw(147), fw(149)].some((t) => f >= t && f < t + 3) ? 0.2 : 1;
    this.h.adentro.scale.z = 5.7 / 8.4; this.h.adentro.position.z = 1.35; // lo oscuro empieza 3 m adentro: hay lugar detrás de las hojas (abren hacia adentro)
    this.luz(4, 1.6, G.z0 + 2.6, 6 * parpadeo, "#ffb870");
    const u = ((f - fw(143)) % 40) / 40; if (u < 0.6) this.ver("sombra", [lerp(3.55, 4.45, u / 0.6), 0, G.z0 + 2.0], { ...SILUETA, ...CAMINA(f, 0), borde: "#ffb870" });
    this.cartas.sombra.contacto.visible = false;
  }
  vecinosHumo(f: number) {
    this.ver("v1", [-26.08, 0, -10.24], { ...NOCHE, boca: "linea", mirarY: 0.5 }, [1, 0.27]);
    this.ver("v2", [-25.71, 0, -9.31], { ...NOCHE, boca: "linea", mirarY: 0.5, brazoDer: [1.6, 0.4] }, [1, 0.27]);
    void f;
  }
  vecinosVan(f: number) {
    const u = Math.min(1, (f - fw(251) + 2) / (fw(264) - fw(251)));
    const base: V3 = [lerp(-15.5, -11.2, u), 0, lerp(-15.5, -11.6, u)];
    (["v1", "v2", "v3"] as Quien[]).forEach((q, k) => this.ver(q, [base[0] + [0, -1.0, 0.9][k], 0, base[2] + [0, 0.7, -0.8][k]], { ...DIA, ...CAMINA(f, k * 1.3), ...MIEDO(f, 0.15), boca: "linea", mirarX: 0.2 }, [1, 1]));
  }
  derribada() { const h = this.h; h.granja.visible = false; h.ruinas.visible = true; h.huellas.forEach((x) => (x.visible = false)); h.humoOn.v = 0; }
  hoy() { const h = this.h; h.granja.visible = false; h.ruinas.visible = false; h.cruz.visible = true; h.huellas.forEach((x) => (x.visible = false)); h.humoOn.v = 0; this.luz(1, 2.5, -3.5, 3, "#b8c8ff"); }
  llegaMaria(f: number) {
    const u = Math.min(1, (f - fw(121) + 2) / (fw(128) - fw(121)));
    this.ver("maria", [lerp(-8.6, -6.3, u), 0, lerp(-9.6, -6.0, u)], { ...CALIDA, ...(u < 1 ? CAMINA(f, 0) : {}), abraza: "#6a4a2a", boca: "amable", mirarY: 0.2 }, [0.5, 1]);
    this.luz(PUERTA_CASA.x, 2.2, G.z0 - 1.2, 3);
  }
  /** las cuatro víctimas del granero, una por una (aparecen en su nombre) */
  victimas(f: number) {
    this.luz(-5.6, 2.4, G.z0 - 1.6, 3.2);
    const triste = { boca: "linea" as const, cejasMiedo: 0.3 };
    if (f >= fw(154) - 3) this.ver("andreas", [-6.85, 0, -5.5], { ...CALIDA, ...triste, brazoIzq: [0.3, 0.2], brazoDer: [0.2, 0.2] });
    if (f >= fw(155) - 3) this.ver("cazilia", [-6.1, 0, -5.45], { ...CALIDA, ...triste, brazoIzq: [0.3, -0.6], brazoDer: [0.3, -0.6] });
    if (f >= fw(157) - 3) this.ver("viktoria", [-5.35, 0, -5.5], { ...CALIDA, ...triste });
    if (f >= fw(159) - 3) this.ver("nina", [-4.6, 0, -5.6], { ...CALIDA, ...triste, mirarY: 0.3, brazoIzq: [0.4, 0.3] });
  }
  vaALaCasa(f: number) {
    const u = Math.min(1, (f - fw(183) + 2) / (fw(189) - fw(183)));
    this.ver("sombra", [lerp(-8.4, -6.3, u), 0, lerp(-9.4, -5.2, u)], { ...SILUETA, ...(u < 1 ? CAMINA(f, 0) : {}) });
    this.luz(PUERTA_CASA.x, 2.2, G.z0 - 1.2, 2.2, "#b8c8ff");
  }
  cunaVacia(f: number) { this.cocinaOscura(); this.h.cuna.visible = true; this.h.cuna.rotation.x = 0.03 * Math.sin(f * 0.08); this.luz(COCINA.x - 1.6, 1.4, COCINA.z + 0.2, 2.0, "#8aa4e0"); }
  // ---------------- la cocina
  viejaTecho(f: number) { this.ver("vieja", CO(-1.9, 0, 0.3), { ...CALIDA, ...MIEDO(f, 0.3), boca: "o", mirarY: 0.95, mirarX: 0.2, brazoIzq: [0.6, 1.4], hombros: 0.4 }); }
  mesaTecho(f: number) {
    const arriba = { mirarY: 0.95, boca: "o" as const };
    this.ver("andreas", SENTADO("andreas", COCINA.x - 0.55, COCINA.z + banca), { ...CALIDA, ...MIEDO(f, 0.2), ...arriba, sentado: 1, mirarX: 0.2 });
    this.ver("cazilia", SENTADO("cazilia", COCINA.x + 0.05, COCINA.z + banca), { ...CALIDA, ...MIEDO(f, 0.3), ...arriba, sentado: 1, hombros: 0.5 });
    this.ver("viktoria", SENTADO("viktoria", COCINA.x + 0.65, COCINA.z + banca), { ...CALIDA, ...MIEDO(f, 0.3), ...arriba, ...BEBE, sentado: 1 });
    this.ver("nina", CO(1.45, 0, 0.9), { ...CALIDA, ...MIEDO(f, 0.4), ...arriba, abraza: "#8a6a50" });
  }
  periodicoMano(f: number) {
    this.ver("andreas", CO(-0.6, 0, -1.3), { ...CALIDA, sostiene: "hoja", boca: "linea", mirarY: -0.3, cejasMiedo: 0.5, brazoDer: [0.9, 1.2] });
    this.ver("viktoria", CO(-1.45, 0, -1.5), { ...CALIDA, boca: "o", mirarX: 0.6, mirarY: -0.2, cejasMiedo: 0.5 });
    void f;
  }
  mariaCocina(f: number) { this.ver("maria", CO(1.1, 0, 1.45), { ...CALIDA, boca: "amable", mirarX: -0.3, brazoIzq: [0.6, 0.9], brazoDer: [0.4, 0.8] }); void f; }
  cocinaOscura() { const h = this.h; h.luzC.intensity = 0; h.haloC.visible = false; h.vidrioC.visible = false; this.luz(COCINA.x - 1.0, 1.6, COCINA.z - 1.6, 2.2, "#8aa4e0"); }
  come(f: number) {
    const h = this.h; h.comida.visible = true; h.luzC.intensity = 1.6;
    (h.vapor.material as THREE.SpriteMaterial).opacity = 0.35 + 0.1 * Math.sin(f * 0.2); h.vapor.position.y = 0.18 + 0.03 * Math.sin(f * 0.13);
    this.ver("sombra", SENTADO("sombra", COCINA.x + 0.3, COCINA.z + MESA.z - MESA.ancho / 2 - 0.3), { ...SILUETA, sentado: 1, borde: "#ffc890", cabezaX: 0.03 * Math.sin(f * 0.15) });
  }
  // ---------------- el ático
  subeAtico(f: number) {
    const T = ATICO.trampa, u = suave(fw(97) - 4, fw(101), f), y = lerp(-1.1, 0, u);
    this.ver("andreas", AT(T.x, y, T.z), { ...CALIDA, ...MIEDO(f, 0.2), boca: "linea", mirarX: 0.5, brazoDer: [1.3, 0.6] });
    this.cartas.andreas.contacto.visible = u > 0.95;
    this.farol(AT(T.x - 0.42, y + 1.12, T.z - 0.15), 2.5);
  }
  buscaAtico(f: number) {
    const mira = Math.sin((f - fw(102)) * 0.06);
    this.ver("andreas", AT(-3.0, 0, 0.6), { ...CALIDA, ...MIEDO(f, 0.2), boca: "linea", mirarX: mira, brazoDer: [2.0, 0.3], giro: 0.3 * mira });
    this.farol(AT(-3.0 - 0.45, 1.6, 0.45), 4.5);
  }
  rincon(f: number) {
    this.ver("sombra", AT(6.0, 0, 0.6), { ...SILUETA, borde: "#7088b8", respira: 0.3 });
    this.luz(ATICO.x + 4.6, 2.6, ATICO.z + 1.4, 3.2, "#7a94d0"); this.h.luzExtra2.position.set(ATICO.x + 6.6, 1.6, ATICO.z - 0.6); this.h.luzExtra2.intensity = 1.6; this.h.luzExtra2.color.set("#7088c0");
    this.cartas.sombra.contacto.visible = false; void f;
  }
  // ---------------- el granero
  daComer(f: number) { this.ver("sombra", GA(0.4, 0, 0.9), { ...SILUETA, borde: "#ffc890", brazoIzq: [0.8, 0.6], brazoDer: [0.8, 0.6], cuerpoX: 0.05 * Math.sin(f * 0.1) }); }
  abren(f: number) {
    const a = suave(fw(266) - 6, fw(267), f); this.h.hojasG.forEach((g, k) => (g.rotation.y = (k ? -1 : 1) * -1.4 * a));
    (["v1", "v2", "v3"] as Quien[]).forEach((q, k) => this.ver(q, GA([0, -0.9, 0.85][k], 0, GRANERO.z0 - 1.0 - [0, 0.4, 0.5][k]), { ...DIA, luzX: 0, borde: "#ffffff", ...MIEDO(f, 0.2), boca: "o" }));
    this.luz(GRANERO.x, 2.0, GRANERO.z0 + 1.0, 6 * a, "#dfe6f8");
  }
  caras(f: number) {
    this.h.hojasG.forEach((g, k) => (g.rotation.y = (k ? -1 : 1) * -1.4));
    (["v1", "v2", "v3"] as Quien[]).forEach((q, k) => this.ver(q, GA([0, -0.62, 0.6][k], 0, GRANERO.z0 + 0.7 + [0, 0.15, 0.2][k]), { ...DIA, ...MIEDO(f, 0.6), boca: (["grito", "dientes", "o"] as const)[k], lagrimas: k === 2 ? 0.5 : 0, ojos: 1.15, pupila: 0.16, mirarY: -0.4, brazoIzq: k === 1 ? [1.0, 1.9] : [0.3, 0.3] }));
    this.luz(GRANERO.x, 1.8, GRANERO.z0 + 0.6, 4, "#dfe6f8");
  }
  sombraAzadon(f: number, k: number) {
    const sm = this.h.sombraMuro; sm.visible = true; const u = suave(0, 1, k * 1.4); sm.position.y = 1.85 + 0.15 * u; sm.scale.setScalar(1.25 + 0.2 * u);
    this.luz(GRANERO.x - 2.2, 1.5, GRANERO.z + 0.7, 7, "#ffb870"); void f;
  }
  tapados() { this.h.crimenG.visible = true; this.luz(GRANERO.x + 0.5, 2.4, GRANERO.z - 1.2, 2.5, "#ffc890"); }
  cabello() { this.h.cabelloG.visible = true; this.luz(GRANERO.x + 3.2, 1.2, GRANERO.z - 2.2, 1.6, "#ffc890"); }
  // ---------------- la oficina
  interroga(f: number) {
    this.ver("policia", SENTADO("policia", OFICINA.x + ESCRITORIO.x, OFICINA.z + ESCRITORIO.z + 0.75, 0.485), { ...CALIDA, sentado: 1, boca: "abierta", bocaAbre: habla(f, 271, 277), mirarY: -0.1, cejasMiedo: -0.2, cejasAlto: -0.3 });
    this.ver("interrogado", SENTADO("interrogado", OFICINA.x + ESCRITORIO.x + 0.05, OFICINA.z + ESCRITORIO.z - 0.75, 0.485), { ...CALIDA, sentado: 1 }, [0, 1]);
  }

  luces(f: number, pl: Plano) {
    const h = this.h, Lg = pl.lugar, t = f / FPS;
    h.animar(t);
    h.afuera.visible = Lg === "afuera"; h.cocina.visible = Lg === "cocina"; h.atico.visible = Lg === "atico"; h.granero.visible = Lg === "granero"; h.oficina.visible = Lg === "oficina";
    const dia = !!pl.dia;
    h.amb.intensity = Lg === "afuera" ? (dia ? 0.9 : 0.45) : Lg === "atico" ? 0.12 : Lg === "granero" ? (dia ? 0.4 : 0.15) : Lg === "oficina" ? 0.3 : 0.25;
    h.hemi.intensity = Lg === "afuera" ? (dia ? 1.0 : 0.6) : Lg === "atico" ? 0.05 : Lg === "granero" ? (dia ? 0.4 : 0.12) : Lg === "oficina" ? 0.25 : 0.2;
    h.luna.intensity = Lg === "afuera" ? (dia ? 1.5 : 1.3) : 0;
    h.luna.color.set(dia ? "#e4eaf6" : "#aec2ee");
    h.luzG.intensity = Lg === "granero" ? (dia ? 1.0 : 3) : 0;
    h.luzAtico.intensity = Lg === "atico" ? 1.0 : 0;
    if (dia) for (let i = 0; i < VENTANAS.length; i++) this.ventana(i, 0);
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
const PORTADA_I = 31; // la sombra en la ventana de la cocina
const PORTADA_F = () => fw(248);
const Escena: React.FC<{ portada?: boolean }> = ({ portada }) => {
  const f0 = useCurrentFrame();
  const f = portada ? PORTADA_F() : f0;
  const { camera, scene, gl, size } = useThree();
  const cam = camera as THREE.PerspectiveCamera;
  const mundo = useMemo(() => new Mundo(), []);
  const fx = useMemo(() => ({
    ink: new InkPass(scene, cam, { widthNear: 3.6, widthFar: 2.2, distNear: 1.5, distFar: 30 }),
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

  const i = portada ? PORTADA_I : planoEn(f);
  const pl = PLANOS[i];
  const a = inicioPlano(i), b = i + 1 < PLANOS.length ? inicioPlano(i + 1) : HINTER_CUADROS;
  const k0 = Math.min(1, Math.max(0, (f - a) / Math.max(1, b - a))), k = pl.ease ? pl.ease(k0) : k0;
  mundo.f = f;
  const pos = pl.ini.pos.map((v, j) => lerp(v, pl.fin.pos[j], k)) as V3;
  const mira = pl.ini.mira.map((v, j) => lerp(v, pl.fin.mira[j], k)) as V3;
  const s = pl.sacude ? pl.sacude(f) : 0;
  if (s) { pos[0] += s * Math.sin(f * 1.3); pos[1] += s * Math.sin(f * 1.7 + 1); mira[0] += s * 1.5 * Math.sin(f * 1.1 + 2); }
  cam.position.set(...pos);
  cam.fov = lerp(pl.ini.fov, pl.fin.fov, k); cam.near = 0.03; cam.far = 600; cam.updateProjectionMatrix();
  cam.lookAt(...mira);
  cam.updateMatrixWorld();
  cam.layers.enable(NOINK);
  fx.lens.focus = pl.foco; fx.lens.cInf = pl.cInf;
  fx.lens.pre.uniforms.get("nearScale")!.value = 1.0; fx.lens.main.uniforms.get("nearScale")!.value = 1.0;
  scene.background = new THREE.Color(pl.lugar === "afuera" ? (pl.dia ? "#7a88a4" : "#0c1424") : "#05060a");
  scene.fog = pl.lugar === "afuera" ? new THREE.Fog(pl.dia ? "#8a96b0" : "#141c2c", 30, 150) : null;
  mundo.reiniciar(cam);
  pl.hacer({ f, k, m: mundo });
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
      {b.map((i) => <span key={i} style={{ color: i === actual ? "#ffd23a" : "#ffffff", margin: "0 9px" }}>{P[i].txt.replace(/[«»]/g, "").replace(/\.\.\.$/, "…")}</span>)}
    </div>
  );
};
/** fechas y datos en grande arriba (como en los documentales) */
const TITULOS: [number, number, string][] = [[0, 9, "CASO HINTERKAIFECK"], [46, 51, "MESES ANTES"], [61, 73, "FINALES DE MARZO"], [121, 130, "31 DE MARZO DE 1922"], [251, 264, "4 DE ABRIL DE 1922"], [272, 278, "+100 INTERROGADOS"], [282, 288, "1923"], [312, 320, "HOY"]];
const Titulo: React.FC<{ f: number }> = ({ f }) => {
  const r = TITULOS.find(([a, b]) => f >= fw(a) - 2 && f < fw(b) - 2);
  if (!r) return null;
  const k = r[0] === 0 ? 1 : Math.min(1, (f - fw(r[0]) + 2) / 5); // el del gancho ya está completo desde el primer cuadro
  return <div style={{ position: "absolute", top: 150, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: r[0] === 0 ? 88 : 72, color: "#ffffff", letterSpacing: 2, transform: `scale(${1.25 - 0.25 * k})`, opacity: k, ...contornoTexto(10) }}>{r[2]}</div>;
};
const Rotulo: React.FC<{ f: number }> = ({ f }) => {
  const texto = "HINTERKAIFECK · BAVIERA, ALEMANIA · 1922", a = fw(22) - 2;
  if (f < a || f >= fw(46) - 2) return null;
  const n = Math.round(Math.min(1, (f - a + 4) / 26) * texto.length);
  return (
    <div style={{ position: "absolute", top: 70, left: 46, right: 46, padding: "10px 18px", borderRadius: 8, background: "rgba(10,6,8,0.82)", border: "3px solid #b3262f", fontFamily: "Mono", fontSize: 30, color: "#efe3da", letterSpacing: 1, textAlign: "center" }}>
      {texto.slice(0, n)}<span style={{ color: "#e0393f" }}>{n < texto.length ? "▌" : ""}</span>
    </div>
  );
};
const Pregunta: React.FC<{ f: number }> = ({ f }) => {
  const a = fw(328) - 2; if (f < a) return null;
  const u = Math.min(1, (f - a) / 6), pop = 1 + 0.15 * Math.sin(u * Math.PI) * (1 - u);
  return <div style={{ position: "absolute", top: 160, width: "100%", textAlign: "center", fontFamily: "Titulo", fontSize: 82, lineHeight: 1.05, color: "#ffd23a", transform: `scale(${pop})`, opacity: u, ...contornoTexto(12) }}>¿TÚ QUÉ CREES<br />QUE PASÓ?</div>;
};

const Lienzo3D: React.FC<{ portada?: boolean }> = ({ portada }) => (
  <ThreeCanvas width={1080} height={1920} gl={{ antialias: false, stencil: false, toneMappingExposure: 1.0 }} camera={{ fov: 40, near: 0.03, far: 600 }}>
    <Escena portada={portada} />
  </ThreeCanvas>
);

export const Hinterkaifeck: React.FC = () => {
  useFuentes();
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D />
      <Rotulo f={f} />
      <Titulo f={f} />
      <Pregunta f={f} />
      <Subtitulos f={f} />
    </AbsoluteFill>
  );
};
export const HinterkaifeckPortada: React.FC = () => {
  useFuentes();
  const linea = (txt: string, color: string, tam: number) => (
    <div style={{ fontFamily: "Titulo", fontSize: tam, lineHeight: 1.1, color, letterSpacing: -1, textShadow: [...Array(24)].map((_, j) => `${(Math.cos(j / 24 * 6.283) * 11).toFixed(1)}px ${(Math.sin(j / 24 * 6.283) * 11).toFixed(1)}px 0 #0d0a0c`).join(",") + ", 0 14px 0 #0d0a0c, 0 22px 34px rgba(0,0,0,0.7)" }}>{txt}</div>
  );
  return (
    <AbsoluteFill style={{ background: "#05070c" }}>
      <Lienzo3D portada />
      <div style={{ position: "absolute", bottom: 0, width: "100%", height: 620, background: "linear-gradient(#05070c00, #05070cee 50%)" }} />
      <div style={{ position: "absolute", bottom: 90, width: "100%", textAlign: "center" }}>
        {linea("VIVIÓ 3 DÍAS", "#ffffff", 104)}
        {linea("CON LA FAMILIA…", "#ffffff", 104)}
        {linea("MUERTA", "#ffd23a", 124)}
      </div>
    </AbsoluteFill>
  );
};
export const PLANOS_INICIO = PLANOS.map((_, i) => inicioPlano(i));
void PORTON; void PUERTITA;
