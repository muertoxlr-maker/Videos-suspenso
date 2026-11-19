---
name: borninlore-animacion
description: Úsala cuando haya que DIBUJAR y ANIMAR con código escenas al estilo del canal de YouTube @borninlore ("What if you were born as [personaje de videojuego]"). Cubre fan art de personajes en SVG, el estilo visual (contornos, sombreado, paleta, fuentes), capas para parallax, la gramática de movimiento con tiempos exactos (push-ins, pops back.out, sellos, mapa con ruta, polaroid, libro con página que pasa, bebé asomándose) y el render con Puppeteer y ffmpeg. NO cubre la investigación de temas, el guion, los hooks, la voz, los títulos ni las miniaturas.
---

# Animación estilo @borninlore (hecha con código)

Todo se dibuja como **SVG generado con JavaScript**, se anima cambiando `transform` y `opacity` por cuadro, se captura con **Puppeteer** y se codifica con **ffmpeg**. En `starter/` hay un ejemplo completo que funciona: los primeros 16 s del video de CJ, con CJ, Sweet, Big Smoke, Ryder y CJ bebé. Ejecútalo primero y úsalo como plantilla:

```bash
cd starter && npm install && node render.mjs && bash encode.sh   # -> recreacion_cj.mp4
```

Mira `starter/ejemplos/` antes de dibujar: ahí están sus frames junto a los nuestros, la hoja de juego, su dibujo y el nuestro, y la superposición al 50 %.

---

## 1. Estilo visual (medido sobre sus frames a 1080p)

### Contornos
- **Personajes:** contorno casi negro y cálido, `#120b08`, con uniones y puntas redondas en todo.
  - Medidas finales en pantalla: **10–11 px** en contorno de cara, cuello, ropa y hombros; **9–10 px** en orejas; **5–6 px** en las alas de la nariz.
  - En el código se escriben los anchos base (cabeza 8, cuerpo y cuello 7.5, orejas 7, nariz 4, párpado 5.5) y `polish.js` multiplica todo trazo `#120b08` por **1.35** (`OUTLINE_K`).
- **El contorno va ENCIMA del sombreado.** Si las sombras recortadas con `clip()` se pintan encima, tapan la mitad interior del trazo y la línea se ve delgada. `polish.js` vuelve a trazar el contorno después de cada grupo recortado.
- **Líneas de detalle interno** (nariz, párpado inferior, clavículas, tendones del cuello, pliegues de oreja): 2–3 px y teñidas, es decir, una versión oscura del relleno. **Nunca negras.**
- **Fondos y props:** café oscuro `#3a2620`, 2–4 px, más delgado que los personajes para que ellos resalten.

### Cero esquinas
- Kelly: "tú usas muchas esquinas y él casi no". Todas las formas son curvas suaves: contorno de cara, pelo, bloques de sombra, cejas, perilla, labios, brillos y ropa.
- `polish.js` remuestrea cada path y suaviza sus esquinas con una gaussiana a lo largo del arco, radio `ROUND_R = 8` px.
  - `data-r="10"` hace una forma más suave (pelo).
  - `data-sharp` excluye una forma (una X dibujada, por ejemplo).
  - Los rects con contorno reciben `rx = 4`.
- **Pelo:** UNA sola gorrita redonda con la línea de la frente curva y las sienes redondeadas. Nada de bloques laterales ni patillas cuadradas escalonadas.
- La barbilla es una curva, no un segmento plano entre dos esquinas.

### Sombreado
- Cel shading plano, de borde duro y sin degradados en los personajes.
- **Piel en 4 tonos:**
  - base
  - sombra, del lado contrario a la luz
  - sombra profunda: una banda dura bajo la mandíbula que cruza el cuello, más dentro de las orejas y en las fosas nasales
  - brillo: sien o frente y puente de la nariz
- CJ adulto usa base `#8b502b`, sombra `#7a4426`, sombra profunda `#5d2f18` / `#3e1c0b` y brillo `#985f3a` / `#a86f4c`.
- **Rim light naranja** (`#f2a45c` a `#f4a868`) en escenas de atardecer: una franja de 6–10 px justo dentro del contorno, en el lado que mira al sol (borde de la cara, oreja, hombro y cuello). Es su firma en la calle y en la polaroid.
- Degradados solo en el cielo y en los brillos de luz (con blur).

