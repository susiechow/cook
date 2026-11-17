from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
TARGETS = [
    ROOT / "assets/plants/shared",
    ROOT / "assets/plants/strawberry",
    ROOT / "assets/plants/apple",
    ROOT / "assets/plants/guava",
]
MAX_SIDE = 760


def bg_color(img):
    w, h = img.size
    pts = []
    step = max(1, w // 32)
    for x in range(0, w, step):
        pts.append(img.getpixel((x, 1)))
        pts.append(img.getpixel((x, h - 2)))
    for y in range(0, h, step):
        pts.append(img.getpixel((1, y)))
        pts.append(img.getpixel((w - 2, y)))
    pts.sort(key=lambda p: sum(p))
    return pts[len(pts) // 2]


def flood_alpha(img, bg, tol):
    work = img.copy()
    w, h = work.size
    marker = (255, 0, 255)
    step = max(6, w // 60)
    seeds = []
    for x in range(0, w, step):
        seeds += [(x, 0), (x, h - 1)]
    for y in range(0, h, step):
        seeds += [(0, y), (w - 1, y)]

    for sx, sy in seeds:
        if sum(abs(a - b) for a, b in zip(work.getpixel((sx, sy)), bg)) <= tol * 3:
            try:
                ImageDraw.floodfill(work, (sx, sy), marker, thresh=tol)
            except Exception:
                pass

    alpha = Image.new("L", (w, h), 255)
    wp = work.load()
    ap = alpha.load()
    for y in range(h):
        for x in range(w):
            if wp[x, y] == marker:
                ap[x, y] = 0
    return alpha


def coverage(alpha):
    hist = alpha.histogram()
    total = alpha.width * alpha.height
    return hist[0] / total


def cutout(path):
    img = Image.open(path).convert("RGB")
    if max(img.size) > 1200:
        r = 1200 / max(img.size)
        img = img.resize((int(img.width * r), int(img.height * r)), Image.LANCZOS)

    bg = bg_color(img)
    alpha = flood_alpha(img, bg, 58)
    cov = coverage(alpha)
    alpha = alpha.filter(ImageFilter.GaussianBlur(1))
    out = img.convert("RGBA")
    out.putalpha(alpha)

    solid = alpha.point(lambda v: 255 if v > 190 else 0)
    box = solid.getbbox()
    if box:
        pad = 8
        box = (max(0, box[0] - pad), max(0, box[1] - pad), min(out.width, box[2] + pad), min(out.height, box[3] + pad))
        out = out.crop(box)

    if max(out.size) > MAX_SIDE:
        r = MAX_SIDE / max(out.size)
        out = out.resize((int(out.width * r), int(out.height * r)), Image.LANCZOS)
    return out, 58, cov


def main():
    for folder in TARGETS:
        for jpg in sorted(folder.glob("*.jpg")):
            try:
                out, tol, cov = cutout(jpg)
                dest = jpg.with_suffix(".webp")
                out.save(dest, "WEBP", quality=86, method=5)
                print(f"{jpg.name}: tol={tol} bg={cov:.0%} -> {dest.name} {out.size} {dest.stat().st_size // 1024}KB")
            except Exception as exc:
                print(f"FAILED {jpg.name}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
