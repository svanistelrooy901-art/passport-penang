/* Phase 2 George Town station models (toon miniature, interpretive, not surveyed architecture).
   Each builder also records `userData.spots`: local [x, y, z] points for the find game, so the sprite
   renderer (tools/render_sprites.mjs) can turn them into image hotspots. */
import * as THREE from 'three';
import { M, G } from './core';
import { satFor, palm } from './stations';

type Spot = [number, number, number, number]; // x, y, z, hotspot radius (px in a 270px sprite)
const spots = (g: THREE.Group, s: Record<string, Spot[]>) => { g.userData.spots = s; return g; };
const half = (r: number, d = 1.6) => { const h = new THREE.CylinderGeometry(r, r, d, 16, 1, false, -Math.PI / 2, Math.PI); h.rotateX(Math.PI / 2); return h; };
const dome = (r: number) => new THREE.SphereGeometry(r, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const tree = (g: THREE.Group, x: number, z: number, s: number, o: any) => { g.add(M('cyl8', '#7a5a3a', 2.2, 16 * s, 2.2, x, 8 * s, z, o), M('ico', '#6fa45a', 13 * s, 11 * s, 13 * s, x, 22 * s, z, o), M('ico', '#82b866', 9 * s, 8 * s, 9 * s, x + 5 * s, 27 * s, z - 3, o)); };

/* Cheong Fatt Tze Mansion: indigo-blue courtyard house, tiled roofs, louvre windows */
function bluemansion() {
  const g = G(), o = { sat: satFor('bluemansion') }; const blue = '#4566b8', trim = '#f4efe6', roof = '#b8452f', louv = '#3e5a4a';
  g.add(M('box', '#cfc8b6', 180, 2, 150, 0, 1, 8, o));
  g.add(M('box', blue, 136, 36, 64, 0, 18, -20, o));
  for (const sx of [-1, 1]) g.add(M('box', blue, 34, 30, 50, sx * 58, 15, 30, o), M('prism', roof, 40, 11, 56, sx * 58, 30, 30, o));
  g.add(M('box', trim, 140, 3, 68, 0, 36.5, -20, o), M('box', trim, 140, 2.4, 1.2, 0, 18, 12.4, o));
  g.add(M('prism', roof, 146, 16, 74, 0, 38, -20, o));
  for (const [x, z] of [[-73, 17], [73, 17], [-73, -57], [73, -57]]) { const c = M('cone', roof, 2.6, 9, 2.6, x, 42, z, o); c.rotation.z = x < 0 ? .8 : -.8; g.add(c); }
  // louvre windows, two storeys
  for (const y of [9, 27]) for (let i = 0; i < 6; i++) { const x = -50 + i * 20; if (y === 9 && Math.abs(x) < 15) continue; g.add(M('box', louv, 8, 10, 1, x, y, 12.6, o)); for (let k = 0; k < 3; k++) g.add(M('box', '#6f8a73', 8.2, .8, 1.2, x, y - 3 + k * 3, 12.8, { sat: o.sat, noShadow: 1 })); }
  for (const sx of [-1, 1]) for (const y of [8, 21]) g.add(M('box', louv, 9, 9, 1, sx * 58, y, 55.6, o));
  // main door with granite steps
  g.add(M('box', '#7a2a22', 14, 16, 1.4, 0, 8, 12.8, o), M('box', '#e2a93f', 16, 2, 1.6, 0, 17, 12.9, o));
  for (let i = 0; i < 3; i++) g.add(M('box', '#bdb4a2', 26 - i * 4, 2, 6 - i * 1.5, 0, 1 + i * 2, 16 + 2 - i * 1.5, o));
  // courtyard: granite paving and two pots
  g.add(M('box', '#c2baa8', 80, .8, 42, 0, 2.2, 34, { sat: o.sat, noShadow: 1 }));
  for (const sx of [-1, 1]) g.add(M('cyl8', '#5a7a8c', 4.5, 7, 4.5, sx * 26, 5.5, 44, o), M('ico', '#6fa45a', 6, 5, 6, sx * 26, 11, 44, o));
  palm(g, -82, -48, 30, o); tree(g, 80, 62, 1, o);
  return spots(g, { windows: [[-50, 27, 13, 14], [50, 27, 13, 14], [-30, 9, 13, 12], [30, 9, 13, 12], [-58, 21, 56, 10], [58, 21, 56, 10]], roof: [[0, 50, -20, 26], [-58, 34, 30, 14], [58, 34, 30, 14]], door: [[0, 8, 13, 13]] });
}

/* Esplanade & City Hall: white Edwardian building with portico, the Cenotaph, palms on the padang edge */
function esplanade() {
  const g = G(), o = { sat: satFor('esplanade') }; const white = '#f4f1ea', cream = '#e9e1cf', roof = '#7d8f99';
  g.add(M('box', '#9fcf74', 190, 2, 150, 0, 1, 10, o), M('box', '#e9e1cc', 190, 2.2, 22, 0, 1.2, -55, o));
  // City Hall
  g.add(M('box', white, 130, 34, 48, 0, 19, -52, o), M('box', cream, 134, 3, 52, 0, 37.5, -52, o), M('box', white, 126, 6, 44, 0, 42, -52, o));
  for (const sx of [-1, 1]) { g.add(M('box', white, 24, 46, 24, sx * 62, 25, -48, o), M(dome(11), roof, 1, 1, 1, sx * 62, 48, -48, o), M('cyl8', '#e2a93f', .8, 8, .8, sx * 62, 62, -48, o)); }
  g.add(M('box', white, 46, 40, 14, 0, 22, -25, o));
  for (let i = 0; i < 6; i++) g.add(M('cyl', white, 2.4, 30, 2.4, -20 + i * 8, 17, -17, o));
  const ped = M('prism', cream, 52, 12, 16, 0, 42, -24, o); g.add(ped);
  for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) { const x = -52 + i * 20.8; if (Math.abs(x) < 26) continue; g.add(M('box', '#5a6b70', 7, 9, 1, x, 12 + r * 16, -27.6, o)); }
  g.add(M('box', '#bdb4a2', 56, 3, 10, 0, 1.5, -12, o));
  // the Cenotaph
  g.add(M('box', '#e9e1cf', 22, 3, 22, -52, 1.5, 34, o), M('box', '#e9e1cf', 14, 4, 14, -52, 5, 34, o));
  g.add(M(new THREE.CylinderGeometry(.6, 1, 1, 4), white, 5, 40, 5, -52, 27, 34, o), M(new THREE.ConeGeometry(1, 1, 4), white, 3.2, 6, 3.2, -52, 50, 34, o));
  // palms along the sea wall
  for (const [x, z] of [[40, 40], [70, 20], [80, 60], [-90, 0]]) palm(g, x, z, 28, o);
  return spots(g, { cityhall: [[0, 30, -20, 26], [-62, 50, -48, 14], [62, 50, -48, 14]], cenotaph: [[-52, 30, 34, 14]], palms: [[40, 28, 40, 13], [70, 28, 20, 13], [80, 28, 60, 13], [-90, 28, 0, 13]] });
}

