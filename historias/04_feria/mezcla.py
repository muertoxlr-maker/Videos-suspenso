"""Mezcla de «La rueda de la feria»: voz + ambiente de feria + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; fondo continuo; nada por debajo de 100 Hz; fondo ≈ −13 dB bajo la voz al hablar; −14 LUFS.
Detalles de la historia: la música de la feria se corta de golpe a medianoche y las luces se apagan con golpes secos
(los mismos cuadros que el video); cuando la rueda gira sola vuelve la música, lenta y desafinada.

Uso:  python3 historias/04_feria/mezcla.py   → historias/04_feria/audio/mezcla.wav
"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

AQUI = Path(__file__).resolve().parent
sys.path.insert(0, str(AQUI.parents[1] / "generador"))
import sonido  # noqa: E402

SR = sonido.SR
FPS = 30
P = json.load(open(AQUI / "voz" / "palabras.json"))
CUADROS = int(np.ceil(74.67 * FPS))  # = FERIA_CUADROS del video
DUR = CUADROS / FPS
N = int(DUR * SR)
rng = np.random.default_rng(41)


def t(i):
    return P[i]["ini"]


def fw(i):
    return round(P[i]["ini"] * FPS) / FPS  # el cuadro exacto del video, en segundos


def tt(dur):
    return np.arange(int(dur * SR)) / SR


def norm(x, pico=1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * pico


def pasa(x, bajo=None, alto=None):
    return sonido._filtro(x, bajo, alto)


def env(dur, a=0.05, r=0.1):
    x = tt(dur)
    return np.clip(np.minimum(x / a, (dur - x) / r), 0, 1)


def rampa(x0, x1, ini, fin):
    """0 antes de ini, sube a 1 en fin (o baja si x0 > x1) — sobre todo el largo del video"""
    x = tt(DUR)[:N]
    return np.clip((x - ini) / max(1e-6, fin - ini), 0, 1) * (x1 - x0) + x0


# ------------------------------------------------------------------ efectos
NOTAS = {"C": 261.6, "D": 293.7, "E": 329.6, "F": 349.2, "G": 392.0, "A": 440.0, "B": 493.9}


def organillo(dur, tempo=1.0, desafina=0.0):
    """vals de feria (3/4) con órgano de lengüetas: bajo-acorde-acorde y una melodía sencilla original"""
    x = tt(dur); out = np.zeros(len(x))
    pulso = 0.42 / tempo
    acordes = [("C", "E", "G"), ("G", "B", "D"), ("A", "C", "E"), ("F", "A", "C")]
    melodia = ["E", "G", "C", "B", "A", "G", "A", "F", "E", "D", "C", "D", "E", "G", "A", "G"]
    n = int(dur / pulso) + 1
    for k in range(n):
        ini = k * pulso; i0 = int(ini * SR); L = int(pulso * SR * 0.95)
        if i0 >= len(x):
            break
        y = np.arange(min(L, len(x) - i0)) / SR
        ac = acordes[(k // 6) % 4]
        if k % 3 == 0:
            f = NOTAS[ac[0]] / 2
        else:
            f = None
        notas = [f] if f else [NOTAS[a] for a in ac]
        e = np.exp(-y * 5) * 0.8 + 0.2 * np.exp(-y * 1.2)
        for fr in notas:
            fr *= 1 + desafina * np.sin(2 * np.pi * 0.37 * (ini + y))
            out[i0:i0 + len(y)] += (np.sign(np.sin(2 * np.pi * fr * y)) * 0.3 + np.sin(2 * np.pi * fr * y)) * e * (0.7 if f is None else 0.9)
        if k % 2 == 0:  # melodía: una nota cada dos pulsos, una octava arriba
            fr = NOTAS[melodia[(k // 2) % len(melodia)]] * 2 * (1 + desafina * np.sin(2 * np.pi * 0.23 * ini))
            L2 = min(int(pulso * 2 * SR), len(x) - i0); y2 = np.arange(L2) / SR
            out[i0:i0 + L2] += (np.sin(2 * np.pi * fr * y2) + 0.25 * np.sin(4 * np.pi * fr * y2)) * np.exp(-y2 * 2.2) * 0.9
    return norm(pasa(out, 150, 4500))


def gentio(dur):
    """murmullo de gente: ruido en la banda de la voz, modulado lento, con risas sueltas"""
    x = tt(dur)
    m = pasa(rng.standard_normal(len(x)), 250, 2200) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.3 * x + 1) * np.sin(2 * np.pi * 0.11 * x))
    for s in np.arange(0.5, dur - 1, 2.3):
        k = int((s + rng.random()) * SR); n = int(0.5 * SR); y = np.arange(n) / SR
        if k + n < len(m):
            m[k:k + n] += 0.6 * np.sin(2 * np.pi * (300 + 80 * rng.random()) * y) * (np.sin(2 * np.pi * 7 * y) > 0) * np.exp(-y * 4)
    return norm(m)


def zumbido(dur):
    x = tt(dur)
    return norm(sum(np.sin(2 * np.pi * 120 * k * x) / k for k in (1, 2, 3)) * (0.9 + 0.1 * np.sin(2 * np.pi * 0.3 * x)))


def chirrido_rueda(dur, ritmo=0.55):
    """el eje y las canastillas rechinan: chirridos metálicos periódicos"""
    out = np.zeros(int(dur * SR)); s = 0.2
    while s < dur - 0.6:
        n = int(0.45 * SR); y = np.arange(n) / SR
        f = 900 + 500 * np.sin(np.pi * y / 0.45) + 60 * rng.random()
        g = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * y / 0.45) ** 2
        k = int(s * SR); out[k:k + n] += g[: len(out) - k] * (0.6 + 0.4 * rng.random())
        s += 1 / ritmo + 0.3 * rng.random()
    return norm(pasa(out, 400, 4000))


def cadenas(dur):
    out = np.zeros(int(dur * SR)); s = 0.0
    while s < dur - 0.1:
        n = int(0.04 * SR); y = np.arange(n) / SR
        k = int(s * SR); out[k:k + n] += pasa(rng.standard_normal(n), 2500, 8000)[: len(out) - k] * np.exp(-y * 90)
        s += 0.05 + 0.25 * rng.random()
    return norm(out)


def golpe_luz():
    """el «clunk» de un interruptor grande y el zumbido que se corta"""
    x = tt(0.35)
    return norm(pasa(rng.standard_normal(len(x)), 120, 1500) * np.exp(-x * 30) + 0.6 * np.sin(2 * np.pi * 140 * x) * np.exp(-x * 22))


def palanca():
    x = tt(0.4)
    a = pasa(rng.standard_normal(len(x)), 300, 3000) * np.exp(-x * 25)
    b = np.zeros_like(x); k = int(0.12 * SR); b[k:] = pasa(rng.standard_normal(len(x) - k), 150, 1200) * np.exp(-np.arange(len(x) - k) / SR * 30)
    return norm(a + b)


def dron(dur):
    x = tt(dur)
    d = np.sin(2 * np.pi * 110 * x) + 0.6 * np.sin(2 * np.pi * 116.5 * x) + 0.3 * np.sin(2 * np.pi * 220.5 * x)
    return norm(d * (x / dur) ** 1.5)


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol):
    i = int(seg * SR)
    if i >= N or i < 0:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


medianoche = fw(130)
# antes de medianoche: organillo + gente + zumbido de generador; la gente se va a las 11:30; todo se corta a las 12
corte = 1 - rampa(0, 1, medianoche - 0.02, medianoche + 0.03)
musica = organillo(DUR + 1)[:N] * corte * rampa(1, 0.55, t(104), t(113))
gente = gentio(DUR + 1)[:N] * corte * rampa(1, 0.15, t(104), t(113) + 1)
gen = zumbido(DUR + 1)[:N] * (1 - rampa(0, 1, medianoche + 0.6, medianoche + 0.7))
viento = norm(pasa(rng.standard_normal(N), 150, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * tt(DUR)[:N] + 1) ** 2))
amb = sonido.ambiente(DUR + 1)[:N]
ambiente = np.zeros(N); ambiente[: len(amb)] = amb

# la rueda gira con chirridos y cadenas mientras opera; se detiene para que suba Sofi
gira1 = chirrido_rueda(fw(119)) * env(fw(119), 0.5, 1.5)
poner(gira1, 0, 0.12)
poner(cadenas(fw(119)) * env(fw(119), 0.5, 1.5), 0, 0.05)
poner(palanca(), fw(117) + 0.1, 0.5)  # freno
# subir y bajar la cadena de la entrada
poner(cadenas(0.8), t(121) + 0.4, 0.25)
# títulos
for w in (34, 64, 87):
    poner(sonido.impacto(), t(w) - 0.07, 0.5)
    poner(sonido.whoosh(), t(w) - 0.35, 0.25)
for w in (104, 127):
    poner(sonido.impacto(), t(w) - 0.07, 0.3)
# medianoche: los golpes de luz, en los mismos cuadros que el video (luces() en Feria.tsx)
for d in (0, 1, 3, 6, 9, 12, 15, 18, 20):
    poner(golpe_luz(), medianoche + d / FPS, 0.5 if d in (0, 20) else 0.3)
# la rueda gira sola: chirrido más lento y grave, y el organillo vuelve lento y desafinado
gira2 = chirrido_rueda(DUR - t(143), 0.4)
poner(gira2 * rampa(0, 1, 0, 2.0)[: len(gira2)], t(143), 0.16)
poner(cadenas(DUR - t(143)), t(143), 0.06)
lenta = organillo(DUR - t(146) + 0.5, tempo=0.62, desafina=0.025)
poner(lenta * rampa(0, 1, 0, 3.0)[: len(lenta)], t(146), 0.35)
# frío final: dron y latidos
poner(dron(t(194) - t(172) + 1.0), t(172), 0.25)
poner(sonido.impacto(), t(194) - 0.07, 0.35)
s = t(188); paso = 0.85
while s < DUR - 0.4:
    poner(sonido.latido(), s, 0.3)
    s += paso; paso = max(0.5, paso * 0.92)

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
fondo = 2.0 * pasa(ambiente * 0.3 + musica * 0.07 + gente * 0.06 + gen * 0.02 + viento * 0.08 + pista * 2.1, 100, None) * duck
mezcla = vz * 1.0 + fondo
mezcla /= max(1.0, np.max(np.abs(mezcla)) / 0.95)
salida = AQUI / "audio"
salida.mkdir(exist_ok=True)
crudo = salida / "mezcla_cruda.wav"
sonido.guardar_wav(crudo, mezcla)
med = subprocess.run(["ffmpeg", "-i", str(crudo), "-af", "loudnorm=I=-14:TP=-1.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):])
filtro = (f"loudnorm=I=-14:TP=-1.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crudo), "-af", filtro, "-ar", str(SR), str(salida / "mezcla.wav")], check=True)
crudo.unlink()
# fondo bajo la voz (para la guía §5)
hab = envv > np.percentile(envv, 70)
print(f"fondo bajo la voz al hablar: {20 * np.log10(np.sqrt(np.mean(fondo[hab] ** 2)) / np.sqrt(np.mean(vz[hab] ** 2))):.1f} dB")
print("listo:", salida / "mezcla.wav", f"{DUR:.2f} s")
