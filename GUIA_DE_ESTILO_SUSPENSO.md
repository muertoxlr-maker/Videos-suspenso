# Guía de estilo: shorts de suspenso «reglas + dilema»

Conclusiones medidas sobre los **seis videos de referencia** (video 1 a video 6, en el orden en que se recibieron).
Sirven para estudiar el **estilo**: no se copian
sus historias, personajes, frases ni tomas. Las marcas de agua se ignoraron en todas las medidas.

| Video | Tema | Duración | Cuadros |
|---|---|---|---|
| 1 | Gimnasio de madrugada | 75.7 s | 2,271 |
| 2 | Fiesta de XV años | 73.9 s | 2,217 |
| 3 | Búnker del vecino | 78.8 s | 2,364 |
| 4 | Mordida sin síntomas | 74.5 s | 2,235 |
| 5 | Rancho del abuelo | 75.7 s | 2,271 |
| 6 | Hotel | 74.9 s | 2,247 |

Leyenda: ✅ = medido con herramienta · 👁 = observado revisando cuadros · ⚠️ = medida poco fiable o pendiente.

---

## 1. Cómo construyen la historia

Comparado sobre las transcripciones completas de los seis (Whisper, ver §6). Los seis siguen **la misma
estructura**, casi al segundo:

| Parte | Cuándo | Qué hace | Cómo lo hacen (descrito, no copiado) |
|---|---|---|---|
| **Gancho** | 0–7 s | Empieza con **«Imagina que…»** (6 de 6), en segunda persona y presente. Un lugar cotidiano y concreto + una interrupción. | Una fiesta familiar que se corta; un vecino raro que toca tu puerta; un hotel donde suena el teléfono. En uno el gancho es una paradoja («te pasa X… y no pasa nada»). |
| **Amenaza y contexto** | 5–13 s | Llega la noticia del peligro por un canal concreto (gente gritando, la radio, recepción, un vecino) y se fija el lugar cerrado. | Siempre hay **un espacio cerrado** que proteger: salón, búnker, refugio, rancho, habitación. |
| **Regla Nº 1** | 13–17.4 s ✅ | «Regla número uno: …» + **una frase que la justifica** con lógica del mundo. | Reglas de supervivencia simples y visuales (apagar la música, el silencio es la alarma, no abrir). |
| **Regla Nº 2** | 19–30 s ✅ | Igual. A veces la segunda regla ya prepara el conflicto final. | |
| **Regla Nº 3** | 28–46 s ✅ | Igual. Es la que el final pone a prueba. | |
| **Escalada** | 30–60 s | Saltos de tiempo marcados («Media hora después», «Horas después», «Esa misma tarde», «A medianoche») y **detalles concretos con números** (200 invitados, 40 personas, dos días). Diálogos cortos de otros personajes. | Cada momento sube lo que está en juego y mete a **un ser querido** (prima, abuelo, familia, hija). |
| **Pista ambigua** | 55–72 s | Un detalle pequeño que hace sospechar sin confirmar: zapatos demasiado limpios, una mano vendada, el perro que gruñe, un carrito parado frente a tu puerta. | La pista hace que **las dos opciones sean razonables y peligrosas**. |
| **Cierre** | últimos 2–4 s | Una pregunta de **dos opciones** («¿X… o Y?»). El video termina **0.4–0.8 s** después de la última palabra ✅. Sin despedida, sin «suscríbete». | En pantalla, dos botones de color con las opciones (ver §3). |

Reglas de escritura que se desprenden:
- **~190–205 palabras** para 74–79 s ✅ (los seis: 191–204). Frases cortas, muchas de 3–8 palabras; enumeraciones sin verbo («Niños, abuelos, un perro.»).
- Las **tres reglas no son decoración**: el dilema final enfrenta una regla con un afecto (la regla dice X, pero se trata de tu familia) o hace que dos reglas choquen.
- Mundo recurrente en 5 de 6: **infección por mordida** (los mordidos cambian, se esconden mordidas, hay un plazo). Es un «universo» compartido entre episodios.
- El narrador habla **a ti**; los demás personajes hablan en frases citadas muy cortas.

## 2. Edición y cámara ✅