/* Pinang Peranakan Mansion: green mansion, white trim, central doorway, upper balcony, red lanterns */
function peranakan() {
  const g = G(), o = { sat: satFor('peranakan') }; const green = '#6fb592', trim = '#f6f1e4', roof = '#c0563a';
  g.add(M('box', '#d8d0bf', 170, 2, 140, 0, 1, 8, o));
  g.add(M('box', green, 130, 40, 62, 0, 20, -18, o), M('box', trim, 134, 3, 66, 0, 40, -18, o), M('prism', roof, 140, 15, 72, 0, 41.5, -18, o));
  for (const sx of [-1, 1]) { const c = M('cone', roof, 2.4, 8, 2.4, sx * 70, 45, 17, o); c.rotation.z = -sx * .8; g.add(c); }
  // ground floor: arch doorway + windows
  g.add(M('box', '#7a3b2a', 16, 18, 1.4, 0, 9, 13.6, o), M(half(8), '#7a3b2a', 1, 1, 1, 0, 18, 13.6, o), M(half(9.5, 1.2), trim, 1, 1, 1, 0, 18, 13.3, o));
  for (const x of [-46, -26, 26, 46]) g.add(M('box', '#3f5b52', 9, 12, 1, x, 10, 13.6, o), M('box', trim, 11, 1.6, 1.4, x, 16.6, 13.7, o));
  // upper balcony with railing and columns
  g.add(M('box', trim, 60, 2.4, 12, 0, 22, 18, o));
  for (let i = 0; i < 9; i++) g.add(M('box', trim, 1.2, 6, 1.2, -28 + i * 7, 26, 23.4, { sat: o.sat, noShadow: 1 }));
  g.add(M('box', trim, 60, 1.4, 1.6, 0, 29, 23.4, o));
  for (const x of [-28, 28]) g.add(M('box', trim, 3, 16, 3, x, 30, 22, o));
  for (const x of [-18, 0, 18]) g.add(M('box', '#3f5b52', 10, 12, 1, x, 30, 13.6, o));
  // red lanterns at the door
  for (const x of [-12, 12]) g.add(M('sph', '#e04535', 3.6, 4.4, 3.6, x, 17, 20, o), M('cyl8', '#e2a93f', .7, 3, .7, x, 22, 20, o));
  for (const sx of [-1, 1]) g.add(M('cyl8', '#5a7a8c', 5, 8, 5, sx * 40, 4, 34, o), M('ico', '#6fa45a', 7, 6, 7, sx * 40, 11, 34, o));
  palm(g, 72, 40, 28, o); tree(g, -74, 46, 1, o);
  return spots(g, { door: [[0, 12, 14, 13]], balcony: [[0, 26, 23, 16]], lanterns: [[-12, 17, 20, 9], [12, 17, 20, 9]] });
}

