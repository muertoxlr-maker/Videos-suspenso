#!/usr/bin/env bash
# Renderiza solo algunos rangos de cuadros (en tramos de 250, se puede continuar si se corta).
# Uso: bash scripts/render_rangos.sh <Composición> <carpeta_salida> A-B [C-D ...]   (B y D exclusivos)
set -euo pipefail
ID=$1; OUT=$2; shift 2
mkdir -p "$OUT"
for r in "$@"; do
  A=${r%-*}; B=${r#*-}
  for ((a=A; a<B; a+=250)); do
    b=$(( a + 249 )); (( b >= B )) && b=$(( B - 1 ))
    f=$(printf "%s/t_%04d.mp4" "$OUT" "$a"); esperado=$(( b - a + 1 ))
    if [[ -f "$f" ]] && [[ "$(ffprobe -v error -count_packets -select_streams v:0 -show_entries stream=nb_read_packets -of csv=p=0 "$f" | tr -d ',[:space:]')" == "$esperado" ]]; then echo "tramo $a-$b ya hecho"; continue; fi
    echo "tramo $a-$b: renderizando…"
    npx remotion render "$ID" "$f.tmp.mp4" --codec=h264 --crf=18 --muted --concurrency=4 --frames=$a-$b --log=error
    mv "$f.tmp.mp4" "$f"; echo "tramo $a-$b listo"
  done
done
echo "RANGOS LISTOS"
