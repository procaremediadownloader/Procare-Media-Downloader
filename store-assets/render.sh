#!/bin/sh
# Re-render the Chrome Web Store screenshots at the required 1280x800.
#
# Usage: store-assets/render.sh
#
# The two HTML files hold the real popup markup and a verbatim copy of
# popup.css with staged sample data. If popup.html or popup.css changes in a
# way a parent would see, update the HTML here to match, then re-render —
# store screenshots must show the shipping UI.
#
# Never stage these with real child names, faces, or account data.

set -eu

here=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
chrome="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

if [ ! -x "$chrome" ]; then
  echo "render.sh: Google Chrome not found at $chrome" >&2
  exit 1
fi

tmp=$(mktemp -d)
# Chrome writes the PNG and then lingers instead of exiting, so each render is
# backgrounded and we wait on the output files rather than on process exit.
# Chrome keeps writing to its profile for a moment after the signal, so give it
# time before removing the directory and never let cleanup fail the run.
cleanup() {
  pkill -f "user-data-dir=$tmp" 2>/dev/null || true
  sleep 1
  rm -rf "$tmp" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

shots="shot-1-setup shot-2-progress"

for f in $shots; do
  rm -f "$here/$f.png"
  "$chrome" --headless=new --disable-gpu --hide-scrollbars --no-sandbox \
    --force-device-scale-factor=1 --window-size=1280,800 \
    --user-data-dir="$tmp/$f" \
    --screenshot="$here/$f.png" "file://$here/$f.html" >/dev/null 2>&1 &
done

i=0
while [ "$i" -lt 40 ]; do
  done_all=1
  for f in $shots; do
    [ -s "$here/$f.png" ] || done_all=0
  done
  [ "$done_all" -eq 1 ] && break
  sleep 2
  i=$((i + 1))
done

for f in $shots; do
  if [ ! -s "$here/$f.png" ]; then
    echo "render.sh: $f.png was not produced" >&2
    exit 1
  fi
  python3 - "$here/$f.png" <<'PY'
import sys, struct
path = sys.argv[1]
with open(path, 'rb') as fh:
    head = fh.read(24)
w, h = struct.unpack('>II', head[16:24])
if (w, h) != (1280, 800):
    sys.exit(f"{path} is {w}x{h}, expected 1280x800")
print(f"{path.split('/')[-1]}: {w}x{h} OK")
PY
done