/* Goddess of Mercy Temple: red walls and pillars, curved two-tier roof with dragons, big doors, incense burner */
function kuanyin() {
  const g = G(), o = { sat: satFor('kuanyin') }; const red = '#b8352c', roof = '#d9733f', ridge = '#2f8f6f', gold = '#e2b23c';
  g.add(M('box', '#d6cfbf', 170, 2, 150, 0, 1, 8, o));
  g.add(M('box', '#c9bfae', 120, 6, 70, 0, 3, -16, o));
  g.add(M('box', red, 100, 28, 54, 0, 20, -18, o));
  for (let i = 0; i < 4; i++) { const x = -36 + i * 24; g.add(M('cyl', '#c0392b', 3, 26, 3, x, 19, 14, o)); const coil = M(new THREE.TorusGeometry(3.6, .7, 6, 12), gold, 1, 1, 1, x, 22, 14, o); coil.rotation.x = Math.PI / 2; g.add(coil); }
  g.add(M('box', '#7a2a22', 30, 20, 1.4, 0, 16, 9.6, o)); for (const x of [-7, 7]) g.add(M('box', gold, 9, 12, 1.6, x, 17, 10, o));
  g.add(M('prism', roof, 124, 14, 80, 0, 34, -14, o), M('box', red, 70, 6, 36, 0, 46, -16, o), M('prism', roof, 84, 14, 46, 0, 49, -16, o));
  for (const [x, z, y] of [[-62, 26, 38], [62, 26, 38], [-42, 7, 53], [42, 7, 53]]) { const c = M('cone', roof, 2.6, 10, 2.6, x, y, z, o); c.rotation.z = x < 0 ? .85 : -.85; g.add(c); }
  // two dragons on the ridge facing a pearl
  for (const sx of [-1, 1]) {
    const curve = new THREE.CatmullRomCurve3([[-38, 0], [-30, 6], [-22, 1], [-14, 6], [-7, 3]].map(([x, y]) => new THREE.Vector3(sx * x, y, 0)));
    g.add(M(new THREE.TubeGeometry(curve, 24, 2.8, 6, false), ridge, 1, 1.6, 1.4, 0, 64, -16, o), M('sph', ridge, 3.8, 3.4, 3.8, -sx * 6, 69, -16, o), M('cone', gold, 1.4, 4.5, 1.4, -sx * 6, 74, -16, o), M('sph', '#ffffff', .8, .8, .8, -sx * 8.5, 70, -13, { sat: o.sat, noShadow: 1 }));
  }
  g.add(M('sph', '#e04535', 3.6, 3.6, 3.6, 0, 70, -16, o), M('box', ridge, 84, 2, 3, 0, 63, -16, o));
  // incense burner in the courtyard
  g.add(M('cyl', '#7a6a45', 9, 8, 9, 0, 8, 42, o), M('cyl', '#5d5034', 10, 2, 10, 0, 12.5, 42, o));
  for (const sx of [-1, 1]) g.add(M('cyl8', '#5d5034', 1.2, 4, 1.2, sx * 5, 2, 42, o));
  for (let i = 0; i < 3; i++) g.add(M('cyl8', '#c0392b', .4, 7, .4, -2 + i * 2, 17, 42, { sat: o.sat, noShadow: 1 }));
  for (const sx of [-1, 1]) g.add(M('box', '#b0895c', 3, 26, 3, sx * 30, 13, 58, o), M('sph', '#e04535', 3.4, 4, 3.4, sx * 30, 24, 61, o));
  tree(g, -72, 52, 1, o); tree(g, 72, 46, .9, o);
  return spots(g, { dragons: [[-22, 70, -16, 15], [22, 70, -16, 15]], pillars: [[-36, 19, 14, 9], [-12, 19, 14, 9], [12, 19, 14, 9], [36, 19, 14, 9]], urn: [[0, 10, 42, 13]] });
}