Medido en **todos los cuadros** con `herramientas/medir_referencia.py` (máscara sobre subtítulos, rótulo y marca de agua).

| Medida | Video 1 | 2 | 3 | 4 | 5 | 6 | Conclusión |
|---|---|---|---|---|---|---|---|
| Cortes duros | 43 | 33 | 35 | 40 | 28 | 29 | **≈ 30–40 por video** |
| Planos | 44 | 34 | 36 | 41 | 29 | 30 | |
| Duración mediana del plano | 1.58 s | 2.05 | 2.10 | 1.57 | 2.27 | 1.70 | **≈ 1.8 s** (p10 0.9 s · p90 3.9 s, los 214 planos) |
| Cuadros con la cámara en movimiento | 53 % | 46 % | 61 % | 68 % | 53 % | 55 % | **≈ 55 %** |
| Cuadros con zoom | 38 % | 34 % | 41 % | 54 % | 41 % | 41 % | Zoom típico **≈ 0.1 % por cuadro** (lento) |
| Transiciones compuestas | 11 | 3 | 6 | 7 | 1 | 0 | Corte a negro + fundido, o plano relámpago de 1 cuadro |

- **Tipos de plano** (214 en total): acercamiento lento 92 · alejamiento lento 52 · casi fijo 61 · paneo 9.
  La cámara **casi siempre se acerca o se aleja despacio**; el paneo es raro.
- **Se corta mucho**: aproximadamente **un plano por frase**. Esto es lo contrario de la biblia del tutorial
  (0–1 cortes): para este formato de suspenso, **manda esta guía**.
- 👁 Al cambiar de lugar o de momento a veces hay **corte a negro de 1 cuadro + fundido de entrada** (2–3 cuadros).
- 👁 Hay «planos relámpago» de 1 cuadro entre dos planos (videos 2, 3 y 4).
- 👁 Muchos planos son **insertos de objetos o manos** (celular, pastel, brazo vendado, llave en el cuello,
  linterna, candado, escopeta, cadena de la puerta, tarjeta, grifo). Aproximadamente 1 de cada 4–5 planos.
- 👁 **Planos de espaldas** (nuca del personaje en primer término mirando hacia algo) para mostrar lo que ve.
- 👁 Patrón frecuente: plano general → plano medio del personaje que habla → inserto del objeto → reacción en primer plano.

## 3. Textos en pantalla 👁 ✅

- **Rótulo de inicio** (arriba a la izquierda, letra monoespaciada pequeña, caja oscura con borde rojo, efecto
  máquina de escribir): `DÍA 1 · 10:22 PM · HOTEL · HAB. 404`. Formato fijo: **día · hora · lugar**.
- **Títulos de regla** arriba al centro: `REGLA Nº 1` en blanco grueso con sombra. **Se quedan en pantalla en
  todos los planos** que explican esa regla (varios cortes seguidos).
- **Indicadores de tiempo** con el mismo estilo: `HACE 3 MESES`, `+1 HORA`, `02:00`, `12:00 AM`, una cifra («200»).
- **Subtítulos** ✅: centrados a ~79 % de la altura, 2–4 palabras por bloque, blanco grueso con contorno oscuro.
  La **palabra que se está diciendo se pone amarilla** (karaoke): 190–204 cambios de resaltado por video, **uno por
  palabra**, y llegan **1.4–1.8 cuadros antes** que la palabra en la voz (72–81 % dentro de ±3 cuadros).
- **Botones finales**: dos pastillas arriba, **roja** (opción 1) y **azul** (opción 2), unidas por un punto; texto en
  mayúsculas de 1–3 palabras. Aparecen en el último plano, mientras se dice la pregunta: primero la roja y
  ~4 cuadros después la azul, cada una con un pequeño rebote de escala (video 1).

## 4. Imagen

### Color ✅
| | Video 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Brillo medio (0–1) | 0.18 | 0.27 | 0.18 | 0.14 | 0.23 | 0.12 |
| Negros (p5 medio) | 0.03 | 0.03 | 0.03 | 0.01 | 0.07 | 0.01 |
| Saturación media | 0.38 | 0.42 | 0.45 | 0.53 | 0.59 | 0.43 |
| Tono dominante | azul (197°) con pantallas rojas | rosa-magenta (273°) | azul-verdoso (186°) | azul-verdoso (193°) | naranja (60°) | ámbar (68°) |

