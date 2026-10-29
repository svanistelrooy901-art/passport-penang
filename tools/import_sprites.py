"""Import painted station sprites (ImageGen, 1254px transparent PNG) into the game.

    python3 tools/import_sprites.py <folder with <id>.png> [ids...]

Cleans stray alpha specks and colour fringes, crops, resizes to the 270px UI width, writes colour +
pencil-sketch WebP to public/zones/george-town/sprites and the find-game hotspots from
tools/sprite_hotspots.json (coordinates in the original 1254px image) into content/stations.
"""
import json, os, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sprite_post import pencil  # same pencil filter as the original sketches

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SPR = f'{ROOT}/public/zones/george-town/sprites'
HS = json.load(open(f'{ROOT}/tools/sprite_hotspots.json'))
src = sys.argv[1]; ids = sys.argv[2:] or list(HS['SP'])
for sid in ids:
    a = np.asarray(Image.open(f'{src}/{sid}.png').convert('RGBA')).astype(np.float32)
    al = a[..., 3]; m = al > 110
    lab, k = ndi.label(m); sz = ndi.sum(m, lab, range(1, k + 1)); keep = np.isin(lab, 1 + np.nonzero(sz > sz.max() * .004)[0])
    core = ndi.binary_erosion(keep, iterations=2); allow = ndi.binary_dilation(core, iterations=1)
    al2 = np.where(allow, al, 0); al2 = np.where(core, np.maximum(al2, 250), al2)
    idx = ndi.distance_transform_edt(~core, return_distances=False, return_indices=True)
    rgb = a[..., :3].copy(); edge = allow & ~core; rgb[edge] = a[idx[0], idx[1], :3][edge]
    im = Image.fromarray(np.dstack([rgb, al2]).clip(0, 255).astype(np.uint8))
    x0, y0 = HS['OFF'][sid]; bb = im.getbbox()
    im = im.crop((x0, y0, min(im.width, bb[2] + 12), min(im.height, bb[3] + 12)))
    kx = 270 / im.width; small = im.resize((270, round(im.height * kx)), Image.LANCZOS)
    small.save(f'{SPR}/{sid}.webp', quality=88, method=6)
    pencil(small, small.split()[-1]).save(f'{SPR}/{sid}-sketch.webp', quality=86, method=6)
    path = f'{ROOT}/content/stations/{sid}.json'; st = json.load(open(path))
    for g in st['games']:
        if g['type'] == 'find':
            for t in g['targets']: t['pts'] = [[round((x - x0) * kx), round((y - y0) * kx), r] for x, y, r in HS['SP'][sid][t['spot']]]
    json.dump(st, open(path, 'w'), ensure_ascii=False, indent=1)
    print(sid, small.size)