/* Sri Mahamariamman Temple: tiered gopuram with figures, swans and five kalasams over the entrance */
function mariamman() {
  const g = G(), o = { sat: satFor('mariamman') }; const cream = '#efe2c4', gold = '#e2a93f';
  const tiers = ['#f0a878', '#7cc4dc', '#f08aa4', '#9fd47e', '#f6cf5a'];
  g.add(M('box', '#d8d0bf', 160, 2, 140, 0, 1, 8, o));
  g.add(M('box', cream, 110, 24, 60, 0, 12, -34, o), M('box', '#e6d4ad', 114, 3, 64, 0, 25.5, -34, o), M('box', cream, 30, 10, 24, 0, 31, -38, o), M(dome(9), gold, 1, 1, 1, 0, 36, -38, o));
  // gopuram
  g.add(M('box', '#e9dcc0', 68, 22, 32, 0, 11, 6, o), M('box', '#5a3a2a', 14, 18, 1.4, 0, 9, 21.4, o), M(half(7), '#5a3a2a', 1, 1, 1, 0, 18, 21.4, o));
  let y = 22;
  tiers.forEach((c, i) => {
    const w = 64 - i * 9, d = 30 - i * 3.4, h = 13 - i;
    g.add(M('box', c, w, h, d, 0, y + h / 2, 6, o), M('box', '#f8efd9', w + 2, 1.4, d + 2, 0, y + h, 6, o));
    const n = Math.max(2, 5 - i); for (let k = 0; k < n; k++) { const x = -w / 2 + 5 + k * ((w - 10) / (n - 1)); g.add(M('box', tiers[(i + k + 2) % 5], 2.6, h * .6, 1.6, x, y + h / 2, 6 + d / 2 + .8, o), M('sph', '#c98a5a', 1.3, 1.3, 1.3, x, y + h * .85, 6 + d / 2 + .8, { sat: o.sat, noShadow: 1 })); }
    y += h + 1.4;
  });
  // barrel top with five kalasams
  const top = M(new THREE.CylinderGeometry(7, 7, 18, 14, 1, false, 0, Math.PI), '#f3a6b8', 1, 1, 1, 0, y + .5, 6, o); top.rotation.z = Math.PI / 2; top.rotation.y = Math.PI / 2; g.add(top);
  for (let k = 0; k < 5; k++) g.add(M('cone', gold, 1.3, 5, 1.3, -8 + k * 4, y + 9, 6, o));
  // four swans on the second tier
  for (const x of [-21, -7, 7, 21]) g.add(M('sph', '#ffffff', 2.6, 1.9, 3.4, x, 38, 21, o), M('cyl8', '#ffffff', .7, 3.6, .7, x, 41, 22.8, o), M('sph', '#ffffff', 1.1, 1.1, 1.1, x, 43, 23.4, o), M('cone', '#f08a2c', .5, 1.4, .5, x, 43, 24.6, { sat: o.sat, noShadow: 1 }));
  for (const sx of [-1, 1]) g.add(M('box', '#f4efe6', 4, 6, 4, sx * 40, 3, 40, o), M('sph', gold, 2.2, 2.2, 2.2, sx * 40, 7.5, 40, o));
  palm(g, -66, 44, 26, o); palm(g, 66, 30, 28, o);
  return spots(g, { gopuram: [[0, y - 4, 6, 18], [0, 50, 6, 18]], swans: [[-14, 39, 22, 10], [14, 39, 22, 10]], door: [[0, 10, 21, 12]] });
}

