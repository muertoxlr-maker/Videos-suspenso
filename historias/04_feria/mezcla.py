"""Mezcla de «La rueda de la feria»: voz + ambiente de feria + efectos sintetizados, sincronizados con palabras.json.

Guía §5: voz al frente; fondo continuo; nada por debajo de 100 Hz; fondo ≈ −13 dB bajo la voz al hablar; −14 LUFS.
Efectos: grabados con ElevenLabs (herramientas/sfx_elevenlabs.py, pedidos en sfx/pedidos.json), no sintetizados.
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


medianoche = fw(130)
# antes de medianoche: organillo de carrusel + gente; la gente se va a las 11:30; todo se corta a las 12
corte = 1 - rampa(0, 1, medianoche - 0.02, medianoche + 0.03)
musica = tramo(sfx("organillo"), 0, medianoche + 0.5, 1.5, 0.05) * corte * rampa(1, 0.55, t(104), t(113))
gente = tramo(sfx("gente_feria"), 0, medianoche + 0.5, 1.5, 0.05) * corte * rampa(1, 0.15, t(104), t(113) + 1)
# después de medianoche: campo vacío de noche (viento y grillos lejanos)
noche = tramo(sfx("noche"), medianoche + 0.4, DUR, 2.0, 1.0)
# la rueda gira (metal grave que cruje) mientras opera; se detiene para que suba Sofi
rueda1 = tramo(sfx("rueda_gira"), 0, fw(119) + 0.6, 1.0, 1.4)
poner(golpe("palanca", -4), fw(117) + 0.1)  # freno
poner(golpe("cadena", -10), t(121) + 0.4)  # la cadena de la entrada
# títulos
for w in (34, 64, 87):
    poner(golpe("golpe_titulo", -5), t(w) - 0.07)
    poner(golpe("whoosh", -12), t(w) - 0.4)
for w in (104, 127):
    poner(golpe("golpe_titulo", -10), t(w) - 0.07)
# medianoche: el apagón (tres golpes grandes de interruptor, al empezar, a la mitad y al final de la secuencia)
for d, v in ((0, -3), (9, -9), (20, -5)):
    poner(golpe("apagon", v), medianoche + d / FPS)
# la rueda gira sola: el mismo crujido, más fuerte, y el organillo vuelve lento y desafinado
rueda2 = tramo(sfx("rueda_gira"), t(143), DUR, 2.0, 1.0)
lenta = tramo(sfx("organillo_lento"), t(146), DUR, 3.0, 1.0)
# (el usuario pidió quitar la canción de feria: musica y lenta ya no entran en la mezcla)
# frío final: dron y latidos
dron_f = tramo(sfx("dron"), t(172), t(194) + 1.0, 4.0, 0.8)
poner(golpe("golpe_titulo", -6), t(194) - 0.07)
latidos = tramo(sfx("latidos"), t(188), DUR, 1.0, 0.6)

GENTE_DB = -9  # el usuario pidió bajar la gente (antes 0)
fondo_crudo = (gente * db(GENTE_DB) + noche * db(-8) + rueda1 * db(-7) + rueda2 * db(-3)
               + dron_f * db(-5) + latidos * db(-2) + pista * db(-14))

# ------------------------------------------------------------------ voz y mezcla
voz = sonido.leer_audio(AQUI / "voz" / "voz_final.mp3")
vz = np.zeros(N); vz[: min(N, len(voz))] = voz[:N]
envv = np.convolve(np.abs(vz), np.ones(int(0.12 * SR)) / int(0.12 * SR), mode="same")
duck = 1 - 0.75 * np.clip(envv / (np.percentile(envv[envv > 1e-4], 60) + 1e-9), 0, 1)
fondo = pasa(fondo_crudo, 100, None) * duck
# nivel: el fondo CON la gente a 0 dB quedaría 13 dB bajo la voz (guía §5); con la gente más baja, todo lo demás
# se queda igual y solo la gente baja
hab0 = envv > np.percentile(envv, 70)
ref = pasa(fondo_crudo + gente * (1 - db(GENTE_DB)), 100, None) * duck
fondo *= db(-13) / (np.sqrt(np.mean(ref[hab0] ** 2)) / np.sqrt(np.mean(vz[hab0] ** 2)))
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
