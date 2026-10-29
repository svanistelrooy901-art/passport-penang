/* Station models (toon miniature). Each builder returns a group in local units around the station anchor.
   The original five live here; Phase 2 stations are in stations2.ts. */
import * as THREE from 'three';
import { M, G, GEO, mat, canvasTex, patch, gradient, type Sat } from './core';
import { ZONE } from '../content';
import { BUILDERS2, MODEL_OFFSET2, LABEL_H2 } from './stations2';

export const SAT: Record<string, Sat> = {};
export const satFor = (id: string) => SAT[id] || (SAT[id] = { k: id, u: { value: .38 } });
const towerTex = canvasTex(16, 256, (g, w) => { for (let i = 0; i < 64; i++) { g.fillStyle = '#ece5d6'; g.fillRect(0, i * 4, w, 4); g.fillStyle = '#6d7a84'; g.fillRect(0, i * 4 + 2.6, w, 1.4); } }, true);

export function palm(g: THREE.Group, x: number, z: number, h: number, o: any) {
  g.add(M('cyl8', '#8a6a44', 1.6, h, 1.6, x, h / 2, z, o));
  for (let i = 0; i < 6; i++) { const l = M('box', '#4f8f4a', 3, 1, 15, x, h, z, o); l.rotation.y = i * Math.PI / 3; l.rotation.x = .35; l.position.x += Math.sin(i * Math.PI / 3) * 6; l.position.z += Math.cos(i * Math.PI / 3) * 6; g.add(l); }
}
function komtar() {
  const g = G(), o = { sat: satFor('komtar') };
  g.add(M('box', '#efe9dc', 170, 22, 118, 0, 11, 0, o), M('box', '#7fa6b8', 152, 13, 104, 0, 28.5, 0, o), M('box', '#f4efe6', 140, 16, 94, 0, 43, 0, o), M('box', '#90bf6c', 118, 3, 74, 0, 52.5, 0, o));
  for (let i = 0; i < 6; i++) g.add(M('box', '#5d7f91', 16, 10, 1.5, -60 + i * 24, 15, 59.5, o));
  const tw = new THREE.Mesh(new THREE.CylinderGeometry(27, 27, 206, 28, 1, true), mat('#ffffff', { map: towerTex, sat: o.sat })); tw.position.set(0, 155, -6); tw.castShadow = true; g.add(tw);
  ['#e4403b', '#f08a2c', '#f3c22e', '#55b04f', '#2f8fd1', '#8e55c7'].forEach((c, i) => { const s = new THREE.Mesh(new THREE.CylinderGeometry(28, 28, 10, 8, 1, false, i * Math.PI / 3, Math.PI / 3), mat(c, o)); s.position.set(0, 252, -6); s.castShadow = true; g.add(s); });
  g.add(M('cyl', '#f4efe6', 30, 8, 30, 0, 261, -6, o), M('cyl', '#dfe4e6', 19, 10, 19, 0, 270, -6, o), M('cyl8', '#9aa3a8', 1.4, 28, 1.4, 0, 289, -6, o));
  ['#f2e3a1', '#c9d9ee', '#f3c9b8', '#bfe0d2'].forEach((c, i) => { g.add(M('box', c, 20, 20, 24, -74 + i * 21, 10, 72, o), M('prism', '#d0623f', 22, 8, 27, -74 + i * 21, 20, 72, o)); });
  palm(g, 70, 74, 30, o); palm(g, -95, 30, 26, o); palm(g, 92, 40, 28, o);
  return g;
}
function jetty() {
  const g = G(), o = { sat: satFor('jetty') };
  const [tx, ty] = ZONE.triggers.jetty, [ax0, ay0] = ZONE.landmarks.jetty; const th = Math.atan2(ay0 - ty, ax0 - tx);
  g.userData.theta = th;
  const wood = ['#8b5e3c', '#a8744a', '#6f4c32', '#9a6a44', '#b98a5c'], roofs = ['#8f9aa0', '#b0472e', '#7f8b92', '#a03f2a', '#97a3a9'];
  g.add(M('box', '#a27a4f', 250, 3, 18, 95, -1.5, 0, o));
  for (let x = -25; x < 220; x += 10) g.add(M('box', '#8a6440', 1.2, 3.2, 18.2, x, -1.4, 0, { sat: o.sat, noShadow: 1 }));
  const st = new THREE.InstancedMesh(GEO.cyl8, mat('#5f442c', o), 120); let k = 0; const ob = new THREE.Object3D();
  const addStilt = (x: number, z: number) => { if (k < 120) { ob.position.set(x, -8, z); ob.scale.set(1.8, 13, 1.8); ob.updateMatrix(); st.setMatrixAt(k++, ob.matrix); } };
  for (let x = -20; x <= 220; x += 24) { addStilt(x, -9); addStilt(x, 9); }
  const houses = [[20, -1], [60, -1], [100, -1], [140, -1], [180, -1], [35, 1], [75, 1], [115, 1], [155, 1]];
  houses.forEach(([hx, side], i) => {
    const hz = side * 31; const h = 19 + (i % 3) * 3;
    g.add(M('box', '#8c6845', 36, 3, 34, hx, -1.5, hz, o), M('box', wood[i % 5], 30, h, 24, hx, h / 2, hz, o), M('prism', roofs[i % 5], 34, 10, 30, hx, h, hz, o));
    g.add(M('box', '#3f4c52', 7, 8, 1, hx - 6, h * .55, hz - side * 12.4, o), M('box', '#3f4c52', 7, 8, 1, hx + 7, h * .55, hz - side * 12.4, o));
    for (const [dx, dz] of [[-15, -14], [15, -14], [-15, 14], [15, 14]]) addStilt(hx + dx, hz + dz);
  });
  st.count = k; st.castShadow = true; g.add(st);
  const boat = (x: number, z: number, c1: string, c2: string, ry: number) => {
    const b = G(); b.add(M('box', c1, 30, 6, 11, 0, -4, 0, o), M('box', c2, 30, 1.6, 11.4, 0, -1.6, 0, o));
    const c = M('cone', c1, 5.5, 10, 5.5, 17, -4, 0, o); c.rotation.z = -Math.PI / 2; b.add(c, M('box', '#f3c46a', 8, 4, 7, -4, 1, 0, o));
    b.position.set(x, 0, z); b.rotation.y = ry; g.add(b);
  };
  boat(235, -22, '#2f6fb0', '#e9e2d0', .25); boat(205, 30, '#c0392b', '#2f6fb0', -.2);
  g.add(M('box', '#b8312b', 14, 12, 12, 222, 6, 0, o), M('prism', '#e2a93f', 18, 6, 16, 222, 12, 0, o));
  for (let i = 0; i < 6; i++) g.add(M('sph', '#e04535', 2.4, 3, 2.4, 10 + i * 36, 14, i % 2 ? 10 : -10, { sat: o.sat, noShadow: 1 }));
  g.rotation.y = -th;
  return g;
}
function fort() {
  const g = G(), o = { sat: satFor('fort') }; const brick = '#b9643f';
  g.add(M('box', '#9fcf74', 196, 2, 146, 0, 1, 0, o));
  g.add(M('box', brick, 210, 16, 10, 0, 8, -75, o), M('box', brick, 210, 16, 10, 0, 8, 75, o), M('box', brick, 10, 16, 150, -105, 8, 0, o), M('box', brick, 10, 16, 150, 105, 8, 0, o));
  for (const [x, z] of [[-105, -75], [105, -75], [-105, 75], [105, 75]]) { const b = M('box', brick, 34, 18, 34, x, 9, z, o); b.rotation.y = Math.PI / 4; g.add(b); }
  g.add(M('box', '#efe5cf', 30, 24, 14, 30, 12, 76, o), M('box', '#4a3a2c', 12, 14, 15, 30, 7, 76, o));
  g.add(M('box', '#f4f1ea', 54, 18, 28, 38, 9, -22, o), M('prism', '#c8513a', 58, 10, 32, 38, 18, -22, o));
  for (let i = 0; i < 4; i++) g.add(M('box', '#5a6b70', 5, 7, 1, 18 + i * 13, 10, -7.5, o));
  const lx = -40, lz = -25, H = 78;
  for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const leg = M('box', '#e9ecef', 2, H + 2, 2, lx + sx * 8, H / 2, lz + sz * 8, o); leg.rotation.z = -sx * .09; leg.rotation.x = sz * .09; g.add(leg); }
  for (let i = 1; i < 6; i++) { const w = 16 - i * 1.9; g.add(M('box', '#e9ecef', w * 2, 1.4, 1.4, lx, i * H / 6, lz - w, o), M('box', '#e9ecef', w * 2, 1.4, 1.4, lx, i * H / 6, lz + w, o), M('box', '#e9ecef', 1.4, 1.4, w * 2, lx - w, i * H / 6, lz, o), M('box', '#e9ecef', 1.4, 1.4, w * 2, lx + w, i * H / 6, lz, o)); }
  g.add(M('cyl', '#f4f1ea', 7, 10, 7, lx, H + 5, lz, o), M('cone', '#2b3a42', 8, 8, 8, lx, H + 14, lz, o), M('box', '#e9ecef', 20, 1.5, 20, lx, H, lz, o));
  for (const [x, z, r] of [[-70, -76, 0], [-30, -76, 0], [60, -76, 0], [-106, -30, Math.PI / 2], [-106, 30, Math.PI / 2], [106, 10, Math.PI / 2]]) { const c = M('cyl8', '#2b2a2e', 2.6, 18, 2.6, x, 19, z, o); c.rotation.set(Math.PI / 2, 0, r); g.add(c); }
  palm(g, -80, 40, 28, o); palm(g, 85, -50, 30, o); palm(g, 70, 45, 26, o);
  return g;
}
function kho() {
  const g = G(), o = { sat: satFor('kho') }; const roof = '#4f5d5a', wall = '#efe2c9', red = '#a8312b', gold = '#d9a23c';
  g.add(M('box', '#d6d0c2', 220, 2, 190, 0, 1, 10, o));
  g.add(M('box', '#c9bfae', 150, 12, 96, 0, 6, -14, o), M('box', '#b3a894', 152, 2, 98, 0, 12, -14, o));
  for (let i = 0; i < 5; i++) { const h = 12 - i * 2.4; g.add(M('box', '#d9d3c4', 54, h, 8, 0, h / 2, 38 + i * 8, o)); }
  g.add(M('box', '#c9bfae', 4, 7, 42, -29, 6, 52, o), M('box', '#c9bfae', 4, 7, 42, 29, 6, 52, o));
  // main hall + porch
  g.add(M('box', wall, 112, 30, 70, 0, 27, -18, o));
  for (let i = 0; i < 6; i++) g.add(M('cyl', red, 3.2, 30, 3.2, -50 + i * 20, 27, 22, o));
  for (const x of [-30, 0, 30]) g.add(M('box', '#8e2a24', 14, 18, 1, x, 21, 17.4, o));
  g.add(M('box', gold, 116, 5, 4, 0, 40, 22, o), M('box', red, 120, 3, 8, 0, 43.5, 20, o));
  // side wings
  for (const sx of [-1, 1]) { g.add(M('box', wall, 34, 20, 60, sx * 76, 22, -14, o), M('prism', roof, 40, 10, 66, sx * 76, 32, -14, o), M('box', red, 30, 2, 2, sx * 76, 28, 16.5, o)); }
  // two-tier roof
  g.add(M('prism', roof, 136, 18, 98, 0, 42, -18, o), M('box', wall, 84, 8, 50, 0, 52, -18, o), M('prism', roof, 98, 20, 62, 0, 56, -18, o));
  for (const [x, z] of [[-66, 30], [66, 30], [-66, -66], [66, -66]]) { const c = M('cone', roof, 3.4, 12, 3.4, x, 46, z, o); c.rotation.z = x < 0 ? .75 : -.75; g.add(c); }
  // swallowtail ridge with ceramic ornaments
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-60, 16, 0), new THREE.Vector3(-50, 5, 0), new THREE.Vector3(-25, 0, 0), new THREE.Vector3(25, 0, 0), new THREE.Vector3(50, 5, 0), new THREE.Vector3(60, 16, 0)]);
  g.add(M(new THREE.TubeGeometry(curve, 40, 2.6, 6, false), '#2f8f6f', 1, 1, 1, 0, 76, -18, o));
  g.add(M(new THREE.TubeGeometry(curve, 40, 1.3, 6, false), gold, .98, 1, 1, 0, 79.2, -18, o));
  ['#e2a93f', '#c0392b', '#2f6fb0', '#2f8f6f', '#f3c22e', '#c0392b', '#2f6fb0'].forEach((c, i) => g.add(M('sph', c, 2.4, 3.2, 2.4, -36 + i * 12, 81.5, -18, o)));
  const lowCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(-70, 9, 0), new THREE.Vector3(-58, 1, 0), new THREE.Vector3(58, 1, 0), new THREE.Vector3(70, 9, 0)]);
  g.add(M(new THREE.TubeGeometry(lowCurve, 30, 1.8, 6, false), '#2f8f6f', 1, 1, 1, 0, 60, 31, o));
  // lanterns, urns
  for (let i = 0; i < 5; i++) { const x = -40 + i * 20; g.add(M('sph', '#e04535', 3.4, 4, 3.4, x, 36, 25, o), M('cyl8', gold, .8, 4, .8, x, 31, 25, o)); }
  g.add(M('cyl8', '#3f6b55', 6, 12, 6, -45, 8, 66, o), M('cyl8', '#3f6b55', 6, 12, 6, 45, 8, 66, o), M('cyl8', '#2f5544', 6.6, 1.6, 6.6, -45, 14.5, 66, o), M('cyl8', '#2f5544', 6.6, 1.6, 6.6, 45, 14.5, 66, o));
  return g;
}
function chowrasta() {
  const g = G(), o = { sat: satFor('chowrasta') }; const cream = '#f1e4c6', trim = '#f8efd9', dark = '#5a4b3b';
  g.add(M('box', '#e7ddc4', 210, 2, 180, 0, 1, 10, o));
  g.add(M('box', cream, 168, 34, 86, 0, 17, -20, o), M('box', '#e8d7b0', 172, 3, 90, 0, 34, -20, o));
  // arcade: pillars, arch openings with round tops
  for (let i = 0; i < 8; i++) g.add(M('box', trim, 6, 22, 6, -84 + i * 24, 11, 23.5, o));
  const half = new THREE.CylinderGeometry(9, 9, 1.6, 16, 1, false, -Math.PI / 2, Math.PI); half.rotateX(Math.PI / 2);
  for (let i = 0; i < 7; i++) { const x = -72 + i * 24; g.add(M('box', dark, 18, 14, 1.5, x, 7, 23.6, o), M(half, dark, 1, 1, 1, x, 14, 23.6, o)); }
  for (let i = 0; i < 7; i++) { const x = -72 + i * 24; g.add(M('box', '#7fa6b8', 11, 8, 1, x, 27, 23.4, o), M('box', '#5f8f6f', 3, 8, 1.2, x - 7, 27, 23.4, o), M('box', '#5f8f6f', 3, 8, 1.2, x + 7, 27, 23.4, o)); }
  // front gable + parapet
  const gable = M('prism', trim, 6, 16, 52, 0, 35.5, 21.5, o); gable.rotation.y = Math.PI / 2; g.add(gable);
  g.add(M('box', trim, 172, 5, 4, 0, 37, 23, o), M('box', '#12384a', 34, 5, 1, 0, 31, 23.8, o));
  // hip roof with skylight
  g.add(M('prism', '#b8452f', 172, 22, 94, 0, 35.5, -20, o), M('box', '#9fc6d4', 120, 2.5, 10, 0, 57, -20, o));
  for (let i = 0; i < 4; i++) g.add(M('box', '#8f3a28', 8, 6, 10, -54 + i * 36, 50, -20, o));
  // stalls, umbrellas, carts
  ['#f3c22e', '#2f6fb0', '#e04535', '#2f8f6f', '#f08a2c', '#e04535'].forEach((c, i) => {
    const x = -75 + i * 30, z = 55 + (i % 2) * 18;
    g.add(M('box', '#b0895c', 14, 9, 10, x, 4.5, z, o), M('cyl8', '#8d8d8d', .8, 18, .8, x, 14, z, o), M('cone', c, 13, 7, 13, x, 25, z, o));
  });
  for (const x of [-40, 40]) { g.add(M('box', '#3e7d5e', 16, 10, 9, x, 9, 86, o), M('cyl8', '#2b2433', 3, 2, 3, x - 5, 3, 91, o), M('cyl8', '#2b2433', 3, 2, 3, x + 5, 3, 91, o), M('box', '#f3c46a', 18, 1.5, 11, x, 15, 86, o)); }
  for (const [x, z] of [[-92, 70], [92, 64]]) { g.add(M('cyl8', '#7a5a3a', 2.6, 20, 2.6, x, 10, z, o)); const c = M('ico', '#6fa45a', 16, 13, 16, x, 28, z, o); g.add(c); g.add(M('ico', '#82b866', 11, 9, 11, x + 6, 34, z - 4, o)); }
  palm(g, -100, -20, 28, o); palm(g, 102, -36, 30, o);
  return g;
}
/* one vertex-coloured toon material per station so its saturation can follow the stamp tier */
const VC: Record<string, THREE.Material> = {};
export function stationMat(id: string) {
  return VC[id] || (VC[id] = patch(new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient }), satFor(id).u));
}
export const BUILDERS: Record<string, () => THREE.Group> = { komtar, jetty, fort, kho, chowrasta, ...BUILDERS2 };
/* offset of the model centre from the ground anchor; 'trigger' places the jetty from its shore point out to sea */
export const MODEL_OFFSET: Record<string, [number, number] | 'trigger'> = { komtar: [0, -58], jetty: 'trigger', fort: [0, -62], kho: [0, -52], chowrasta: [0, -50], ...MODEL_OFFSET2 };
export const LABEL_H: Record<string, number> = { komtar: 300, jetty: 46, fort: 104, kho: 96, chowrasta: 64, ...LABEL_H2 };
