"""George Town walkable zone for the Pasport Penang prototype.

Coastline comes from the approved data/geography.geojson (same projection as
the site). Streets, shophouse blocks, padang and trees are interpretive game
layout, not a street map. Outputs colour + sketch world, collision grid,
landmark sprites (colour + sketch) and world.json.
"""
import json, math, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageOps
from scipy import ndimage as ndi

REPO, OUT = sys.argv[1], sys.argv[2]
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


geo = json.load(open(f'{REPO}/data/geography.geojson'))
places = {p['id']: p for p in json.load(open(f'{REPO}/data/places.json'))}

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
    r = 150 if pid != 'jetty' else 95
    plaza |= (xx - x) ** 2 / (r * 1.25) ** 2 + (yy - y - 30) ** 2 / r ** 2 < 1
# padang (green field) west of the fort
fx, fy = LM['fort']
padang = land & ((xx - (fx - 300)) ** 2 / 210 ** 2 + (yy - (fy - 10)) ** 2 / 110 ** 2 < 1)
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
for y, x in zip(gy * 12, gx * 12):
    if rng.random() < .35:
        r = rng.uniform(14, 24); tree_pts.append((x, y, r))
# palms around the padang & promenade
py_, px_ = np.nonzero((pad_edge | (prom & (dist_in > 18) & (dist_in < 26)))[::40, ::40])
for y, x in zip(py_ * 40, px_ * 40):
    if rng.random() < .5 and not plaza[y, x]:
        tree_pts.append((x, y, rng.uniform(13, 18)))
img_pil = Image.fromarray(np.clip(img * (1 + grain[..., None] * .012), 0, 255).astype(np.uint8)).convert('RGBA')
canopy = Image.new('RGBA', (W, H), (0, 0, 0, 0)); dc = ImageDraw.Draw(canopy)
shadow = Image.new('L', (W, H), 0); ds = ImageDraw.Draw(shadow)
for x, y, r in tree_pts:
    ds.ellipse((x - r + 8, y - r * .6 + 12, x + r + 8, y + r * .6 + 12), fill=120)
for x, y, r in sorted(tree_pts, key=lambda p: p[1]):
    for j in range(4):
        ox, oy = rng.uniform(-.4, .4) * r, rng.uniform(-.4, .3) * r
        rr_ = r * rng.uniform(.55, .8)
        g = rng.integers(0, 3)
        col = [(92, 150, 70), (110, 168, 78), (78, 134, 62)][g]
        dc.ellipse((x + ox - rr_, y + oy - rr_, x + ox + rr_, y + oy + rr_), fill=col + (255,))
    dc.ellipse((x - r * .45, y - r * .55, x - r * .05, y - r * .15), fill=(160, 205, 110, 200))
shadow = shadow.filter(ImageFilter.GaussianBlur(5))
dk = Image.new('RGBA', (W, H), (40, 30, 10, 0)); dk.putalpha(shadow)
img_pil.alpha_composite(dk); img_pil.alpha_composite(canopy)
# trees block movement
tree_block = np.zeros((H, W), bool)
for x, y, r in tree_pts:
    tree_block |= (xx - x) ** 2 + (yy - y) ** 2 < (r * .7) ** 2

# ---- ink coastline
arr = np.asarray(img_pil).astype(np.float32)
ink = np.clip(1 - dist_out / 3, 0, 1) * (~land)
arr[..., :3] = lerp(arr[..., :3], hexc('#5c4630'), ink * .8)
color = Image.fromarray(arr.astype(np.uint8)).convert('RGB')


def pencil(rgb_img, keep_alpha=None, strength=1.4):
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


# sketch world: pencil land, but keep sea softly tinted so the coast still reads
sk = np.asarray(pencil(color)).astype(np.float32)
seamix = np.clip(dist_out / 8, 0, 1) * (~land)
col_arr = np.asarray(color).astype(np.float32)
desat = col_arr.mean(-1, keepdims=True) * .55 + col_arr * .45
sk = lerp(sk, desat * np.array([1.0, 1.02, 1.03]), seamix * .85)
sketch = Image.fromarray(np.clip(sk, 0, 255).astype(np.uint8))

color.save(f'{OUT}/gt-color.webp', quality=84, method=6)
sketch.save(f'{OUT}/gt-sketch.webp', quality=84, method=6)

# ---- sprites
DA = f'{REPO}/review/assets/diorama-atlas-v3.webp'
HA = f'{REPO}/review/assets/hotspot-atlas-v1.webp'
crops = {'fort': (DA, [0, 410, 420, 370]), 'kho': (DA, [794, 0, 358, 410]), 'jetty': (DA, [420, 410, 353, 370]),
         'food': (DA, [409, 780, 373, 372]), 'komtar': (HA, [0, 0, 384, 400])}
widths = {'fort': 330, 'kho': 270, 'jetty': 290, 'food': 270, 'komtar': 250}
spr_meta = {}
for k_, (path, (x, y, w, h)) in crops.items():
    im = Image.open(path).convert('RGBA').crop((x, y, x + w, y + h)); im = im.crop(im.getbbox())
    tw = widths[k_]; im = im.resize((tw, round(im.height * tw / im.width)), Image.LANCZOS)
    im.save(f'{OUT}/s-{k_}.webp', quality=88)
    pencil(im, im.split()[-1]).save(f'{OUT}/s-{k_}-sk.webp', quality=88)
    spr_meta[k_] = [im.width, im.height]

# ---- collision grid (1 = walkable), cell 10px
CELL = 10
walk = (land & walk_ground) | board
walk &= ~tree_block
for k_, (x, y) in LM.items():
    w, h = spr_meta[k_]
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
Image.fromarray((grid * 255).astype(np.uint8)).save(f'{OUT}/gt-walk.png')

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
bus_stop = [int(start[0]), int(start[1])]
json.dump({'w': W, 'h': H, 'cell': CELL, 'grid': [gw, gh], 'landmarks': {k_: [round(a, 1) for a in v] for k_, v in LM.items()},
           'sprites': spr_meta, 'triggers': trig, 'start': [int(start[0]), int(start[1])], 'ferryStop': ferry_stop,
           'busStop': bus_stop, 'ferryLine': [[round(a, 1) for a in p] for p in ferry]},
          open(f'{OUT}/world.json', 'w'))
print('ok', spr_meta, trig, start, ferry_stop, grid.sum())
