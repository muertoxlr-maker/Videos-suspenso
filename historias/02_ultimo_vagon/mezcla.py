"""Mezcla de «Último vagón»: voz + ambiente de metro + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; fondo continuo; nada de ruido en la banda de la voz mientras se habla y nada por debajo de
100 Hz (las bocinas del celular vibran); fondo ≈ −14 dB bajo la voz al hablar; −14 LUFS al final.

Uso:  python3 historias/02_ultimo_vagon/mezcla.py   → historias/02_ultimo_vagon/audio/mezcla.wav
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
DUR = 2329 / FPS  # = VAGON_CUADROS del video
N = int(DUR * SR)
rng = np.random.default_rng(11)


def t(i):
    return P[i]["ini"]


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


# ------------------------------------------------------------------ efectos
def rodar(dur, rapido=1.0):
    """Rumor del tren: grave filtrado (sobre 100 Hz) + golpeteo de juntas de riel (ta-tán)."""
    x = tt(dur)
    rumor = norm(pasa(rng.standard_normal(len(x)), 100, 320)) * (0.8 + 0.2 * np.sin(2 * np.pi * 0.3 * x))
    juntas = np.zeros(len(x))
    paso = 0.9 / rapido
    s = 0.1
    while s < dur - 0.2:
        for d in (0.0, 0.11):
            k = int((s + d) * SR); g = sonido.toc()[: len(x) - k]; juntas[k:k + len(g)] += g * 0.7
        s += paso
    return norm(rumor * 0.8 + pasa(juntas, 100, 2500) * 0.6)


def ding_dong():
    x = tt(1.5)
    a = np.sin(2 * np.pi * 784 * x) * np.exp(-x * 3.5)
    b = np.zeros_like(x); k = int(0.4 * SR); y = np.arange(len(x) - k) / SR; b[k:] = np.sin(2 * np.pi * 622 * y) * np.exp(-y * 3.5)
    return norm(a + b)


def pitidos(n=3, f=2200, sep=0.18):
    out = np.zeros(int((n * sep + 0.1) * SR))
    for i in range(n):
        x = tt(0.1); b = np.sin(2 * np.pi * f * x) * env(0.1, 0.005, 0.02); k = int(i * sep * SR); out[k:k + len(b)] += b
    return out


def golpe_vidrio():
    x = tt(0.25)
    return norm(pasa(rng.standard_normal(len(x)), 120, 1500) * np.exp(-x * 30) + 0.6 * np.sin(2 * np.pi * 140 * x) * np.exp(-x * 25))


def golpeteo(dur, ritmo=3.2):
    out = np.zeros(int(dur * SR)); s = 0.0
    while s < dur - 0.3:
        g = golpe_vidrio(); k = int(s * SR); out[k:k + len(g)] += g[: len(out) - k] * (0.6 + 0.4 * rng.random())
        s += 1 / ritmo * (0.6 + 0.8 * rng.random())
    return out


def pasos(dur, ritmo=4.5):
    out = np.zeros(int(dur * SR)); s = 0.0
    while s < dur - 0.1:
        x = tt(0.07); g = pasa(rng.standard_normal(len(x)), 150, 1200) * np.exp(-x * 60); k = int(s * SR); out[k:k + len(g)] += g[: len(out) - k]
        s += 1 / ritmo
    return norm(out)


def vidrio_roto():
    x = tt(1.6)
    golpe = norm(pasa(rng.standard_normal(len(x)), 200, 6000) * np.exp(-x * 9))
    tintineo = np.zeros_like(x)
    for _ in range(40):
        k = int(rng.random() * 1.2 * SR); f = 2500 + 4000 * rng.random(); y = tt(0.08)
        p = np.sin(2 * np.pi * f * y) * np.exp(-y * 60); tintineo[k:k + len(p)] += p[: len(x) - k] * rng.random()
    return norm(golpe + 0.35 * norm(tintineo))


def zumbido_celular():
    x = tt(0.35)
    return norm(np.sin(2 * np.pi * 180 * x) * (np.sin(2 * np.pi * 25 * x) > 0) * env(0.35, 0.01, 0.05))


def clic():
    x = tt(0.04)
    return norm(pasa(rng.standard_normal(len(x)), 1000, 6000) * np.exp(-x * 120))


def chirrido_metal(dur=1.2):
    x = tt(dur); f = 2400 + 300 * np.sin(2 * np.pi * 1.3 * x)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * env(dur, 0.1, 0.4) * (0.5 + 0.5 * np.sin(2 * np.pi * 7 * x)))


def golpe_grave():
    x = tt(2.2)
    f = 35 + 50 * np.exp(-x * 4)
    return norm(np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-x * 1.4))


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol):
    i = int(seg * SR)
    if i >= N or i < 0:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


# rumor continuo del tren (más rápido en el túnel, más lento al pasar por las estaciones)
tramos = [(0, t(89), 1.0), (t(89), t(104), 0.6), (t(104), t(127), 0.9), (t(127), t(133), 0.8), (t(133), DUR, 0.35)]
tren = np.zeros(N)
for a, b, rap in tramos:
    seg = rodar(b - a + 0.3, rap) * env(b - a + 0.3, 0.15, 0.15)
    k = int(a * SR); tren[k:k + len(seg)] += seg[: N - k] * (0.55 + 0.45 * rap)
amb = sonido.ambiente(DUR + 1)[:N]
ambiente = np.zeros(N); ambiente[: len(amb)] = amb

# anuncio del conductor: campanita
poner(ding_dong(), t(10) - 0.35, 0.3)
# puertas bloqueadas: pitidos
poner(pitidos(3), t(19), 0.18)
# alguien corre: pasos
poner(pasos(t(34) - t(29)), t(29), 0.18)
# títulos de reglas y estaciones
for w in (45, 62, 75):
    poner(sonido.impacto(), t(w) - 0.07, 0.5)
    poner(sonido.whoosh(), t(w) - 0.35, 0.25)
for w in (89, 104, 127):
    poner(sonido.impacto(), t(w) - 0.07, 0.3)
# regla 2: el celular se apaga (clic) y golpes en el vidrio
poner(clic(), t(65) + 0.2, 0.4)
poner(golpeteo(t(75) - t(71) - 0.2), t(71) + 0.25, 0.3)
# regla 3: el tren pasa rugiendo frente a la cámara
poner(sonido.whoosh(), t(75) + 0.4, 0.5)
poner(chirrido_metal(1.6), t(79), 0.07)
# primera estación: golpes en los vidrios
poner(golpeteo(t(104) - t(93), 4.0), t(93), 0.33)
# segunda estación: el celular se enciende, el vidrio se rompe, golpean la puerta entre vagones
poner(zumbido_celular(), t(112) + 0.1, 0.25)
poner(golpe_grave(), t(115) - 0.05, 0.35)
poner(vidrio_roto(), t(120) - 0.05, 0.55)
poner(golpeteo(t(127) - t(122), 3.0), t(122), 0.42)
# tu estación: golpes alrededor de tu mamá (más suaves), latidos
poner(golpeteo(t(173) - t(150), 3.4), t(150), 0.2)
poner(golpeteo(t(184) - t(168), 4.0), t(168), 0.18)
poner(golpe_grave(), t(173) - 0.05, 0.35)
poner(zumbido_celular(), t(180) + 0.2, 0.25)
# pregunta final: latidos que se aceleran y golpe al aparecer los botones
poner(sonido.impacto(), t(193) - 0.07, 0.35)
s = t(184); paso = 0.85
while s < DUR - 0.4:
    poner(sonido.latido(), s, 0.3)
    s += paso; paso = max(0.5, paso * 0.92)

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
fondo = pasa(ambiente * 0.3 + tren * 0.4 + pista * 2.6, 100, None) * duck
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
print("listo:", salida / "mezcla.wav", f"{DUR:.2f} s")
