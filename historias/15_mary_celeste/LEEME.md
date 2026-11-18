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
