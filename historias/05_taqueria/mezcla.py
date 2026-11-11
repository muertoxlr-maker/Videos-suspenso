"""Mezcla de «La taquería de las 2 AM»: voz + ambiente de feria + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; fondo continuo; nada por debajo de 100 Hz; fondo ≈ −13 dB bajo la voz al hablar; −14 LUFS.
Efectos: grabados con ElevenLabs (herramientas/sfx_elevenlabs.py, pedidos en sfx/pedidos.json), no sintetizados.
Detalles de la historia: sin música. La calle de noche (el chisporroteo del comal se quitó a pedido del usuario); el zumbido del foco
se corta en el apagón (los mismos cuadros que el video) y en lo oscuro solo se oye algo que respira; al volver la luz
el comal ya está apagado.
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
CUADROS = int(np.ceil(72.39 * FPS))  # = TAQUERIA_CUADROS del video
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


# ------------------------------------------------------------------ efectos (grabados con ElevenLabs, carpeta sfx/)
# Antes eran sintetizados y sonaban falsos (la rueda «silbaba» y los clics de cadena sonaban a palomitas).
SFX = AQUI / "sfx"


def sfx(nombre, rms_db=-20.0):
    """lee sfx/<nombre>.mp3 y lo deja con el mismo volumen medio (para que los niveles de abajo sean comparables)"""
    x = sonido.leer_audio(SFX / f"{nombre}.mp3").astype(np.float64)
    return x / (np.sqrt(np.mean(x ** 2)) + 1e-12) * 10 ** (rms_db / 20)


def golpe(nombre, pico_db=-6.0):
    x = sonido.leer_audio(SFX / f"{nombre}.mp3").astype(np.float64)
    return norm(x, 10 ** (pico_db / 20))


def bucle(x, dur, cruce=0.4):
    """repite un sonido hecho en bucle hasta cubrir dur segundos (con un cruce suave por si acaso)"""
    n = int(dur * SR); c = int(cruce * SR); out = np.zeros(n + len(x)); i = 0
    rampa_c = np.linspace(0, 1, c)
    while i < n:
        y = x.copy()
        if i > 0:
            y[:c] *= rampa_c; out[i:i + c] *= 1 - rampa_c
        out[i:i + len(y)] += y
        i += len(x) - c
    return out[:n]


def tramo(x, ini, fin, sube=0.5, baja=0.5):
    """coloca un bucle de ini a fin (segundos del video) con entrada y salida suaves"""
    y = bucle(x, fin - ini) * env(fin - ini, sube, baja)[: int((fin - ini) * SR)]
    out = np.zeros(N); i = int(ini * SR); out[i:i + len(y)] = y[: N - i]
    return out


def db(v):
    return 10 ** (v / 20)


# ------------------------------------------------------------------ pistas
pista = np.zeros(N)


def poner(x, seg, vol=1.0):
    i = int(seg * SR)
    if i >= N or i < 0:
        return
    x = x[: N - i]
    pista[i:i + len(x)] += x * vol


# los mismos cuadros que Taqueria.tsx
ini_vuelve = fw(161) - 2 / FPS            # «Vuelve la luz» (inicio del plano)
apagon = (fw(147), ini_vuelve)             # «va» (se va la luz)
comal_off = fw(151) + 6 / FPS              # «Apagas el comal»
corte = 1 - rampa(0, 1, apagon[0] - 0.01, apagon[0] + 0.02)

calle = tramo(sfx("calle_noche"), 0, DUR, 1.0, 1.0)
# el chisporroteo parejo y agudo sonaba a «fuga de gas» (usuario): se graba de nuevo, se le quitan agudos y va bajito
# sin chisporroteo del comal: aun filtrado y bajito el usuario lo prefirió quitar (sonaba a fuga de gas)
foco = tramo(sfx("foco_zumbido"), 0, DUR, 0.5, 0.5) * (1 - (rampa(0, 1, apagon[0] - 0.01, apagon[0] + 0.02) - rampa(0, 1, apagon[1], apagon[1] + 0.05)))
# en el apagón la calle se oye más lejos (todo se calla)
calle *= 1 - 0.6 * (rampa(0, 1, apagon[0], apagon[0] + 0.3) - rampa(0, 1, apagon[1], apagon[1] + 0.5))

# tacos: el cuchillo al principio y cuando piden doce de pastor
for s_ in (fw(8) + 0.2, fw(116) + 0.4):
    poner(golpe("cuchillo", -10), s_)
# títulos
for w in (37, 61, 79):
    poner(golpe("golpe_titulo", -5), t(w) - 0.07)
    poner(golpe("whoosh", -12), t(w) - 0.4)
for w in (104, 120, 143):
    poner(golpe("golpe_titulo", -10), t(w) - 0.07)
# 2:10 llega el taxi y bajan los taxistas
poner(golpe("taxi_llega", -6), fw(104) - 0.3)
poner(golpe("puertas_auto", -10), fw(112) - 1.0)
poner(golpe("perro_ladra", -8), fw(116) + 0.2)
# 2:30 la mujer de blanco: pasos, goteo, el perro gruñe y retrocede
poner(golpe("pasos", -12), fw(120))
goteo = tramo(sfx("goteo"), fw(120), fw(143) - 0.5, 1.0, 1.5)
poner(golpe("perro_grune", -9), fw(124))
# 3:00 el apagón, la perilla del comal, la respiración
poner(golpe("apagon", -4), apagon[0])
poner(golpe("perilla_gas", -8), comal_off - 0.25)
poner(golpe("respiracion", -6), fw(153) - 0.2)
poner(golpe("luz_vuelve", -6), apagon[1])
# tu papá: pasos y el perro contento
poner(golpe("pasos", -12), fw(164) - 0.3)
poner(golpe("cola_perro", -9), fw(196) - 0.4)
# frío final: dron y latidos
dron_f = tramo(sfx("dron"), fw(177), DUR, 4.0, 0.8)
poner(golpe("golpe_titulo", -6), t(200) - 0.07)
latidos = tramo(sfx("latidos"), fw(185), DUR, 1.0, 0.6)

fondo_crudo = (calle * db(-2) + foco * db(-16) + goteo * db(-8) + dron_f * db(-5) + latidos * db(-3)
               + pista * db(-14))

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
fondo = pasa(fondo_crudo, 100, None) * duck
hab0 = envv > np.percentile(envv, 70)  # el fondo queda 13 dB bajo la voz al hablar (guía §5)
fondo *= db(-13) / (np.sqrt(np.mean(fondo[hab0] ** 2)) / np.sqrt(np.mean(vz[hab0] ** 2)))
mezcla = vz * 1.0 + fondo
mezcla /= max(1.0, np.max(np.abs(mezcla)) / 0.95)
salida = AQUI / "audio"
salida.mkdir(exist_ok=True)
crudo = salida / "mezcla_cruda.wav"
sonido.guardar_wav(crudo, mezcla)
med = subprocess.run(["ffmpeg", "-i", str(crudo), "-af", "loudnorm=I=-14:TP=-2.5:LRA=7:print_format=json", "-f", "null", "-"], capture_output=True, text=True).stderr
j = json.loads(med[med.rindex("{"):])
filtro = (f"loudnorm=I=-14:TP=-2.5:LRA=7:measured_I={j['input_i']}:measured_TP={j['input_tp']}:measured_LRA={j['input_lra']}"
          f":measured_thresh={j['input_thresh']}:offset={j['target_offset']}:linear=true")
subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(crudo), "-af", filtro, "-ar", str(SR), str(salida / "mezcla.wav")], check=True)
crudo.unlink()
# fondo bajo la voz (para la guía §5)
hab = envv > np.percentile(envv, 70)
print(f"fondo bajo la voz al hablar: {20 * np.log10(np.sqrt(np.mean(fondo[hab] ** 2)) / np.sqrt(np.mean(vz[hab] ** 2))):.1f} dB")
print("listo:", salida / "mezcla.wav", f"{DUR:.2f} s")
