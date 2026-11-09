# Voz de «Último vagón»

- `voz_final.mp3` — narración para la animación (77.6 s, 207 palabras): silencios ajustados + tratamiento de voz.
- `palabras.json` — inicio y fin de cada palabra en `voz_final.mp3` (planos, subtítulos y sonido).
- `voz_original_elevenlabs.mp3` + `alineacion_caracteres.json` — salida tal cual de ElevenLabs y sus tiempos por letra.
- `texto_enviado.txt` — texto exacto, con las pausas `<break>`.
- `muestra*.mp3` — pruebas cortas: sin tratamiento, con −5 dB y con el tratamiento (aprobada).

Hecho con `herramientas/voz_elevenlabs.py historias/02_ultimo_vagon/voz` (configuración y tratamiento: guía §5).
Verificado con Whisper: 98 % igual al guion (números escritos con cifras; «mires» se oyó «mides» en la versión
tratada, pero en la original se transcribe bien). Desfase mediano entre palabras.json y la voz: 0.013 s.