### Caras
- **Adultos semi-realistas:**
  - Ojos almendrados pequeños, con el párpado superior grueso y un "flick" hacia afuera, el iris medio tapado por el párpado, la esclera hueso (`#e8dccb`) y el párpado inferior delgado y teñido.
  - Cejas gruesas y afiladas que bajan hacia la nariz (gesto serio), con pelitos sueltos en el borde.
  - La nariz se arma con planos de luz y sombra más 2 curvas de fosa nasal.
- **Bigote de CJ:** el labio superior es un labio normal, y **un poquito arriba va una línea delgada de bigote**. No es un bigote grande. La perilla es un parche oscuro con textura de puntos o pelitos.
- **Labios en 2 tonos** con una línea de boca oscura.
- **Bebés:**
  - Cabeza enorme y redonda, con una sombra dura de "luna" en el tercio inferior.
  - Ojos grandes ovalados y oscuros con 2 brillos blancos.
  - Cejas cortas y gruesas (el bebé CJ las tiene fruncidas), nariz de una curvita, boca de una línea y chapitas suaves.
  - Las manos son mitones con 3 líneas de dedos, apoyados SOBRE el barandal y con los dedos hacia abajo, hacia el espectador.
- **Ropa:** escote en **U** suave (la camiseta de tirantes de CJ con su banda acanalada), con pliegues de 2–3 px teñidos.

### Proporciones y composición
- El busto del héroe ocupa el ~45 % derecho del cuadro. La cabeza mide ~45 % de la altura, los hombros se salen por abajo y por la derecha, y el cuello es ancho.
- Profundidad atmosférica:
  - Los cerros y la ciudad lejanos tienen poco contraste y un tono cercano al cielo.
  - Palmeras y postes son siluetas moradas planas.
  - El plano medio (casa, coche) va dibujado completo con línea delgada.
- **Los cuartos van llenos:** escalera con balaustres, 3 o más cuadros, banderín, ventana con cortinas, repisa con juguete y florero, sofá, sillón, tele, lámpara y tapete.
- **El mapa lleva:**
  - textura de papel, dobleces, relieves y 3 tipos de camino
  - panel de leyenda y nombres con halo
  - iconos dibujados con grosor de personaje y sombra en el piso

### Paleta (hex)
- Cielo de atardecer: `#5a3a5e → #94566a → #d57f70 → #f09a6e` (en general `#3A1C2C → #6B3548 → #C47878`), con resplandor `#ffc890`.
- Siluetas: `#5d3648` / `#6a3e50`. Pasto `#5e6a38`, banqueta `#c9a690`, borde rojo `#b23a28`, asfalto `#352626`.
- Mapa:
  - papel `#ecd39c` / `#e8d09a`, tierras bajas verdes `#c3c98e`, mar `#8fb2b0`, agua `#8cbad0`
  - autopista `#d4452f`, camino `#e7a93b`, tinta `#2e2118`
  - rojo de sello y ruta `#d8312a`
- Pergamino y páginas del libro: `#EDE3CB` / `#f1e5cb`. Portada del libro `#7a2420`. Escritorio: radial de `#4a2c1a` a `#140a05`.
- Etiquetas: crema `#FBF6EC` / `#f7f4ec`. Tachón: naranja `#E85A18`.
- Post-proceso: viñeta radial (40–55 %), grano `feTurbulence` al ~10 % y polvo con blur que flota.

### Fuentes (en `starter/fonts/`)
- **Oswald 700**: ciudades del mapa, en mayúsculas con halo crema (`paint-order="stroke"`).
- **Alfa Slab One**: sellos, logos y títulos ("ROBADO", "Grove Street").
- **Permanent Marker**: el texto de la polaroid ("GROVE ST. 4 LIFE").
- **Alegreya Italic**: textos de libro y pies de foto.
- **Nunito 800–900**: etiquetas blancas redondeadas ("GROVE STREET") y nombres de pueblos.
- **Lilita One / Cinzel Decorative**: logos de nombre o títulos de época.

---

## 2. Flujo para dibujar un personaje (fan art)

