# «Hinterkaifeck» (caso real, mini documental)

- `GUION.md` — guion aprobado y notas de qué datos son seguros y cuáles son relatos de testigos. Gancho de una frase
  («Imagina que…» → la granja), luego la historia en orden: los Gruber en la granja de Baviera, 1922; huellas en la
  nieve que llegan y no regresan, pasos en el ático, el periódico que nadie compró, la llave perdida; el 31 de marzo
  llega la sirvienta María; esa noche matan a los seis (sin sangre ni violencia en pantalla, el asesino es solo una
  silueta de espaldas); alguien se queda días dando de comer a las vacas; el 4 de abril los vecinos entran; más de
  100 interrogados, nunca hubo culpable; derriban la granja en 1923. Final con pregunta.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 97.70 s) y `palabras.json`.
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto solo en su palabra, dron y
  latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/hinterkaifeck/` (composición `Hinterkaifeck`, 2931 cuadros, acabado §8.9):
  granja con casa y granero bajo un techo de nieve, bosque, huellas, cocina con Kachelofen, ático con trampilla,
  granero con vacas, oficina de policía con el expediente. Personajes caricatura que no se parecen a los reales.
- Portada para TikTok: composición `HinterkaifeckPortada` (falta probarla).

## Revisión §8.6c / §8.6d
- Nadie atraviesa paredes; las puertas y el portón se abren; nada tapa bocas.
- `revisar_parpadeo.py` en el video completo: lo marcado son personajes que se mueven y bordes del techo y la ventana
  cuando la cámara avanza (revisado cuadro por cuadro: se desplazan parejo, no brincan). Las rayitas de la puerta y la
  textura del techo que sí parpadeaban se corrigieron antes del render.

## Video final
- 2931 cuadros, 1080×1920, 97.7 s (`caricatura3d/salida/hinter/hinterkaifeck.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −2.3 dBFS.
