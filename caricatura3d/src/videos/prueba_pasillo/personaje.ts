// Personaje plano de caricatura según GUIA_DE_ESTILO_SUSPENSO.md (§4 Personajes):
//   cabeza redonda = 43 % de la altura (≈ 2.3 cabezas), torso de cápsula ≈ 30 %, piernas de palito ≈ 27 %,
//   brazos de palito con manos redondas, pies pequeños oscuros, contorno oscuro grueso, ojos blancos grandes con
//   pupila pequeña, cejas gruesas, boca de línea / zigzag de dientes (miedo) / «o».
// Se dibuja en un lienzo de 600 x 1000 con los PIES EXACTAMENTE en y = PIES (el plano 3D se ancla ahí al suelo).

export const LIENZO_W = 600;
export const LIENZO_H = 1000;
export const PIES = 994; // línea de apoyo de las suelas en el lienzo
const TOPE = 40; // parte de arriba de la cabeza

export type Aspecto = {
  piel: string;
  pelo: string;
  ropa: string;
  ropaDetalle: string;
  pantalon: string;
  peinado: "corto" | "mono";
  lentes?: boolean;
};

export type Pose = {
  vista: "frente" | "espalda";
  giro: number; // -1 … 1: cabeza girada hacia la izquierda/derecha de la pantalla (3/4)
  mirarX: number; // -1 … 1
  mirarY: number;
  ojos: number; // 1 normal, 1.15 sorpresa
  pupila: number; // radio relativo: 0.42 normal, 0.24 miedo
  parpadeo: boolean;
  cejasAlto: number; // 0 … 1
  cejasMiedo: number; // 0 … 1 (extremo interior levantado)
  boca: "linea" | "zigzag" | "o";
  sudor: number; // 0 … 1 (aparece la gota)
  brazos: [number, number]; // ángulo desde la vertical, positivo hacia fuera (rad)
  piernas: [number, number]; // cuánto se levanta cada pie (0 … 1)
  respira: number; // -1 … 1
};

const CONTORNO = "#1b1214";
const LW = 11;

