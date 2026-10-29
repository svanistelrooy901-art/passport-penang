"""Bake small placeholder zones (Phase 3) so travel can be tested before their real content exists.
Each is an interpretive diorama plot: paths, a few buildings and trees, transport stops. No stations yet.

    python3 tools/bake_placeholder.py
"""
import json, math, os
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
W, H, CELL = 1400, 1200, 10

ZONES = {
    'air-itam': dict(label=('ZON 2', 'ZONE 2'), name=('Air Itam', 'Air Itam'), ground=('#e4d8bc', '#cbbd98'), grass='#a7d07c', seed=11, houses=26, trees=40,
                     exits=[dict(kind='bus', at=[700, 1010], to=['george-town'], label=('Hentian bas Air Itam', 'Air Itam bus stop')),
                            dict(kind='funicular', at=[1060, 420], to=['penang-hill'], label=('Stesen bawah kereta api Bukit Bendera', 'Penang Hill lower station'))],
                     npc=('Kek Lok Si, pasar Air Itam dan Taman Botani akan datang di sini!', 'Kek Lok Si, Air Itam market and the Botanic Gardens are coming here!')),
    'penang-hill': dict(label=('ZON 3', 'ZONE 3'), name=('Bukit Bendera', 'Penang Hill'), ground=('#cfe0a8', '#a9c77d'), grass='#8cc163', seed=12, houses=8, trees=90,
                        exits=[dict(kind='funicular', at=[700, 1010], to=['air-itam'], label=('Stesen atas kereta api Bukit Bendera', 'Penang Hill upper station'))],
                        npc=('Udara di atas bukit lebih sejuk. Mercu tanda bukit akan datang!', 'The air up here is cooler. Hill-top landmarks are coming soon!')),
    'butterworth': dict(label=('ZON 6', 'ZONE 6'), name=('Seberang Perai', 'Seberang Perai'), ground=('#e2dccb', '#c9c0a8'), grass='#a7d07c', seed=13, houses=30, trees=24,
                        exits=[dict(kind='ferry', at=[700, 1010], to=['george-town'], label=('Terminal feri Butterworth', 'Butterworth ferry terminal'))],
                        npc=('Penang Sentral dan stesen di tanah besar akan datang!', 'Penang Sentral and mainland stations are coming soon!')),
}
hexc = lambda h: np.array([int(h.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4)], np.float32)

