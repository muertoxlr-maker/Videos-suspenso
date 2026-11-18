# «Mary Celeste» (caso real, 1872, mini documental)

- `GUION.md` — guion aprobado. Empieza con «Imagina que…»/gancho del caso y sigue en orden: el bergantín sale de Nueva
  York hacia Génova (7 nov 1872) con el capitán Briggs, su esposa Sarah, su hija Sophia y siete marineros; un mes
  después el Dei Gratia lo encuentra cerca de las Azores, sin nadie; comida, ropa y pipas en su lugar; faltaban el bote,
  los instrumentos y los papeles del barco; nueve barriles vacíos y una espada; teorías (abandono por miedo y cuerda
  rota, piratas, motín, monstruo); el cuento de Conan Doyle con el desayuno caliente (no era cierto). Final con pregunta.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 126.9 s). La frase «y los papeles del barco» se grabó
  aparte (`voz_fix/`) y se pegó en 57.28 s (respaldo: `voz_final_original.mp3`, `palabras_original.json`).
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto en su palabra, dron y
  latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/maryceleste/` (composición `MaryCeleste`, 3815 cuadros, acabado §8.9):
  `barco.ts` (bergantín con jarcias, velas, caseta, timón, escotillas, bote; camarote, rancho, bodega, puerto, estudio
  de Conan Doyle, mar y cielo de día/niebla/tarde/noche) y `MaryCeleste.tsx` (tomas por palabra, mapa de la ruta,
  rótulo y subtítulos). Personajes caricatura que no se parecen a los reales.

## Revisión §8.6c / §8.6d
- La puerta del camarote se abre antes de que entren; nadie atraviesa paredes ni la borda; nada tapa bocas.
- Parpadeo: las jarcias finas iban con contorno y temblaban en la toma que rodea el barco. Se pasaron a la capa sin
  contorno, los flechastes con textura suave y la espuma con desfase; la vuelta de cámara es más lenta. Clips de prueba
  limpios antes del render largo.
- En el video completo, el forro morado de la caja del sextante parpadeaba (misma altura que la tapa de la caja). Se
  subió un poco y se volvieron a dibujar solo las tomas del escritorio (cuadros 1819–2082, `salida/mary/fix/`). Lo
  demás que marca la herramienta es movimiento: velas que ondean, el barco que se mece, letreros que aparecen.

## Video final
- 3815 cuadros, 1080×1920, 127.2 s (`caricatura3d/salida/mary/mary_celeste.mp4`, no se sube a git). −14.0 LUFS.

## Versión 2 (color, pedido del usuario: «se ven muy opacos»)
- Sin volver a dibujar: corrección de color sobre el video final con ffmpeg (más contraste sin aplastar las sombras,
  más saturación, madera un poco más cálida, más nitidez) → `caricatura3d/salida/mary/mary_celeste_v2.mp4`. Filtro:
  `curves=all='0/0.015 0.12/0.13 0.3/0.32 0.55/0.6 0.8/0.87 1/1',eq=contrast=1.06:saturation=1.3,colorbalance=rm=0.03:gm=0.01:bm=-0.03:rh=0.02:bh=-0.02,vibrance=intensity=0.3,unsharp=5:5:0.7`
- Revisión de parpadeo repetida: solo marca movimiento (barco que se mece, farol que se balancea).

## Versión 3
- La toma «Un mes después, otro barco, el Dei Gratia…» (cuadros 886–1014) se veía rara: nuca enorme y una cuerda negra
  cruzando. Ahora es una toma abierta desde el agua (Dei Gratia adelante, Mary Celeste a lo lejos), sin la tira de espuma
  del Dei Gratia (se salía del casco). Se dibujó solo ese pedazo (`salida/mary/fix2/`), se pegó en `video_mudo3.mp4` y se
  le puso la misma corrección de color → `mary_celeste_v3.mp4`. Parpadeo: limpio.
