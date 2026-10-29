"""Bake the George Town zone for the 3D game from the approved coastline.

Inputs (read-only): data/geography/geography.geojson and places.json (hash-locked), content/stations/*.json.
Streets, shophouse blocks, plazas, padang and trees are interpretive game layout, not a street map.
Outputs: public/zones/george-town/{walk.png, ground.webp, sea.webp}, content/zones/george-town.world3d.json,
and the computed fields of content/zones/george-town.json (landmarks, sprites, triggers, ferryStop).
Hand-placed fields there (start, cats, npcs, exits, ferryLine) are kept.

    python3 tools/bake_zone.py [--debug]    # --debug also writes test-results/zone-debug.png
"""

import json, math, os, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage as ndi
from skimage import measure

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ZONE_JSON = f'{REPO}/content/zones/george-town.json'
PUB = f'{REPO}/public/zones/george-town'
DEBUG = len(sys.argv) > 1 and sys.argv[1] == '--debug'

rng = np.random.default_rng(5)
B = [100.16, 5.20, 100.52, 5.51]; COS = math.cos(5.36 * math.pi / 180)
U = min(960 / ((B[2] - B[0]) * COS), 740 / (B[3] - B[1]))


def ill(lon, lat):
    x = 70 + (lon - B[0]) * COS * U; y = 70 + (B[3] - lat) * U
    return x + .16 * (y - 440), 100 + .76 * y


SC = 28
W, H = 2000, 1800
cx, cy = ill(100.3375, 5.4160)
OX, OY = cx * SC - 960, cy * SC - 810


def P(lon, lat):
    x, y = ill(lon, lat); return x * SC - OX, y * SC - OY


def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], np.float32)


def lerp(a, b, t):
    return a + (b - a) * np.asarray(t, np.float32)[..., None]