1. **Referencias reales:** busca imágenes del personaje en el juego (wiki Fandom, arte oficial) y frames del video de él donde aparezca. Nunca inventes al personaje; ese fue el error que hizo que "no se parece en nada".
2. **Hoja de comparación** con 3 columnas, **juego | su dibujo | el nuestro**, una fila por personaje. Ejemplo: `ejemplos/hoja_juego_suyo_nuestro.jpg`.
3. **Rasgos que dan el reconocimiento:**
   - CJ: cabeza rapada con "lineup", bigote delgado, perilla, camiseta de tirantes blanca, orejas grandes.
   - Ryder: gorra oscura "S.A.", lentes envolventes, chamarra verde.
   - Sweet: gorra verde "LS", bigote grueso y perilla.
   - Big Smoke: complexión ancha, sombrero oscuro, lentes de armazón negro, camisa verde.
4. **Calca proporciones:** encuadra igual que su frame y ejecuta `python3 tools/overlay.py su.png nuestro.png out.jpg`, que pone los dos superpuestos al 50 %. Ojos, nariz, boca, mandíbula y orejas deben caer en las mismas líneas guía.
5. **Mide los grosores:** `python3 tools/measure.py su.png nuestro.png` tiene que dar ±1 px en cara, cuello, orejas y nariz.
6. **Still de prueba ANTES de animar:** `node snap.mjs N` y enséñalo junto al de él. No animes hasta que lo aprueben.
7. **Revisa cada mano:** que la palma o el dorso y los dedos apunten hacia donde deben, que las manos izquierda y derecha estén en espejo, y que agarren el objeto de forma creíble.
8. **Itera** al menos 3 rondas con zoom a la cara. Errores típicos: líneas delgadas, esquinas, pelo escalonado, bigote grande y un brillo exagerado en la frente.

---

## 3. Capas (para poder animar)

Cada escena es un `<svg>` de 1920x1080. Las piezas que se mueven van en grupos con id, y nunca hay que redibujarlas.
- **Fondo** `#far`: cielo, nubes, ciudad, palmeras (cada una en `#palmN` con `data-x` y `data-y` en su base), avión y cables.
- **Medio** `#mid`: piso, casa y coche. Dibuja el piso más ancho que el cuadro (-200 a 2120) para que el parallax no muestre bordes.
- **Héroe** `#hero`: el personaje. Dentro van `#cjeyeL` y `#cjeyeR` (ojos) y `#cjlidL` y `#cjlidR` (párpados cerrados, opacity 0).
- **Props que aparecen:** `#chips`, `#stamp`, `#van`, `#area`, `#route` y `#arrowh` en el mapa; `#pola`, `#marker`, `#stamp3`, `#x1` y `#x2` en la polaroid; `#baby` y `#tag` en el cuarto.
- **Cámara:** `anim.js` mete todo, menos el polvo y el post, en `#cam` y le aplica `translate` y `scale`. El mapa usa su propia cámara, `#mapcam`.
- `#dust`, la viñeta y el grano quedan fijos encima. El grano se anima cambiando el `seed` de `feTurbulence` cada 2 frames.
- **Párpado para parpadear:** es una almendra del color de la piel con una curva de pestaña encima. Se muestra con `opacity`, y el ojo se aplasta con `scaleY` alrededor de su centro.
- Si un dibujo ya existe sin ids, envuelve sus piezas como hace `tools/patch.py`, sin cambiar el dibujo.

---

## 4. Gramática de movimiento (tiempos exactos del clip de CJ)

Easings en `anim.js`:
- `eio` = easeInOutCubic, para cámaras.
- `eout` = easeOutCubic, para deslizamientos y sellos.
- `ein` = easeInCubic, para el push final al libro.
- `bout(x, s)` = back.out, para pops (s = 2.2 en pops, 1.4–1.8 en caídas y asomos).

`pop(id, cx, cy, t, t0, dur=.42, rot0)` hace que el elemento crezca de 0 a 1 con back.out alrededor de (cx, cy) y que su opacidad llegue a 1 en el primer 20 %. Con `rot0` gira hasta 0° mientras crece.

