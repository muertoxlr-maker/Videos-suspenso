// Bebé envuelto en su cobija, con el mismo trazo que los personajes (contorno de tinta, sombras frías, ojos redondos).
// Se usa en tres lugares de «La niñera»: en brazos de la niñera (pose `bebe` de personaje.ts), acostado en la cuna
// (tarjeta propia) y en las tomas en primera persona (tus brazos entrando desde abajo, `dibujarPOV`).
export type Bebe = {
  ojos: "dormido" | "abiertos" | "llora" | "fijos"; // fijos: abiertos de más, pupila mínima, sin brillo (el final)
  palido?: number; // 0 … 1: la piel se enfría (azul gris)
  boca?: number; // 0 … 1: boca abierta (llanto)
  mirar?: [number, number]; // hacia dónde mira con los ojos abiertos
  cobija?: string;
};

const TINTA = "#141012";
const hex = (c: string) => (c.startsWith("rgb") ? (c.match(/\d+/g) ?? []).slice(0, 3).map(Number) : [0, 2, 4].map((i) => parseInt(c.replace("#", "").slice(i, i + 2), 16))); // acepta #rrggbb y rgb()
const mezcla = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`; };
export const PIEL_BEBE = "#e2b896";

/** Bebé acostado de lado (cabeza a la izquierda si dir = 1). cx, cy: centro de la cabeza; r: radio de la cabeza en px. */
export function dibujarBebe(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, b: Bebe, dir: 1 | -1 = 1, luzX = -1) {
  const piel = mezcla(PIEL_BEBE, "#9aa8b8", (b.palido ?? 0) * 0.55);
  const cob = b.cobija ?? "#9cc4e4";
  const lw = Math.max(3, r * 0.075);
  const trazo = (dib: () => void, relleno: string | CanvasGradient, w = lw) => { ctx.beginPath(); dib(); ctx.fillStyle = relleno; ctx.fill(); ctx.lineWidth = w; ctx.strokeStyle = TINTA; ctx.stroke(); };
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  // ---- cuerpo envuelto: «tamal» de cobija con doblez y orilla tejida ----
  const bx = cx + dir * r * 1.55, by = cy + r * 0.22;
  const gC = ctx.createLinearGradient(bx, by - r, bx, by + r * 1.1);
  gC.addColorStop(0, mezcla(cob, "#fff4e2", 0.18)); gC.addColorStop(1, mezcla(cob, "#1a1f2a", 0.38));
  trazo(() => ctx.ellipse(bx, by, r * 1.75, r * 0.92, 0, 0, Math.PI * 2), gC);
  // doblez de la cobija que cruza en diagonal y la orilla con puntitos
  trazo(() => { ctx.moveTo(cx + dir * r * 0.55, cy - r * 0.62); ctx.quadraticCurveTo(bx, by - r * 0.15, bx + dir * r * 1.55, by + r * 0.5); ctx.quadraticCurveTo(bx, by + r * 0.95, cx + dir * r * 0.7, cy + r * 0.85); ctx.closePath(); }, mezcla(cob, "#1a1f2a", 0.2), lw * 0.8);
  ctx.fillStyle = "rgba(255,255,255,0.75)";
  for (let k = 0; k < 7; k++) { const t = k / 6; const x = cx + dir * r * (0.75 + t * 2.3), y = cy - r * 0.5 + t * r * 1.0 + Math.sin(t * 3) * r * 0.12; ctx.beginPath(); ctx.arc(x, y, r * 0.05, 0, 7); ctx.fill(); }
  // manita que asoma por la orilla
  trazo(() => ctx.arc(cx + dir * r * 1.0, cy + r * 0.62, r * 0.2, 0, Math.PI * 2), piel, lw * 0.8);
  // gorrito/capucha de la cobija alrededor de la cabeza
  trazo(() => ctx.arc(cx + dir * r * 0.08, cy, r * 1.16, 0, Math.PI * 2), mezcla(cob, "#fff4e2", 0.1));
  // ---- cabeza ----
  const gP = ctx.createRadialGradient(cx + luzX * r * 0.35, cy - r * 0.35, r * 0.1, cx, cy, r * 1.05);
  gP.addColorStop(0, mezcla(piel, "#fff4e2", 0.15)); gP.addColorStop(1, mezcla(piel, "#1a1f2a", 0.3));
  trazo(() => ctx.arc(cx, cy, r, 0, Math.PI * 2), gP);
  // mechón de pelo en la frente
  ctx.lineWidth = lw * 0.9; ctx.strokeStyle = TINTA;
  ctx.beginPath(); ctx.moveTo(cx - r * 0.05, cy - r * 0.98); ctx.quadraticCurveTo(cx + r * 0.32, cy - r * 0.78, cx + r * 0.08, cy - r * 0.55); ctx.stroke();
  // cachetes
  ctx.fillStyle = `rgba(232,120,120,${0.35 * (1 - (b.palido ?? 0))})`;
  for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * r * 0.5, cy + r * 0.3, r * 0.18, r * 0.11, 0, 0, 7); ctx.fill(); }
  // ---- ojos ----
  const ey = cy - r * 0.05, ex = r * 0.36;
  if (b.ojos === "dormido") {
    ctx.lineWidth = lw; for (const s of [-1, 1]) { ctx.beginPath(); ctx.arc(cx + s * ex, ey - r * 0.04, r * 0.15, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
  } else if (b.ojos === "llora") {
    ctx.lineWidth = lw; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * ex - r * 0.14, ey - r * 0.1); ctx.lineTo(cx + s * ex + s * r * 0.02, ey); ctx.lineTo(cx + s * ex - r * 0.14 + 0, ey + r * 0.1); ctx.stroke(); }
    ctx.fillStyle = "rgba(170,215,255,0.9)"; for (const s of [-1, 1]) { ctx.beginPath(); ctx.ellipse(cx + s * ex, ey + r * 0.3, r * 0.05, r * 0.12, 0, 0, 7); ctx.fill(); } // lagrimitas
  } else {
    const fijos = b.ojos === "fijos";
    const ro = r * (fijos ? 0.21 : 0.18), [mx, my] = b.mirar ?? [0, 0];
    for (const s of [-1, 1]) {
      trazo(() => ctx.arc(cx + s * ex, ey, ro, 0, Math.PI * 2), fijos ? "#eef2f4" : "#ffffff", lw * 0.85);
      ctx.fillStyle = TINTA; ctx.beginPath(); ctx.arc(cx + s * ex + mx * ro * 0.35, ey + my * ro * 0.35, ro * (fijos ? 0.2 : 0.42), 0, 7); ctx.fill();
      if (!fijos) { ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx + s * ex + mx * ro * 0.35 - ro * 0.15, ey + my * ro * 0.35 - ro * 0.15, ro * 0.13, 0, 7); ctx.fill(); }
    }
  }
  // ---- nariz y boca ----
  ctx.fillStyle = mezcla(piel, "#1a1f2a", 0.35); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.2, r * 0.07, r * 0.045, 0, 0, 7); ctx.fill();
  const ab = b.ojos === "llora" ? Math.max(0.6, b.boca ?? 0.8) : (b.boca ?? 0);
  if (ab > 0.05) trazo(() => ctx.ellipse(cx, cy + r * 0.48, r * 0.16, r * 0.1 + r * 0.14 * ab, 0, 0, Math.PI * 2), "#7a2a30", lw * 0.8);
  else { ctx.lineWidth = lw * 0.85; ctx.beginPath(); ctx.arc(cx, cy + r * 0.38, r * 0.1, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
  ctx.restore();
}

/** Tus brazos en primera persona: entran desde las esquinas de abajo (mangas de sudadera, manos redondas).
 *  modo «alcanza»: manos abiertas hacia arriba; «carga»: sostienen al bebé (se ve su cara); «toca»: una mano en su cachete. */
export function dibujarPOV(ctx: CanvasRenderingContext2D, W: number, H: number, modo: "alcanza" | "carga" | "toca", manga: string, piel: string, b: Bebe, tiembla = 0, f = 0) {
  ctx.clearRect(0, 0, W, H);
  ctx.save(); ctx.lineJoin = "round"; ctx.lineCap = "round";
  const lw = 12;
  const trazo = (dib: () => void, relleno: string | CanvasGradient, w = lw) => { ctx.beginPath(); dib(); ctx.fillStyle = relleno; ctx.fill(); ctx.lineWidth = w; ctx.strokeStyle = TINTA; ctx.stroke(); };
  const tx = Math.sin(f * 1.7) * tiembla * 6, ty = Math.cos(f * 2.3) * tiembla * 5;
  const brazo = (x0: number, y0: number, x1: number, y1: number, ancho: number) => { // manga gruesa con puño
    const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a) * ancho / 2, ny = Math.cos(a) * ancho / 2;
    const g = ctx.createLinearGradient(x0 + nx, y0 + ny, x0 - nx, y0 - ny); g.addColorStop(0, mezcla(manga, "#fff4e2", 0.12)); g.addColorStop(1, mezcla(manga, "#1a1f2a", 0.4));
    trazo(() => { ctx.moveTo(x0 + nx, y0 + ny); ctx.lineTo(x1 + nx * 0.85, y1 + ny * 0.85); ctx.lineTo(x1 - nx * 0.85, y1 - ny * 0.85); ctx.lineTo(x0 - nx, y0 - ny); ctx.closePath(); }, g);
    trazo(() => { ctx.moveTo(x1 + nx * 0.92, y1 + ny * 0.92); ctx.lineTo(x1 - nx * 0.92, y1 - ny * 0.92); ctx.lineTo(x1 - nx * 0.92 + Math.cos(a) * 26, y1 - ny * 0.92 + Math.sin(a) * 26); ctx.lineTo(x1 + nx * 0.92 + Math.cos(a) * 26, y1 + ny * 0.92 + Math.sin(a) * 26); ctx.closePath(); }, mezcla(manga, "#1a1f2a", 0.25), lw * 0.8); // puño
    return [x1 + Math.cos(a) * 26, y1 + Math.sin(a) * 26, a] as const;
  };
  const mano = (x: number, y: number, a: number, abierta: boolean, r = 62) => { // palma redonda con dedos de salchicha
    const g = ctx.createRadialGradient(x - 12, y - 14, 6, x, y, r * 1.2); g.addColorStop(0, mezcla(piel, "#fff4e2", 0.12)); g.addColorStop(1, mezcla(piel, "#1a1f2a", 0.3));
    if (abierta) for (let k = 0; k < 4; k++) { const d = a + (k - 1.5) * 0.32; trazo(() => ctx.ellipse(x + Math.cos(d) * r * 1.05, y + Math.sin(d) * r * 1.05, r * 0.42, r * 0.2, d, 0, Math.PI * 2), g, lw * 0.8); }
    trazo(() => ctx.ellipse(x, y, r, r * 0.9, a, 0, Math.PI * 2), g);
    const dp = a + (abierta ? -1.35 : -1.0); trazo(() => ctx.ellipse(x + Math.cos(dp) * r * 0.85, y + Math.sin(dp) * r * 0.85, r * 0.38, r * 0.2, dp, 0, Math.PI * 2), g, lw * 0.8); // pulgar
  };
  if (modo === "alcanza") {
    const [xa, ya, aa] = brazo(-60 + tx, H + 40, W * 0.3 + tx, H * 0.48 + ty, 190); mano(xa, ya, aa, true);
    const [xb, yb, ab] = brazo(W + 60 + tx, H + 40, W * 0.7 + tx, H * 0.5 + ty, 190); mano(xb, yb, ab, true);
  } else {
    // el bebé atravesado en tus brazos, con la cabeza a la izquierda
    const r = W * 0.17, cx = W * 0.36 + tx, cy = H * 0.5 + ty;
    const [, , aa] = brazo(-80 + tx, H * 0.95, W * 0.18 + tx, H * 0.6 + ty, 200); // brazo izquierdo: debajo de la cabeza
    dibujarBebe(ctx, cx, cy, r, b, 1);
    mano(W * 0.2 + tx, H * 0.6 + ty, aa, false, 58); // la mano bajo la nuca asoma por la orilla
    const [xb, yb, ab] = brazo(W + 80 + tx, H + 60, W * 0.72 + tx, H * 0.66 + ty, 200); // brazo derecho rodea la cobija
    if (modo === "carga") mano(xb, yb, ab, false);
    else { // «toca»: la mano derecha sube hasta el cachete del bebé
      const [xc, yc, ac] = brazo(W * 0.72 + tx, H * 0.66 + ty, cx + r * 0.85, cy + r * 0.55, 150); mano(xc, yc, ac, true, 52);
      void xb; void yb; void ab;
    }
  }
  ctx.restore();
}
