"""去掉植株图里残留的纸底空洞（被叶片包围、第一次洪泛填充漏掉的区域）。"""
from PIL import Image
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROTECT = {
    "strawberry/stage-06",
    "strawberry/stage-07",
    "apple/stage-07",
    "guava/stage-07",
    "shared/tree-buds",
}
MIN_SIZE = 150


def is_paper(p):
    r, g, b, a = p
    if a < 200:
        return False
    return min(r, g, b) >= 208 and r >= g >= b and (r - b) <= 34 and (r - g) <= 10


def clean(path: Path) -> int:
    im = Image.open(path).convert("RGBA")
    w, h = im.size
    px = im.load()
    mask = [[is_paper(px[x, y]) for x in range(w)] for y in range(h)]
    seen = [[False] * w for _ in range(h)]
    removed = 0

    for y in range(h):
        for x in range(w):
            if not mask[y][x] or seen[y][x]:
                continue
            stack = [(x, y)]
            seen[y][x] = True
            comp = []
            while stack:
                cx, cy = stack.pop()
                comp.append((cx, cy))
                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if 0 <= nx < w and 0 <= ny < h and mask[ny][nx] and not seen[ny][nx]:
                        seen[ny][nx] = True
                        stack.append((nx, ny))
            if len(comp) >= MIN_SIZE:
                for cx, cy in comp:
                    px[cx, cy] = (0, 0, 0, 0)
                removed += len(comp)

    if removed:
        im.save(path, "WEBP", quality=88, method=6)
    return removed


def main():
    for path in sorted((ROOT / "assets/plants").rglob("*.webp")):
        key = str(path).replace(str(ROOT / "assets/plants/"), "").replace(".webp", "")
        if key in PROTECT or key == "shared/seed":
            continue
        print(f"{key}: removed {clean(path)} px")


if __name__ == "__main__":
    main()
