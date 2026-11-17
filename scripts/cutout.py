from PIL import Image, ImageDraw, ImageFilter
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
PLANT_DIRS = [
    ROOT / "assets/plants/shared",
    ROOT / "assets/plants/strawberry",
]


def background_color(img):
    w, h = img.size
    samples = []
    step = max(1, w // 24)
    for x in range(0, w, step):
        samples.append(img.getpixel((x, 2)))
        samples.append(img.getpixel((x, h - 3)))
    for y in range(0, h, step):
        samples.append(img.getpixel((2, y)))
        samples.append(img.getpixel((w - 3, y)))
    samples.sort(key=lambda p: p[0] + p[1] + p[2])
    mid = samples[len(samples) // 2]
    return mid


def cutout(path: Path, tolerance: int = 26, feather: int = 2) -> Image.Image:
    img = Image.open(path).convert("RGB")
    bg = background_color(img)

    marker = (255, 0, 255)
    work = img.copy()
    w, h = work.size

    seeds = []
    step = max(8, w // 40)
    for x in range(0, w, step):
        seeds.append((x, 0))
        seeds.append((x, h - 1))
    for y in range(0, h, step):
        seeds.append((0, y))
        seeds.append((w - 1, y))

    for seed in seeds:
        pixel = work.getpixel(seed)
        if sum(abs(a - b) for a, b in zip(pixel, bg)) <= tolerance * 3:
            try:
                ImageDraw.floodfill(work, seed, marker, thresh=tolerance)
            except Exception:
                pass

    alpha = Image.new("L", (w, h), 255)
    pixels = work.load()
    alpha_pixels = alpha.load()
    for y in range(h):
        for x in range(w):
            if pixels[x, y] == marker:
                alpha_pixels[x, y] = 0

    if feather:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    out = img.convert("RGBA")
    out.putalpha(alpha)

    bbox = alpha.point(lambda v: 255 if v > 24 else 0).getbbox()
    if bbox:
        pad = 6
        bbox = (
            max(0, bbox[0] - pad),
            max(0, bbox[1] - pad),
            min(w, bbox[2] + pad),
            min(h, bbox[3] + pad),
        )
        out = out.crop(bbox)
    return out


def main():
    targets = []
    for folder in PLANT_DIRS:
        if folder.exists():
            targets.extend(sorted(folder.glob("*.jpg")))

    if not targets:
        print("no jpg found")
        return 1

    for path in targets:
        try:
            result = cutout(path)
            max_side = 1000
            if max(result.size) > max_side:
                ratio = max_side / max(result.size)
                result = result.resize(
                    (max(1, int(result.width * ratio)), max(1, int(result.height * ratio))),
                    Image.LANCZOS,
                )
            out_path = path.with_suffix(".png")
            result.save(out_path, optimize=True)
            print(f"{path.name} -> {out_path.name} {result.size}")
        except Exception as exc:
            print(f"FAILED {path.name}: {exc}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
