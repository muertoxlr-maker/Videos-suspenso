// Dibuja un personaje cartoon plano (2D) en un <canvas>.
// Ese canvas se usa luego como textura dentro de la escena 3D.

export type Expresion = "neutral" | "miedo" | "sospecha" | "grito";

export type AspectoPersonaje = {
  piel: string;
  pelo: string;
  ropa: string;
  pantalon: string;
};

export type Pose = {
  expresion: Expresion;
  ojosCerrados: boolean;
  boca: number; // 0 = cerrada, 1 = muy abierta (para hablar)
  mirar: number; // -1 izquierda … 1 derecha
  respiracion: number; // -1 … 1
};

const CONTORNO = "#16100f";

export const ANCHO_LIENZO = 512;
export const ALTO_LIENZO = 1024;

export function dibujarPersonaje(ctx: CanvasRenderingContext2D, a: AspectoPersonaje, p: Pose) {
  const W = ANCHO_LIENZO;
  const H = ALTO_LIENZO;
  ctx.clearRect(0, 0, W, H);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.strokeStyle = CONTORNO;
  const lw = 12;
  ctx.lineWidth = lw;

  const cx = W / 2;
  const pies = H - 30;
  const u = H - 60; // altura total del personaje en píxeles
  const resp = p.respiracion * 6;

  const relleno = (color: string, dibujo: () => void) => {
    ctx.beginPath();
    dibujo();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.stroke();
  };

  // piernas
  for (const s of [-1, 1]) {
    const x = cx + s * 0.065 * u;
    relleno(a.pantalon, () => ctx.roundRect(x - 0.05 * u, pies - 0.25 * u, 0.1 * u, 0.22 * u, 0.03 * u));
    relleno("#1c1414", () => ctx.ellipse(x + s * 0.01 * u, pies - 0.025 * u, 0.068 * u, 0.03 * u, 0, 0, Math.PI * 2));
  }
  // brazos
  for (const s of [-1, 1]) {
    const x = cx + s * 0.185 * u;
    relleno(a.ropa, () => ctx.roundRect(x - 0.045 * u, pies - 0.54 * u + resp, 0.09 * u, 0.27 * u, 0.04 * u));
    relleno(a.piel, () => ctx.arc(x, pies - 0.27 * u + resp, 0.043 * u, 0, Math.PI * 2));
  }
  // torso
  relleno(a.ropa, () => ctx.roundRect(cx - 0.17 * u, pies - 0.57 * u + resp, 0.34 * u, 0.37 * u, 0.07 * u));
  ctx.beginPath();
  ctx.moveTo(cx, pies - 0.55 * u + resp);
  ctx.lineTo(cx, pies - 0.22 * u);
  ctx.globalAlpha = 0.35;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // cabeza
  const hr = 0.235 * u;
  const hy = pies - 0.57 * u - hr * 0.82 + resp * 1.3;
  for (const s of [-1, 1]) {
    relleno(a.piel, () => ctx.ellipse(cx + s * hr * 0.98, hy + hr * 0.1, hr * 0.16, hr * 0.19, 0, 0, Math.PI * 2));
  }
  relleno(a.piel, () => ctx.arc(cx, hy, hr, 0, Math.PI * 2));

  // pelo: casquete + mechones en punta
  ctx.beginPath();
  ctx.arc(cx, hy - hr * 0.1, hr * 1.02, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + hr * 1.0, hy - hr * 0.2);
  ctx.lineTo(cx - hr * 1.0, hy - hr * 0.2);
  ctx.closePath();
  ctx.fillStyle = a.pelo;
  ctx.fill();
  ctx.stroke();
  for (let i = 0; i < 5; i++) {
    const a0 = ((205 + i * 26) * Math.PI) / 180;
    const a1 = a0 + (26 * Math.PI) / 180;
    const am = (a0 + a1) / 2 + 0.12;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a0) * hr * 0.92, hy + Math.sin(a0) * hr * 0.92);
    ctx.lineTo(cx + Math.cos(am) * hr * 1.22, hy + Math.sin(am) * hr * 1.22);
    ctx.lineTo(cx + Math.cos(a1) * hr * 0.92, hy + Math.sin(a1) * hr * 0.92);
    ctx.fillStyle = a.pelo;
    ctx.fill();
    ctx.stroke();
  }

  // ojos
  const ex = hr * 0.36;
  const ey = hy + hr * 0.05;
  const er = hr * 0.24;
  const asustado = p.expresion === "miedo" || p.expresion === "grito";
  const pupila = er * (asustado ? 0.26 : 0.42);
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    if (p.ojosCerrados) {
      ctx.beginPath();
      ctx.arc(x, ey - er * 0.2, er * 0.8, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      continue;
    }
    relleno("#fff6e8", () => ctx.ellipse(x, ey, er, er * 1.1, 0, 0, Math.PI * 2));
    ctx.beginPath();
    ctx.arc(x + p.mirar * er * 0.45, ey - (asustado ? er * 0.15 : 0), pupila, 0, Math.PI * 2);
    ctx.fillStyle = CONTORNO;
    ctx.fill();
    if (p.expresion === "sospecha") {
      relleno(a.piel, () => {
        ctx.moveTo(x - er - 4, ey + er * 0.1);
        ctx.arc(x, ey + er * 0.1, er + 4, Math.PI, Math.PI * 2);
        ctx.closePath();
      });
    }
  }

  // cejas
  ctx.lineWidth = lw * 1.6;
  for (const s of [-1, 1]) {
    const x = cx + s * ex;
    const by = ey - er * 1.55;
    ctx.beginPath();
    if (asustado) {
      ctx.moveTo(x + s * er * 0.9, by + er * 0.45);
      ctx.lineTo(x - s * er * 0.9, by - er * 0.05);
    } else {
      ctx.moveTo(x - er * 0.9, by + er * 0.12);
      ctx.lineTo(x + er * 0.9, by + er * 0.12);
    }
    ctx.stroke();
  }
  ctx.lineWidth = lw;

  // boca
  const my = hy + hr * 0.6;
  const mw = hr * 0.28;
  const abierta = p.expresion === "grito" ? 1 : p.boca;
  if (abierta > 0.1) {
    const alto = mw * (0.3 + 0.8 * abierta);
    relleno("#3a0c12", () => ctx.ellipse(cx, my, mw * 0.65, alto * 0.6, 0, 0, Math.PI * 2));
  } else if (p.expresion === "miedo") {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const x = cx - mw * 0.8 + i * mw * 0.32;
      const y = my + (i % 2 ? mw * 0.12 : -mw * 0.12);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  } else {
    ctx.beginPath();
    ctx.moveTo(cx - mw * 0.55, my);
    ctx.lineTo(cx + mw * 0.55, my);
    ctx.stroke();
  }
}
