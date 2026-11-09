// Personaje plano de caricatura según GUIA_DE_ESTILO_SUSPENSO.md (§4 Personajes, medido en el video 4):
//   cabeza ≈ 40 % de la altura (con pelo), torso RECTANGULAR ≈ 33 % (ancho ≈ 0.8 de la cabeza, esquinas casi
//   rectas), piernas y brazos de LÍNEA FINA, manos pequeñas y redondas, pies diminutos oscuros.
//   Contorno oscuro ≈ 2.5 % del ancho de la cabeza, con un leve temblor de trazo a mano.
//   Sombreado suave: lado de la luz más claro, lado contrario y parte baja más oscuros, sombra bajo la barbilla.
// El lienzo es de 600 x 1000 y las suelas caen EXACTAMENTE en y = PIES (el plano 3D se ancla ahí al suelo).

export const LIENZO_W = 600;
export const LIENZO_H = 1000;
export const PIES = 994;
const TOPE = 30;

export type Aspecto = {
  piel: string;
  pelo: string;
  ropa: string; // prenda de arriba
  ropaInterior: string; // camisa / cuello que asoma
  pantalon: string;
  zapatos: string;
  peinado: "revuelto" | "mono";
  lentes?: boolean;
  semilla: number; // para el temblor del trazo
};

export type Pose = {
  vista: "frente" | "espalda";
  giro: number; // -1 … 1: cabeza girada hacia la izquierda/derecha de la pantalla (3/4)
  mirarX: number;
  mirarY: number;
  ojos: number; // 1 normal, 1.15 sorpresa
  pupila: number; // 0.3 normal, 0.18 miedo (relativo al radio del ojo)
  parpadeo: boolean;
  cejasAlto: number;
  cejasMiedo: number;
  boca: "linea" | "dientes" | "o";
  sudor: number;
  // brazos articulados: hombro y codo, ángulos desde la vertical (positivo = hacia fuera)
  brazoIzq: [number, number];
  brazoDer: [number, number];
  piernas: [number, number]; // cuánto se levanta cada pie (0 … 1)
  respira: number;
  luzX: number; // -1 luz desde la izquierda de la pantalla … 1 desde la derecha
};

const TINTA = "#141012";
const LW = 9;