| Movimiento | Detalle |
|---|---|
| **Push-in de cámara** | Siempre easeInOutCubic y lento, de punta a punta de la toma. Calle: escala 1.035 → 1.085 alrededor de (1150, 520). Polaroid: 1.0 → 1.12. Cuarto: 1.0 → 1.07. Empieza en 1.03 o más si hay parallax, para que no se vean bordes. |
| **Parallax** | Durante la toma: fondo +12 px, medio −4 px y héroe −24 px (−2 px en y). La diferencia de velocidad es lo que da profundidad. |
| **Respiración** | Seno de 0.55–0.6 Hz. Adulto: `scale(1+.003·s, 1+.007·s)` desde la base del busto (1290, 1090). Bebé: ±3 px en y, que entra suave después del asomo. |
| **Parpadeo** | Dura 0.17 s: `k = sin(π·fase)`, el ojo hace `scaleY(1 − .92k)` y el párpado aparece cuando k > .55. CJ parpadea en 1.05 s; el bebé en 14.15 y 15.55 s. Uno cada 1.4–3 s. |
| **Palmeras** | `rotate(1.3°·sin(1.7·t + i·1.3))` alrededor de la base de cada una, cada una con su fase. |
| **Avión** | Cruza con `translate(95·t, −14·t)`. |
| **Pop de props** | back.out en 0.42–0.45 s. Fichas en 2.4 s, zona AREA 69 en 3.45 s (con giro desde −8°), van en 3.75 s, flecha en 4.7 s. |
| **Golpe de sello** | Escala 2.4 → 1 en **0.22 s** con easeOutCubic; la opacidad sube en el primer tercio. Al mismo tiempo la cámara tiembla 0.3 s: `sin(f·40)·10px·(1−f)`. ROBADO cae en 3.05 s, TE VENDIÓ en 10.05 s (2.2 → 1). |
| **Ruta que se dibuja** | `stroke-dasharray = L`, `dashoffset` de L → 0 con easeInOutCubic en 0.7 s (4.05–4.75 s), y al final un pop de la punta de flecha. La X roja va igual, un trazo tras otro (0.2 s cada uno, separados 0.22 s). |
| **Cámara del mapa** | Paneo de derecha a izquierda en 3 tramos: (cx 1650, cy 470, escala 1.22) → (1560, 480, 1.15) en 1 s → (1320, 410, 1.05) entre 1.05 y 2.5 s → se acerca a la van (960, 330, 1.55) entre 2.75 y 4.5 s. Son tiempos locales de la toma. |
| **Caída de la polaroid** | 0.5 s: `translateY −1150 → 0` con back.out(1.4) y giro −9° → 0° con easeOutCubic. El marcador entra deslizándose en diagonal (+760, −340 → 0) entre 0.55 y 1.0 s. |
| **Libro (11.1–12.6 s)** | **a) Alejamiento** (0–0.5 s): el libro arranca a escala 3.2, con la foto de la página llenando la pantalla, y baja a 1. La foto es el frame exacto en 11.1 s, así que el corte no se nota. **b) Rebobinar** ◀◀: parpadea cada 0.16 s entre 0.5 y 1.15 s. **c) La página pasa hacia atrás** (0.55–1.05 s, easeInOutCubic): `scaleX(cos πk)` alrededor del lomo (x = 960). Con k < .5 se ve el frente (página izquierda); con k > .5, el reverso (la nueva página derecha), más una sombra de hasta 35 %. **d) Acercamiento** (1.12–1.5 s, easeInCubic) hacia la foto del cuarto (frame exacto en 12.6 s) hasta llenar la pantalla, y corte a la escena viva. La viñeta del libro se apaga en los extremos para no duplicarla. |
| **Asomo del bebé** | De +48 px a 0 con back.out(1.8) entre 12.75 y 13.25 s. Se mueve detrás del barandal delantero; las manos se quedan fijas sobre el barandal. |
| **Pop de etiqueta** | 13.15 s, back.out en 0.42 s, girando desde −14°. |
| **Polvo** | Deriva lineal (14 px/s, −9 px/s). Es lo único lineal. |

**Reglas generales:** nada entra de golpe ni en línea recta (solo el polvo); cada elemento nuevo entra con su ease. Sin esto, los frames se ven como stills.