- **Muy oscuros** (brillo 0.12–0.27, la mitad que la referencia del tutorial) con **negros profundos**, pero
  **colores saturados** en las zonas iluminadas.
- **Un color dominante por historia**: fiesta = rosa; noche/búnker/refugio = azul-verdoso; rancho al atardecer =
  naranja; hotel = ámbar de lámpara.

### Luz y sombras 👁
- Luces **prácticas** dentro de la escena (lámparas, faroles, linternas, luna, sol bajo) con **halo difuso**; fuera de
  esos charcos de luz, oscuridad.
- **Viñeta fuerte** en todos los planos.
- Los personajes **reciben la luz de la escena** (más oscuros de noche, iluminados del lado de la lámpara) y tienen
  **sombra de contacto** bajo los pies.
- **Profundidad de campo**: fondos desenfocados con luces en bokeh en planos medios y primeros planos.
- Efectos planos 2D metidos en la escena: ondas de un teléfono que suena, brillo de una linterna morada, vaho, lágrimas.

### Escenarios 👁
- Lugares **cotidianos latinoamericanos**: salón de fiestas con globos y pastel, calle de barrio con papel picado,
  búnker con latas y estantes, escuela-refugio con pizarrón, rancho con tranquera y nopales, habitación de hotel.
- Detalle abundante en el fondo (letreros legibles, carteles, objetos) que **cuenta la historia sin la voz**.
- ⚠️ No se pudo confirmar si los fondos son 3D reales o capas 2D con paralaje: hay desenfoque y cambios de
  perspectiva en los acercamientos, compatible con ambos.

### Personajes 👁 (medido a mano en 5 cuadros de cuerpo entero)
- **Cabeza redonda grande: 41–46 % de la altura total** (≈ 2.2–2.5 cabezas de alto). Torso ≈ 30 %, piernas de
  palito ≈ 22–27 %. ⚠️ Corregido tras el estudio detallado (ver «Acabado de personajes»): el torso es
  **rectangular**, no de cápsula, y brazos y piernas son líneas finas.
- **Ojos**: círculos blancos grandes con pupila negra pequeña; las pupilas se mueven. Cejas de trazo grueso que
  cambian la expresión. Sin nariz o con nariz mínima.
- **Bocas**: línea, «o» abierta, dientes apretados en zigzag (miedo), boca grande de grito.
- **Contorno oscuro grueso** en todo el personaje; colores planos con un poco de sombreado.
- **Brazos y piernas de palito**, manos redondas, pies pequeños oscuros.
- **Ropa**: un color plano y 1–2 detalles que identifican (corona y vestido, bigote y corbata, gorra y lentes,
  sombrero y camisa a cuadros, chaleco, mochila, bufanda). Tonos de piel variados.
- **Monstruos** (mordidos): misma base, pero piel grisácea, ojos rojos, dientes afilados y pelo enmarañado.

### Acabado de personajes y escenarios — estudio detallado (video 4 y video 6)

Comparado a resolución completa (576×1024) en cuadros nítidos: video 4 cuadros 300, 650, 760, 925 y 1900;
video 6 cuadros 590, 780 y 960. 👁 = observado en esos cuadros · 📏 = medido con píxeles · ≈ = estimado.

**Proporciones** (📏 a mano en 2 cuerpos enteros nítidos, cuadros 650 y 760 del video 4; ≈ ±10 %)
- Altura total ≈ **2.5–2.6 diámetros de cabeza (D)**: pelo ≈ 0.1 D sobre la cabeza · cabeza 1 D · torso ≈ 0.85 D ·
  piernas ≈ 0.65 D. La cabeza con pelo es ≈ 40–44 % de la altura.
- **Torso rectangular**, esquinas casi rectas, lados rectos o apenas abiertos hacia abajo; ancho ≈ **0.65–0.8 D**
  (más angosto en el adulto del video 6). No es una cápsula ni un óvalo.
- **Piernas y brazos de línea fina** (≈ el grosor del contorno); **manos pequeñas y redondas** (≈ 0.1 D de diámetro);
  **pies diminutos** oscuros. Brazos colgando junto al torso; cuando se mueven, se doblan en el codo.

