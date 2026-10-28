"""Post-process rendered station sprites: crop to content, resize to the UI width, write colour + pencil
sketch WebP into public/zones/george-town/sprites, and write find-game hotspots into content/stations."""
import json, os, sys
import numpy as np
from PIL import Image, ImageFilter, ImageOps

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC, ids = sys.argv[1], sys.argv[2:]
SPR = f'{ROOT}/public/zones/george-town/sprites'
WIDTH = 270
spots = json.load(open(f'{SRC}/spots.json'))


def pencil(rgb_img, keep_alpha=None, strength=1.4):  # same filter as the original zone sketches
    g = ImageOps.grayscale(rgb_img.convert('RGB'))
    inv = ImageOps.invert(g).filter(ImageFilter.GaussianBlur(2.2))
    ga = np.asarray(g).astype(np.float32); ia = np.asarray(inv).astype(np.float32)
    dodge = np.clip(ga * 255 / (255 - ia + 1), 0, 255)
    dodge = np.clip(255 - (255 - dodge) * strength, 0, 255)
    paper = np.stack([dodge * .985, dodge * .955, dodge * .88], -1)
    paper = paper * .82 + np.stack([ga * 1.0, ga * .97, ga * .9], -1) * .18
    out = Image.fromarray(np.clip(paper, 0, 255).astype(np.uint8))
    if keep_alpha is not None:
        out = out.convert('RGBA'); out.putalpha(keep_alpha)
    return out


for sid in ids:
    im = Image.open(f'{SRC}/{sid}.png').convert('RGBA')
    x0, y0, x1, y1 = im.getbbox(); pad = 8
    x0, y0, x1, y1 = max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad)
    im = im.crop((x0, y0, x1, y1)); k = WIDTH / im.width
    small = im.resize((WIDTH, round(im.height * k)), Image.LANCZOS)
    small.save(f'{SPR}/{sid}.webp', quality=90, method=6)
    pencil(small, small.split()[-1]).save(f'{SPR}/{sid}-sketch.webp', quality=88, method=6)
    path = f'{ROOT}/content/stations/{sid}.json'; st = json.load(open(path))
    for g in st['games']:
        if g['type'] != 'find': continue
        for t in g['targets']:
            t['pts'] = [[round((x - x0) * k), round((y - y0) * k), int(r)] for x, y, r in spots[sid][t['spot']]]
    json.dump(st, open(path, 'w'), ensure_ascii=False, indent=1)
    print(sid, small.size)
