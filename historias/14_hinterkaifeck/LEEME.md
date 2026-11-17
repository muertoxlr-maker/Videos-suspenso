# «Hinterkaifeck» (caso real, mini documental)

- `GUION.md` — guion aprobado y notas de qué datos son seguros y cuáles son relatos de testigos. Gancho que dice el caso desde
  el primer segundo («Hinterkaifeck: el crimen sin resolver más famoso de Alemania. Durante tres días, el asesino vivió
  en la granja… con la familia muerta.», letrero CASO HINTERKAIFECK, sin escena adelantada), luego la historia en orden: los Gruber
  en la granja de Baviera, 1922; la sirvienta que renunció por ruidos en el ático; huellas en la nieve que llegan y no
  regresan, pasos en el ático, el periódico de Múnich que nadie compró; el 31 de marzo
  llega la sirvienta María; esa noche matan a los seis (sin sangre ni violencia en pantalla, el asesino es solo una
  silueta de espaldas); humo en la chimenea: alguien se queda días dando de comer a los animales; el 4 de abril los vecinos entran; más de
  100 interrogados, nunca hubo culpable; derriban la granja en 1923. Final con pregunta.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 101.4 s) y `palabras.json`. Es el gancho de
  `voz_gancho/` pegado al resto de la narración original (`voz_final_sin_gancho.mp3`, `palabras_sin_gancho.json`,
  desde «Hinterkaifeck era…», corrida 3.7 s). Por eso `voz/texto_enviado.txt` y la alineación son de la grabación
  original: no correr `voz_elevenlabs.py` sobre `voz/`.
- `sfx/` — efectos cortos (`pedidos.json`); `mezcla.py` → `audio/mezcla.wav`: cada efecto solo en su palabra, dron y
  latidos solo al final (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/hinterkaifeck/` (composición `Hinterkaifeck`, 3042 cuadros, acabado §8.9):
  granja con casa y granero bajo un techo de nieve, bosque, huellas, cocina con Kachelofen, ático con trampilla,
  granero con vacas, oficina de policía con el expediente. Personajes caricatura que no se parecen a los reales.
- Portada para TikTok: composición `HinterkaifeckPortada` (falta probarla).

## Revisión §8.6c / §8.6d
- Nadie atraviesa paredes; las puertas y el portón se abren; nada tapa bocas.
- `revisar_parpadeo.py` en el video completo: lo marcado son personajes que se mueven y bordes del techo y la ventana
  cuando la cámara avanza (revisado cuadro por cuadro: se desplazan parejo, no brincan). Las rayitas de la puerta y la
  textura del techo que sí parpadeaban se corrigieron antes del render.

## Video final
- 3042 cuadros, 1080×1920, 101.4 s (`caricatura3d/salida/hinter/hinterkaifeck.mp4`, no se sube a git).
- Atajo del gancho: solo se dibujaron de nuevo los cuadros 0–290 (`salida/hinter/gancho/gancho.mp4`); el resto es el
  render anterior desde su cuadro 180 («Hinterkaifeck era…»), que cae justo en el corte de toma.
- Sonidos de suspenso (pedido del usuario): subidas cortas, golpes graves, piano tétrico y un chillido de violín solo
  en los momentos fuertes (`mezcla.py`, bus `suspenso`); ninguno dura más de 3 s.
- La toma del granero («uno por uno», cuadros 1761–1843) se dibujó de nuevo aparte: la sombra va adentro, detrás de
  las hojas abiertas (antes atravesaba las puertas, que abren hacia adentro).
- Audio: −14.0 LUFS, pico −1.9 dBFS.