/* Kapitan Keling Mosque: ochre-yellow hall, dark onion domes with gold finials, horseshoe-arch arcade, minaret */
function kapitan() {
  const g = G(), o = { sat: satFor('kapitan') }; const ochre = '#dcae55', trim = '#f6eedb', domeC = '#3d4247', gold = '#e2b23c', dark = '#6a4a2a';
  g.add(M('box', '#e3dccb', 170, 2, 150, 0, 1, 8, o));
  g.add(M('box', ochre, 110, 30, 66, 0, 15, -18, o), M('box', trim, 114, 3, 70, 0, 31.5, -18, o));
  for (let i = 0; i < 9; i++) g.add(M('box', trim, 5, 4, 5, -52 + i * 13, 35, 17, o));
  // front arcade with horseshoe arches
  g.add(M('box', ochre, 110, 20, 12, 0, 10, 20, o), M('box', trim, 112, 2.4, 14, 0, 21, 20, o));
  for (let i = 0; i < 5; i++) { const x = -40 + i * 20; g.add(M('box', dark, 11, 10, 1.4, x, 5.5, 26.4, o), M(half(6.4), dark, 1, 1, 1, x, 11, 26.4, o), M(half(7.6, 1.2), trim, 1, 1, 1, x, 11, 26.1, o)); }
  // domes
  const onion = (x: number, z: number, r: number, y0: number) => { g.add(M('cyl', ochre, r * .9, 8, r * .9, x, y0 + 4, z, o), M('sph', domeC, r, r * 1.05, r, x, y0 + 8 + r * .55, z, o), M('cone', domeC, r * .45, r * .9, r * .45, x, y0 + 8 + r * 1.4, z, o), M('cyl8', gold, .6, 5, .6, x, y0 + 10 + r * 1.9, z, o), M('sph', gold, 1.2, 1.2, 1.2, x, y0 + 12 + r * 2.1, z, o)); };
  onion(0, -18, 16, 33); onion(-42, 4, 7, 33); onion(42, 4, 7, 33); onion(-42, -40, 7, 33); onion(42, -40, 7, 33);
  // minaret
  g.add(M('cyl8', trim, 6, 70, 6, 70, 35, -44, o), M('cyl8', ochre, 7.4, 3, 7.4, 70, 50, -44, o), M('cyl8', ochre, 7.4, 3, 7.4, 70, 66, -44, o));
  g.add(M('cyl8', trim, 4.2, 10, 4.2, 70, 75, -44, o), M('sph', domeC, 5, 5.2, 5, 70, 82, -44, o), M('cone', domeC, 2.4, 5, 2.4, 70, 88, -44, o), M('cyl8', gold, .5, 5, .5, 70, 92, -44, o));
  palm(g, -74, 44, 28, o); tree(g, 70, 52, 1, o);
  return spots(g, { domes: [[0, 58, -18, 20], [-42, 54, 4, 9], [42, 54, 4, 9]], arches: [[-20, 9, 26, 10], [0, 9, 26, 10], [20, 9, 26, 10]], minaret: [[70, 60, -44, 11], [70, 84, -44, 10]] });
}

/* Armenian Street: shophouse row, an abstract wall mural (original shapes, not a copy of any artwork),
   a real bicycle against the wall and a parked trishaw */
