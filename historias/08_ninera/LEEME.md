# «La niñera»

- `GUION.md` — guion aprobado: tu primera noche cuidando a un bebé, la hoja con tres reglas pegada en el refri, el
  foco del pasillo que parpadea y se apaga, el monitor que a las dos de la mañana canta una canción de cuna, la mamá que
  llama y pide «ya tráemelo», y el final con dos botones: A SU CUNA / CORRER CON ÉL.
- `voz/` — narración con la voz del usuario (`voz_final.mp3`, 72.11 s) y `palabras.json` con los tiempos.
- `sfx/` — efectos cortos (pedidos en `sfx/pedidos.json`; golpe de título, whoosh, latidos y dron vienen del camión):
  grillos, puerta que se cierra, imán del refri, foco que parpadea y se apaga, bebé que llora, pasos corriendo,
  estática y corte del monitor, canción de cuna, cuna que cruje. Estática, corte, foco y grillos llevan filtro de
  3800 Hz para que no suenen a siseo.
- `mezcla.py` → `audio/mezcla.wav` — voz + efectos, cada uno solo en su palabra; dron y latidos solo en los últimos
  segundos (guía §5). −14 LUFS.
- Animación: `caricatura3d/src/videos/ninera/` (composición `Ninera`, 2164 cuadros; portada `NineraPortada`).
  Por pedido del usuario se copió lo **gráfico** del video de referencia 7 (guía §8.9): personajes `estilo:"ref7"`,
  cuartos gastados (paredes con manchas, techo de paneles, muebles con `texGastado`), luz de luna en el piso, color
  frío con LUT y textura de polvo encima. Las tomas y la historia son propias.
  Escenario en `ninera.ts`: casa por fuera (tejado, ventanas, porche, cerca, buzón, árbol, pueblo al fondo), sala con
  sillón, mesita con monitor de bebé, tele, lámpara de pie, tapetes, juguetes y reloj; cocina con refri, imanes y la
  hoja de reglas, estufa, fregadero y frutero; pasillo con foco, puertas y tapete; cuarto del bebé con cuna (móvil que
  gira, cobija, osito), cómoda con lamparita y cámara, mecedora, repisa con peluches y ventana con luna.
  Bebé y manos en primera persona: `prueba_pasillo/bebe.ts`.
  Render: `bash scripts/render_por_tramos.sh Ninera 2164 salida/ninera 250` y luego unir con el audio.

## Revisión §8.6c / §8.6d
- La puerta de la calle y la del cuarto del bebé están abiertas cuando alguien pasa; nadie atraviesa paredes.
- El bebé en brazos se dibuja sobre el pecho y abajo de la cara; nunca tapa la boca.
- La luz de la tele cambia suave (antes saltaba cada 9 cuadros y hacía parpadear las paredes).
- `revisar_parpadeo.py` en clips de prueba (0–89, 1060–1189, 1270–1359, 1600–1689, 2000–2089) y en el video completo:
  lo marcado es movimiento buscado (manos que tiemblan, acercamiento de cámara, cuna que cruje, foco que parpadea).