**Trazo y acabado** 👁
- Contorno casi negro alrededor de cabeza, pelo, torso y manos; 📏 ≈ 2.5–4 % del ancho de la cabeza en un primer
  plano (cuadro 925). Los ojos llevan un aro negro más grueso que el resto de los trazos.
- El **pelo** es una masa oscura con picos irregulares y algunos mechones sueltos; tapa la parte alta de la cabeza.
- **Degradados suaves**, no colores planos: la cara es más clara del lado de la luz y se oscurece hacia el borde
  contrario; la ropa se oscurece hacia abajo; hay una franja de sombra bajo la barbilla. Pieles pálidas
  y algo apagadas de noche.
- Detalle de ropa con líneas finas: solapas, cierres, botones, tirantes de mochila, pañuelo.

**Luz sobre los personajes** 👁
- Toman el color de la luz del lugar (cálidos junto a una lámpara, fríos y apagados de noche) pero **la cara siempre
  se lee**. Sombra de contacto oscura bajo los pies y, junto a una lámpara, **sombra alargada en el suelo** (video 6, cuadro 590).

**Hotel** 👁 (video 6)
- Pasillo: **papel tapiz verde con dibujo tenue**, zócalo de madera oscura, moldura en el techo, **apliques de dos focos
  con pantallita**, puertas de madera con **placa de latón con el número**, manija de palanca y mirilla, alfombra rojo
  oscuro, carrito de limpieza. Habitación: lámpara de buró con pantalla, buró de cajones, sillón amarillo, termostato.

**Color de los cuadros estudiados** 📏 (mismo método que §4)
| Cuadro | Brillo | Saturación |
|---|---|---|
| Video 4 · 760 (refugio, cuerpos enteros) | 0.19 | 0.47 |
| Video 4 · 925 (primer plano) | 0.22 | 0.43 |
| Video 6 · 590 (habitación del hotel) | 0.22 | 0.52 |

### Movimiento de personajes 👁 (revisado en cuadros consecutivos de cada plano)
- **Parpadeo** de 2–3 cuadros; ojos que miran de un lado a otro.
- **Boca que habla** solo en el personaje que tiene el diálogo.
- **Balanceo** leve en pie, temblor de miedo.
- **Caminar y correr** con rebote (alguien entra corriendo y gritando; la camarera empuja su carrito).
- **Acciones con objetos**: subir una escalera, llevarse el teléfono a la oreja, poner la cadena, cargar una escopeta,
  bajarse la manga para tapar la mordida, una mano que sale de la oscuridad.
- **Giro de cabeza** de un personaje plano rotando como una tarjeta en 3D (el monstruo del video 4).
- **Lágrimas** que caen y sudor.

### Multitudes 👁
- Grupos **en filas detrás del personaje principal**: 20–40 figuras pequeñas, desenfocadas y más oscuras (invitados,
  gente del refugio). Nunca miles como en Alejandro. ⚠️ No se contaron con herramienta.

## 5. Voz y sonido ✅

| Medida | Video 1 | 2 | 3 | 4 | 5 | 6 | Conclusión |
|---|---|---|---|---|---|---|---|
| Voz empieza en | 0.00 s | 0.00 | 0.54 | 0.00 | 0.00 | 0.00 | **desde el cuadro 0** |
| Palabras | 199 | 196 | 204 | 194 | 196 | 191 | **≈ 196** |
| Palabras por segundo | 2.66 | 2.67 | 2.63 | 2.63 | 2.60 | 2.58 | **≈ 2.6** (más lento que el tutorial: 3.2–3.8) |
| Pausas de más de 0.3 s | 27 | 30 | 29 | 28 | 30 | 24 | una por frase |
| Pausa mediana | 0.44 s | 0.46 | 0.46 | 0.42 | 0.40 | 0.44 | **≈ 0.45 s** |
| Silencio total | 11.7 s | 14.9 | 13.5 | 12.0 | 13.4 | 11.4 | ≈ 17 % del tiempo |
| Volumen integrado | −14.6 LUFS | −13.8 | −14.4 | −14.4 | −14.4 | −15.2 | **−14 LUFS** |
| Rango dinámico (LRA) | 2.3 LU | 2.4 | 2.3 | 3.1 | 2.0 | 2.3 | **muy comprimido** |
| Fondo en las pausas | −5.3 dB | −7.0 | −5.7 | −5.8 | −3.9 | −7.2 | música/ambiente **continuo**, solo 4–7 dB bajo la voz |

