// Escenarios de «El turno de las 3:00» con el nivel de detalle del estándar §8.4.
// Medidas en metros. Habitación 604: x ∈ [-2.25, 2.25], z ∈ [-3, 3]. La puerta está en la pared izquierda
// (x = -2.25, z ≈ 1.5) y da al pasillo, que corre a lo largo de z en x ∈ [-4.65, -2.25]. El elevador está al fondo
// del pasillo (z = -14).
import * as THREE from "three";
import { NOINK } from "../alejandro/ink";
import { LienzoVivo, caja, lambert, lienzo, resplandor, texTexto } from "./comun";
import { dibPizarron, dibVentana } from "./insertos";

export const ALTO = 2.8;
export const HAB = { x0: -2.25, x1: 2.25, z0: -3, z1: 3 };
export const PAS = { x0: -4.65, x1: -2.25, z0: -14, z1: 6, cx: -3.45 };
export const PUERTA_604 = { z: 1.5, ancho: 1.1, alto: 2.15 };
export const CAMA_ABUELA = { x: 0.95, z: -1.9 };
export const CAMA_SENOR = { x: -1.35, z: -1.9 };

const texPiso = (rep: [number, number], a = "#8f9a93", b = "#808b84") => lienzo((g, w, h) => {
  g.fillStyle = a; g.fillRect(0, 0, w, h);
  g.fillStyle = b; g.fillRect(0, 0, w / 2, h / 2); g.fillRect(w / 2, h / 2, w / 2, h / 2);
  g.strokeStyle = "#8d9893"; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.beginPath(); g.moveTo(w / 2, 0); g.lineTo(w / 2, h); g.moveTo(0, h / 2); g.lineTo(w, h / 2); g.stroke();
  for (let i = 0; i < 40; i++) { g.fillStyle = "rgba(90,100,95,0.12)"; g.fillRect((i * 37) % w, (i * 71) % h, 4, 3); }
}, 128, 128, rep);
const texPared = (rep: [number, number], arriba = "#7a978b", abajo = "#4f6a61") => lienzo((g, w, h) => {
  g.fillStyle = arriba; g.fillRect(0, 0, w, h);
  g.fillStyle = abajo; g.fillRect(0, h * 0.62, w, h * 0.38);
  g.fillStyle = "#5a7369"; g.fillRect(0, h * 0.6, w, h * 0.03);
  for (let i = 0; i < 60; i++) { g.fillStyle = "rgba(60,80,70,0.06)"; g.fillRect((i * 53) % w, (i * 29) % (h * 0.6), 10, 6); }
}, 128, 128, rep);
const texCortina = (rep: [number, number]) => lienzo((g, w, h) => {
  g.fillStyle = "#8fb4a6"; g.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 32) { const gr = g.createLinearGradient(x, 0, x + 32, 0); gr.addColorStop(0, "rgba(30,50,45,0.35)"); gr.addColorStop(0.5, "rgba(255,255,255,0.08)"); gr.addColorStop(1, "rgba(30,50,45,0.35)"); g.fillStyle = gr; g.fillRect(x, 0, 32, h); }
  g.fillStyle = "#7aa294"; for (let y = 20; y < h; y += 40) for (let x = 10; x < w; x += 40) { g.fillRect(x, y, 8, 8); }
}, 128, 128, rep);

function cama(m: { marco: THREE.Material; colchon: THREE.Material; cobija: THREE.Material; almohada: THREE.Material }, x: number, z: number) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  g.add(caja(1.0, 0.36, 2.1, m.marco, 0, 0.33, 0)); // base
  g.add(caja(0.96, 0.14, 2.02, m.colchon, 0, 0.58, 0));
  for (const zz of [-1.04, 1.04]) g.add(caja(1.02, zz < 0 ? 0.95 : 0.7, 0.05, m.marco, 0, zz < 0 ? 0.6 : 0.47, zz)); // cabecera y piecera
  for (const s of [-1, 1]) { g.add(caja(0.04, 0.05, 1.1, m.marco, s * 0.52, 0.86, 0.15)); g.add(caja(0.04, 0.3, 0.04, m.marco, s * 0.52, 0.72, -0.35)); g.add(caja(0.04, 0.3, 0.04, m.marco, s * 0.52, 0.72, 0.65)); } // barandales
  for (const [sx, sz] of [[-0.45, -0.95], [0.45, -0.95], [-0.45, 0.95], [0.45, 0.95]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.05, 12), m.marco); r.rotation.z = Math.PI / 2; r.position.set(sx, 0.07, sz); g.add(r); }
  const almohada = caja(0.7, 0.16, 0.42, m.almohada, 0, 0.72, -0.75); g.add(almohada);
  const cobija = caja(1.0, 0.16, 1.45, m.cobija, 0, 0.71, 0.3); g.add(cobija);
  return { g, almohada, cobija };
}

