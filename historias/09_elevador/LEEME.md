# «El elevador»

- **Sin adelanto** (pedido del usuario: no le gustan los inicios que adelantan la historia). La primera versión abría
  con la caída del elevador; se quitó y el video empieza en «Imagina que…». Para no rehacer el render se cortó el video
  ya hecho (desde el cuadro 188, con 12 cuadros quietos al inicio) y se recortó la voz 5.88 s
  (`voz/voz_con_adelanto.mp3` y `palabras_con_adelanto.json` son la versión anterior).
- `GUION.md` — guion (la frase de la caída ya no se usa): bajas
  del piso 14 con tu hermanito Leo, en el 9 se sube un señor de traje gris, la hoja con tres reglas, la luz de
  emergencia roja, el portero que por el interfón dice que en la cámara solo se ven dos personas, Leo que cuenta, y el
  espejo donde Leo no tiene reflejo. Final con dos botones: QUEDARTE / SALIR SOLO.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 76.33 s) y `palabras.json` con los tiempos.
- `sfx/` — efectos cortos (pedidos en `sfx/pedidos.json`): cable que truena, caída, frenazo, apagón, ding, puertas
  del elevador, luz de emergencia, interfón, baja un piso, puertas atoradas, papel; golpe de título, whoosh, dron y
  latidos vienen de antes. Los de la caída ya no se usan.
- `mezcla.py` → `audio/mezcla.wav` — voz + efectos, cada uno solo en su palabra; dron y latidos solo al final (guía §5).
- Animación: `caricatura3d/src/videos/elevador/` (composición `Elevador`, 2290 cuadros; portada `ElevadorPortada`).
  Acabado de la guía §8.9 (personajes `ref7`, lugares gastados, LUT frío, sin polvo encima). Escenario en
  `elevador.ts`: cabina con paneles de madera gastada, botonera 1–14 y PB, hoja de reglas con cinta, espejo de verdad
  (`Reflector`, Leo nunca sale en el reflejo), pasamanos, indicador de piso, interfón, luz de emergencia, cámara de
  seguridad, puertas corredizas; cubo con lámparas, números pintados, rieles, cables y contrapeso; pasillo del piso 14
  con placa, botón de llamar, puertas de departamentos y escalera.

## Revisión §8.6c / §8.6d
- Las puertas se abren cuando alguien entra o sale; nadie atraviesa paredes. La mano en la boca de Leo es a propósito
  («Le tapas la boca»).
- `revisar_parpadeo.py` en clips de prueba y en el video completo. Se arregló la orilla de las puertas del pasillo,
  que la tinta pintaba como rayita punteada que temblaba (marco plano y hojas metidas atrás de la pared). Lo que queda
  marcado es buscado: sacudida y luz que titila en la caída, luz roja que pulsa, puertas que se abren, cámara que se
  mueve, letrero que se escribe y subtítulos.

## Video final
- 2114 cuadros, 1080×1920, 70.5 s (`caricatura3d/salida/elevador/elevador.mp4`, no se sube a git).
- Audio: −14.0 LUFS, pico −2.3 dBFS.
- `portada.jpg` — portada para TikTok (composición `ElevadorPortada`): Leo sonriendo junto a ti, asustado; título abajo para no tapar la sonrisa.
