# Uso: python3 herramientas/medir_sincronia.py video.mp4 transcripcion.json
"""Fotograma en que cambia la palabra amarilla del subtítulo vs. inicio de palabra en la voz (Whisper)."""
import json, subprocess, sys
import numpy as np
video, trans = sys.argv[1], sys.argv[2]
W, Y0, HH = 576, 750, 120
cmd = ["ffmpeg", "-v", "error", "-i", video, "-vf", f"crop={W}:{HH}:0:{Y0}", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
cx, n = [], W * HH * 3
while True:
    b = p.stdout.read(n)
    if len(b) < n: break
    a = np.frombuffer(b, np.uint8).reshape(HH, W, 3).astype(int)
    m = (a[..., 0] > 190) & (a[..., 1] > 150) & (a[..., 2] < 120) & (a[..., 0] - a[..., 2] > 100)
    xs = np.nonzero(m)[1]
    cx.append(xs.mean() if len(xs) > 40 else np.nan)
cx = np.array(cx)
# un cambio de palabra resaltada = el centro del amarillo salta > 25 px (o aparece)
cambios = [i for i in range(1, len(cx)) if (np.isnan(cx[i - 1]) and not np.isnan(cx[i])) or
           (not np.isnan(cx[i]) and not np.isnan(cx[i - 1]) and abs(cx[i] - cx[i - 1]) > 25)]
pal = [w for s in json.load(open(trans)) for w in s["palabras"]]
ini = np.array([w["ini"] for w in pal]) * 30
dif = []
for c in cambios:
    k = int(np.argmin(np.abs(ini - c)))
    d = c - ini[k]
    if abs(d) <= 10: dif.append(d)
dif = np.array(dif)
total = len(cx) / 30
print(json.dumps({"cambios_resaltado": len(cambios), "palabras_voz": len(pal),
    "palabras_por_segundo": round(len(pal) / total, 2),
    "emparejados": len(dif), "desfase_mediano_cuadros": round(float(np.median(dif)), 1) if len(dif) else None,
    "desfase_p25_p75": [round(float(np.percentile(dif, 25)), 1), round(float(np.percentile(dif, 75)), 1)] if len(dif) else None,
    "pct_dentro_de_3_cuadros": round(100 * float((np.abs(dif) <= 3).mean()), 1) if len(dif) else None}, ensure_ascii=False))
