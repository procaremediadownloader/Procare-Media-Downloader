#!/usr/bin/env python3
"""Audit a completed download run.

Usage:
    tools/check-downloads.py [path]

Defaults to "~/Downloads/Procare Family Media".

The failure this exists to catch is silent: the extension picks a media URL by
scoring key names in Procare's JSON (see scoreMediaCandidate in shared.js), so if
the payload shape differs from what was assumed it can download the thumbnail
instead of the original and report complete success. Small pixel dimensions are
the only tell.

Reports nothing about image content and prints no child names beyond the folder
names already on disk.
"""

import hashlib
import statistics
import sys
from collections import defaultdict
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    sys.exit("Pillow is required: python3 -m pip install pillow")

# Procare photos are camera-resolution originals. Anything smaller on its long
# edge is almost certainly a thumbnail or preview rather than the real file.
THUMBNAIL_LONG_EDGE = 640

IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".heic", ".heif"}
VIDEO_SUFFIXES = {".mp4", ".mov", ".m4v", ".webm", ".3gp", ".3gpp"}


def human(size):
    for unit in ("B", "KB", "MB", "GB"):
        if size < 1024 or unit == "GB":
            return f"{size:.0f} {unit}" if unit == "B" else f"{size:.1f} {unit}"
        size /= 1024


def main():
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "~/Downloads/Procare Family Media")
    root = root.expanduser()

    if not root.is_dir():
        sys.exit(f"Not found: {root}\nNothing has been downloaded there yet.")

    images, videos, others, empties = [], [], [], []
    for path in sorted(p for p in root.rglob("*") if p.is_file()):
        if path.name.startswith("."):
            continue
        if path.stat().st_size == 0:
            empties.append(path)
            continue
        suffix = path.suffix.lower()
        (images if suffix in IMAGE_SUFFIXES
         else videos if suffix in VIDEO_SUFFIXES
         else others).append(path)

    print(f"Root: {root}")
    print(f"{len(images)} images, {len(videos)} videos"
          + (f", {len(others)} other" if others else "")
          + (f", {len(empties)} EMPTY" if empties else ""))

    # Folder layout should be <child>/<YYYY-MM>/, one level each.
    by_folder = defaultdict(int)
    for path in images + videos:
        by_folder[path.parent.relative_to(root)] += 1
    print(f"\nFolders ({len(by_folder)}):")
    for folder in sorted(by_folder, key=str):
        print(f"  {str(folder):40} {by_folder[folder]:>4} files")

    if images:
        dims, thumbs, unreadable = [], [], []
        for path in images:
            try:
                with Image.open(path) as im:
                    w, h = im.size
            except Exception as exc:                       # noqa: BLE001
                unreadable.append((path, exc))
                continue
            long_edge = max(w, h)
            dims.append(long_edge)
            if long_edge < THUMBNAIL_LONG_EDGE:
                thumbs.append((path, w, h))

        if dims:
            print("\nImage long edge, in pixels:")
            print(f"  smallest {min(dims)}   median {int(statistics.median(dims))}   largest {max(dims)}")
            sizes = [p.stat().st_size for p in images]
            print(f"  file size: smallest {human(min(sizes))}   median {human(statistics.median(sizes))}"
                  f"   total {human(sum(sizes))}")

        if unreadable:
            print(f"\n!! {len(unreadable)} image(s) could not be opened — possibly truncated:")
            for path, exc in unreadable[:10]:
                print(f"   {path.relative_to(root)}  ({exc})")

        if thumbs:
            print(f"\n!! THUMBNAILS: {len(thumbs)} of {len(images)} images are under "
                  f"{THUMBNAIL_LONG_EDGE}px on the long edge.")
            print("   The wrong media URL is being chosen. Do not ship this to parents;")
            print("   scoreMediaCandidate in shared.js needs the real payload shape.")
            for path, w, h in thumbs[:10]:
                print(f"   {w}x{h}  {path.relative_to(root)}")
        elif dims:
            print("\nOK: every image is full-size. No thumbnails detected.")

    if videos:
        sizes = [p.stat().st_size for p in videos]
        print(f"\nVideos: smallest {human(min(sizes))}   median {human(statistics.median(sizes))}"
              f"   total {human(sum(sizes))}")
        tiny = [p for p in videos if p.stat().st_size < 100 * 1024]
        if tiny:
            print(f"!! {len(tiny)} video(s) under 100 KB — likely a poster image saved as video:")
            for path in tiny[:10]:
                print(f"   {path.relative_to(root)}")

    if empties:
        print(f"\n!! {len(empties)} zero-byte file(s):")
        for path in empties[:10]:
            print(f"   {path.relative_to(root)}")

    # Same photo saved twice under different names means the skip-already-saved
    # history is not doing its job.
    digests = defaultdict(list)
    for path in images + videos:
        digests[hashlib.sha256(path.read_bytes()).hexdigest()].append(path)
    dupes = {d: ps for d, ps in digests.items() if len(ps) > 1}
    if dupes:
        total = sum(len(ps) - 1 for ps in dupes.values())
        print(f"\n!! {total} duplicate file(s) with identical contents — the skip-already-saved "
              "history may not be working:")
        for paths in list(dupes.values())[:5]:
            print("   " + "  ==  ".join(str(p.relative_to(root)) for p in paths[:3]))
    elif images or videos:
        print("OK: no duplicate file contents.")

    # "uniquify" in background.js appends (1), (2)… when a name collides.
    collisions = [p for p in images + videos if "(1)" in p.name or "(2)" in p.name]
    if collisions:
        print(f"\nNote: {len(collisions)} file(s) have Chrome's uniquify suffix, meaning the "
              "generated names collided:")
        for path in collisions[:10]:
            print(f"   {path.relative_to(root)}")


if __name__ == "__main__":
    main()
