# «La rueda de la feria»

- `GUION.md` — guion aprobado (201 palabras).
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 74.67 s) y `palabras.json` con los tiempos.
- `mezcla.py` → `audio/mezcla.wav` — voz + organillo y gentío (se cortan de golpe a medianoche), golpes de luz al
  apagarse la feria, rechinidos y cadenas de la rueda, palanca, organillo lento y desafinado cuando la rueda gira sola,
  dron y latidos. Medido: fondo −13.4 dB bajo la voz; −13.9 LUFS, pico −1.5 dB.
- Animación: `caricatura3d/src/videos/feria/` (composición `Feria`, 2241 cuadros; portada `FeriaPortada`).
  Render: `bash scripts/render_por_tramos.sh Feria 2241 salida/feria 250` y luego unir con el audio.

## Video final
- Render completo: 2241 cuadros, 1080×1920, 74.7 s (`caricatura3d/salida/feria/feria.mp4`, no se sube a git).
- Audio: −13.9 LUFS, pico −1.4 dBFS.
- Revisión §8.6c: nadie atraviesa paredes ni objetos; `revisar_parpadeo.py` solo marca movimiento buscado
  (focos en cadena, rayos de la rueda girando, temblor y lágrimas).