export function camilla(mSabana: THREE.Material, conCuerpo: boolean) {
  const g = new THREE.Group();
  const metal = lambert({ color: "#9ca7a8" });
  g.add(caja(0.66, 0.06, 1.9, metal, 0, 0.82, 0), caja(0.62, 0.08, 1.86, lambert({ color: "#3d4f5a" }), 0, 0.88, 0));
  for (const [x, z] of [[-0.28, -0.85], [0.28, -0.85], [-0.28, 0.85], [0.28, 0.85]]) {
    g.add(caja(0.03, 0.75, 0.03, metal, x, 0.44, z));
    const r = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 10), lambert({ color: "#222" })); r.rotation.z = Math.PI / 2; r.position.set(x, 0.05, z); g.add(r);
  }
  if (conCuerpo) {
    const bulto = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.3, 6, 12), mSabana); bulto.rotation.x = Math.PI / 2; bulto.scale.set(1.15, 1, 0.55); bulto.position.set(0, 1.0, 0); g.add(bulto);
    const cabeza = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 10), mSabana); cabeza.position.set(0, 1.0, -0.82); g.add(cabeza);
  }
  g.add(caja(0.7, 0.04, 1.95, mSabana, 0, 0.93, 0));
  return g;
}

export function crearHospital() {
  const raiz = new THREE.Group();
  const mMarcoCama = lambert({ color: "#c9d0cf" }), mColchon = lambert({ color: "#e4e8e6" });
  const mCobija = lambert({ color: "#7f9fb2" }), mAlmohada = lambert({ color: "#eef0ec" }), mSabana = lambert({ color: "#e6eae6" });
  const mMadera = lambert({ color: "#7a5a3c" }), mMetal = lambert({ color: "#a3acad" }), mOscuro = lambert({ color: "#2a3134" });
  const W = HAB.x1 - HAB.x0, Dz = HAB.z1 - HAB.z0;

  // ================= HABITACIÓN 604 =================
  const pisoH = new THREE.Mesh(new THREE.PlaneGeometry(W, Dz), lambert({ map: texPiso([W / 0.6, Dz / 0.6]) }));
  pisoH.rotation.x = -Math.PI / 2; raiz.add(pisoH);
  const techoH = new THREE.Mesh(new THREE.PlaneGeometry(W, Dz), lambert({ color: "#8c9691" })); techoH.rotation.x = Math.PI / 2; techoH.position.y = ALTO; raiz.add(techoH);
  // pared del fondo (con ventana) y pared de enfrente
  const paredMat = (largo: number) => lambert({ map: texPared([largo / 1.2, 1]) });
  const fondo = new THREE.Group();
  const vx0 = 0.1, vx1 = 1.7, vy0 = 1.0, vy1 = 2.2;
  const trozos: [number, number, number, number][] = [[HAB.x0, vx0, 0, ALTO], [vx1, HAB.x1, 0, ALTO], [vx0, vx1, 0, vy0], [vx0, vx1, vy1, ALTO]];
  for (const [a, b, c, d] of trozos) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, d - c), lambert({ map: texPared([(b - a) / 1.2, 1]) }));
    (p.material as THREE.MeshLambertMaterial).map!.repeat.set((b - a) / 1.2, (d - c) / ALTO); (p.material as THREE.MeshLambertMaterial).map!.offset.set(0, c / ALTO);
    p.position.set((a + b) / 2, (c + d) / 2, HAB.z0); fondo.add(p);
  }
  const vidrio = new THREE.Mesh(new THREE.PlaneGeometry(vx1 - vx0, vy1 - vy0), new THREE.MeshBasicMaterial({ map: lienzo(dibVentana, 512, 384), toneMapped: true }));
  vidrio.position.set((vx0 + vx1) / 2, (vy0 + vy1) / 2, HAB.z0 - 0.02); fondo.add(vidrio);
  fondo.add(caja(vx1 - vx0 + 0.12, 0.06, 0.08, mMetal, (vx0 + vx1) / 2, vy0, HAB.z0 + 0.03), caja(vx1 - vx0 + 0.12, 0.06, 0.08, mMetal, (vx0 + vx1) / 2, vy1, HAB.z0 + 0.03),
    caja(0.06, vy1 - vy0, 0.08, mMetal, vx0, (vy0 + vy1) / 2, HAB.z0 + 0.03), caja(0.06, vy1 - vy0, 0.08, mMetal, vx1, (vy0 + vy1) / 2, HAB.z0 + 0.03), caja(0.04, vy1 - vy0, 0.06, mMetal, (vx0 + vx1) / 2, (vy0 + vy1) / 2, HAB.z0 + 0.03));
  raiz.add(fondo);
  const frente = new THREE.Mesh(new THREE.PlaneGeometry(W, ALTO), paredMat(W)); frente.rotation.y = Math.PI; frente.position.set(0, ALTO / 2, HAB.z1); raiz.add(frente);
  const derecha = new THREE.Mesh(new THREE.PlaneGeometry(Dz, ALTO), paredMat(Dz)); derecha.rotation.y = -Math.PI / 2; derecha.position.set(HAB.x1, ALTO / 2, 0); raiz.add(derecha);
  // pared izquierda con el hueco de la puerta
  const pz0 = PUERTA_604.z - PUERTA_604.ancho / 2, pz1 = PUERTA_604.z + PUERTA_604.ancho / 2;
  for (const [a, b, c, d] of [[HAB.z0, pz0, 0, ALTO], [pz1, HAB.z1, 0, ALTO], [pz0, pz1, PUERTA_604.alto, ALTO]] as const) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, d - c), lambert({ map: texPared([(b - a) / 1.2, (d - c) / ALTO]) }));
    (p.material as THREE.MeshLambertMaterial).map!.offset.set(0, c / ALTO);
    p.rotation.y = Math.PI / 2; p.position.set(HAB.x0, (c + d) / 2, (a + b) / 2); raiz.add(p);
  }
  // marco de la puerta y la hoja (gira hacia dentro)
  raiz.add(caja(0.14, PUERTA_604.alto, 0.07, mMadera, HAB.x0, PUERTA_604.alto / 2, pz0 - 0.03), caja(0.14, PUERTA_604.alto, 0.07, mMadera, HAB.x0, PUERTA_604.alto / 2, pz1 + 0.03), caja(0.14, 0.07, PUERTA_604.ancho + 0.14, mMadera, HAB.x0, PUERTA_604.alto + 0.03, PUERTA_604.z));
  const bisagra = new THREE.Group(); bisagra.position.set(HAB.x0 + 0.04, 0, pz1);
  const hoja = caja(0.05, PUERTA_604.alto - 0.03, PUERTA_604.ancho - 0.04, lambert({ color: "#b49a74" }), 0, (PUERTA_604.alto - 0.03) / 2, -(PUERTA_604.ancho - 0.04) / 2);
  const ventanilla = new THREE.Mesh(new THREE.PlaneGeometry(0.18, 0.5), new THREE.MeshBasicMaterial({ color: "#cfe9df", side: THREE.DoubleSide })); ventanilla.rotation.y = Math.PI / 2; ventanilla.position.set(0.03, 1.5, -0.3);
  bisagra.add(hoja, ventanilla, caja(0.06, 0.04, 0.16, mMetal, 0.05, 1.0, -(PUERTA_604.ancho - 0.12)));
  raiz.add(bisagra);
  // camas
  const abuelaCama = cama({ marco: mMarcoCama, colchon: mColchon, cobija: mCobija, almohada: mAlmohada }, CAMA_ABUELA.x, CAMA_ABUELA.z);
  const senorCama = cama({ marco: mMarcoCama, colchon: mColchon, cobija: mCobija, almohada: mAlmohada }, CAMA_SENOR.x, CAMA_SENOR.z);
  raiz.add(abuelaCama.g, senorCama.g);
  // cobija tendida (cama vacía del señor): se muestra en su lugar cuando se lo llevan
  const tendida = caja(1.0, 0.04, 1.9, lambert({ color: "#eef0ec" }), CAMA_SENOR.x, 0.67, CAMA_SENOR.z + 0.05); tendida.visible = false; raiz.add(tendida);
  // panel de tomas de oxígeno sobre las cabeceras
  for (const x of [CAMA_ABUELA.x, CAMA_SENOR.x]) {
    raiz.add(caja(1.4, 0.24, 0.06, lambert({ color: "#d9dedb" }), x, 1.55, HAB.z0 + 0.04));
    for (const dx of [-0.4, -0.15, 0.15]) raiz.add(caja(0.08, 0.08, 0.06, lambert({ color: dx < 0 ? "#3a8a5a" : "#d8d8d8" }), x + dx, 1.55, HAB.z0 + 0.09));
  }
  // cortina divisoria en su riel (se abre corriéndose hacia la pared del fondo)
  raiz.add(caja(0.04, 0.04, 2.5, mMetal, -0.22, ALTO - 0.1, HAB.z0 + 1.25));
  const cortinaPivote = new THREE.Group(); cortinaPivote.position.set(-0.22, 0, HAB.z0 + 0.02);
  const cortina = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.45), lambert({ map: texCortina([4, 2]), side: THREE.DoubleSide }));
  cortina.rotation.y = Math.PI / 2; cortina.position.set(0, 1.4, 1.2); cortinaPivote.add(cortina); raiz.add(cortinaPivote);
  // buró con lámpara cálida, monitor, reloj, timbre
  raiz.add(caja(0.42, 0.68, 0.42, mMadera, 0.18, 0.34, HAB.z0 + 0.35), caja(0.08, 0.3, 0.08, mOscuro, 0.18, 0.83, HAB.z0 + 0.35));
  const pantallaLampara = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.17, 0.18, 16), new THREE.MeshBasicMaterial({ color: "#ffe2b8", toneMapped: false }));
  pantallaLampara.position.set(0.18, 1.04, HAB.z0 + 0.35); raiz.add(pantallaLampara);
  const luzLampara = new THREE.PointLight("#ffc896", 2.6, 4.5, 1.6); luzLampara.position.set(0.18, 1.15, HAB.z0 + 0.6); raiz.add(luzLampara);
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.2), new THREE.MeshBasicMaterial({ map: resplandor(255, 205, 150), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, opacity: 0.5 }));
  halo.position.set(0.18, 1.2, HAB.z0 + 0.03); halo.layers.set(NOINK); raiz.add(halo);
  const monitor = new LienzoVivo(512, 384);
  const mon = new THREE.Group(); mon.position.set(1.78, 0, HAB.z0 + 0.75); mon.rotation.y = -0.35;
  mon.add(caja(0.05, 1.3, 0.05, mMetal, 0, 0.65, 0), caja(0.56, 0.42, 0.08, mOscuro, 0, 1.45, 0));
  const pantallaMon = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: monitor.tex, toneMapped: false })); pantallaMon.position.set(0, 1.45, 0.045); mon.add(pantallaMon);
  raiz.add(mon);
  const luzMonitor = new THREE.PointLight("#6dffb0", 0.5, 2.0, 2); luzMonitor.position.set(1.65, 1.45, HAB.z0 + 1.0); raiz.add(luzMonitor);
  const reloj = new LienzoVivo(256, 256);
  const relojMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.05, 32), [lambert({ color: "#3a3f40" }), new THREE.MeshLambertMaterial({ map: reloj.tex, emissive: "#ffffff", emissiveMap: reloj.tex, emissiveIntensity: 0.25 }), lambert({ color: "#3a3f40" })]);
  relojMesh.rotation.x = Math.PI / 2; relojMesh.rotation.y = Math.PI / 2; relojMesh.position.set(-0.95, 2.15, HAB.z0 + 0.03);
  // la tapa superior del cilindro (índice 1) mira hacia +y; tras girar en x apunta hacia +z (hacia la habitación)
  relojMesh.rotation.set(Math.PI / 2, 0, 0); raiz.add(relojMesh);
  raiz.add(caja(0.12, 0.18, 0.04, lambert({ color: "#e6e3da" }), 1.55, 1.2, HAB.z0 + 0.03), caja(0.06, 0.06, 0.02, lambert({ color: "#c22a24", emissive: "#3a0606" }), 1.55, 1.22, HAB.z0 + 0.06));
  raiz.add(caja(0.5, 0.9, 0.04, lambert({ map: texTexto("604", "#e8e4d8", "#2f6b5c", 256, 128, "bold 72px 'DejaVu Sans', sans-serif") }), 2.2, 1.9, 0)); // número junto a la ventana (cuadro informativo)

  // ================= PASILLO DEL PISO 6 =================
  const PW = PAS.x1 - PAS.x0, PL = PAS.z1 - PAS.z0, pcz = (PAS.z0 + PAS.z1) / 2;
  const pisoP = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), lambert({ map: texPiso([PW / 0.6, PL / 0.6], "#8a958e", "#7a857e") }));
  pisoP.rotation.x = -Math.PI / 2; pisoP.position.set(PAS.cx, 0.001, pcz); raiz.add(pisoP);
  const techoP = new THREE.Mesh(new THREE.PlaneGeometry(PW, PL), lambert({ color: "#88928d" })); techoP.rotation.x = Math.PI / 2; techoP.position.set(PAS.cx, ALTO, pcz); raiz.add(techoP);
  // pared exterior del pasillo (la de la habitación ya existe del otro lado: se añade su cara hacia el pasillo)
  for (const [a, b] of [[PAS.z0, pz0], [pz1, PAS.z1]] as const) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(b - a, ALTO), lambert({ map: texPared([(b - a) / 1.2, 1]) }));
    p.rotation.y = -Math.PI / 2; p.position.set(PAS.x1 - 0.001, ALTO / 2, (a + b) / 2); raiz.add(p);
  }
  const dintelP = new THREE.Mesh(new THREE.PlaneGeometry(PUERTA_604.ancho, ALTO - PUERTA_604.alto), lambert({ color: "#7a978b" }));
  dintelP.rotation.y = -Math.PI / 2; dintelP.position.set(PAS.x1 - 0.001, (ALTO + PUERTA_604.alto) / 2, PUERTA_604.z); raiz.add(dintelP);
  const opuesta = new THREE.Mesh(new THREE.PlaneGeometry(PL, ALTO), lambert({ map: texPared([PL / 1.2, 1]) }));
  opuesta.rotation.y = Math.PI / 2; opuesta.position.set(PAS.x0, ALTO / 2, pcz); raiz.add(opuesta);
  const extremo = new THREE.Mesh(new THREE.PlaneGeometry(PW, ALTO), lambert({ map: texPared([2, 1]) })); extremo.position.set(PAS.cx, ALTO / 2, PAS.z1); extremo.rotation.y = Math.PI; raiz.add(extremo);
  // pasamanos a ambos lados
  for (const x of [PAS.x0 + 0.05, PAS.x1 - 0.05]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, PL, 8), lambert({ color: "#d8d2c2" })); r.rotation.x = Math.PI / 2; r.position.set(x, 0.92, pcz); raiz.add(r); }
  // puertas de otras habitaciones
  const puertas: [number, number, string][] = [[PAS.x0, -3.2, "603"], [PAS.x0, -7.4, "605"], [PAS.x0, -11.2, "607"], [PAS.x1, -3.8, "606"], [PAS.x1, -8.2, "608"], [PAS.x1, 4.6, "602"]];
  const huecos: Record<string, THREE.Group> = {};
  for (const [x, z, n] of puertas) {
    const s = x === PAS.x0 ? 1 : -1;
    const g = new THREE.Group(); g.position.set(x + s * 0.01, 0, z); g.rotation.y = s * Math.PI / 2;
    g.add(caja(1.2, 2.2, 0.05, mMadera, 0, 1.1, 0));
    g.add(caja(1.0, 2.08, 0.04, lambert({ color: "#b49a74" }), 0, 1.04, 0.02));
    g.add(caja(0.18, 0.45, 0.02, lambert({ color: "#c9dcd6" }), -0.25, 1.5, 0.045));
    g.add(new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), lambert({ map: texTexto(n, "#2f6b5c", "#f2efe6", 128, 64, "bold 40px 'DejaVu Sans', sans-serif") })).translateY(2.0).translateZ(0.05));
    raiz.add(g); huecos[n] = g;
  }
  // número 604 junto a nuestra puerta (lado del pasillo)
  const n604 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.14), lambert({ map: texTexto("604", "#2f6b5c", "#f2efe6", 128, 64, "bold 40px 'DejaVu Sans', sans-serif") }));
  n604.rotation.y = -Math.PI / 2; n604.position.set(PAS.x1 - 0.02, 2.0, pz0 - 0.25); raiz.add(n604);
  // estación de enfermería frente a la puerta
  const est = new THREE.Group(); est.position.set(PAS.x0, 0, 1.4);
  est.add(caja(0.7, 1.08, 3.0, lambert({ color: "#d7d0bf" }), 0.35, 0.54, 0), caja(0.78, 0.05, 3.06, lambert({ color: "#7a5a3c" }), 0.39, 1.1, 0));
  est.add(caja(0.08, 0.36, 0.5, mOscuro, 0.3, 1.32, -0.6));
  const pantallaPC = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.28), new THREE.MeshBasicMaterial({ color: "#7fd6ff", toneMapped: false })); pantallaPC.rotation.y = Math.PI / 2; pantallaPC.position.set(0.35, 1.33, -0.6); est.add(pantallaPC);
  for (let i = 0; i < 5; i++) est.add(caja(0.25, 0.32, 0.05, lambert({ color: ["#c84a3a", "#3a6ac8", "#e0b84a", "#3a9a6a", "#9a4ab8"][i] }), 0.25, 1.28, 0.3 + i * 0.07));
  const letrero = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.32), lambert({ map: texTexto("ENFERMERÍA", "#2f6b5c", "#f2efe6", 512, 104, "bold 64px 'DejaVu Sans', sans-serif"), emissive: "#ffffff", emissiveIntensity: 0.15 }));
  letrero.rotation.y = Math.PI / 2; letrero.position.set(0.02, 2.25, 0); est.add(letrero);
  raiz.add(est);
  const luzPC = new THREE.PointLight("#7fd6ff", 0.6, 2.5, 2); luzPC.position.set(PAS.x0 + 0.8, 1.4, 0.8); raiz.add(luzPC);
  // pizarrón de pacientes
  const piz = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.85), lambert({ map: lienzo(dibPizarron, 640, 520), emissive: "#ffffff", emissiveIntensity: 0.1 }));
  piz.rotation.y = Math.PI / 2; piz.position.set(PAS.x0 + 0.04, 1.55, -1.3); raiz.add(piz, caja(0.03, 0.9, 1.36, mMetal, PAS.x0 + 0.01, 1.55, -1.3));
  // carrito de medicinas con el vasito de pastillas negras
  const carrito = new THREE.Group(); carrito.position.set(PAS.x0 + 0.42, 0, -5.4);
  carrito.add(caja(0.5, 0.86, 0.62, lambert({ color: "#6f8fa6" }), 0, 0.5, 0), caja(0.56, 0.04, 0.68, mMetal, 0, 0.95, 0));
  for (let i = 0; i < 4; i++) carrito.add(caja(0.02, 0.012, 0.5, mOscuro, 0.26, 0.25 + i * 0.18, 0));
  for (const [x, z] of [[-0.2, -0.25], [0.2, -0.25], [-0.2, 0.25], [0.2, 0.25]]) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.03, 10), lambert({ color: "#222" })); r.rotation.z = Math.PI / 2; r.position.set(x, 0.04, z); carrito.add(r); }
  const vasito = new THREE.Group(); vasito.position.set(0.1, 0.97, 0.05);
  const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.028, 0.06, 16, 1, true), lambert({ color: "#f2f0ea", side: THREE.DoubleSide })); vaso.position.y = 0.03;
  vasito.add(vaso);
  for (const [x, z] of [[0, 0], [0.012, 0.01], [-0.01, 0.008]]) { const pl = new THREE.Mesh(new THREE.SphereGeometry(0.012, 10, 8), lambert({ color: "#141414" })); pl.position.set(x, 0.045, z); vasito.add(pl); }
  carrito.add(vasito);
  carrito.add(caja(0.2, 0.004, 0.28, lambert({ color: "#ece6d4" }), -0.12, 0.975, -0.12));
  raiz.add(carrito);
  // fluorescentes: tubo encendido + luz fría; uno parpadea (el de la estación)
  const fluorescentes: { tubo: THREE.Mesh; luz: THREE.PointLight }[] = [];
  for (const z of [4.6, 1.5, -1.6, -4.7, -7.8, -10.9, -13.2]) {
    raiz.add(caja(1.3, 0.05, 0.32, mMetal, PAS.cx, ALTO - 0.03, z));
    const tubo = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.03, 0.22), new THREE.MeshBasicMaterial({ color: "#eefcf4", toneMapped: false }));
    tubo.position.set(PAS.cx, ALTO - 0.06, z); raiz.add(tubo);
    const luz = new THREE.PointLight("#d9f2e6", 1.7, 6.5, 1.5); luz.position.set(PAS.cx, ALTO - 0.3, z); raiz.add(luz);
    fluorescentes.push({ tubo, luz });
  }
  // elevador al fondo
  const ascensor = new THREE.Group(); ascensor.position.set(PAS.cx, 0, PAS.z0);
  for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(0.75, ALTO), lambert({ map: texPared([1, 1]) })); p.position.set(s * 0.825, ALTO / 2, 0); ascensor.add(p); }
  ascensor.add(new THREE.Mesh(new THREE.PlaneGeometry(0.9, ALTO - 2.15), lambert({ color: "#a9c1b6" })).translateY((ALTO + 2.15) / 2));
  ascensor.add(caja(1.06, 2.25, 0.06, mMetal, 0, 1.12, 0.03));
  const hojasEl: THREE.Mesh[] = [];
  for (const s of [-1, 1]) { const h = caja(0.45, 2.1, 0.04, lambert({ color: "#8f999b" }), s * 0.225, 1.05, 0.05); h.add(caja(0.012, 2.1, 0.01, lambert({ color: "#4a5254" }), -s * 0.22, 0, 0.025)); ascensor.add(h); hojasEl.push(h); }
  // cabina iluminada detrás de las puertas
  const cabina = new THREE.Group(); cabina.position.set(0, 0, -0.8);
  cabina.add(caja(1.2, 0.02, 1.4, lambert({ color: "#6a6e6c" }), 0, 0.01, 0), caja(1.2, 2.4, 0.02, lambert({ color: "#c9cfcd" }), 0, 1.2, -0.7));
  for (const s of [-1, 1]) cabina.add(caja(0.02, 2.4, 1.4, lambert({ color: "#bcc3c1" }), s * 0.6, 1.2, 0));
  const luzCabina = new THREE.PointLight("#f2fff8", 1.6, 2.6, 1.5); luzCabina.position.set(0, 2.1, 0); cabina.add(luzCabina);
  ascensor.add(cabina);
  const pantallaEl = new LienzoVivo(256, 128);
  const pEl = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshBasicMaterial({ map: pantallaEl.tex, toneMapped: false })); pEl.position.set(0, 2.42, 0.02); ascensor.add(pEl);
  const botonera = new THREE.Group(); botonera.position.set(0.75, 1.2, 0.03);
  botonera.add(caja(0.16, 0.36, 0.02, mMetal, 0, 0, 0));
  const subir = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), lambert({ color: "#4a4e50" })); subir.position.set(0, 0.08, 0.015);
  const bajar = new THREE.Mesh(new THREE.CircleGeometry(0.04, 16), new THREE.MeshBasicMaterial({ color: "#ff4a3a", toneMapped: false })); bajar.position.set(0, -0.08, 0.015);
  botonera.add(subir, bajar); ascensor.add(botonera);
  const piso6 = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.22), lambert({ map: texTexto("PISO 6", "#2f6b5c", "#f2efe6", 256, 112, "bold 56px 'DejaVu Sans', sans-serif") }));
  piso6.position.set(-0.8, 1.9, 0.02); ascensor.add(piso6);
  raiz.add(ascensor);
  const luzBajar = new THREE.PointLight("#ff4a3a", 0.4, 1.2, 2); luzBajar.position.set(PAS.cx + 0.75, 1.1, PAS.z0 + 0.3); raiz.add(luzBajar);

  // camillas: una que se mueve y una fila que aparece al final
  const camillaMovil = camilla(mSabana, true); raiz.add(camillaMovil);
  const camillaElev = camilla(mSabana, true); camillaElev.position.set(PAS.cx, 0, PAS.z0 - 0.8); camillaElev.scale.set(0.9, 1, 0.65); ascensor.add(camillaElev); camillaElev.position.set(0, 0, -0.8);
  const fila = new THREE.Group();
  [-2.6, -4.6, -6.6, -8.6, -10.6, -12.4].forEach((z, i) => { const c = camilla(mSabana, i % 3 !== 1); c.position.set(i % 2 ? PAS.x0 + 0.5 : PAS.x1 - 0.5, 0, z); fila.add(c); });
  fila.visible = false; raiz.add(fila);

  return {
    raiz, bisagra, cortina, cortinaPivote, monitor, reloj, relojMesh, luzLampara, fluorescentes, pantallaEl, hojasEl, camillaMovil, camillaElev, fila,
    tendida, senorCama, abuelaCama, huecos,
  };
}
