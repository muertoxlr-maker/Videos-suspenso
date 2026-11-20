"""Convierte una imagen de referencia de un personaje en un dibujo vectorial estilo caricatura (SVG por capas).

Idea: en lugar de dibujar la cara a mano, se toman las formas reales de la referencia (juego o arte oficial) y se
pasan a tonos planos de borde suave, con contorno grueso solo en la silueta, como en el estilo de la serie
«Si nacieras como…».

Pasos: 1) suaviza la imagen (filtro de desplazamiento de medias) para quitar textura; 2) separa al personaje del
fondo (GrabCut); 3) agrupa los colores en pocos tonos (k-medias en Lab); 4) limpia manchitas; 5) saca el contorno de
cada zona y lo suaviza a lo largo de la curva (sin esquinas); 6) escribe un SVG con una capa por tono, de claro a
oscuro, y el contorno exterior grueso encima.

Uso:  python3 herramientas/vectorizar.py referencia.png salida.svg [tonos=7] [suavizado=5] [x0,y0,x1,y1 del personaje]
Sale también salida.png (vista previa).
"""
import sys

import cv2
import numpy as np

entrada, salida = sys.argv[1], sys.argv[2]
K = int(sys.argv[3]) if len(sys.argv) > 3 else 7
SUAVE = float(sys.argv[4]) if len(sys.argv) > 4 else 5.0
RECT = tuple(int(v) for v in sys.argv[5].split(",")) if len(sys.argv) > 5 else None

im = cv2.imread(entrada)
esc = 900 / max(im.shape[:2])
im = cv2.resize(im, None, fx=esc, fy=esc, interpolation=cv2.INTER_AREA)
H, W = im.shape[:2]

# 1) quitar textura, conservar formas
liso = cv2.pyrMeanShiftFiltering(im, 18, 26)
liso = cv2.bilateralFilter(liso, 9, 40, 9)

# 2) personaje vs fondo
mask = np.zeros((H, W), np.uint8)
rect = tuple(int(v * esc) for v in RECT) if RECT else (int(W * 0.04), int(H * 0.02), int(W * 0.92), int(H * 0.97))
if RECT:
    rect = (rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1])
bg, fg = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
cv2.grabCut(im, mask, rect, bg, fg, 6, cv2.GC_INIT_WITH_RECT)
sujeto = np.where((mask == 1) | (mask == 3), 255, 0).astype(np.uint8)
sujeto = cv2.morphologyEx(sujeto, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
sujeto = cv2.morphologyEx(sujeto, cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
n, lab_cc, st, _ = cv2.connectedComponentsWithStats(sujeto)
if n > 1:
    mayor = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    sujeto = np.where(lab_cc == mayor, 255, 0).astype(np.uint8)

# 3) tonos planos
lab = cv2.cvtColor(liso, cv2.COLOR_BGR2LAB).astype(np.float32)
px = lab[sujeto > 0]
crit = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 40, 0.5)
_, etiquetas, centros = cv2.kmeans(px, K, None, crit, 4, cv2.KMEANS_PP_CENTERS)
mapa = np.full((H, W), -1, np.int32)
mapa[sujeto > 0] = etiquetas.ravel()

# 4) limpiar manchitas: filtro de moda por vecindad
for _ in range(2):
    votos = np.zeros((K, H, W), np.float32)
    for k in range(K):
        votos[k] = cv2.GaussianBlur((mapa == k).astype(np.float32), (0, 0), 3)
    nuevo = np.argmax(votos, 0).astype(np.int32)
    mapa = np.where(sujeto > 0, nuevo, -1)

# colores: paleta de caricatura según la claridad (L) de cada grupo; los grupos rosados (a* alto y claros) son labio
PIEL = ["#a86f4c", "#8b502b", "#7a4426", "#5d2f18", "#2e170c", "#100805"]
orden = np.argsort(centros[:, 0])[::-1]  # de claro a oscuro (L de Lab)
cbgr = np.zeros((K, 3), np.uint8)
for rango, k in enumerate(orden):
    L, A, B = centros[k]
    hexa = PIEL[min(len(PIEL) - 1, int(round(rango * (len(PIEL) - 1) / max(1, K - 1))))]
    cbgr[k] = [int(hexa[5:7], 16), int(hexa[3:5], 16), int(hexa[1:3], 16)]
def suavizar(c, sig):
    p = c[:, 0, :].astype(np.float32)
    if len(p) < 8:
        return p
    n = len(p)
    r = int(sig * 3)
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sig * sig))
    k /= k.sum()
    ext = np.concatenate([p[-r:], p, p[:r]])
    x = np.convolve(ext[:, 0], k, "valid")
    y = np.convolve(ext[:, 1], k, "valid")
    q = np.stack([x, y], 1)
    return q[:: max(1, n // 300)]


def camino(q):
    return "M" + " L".join(f"{x:.1f} {y:.1f}" for x, y in q) + "Z"


capas = []
prev = np.zeros((H, W, 3), np.uint8)
prev[:] = (40, 40, 40)
# base: toda la silueta con el tono más común, luego cada tono encima (claro → oscuro, el oscuro gana)
base = int(np.bincount(mapa[mapa >= 0]).argmax())
for k in [base] + [int(o) for o in orden if o != base]:
    zona = (mapa == k).astype(np.uint8) * 255 if k != base else sujeto
    cs, jer = cv2.findContours(zona, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
    if jer is None:
        continue
    d = ""
    for i, c in enumerate(cs):
        if cv2.contourArea(c) < 60:
            continue
        q = suavizar(c, SUAVE)
        d += camino(q)
    if not d:
        continue
    b, g, r = (int(v) for v in cbgr[k])
    capas.append(f'<path d="{d}" fill="#{r:02x}{g:02x}{b:02x}" fill-rule="evenodd"/>')
    # vista previa
    for i, c in enumerate(cs):
        if cv2.contourArea(c) < 60:
            continue
        q = suavizar(c, SUAVE).astype(np.int32)
        color = (int(cbgr[k][0]), int(cbgr[k][1]), int(cbgr[k][2]))
        if jer[0][i][3] < 0:
            cv2.fillPoly(prev, [q], color, lineType=cv2.LINE_AA)
        else:
            cv2.fillPoly(prev, [q], (int(cbgr[base][0]), int(cbgr[base][1]), int(cbgr[base][2])) if k != base else (40, 40, 40), lineType=cv2.LINE_AA)

# contorno exterior grueso
cs, _ = cv2.findContours(sujeto, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
d = "".join(camino(suavizar(c, SUAVE * 1.5)) for c in cs if cv2.contourArea(c) > 500)
capas.append(f'<path d="{d}" fill="none" stroke="#120b08" stroke-width="9" stroke-linejoin="round"/>')
for c in cs:
    if cv2.contourArea(c) > 500:
        cv2.polylines(prev, [suavizar(c, SUAVE * 1.5).astype(np.int32)], True, (8, 11, 18), 9, cv2.LINE_AA)

svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">' + "".join(capas) + "</svg>"
open(salida, "w").write(svg)
cv2.imwrite(salida.rsplit(".", 1)[0] + ".png", prev)
print("tonos:", K, "capas:", len(capas), "tamaño:", W, H)
