"""Export 3D data for the Pasport Penang 3D test from the same George Town layout.

Runs gameworld.py to get the identical masks (approved coastline + interpretive
streets), then writes: ground texture (no roofs/trees), sea mask, coastline
polygons, shophouse boxes and tree positions.
"""
import json, math, runpy, sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
from skimage import measure

REPO, OUT, TMP = sys.argv[1], sys.argv[2], sys.argv[3]
sys.argv = ['zone_layout.py', REPO, TMP]
import os
G = runpy.run_path(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'zone_layout.py'), run_name='__main__')
W, H = G['W'], G['H']
land, plaza, prom, padang, board, blocks, garden = (G[k] for k in ('land', 'plaza', 'prom', 'padang', 'board', 'blocks', 'garden'))
walk_ground, road = G['walk_ground'], G['road']
hexc, lerp, nz = G['hexc'], G['lerp'], G['nz']
u, v, bu, bv, hid, rnd = (G[k] for k in ('u', 'v', 'bu', 'bv', 'hid', 'rnd'))
xx, yy = G['xx'], G['yy']
ang = G['ang']

# ---------- ground texture (top of the island) ----------
img = np.zeros((H, W, 3), np.float32)
base = lerp(np.broadcast_to(hexc('#e7dcc2'), (H, W, 3)), np.broadcast_to(hexc('#d6c8a8'), (H, W, 3)), nz)
img[:] = base
tile = (((xx // 22) + (yy // 22)) % 2 == 0)
img = np.where(plaza[..., None], lerp(lerp(np.broadcast_to(hexc('#efe4cb'), (H, W, 3)), np.broadcast_to(hexc('#e6d8bb'), (H, W, 3)), tile * 1.0), hexc('#d8c8a6'), nz * .3), img)
img = np.where((prom & ~plaza)[..., None], lerp(np.broadcast_to(hexc('#ece4cf'), (H, W, 3)), hexc('#d5c8aa'), ((xx + yy) % 26 < 2) * .5), img)
grass = lerp(np.broadcast_to(hexc('#a3d277'), (H, W, 3)), np.broadcast_to(hexc('#8cc163'), (H, W, 3)), ((u // 30) % 2) * 1.0)
img = np.where((padang & ~plaza)[..., None], grass, img)
pad_edge = padang & ~ndi.binary_erosion(padang, iterations=4)
img = lerp(img, hexc('#f4efdf'), pad_edge * .9)
# under-building ground slightly darker (only visible at the edges)
img = np.where(blocks[..., None], img * .82, img)
img = np.where(garden[..., None], lerp(np.broadcast_to(hexc('#a6cf7c'), (H, W, 3)), np.broadcast_to(hexc('#8fbe68'), (H, W, 3)), nz), img)
# kerb lines along roads
edge_r = (land & road) & ~ndi.binary_erosion(land & road, iterations=3)
img = lerp(img, hexc('#b9aa88'), (edge_r & ~plaza & ~prom) * .7)
# promenade rail
dist_in = G['dist_in']
img = lerp(img, hexc('#8b7a5c'), (land & (dist_in < 4)) * .85)
grain = np.random.default_rng(2).standard_normal((H, W)).astype(np.float32)
img = np.clip(img * (1 + grain[..., None] * .012), 0, 255)
SC_T = 0.75  # texture scale (1500 x 1350) to keep phones happy
gimg = Image.fromarray(img.astype(np.uint8)).resize((int(W * SC_T), int(H * SC_T)), Image.LANCZOS)
gimg.save(f'{OUT}/ground.webp', quality=82, method=6)

# ---------- sea floor texture (shallows near the coast) ----------
dist_out = G['dist_out']
t = np.clip(dist_out / 220, 0, 1) ** .7
sea = lerp(np.broadcast_to(hexc('#8fe0d2'), (H, W, 3)), np.broadcast_to(hexc('#2a8fab'), (H, W, 3)), t)
for i, dd in enumerate((14, 30, 52)):
    band = np.clip(1 - np.abs(dist_out - dd) / 2.5, 0, 1) * (.5 - i * .12)
    sea = lerp(sea, hexc('#effaf3'), band)
Image.fromarray(np.clip(sea, 0, 255).astype(np.uint8)).resize((int(W * .5), int(H * .5)), Image.LANCZOS).save(f'{OUT}/sea.webp', quality=80, method=6)

# ---------- coastline polygons ----------
polys = []
lab, n = ndi.label(land)
for i in range(1, n + 1):
    m = lab == i
    if m.sum() < 400:
        continue
    pad = np.pad(m, 1)
    cs = measure.find_contours(pad.astype(float), .5)
    c = max(cs, key=len)
    c = measure.approximate_polygon(c, tolerance=1.6)
    pts = [[round(float(p[1] - 1), 1), round(float(p[0] - 1), 1)] for p in c]
    polys.append(pts)
# jetty boardwalk as a separate low deck
bl, bn = ndi.label(board & ~land)
decks = []
for i in range(1, bn + 1):
    m = bl == i
    if m.sum() < 200: continue
    cs = measure.find_contours(np.pad(m, 1).astype(float), .5)
    c = measure.approximate_polygon(max(cs, key=len), tolerance=1.5)
    decks.append([[round(float(p[1] - 1), 1), round(float(p[0] - 1), 1)] for p in c])

# ---------- shophouses ----------
ca, sa = math.cos(ang), math.sin(ang)
mask = blocks & ~garden
CW_, CH_ = G['CW'], G['CH']
hid2 = (np.floor((u + 40) / CW_).astype(np.int64) + 1000) * 100000 + (np.floor((v + 30) / CH_).astype(np.int64) + 1000) * 10 + np.floor(bu / G['house_w']).astype(np.int64)
ids = hid2[mask]
uu, vv = u[mask], v[mask]
uniq, inv = np.unique(ids, return_inverse=True)
cnt = np.bincount(inv)
umin = np.full(len(uniq), 1e9); umax = np.full(len(uniq), -1e9); vmin = umin.copy(); vmax = umax.copy()
np.minimum.at(umin, inv, uu); np.maximum.at(umax, inv, uu); np.minimum.at(vmin, inv, vv); np.maximum.at(vmax, inv, vv)
rid = rnd[mask]
rsel = np.zeros(len(uniq), np.int64); rsel[inv] = rid
houses = []
for k in range(len(uniq)):
    w = umax[k] - umin[k] + 1; d = vmax[k] - vmin[k] + 1
    if w < 12 or d < 30: continue
    if cnt[k] < .62 * w * d: continue
    cu, cv = (umin[k] + umax[k]) / 2, (vmin[k] + vmax[k]) / 2
    x = cu * ca - cv * sa; y = cu * sa + cv * ca
    r = int(rsel[k])
    h = 24 + (r % 5) * 3 + (8 if r % 17 == 0 else 0)
    houses.append([round(x, 1), round(y, 1), round(w - 1.5, 1), round(d - 2, 1), int(h), r % 7, (r // 7) % 5])

trees = [[round(float(x), 1), round(float(y), 1), round(float(r), 1)] for x, y, r in G['tree_pts']]
json.dump({'w': W, 'h': H, 'angle': ang, 'coast': polys, 'decks': decks, 'houses': houses, 'trees': trees}, open(f'{OUT}/world3d.json', 'w'), separators=(',', ':'))
print('houses', len(houses), 'trees', len(trees), 'coast', [len(p) for p in polys], 'decks', len(decks))