// ---------------------------------------------------------------- utilidades de color
function hex(c: string): [number, number, number] {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
function mezcla(a: string, b: string, t: number) {
  const x = hex(a), y = hex(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`;
}
const sombra = (c: string, t = 0.35) => mezcla(c, "#1a1f2a", t); // sombras frías (azuladas), nunca cafés
const luz = (c: string, t = 0.12) => mezcla(c, "#fff4e2", t);

// temblor determinista del trazo
function azar(semilla: number) {
  let s = semilla * 9301 + 49297;
  return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
}

export function dibujarPersonaje(ctx: CanvasRenderingContext2D, a: Aspecto, p: Pose) {
  const W = LIENZO_W;
  ctx.clearRect(0, 0, W, LIENZO_H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const rnd = azar(a.semilla);

  const alto = PIES - TOPE;
  const cx = W / 2;
  // proporciones (video 4): pelo 0.12 D · cabeza D · torso 0.85 D · piernas 0.65 D  →  alto ≈ 2.55 D
  const D = alto / 2.55; // diámetro de la cabeza (sin pelo)
  const r = D / 2;
  const resp = p.respira * 3;
  const cabezaY = TOPE + 0.12 * D + r + resp * 0.5;
  const torsoTop = cabezaY + r * 0.86 + resp * 0.3;
  const torsoH = D * 0.85;
  const torsoBot = torsoTop + torsoH;
  const anchoHombro = D * 0.66, anchoBajo = D * 0.72;
  const L = p.luzX; // dirección de la luz

  // trazo con contorno: primero tinta, luego relleno
  const contorno = (dibujo: () => void, relleno: string | CanvasGradient, ancho = LW) => {
    ctx.beginPath(); dibujo();
    ctx.fillStyle = relleno; ctx.fill();
    ctx.lineWidth = ancho; ctx.strokeStyle = TINTA; ctx.stroke();
  };
  const linea = (pts: [number, number][], color: string, ancho: number) => {
    ctx.beginPath(); pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.lineWidth = ancho + 5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.lineWidth = ancho; ctx.strokeStyle = color; ctx.stroke();
  };
  // degradado lateral según la luz + oscurecido hacia abajo
  const gradLado = (x0: number, x1: number, base: string, k = 0.3) => {
    const g = ctx.createLinearGradient(x0, 0, x1, 0);
    const claro = luz(base, 0.1), osc = sombra(base, k);
    g.addColorStop(0, L < 0 ? claro : osc);
    g.addColorStop(0.5, base);
    g.addColorStop(1, L < 0 ? osc : claro);
    return g;
  };

  // ---------------- piernas (línea fina) y pies diminutos ----------------
  for (const [i, s] of [[0, -1], [1, 1]] as const) {
    const x = cx + s * anchoBajo * 0.2;
    const pieY = PIES - 9 - p.piernas[i] * 40;
    linea([[x, torsoBot - 6], [x, pieY - 4]], sombra(a.pantalon, 0.15), 9);
    contorno(() => ctx.ellipse(x + s * 9, pieY, 25, 10, 0, 0, Math.PI * 2), a.zapatos, 5);
  }

  // ---------------- brazos articulados (detrás del torso) ----------------
  const hombroY = torsoTop + D * 0.12;
  const seg = D * 0.36;
  const manos: [number, number][] = [];
  const brazo = (s: -1 | 1, [aH, aC]: [number, number]) => {
    const hx = cx + s * anchoHombro * 0.5;
    const ex = hx + s * Math.sin(aH) * seg, ey = hombroY + Math.cos(aH) * seg;
    const a2 = aH + aC;
    const mx = ex + s * Math.sin(a2) * seg, my = ey + Math.cos(a2) * seg;
    linea([[hx, hombroY], [ex, ey], [mx, my]], sombra(a.ropa, 0.12), 10);
    manos.push([mx, my]);
  };
  brazo(-1, p.brazoIzq);
  brazo(1, p.brazoDer);

  // ---------------- torso rectangular ----------------
  const torso = () => {
    ctx.moveTo(cx - anchoHombro / 2 + 6, torsoTop);
    ctx.lineTo(cx + anchoHombro / 2 - 6, torsoTop);
    ctx.quadraticCurveTo(cx + anchoHombro / 2, torsoTop, cx + anchoHombro / 2 + 1, torsoTop + 8);
    ctx.lineTo(cx + anchoBajo / 2, torsoBot - 6);
    ctx.quadraticCurveTo(cx + anchoBajo / 2, torsoBot, cx + anchoBajo / 2 - 6, torsoBot);
    ctx.lineTo(cx - anchoBajo / 2 + 6, torsoBot);
    ctx.quadraticCurveTo(cx - anchoBajo / 2, torsoBot, cx - anchoBajo / 2, torsoBot - 6);
    ctx.lineTo(cx - anchoHombro / 2 - 1, torsoTop + 8);
    ctx.quadraticCurveTo(cx - anchoHombro / 2, torsoTop, cx - anchoHombro / 2 + 6, torsoTop);
    ctx.closePath();
  };
  contorno(torso, gradLado(cx - anchoBajo / 2, cx + anchoBajo / 2, a.ropa));
  // oscurecido hacia abajo y sombra que proyecta la cabeza bajo la barbilla
  ctx.save(); ctx.beginPath(); torso(); ctx.clip();
  const gv = ctx.createLinearGradient(0, torsoTop, 0, torsoBot);
  gv.addColorStop(0, "rgba(12,16,26,0.42)"); gv.addColorStop(0.18, "rgba(12,16,26,0.0)");
  gv.addColorStop(0.7, "rgba(12,16,26,0.0)"); gv.addColorStop(1, "rgba(12,16,26,0.28)");
  ctx.fillStyle = gv; ctx.fillRect(0, torsoTop, W, torsoH);
  if (p.vista === "frente") {
    // cuello de la camisa en V y abertura del suéter
    ctx.fillStyle = a.ropaInterior;
    ctx.beginPath(); ctx.moveTo(cx - D * 0.17, torsoTop - 2); ctx.lineTo(cx, torsoTop + D * 0.32); ctx.lineTo(cx + D * 0.17, torsoTop - 2); ctx.closePath(); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, torsoTop + D * 0.32); ctx.lineTo(cx + 2, torsoBot); ctx.lineWidth = 5; ctx.stroke();
    ctx.fillStyle = sombra(a.ropa, 0.5);
    for (const t of [0.42, 0.62, 0.82]) { ctx.beginPath(); ctx.arc(cx + 13, torsoTop + torsoH * t, 5, 0, 7); ctx.fill(); }
    // bolsillos y puños del suéter (líneas de detalle)
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.ropa, 0.55);
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(cx + s * D * 0.12, torsoTop + torsoH * 0.66); ctx.lineTo(cx + s * D * 0.31, torsoTop + torsoH * 0.66); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(cx - anchoBajo / 2, torsoBot - 20); ctx.lineTo(cx + anchoBajo / 2, torsoBot - 20); ctx.stroke();
  } else {
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.ropa, 0.55);
    ctx.beginPath(); ctx.moveTo(cx - anchoBajo / 2, torsoBot - 20); ctx.lineTo(cx + anchoBajo / 2, torsoBot - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - D * 0.2, torsoTop + 6); ctx.quadraticCurveTo(cx, torsoTop + 22, cx + D * 0.2, torsoTop + 6); ctx.stroke();
  }
  ctx.restore();
  // manos pequeñas y redondas, con su lado de sombra
  for (const [mx, my] of manos) {
    const g = ctx.createRadialGradient(mx - L * -6, my - 6, 2, mx, my, 17);
    g.addColorStop(0, luz(a.piel, 0.08)); g.addColorStop(1, sombra(a.piel, 0.28));
    contorno(() => ctx.arc(mx, my, 15, 0, Math.PI * 2), g, 6);
  }

  // ---------------- cabeza ----------------
  const g = p.vista === "frente" ? p.giro : 0;
  if (a.peinado === "mono") {
    contorno(() => ctx.arc(cx - g * r * 0.3 + (p.vista === "espalda" ? 0 : 0), cabezaY - r * 0.95, r * 0.3, 0, Math.PI * 2), gradLado(cx - r * 0.3, cx + r * 0.3, a.pelo, 0.4));
  }
  // orejas
  for (const s of [-1, 1]) {
    if (p.vista === "frente" && Math.sign(g) === s && Math.abs(g) > 0.35) continue;
    const ox = cx + s * r * (0.97 - 0.1 * Math.abs(g)) - g * r * 0.12;
    contorno(() => ctx.ellipse(ox, cabezaY + r * 0.1, r * 0.13, r * 0.18, 0, 0, Math.PI * 2), sombra(a.piel, 0.15), 7);
  }
  // cara: degradado radial desde el lado de la luz (más claro) hacia el borde contrario (sombra fría)
  const gc = ctx.createRadialGradient(cx + L * r * 0.45, cabezaY - r * 0.35, r * 0.1, cx, cabezaY, r * 1.08);
  gc.addColorStop(0, luz(a.piel, 0.14)); gc.addColorStop(0.55, a.piel); gc.addColorStop(1, sombra(a.piel, 0.32));
  contorno(() => ctx.ellipse(cx, cabezaY, r * 1.02, r, 0, 0, Math.PI * 2), gc);

  if (p.vista === "espalda") {
    // nuca: el pelo cubre la parte de arriba y los lados; abajo asoma la piel de la nuca
    const gp = ctx.createLinearGradient(0, cabezaY - r, 0, cabezaY + r * 0.5);
    gp.addColorStop(0, luz(a.pelo, 0.1)); gp.addColorStop(1, sombra(a.pelo, 0.2));
    contorno(() => {
      ctx.moveTo(cx - r * 1.04, cabezaY + r * 0.18);
      ctx.bezierCurveTo(cx - r * 1.12, cabezaY - r * 1.25, cx + r * 1.12, cabezaY - r * 1.25, cx + r * 1.04, cabezaY + r * 0.18);
      for (let i = 0; i <= 8; i++) { // borde inferior con mechones
        const t = i / 8, x = cx + r * (1.04 - 2.08 * t);
        ctx.lineTo(x, cabezaY + r * (0.42 + (i % 2 ? 0.1 : -0.02)) - Math.sin(t * Math.PI) * -r * 0.1);
      }
      ctx.closePath();
    }, gp);
    if (a.peinado === "mono") contorno(() => ctx.arc(cx, cabezaY - r * 0.1, r * 0.28, 0, Math.PI * 2), sombra(a.pelo, 0.1));
    return;
  }

  // pelo revuelto: casquete con flequillo en picos irregulares y mechones sueltos a los lados
  const px = cx - g * r * 0.2;
  const gp = ctx.createLinearGradient(px - r, 0, px + r, 0);
  gp.addColorStop(0, L < 0 ? luz(a.pelo, 0.12) : a.pelo); gp.addColorStop(1, L < 0 ? a.pelo : luz(a.pelo, 0.12));
  contorno(() => {
    ctx.moveTo(px - r * 1.06, cabezaY + r * 0.05);
    ctx.bezierCurveTo(px - r * 1.24, cabezaY - r * 1.42, px + r * 1.24, cabezaY - r * 1.42, px + r * 1.06, cabezaY + r * 0.05);
    if (a.peinado === "revuelto") {
      // mechón suelto del lado derecho
      ctx.lineTo(px + r * 1.12, cabezaY - r * 0.22);
      const n = 7;
      for (let i = n; i >= 0; i--) {
        const t = i / n, x = px + r * (-0.95 + 1.9 * t);
        const pico = i % 2 ? 0.0 : 0.17 + rnd() * 0.08;
        ctx.lineTo(x + (rnd() - 0.5) * 6, cabezaY - r * (0.56 - pico) + Math.sin(t * Math.PI) * -r * 0.04);
      }
      ctx.lineTo(px - r * 1.13, cabezaY - r * 0.2);
    } else {
      ctx.quadraticCurveTo(px + r * 0.2, cabezaY - r * 0.55, px - r * 0.2, cabezaY - r * 0.62);
      ctx.quadraticCurveTo(px - r * 0.7, cabezaY - r * 0.5, px - r * 1.06, cabezaY + r * 0.05);
    }
    ctx.closePath();
  }, gp);
  if (a.peinado === "revuelto") {
    // pelos sueltos en la coronilla
    ctx.lineWidth = 5; ctx.strokeStyle = TINTA;
    for (const [dx, dy, ex2, ey2] of [[-0.15, -0.98, -0.25, -1.12], [0.2, -0.97, 0.32, -1.1]]) {
      ctx.beginPath(); ctx.moveTo(px + dx * r, cabezaY + dy * r); ctx.lineTo(px + ex2 * r, cabezaY + ey2 * r); ctx.stroke();
    }
  }
  // sombra suave que el pelo deja en la frente
  ctx.save(); ctx.beginPath(); ctx.ellipse(cx, cabezaY, r * 1.0, r * 0.98, 0, 0, Math.PI * 2); ctx.clip();
  const gs = ctx.createLinearGradient(0, cabezaY - r * 0.55, 0, cabezaY - r * 0.25);
  gs.addColorStop(0, "rgba(15,18,30,0.28)"); gs.addColorStop(1, "rgba(15,18,30,0)");
  ctx.fillStyle = gs; ctx.fillRect(0, cabezaY - r * 0.57, W, r * 0.34);
  ctx.restore();

  // ---------------- cara (se corre hacia el lado del giro: 3/4) ----------------
  const fx = cx + g * r * 0.4;
  const ey = cabezaY + r * 0.08;
  const er = r * 0.2 * p.ojos;
  const sep = r * 0.4 * (1 - 0.15 * Math.abs(g));
  for (const s of [-1, 1]) {
    const lejano = Math.sign(g) === s;
    const sx = lejano ? 1 - 0.35 * Math.abs(g) : 1;
    const x = fx + s * sep;
    if (p.parpadeo) {
      ctx.lineWidth = 6; ctx.strokeStyle = TINTA;
      ctx.beginPath(); ctx.ellipse(x, ey + er * 0.1, er * sx * 0.85, er * 0.3, 0, 0.12 * Math.PI, 0.88 * Math.PI); ctx.stroke();
      continue;
    }
    contorno(() => ctx.ellipse(x, ey, er * sx, er * 1.06, 0, 0, Math.PI * 2), "#f6f1e6", 6);
    const pr = er * p.pupila;
    ctx.beginPath(); ctx.arc(x + (p.mirarX * 0.55 + g * 0.2) * er * sx, ey + p.mirarY * 0.45 * er, pr, 0, Math.PI * 2);
    ctx.fillStyle = TINTA; ctx.fill();
  }
  if (a.lentes) {
    ctx.lineWidth = 5; ctx.strokeStyle = "#2a2226";
    for (const s of [-1, 1]) {
      const sx = Math.sign(g) === s ? 1 - 0.35 * Math.abs(g) : 1;
      ctx.beginPath(); ctx.ellipse(fx + s * sep, ey, er * 1.32 * sx, er * 1.28, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(fx - sep + er * 1.3, ey - 2); ctx.lineTo(fx + sep - er * 1.3, ey - 2); ctx.stroke();
  }
  // cejas finas que cambian la expresión
  ctx.lineWidth = 7; ctx.strokeStyle = TINTA;
  for (const s of [-1, 1]) {
    const x = fx + s * sep;
    const by = ey - er * (1.7 + 0.5 * p.cejasAlto);
    ctx.beginPath();
    ctx.moveTo(x + s * er * 0.95, by + er * 0.2 * p.cejasMiedo);
    ctx.lineTo(x - s * er * 0.8, by - er * 0.45 * p.cejasMiedo);
    ctx.stroke();
  }
  // boca
  const my = cabezaY + r * 0.55;
  const mw = r * 0.26 * (1 - 0.2 * Math.abs(g));
  const mx = fx + g * r * 0.06;
  if (p.boca === "dientes") {
    contorno(() => ctx.roundRect(mx - mw, my - r * 0.1, mw * 2, r * 0.2, r * 0.05), "#f3eee2", 6);
    ctx.lineWidth = 3.5; ctx.strokeStyle = TINTA;
    ctx.beginPath(); ctx.moveTo(mx - mw, my); ctx.lineTo(mx + mw, my); ctx.stroke();
    for (let i = 1; i < 5; i++) { const x = mx - mw + (2 * mw * i) / 5; ctx.beginPath(); ctx.moveTo(x, my - r * 0.1); ctx.lineTo(x, my + r * 0.1); ctx.stroke(); }
  } else if (p.boca === "o") {
    contorno(() => ctx.ellipse(mx, my, mw * 0.4, r * 0.12, 0, 0, Math.PI * 2), "#3a0d14", 6);
  } else {
    ctx.lineWidth = 7; ctx.strokeStyle = TINTA;
    ctx.beginPath(); ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke();
  }
  // gota de sudor
  if (p.sudor > 0) {
    const gx = cx - Math.sign(g || 1) * r * 0.75, gy = cabezaY - r * 0.3 + p.sudor * 16;
    ctx.globalAlpha = Math.min(1, p.sudor * 2);
    contorno(() => {
      ctx.moveTo(gx, gy - r * 0.17); ctx.quadraticCurveTo(gx + r * 0.09, gy, gx, gy + r * 0.07);
      ctx.quadraticCurveTo(gx - r * 0.09, gy, gx, gy - r * 0.17);
    }, "#b6dcef", 4);
    ctx.globalAlpha = 1;
  }
}
