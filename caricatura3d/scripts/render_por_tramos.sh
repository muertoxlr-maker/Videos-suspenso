#!/usr/bin/env bash
# Render de una composición larga por tramos, para poder continuar si el entorno se reinicia.
# Uso: bash scripts/render_por_tramos.sh <Composición> <cuadros_totales> <carpeta_salida> [tamaño_tramo]
set -euo pipefail
ID=$1; TOTAL=$2; OUT=$3; PASO=${4:-250}
mkdir -p "$OUT/tramos"
for ((a=0; a<TOTAL; a+=PASO)); do
  b=$(( a + PASO - 1 )); (( b >= TOTAL )) && b=$(( TOTAL - 1 ))
  f=$(printf "%s/tramos/t_%04d.mp4" "$OUT" "$a")
  esperado=$(( b - a + 1 ))
  if [[ -f "$f" ]] && [[ "$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$f" 2>/dev/null | tr -d ",[:space:]")" == "$esperado" ]]; then
    echo "tramo $a-$b ya hecho"; continue
  fi
  echo "tramo $a-$b: renderizando…"
  npx remotion render "$ID" "$f.tmp.mp4" --codec=h264 --crf=18 --muted --concurrency=4 --frames=$a-$b --log=error
  mv "$f.tmp.mp4" "$f"
  echo "tramo $a-$b listo"
done
ls "$OUT"/tramos/t_*.mp4 | sed "s/^/file '/; s/$/'/" | sed "s|file '$OUT/tramos/|file '|" > "$OUT/tramos/lista.txt"
ffmpeg -v error -y -f concat -safe 0 -i "$OUT/tramos/lista.txt" -c copy "$OUT/video_mudo.mp4"
echo "TODO LISTO: $OUT/video_mudo.mp4"