function armenian() {
  const g = G(), o = { sat: satFor('armenian') }; const roof = '#c65b3c', dark = '#5a4b3b';
  const fronts = ['#f2e3a1', '#c9d9ee', '#f3c9b8', '#bfe0d2'];
  g.add(M('box', '#e7ddc4', 180, 2, 130, 0, 1, 4, o), M('box', '#d9ccae', 180, 1.6, 40, 0, 1.4, 42, { sat: o.sat, noShadow: 1 }));
  fronts.forEach((c, i) => {
    const x = -66 + i * 30 + (i > 1 ? 44 : 0);
    g.add(M('box', c, 28, 32, 46, x, 16, -24, o), M('prism', roof, 30, 10, 50, x, 32, -24, o));
    g.add(M('box', c, 28, 4, 10, x, 17, 4, o));
    for (const dx of [-12, 12]) g.add(M('box', '#f8efd9', 3, 15, 3, x + dx, 7.5, 7, o));
    g.add(M('box', '#4a5a5f', 6, 8, 1, x - 6, 24, -0.4, o), M('box', '#4a5a5f', 6, 8, 1, x + 6, 24, -0.4, o), M('box', dark, 14, 12, 1, x, 7, -0.4, o));
    g.add(M('box', ['#12384a', '#7a2a22', '#2f6f4a', '#5a3a6a'][i], 18, 4, 1.2, x, 14.5, -0.2, o));
  });
  // blank side wall with an abstract mural
  g.add(M('box', '#efe6d2', 44, 34, 40, 0, 17, -22, o), M('box', '#e3d8bf', 46, 2, 42, 0, 35, -22, o));
  const shapes: [string, number, number, number, number][] = [['#2f8fd1', -12, 22, 12, 10], ['#f3c22e', 8, 26, 14, 8], ['#e04535', -4, 12, 10, 12], ['#55b04f', 12, 12, 9, 9], ['#8e55c7', -15, 9, 6, 6], ['#f08a2c', 2, 30, 8, 4]];
  for (const [c, x, y, w, h] of shapes) g.add(M('box', c, w, h, .8, x, y, -1.4, { sat: o.sat, noShadow: 1 }));
  // bicycle leaning on the mural wall
  const wheel = new THREE.TorusGeometry(4.4, .7, 6, 18); const bk = G(); bk.position.set(0, 0, 3); bk.scale.setScalar(1.5); g.add(bk);
  for (const x of [-9, 3]) bk.add(M(wheel, '#2b2433', 1, 1, 1, x, 5, 0, o));
  const bar = (x: number, y: number, len: number, rz: number) => { const b = M('cyl8', '#c0392b', .6, len, .6, x, y, 0, o); b.rotation.z = rz; bk.add(b); };
  bar(-5.5, 7.5, 8, 1.1); bar(-1, 8, 8, -.4); bar(-3, 11, 9, Math.PI / 2); bar(1.5, 8.6, 7, .35);
  bk.add(M('box', '#2b2433', 3, 1, 2, -3.5, 12.4, 0, o), M('box', '#2b2433', 1, 1, 5, 3.5, 12.4, 0, o));
  // trishaw (beca)
  const t = G(); t.add(M('box', '#2f6f4a', 16, 3, 12, 0, 8, 0, o), M('box', '#c0392b', 14, 8, 1.6, 0, 13, -5.4, o), M('box', '#e8d7b0', 14, 2, 10, 0, 10.5, 0, o));
  t.add(M(half(8, 12), '#2f6f4a', 1, 1, 1, 0, 16, -1, o));
  for (const z of [-6.5, 6.5]) { const w = M(wheel, '#2b2433', 1.1, 1.1, 1.1, 0, 5, z, o); w.rotation.y = Math.PI / 2; t.add(w); }
  const rw = M(wheel, '#2b2433', 1, 1, 1, -16, 5, 0, o); rw.rotation.y = Math.PI / 2; t.add(rw, M('cyl8', '#2b2433', .6, 16, .6, -9, 8, 0, o), M('box', '#2b2433', 4, 1, 3, -15, 13, 0, o));
  t.position.set(48, 0, 34); t.rotation.y = -.5; g.add(t);
  tree(g, -82, 40, .9, o); g.add(M('cyl8', '#7a6a55', 1, 22, 1, 70, 11, 18, o), M('box', '#3b2f2a', 6, 3, 3, 70, 22, 18, o));
  return spots(g, { bicycle: [[-4, 11, 4, 14]], trishaw: [[44, 10, 32, 14]], mural: [[0, 20, -1, 18]] });
}

export const BUILDERS2: Record<string, () => THREE.Group> = { bluemansion, esplanade, peranakan, kuanyin, mariamman, kapitan, armenian };
export const MODEL_OFFSET2: Record<string, [number, number]> = { bluemansion: [0, -36], esplanade: [0, -30], peranakan: [0, -36], kuanyin: [0, -36], mariamman: [0, -36], kapitan: [0, -36], armenian: [0, -30] };
export const LABEL_H2: Record<string, number> = { bluemansion: 64, esplanade: 76, peranakan: 62, kuanyin: 80, mariamman: 96, kapitan: 104, armenian: 52 };
