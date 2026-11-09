// Dibujos 2D de los insertos (primeros planos de objetos y manos) con el trazo del estándar §8:
// tinta casi negra, degradados suaves, sombras frías. Se pegan como tarjetas dentro del escenario 3D.
type C = CanvasRenderingContext2D;
const TINTA = "#141012";

function hex(c: string): [number, number, number] {
  const h = c.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
}
const mezcla = (a: string, b: string, t: number) => { const x = hex(a), y = hex(b); return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`; };
const sombra = (c: string, t = 0.35) => mezcla(c, "#1a1f2a", t);
const luz = (c: string, t = 0.12) => mezcla(c, "#fff4e2", t);
const trazo = (c: C, fill: string | CanvasGradient, w = 7) => { c.fillStyle = fill; c.fill(); c.lineWidth = w; c.strokeStyle = TINTA; c.stroke(); };
const grad = (c: C, x0: number, y0: number, x1: number, y1: number, base: string, k = 0.3) => {
  const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, luz(base, 0.1)); g.addColorStop(1, sombra(base, k)); return g;
};
const manuscrito = "italic bold 34px 'DejaVu Serif', serif";

/** Mano de caricatura: palma redonda y dedos de salchicha. ang = rotación, s = escala. */
function mano(c: C, x: number, y: number, s: number, ang: number, piel: string, arrugas = false, cerrada = 0) {
  c.save(); c.translate(x, y); c.rotate(ang); c.scale(s, s);
  const g = grad(c, -60, -60, 60, 60, piel, 0.3);
  // dedos
  for (let i = 0; i < 4; i++) {
    const dx = -42 + i * 28, largo = (i === 1 || i === 2 ? 78 : 66) * (1 - 0.45 * cerrada);
    c.beginPath(); c.roundRect(dx - 13, -50 - largo, 26, largo + 20, 13); trazo(c, g, 6);
  }
  c.beginPath(); c.ellipse(0, 0, 62, 56, 0, 0, Math.PI * 2); trazo(c, g, 7); // palma
  c.beginPath(); c.roundRect(46, -30, 24, 62, 12); c.save(); c.translate(58, 0); c.rotate(-0.5); c.translate(-58, 0); trazo(c, g, 6); c.restore(); // pulgar
  if (arrugas) {
    c.lineWidth = 3; c.strokeStyle = sombra(piel, 0.55);
    for (const [a, b, d] of [[-30, -10, 40], [-20, 12, 34], [-36, 28, 30]]) { c.beginPath(); c.moveTo(a, b); c.quadraticCurveTo(a + d / 2, b - 6, a + d, b); c.stroke(); }
    c.fillStyle = sombra(piel, 0.3); for (const [a, b] of [[20, -20], [8, 18], [30, 10]]) { c.beginPath(); c.arc(a, b, 4, 0, 7); c.fill(); }
  }
  c.restore();
}

export function dibManos(c: C, w: number, h: number, k: number) {
  // fondo: la cobija de la abuela, azul pálido con pliegues
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#5b7484"); g.addColorStop(1, "#2f3d48");
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = "rgba(20,25,35,0.35)"; c.lineWidth = 6; for (let y = 60; y < h; y += 90) { c.beginPath(); c.moveTo(0, y); c.quadraticCurveTo(w / 2, y + 30, w, y); c.stroke(); }
  const piel = "#dcc0a4", vieja = "#e3c3a8";
  // TU mano: entra desde la izquierda (manga azul marino), dorso hacia arriba, dedos hacia la derecha
  const yT = h * 0.64;
  c.beginPath(); c.roundRect(-40, yT - 70, w * 0.34, 140, 40); trazo(c, grad(c, 0, yT - 70, 0, yT + 70, "#26324a"), 8);
  c.beginPath(); c.ellipse(w * 0.36, yT, 100, 78, 0, 0, Math.PI * 2); trazo(c, grad(c, 0, yT - 70, 0, yT + 70, piel, 0.25), 8);
  for (let i = 0; i < 4; i++) { c.beginPath(); c.roundRect(w * 0.45, yT - 66 + i * 38, 130 - Math.abs(i - 1.5) * 16, 34, 17); trazo(c, grad(c, 0, yT - 62, 0, yT + 70, piel, 0.25), 6); }
  // LA MANO DE LA ABUELA: llega desde arriba a la derecha (manga de bata con puntos) y se cierra sobre la tuya
  const baja = 40 * k;
  c.beginPath(); c.roundRect(w * 0.42, -60, w * 0.5, h * 0.34 + baja, 50); trazo(c, grad(c, 0, 0, 0, h * 0.36, "#9db8c8"), 8);
  c.fillStyle = sombra("#9db8c8", 0.3); for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(w * 0.5 + (i % 3) * 55, 30 + Math.floor(i / 3) * 55 + baja * 0.5, 6, 0, 7); c.fill(); }
  const cx = w * 0.46, cy = h * 0.4 + baja;
  c.beginPath(); c.ellipse(cx, cy, 100, 84, -0.3, 0, Math.PI * 2); trazo(c, grad(c, cx - 100, cy - 80, cx + 100, cy + 80, vieja, 0.3), 8);
  // dedos que bajan y rodean tu mano (más cerrados con k)
  for (let i = 0; i < 4; i++) {
    const x = cx - 105 + i * 46, largo = 120 + 70 * k - Math.abs(i - 1.5) * 14;
    c.beginPath(); c.roundRect(x - 19, cy + 20, 38, largo, 19); trazo(c, grad(c, x - 20, 0, x + 20, 0, vieja, 0.3), 7);
    c.lineWidth = 3; c.strokeStyle = sombra(vieja, 0.5); for (const d of [0.35, 0.65]) { c.beginPath(); c.moveTo(x - 10, cy + 20 + largo * d); c.lineTo(x + 10, cy + 20 + largo * d); c.stroke(); } // nudillos
  }
  // pulgar de la abuela por encima
  c.beginPath(); c.roundRect(cx + 70, cy - 30, 40, 120, 20); trazo(c, grad(c, 0, cy, 0, cy + 100, vieja, 0.3), 7);
  // arrugas y manchas de la edad
  c.lineWidth = 3; c.strokeStyle = sombra(vieja, 0.55);
  for (const [a2, b2, d] of [[-50, -20, 46], [-30, 4, 40], [-56, 26, 34]]) { c.beginPath(); c.moveTo(cx + a2, cy + b2); c.quadraticCurveTo(cx + a2 + d / 2, cy + b2 - 7, cx + a2 + d, cy + b2); c.stroke(); }
  c.fillStyle = sombra(vieja, 0.28); for (const [a2, b2] of [[30, -26], [12, 22], [52, 6]]) { c.beginPath(); c.arc(cx + a2, cy + b2, 6, 0, 7); c.fill(); }
}

export function dibInhalador(c: C, w: number, h: number, presion: number) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#40525e"); g.addColorStop(1, "#1d262e"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  const dy = presion * 30;
  // cuerpo del inhalador (plástico azul claro) y el cartucho metálico que se presiona
  c.beginPath(); c.roundRect(w * 0.34, h * 0.36 + dy, w * 0.18, h * 0.3, 18); trazo(c, grad(c, w * 0.34, 0, w * 0.52, 0, "#c7ccd2"), 7);
  c.beginPath(); c.roundRect(w * 0.3, h * 0.52, w * 0.32, h * 0.34, 24); trazo(c, grad(c, w * 0.3, 0, w * 0.62, 0, "#6fa0c8"), 8);
  c.beginPath(); c.roundRect(w * 0.12, h * 0.66, w * 0.24, h * 0.12, 16); trazo(c, grad(c, 0, h * 0.66, 0, h * 0.78, "#6fa0c8"), 7);
  // pulgar que presiona desde arriba y la mano que lo sostiene
  mano(c, w * 0.44, h * 0.25 + dy, 0.9, Math.PI, "#dcc0a4", false, 0.6);
  mano(c, w * 0.62, h * 0.82, 1.0, -0.4, "#dcc0a4", false, 0.7);
  // sin nube: solo un hilito que se apaga
  if (presion > 0.6) { c.strokeStyle = "rgba(220,230,240,0.35)"; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.12, h * 0.72); c.quadraticCurveTo(w * 0.05, h * 0.7, w * 0.02, h * 0.74); c.stroke(); }
}

export function dibTimbre(c: C, w: number, h: number, presion: number, luzRoja: number) {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, "#c6cfcb"); g.addColorStop(1, "#8c9893"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.beginPath(); c.roundRect(w * 0.22, h * 0.2, w * 0.56, h * 0.6, 26); trazo(c, grad(c, 0, h * 0.2, 0, h * 0.8, "#e6e3da"), 8);
  // botón rojo con su luz
  if (luzRoja > 0) {
    const gl = c.createRadialGradient(w * 0.5, h * 0.48, 10, w * 0.5, h * 0.48, w * 0.3);
    gl.addColorStop(0, `rgba(255,70,60,${0.7 * luzRoja})`); gl.addColorStop(1, "rgba(255,70,60,0)"); c.fillStyle = gl; c.fillRect(0, 0, w, h);
  }
  c.beginPath(); c.arc(w * 0.5, h * 0.48, w * 0.13, 0, Math.PI * 2); trazo(c, luzRoja > 0 ? "#ff4a3d" : "#a8241f", 8);
  c.fillStyle = "#3a3a36"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("LLAMADA", w * 0.5, h * 0.72);
  // el dedo que presiona entra desde abajo a la derecha
  c.beginPath(); c.roundRect(w * 0.47, h * 0.5 + 40 - presion * 40, 46, h * 0.7, 23); trazo(c, grad(c, w * 0.47, 0, w * 0.6, 0, "#dcc0a4"), 7);
  c.beginPath(); c.roundRect(w * 0.42, h * 0.86 - presion * 40, w * 0.4, h * 0.3, 30); trazo(c, grad(c, 0, h * 0.8, 0, h, "#26324a"), 7);
}

export function dibGafete(c: C, w: number, h: number, nombre: string) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#4f8a78"); g.addColorStop(1, "#2c5146"); c.fillStyle = g; c.fillRect(0, 0, w, h); // uniforme verde
  c.strokeStyle = "rgba(20,40,34,0.5)"; c.lineWidth = 5; c.beginPath(); c.moveTo(w * 0.08, 0); c.lineTo(w * 0.2, h); c.stroke();
  c.save(); c.translate(w * 0.5, h * 0.52); c.rotate(-0.06);
  c.beginPath(); c.roundRect(-w * 0.36, -h * 0.3, w * 0.72, h * 0.6, 16); trazo(c, grad(c, 0, -h * 0.3, 0, h * 0.3, "#f2efe6", 0.15), 8);
  c.beginPath(); c.roundRect(-w * 0.1, -h * 0.38, w * 0.2, h * 0.1, 8); trazo(c, "#b7b7b0", 6); // clip
  c.fillStyle = "#2f6b5c"; c.fillRect(-w * 0.36 + 4, -h * 0.3 + 4, w * 0.72 - 8, h * 0.12);
  c.fillStyle = "#f2efe6"; c.font = "bold 30px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("HOSPITAL · ENFERMERÍA", 0, -h * 0.205);
  c.beginPath(); c.roundRect(-w * 0.32, -h * 0.13, w * 0.18, h * 0.26, 6); trazo(c, "#8aa0a8", 5); // foto
  c.beginPath(); c.arc(-w * 0.23, -h * 0.05, 18, 0, 7); c.fillStyle = "#5d6f76"; c.fill();
  // el nombre escrito a mano con marcador
  c.fillStyle = "#1b2a6b"; c.font = manuscrito; c.textAlign = "left";
  const partes = nombre.split(" ");
  c.fillText(partes[0], -w * 0.1, -h * 0.03); c.fillText(partes.slice(1).join(" "), -w * 0.1, h * 0.1);
  c.restore();
}

export function dibReceta(c: C, w: number, h: number, borrado: number) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#3c4a44"); g.addColorStop(1, "#1f2723"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.save(); c.translate(w * 0.5, h * 0.58); c.rotate(0.05);
  c.beginPath(); c.rect(-w * 0.38, -h * 0.42, w * 0.76, h * 0.84); trazo(c, grad(c, 0, -h * 0.4, 0, h * 0.4, "#ece6d4", 0.18), 7);
  c.fillStyle = "#2f6b5c"; c.font = "bold 34px 'DejaVu Sans', sans-serif"; c.textAlign = "center"; c.fillText("RECETA MÉDICA", 0, -h * 0.33);
  c.strokeStyle = "#c9c2ad"; c.lineWidth = 3; for (let i = 0; i < 7; i++) { const y = -h * 0.2 + i * h * 0.085; c.beginPath(); c.moveTo(-w * 0.32, y); c.lineTo(w * 0.32, y); c.stroke(); }
  const lineas = ["Paciente: cama 6-14", "Salbutamol 100 mcg", "2 inhalaciones c/ 6 h", "Dra. M. Ortiz"];
  c.font = manuscrito; c.textAlign = "left";
  lineas.forEach((t, i) => {
    // la tinta se desvanece letra por letra, de la última línea a la primera
    const k = Math.max(0, Math.min(1, borrado * 1.6 - (lineas.length - 1 - i) * 0.25));
    c.fillStyle = `rgba(27,42,107,${1 - k})`;
    c.fillText(t, -w * 0.3, -h * 0.22 + i * h * 0.17);
  });
  c.restore();
}

export function dibPizarron(c: C, w: number, h: number) {
  c.fillStyle = "#f1f3ef"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#9aa39d"; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
  c.fillStyle = "#2f6b5c"; c.font = "bold 44px 'DejaVu Sans', sans-serif"; c.textAlign = "left"; c.fillText("PISO 6 · PACIENTES", 30, 64);
  c.strokeStyle = "#c5ccc7"; c.lineWidth = 3; c.beginPath(); c.moveTo(30, 84); c.lineTo(w - 30, 84); c.stroke();
  const filas = [["601", "Ernesto Valdés Ruiz"], ["602", "Carmen Solís Díaz"], ["603", "Raúl Peña Ortega"], ["604", "Rosa Luna Martínez"], ["605", "Héctor Gil Santos"], ["606", "Teresa Mora Cano"]];
  filas.forEach(([n, nom], i) => {
    const y = 140 + i * 66;
    c.fillStyle = "#b8262e"; c.font = "bold 36px 'DejaVu Sans Mono', monospace"; c.fillText(n, 30, y);
    c.fillStyle = "#1b2a6b"; c.font = "italic bold 38px 'DejaVu Serif', serif"; c.fillText(nom, 130, y);
    if (i === 0 || i === 4) { c.strokeStyle = "#1b2a6b"; c.lineWidth = 5; c.beginPath(); c.moveTo(126, y - 12); c.lineTo(130 + c.measureText(nom).width, y - 14); c.stroke(); } // tachados
  });
}

export function dibMonitor(c: C, w: number, h: number, spo2: number, f: number, rapido: number) {
  c.fillStyle = "#06100d"; c.fillRect(0, 0, w, h);
  c.strokeStyle = "#163a2c"; c.lineWidth = 2; for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  // electrocardiograma que corre
  c.strokeStyle = "#5dff9a"; c.lineWidth = 5; c.beginPath();
  const periodo = 70 - 30 * rapido;
  for (let x = 0; x < w * 0.62; x += 2) {
    const fase = ((x + f * 6) % periodo) / periodo;
    const y = h * 0.35 - (fase > 0.4 && fase < 0.45 ? 60 : fase > 0.45 && fase < 0.5 ? -30 : Math.sin(fase * 6.28) * 4);
    x === 0 ? c.moveTo(x, y) : c.lineTo(x, y);
  }
  c.stroke();
  c.strokeStyle = "#5ad1ff"; c.lineWidth = 4; c.beginPath();
  for (let x = 0; x < w * 0.62; x += 2) { const y = h * 0.72 - Math.max(0, Math.sin((x + f * 5) / 22)) * 30; x === 0 ? c.moveTo(x, y) : c.lineTo(x, y); }
  c.stroke();
  const bajo = spo2 < 90;
  c.textAlign = "right";
  c.fillStyle = "#5dff9a"; c.font = "bold 40px 'DejaVu Sans Mono', monospace"; c.fillText("FC", w - 20, h * 0.16);
  c.font = "bold 92px 'DejaVu Sans Mono', monospace"; c.fillText(String(Math.round(78 + 40 * rapido)), w - 20, h * 0.4);
  c.fillStyle = bajo && f % 20 < 10 ? "#ff5a4a" : "#5ad1ff"; c.font = "bold 40px 'DejaVu Sans Mono', monospace"; c.fillText("SpO₂", w - 20, h * 0.58);
  c.font = "bold 92px 'DejaVu Sans Mono', monospace"; c.fillText(`${Math.round(spo2)}%`, w - 20, h * 0.84);
}

export function dibPantallaElevador(c: C, w: number, h: number, piso: string, flecha: boolean) {
  c.fillStyle = "#0b0a0a"; c.fillRect(0, 0, w, h);
  c.fillStyle = "#ff3b2f"; c.font = "bold 120px 'DejaVu Sans Mono', monospace"; c.textAlign = "center"; c.textBaseline = "middle";
  c.fillText(piso, w * 0.62, h * 0.54);
  if (flecha) { c.beginPath(); c.moveTo(w * 0.14, h * 0.32); c.lineTo(w * 0.34, h * 0.32); c.lineTo(w * 0.24, h * 0.7); c.closePath(); c.fill(); }
}

export function dibReloj(c: C, w: number, h: number, minutos: number) {
  c.clearRect(0, 0, w, h);
  const cx = w / 2, cy = h / 2, R = w * 0.46;
  c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); trazo(c, grad(c, 0, 0, w, h, "#f0ede4", 0.2), 14);
  c.fillStyle = TINTA;
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.save(); c.translate(cx + Math.sin(a) * R * 0.82, cy - Math.cos(a) * R * 0.82); c.rotate(a); c.fillRect(-4, -14, 8, i % 3 ? 16 : 28); c.restore(); }
  const aguja = (ang: number, largo: number, ancho: number, color: string) => { c.save(); c.translate(cx, cy); c.rotate(ang); c.fillStyle = color; c.beginPath(); c.roundRect(-ancho / 2, -largo, ancho, largo + 14, ancho / 2); c.fill(); c.restore(); };
  aguja(((minutos / 60) % 12) / 12 * Math.PI * 2, R * 0.5, 16, TINTA);
  aguja((minutos % 60) / 60 * Math.PI * 2, R * 0.75, 10, TINTA);
  c.beginPath(); c.arc(cx, cy, 12, 0, 7); c.fillStyle = "#b8262e"; c.fill();
}

export function dibVentana(c: C, w: number, h: number) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, "#0c1426"); g.addColorStop(1, "#22304a"); c.fillStyle = g; c.fillRect(0, 0, w, h);
  let s = 7; const rnd = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < 9; i++) {
    const bx = i * w / 8 - 20, bw = w / 8 + rnd() * 30, bh = h * (0.3 + rnd() * 0.45);
    c.fillStyle = "#0a0f1a"; c.fillRect(bx, h - bh, bw, bh);
    for (let y = h - bh + 12; y < h - 10; y += 22) for (let x = bx + 8; x < bx + bw - 10; x += 18) if (rnd() < 0.3) { c.fillStyle = rnd() < 0.5 ? "#e8c46a" : "#9fc4e8"; c.fillRect(x, y, 8, 10); }
  }
  c.fillStyle = "#e9e4cf"; c.beginPath(); c.arc(w * 0.78, h * 0.18, 26, 0, 7); c.fill();
}

export function dibPulsera(c: C, w: number, h: number) {
  // almohada blanca con la pulsera de paciente del señor
  const g = c.createRadialGradient(w * 0.45, h * 0.4, 20, w * 0.5, h * 0.5, w * 0.6); g.addColorStop(0, "#f2f0ea"); g.addColorStop(1, "#9fa7a8");
  c.fillStyle = "#2c3a40"; c.fillRect(0, 0, w, h);
  c.beginPath(); c.roundRect(w * 0.06, h * 0.18, w * 0.88, h * 0.64, 80); trazo(c, g, 8);
  c.strokeStyle = "rgba(60,70,80,0.35)"; c.lineWidth = 4; c.beginPath(); c.moveTo(w * 0.2, h * 0.5); c.quadraticCurveTo(w * 0.5, h * 0.44, w * 0.8, h * 0.52); c.stroke();
  c.save(); c.translate(w * 0.52, h * 0.52); c.rotate(-0.2); c.scale(1.5, 1.5);
  c.beginPath(); c.ellipse(0, 0, w * 0.2, h * 0.07, 0, 0, Math.PI * 2); c.lineWidth = 22; c.strokeStyle = TINTA; c.stroke(); c.lineWidth = 15; c.strokeStyle = "#f4f1e8"; c.stroke();
  c.beginPath(); c.roundRect(-w * 0.09, -h * 0.1, w * 0.18, h * 0.07, 6); trazo(c, "#f4f1e8", 5);
  c.fillStyle = "#1b2a6b"; c.font = "bold 20px 'DejaVu Sans Mono', monospace"; c.textAlign = "center"; c.fillText("603 · R. PEÑA", 0, -h * 0.055);
  c.restore();
}
