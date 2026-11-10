# «Gasolinera de la carretera»

- `GUION.md` — guion aprobado (199 palabras).
- `voz/` — narración con la voz del usuario (eleven_v4, configuración habitual + tratamiento, guía §5), hecha con
  `python3 herramientas/voz_elevenlabs.py historias/03_gasolinera/voz`. Comprobada con Whisper: coincide palabra por
  palabra (solo cambia la forma de escribir los números).
- `mezcla.py` → `audio/mezcla.wav` — voz + grillos (se callan cuando llega el niño), zumbido de las lámparas,
  camioneta, chapa, tráiler (frenos de aire, charola, arranque), chisporroteo, pasos, golpe en el vidrio, dron y
  latidos. Medido: fondo −13.4 dB bajo la voz, −7.8 dB en las pausas; −14 LUFS, pico −1.5 dB.
- Animación: `caricatura3d/src/videos/gasolinera/` (composición `Gasolinera`, 2330 cuadros).
  Render: `bash scripts/render_por_tramos.sh Gasolinera 2330 salida/gaso 250` y luego unir con el audio.

## Video final
- Render completo: 2330 cuadros, 1080×1920, 77.67 s (`caricatura3d/salida/gaso/gasolinera.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −1.4 dBFS. Color medido en el video: brillo 0.209, saturación 0.396.