export function dibujarPersonaje(ctx: CanvasRenderingContext2D, a: Aspecto, p: Pose) {
  const W = LIENZO_W;
  ctx.clearRect(0, 0, W, LIENZO_H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = CONTORNO;
  ctx.lineWidth = LW;

  const alto = PIES - TOPE; // 954 px
  const cx = W / 2;
  const r = (alto * 0.43) / 2; // radio de la cabeza
  const resp = p.respira * 4;
  const cabezaY = TOPE + r + resp * 0.6;
  const torsoTop = TOPE + alto * 0.43 + 4 + resp;
  const torsoBot = TOPE + alto * 0.73;
  const torsoW = r * 1.25;
  const cadera = torsoBot - 10;

  const relleno = (color: string, dibujo: () => void, trazo = true) => {
    ctx.beginPath();
    dibujo();
    ctx.fillStyle = color;
    ctx.fill();
    if (trazo) ctx.stroke();
  };
  const palito = (x0: number, y0: number, x1: number, y1: number, color: string, ancho: number) => {
    ctx.lineWidth = ancho + LW * 1.4;
    ctx.strokeStyle = CONTORNO;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.lineWidth = ancho;
    ctx.strokeStyle = color;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
    ctx.lineWidth = LW;
    ctx.strokeStyle = CONTORNO;
  };

  // ---- piernas de palito y pies (las suelas tocan PIES) ----
  for (const [i, s] of [[0, -1], [1, 1]] as const) {
    const x = cx + s * torsoW * 0.22;
    const pieY = PIES - 16 - p.piernas[i] * 46;
    palito(x, cadera, x, pieY - 6, a.pantalon, 22);
    relleno("#18100f", () => ctx.ellipse(x + s * 10, pieY, 38, 16, 0, 0, Math.PI * 2));
  }

  // ---- brazos de palito (detrás del torso) y manos redondas ----
  const hombroY = torsoTop + 34;
  const largo = alto * 0.25;
  const manos: [number, number][] = [];
  for (const [i, s] of [[0, -1], [1, 1]] as const) {
    const hx = cx + s * torsoW * 0.42;
    const ang = p.brazos[i];
    const mx = hx + s * Math.sin(ang) * largo;
    const my = hombroY + Math.cos(ang) * largo;
    palito(hx, hombroY, mx, my, a.ropa, 20);
    manos.push([mx, my]);
  }

  // ---- torso de cápsula ----
  relleno(a.ropa, () => ctx.roundRect(cx - torsoW / 2, torsoTop, torsoW, torsoBot - torsoTop, torsoW * 0.32));
  if (p.vista === "frente") {
    ctx.strokeStyle = a.ropaDetalle;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx, torsoTop + 30); ctx.lineTo(cx, torsoBot - 16); ctx.stroke(); // cierre
    ctx.beginPath(); // cuello en V
    ctx.moveTo(cx - 34, torsoTop + 6); ctx.lineTo(cx, torsoTop + 48); ctx.lineTo(cx + 34, torsoTop + 6); ctx.stroke();
    ctx.fillStyle = a.ropaDetalle;
    for (const y of [0.45, 0.65, 0.85]) {
      ctx.beginPath(); ctx.arc(cx + 18, torsoTop + (torsoBot - torsoTop) * y, 7, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = LW;
  } else {
    ctx.strokeStyle = a.ropaDetalle;
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(cx - torsoW * 0.32, torsoTop + 20); ctx.quadraticCurveTo(cx, torsoTop + 46, cx + torsoW * 0.32, torsoTop + 20); ctx.stroke();
    ctx.strokeStyle = CONTORNO;
    ctx.lineWidth = LW;
  }
  for (const [mx, my] of manos) relleno(a.piel, () => ctx.arc(mx, my, 24, 0, Math.PI * 2));

  // ---- cabeza ----
  const g = p.vista === "frente" ? p.giro : 0;
  if (a.peinado === "mono") {
    relleno(a.pelo, () => ctx.arc(cx - g * r * 0.25, cabezaY - r * 0.92, r * 0.36, 0, Math.PI * 2));
  }
  // orejas: la del lado hacia el que gira se esconde
  for (const s of [-1, 1]) {
    const oculta = p.vista === "frente" && Math.sign(g) === s && Math.abs(g) > 0.35;
    if (oculta) continue;
    const ox = cx + s * r * (0.97 - 0.12 * Math.abs(g)) - g * r * 0.1;
    relleno(a.piel, () => ctx.ellipse(ox, cabezaY + r * 0.08, r * 0.15, r * 0.2, 0, 0, Math.PI * 2));
  }
  relleno(a.piel, () => ctx.ellipse(cx, cabezaY, r, r * 0.98, 0, 0, Math.PI * 2));

  if (p.vista === "espalda") {
    // nuca: el pelo cubre casi toda la cabeza
    relleno(a.pelo, () => {
      ctx.moveTo(cx - r * 0.98, cabezaY + r * 0.25);
      ctx.bezierCurveTo(cx - r * 1.05, cabezaY - r * 1.25, cx + r * 1.05, cabezaY - r * 1.25, cx + r * 0.98, cabezaY + r * 0.25);
      ctx.quadraticCurveTo(cx, cabezaY + r * 0.62, cx - r * 0.98, cabezaY + r * 0.25);
    });
    if (a.peinado === "mono") relleno(a.pelo, () => ctx.arc(cx, cabezaY - r * 0.05, r * 0.3, 0, Math.PI * 2));
    return;
  }

  // pelo (frente): casquete que se corre con el giro
  const px = cx - g * r * 0.18;
  relleno(a.pelo, () => {
    ctx.moveTo(px - r * 1.0, cabezaY - r * 0.12);
    ctx.bezierCurveTo(px - r * 1.05, cabezaY - r * 1.3, px + r * 1.05, cabezaY - r * 1.3, px + r * 1.0, cabezaY - r * 0.12);
    if (a.peinado === "corto") {
      // flequillo en picos
      const n = 5;
      for (let i = n; i >= 0; i--) {
        const t = i / n;
        const x = px + r * (-1.0 + 2.0 * t);
        const y = cabezaY - r * (0.42 + (i % 2 ? 0.0 : 0.16)) + Math.sin(t * Math.PI) * r * -0.05;
        ctx.lineTo(x, y);
      }
    } else {
      ctx.quadraticCurveTo(px, cabezaY - r * 0.62, px - r * 1.0, cabezaY - r * 0.12);
    }
    ctx.closePath();
  });

  // ---- cara (se corre hacia el lado del giro: vista de 3/4) ----
  const fx = cx + g * r * 0.42;
  const ey = cabezaY + r * 0.06;
  const er = r * 0.27 * p.ojos;
  const sep = r * 0.36 * (1 - 0.18 * Math.abs(g));
  for (const s of [-1, 1]) {
    const lejano = Math.sign(g) === s;
    const sx = lejano ? 1 - 0.38 * Math.abs(g) : 1;
    const x = fx + s * sep;
    if (p.parpadeo) {
      ctx.beginPath();
      ctx.ellipse(x, ey + er * 0.1, er * sx * 0.9, er * 0.35, 0, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
      continue;
    }
    relleno("#fbf4e6", () => ctx.ellipse(x, ey, er * sx, er * 1.08, 0, 0, Math.PI * 2));
    const pr = er * p.pupila;
    const ppx = x + (p.mirarX * 0.5 + g * 0.25) * er * sx;
    const ppy = ey + p.mirarY * 0.45 * er;
    ctx.beginPath(); ctx.arc(ppx, ppy, pr, 0, Math.PI * 2); ctx.fillStyle = CONTORNO; ctx.fill();
  }
  if (a.lentes) {
    ctx.lineWidth = 8;
    for (const s of [-1, 1]) {
      const lejano = Math.sign(g) === s;
      const sx = lejano ? 1 - 0.38 * Math.abs(g) : 1;
      ctx.beginPath(); ctx.ellipse(fx + s * sep, ey, er * 1.3 * sx, er * 1.3, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.moveTo(fx - sep + er * 1.25, ey); ctx.lineTo(fx + sep - er * 1.25, ey); ctx.stroke();
    ctx.lineWidth = LW;
  }

  // cejas gruesas
  ctx.lineWidth = LW * 1.7;
  for (const s of [-1, 1]) {
    const x = fx + s * sep;
    const by = ey - er * (1.55 + 0.45 * p.cejasAlto);
    const interior = by - er * 0.5 * p.cejasMiedo;
    const exterior = by + er * 0.25 * p.cejasMiedo;
    ctx.beginPath();
    ctx.moveTo(x + s * er * 0.95, exterior);
    ctx.lineTo(x - s * er * 0.85, interior);
    ctx.stroke();
  }
  ctx.lineWidth = LW;

  // nariz mínima: solo se insinúa en 3/4
  if (Math.abs(g) > 0.3) {
    ctx.beginPath();
    ctx.arc(fx + g * r * 0.12, ey + r * 0.38, r * 0.07, Math.PI * (g > 0 ? -0.4 : 0.6), Math.PI * (g > 0 ? 0.6 : 1.4));
    ctx.stroke();
  }

  // boca
  const my = cabezaY + r * 0.6;
  const mw = r * 0.34 * (1 - 0.25 * Math.abs(g));
  const mx = fx + g * r * 0.08;
  if (p.boca === "zigzag") {
    relleno("#fbf4e6", () => ctx.roundRect(mx - mw, my - r * 0.11, mw * 2, r * 0.22, r * 0.06));
    ctx.lineWidth = 6;
    ctx.beginPath();
    const n = 6;
    for (let i = 0; i <= n; i++) {
      const x = mx - mw + (2 * mw * i) / n;
      const y = my + (i % 2 ? r * 0.05 : -r * 0.05);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.lineWidth = LW;
  } else if (p.boca === "o") {
    relleno("#3a0d14", () => ctx.ellipse(mx, my, mw * 0.4, r * 0.13, 0, 0, Math.PI * 2));
  } else {
    ctx.beginPath(); ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke();
  }

  // gota de sudor
  if (p.sudor > 0) {
    const gx = cx - Math.sign(g || 1) * r * 0.78;
    const gy = cabezaY - r * 0.35 + (1 - p.sudor) * -10 + p.sudor * 14;
    ctx.globalAlpha = Math.min(1, p.sudor * 2);
    relleno("#a9dcf5", () => {
      ctx.moveTo(gx, gy - r * 0.2);
      ctx.quadraticCurveTo(gx + r * 0.1, gy, gx, gy + r * 0.08);
      ctx.quadraticCurveTo(gx - r * 0.1, gy, gx, gy - r * 0.2);
    });
    ctx.globalAlpha = 1;
  }
}
