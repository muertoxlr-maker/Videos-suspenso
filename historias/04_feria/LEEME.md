# «La rueda de la feria»

- `GUION.md` — guion aprobado (201 palabras).
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 74.67 s) y `palabras.json` con los tiempos.
- `sfx/` — efectos grabados con ElevenLabs (`herramientas/sfx_elevenlabs.py`, pedidos en `sfx/pedidos.json`).
  Reemplazan a los sintetizados de la primera versión (el usuario oía un silbido en la rueda y «palomitas»).
- `mezcla.py` → `audio/mezcla.wav` — voz + gente (se corta de golpe a medianoche; sin canción de feria, el usuario la pidió quitar), tres golpes
  de apagón, crujido grave de la rueda, palanca, campo de noche,
  dron y latidos. Medido: fondo −13.0 dB bajo la voz; −14.0 LUFS, pico −1.5 dB.
- Animación: `caricatura3d/src/videos/feria/` (composición `Feria`, 2241 cuadros; portada `FeriaPortada`).
  Render: `bash scripts/render_por_tramos.sh Feria 2241 salida/feria 250` y luego unir con el audio.

## Video final
- Render completo: 2241 cuadros, 1080×1920, 74.7 s (`caricatura3d/salida/feria/feria.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −1.5 dBFS.
- v2: canastillas abiertas (sin tapa blanca, que hacía ver a los pasajeros «metidos en algo») y efectos nuevos.
- Revisión §8.6c: nadie atraviesa paredes ni objetos; `revisar_parpadeo.py` solo marca movimiento buscado
  (focos en cadena, rayos de la rueda girando, temblor y lágrimas).