def noise(h, w, scales):
    acc = np.zeros((h, w), np.float32)
    for s, wgt in scales:
        small = rng.standard_normal((max(2, h // s + 2), max(2, w // s + 2))).astype(np.float32)
        acc += np.asarray(Image.fromarray(small).resize((w, h), Image.BICUBIC)) * wgt
    acc -= acc.min(); acc /= acc.max() + 1e-6
    return acc


geo = json.load(open(f'{REPO}/data/geography/geography.geojson'))  # approved, read-only
places = {p['id']: p for p in json.load(open(f'{REPO}/data/geography/places.json'))}  # approved, read-only
stations = {}
for f in sorted(os.listdir(f'{REPO}/content/stations')):
    s_ = json.load(open(f'{REPO}/content/stations/{f}'))
    if s_['zone'] == 'george-town': stations[s_['id']] = s_

m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
ferry_lines = []
for f in geo['features']:
    g = f['geometry']
    if g['type'] == 'MultiPolygon':
        for poly in g['coordinates']:
            d.polygon([P(*c) for c in poly[0]], fill=255)
            for hole in poly[1:]:
                d.polygon([P(*c) for c in hole], fill=0)
    elif g['type'] == 'LineString':
        ferry_lines.append([P(*c) for c in g['coordinates']])
land = np.asarray(m) > 127
# keep only the main George Town landmass (drop tiny islets / far edges)
lab, n = ndi.label(land)
sizes = ndi.sum(land, lab, range(1, n + 1))
land = lab == (np.argmax(sizes) + 1)
dist_in = ndi.distance_transform_edt(land).astype(np.float32)
dist_out = ndi.distance_transform_edt(~land).astype(np.float32)
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# ---- landmarks (anchor = ground point under the sprite)
LM = {}
for pid in ('fort', 'kho', 'jetty', 'food'):
    LM[pid] = list(P(*places[pid]['coordinates']))
LM['komtar'] = list(P(100.32981, 5.41456))
# Phase 2 stations: real coordinates from content/stations, then an interpretive nudge (game px, ~1.5 m each)
# so the dense Pitt Street cluster gets room for a plaza each. Directions links always use the real coordinates.
NUDGE = {'armenian': (-185, 5), 'kapitan': (-35, -30), 'mariamman': (85, 40), 'kuanyin': (-15, -60),
         'peranakan': (35, -5), 'bluemansion': (0, 0), 'esplanade': (-20, 25)}
for sid, (dx, dy) in NUDGE.items():
    x_, y_ = P(*stations[sid]['coordinates']); LM[sid] = [x_ + dx, y_ + dy]
PLAZA_R = {**{k: 150 for k in ('fort', 'kho', 'food', 'komtar')}, 'jetty': 95, 'kapitan': 95}
# jetty houses stand over the water: push its anchor just off the coast and add a boardwalk
jx, jy = LM['jetty']

# ---- street grid (rotated), promenade, plazas, padang
ang = math.radians(-10)
ca, sa = math.cos(ang), math.sin(ang)
u = xx * ca + yy * sa
v = -xx * sa + yy * ca
CW, CH, RW = 250, 200, 58
uu, vv = (u + 40) % CW, (v + 30) % CH
road = (uu < RW) | (vv < RW * .9)
prom = land & (dist_in < 46)
plaza = np.zeros_like(land)
for pid, (x, y) in LM.items():
    r = PLAZA_R.get(pid, 72)
    plaza |= (xx - x) ** 2 / (r * 1.25) ** 2 + (yy - y - 30) ** 2 / r ** 2 < 1
# padang (green field) west of the fort
fx, fy = LM['fort']
# Phase 2: moved next to the Esplanade station (between City Hall and the fort), as on the real waterfront
padang = land & ((xx - (fx - 165)) ** 2 / 150 ** 2 + (yy - (fy - 25)) ** 2 / 85 ** 2 < 1)
walk_ground = land & (road | prom | plaza | padang)
blocks = land & ~walk_ground

# boardwalk to the jetty
bw = Image.new('L', (W, H), 0); db = ImageDraw.Draw(bw)
# nearest land point to the jetty anchor
iy_, ix_ = np.nonzero(land & (dist_in < 3))
k = np.argmin((ix_ - jx) ** 2 + (iy_ - jy) ** 2)
lx, ly = ix_[k], iy_[k]
ex, ey = jx + (jx - lx) * 1.4 + 40, jy + (jy - ly) * 1.4 + 40
db.line([(lx - (ex - lx) * .2, ly - (ey - ly) * .2), (ex, ey)], fill=255, width=46)
board = np.asarray(bw) > 127
board &= ~land | (dist_in < 30)
LM['jetty'] = [float((lx + ex) / 2 + 30), float((ly + ey) / 2 + 20)]

# ---- base colours
nz = noise(H, W, ((120, .5), (40, .3), (10, .2)))
grain = rng.standard_normal((H, W)).astype(np.float32)
img = np.zeros((H, W, 3), np.float32)
# sea
t = np.clip(dist_out / 260, 0, 1) ** .7
sea = lerp(np.broadcast_to(hexc('#8fdcd0'), (H, W, 3)), np.broadcast_to(hexc('#2f94ad'), (H, W, 3)), t)
for i, dd in enumerate((10, 24, 42, 66)):
    band = np.clip(1 - np.abs(dist_out - dd) / 2.2, 0, 1) * (.55 - i * .1)
    sea = lerp(sea, hexc('#f0faf4'), band)
S = 56
row = np.floor(yy / (S * .5)); xo = xx + (row % 2) * S * .5
ccx = (np.floor(xo / S) + .5) * S; ccy = (row + 1) * S * .5
rr = np.hypot(xo - ccx, yy - ccy)
rings = (np.abs(((rr / (S * .5)) * 3) % 1 - .5) < .07) & (yy < ccy) & (rr < S * .5)
sea = lerp(sea, hexc('#d6efe9'), rings * np.clip((dist_out - 90) / 60, 0, 1) * .3)
img[:] = sea
# road surface (warm paving) + promenade
roadc = lerp(np.broadcast_to(hexc('#e7dcc2'), (H, W, 3)), np.broadcast_to(hexc('#d9ccae'), (H, W, 3)), nz)
img = np.where((land & walk_ground)[..., None], roadc, img)
# kerb lines on road edges
edge_r = (land & road) & ~ndi.binary_erosion(land & road, iterations=3)
img = lerp(img, hexc('#b9aa88'), (edge_r & ~plaza & ~prom) * .7)
# plaza tiles
tile = (((xx // 22) + (yy // 22)) % 2 == 0)
img = np.where((plaza & land)[..., None], lerp(lerp(np.broadcast_to(hexc('#efe4cb'), (H, W, 3)), np.broadcast_to(hexc('#e8dcc0'), (H, W, 3)), tile * 1.0), hexc('#d8c8a6'), nz * .3), img)
# promenade with sea-wall rail
img = np.where((prom & ~plaza)[..., None], lerp(np.broadcast_to(hexc('#e9e1cc'), (H, W, 3)), hexc('#d5c8aa'), ((xx + yy) % 26 < 2) * .6), img)
rail = land & (dist_in < 5)
img = lerp(img, hexc('#8b7a5c'), rail * .9)
# padang grass
grass = lerp(np.broadcast_to(hexc('#9fcf74'), (H, W, 3)), np.broadcast_to(hexc('#86bd60'), (H, W, 3)), ((u // 30) % 2) * 1.0)
img = np.where((padang & ~plaza)[..., None], grass * (0.95 + nz[..., None] * .1), img)
pad_edge = padang & ~ndi.binary_erosion(padang, iterations=4)
img = lerp(img, hexc('#f4efdf'), pad_edge * .9)
# boardwalk planks
planks = ((u % 14) < 2)
img = np.where(board[..., None], lerp(np.broadcast_to(hexc('#b58a5a'), (H, W, 3)), hexc('#7d5a36'), planks * .8), img)

# ---- shophouse blocks
# local coords inside each block cell
bu = (u + 40) % CW - RW; bv = (v + 30) % CH - RW * .9
cell_id = (np.floor((u + 40) / CW) * 31 + np.floor((v + 30) / CH) * 17).astype(np.int64)
bh = CH - RW * .9
house_w = 30
hid = np.floor(bu / house_w).astype(np.int64) + cell_id * 101
facade_h = 26
is_facade = blocks & (bv > bh - facade_h)
is_roof = blocks & ~is_facade
pastel = np.array([hexc(c) for c in ('#f2e3a1', '#bfe0d2', '#f3c9b8', '#c9d9ee', '#f5efe1', '#e7c98e', '#cfe4b4')])
roofs = np.array([hexc(c) for c in ('#c65b3c', '#b94e33', '#d06a45', '#a9472f', '#c97a4c')])
rnd = (hid * 2654435761) % 1000
pc = pastel[rnd % len(pastel)]
rc = roofs[(rnd // 7) % len(roofs)]
# gardens: some houses become trees
garden = blocks & ((rnd % 9) == 0)
# roof: pitched (darker near ridge-south), tile stripes, party walls
ridge = bh * .45
pitch = np.where(bv < ridge, 1.08, .9)
stripes = ((bv % 7) < 1.3) * .12
party = ((bu % house_w) < 1.6) * .25
roof_col = rc * pitch[..., None] * (1 - stripes[..., None] - party[..., None])
img = np.where((is_roof & ~garden)[..., None], roof_col, img)
# facade with windows + five-foot way arcade
fy_ = bv - (bh - facade_h)
win = ((bu % house_w > 7) & (bu % house_w < 12) | (bu % house_w > 18) & (bu % house_w < 23)) & (fy_ > 4) & (fy_ < 11)
arcade = fy_ > 16
arch = arcade & ((bu % house_w > 5) & (bu % house_w < 25)) & (fy_ > 18)
fac = pc.copy()
fac = np.where(win[..., None], hexc('#4a5a5f'), fac)
fac = np.where(arcade[..., None], pc * .78, fac)
fac = np.where(arch[..., None], hexc('#5a4b3b'), fac)
img = np.where((is_facade & ~garden)[..., None], fac, img)
img = np.where(garden[..., None], lerp(np.broadcast_to(hexc('#a6cf7c'), (H, W, 3)), np.broadcast_to(hexc('#8fbe68'), (H, W, 3)), nz), img)
img = lerp(img, hexc('#6b5034'), (is_facade & ~garden & ((bu % house_w) < 1.6)) * .6)
# block shadow on the street (sun from upper-left)
sh = ndi.shift(blocks.astype(np.float32), (14, 12), order=0) * (~blocks)
sh = ndi.gaussian_filter(sh, 3)
img *= (1 - sh[..., None] * .28)
# gardens / trees
tm = Image.new('L', (W, H), 0); dt = ImageDraw.Draw(tm)
tree_pts = []
gy, gx = np.nonzero(garden[::12, ::12])
hsh = lambda x, y, k=0: ((int(x) * 73856093) ^ (int(y) * 19349663) ^ (k * 83492791)) % 10007 / 10007
for y, x in zip(gy * 12, gx * 12):
    if hsh(x, y) < .35:
        r = 14 + hsh(x, y, 1) * 10; tree_pts.append((x, y, r))
# palms around the padang & promenade
py_, px_ = np.nonzero((pad_edge | (prom & (dist_in > 18) & (dist_in < 26)))[::40, ::40])
for y, x in zip(py_ * 40, px_ * 40):
    if hsh(x, y, 2) < .5 and not plaza[y, x]:
        tree_pts.append((x, y, 13 + hsh(x, y, 3) * 5))
# trees block movement
tree_block = np.zeros((H, W), bool)
for x, y, r in tree_pts:
    tree_block |= (xx - x) ** 2 + (yy - y) ** 2 < (r * .7) ** 2

# ---- station footprints: from the sprite file when it exists, else a default
spr_meta = {}
for k_ in LM:
    sid = 'chowrasta' if k_ == 'food' else k_
    p_ = f'{PUB}/sprites/{sid}.webp'
    spr_meta[k_] = list(Image.open(p_).size) if os.path.exists(p_) else [270, 230]
# walking footprint: the original five use their painted sprite size; Phase 2 models are compact (~170 units)
foot = {k_: ([200, 210] if k_ in NUDGE else spr_meta[k_]) for k_ in LM}

# ---- collision grid (1 = walkable), cell 10px
CELL = 10
walk = (land & walk_ground) | board
walk &= ~tree_block
for k_, (x, y) in LM.items():
    w, h = foot[k_]
    # sprite footprint: lower part of the sprite's diamond base
    walk &= ~(((xx - x) / (w * .40)) ** 2 + ((yy - (y - h * .12)) / (h * .2)) ** 2 < 1) | board
walk = ndi.binary_erosion(walk, iterations=6)
gh, gw = H // CELL, W // CELL
grid = walk[:gh * CELL, :gw * CELL].reshape(gh, CELL, gw, CELL).mean((1, 3)) > .6
# keep the connected walkable network that contains the start point
start = (LM['komtar'][0] + 40, LM['komtar'][1] + 120)
gl, _ = ndi.label(grid)
sid = gl[int(start[1] // CELL), int(start[0] // CELL)]
if sid == 0:
    yy2, xx2 = np.nonzero(gl > 0)
    k2 = np.argmin((xx2 * CELL - start[0]) ** 2 + (yy2 * CELL - start[1]) ** 2)
    sid = gl[yy2[k2], xx2[k2]]; start = (xx2[k2] * CELL + 5, yy2[k2] * CELL + 5)
grid = gl == sid
m_ = 5
grid[:m_, :] = False; grid[-m_:, :] = False; grid[:, :m_] = False; grid[:, -m_:] = False
Image.fromarray((grid * 255).astype(np.uint8)).save(f'{PUB}/walk.png')

# trigger points: nearest walkable cell in front (south) of each landmark
trig = {}
for k_, (x, y) in LM.items():
    gy_, gx_ = np.nonzero(grid)
    px_c, py_c = gx_ * CELL + 5, gy_ * CELL + 5
    dd = (px_c - x) ** 2 + ((py_c - (y + 40)) * 1.3) ** 2
    i = np.argmin(dd); trig[k_] = [int(px_c[i]), int(py_c[i])]

ferry = ferry_lines[0]
fs = min(ferry, key=lambda p: (p[0] - LM['jetty'][0]) ** 2 + (p[1] - LM['jetty'][1]) ** 2)
gy_, gx_ = np.nonzero(grid)
i = np.argmin((gx_ * CELL - fs[0]) ** 2 + (gy_ * CELL - fs[1]) ** 2)
ferry_stop = [int(gx_[i] * CELL + 5), int(gy_[i] * CELL + 5)]

# ======================= 3D export =======================

walk_ground, road = walk_ground, road
hexc, lerp, nz = hexc, lerp, nz

xx, yy = xx, yy
ang = ang

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
dist_in = dist_in
img = lerp(img, hexc('#8b7a5c'), (land & (dist_in < 4)) * .85)
grain = np.random.default_rng(2).standard_normal((H, W)).astype(np.float32)
img = np.clip(img * (1 + grain[..., None] * .012), 0, 255)
SC_T = 0.75  # texture scale (1500 x 1350) to keep phones happy
gimg = Image.fromarray(img.astype(np.uint8)).resize((int(W * SC_T), int(H * SC_T)), Image.LANCZOS)
gimg.save(f'{PUB}/ground.webp', quality=82, method=6)

# ---------- sea floor texture (shallows near the coast) ----------
dist_out = dist_out
t = np.clip(dist_out / 220, 0, 1) ** .7
sea = lerp(np.broadcast_to(hexc('#8fe0d2'), (H, W, 3)), np.broadcast_to(hexc('#2a8fab'), (H, W, 3)), t)
for i, dd in enumerate((14, 30, 52)):
    band = np.clip(1 - np.abs(dist_out - dd) / 2.5, 0, 1) * (.5 - i * .12)
    sea = lerp(sea, hexc('#effaf3'), band)
Image.fromarray(np.clip(sea, 0, 255).astype(np.uint8)).resize((int(W * .5), int(H * .5)), Image.LANCZOS).save(f'{PUB}/sea.webp', quality=80, method=6)

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
CW_, CH_ = CW, CH
hid2 = (np.floor((u + 40) / CW_).astype(np.int64) + 1000) * 100000 + (np.floor((v + 30) / CH_).astype(np.int64) + 1000) * 10 + np.floor(bu / house_w).astype(np.int64)
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

trees = [[round(float(x), 1), round(float(y), 1), round(float(r), 1)] for x, y, r in tree_pts]


# ---------- neighbouring land (the rest of Penang, drawn faded beyond this zone's coast) ----------
# Every land polygon of the approved geography is projected with this zone's P(), so the land that continues
# past the frame (Air Itam, the hill, the north and south, the mainland) sits in the right place. Tiny islets
# and duplicate relation rings are dropped, as in tools/bake_overworld.py.
def neighbour_land(tol=2.5):
    rings = []
    for f in geo['features']:
        g = f['geometry']
        if g['type'] != 'MultiPolygon': continue  # bridges and ferry lines are not land
        for poly in g['coordinates']:
            pts = np.array([P(*c) for c in poly[0]])
            s = measure.approximate_polygon(pts, tolerance=tol)
            a_ = s; area = .5 * abs(np.dot(a_[:, 0], np.roll(a_[:, 1], 1)) - np.dot(a_[:, 1], np.roll(a_[:, 0], 1)))
            if len(s) >= 4 and area > 4000: rings.append(s)
    def bbox(r): return np.r_[r.min(0), r.max(0)]
    uniq = []
    for r in sorted(rings, key=len, reverse=True):
        if not any(np.abs(bbox(r) - bbox(u)).max() < 270 for u in uniq): uniq.append(r)
    return [r.round(1).tolist() for r in uniq]


land = neighbour_land()
json.dump({'w': W, 'h': H, 'angle': ang, 'coast': polys, 'decks': decks, 'houses': houses, 'trees': trees, 'land': land}, open(f'{REPO}/content/zones/george-town.world3d.json', 'w'), separators=(',', ':'))
print('neighbour land rings', len(land), [len(r) for r in land][:8])
print('houses', len(houses), 'trees', len(trees), 'coast', [len(p) for p in polys], 'decks', len(decks))

# ---------- merge computed fields into the zone file ----------
zone = json.load(open(ZONE_JSON))
key = lambda k_: 'chowrasta' if k_ == 'food' else k_
zone['landmarks'] = {key(k_): [round(c, 1) for c in v] for k_, v in LM.items()}
zone['sprites'] = {key(k_): v for k_, v in spr_meta.items()}
zone['triggers'] = {key(k_): v for k_, v in trig.items()}
zone['ferryStop'] = ferry_stop
zone['stations'] = sorted(stations, key=lambda s_: stations[s_]['order'])
json.dump(zone, open(ZONE_JSON, 'w'), ensure_ascii=False, indent=1)
print('stations', zone['stations'])

if DEBUG:
    dbg = np.zeros((H, W, 3), np.uint8); dbg[land] = (225, 214, 186); dbg[blocks] = (190, 120, 90); dbg[padang] = (150, 200, 110)
    gimg_ = Image.fromarray(dbg); dd = ImageDraw.Draw(gimg_)
    for gy2 in range(grid.shape[0]):
        for gx2 in range(grid.shape[1]):
            if grid[gy2, gx2]: dd.point((gx2 * CELL + 5, gy2 * CELL + 5), fill=(60, 60, 60))
    for k_, (x, y) in LM.items():
        w, h = foot[k_]; dd.ellipse((x - w * .4, y - h * .12 - h * .2, x + w * .4, y - h * .12 + h * .2), outline=(200, 0, 90), width=3)
        dd.text((x - 20, y - 8), key(k_), fill=(0, 0, 0)); tx, ty = trig[k_]; dd.ellipse((tx - 6, ty - 6, tx + 6, ty + 6), fill=(0, 120, 255))
    for c in zone['cats']: dd.rectangle((c[0] - 5, c[1] - 5, c[0] + 5, c[1] + 5), fill=(255, 140, 0))
    for n_ in zone['npcs']: dd.rectangle((n_['x'] - 6, n_['y'] - 6, n_['x'] + 6, n_['y'] + 6), fill=(140, 0, 255))
    os.makedirs(f'{REPO}/test-results', exist_ok=True); gimg_.save(f'{REPO}/test-results/zone-debug.png')
