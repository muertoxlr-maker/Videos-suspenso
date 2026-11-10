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
  peinado: "revuelto" | "mono" | "rizado" | "trenza" | "recogido";
  lentes?: boolean;
  // ---- opcionales (añadidos para «El turno de las 3:00»; sin ellos el dibujo es el aprobado) ----
  bigote?: boolean;
  cuello?: "v" | "capucha" | "redondo";
  estampado?: "puntos"; // bata de hospital
  insignia?: { tipo: "gafete" | "etiqueta" };
  gorra?: string; // color de una gorra con visera («Gasolinera»)
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
  boca: "linea" | "dientes" | "o" | "sonrisa" | "abierta" | "amable";
  sostiene?: "inhalador" | "celular" | "celularEncendido"; // objeto en la mano derecha del personaje (izquierda de la pantalla)
  bocaAbre?: number; // 0 … 1 con boca "abierta" (hablar)
  ojosVacios?: boolean; // «el otro turno»: pupila mínima y ojeras
  sudor: number;
  // brazos articulados: hombro y codo, ángulos desde la vertical (positivo = hacia fuera)
  brazoIzq: [number, number];
  brazoDer: [number, number];
  piernas: [number, number]; // cuánto se levanta cada pie (0 … 1)
  respira: number;
  luzX: number; // -1 luz desde la izquierda de la pantalla … 1 desde la derecha
  // cuerpo (los pies NO se mueven: la cadera se desplaza y las piernas se inclinan)
  cuerpoX?: number; // desplazamiento lateral de cadera y torso, en diámetros de cabeza
  cabezaX?: number; // desplazamiento extra de la cabeza sobre el torso
  hombros?: number; // 0 … 1: hombros encogidos (la cabeza se hunde entre ellos)
  agacha?: number; // 0 … 1: flexiona las rodillas (baja la cadera)
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
  let cx = W / 2;
  const cxPies = cx;
  // proporciones (video 4): pelo 0.12 D · cabeza D · torso 0.85 D · piernas 0.65 D  →  alto ≈ 2.55 D
  const D = alto / 2.55; // diámetro de la cabeza (sin pelo)
  const r = D / 2;
  const resp = p.respira * 3;
  const baja = (p.agacha ?? 0) * D * 0.07;
  const encoge = (p.hombros ?? 0);
  const cabezaY = TOPE + 0.12 * D + r + resp * 0.5 + baja + encoge * D * 0.06;
  const torsoTop = TOPE + 0.12 * D + r + r * 0.86 + resp * 0.8 + baja;
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
  const cxCadera = cx + (p.cuerpoX ?? 0) * D;
  for (const [i, s] of [[0, -1], [1, 1]] as const) {
    const x = cxPies + s * anchoBajo * 0.2; // el pie se queda donde está
    const xc = cxCadera + s * anchoBajo * 0.2;
    const pieY = PIES - 9 - p.piernas[i] * 40;
    linea([[xc, torsoBot - 6], [x, pieY - 4]], sombra(a.pantalon, 0.15), 9);
    contorno(() => ctx.ellipse(x + s * 9, pieY, 25, 10, 0, 0, Math.PI * 2), a.zapatos, 5);
  }

  cx = cxCadera; // desde aquí, torso, brazos y cabeza siguen a la cadera
  // ---------------- brazos articulados (detrás del torso) ----------------
  const hombroY = torsoTop + D * 0.12 - encoge * D * 0.07;
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

  if (a.cuello === "capucha") {
    contorno(() => ctx.roundRect(cx - anchoHombro * 0.42, torsoTop - D * 0.1, anchoHombro * 0.84, D * 0.26, D * 0.12), sombra(a.ropa, 0.2), 7);
  }
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
  if (a.estampado === "puntos") {
    ctx.fillStyle = sombra(a.ropa, 0.28);
    for (let yy = torsoTop + 14; yy < torsoBot; yy += 26) for (let xx = cx - anchoBajo / 2 + ((yy / 26) % 2 ? 6 : 19); xx < cx + anchoBajo / 2; xx += 26) {
      ctx.beginPath(); ctx.arc(xx, yy, 4, 0, 7); ctx.fill();
    }
  }
  if (p.vista === "frente" && a.cuello === "capucha") {
    // sudadera: cuello redondo con la camiseta, cordones de la capucha y bolsillo canguro
    ctx.fillStyle = a.ropaInterior;
    ctx.beginPath(); ctx.ellipse(cx, torsoTop, D * 0.16, D * 0.09, 0, 0, Math.PI); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = TINTA; ctx.stroke();
    ctx.lineWidth = 4; ctx.strokeStyle = "#e9e4d8";
    for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * D * 0.07, torsoTop + 6); ctx.lineTo(cx + s * D * 0.08, torsoTop + D * 0.28); ctx.stroke(); }
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.ropa, 0.55);
    ctx.beginPath(); ctx.moveTo(cx - D * 0.24, torsoTop + torsoH * 0.62); ctx.lineTo(cx + D * 0.24, torsoTop + torsoH * 0.62);
    ctx.lineTo(cx + D * 0.28, torsoBot - 22); ctx.moveTo(cx - D * 0.24, torsoTop + torsoH * 0.62); ctx.lineTo(cx - D * 0.28, torsoBot - 22); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - anchoBajo / 2, torsoBot - 20); ctx.lineTo(cx + anchoBajo / 2, torsoBot - 20); ctx.stroke();
  } else if (p.vista === "frente" && a.cuello === "redondo") {
    ctx.fillStyle = a.ropaInterior;
    ctx.beginPath(); ctx.ellipse(cx, torsoTop, D * 0.15, D * 0.1, 0, 0, Math.PI); ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = TINTA; ctx.stroke();
  } else if (p.vista === "frente") {
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
  } else if (p.vista === "espalda") {
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.ropa, 0.55);
    ctx.beginPath(); ctx.moveTo(cx - anchoBajo / 2, torsoBot - 20); ctx.lineTo(cx + anchoBajo / 2, torsoBot - 20); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx - D * 0.2, torsoTop + 6); ctx.quadraticCurveTo(cx, torsoTop + 22, cx + D * 0.2, torsoTop + 6); ctx.stroke();
  }
  if (p.vista === "frente" && a.insignia) {
    // gafete (enfermera) o etiqueta de visitante, sobre el pecho izquierdo del personaje
    const bx = cx + D * 0.2, by = torsoTop + torsoH * 0.3, bw = D * 0.2, bh = D * 0.15;
    ctx.fillStyle = "#f2efe6"; ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh);
    ctx.lineWidth = 3; ctx.strokeStyle = TINTA; ctx.strokeRect(bx - bw / 2, by - bh / 2, bw, bh);
    if (a.insignia.tipo === "etiqueta") { ctx.fillStyle = "#b8262e"; ctx.fillRect(bx - bw / 2, by - bh / 2, bw, bh * 0.32); }
    else { ctx.fillStyle = "#8aa0a8"; ctx.fillRect(bx - bw / 2 + 4, by - bh / 2 + 4, bw * 0.3, bh * 0.55); }
    ctx.lineWidth = 2; ctx.strokeStyle = "#5a5450";
    for (const k of [0.15, 0.32]) { ctx.beginPath(); ctx.moveTo(bx - bw * 0.05, by + bh * k - 2); ctx.lineTo(bx + bw * 0.4, by + bh * k - 2); ctx.stroke(); }
  }
  ctx.restore();
  // objeto en la mano (se dibuja antes de la mano para que los dedos lo tapen)
  if (p.sostiene === "inhalador") {
    const [hx2, hy2] = manos[0];
    contorno(() => ctx.roundRect(hx2 - 14, hy2 - 52, 28, 50, 8), "#c7ccd2", 5);
    contorno(() => ctx.roundRect(hx2 - 20, hy2 - 16, 40, 44, 10), "#6fa0c8", 6);
  }
  if (p.sostiene === "celular" || p.sostiene === "celularEncendido") {
    const [hx2, hy2] = manos[0];
    if (p.sostiene === "celularEncendido") { // brillo de la pantalla alrededor de la mano
      const gl = ctx.createRadialGradient(hx2, hy2 - 30, 4, hx2, hy2 - 30, 90);
      gl.addColorStop(0, "rgba(190,230,255,0.75)"); gl.addColorStop(1, "rgba(190,230,255,0)");
      ctx.fillStyle = gl; ctx.fillRect(hx2 - 90, hy2 - 120, 180, 180);
    }
    contorno(() => ctx.roundRect(hx2 - 17, hy2 - 62, 34, 62, 7), "#1d2126", 5);
    ctx.fillStyle = p.sostiene === "celularEncendido" ? "#d8f0ff" : "#2c333b"; ctx.fillRect(hx2 - 12, hy2 - 56, 24, 46);
  }
  // manos pequeñas y redondas, con su lado de sombra
  for (const [mx, my] of manos) {
    const g = ctx.createRadialGradient(mx - L * -6, my - 6, 2, mx, my, 17);
    g.addColorStop(0, luz(a.piel, 0.08)); g.addColorStop(1, sombra(a.piel, 0.28));
    contorno(() => ctx.arc(mx, my, 15, 0, Math.PI * 2), g, 6);
  }

  // ---------------- cabeza ----------------
  cx += (p.cabezaX ?? 0) * D;
  const g = p.vista === "frente" ? p.giro : 0;
  if (a.peinado === "mono") {
    contorno(() => ctx.arc(cx - g * r * 0.3 + (p.vista === "espalda" ? 0 : 0), cabezaY - r * 0.95, r * 0.3, 0, Math.PI * 2), gradLado(cx - r * 0.3, cx + r * 0.3, a.pelo, 0.4));
  }
  if (a.peinado === "trenza" && p.vista === "frente") {
    // trenza que cae por detrás del hombro derecho del personaje (izquierda de la pantalla)
    for (let i = 0; i < 6; i++) {
      const tx = cx - r * 0.78 - i * r * 0.03, ty = cabezaY + r * 0.25 + i * r * 0.27;
      contorno(() => ctx.ellipse(tx, ty, r * 0.16 - i * 2, r * 0.17, 0.3 * (i % 2 ? 1 : -1), 0, Math.PI * 2), gradLado(tx - r * 0.2, tx + r * 0.2, a.pelo, 0.35), 6);
    }
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
    // nuca: el pelo cubre casi toda la cabeza (también los lados); solo asoma una franja de piel junto al cuello
    const gp = ctx.createLinearGradient(cx - r, cabezaY - r, cx + r, cabezaY + r);
    gp.addColorStop(0, L < 0 ? a.pelo : sombra(a.pelo, 0.15)); gp.addColorStop(1, L < 0 ? sombra(a.pelo, 0.2) : a.pelo);
    contorno(() => {
      ctx.moveTo(cx - r * 1.05, cabezaY + r * 0.45);
      ctx.bezierCurveTo(cx - r * 1.24, cabezaY - r * 1.44, cx + r * 1.24, cabezaY - r * 1.44, cx + r * 1.03, cabezaY + r * 0.45);
      for (let i = 0; i <= 10; i++) { // borde de la nuca con mechones cortos, más bajo en el centro
        const t = i / 10, x = cx + r * (1.03 - 2.06 * t);
        ctx.lineTo(x, cabezaY + r * (0.5 + 0.28 * Math.sin(t * Math.PI) + (i % 2 ? 0.07 : -0.02)));
      }
      ctx.closePath();
    }, gp);
    // mechones dibujados encima para que se lea como pelo y no como una mancha
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.pelo, 0.45);
    for (const [x0, y0, x1, y1] of [[-0.5, -0.6, -0.35, 0.1], [0.05, -0.75, 0.0, 0.2], [0.5, -0.55, 0.38, 0.12], [-0.2, -0.3, -0.12, 0.45], [0.25, -0.25, 0.2, 0.42]]) {
      ctx.beginPath(); ctx.moveTo(cx + x0 * r, cabezaY + y0 * r); ctx.quadraticCurveTo(cx + (x0 + x1) * 0.5 * r + 8, cabezaY + (y0 + y1) * 0.5 * r, cx + x1 * r, cabezaY + y1 * r); ctx.stroke();
    }
    if (a.peinado === "mono") contorno(() => ctx.arc(cx, cabezaY - r * 0.1, r * 0.28, 0, Math.PI * 2), sombra(a.pelo, 0.1));
    return;
  }

  // pelo revuelto: casquete con flequillo en picos irregulares y mechones sueltos a los lados
  const px = cx + g * r * 0.12; // el flequillo se corre un poco hacia donde mira; la silueta del pelo no se mueve
  const gp = ctx.createLinearGradient(cx - r, 0, cx + r, 0);
  gp.addColorStop(0, L < 0 ? luz(a.pelo, 0.12) : a.pelo); gp.addColorStop(1, L < 0 ? a.pelo : luz(a.pelo, 0.12));
  contorno(() => {
    ctx.moveTo(cx - r * 1.06, cabezaY + r * 0.05);
    ctx.bezierCurveTo(cx - r * 1.24, cabezaY - r * 1.42, cx + r * 1.24, cabezaY - r * 1.42, cx + r * 1.06, cabezaY + r * 0.05);
    if (a.peinado === "rizado") {
      ctx.lineTo(cx + r * 1.08, cabezaY - r * 0.4);
      ctx.quadraticCurveTo(cx, cabezaY - r * 0.9, cx - r * 1.08, cabezaY - r * 0.4);
    } else if (a.peinado === "revuelto") {
      // mechón suelto del lado derecho
      ctx.lineTo(cx + r * 1.1, cabezaY - r * 0.22);
      const n = 7;
      for (let i = n; i >= 0; i--) {
        const t = i / n, x = cx + r * (-0.95 + 1.9 * t) + g * r * 0.12 * Math.sin(t * Math.PI);
        const pico = i % 2 ? 0.0 : 0.17 + rnd() * 0.08;
        ctx.lineTo(x + (rnd() - 0.5) * 6, cabezaY - r * (0.56 - pico) + Math.sin(t * Math.PI) * -r * 0.04);
      }
      ctx.lineTo(cx - r * 1.1, cabezaY - r * 0.2);
    } else {
      ctx.quadraticCurveTo(px + r * 0.2, cabezaY - r * 0.55, px - r * 0.2, cabezaY - r * 0.62);
      ctx.quadraticCurveTo(px - r * 0.7, cabezaY - r * 0.5, cx - r * 1.06, cabezaY + r * 0.05);
    }
    ctx.closePath();
  }, gp);
  if (a.peinado === "rizado") {
    // rizos: bucles pequeños con su contorno sobre la silueta y la línea del pelo
    for (let i = 0; i <= 12; i++) {
      const ang = Math.PI * (1.0 + i / 12);
      const rr = i === 0 || i === 12 ? r * 0.95 : r * 1.12;
      const bx = cx + Math.cos(ang) * rr, by = cabezaY - r * 0.12 + Math.sin(ang) * rr * 0.98;
      contorno(() => ctx.arc(bx, by, r * 0.17, 0, Math.PI * 2), gradLado(bx - r * 0.2, bx + r * 0.2, a.pelo, 0.25), 5);
    }
    for (let i = 0; i < 7; i++) {
      const bx = cx + r * (-0.72 + i * 0.24), by = cabezaY - r * (0.66 + 0.08 * Math.sin((i / 6) * Math.PI));
      contorno(() => ctx.arc(bx, by, r * 0.13, 0, Math.PI * 2), luz(a.pelo, 0.06), 5);
    }
  }
  if (a.peinado === "trenza" || a.peinado === "recogido") {
    // raya al medio
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.pelo, 0.5);
    ctx.beginPath(); ctx.moveTo(px, cabezaY - r * 1.0); ctx.quadraticCurveTo(px + 4, cabezaY - r * 0.8, px - 2, cabezaY - r * 0.62); ctx.stroke();
  }
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

  if (a.gorra) {
    // copa redonda sobre el pelo y visera que se corre hacia donde gira la cabeza
    contorno(() => {
      ctx.moveTo(cx - r * 1.1, cabezaY - r * 0.3);
      ctx.bezierCurveTo(cx - r * 1.2, cabezaY - r * 1.5, cx + r * 1.2, cabezaY - r * 1.5, cx + r * 1.1, cabezaY - r * 0.3);
      ctx.closePath();
    }, gradLado(cx - r, cx + r, a.gorra, 0.3));
    ctx.lineWidth = 4; ctx.strokeStyle = sombra(a.gorra, 0.4);
    ctx.beginPath(); ctx.moveTo(cx, cabezaY - r * 1.18); ctx.quadraticCurveTo(cx + g * r * 0.3, cabezaY - r * 0.8, cx + g * r * 0.2, cabezaY - r * 0.36); ctx.stroke();
    contorno(() => ctx.ellipse(cx + g * r * 0.35, cabezaY - r * 0.33, r * 0.9, r * 0.15, 0, 0, Math.PI * 2), sombra(a.gorra, 0.22), 6);
  }
  // ---------------- cara (se corre hacia el lado del giro: 3/4) ----------------
  const fx = cx + g * r * 0.26;
  const ey = cabezaY + r * 0.08;
  const er = r * 0.2 * p.ojos;
  const sep = r * 0.4 * (1 - 0.22 * Math.abs(g));
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
    if (p.ojosVacios) { // ojeras grisáceas bajo cada ojo
      ctx.lineWidth = 4; ctx.strokeStyle = "rgba(60,50,70,0.55)";
      ctx.beginPath(); ctx.ellipse(x, ey + er * 0.2, er * sx * 1.05, er * 1.15, 0, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    }
    const pr = er * (p.ojosVacios ? 0.11 : p.pupila);
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
  } else if (p.boca === "sonrisa") {
    // sonrisa fija, demasiado ancha, con todos los dientes
    const sw = mw * 1.75;
    contorno(() => { ctx.moveTo(mx - sw, my - r * 0.06); ctx.quadraticCurveTo(mx, my + r * 0.34, mx + sw, my - r * 0.06); ctx.quadraticCurveTo(mx, my + r * 0.08, mx - sw, my - r * 0.06); }, "#f3eee2", 6);
    ctx.lineWidth = 3; ctx.strokeStyle = TINTA;
    for (let i = 1; i < 8; i++) { const x = mx - sw + (2 * sw * i) / 8; ctx.beginPath(); ctx.moveTo(x, my - r * 0.02 + Math.abs(i - 4) * -1.5); ctx.lineTo(x, my + r * 0.16 - Math.abs(i - 4) * 4); ctx.stroke(); }
  } else if (p.boca === "amable") {
    ctx.lineWidth = 7; ctx.strokeStyle = TINTA;
    ctx.beginPath(); ctx.moveTo(mx - mw * 0.7, my - r * 0.03); ctx.quadraticCurveTo(mx, my + r * 0.12, mx + mw * 0.7, my - r * 0.03); ctx.stroke();
  } else if (p.boca === "abierta") {
    const k = Math.max(0.05, p.bocaAbre ?? 0.5);
    contorno(() => ctx.ellipse(mx, my, mw * 0.55, r * (0.03 + 0.11 * k), 0, 0, Math.PI * 2), "#3a0d14", 6);
  } else if (p.boca === "o") {
    contorno(() => ctx.ellipse(mx, my, mw * 0.4, r * 0.12, 0, 0, Math.PI * 2), "#3a0d14", 6);
  } else {
    ctx.lineWidth = 7; ctx.strokeStyle = TINTA;
    ctx.beginPath(); ctx.moveTo(mx - mw * 0.6, my); ctx.lineTo(mx + mw * 0.6, my); ctx.stroke();
  }
  if (a.bigote) {
    contorno(() => { ctx.moveTo(mx - mw * 1.0, my - r * 0.08); ctx.quadraticCurveTo(mx, my - r * 0.3, mx + mw * 1.0, my - r * 0.08); ctx.quadraticCurveTo(mx, my - r * 0.14, mx - mw * 1.0, my - r * 0.08); }, a.pelo, 5);
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