for zid, z in ZONES.items():
    rng = np.random.default_rng(z['seed']); yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    m = 70; land = (xx > m) & (xx < W - m) & (yy > m) & (yy < H - m)
    # paths: a loop road plus a spine between the stops
    road = np.zeros((H, W), bool)
    road |= (np.abs(xx - 700) < 34) & land
    road |= (np.abs(yy - 600) < 30) & land
    for e in z['exits']: road |= ((xx - e['at'][0]) ** 2 + (yy - e['at'][1]) ** 2 < 110 ** 2) & land
    road |= (((xx - 700) / 520) ** 2 + ((yy - 600) / 420) ** 2 > .86) & (((xx - 700) / 520) ** 2 + ((yy - 600) / 420) ** 2 < 1) & land
    plaza = ((xx - 700) ** 2 + (yy - 600) ** 2 < 120 ** 2) & land
    road |= plaza
    nz = ndi.gaussian_filter(rng.standard_normal((H, W)).astype(np.float32), 18); nz = (nz - nz.min()) / (nz.max() - nz.min())
    g0, g1 = hexc(z['ground'][0]), hexc(z['ground'][1]); grass = hexc(z['grass'])
    img = np.where(road[..., None], g0 + (g1 - g0) * nz[..., None] * .5, grass * (.92 + nz[..., None] * .16))
    tile = (((xx // 22) + (yy // 22)) % 2 == 0) & plaza
    img = np.where(tile[..., None], img * .96, img)
    os.makedirs(f'{ROOT}/public/zones/{zid}', exist_ok=True)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).resize((int(W * .75), int(H * .75)), Image.LANCZOS).save(f'{ROOT}/public/zones/{zid}/ground.webp', quality=82, method=6)
    sea = np.broadcast_to(hexc('#4fb3c4'), (H // 2, W // 2, 3)).copy(); sea *= (.92 + ndi.gaussian_filter(rng.standard_normal((H // 2, W // 2)), 30)[..., None] * 2)
    Image.fromarray(np.clip(sea, 0, 255).astype(np.uint8)).save(f'{ROOT}/public/zones/{zid}/sea.webp', quality=80, method=6)
    # buildings on the grass, away from paths; trees around
    houses, trees, blocked = [], [], road.copy()
    tries = 0
    while len(houses) < z['houses'] and tries < 4000:
        tries += 1; x, y = rng.uniform(120, W - 120), rng.uniform(120, H - 120); w, d = rng.uniform(34, 60), rng.uniform(46, 70)
        x0, x1, y0, y1 = int(x - w / 2 - 12), int(x + w / 2 + 12), int(y - d / 2 - 12), int(y + d / 2 + 12)
        if blocked[y0:y1, x0:x1].any() or not land[y0:y1, x0:x1].all(): continue
        blocked[y0:y1, x0:x1] = True; r = int(rng.integers(0, 1000))
        houses.append([round(x, 1), round(y, 1), round(w, 1), round(d, 1), int(20 + r % 4 * 3), r % 7, (r // 7) % 5])
    tries = 0
    while len(trees) < z['trees'] and tries < 6000:
        tries += 1; x, y = rng.uniform(90, W - 90), rng.uniform(90, H - 90); r = rng.uniform(13, 22)
        if blocked[int(y - r):int(y + r), int(x - r):int(x + r)].any(): continue
        blocked[int(y - r):int(y + r), int(x - r):int(x + r)] = True; trees.append([round(x, 1), round(y, 1), round(r, 1)])
    walk = land & ~ndi.binary_dilation(blocked & ~road, iterations=4)
    walk = ndi.binary_erosion(walk, iterations=5)
    gh, gw = H // CELL, W // CELL; grid = walk.reshape(gh, CELL, gw, CELL).mean((1, 3)) > .6
    lab, _ = ndi.label(grid); grid = lab == lab[600 // CELL, 700 // CELL]
    Image.fromarray((grid * 255).astype(np.uint8)).save(f'{ROOT}/public/zones/{zid}/walk.png')
    coast = [[m, m], [W - m, m], [W - m, H - m], [m, H - m]]
    json.dump({'w': W, 'h': H, 'angle': 0, 'coast': [coast], 'decks': [], 'houses': houses, 'trees': trees}, open(f'{ROOT}/content/zones/{zid}.world3d.json', 'w'), separators=(',', ':'))
    ok = lambda p: grid[int(p[1] // CELL), int(p[0] // CELL)]
    def near(p):
        gy, gx = np.nonzero(grid); i = np.argmin((gx * CELL + 5 - p[0]) ** 2 + (gy * CELL + 5 - p[1]) ** 2); return [int(gx[i] * CELL + 5), int(gy[i] * CELL + 5)]
    cats = [near([float(rng.uniform(200, W - 200)), float(rng.uniform(200, H - 200))]) for _ in range(3)]
    zone = {'id': zid, 'name': {'bm': z['name'][0], 'en': z['name'][1]}, 'label': {'bm': z['label'][0], 'en': z['label'][1]},
            'placeholder': True, 'stations': [], 'world': {'w': W, 'h': H, 'cell': CELL, 'grid': [gw, gh]},
            'landmarks': {}, 'sprites': {}, 'triggers': {}, 'start': near([700, 900]), 'ferryLine': [], 'cats': cats,
            'npcs': [{'id': 'guide', 'x': near([780, 640])[0], 'y': near([780, 640])[1], 'look': {'skin': 1, 'hair': 2}, 'outfit': 'kurung', 'wander': False,
                      'say': {'bm': z['npc'][0], 'en': z['npc'][1]}}],
            'exits': [{'kind': e['kind'], 'at': near(e['at']), 'to': e['to'], 'label': {'bm': e['label'][0], 'en': e['label'][1]}} for e in z['exits']]}
    json.dump(zone, open(f'{ROOT}/content/zones/{zid}.json', 'w'), ensure_ascii=False, indent=1)
    print(zid, 'houses', len(houses), 'trees', len(trees), 'walkable', int(grid.sum()), 'start ok', ok(zone['start']))