### Plantilla de tiempos (hook de 16 s)
| seg | toma |
|---|---|
| 0–2.1 | Héroe adulto en su lugar icónico: push-in, parallax, parpadeo y respiración. |
| 2.1–6.6 | Mapa o documento del mundo del juego: paneo y zoom, pops de props, golpe de sello, ruta que se dibuja. |
| 6.6–11.1 | Polaroid del grupo o recuerdo clave: cae, entra el marcador, push-in, y al final sello más X (traición o giro). |
| 11.1–12.6 | Alejamiento hacia la página de un libro, rebobinar, página que pasa, acercamiento a la foto del prólogo. |
| 12.6–16 | El héroe de bebé en su cuarto: asomo, parpadeo, respiración y etiqueta del lugar. |

### Detalles que él usa y nosotros aún no (agrégalos para acercarte más)
- **Logo del nombre** ("CJ") que aparece con un pop hacia ~1.0 s en la primera toma: escala 0 → 1.15 → 1 y giro de −12° a 0° en 0.45 s.
- **Triángulos de advertencia** amarillos que aparecen con pop y parpadean alrededor del objetivo del mapa (~5 s).
- **Objeto que despega con flamas** (el jetpack): sube con easeIn, con llamas animadas (formas que cambian de escala cada 2–3 frames) y un destello blanco.
- **Contador de dinero** ("$60,000,000") que cuenta rápido hasta la cifra, en una etiqueta roja.
- **Varias páginas que pasan** en el libro (3–4 rápidas, con bocetos a lápiz en las páginas) en vez de una sola.
- **Movimiento secundario:** los amigos de la polaroid se balancean o parpadean, la cabeza se mece ±1° y las cortinas o las palmeras de la ventana se mueven.
- **Lo que viene después del hook:** su clip sigue con la narración. Sincroniza cada pop con la palabra que la menciona usando los timestamps de la voz.

---

## 5. Render

```bash
cd starter && npm install                    # puppeteer-core; usa Chrome del sistema (CHROME_PATH si hace falta)
node snap.mjs 1 2 3 4                        # stills estáticos de los dibujos
node render.mjs stills 1.1,3.1,11.85,12.45   # frames sueltos a revisar
node render.mjs                              # 480 frames JPG q92 -> frames/  (~1 min)
bash encode.sh                               # x264 dos pasadas, 11 Mb/s -> ~22 MB
BR=6M bash encode.sh chico.mp4               # versión más ligera
```
- **Por qué es rápido:** cada escena se arma y pasa por `polish()` UNA sola vez, y después cada frame solo cambia atributos. Si se reconstruyera el SVG en cada cuadro, sería 10 veces más lento.
- **Solo una escena en el DOM a la vez,** porque varias comparten ids (`grain`, `vg`, `hatch`…).
- **Comparación lado a lado** con el original (si tienes su clip):
```bash
ffmpeg -i suyo.mp4 -i recreacion_cj.mp4 -filter_complex "[0:v]trim=0:16,setpts=PTS-STARTPTS,scale=960:540,fps=30[a];[1:v]scale=960:540[b];[a][b]hstack,format=yuv420p[v]" -map "[v]" -map 0:a? -t 16 -c:v libx264 -b:v 7M -c:a aac comparacion.mp4
```
- **Para TikTok (vertical 1080x1920):** cambia el `viewBox` y la composición; no recortes el video horizontal.

---

## 6. Checklist de calidad (antes de entregar)
- [ ] Revisa cuadro por cuadro cada corte (±15 frames): sin capas rotas, sin frames vacíos y sin saltos de color o viñeta en el libro.
- [ ] Nada atraviesa nada. Lo que cae pasa por encima, el bebé sube DETRÁS del barandal, y los props no cruzan al personaje.
- [ ] Manos: orientación correcta, en espejo, agarrando de forma creíble. Revisa con zoom.
- [ ] Ojos: el párpado tapa todo el ojo al cerrar y no deja huecos.
- [ ] Sin marcas de agua ni handles ajenos.
- [ ] Contorno de 10–11 px en cara y ropa (mídelo con `measure.py`) y ninguna esquina a la vista.
- [ ] Duración exacta (480 frames = 16 s) y 1920x1080 a 30 fps.
- [ ] Peso: si se va a subir a una IA o app con límite (30 MB), usa la fórmula BR × s ÷ 8 y deja margen (≤ 25 MB).
- [ ] Con voz: el audio va a −14 LUFS.
