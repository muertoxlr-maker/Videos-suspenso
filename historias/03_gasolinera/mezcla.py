"""Mezcla de «Gasolinera de la carretera»: voz + ambiente nocturno + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; fondo continuo; nada de ruido en la banda de la voz mientras se habla y nada por debajo de
100 Hz (las bocinas del celular vibran); fondo ≈ −14 dB bajo la voz al hablar; −14 LUFS al final.
Detalle de la historia: los grillos se callan cuando llega el niño (a las tres).

Uso:  python3 historias/03_gasolinera/mezcla.py   → historias/03_gasolinera/audio/mezcla.wav
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
DUR = 2330 / FPS  # = GASO_CUADROS del video
N = int(DUR * SR)
rng = np.random.default_rng(23)


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
def grillos(dur):
    """Varios grillos: trinos de ~4.4 kHz en ráfagas, cada uno con su ritmo."""
    x = tt(dur); out = np.zeros(len(x))
    for f0, ritmo, fase in [(4300, 2.1, 0.0), (4650, 1.7, 0.4), (4100, 2.6, 1.1), (4900, 1.3, 0.7)]:
        rafaga = (np.sin(2 * np.pi * ritmo * x + fase) > 0.3).astype(float)
        trino = (np.sin(2 * np.pi * 32 * x) > 0).astype(float)
        out += np.sin(2 * np.pi * f0 * x) * rafaga * trino * (0.6 + 0.4 * rng.random())
    return norm(pasa(out, 3000, 7000))


def zumbido_lamparas(dur):
    """Zumbido eléctrico de las lámparas del techo (120 Hz y armónicos), muy bajo."""
    x = tt(dur)
    z = sum(np.sin(2 * np.pi * 120 * k * x) / k for k in (1, 2, 3, 5))
    return norm(z * (0.9 + 0.1 * np.sin(2 * np.pi * 0.2 * x)))


def viento(dur):
    x = tt(dur)
    return norm(pasa(rng.standard_normal(len(x)), 150, 900) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.07 * x + 1) ** 2))


def campanita():
    """Campanita de la puerta de la tienda."""
    x = tt(1.2)
    return norm(sum(np.sin(2 * np.pi * f * x) * np.exp(-x * d) for f, d in [(2350, 4), (3100, 5), (3900, 6)]))


def motor(dur, f0=55, sube=0.0):
    """Motor diésel: armónicos de una frecuencia baja que puede subir (arrancar)."""
    x = tt(dur); f = f0 * (1 + sube * x / dur)
    fase = 2 * np.pi * np.cumsum(f) / SR
    m = sum(np.sin(k * fase) / k for k in range(2, 9))
    golpeteo = 0.7 + 0.3 * (np.sin(fase * 0.5) > 0)
    return norm(pasa(m * golpeteo + 0.3 * rng.standard_normal(len(x)), 100, 1500))


def frenos_aire():
    x = tt(1.1)
    return norm(pasa(rng.standard_normal(len(x)), 2500, 9000) * np.minimum(1, x / 0.02) * np.exp(-x * 3))


def chapa():
    """Clic metálico de la chapa al girar."""
    x = tt(0.12)
    a = pasa(rng.standard_normal(len(x)), 1500, 7000) * np.exp(-x * 90)
    b = np.zeros_like(x); k = int(0.05 * SR); b[k:] = pasa(rng.standard_normal(len(x) - k), 800, 5000) * np.exp(-np.arange(len(x) - k) / SR * 70)
    return norm(a + 0.8 * b)


def charola():
    """La charola de metal de la ventanilla que se desliza."""
    x = tt(0.6)
    return norm(pasa(rng.standard_normal(len(x)), 1200, 5000) * env(0.6, 0.05, 0.15) * (0.6 + 0.4 * np.sin(2 * np.pi * 37 * x)))


def chisporroteo(dur):
    """Lámparas que parpadean: chasquidos eléctricos y zumbido que se corta."""
    x = tt(dur); out = np.zeros(len(x)); s = 0.0
    while s < dur - 0.1:
        k = int(s * SR); g = pasa(rng.standard_normal(int(0.03 * SR)), 2000, 8000) * np.exp(-np.arange(int(0.03 * SR)) / SR * 120)
        out[k:k + len(g)] += g[: len(out) - k] * rng.random()
        s += 0.06 + 0.25 * rng.random()
    corte = (np.sin(2 * np.pi * 3.1 * x) + np.sin(2 * np.pi * 5.3 * x) > 0).astype(float)
    return norm(out + 0.5 * zumbido_lamparas(dur) * corte)


def pasos(dur, ritmo=2.2, grava=True, desde=1.0, hasta=1.0):
    out = np.zeros(int(dur * SR)); s = 0.0
    while s < dur - 0.1:
        n = int((0.09 if grava else 0.05) * SR); y = np.arange(n) / SR
        g = pasa(rng.standard_normal(n), 300 if grava else 150, 3500 if grava else 900) * np.exp(-y * (40 if grava else 70))
        k = int(s * SR); vol = desde + (hasta - desde) * s / dur
        out[k:k + n] += g[: len(out) - k] * vol
        s += 1 / ritmo
    return norm(out)


def golpe_vidrio():
    x = tt(0.3)
    return norm(pasa(rng.standard_normal(len(x)), 150, 1800) * np.exp(-x * 25) + 0.5 * np.sin(2 * np.pi * 160 * x) * np.exp(-x * 20))


def dron(dur):
    """Tono grave que crece hacia la pregunta final (sobre 100 Hz)."""
    x = tt(dur)
    d = np.sin(2 * np.pi * 110 * x) + 0.6 * np.sin(2 * np.pi * 164.8 * x) + 0.3 * np.sin(2 * np.pi * 220.5 * x)
    return norm(d * (x / dur) ** 1.5)


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol):
    i = int(seg * SR)
    if i >= N or i < 0:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


# ambiente: grillos hasta que llega el niño; zumbido de lámparas todo el tiempo; viento tenue
silencio = t(131)
g = grillos(DUR + 1)[:N] * np.clip((silencio - tt(DUR + 1)[:N]) / 0.6, 0, 1)
zum = zumbido_lamparas(DUR + 1)[:N]
vie = viento(DUR + 1)[:N]
amb = sonido.ambiente(DUR + 1)[:N]
ambiente = np.zeros(N); ambiente[: len(amb)] = amb

# el encargado se va: campanita de la puerta, su camioneta arranca y se aleja
poner(campanita(), t(21) + 0.6, 0.18)
poner(motor(t(36) - t(25), 45, 0.5) * np.linspace(1, 0, int((t(36) - t(25)) * SR)), t(25), 0.25)
# títulos: reglas con golpe y whoosh; horas con golpe más suave
for w in (36, 52, 68):
    poner(sonido.impacto(), t(w) - 0.07, 0.5)
    poner(sonido.whoosh(), t(w) - 0.35, 0.25)
for w in (87, 93, 113, 131):
    poner(sonido.impacto(), t(w) - 0.07, 0.3)
# la chapa: regla 1 y a las doce
poner(chapa(), t(42) + 0.4 * (t(47) - t(42)), 0.45)
poner(chapa(), t(91), 0.45)
# a la una: el tráiler llega, frena de aire, paga por la charola, arranca rápido
llega = t(93); sale = t(108)
m1 = motor(sale - llega, 50, -0.15) * np.clip((tt(sale - llega) / 2.0), 0, 1)
poner(m1, llega, 0.35)
poner(frenos_aire(), t(99) - 0.2, 0.25)
poner(charola(), t(102), 0.3)
m2 = motor(5.0, 48, 1.4) * env(5.0, 0.2, 2.5)
poner(m2, sale, 0.45)
poner(sonido.whoosh(), sale + 1.2, 0.3)
# a las dos: chisporroteo de las lámparas; algo camina en la grava y se aleja
poner(chisporroteo(t(131) - t(116)), t(116), 0.22)
poner(pasos(t(131) - t(127), 1.6, True, 1.0, 0.1), t(127), 0.2)
# a las tres: pasos descalzos (palmadas suaves) hasta la ventanilla
poner(pasos(t(139) - t(133), 2.4, False, 0.3, 1.0), t(133), 0.25)
# frío: ráfaga de viento; la mano en el vidrio
poner(viento(3.0) * env(3.0, 0.8, 1.5), t(163) - 0.3, 0.3)
poner(golpe_vidrio(), t(179), 0.4)
# súplica y pregunta: dron que crece, latidos y golpe al aparecer los botones
poner(dron(t(192) - t(176) + 1.0), t(176), 0.25)
poner(sonido.impacto(), t(192) - 0.07, 0.35)
s = t(184); paso = 0.85
while s < DUR - 0.4:
    poner(sonido.latido(), s, 0.3)
    s += paso; paso = max(0.5, paso * 0.92)

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
fondo = pasa(ambiente * 0.3 + g * 0.05 + zum * 0.03 + vie * 0.1 + pista * 2.1, 100, None) * duck
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