- **Un narrador** con voz grave, pausado y con pausas dramáticas cortas: más «contar un secreto» que «dato rápido».
- ⚠️ No se pudo escuchar: el tipo de música, los efectos y si los diálogos usan otra voz siguen **pendientes**
  (solo hay medidas de volumen).

## 6. Qué se comprobó y qué falta

**Comprobado**
- Acceso a los seis videos completos y a su audio; decodificados sin errores.
- **Transcripción completa con tiempos por palabra** (Whisper `medium`, español). Calidad alta: 0–4 palabras dudosas
  por video (p. ej. confundió «vals» con «bal»). Las transcripciones **no se suben a GitHub** (son el guion de otro
  creador): quedan en `referencias_privadas/` (ignorada por git) y se pierden al cerrar este entorno en la nube.
- Distinción subtítulo/voz: los subtítulos en pantalla se usaron solo para medir la sincronía; **el texto de las
  historias sale del audio transcrito**, no de leer los subtítulos.
- Medición de **todos los cuadros** (cámara, cortes, brillo, contraste, saturación) y revisión de **12 cuadros
  consecutivos del centro de cada uno de los 214 planos**.
- Sincronía subtítulo-voz, ritmo de la voz y volumen.

**Pendiente o con dudas**
- ⚠️ Música y efectos de sonido: no se pueden escuchar; solo se midió su volumen.
- ⚠️ Las medidas de **giro** de cámara en escenas muy oscuras no son fiables (pocos puntos de referencia); por eso no
  se usan. Algunas sumas de zoom por plano salen exageradas por el mismo motivo; se usa la mediana.
- ⚠️ Las proporciones de los personajes se midieron a mano en 5 cuadros; las multitudes no se contaron.
- ⚠️ 3D real o capas 2D en los fondos: no confirmado.
- ⚠️ La máscara de la marca de agua es aproximada (la marca cambia de lugar).
- El video 1 se agregó después que los otros cinco, con las mismas herramientas y criterios.

## 7. Qué cambia para nuestras animaciones (frente a la base del tutorial)

| Tema | Tutorial (Alejandro / puente) | Suspenso (esta guía) |
|---|---|---|
| Cortes | 0–1 por video, deslizamientos largos | **≈ 1 plano por frase, ~1.8 s**, con acercamientos lentos dentro de cada plano |
| Subtítulos | No | **Sí, karaoke con palabra amarilla**, 2–4 palabras, a ~79 % de la altura |
| Voz | 3.2–3.8 palabras/s, casi sin pausas | **≈ 2.6 palabras/s, pausas de ~0.45 s** entre frases |
| Color | Brillo 0.43–0.54, día y atardecer | **Brillo 0.12–0.27**, negros profundos, un color dominante por historia |
| Textos | Cifra discreta arriba | Rótulo «DÍA · hora · lugar», `REGLA Nº N` fijo durante la regla, botones finales rojo/azul |
| Personajes | Cabeza de frijol, 3.5 cabezas de alto | **Cabeza redonda, 2.2–2.5 cabezas de alto**, ojos grandes, palitos |
| Se mantiene | Personajes 2D con contorno en mundo 3D, luz de escena sobre los personajes, sombra de contacto, desenfoque de fondo, voz desde el cuadro 0, −14 LUFS, el video termina con la última palabra |

## Herramientas y archivos
- `herramientas/medir_referencia.py` — mide todos los cuadros (cámara, cortes, transiciones, color, tiras por plano).
- `herramientas/medir_sincronia.py` — sincronía de la palabra amarilla con la voz.
- `herramientas/transcribir.py` — transcripción con tiempos por palabra (necesita acceso a huggingface.co).
- `referencias/medidas/` — resultados numéricos por video (`videoN_camara_y_color.json`, `voz_y_sincronia.json`).
