# Voz de «El turno de las 3:00»

- `voz_final.mp3` — narración aprobada para la animación (75.7 s, 209 palabras, 2.76 palabras/s).
- `palabras.json` — inicio y fin de cada palabra en `voz_final.mp3` (para sincronizar planos, subtítulos y sonido).
- `voz_original_elevenlabs.mp3` + `alineacion_caracteres.json` — salida original de ElevenLabs (76.3 s) y sus tiempos por letra.
- `texto_enviado.txt` — texto exacto enviado, con las pausas `<break>`.

Generada con tu voz clonada **«Videos suspenso»** (`NpjhSa7jQNbSGat8hG6Q`) y **tu configuración de siempre**:
modelo `eleven_v4`, estabilidad 0.5 · similitud 0.75 · estilo 0 · velocidad 1.0 · speaker boost, MP3 192 kbps.
Se rehízo así porque la primera versión (`eleven_multilingual_v2`, similitud 0.95, velocidad 0.92) sonaba apagada y
con distorsión, «como bocina vieja» (medido: agudos 2–4 dB más bajos y ~10 veces más picos al volumen máximo).

Todo se hace con `preparar_voz.py` (genera, calcula tiempos por palabra y ajusta los silencios: 0.60–0.70 s en cambios
de parte, 0.30–0.45 s en pausas cortas, 0.45–0.55 s en las dos pausas dramáticas). La voz no se modifica.
Resultado: 75.7 s, 209 palabras. Verificado con Whisper: 99 % igual al guion (solo acentos: «sólo», «de»).
