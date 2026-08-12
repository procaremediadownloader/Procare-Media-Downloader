#!/bin/sh
# Build a Chrome Web Store upload ZIP from extension/.
#
# Usage: tools/package.sh
#
# The version comes from extension/manifest.json — bump it there, not here.
# Chrome Web Store rejects a re-upload that reuses an existing version number.

set -eu

root=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
cd "$root"

name=procare-media-downloader
version=$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' extension/manifest.json | head -1)

if [ -z "$version" ]; then
  echo "package.sh: could not read version from extension/manifest.json" >&2
  exit 1
fi

zip_path="dist/$name-$version.zip"

if [ -e "$zip_path" ]; then
  echo "package.sh: $zip_path already exists." >&2
  echo "Bump \"version\" in extension/manifest.json, or delete that file to rebuild." >&2
  exit 1
fi

# Tests gate the package. A broken build should never reach a parent.
for t in tests/*.test.js; do
  node "$t"
done

mkdir -p dist

# Junk files fail review or leak local paths, so exclude them explicitly.
# -X drops extended attributes and resource forks that macOS would add.
(cd extension && zip -r -X "../$zip_path" . \
  -x '.*' -x '*/.*' -x '__MACOSX*' -x '*.map' >/dev/null)

echo "Built $zip_path"
echo

# The listing promises no remote code, so prove no third-party host crept in.
foreign=$(unzip -p "$zip_path" '*.js' '*.html' 2>/dev/null \
  | grep -oE 'https?://[A-Za-z0-9.-]+' \
  | sort -u \
  | grep -vE '^https://(schools|api-school)\.procareconnect\.com$' || true)

if [ -n "$foreign" ]; then
  echo "package.sh: warning — non-Procare hosts appear in the bundle:" >&2
  echo "$foreign" >&2
  echo "Review these before upload." >&2
  echo
fi

unzip -l "$zip_path"
echo

( cd dist && shasum -a 256 "$name-$version.zip" >> SHA256SUMS )
echo "Appended checksum to dist/SHA256SUMS"
echo
echo "Next: upload $zip_path at https://chrome.google.com/webstore/devconsole"
echo "Keep visibility Private and add tester emails before submitting."
