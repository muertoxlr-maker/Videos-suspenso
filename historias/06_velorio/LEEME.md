# «El velorio del pueblo»

- `GUION.md` — guion aprobado: velorio de don Chuy en San Miguel, las tres reglas de la abuela y la voz que te llama
  por tu nombre completo.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 77.28 s) y `palabras.json` con los tiempos.
- `sfx/` — efectos cortos (pedidos en `sfx/pedidos.json`; golpe de título, whoosh, latidos y dron vienen de la
  taquería): taza, tic del reloj, campanada, madera que cruje, vela que se apaga, cerillo, tapa que se abre,
  alguien que se sienta, puerta de la cocina.
- `mezcla.py` → `audio/mezcla.wav` — voz + efectos, cada uno solo en su palabra. Sin ambiente ni bucles largos: el dron y
  los latidos solo suenan en los últimos segundos (regla del usuario, guía §5). −14.0 LUFS, pico −2.5 dBTP.
- Animación: `caricatura3d/src/videos/velorio/` (composición `Velorio`, 2319 cuadros; portada `VelorioPortada`).
  Escenario en `velorio.ts` (sala con ataúd de tapa con bisagra, 4 velas, sillas, cocina, reloj, café de olla).
  Render: `bash scripts/render_por_tramos.sh Velorio 2319 salida/velorio 250` y luego unir con el audio:
  `-af "aresample=48000,alimiter=limit=0.75:level=false:attack=1:release=50" -c:a aac -b:a 192k`.

## Revisión §8.6c
- La tapa del ataúd gira sobre su bisagra y pasa la vertical antes de que la figura se levante: nada la atraviesa.
- Rebozo, cerillo y tazas separados de las superficies ≥ 5 mm; las vigas del techo, 1 cm más cortas que la sala para
  que no se peleen con las paredes.
- `revisar_parpadeo.py` en clips de prueba (0–90, 1180–1270, 2170–2260): solo movimiento buscado (cámara, temblor
  de la tapa, ojos temblando, la figura levantándose).
