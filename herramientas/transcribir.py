"""Transcribe la voz de un video o audio con tiempos por palabra (faster-whisper).

Uso:  python3 herramientas/transcribir.py video.mp4 salida.json [modelo]
      modelo por defecto: medium (bueno en español; tarda ~1 min por minuto de audio con 4 núcleos)
Requisitos: pip install faster-whisper · ffmpeg · acceso a huggingface.co la primera vez (descarga el modelo).
"""
import json
import subprocess
import sys

import numpy as np
from faster_whisper import WhisperModel

entrada, salida = sys.argv[1], sys.argv[2]
modelo = sys.argv[3] if len(sys.argv) > 3 else "medium"
# se decodifica con ffmpeg (evita incompatibilidades de PyAV al abrir archivos)
pcm = subprocess.run(["ffmpeg", "-v", "error", "-i", entrada, "-vn", "-ac", "1", "-ar", "16000", "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(pcm, np.float32)
m = WhisperModel(modelo, device="cpu", compute_type="int8")
segs, _ = m.transcribe(audio, language="es", word_timestamps=True, beam_size=5)
out = [{"ini": round(s.start, 2), "fin": round(s.end, 2), "texto": s.text.strip(),
        "palabras": [{"p": w.word.strip(), "ini": round(w.start, 2), "fin": round(w.end, 2), "prob": round(w.probability, 2)}
                     for w in s.words]} for s in segs]
json.dump(out, open(salida, "w"), ensure_ascii=False, indent=1)
print(f"{len(out)} segmentos → {salida}")
