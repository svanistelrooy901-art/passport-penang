/* Station models (toon miniature). Each builder returns a group in local units around the station anchor.
   Detailed: Komtar, Clan Jetties, Fort Cornwallis. Simplified for now: Khoo Kongsi, Chowrasta. */
import * as THREE from 'three';
import { M, G, GEO, mat, canvasTex, type Sat } from './core';
import { ZONE } from '../content';

export const SAT: Record<string, Sat> = {};
export const satFor = (id: string) => SAT[id] || (SAT[id] = { k: id, u: { value: .38 } });
const towerTex = canvasTex(16, 256, (g, w) => { for (let i = 0; i < 64; i++) { g.fillStyle = '#ece5d6'; g.fillRect(0, i * 4, w, 4); g.fillStyle = '#6d7a84'; g.fillRect(0, i * 4 + 2.6, w, 1.4); } }, true);

function palm(g: THREE.Group, x: number, z: number, h: number, o: any) {
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
  const g = G(), o = { sat: satFor('kho') };
  g.add(M('box', '#d8d3c6', 210, 2, 176, 0, 1, 10, o), M('box', '#cbc2b1', 140, 10, 108, 0, 5, -10, o), M('box', '#ecdfc7', 118, 28, 74, 0, 24, -14, o));
  for (let i = 0; i < 6; i++) g.add(M('cyl', '#a8312b', 3, 28, 3, -50 + i * 20, 24, 25, o));
  g.add(M('box', '#b8312b', 120, 4, 3, 0, 37, 25, o));
  g.add(M('prism', '#5d6a66', 134, 20, 92, 0, 38, -14, o), M('box', '#ecdfc7', 96, 10, 58, 0, 47, -14, o), M('prism', '#5d6a66', 108, 22, 70, 0, 57, -14, o));
  g.add(M('box', '#2f8f6f', 104, 4, 5, 0, 79, -14, o), M('box', '#e2a93f', 100, 2, 5.4, 0, 82, -14, o), M('box', '#c0392b', 80, 2.5, 3, 0, 38.5, 32, o));
  for (const sx of [-1, 1]) { const d = M('cone', '#e2a93f', 3.6, 14, 3.6, sx * 54, 86, -14, o); d.rotation.z = sx * -.5; g.add(d); const d2 = M('cone', '#2f8f6f', 3, 10, 3, sx * 68, 60, -14, o); d2.rotation.z = sx * -.7; g.add(d2); }
  for (const [x, z] of [[-66, 32], [66, 32], [-66, -60], [66, -60]]) { const c = M('cone', '#5d6a66', 3.4, 12, 3.4, x, 42, z, o); c.rotation.z = x < 0 ? .75 : -.75; g.add(c); }
  for (let i = 0; i < 4; i++) g.add(M('box', '#d9d3c4', 60 - i * 4, 10 - i * 2.4, 9, 0, 5 - i * 1.2, 48 + i * 9, o));
  g.add(M('cyl8', '#3f6b55', 6, 12, 6, -45, 8, 62, o), M('cyl8', '#3f6b55', 6, 12, 6, 45, 8, 62, o));
  for (let i = 0; i < 4; i++) g.add(M('sph', '#e04535', 3, 3.6, 3, -30 + i * 20, 33, 29, { sat: o.sat, noShadow: 1 }));
  return g;
}
function chowrasta() {
  const g = G(), o = { sat: satFor('chowrasta') };
  g.add(M('box', '#e9dfc6', 200, 2, 170, 0, 1, 10, o));
  g.add(M('box', '#efe3c8', 160, 30, 84, 0, 15, -20, o), M('prism', '#b8452f', 166, 30, 90, 0, 30, -20, o), M('box', '#f4ead4', 164, 14, 5, 0, 34, 23, o), M('box', '#f4ead4', 40, 22, 5, 0, 38, 23.5, o));
  for (let i = 0; i < 4; i++) g.add(M('box', '#8f3a28', 10, 8, 12, -54 + i * 36, 52, -20, o));
  for (let i = 0; i < 3; i++) g.add(M('box', '#5a4b3b', 20, 18, 2, -50 + i * 50, 10, 25.5, o));
  ['#f3c22e', '#2f6fb0', '#e04535', '#2f8f6f', '#f08a2c', '#e04535'].forEach((c, i) => { const x = -75 + i * 30, z = 55 + (i % 2) * 18; g.add(M('box', '#b0895c', 14, 10, 10, x, 5, z, o), M('cyl8', '#8d8d8d', .8, 18, .8, x, 14, z, o), M('cone', c, 13, 7, 13, x, 25, z, o)); });
  palm(g, -92, -10, 26, o); palm(g, 95, -30, 28, o);
  return g;
}
export const BUILDERS: Record<string, () => THREE.Group> = { komtar, jetty, fort, kho, chowrasta };
/* offset of the model centre from the ground anchor; 'trigger' places the jetty from its shore point out to sea */
export const MODEL_OFFSET: Record<string, [number, number] | 'trigger'> = { komtar: [0, -58], jetty: 'trigger', fort: [0, -62], kho: [0, -52], chowrasta: [0, -50] };
export const LABEL_H: Record<string, number> = { komtar: 300, jetty: 46, fort: 104, kho: 86, chowrasta: 64 };
