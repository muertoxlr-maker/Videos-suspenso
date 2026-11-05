"""Síntesis de ambiente y efectos de sonido con numpy (sin archivos externos)."""
import subprocess
import wave

import numpy as np

SR = 44100


def _t(dur):
    return np.arange(int(dur * SR)) / SR


def _filtro(x, bajo=None, alto=None):
    """Filtro pasa-banda sencillo en el dominio de la frecuencia."""
    espectro = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    g = np.ones_like(f)
    if alto:
        g *= 1 / (1 + (f / alto) ** 4)
    if bajo:
        g *= 1 / (1 + (bajo / np.maximum(f, 1e-3)) ** 4)
    return np.fft.irfft(espectro * g, n=len(x))


def _norm(x, pico=1.0):
    m = np.max(np.abs(x)) or 1.0
    return x / m * pico


def ambiente(dur, semilla=0):
    """Zumbido grave e inquietante, con ruido de fondo que respira."""
    rng = np.random.default_rng(semilla)
    t = _t(dur)
    lfo = 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
    tono = (np.sin(2 * np.pi * 55 * t) + 0.6 * np.sin(2 * np.pi * 55.7 * t)
            + 0.35 * np.sin(2 * np.pi * 82.4 * t + np.sin(2 * np.pi * 0.2 * t))
            + 0.2 * np.sin(2 * np.pi * 164.3 * t))
    ruido = _filtro(rng.standard_normal(len(t)), bajo=80, alto=500)
    ruido = _norm(ruido) * (0.5 + 0.5 * np.sin(2 * np.pi * 0.11 * t + 1.3))
    x = _norm(tono) * 0.7 * lfo + ruido * 0.25
    fade = np.minimum(1, np.minimum(t / 2.0, (dur - t) / 1.5))
    return x * np.clip(fade, 0, 1)


def impacto():
    t = _t(1.8)
    frec = 40 + 90 * np.exp(-t * 6)
    fase = 2 * np.pi * np.cumsum(frec) / SR
    golpe = np.sin(fase) * np.exp(-t * 2.2)
    ruido = _filtro(np.random.default_rng(1).standard_normal(len(t)), alto=900) * np.exp(-t * 14)
    return _norm(golpe + _norm(ruido) * 0.5)


def toc():
    t = _t(0.22)
    x = (np.sin(2 * np.pi * 150 * t) + 0.6 * np.sin(2 * np.pi * 95 * t)) * np.exp(-t * 32)
    clic = _filtro(np.random.default_rng(2).standard_normal(len(t)), bajo=300, alto=3000) * np.exp(-t * 120)
    return _norm(x + _norm(clic) * 0.6)


def toc3():
    salida = np.zeros(int(SR * 1.3))
    golpe = toc()
    for i in range(3):
        ini = int(SR * 0.42 * i)
        salida[ini:ini + len(golpe)] += golpe
    return salida


def latido():
    t = _t(0.9)
    def bum(ini, amp):
        tt = np.clip(t - ini, 0, None)
        return amp * np.sin(2 * np.pi * 55 * tt) * np.exp(-tt * 18) * (t >= ini)
    return _norm(bum(0, 1) + bum(0.28, 0.7))


def whoosh():
    t = _t(0.7)
    env = np.sin(np.pi * t / t[-1]) ** 2
    x = _filtro(np.random.default_rng(3).standard_normal(len(t)), bajo=400, alto=2500)
    return _norm(x * env) * 0.8


def chirrido():
    """Puerta o perilla que gira lentamente."""
    t = _t(1.4)
    frec = 600 + 250 * np.sin(2 * np.pi * 0.8 * t) + 40 * np.random.default_rng(4).standard_normal(len(t)).cumsum() / 400
    fase = 2 * np.pi * np.cumsum(frec) / SR
    x = np.sign(np.sin(fase)) * 0.3 + np.sin(fase * 2.01) * 0.3
    x = _filtro(x, bajo=300, alto=3000)
    env = np.minimum(1, t / 0.2) * np.minimum(1, (t[-1] - t) / 0.3)
    return _norm(x * env) * 0.5


EFECTOS = {
    "impacto": (impacto, 0.55),
    "toc": (toc, 0.8),
    "toc3": (toc3, 0.8),
    "latido": (latido, 0.7),
    "whoosh": (whoosh, 0.35),
    "chirrido": (chirrido, 0.35),
}


def leer_audio(ruta):
    """Decodifica cualquier archivo de audio a mono float32 con ffmpeg."""
    datos = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", str(ruta), "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
        check=True, capture_output=True).stdout
    return np.frombuffer(datos, dtype=np.float32).astype(np.float64)


def guardar_wav(ruta, x):
    x = np.clip(x, -1, 1)
    estereo = np.repeat((x * 32767).astype(np.int16)[:, None], 2, axis=1)
    with wave.open(str(ruta), "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(estereo.tobytes())
