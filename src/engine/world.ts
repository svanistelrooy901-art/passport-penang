/* Zone world: raised diorama island from the approved coastline, instanced shophouses and trees,
   station models, cats, ferry, signposts, DOM labels and the reveal state. */
import * as THREE from 'three';
import { scene, patch, gradient, mat, M, G, GEO, canvasTex, REV, REVN, project, camera, addOutline } from './core';
import { bakeDeep, bakeChildren, disposeTree } from './bake';
import { BUILDERS, MODEL_OFFSET, LABEL_H, SAT, stationMat } from './stations';
import { makeChar, poseChar, faceTo } from './character';
import { ZONE, W3, IDS, STATIONS } from '../content';
import { save, tierOf } from '../game/save';
import { player, npcs } from '../game/state';
import { L } from '../i18n';

const PASTEL = ['#f2e3a1', '#bfe0d2', '#f3c9b8', '#c9d9ee', '#f5efe1', '#e7c98e', '#cfe4b4'];
const ROOFC = ['#c65b3c', '#b94e33', '#d06a45', '#a9472f', '#c97a4c'];
export const landmarkGroups: Record<string, THREE.Group> = {};
export const catMeshes: THREE.Group[] = [];
export let ferryG: THREE.Group; let waterFx: THREE.Mesh; let destMark: THREE.Mesh;
export let playerMesh: THREE.Group; export const npcMeshes: THREE.Group[] = [];

const facadeTex = canvasTex(64, 64, (g, w, h) => {
  g.fillStyle = '#fff'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#55656b'; g.fillRect(10, 10, 14, 14); g.fillRect(40, 10, 14, 14);
  g.fillStyle = '#7fa58f'; for (const x of [8, 23, 38, 53]) g.fillRect(x, 10, 3, 14);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, 34, w, 3); g.fillStyle = '#6b5a48';
  for (const x of [6, 36]) { g.beginPath(); g.moveTo(x, 64); g.lineTo(x, 48); g.arc(x + 11, 48, 11, Math.PI, 0); g.lineTo(x + 22, 64); g.fill(); }
  g.fillStyle = 'rgba(0,0,0,.12)'; g.fillRect(0, 0, w, 3);
});
const roofTileTex = canvasTex(32, 32, (g, w, h) => { g.fillStyle = '#fff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(0,0,0,.16)'; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 1.5); }, true);
roofTileTex.repeat.set(1, 3);

function buildIsland(groundT: THREE.Texture, seaT: THREE.Texture) {
  const W = W3.w, H = W3.h;
  const deep = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.MeshLambertMaterial({ color: '#2a8fab' })); deep.rotation.x = -Math.PI / 2; deep.position.set(W / 2, -9, H / 2); deep.receiveShadow = true; scene.add(deep);
  const seaP = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshLambertMaterial({ map: seaT })); seaP.rotation.x = -Math.PI / 2; seaP.position.set(W / 2, -8.8, H / 2); seaP.receiveShadow = true; scene.add(seaP);
  waterFx = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { t: { value: 0 } },
    vertexShader: 'varying vec2 vP;void main(){vec4 w=modelMatrix*vec4(position,1.0);vP=w.xz;gl_Position=projectionMatrix*viewMatrix*w;}',
    fragmentShader: 'uniform float t;varying vec2 vP;void main(){float a=sin(vP.x*.045+t*1.3+sin(vP.y*.03+t*.7)*2.0)*sin(vP.y*.06-t*1.1);float l=smoothstep(.86,.97,a);gl_FragColor=vec4(1.0,1.0,1.0,l*.32);}',
  }));
  waterFx.rotation.x = -Math.PI / 2; waterFx.position.set(W / 2, -6.5, H / 2); scene.add(waterFx);
  const groundMat = patch(new THREE.MeshToonMaterial({ map: groundT, gradientMap: gradient }));
  const side = mat('#c9ad7c');
  for (const poly of W3.coast) {
    const shape = new THREE.Shape(poly.map((p: number[]) => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 14, bevelEnabled: true, bevelThickness: 2, bevelSize: 2, bevelSegments: 1, curveSegments: 1 });
    g.rotateX(Math.PI / 2);
    const pos = g.attributes.position, uv = g.attributes.uv;
    for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / W, 1 - pos.getZ(i) / H);
    const m = new THREE.Mesh(g, [groundMat, side]); m.receiveShadow = true; scene.add(m);
  }
  const plank = mat('#a27a4f');
  for (const poly of W3.decks) {
    const shape = new THREE.Shape(poly.map((p: number[]) => new THREE.Vector2(p[0], p[1])));
    const g = new THREE.ExtrudeGeometry(shape, { depth: 3, bevelEnabled: false }); g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, plank); m.receiveShadow = m.castShadow = true; scene.add(m);
  }
}
function buildHouses() {
  const a = W3.angle, ca = Math.cos(a), sa = Math.sin(a); const list: any[] = [];
  for (const [x, y, w, d, h, pc, rc] of W3.houses) {
    const hd = d / 2;
    for (const side of [1, -1]) {
      const cx = x + (-sa) * side * hd / 2, cz = y + ca * side * hd / 2; const hh = (h + 12) + (side < 0 ? ((pc * 7) % 9) - 4 : 0);
      list.push({ cx, cz, w, d: hd - 3, h: hh, pc: (pc + (side < 0 ? 3 : 0)) % 7, rc: (rc + (side < 0 ? 2 : 0)) % 5, rot: -a + (side > 0 ? 0 : Math.PI) });
    }
  }
  const wallM = patch(new THREE.MeshToonMaterial({ map: facadeTex, gradientMap: gradient }));
  const roofM = patch(new THREE.MeshToonMaterial({ map: roofTileTex, gradientMap: gradient, side: THREE.DoubleSide }));
  const walls = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, .5, 0), wallM, list.length);
  const roofs = new THREE.InstancedMesh(GEO.prism, roofM, list.length);
  const o = new THREE.Object3D(), c = new THREE.Color();
  list.forEach((p, i) => {
    o.position.set(p.cx, 0, p.cz); o.rotation.set(0, p.rot, 0); o.scale.set(p.w, p.h, p.d); o.updateMatrix(); walls.setMatrixAt(i, o.matrix); walls.setColorAt(i, c.set(PASTEL[p.pc]));
    o.position.y = p.h; o.scale.set(p.w + 3, 11 + (p.pc % 3) * 2, p.d + 5); o.updateMatrix(); roofs.setMatrixAt(i, o.matrix); roofs.setColorAt(i, c.set(ROOFC[p.rc]));
  });
  walls.castShadow = roofs.castShadow = walls.receiveShadow = roofs.receiveShadow = true; scene.add(walls, roofs);
  addOutline(walls, .9); addOutline(roofs, .9);
}
function buildTrees() {
  const n = W3.trees.length; const can = new THREE.InstancedMesh(GEO.ico, mat('#ffffff', { flat: true }), n * 2); const tr = new THREE.InstancedMesh(GEO.cyl8, mat('#7a5a3a'), n);
  const o = new THREE.Object3D(), c = new THREE.Color(); const greens = ['#6fa45a', '#82b866', '#5d9450', '#94c46e']; let k = 0;
  W3.trees.forEach(([x, y, r]: number[], i: number) => {
    o.position.set(x, 9, y); o.rotation.set(0, 0, 0); o.scale.set(2.4, 18, 2.4); o.updateMatrix(); tr.setMatrixAt(i, o.matrix);
    for (let j = 0; j < 2; j++) { o.position.set(x + (j ? r * .3 : -r * .2), 20 + r * .55 + j * 6, y + (j ? -r * .2 : r * .15)); o.rotation.set(i * .7, i * 1.3 + j, 0); const s = r * (j ? .75 : 1.05); o.scale.set(s, s * .85, s); o.updateMatrix(); can.setMatrixAt(k, o.matrix); can.setColorAt(k++, c.set(greens[(i + j) % 4])); }
  });
  can.castShadow = tr.castShadow = true; scene.add(can, tr); addOutline(can, .8, '#2f4a2a');
}
function buildStations() {
  for (const id of IDS) {
    const g = BUILDERS[id](); const [x, y] = ZONE.landmarks[id]; const off = MODEL_OFFSET[id];
    if (off === 'trigger') { const [tx, ty] = ZONE.triggers[id]; g.position.set(tx + 18 * Math.cos(g.userData.theta), 0, ty + 18 * Math.sin(g.userData.theta)); }
    else g.position.set(x + off[0], 0, y + off[1]);
    scene.add(g); bakeDeep(g, stationMat(id));
    const meshes: THREE.Mesh[] = []; g.traverse((m: any) => { if (m.isMesh && !m.userData.outline) meshes.push(m); }); meshes.forEach(m => addOutline(m, 1.1));
    g.userData.id = id; g.traverse(m => { m.userData.id = id; }); landmarkGroups[id] = g;
  }
}
const CAT3 = [['#e8964a', '#f7d3a8'], ['#2b2433', '#55505e'], ['#f4efe6', '#d9cfc0'], ['#9a8f84', '#c9c0b5'], ['#e8964a', '#f4efe6'], ['#2b2433', '#f4efe6'], ['#d9a36a', '#f4efe6'], ['#9a8f84', '#2b2433']];
function buildCats() {
  ZONE.cats.forEach((p, i) => {
    const [a, b] = CAT3[i % 8]; const g = G();
    g.add(M('sph', a, 6, 5.5, 8, 0, 5.5, 0), M('sph', b, 3.4, 3.6, 1.5, 0, 5, 6.6), M('sph', a, 5, 4.6, 4.6, 0, 13, 5), M('cone', a, 1.8, 4, 1.6, -2.6, 18.5, 5), M('cone', a, 1.8, 4, 1.6, 2.6, 18.5, 5));
    g.add(M('sph', '#2b2433', .8, .9, .6, -1.8, 13.6, 9.3, { noShadow: 1 }), M('sph', '#2b2433', .8, .9, .6, 1.8, 13.6, 9.3, { noShadow: 1 }));
    const tl = M('cyl8', a, 1.2, 12, 1.2, 0, 9, -8); tl.rotation.x = -.6; tl.userData.keep = true; g.add(tl); g.userData.tail = tl;
    g.position.set(p[0], 0, p[1]); g.rotation.y = (i * 1.7) % 6.28; g.scale.setScalar(1.1); scene.add(g);
    const body = bakeChildren(g, VCMAT); if (body) addOutline(body, .5); addOutline(tl, .5);
    catMeshes[i] = g; g.visible = !save.cats.includes(i);
  });
}
function buildFerry() {
  const g = G(); g.add(M('box', '#f4f1ea', 70, 10, 24, 0, -2, 0), M('box', '#2f6fb0', 72, 3, 25, 0, -6, 0), M('box', '#f4f1ea', 44, 10, 20, -4, 8, 0), M('box', '#f3c46a', 46, 2, 21, -4, 14, 0));
  const bow = M('cone', '#f4f1ea', 12, 14, 12, 40, -2, 0); bow.rotation.z = -Math.PI / 2; g.add(bow);
  for (let i = 0; i < 5; i++) g.add(M('box', '#4d6a78', 5, 4, 1, -20 + i * 8, 9, 10.3, { noShadow: 1 }));
  ferryG = g; scene.add(g); const fm = bakeDeep(g, VCMAT); if (fm) addOutline(fm, 1);
}
function post(x: number, y: number) { const g = G(); g.add(M('cyl8', '#5c4630', 1.6, 30, 1.6, 0, 15, 0), M('box', '#12384a', 26, 12, 2, 0, 32, 0)); g.position.set(x, 0, y); scene.add(g); const m = bakeDeep(g, VCMAT); if (m) addOutline(m, .7); }
const VCMAT = new THREE.MeshToonMaterial({ vertexColors: true, gradientMap: gradient });

/* ---------- clouds: drift around the edges of the zone, never over the play area ---------- */
const clouds: THREE.Mesh[] = [];
function buildClouds() {
  const cm = new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: gradient, transparent: true, opacity: .94 });
  const W = W3.w, H = W3.h; const spots = [[-260, 200], [-320, 900], [-240, 1600], [2300, 300], [2380, 1050], [2260, 1750], [400, -300], [1300, -340], [700, 2150], [1600, 2120]];
  spots.forEach(([x, z], i) => {
    const g = G(); const n = 5 + (i % 3);
    for (let k = 0; k < n; k++) { const r = 34 + ((i * 7 + k * 13) % 30); g.add(M('ico', '#ffffff', r, r * .62, r * .9, (k - n / 2) * 42 + ((k * 17) % 20), ((k * 5) % 3) * 8, ((k * 11) % 5) * 12 - 24)); }
    const m = bakeDeep(g, cm, false)!; m.position.set(x, 430 + (i % 4) * 40, z); m.userData.home = [x, z]; m.userData.speed = 6 + (i % 4) * 2; scene.add(m); clouds.push(m);
    scene.remove(g);
  });
  void W; void H;
}

/* ---------- labels ---------- */
const labelLayer = document.createElement('div'); labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
const LBL: Record<string, HTMLDivElement & { _h?: string }> = {};
const esc = (s: string) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
function mkLabel(id: string, cls: string) { const el = document.createElement('div') as any; el.className = 'lbl3 ' + cls; labelLayer.appendChild(el); LBL[id] = el; }
/* hide labels that would sit under the top HUD bar or behind the camera */
const place = (el: HTMLElement, x: number, y: number, z: number) => { const [sx, sy, sz] = project(x, y, z); el.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-100%)`; el.style.opacity = sz > 1 || sy < 128 ? '0' : '1'; };
export function updateLabels() {
  for (const id of IDS) {
    const el = LBL[id]; const g = landmarkGroups[id]; const tier = tierOf(id);
    const html = `<span class="tchip t${tier}">${tier}/3</span>${esc(STATIONS[id].name[save.lang])}`;
    if (el._h !== html) { el.innerHTML = html; el._h = html; el.className = 'lbl3 lm t' + tier; }
    const th = g.userData.theta, ox = th != null ? 100 * Math.cos(th) : 0, oz = th != null ? 100 * Math.sin(th) : 0;
    place(el, g.position.x + ox, LABEL_H[id], g.position.z + oz);
  }
  for (const ex of ZONE.exits) {
    const el = LBL['exit-' + ex.kind]; const at = (ZONE as any)[ex.at]; const ic = ex.kind === 'bus' ? 'BAS' : (save.lang === 'bm' ? 'FERI' : 'FERRY');
    const html = `<span class="ic">${ic}</span>${esc(ex.label[save.lang])}`; if (el._h !== html) { el.innerHTML = html; el._h = html; }
    const [x, y] = exitPost(ex, at); place(el, x, 44, y);
  }
  for (const n of npcs) {
    const el = LBL['npc-' + n.id];
    if (n.bubble > 0) { const txt = n.say[save.lang]; if (el._h !== txt) { el.textContent = txt; el._h = txt; } place(el, n.x, 58, n.y); el.style.opacity = String(Math.min(1, n.bubble)); }
    else el.style.opacity = '0';
  }
  if (player.path.length && player.target) { destMark.visible = true; destMark.position.set(player.target[0], 1, player.target[1]); const s = 1 + Math.sin(performance.now() / 250) * .12; destMark.scale.set(s, s, s); }
  else destMark.visible = false;
}
const exitPost = (ex: any, at: [number, number]): [number, number] => ex.kind === 'bus' ? [at[0] - 60, at[1] - 10] : [at[0] + 40, at[1]];

/* ---------- reveal state ---------- */
export const motion = { reduced: false };
export const RADII = [0, 190, 260, 340], START_R = 230, SAT_LEVEL = [.38, .62, .82, 1];
export const revState: Record<string, number> = {};
export const reveals: any[] = [];
export function syncReveal() {
  revState.start = START_R;
  for (const id of IDS) { revState[id] = RADII[tierOf(id)]; if (SAT[id]) SAT[id].u.value = SAT_LEVEL[tierOf(id)]; }
}
export function uploadReveal() {
  let n = 0;
  for (const k of ['start', ...IDS]) {
    const r = revState[k] || 0; if (r <= 0) continue;
    const p = k === 'start' ? [ZONE.start[0], ZONE.start[1] - 60] : [ZONE.landmarks[k][0], ZONE.landmarks[k][1] - 60];
    REV.value[n].set(p[0], p[1], r); n++;
  }
  REVN.value = n;
}

/* ---------- actors ---------- */
export function rebuildPlayer() {
  if (playerMesh) { scene.remove(playerMesh); disposeTree(playerMesh); }
  playerMesh = makeChar(save.look, save.outfit, true); playerMesh.scale.setScalar(.95); scene.add(playerMesh);
  const ring = new THREE.Mesh(new THREE.RingGeometry(10, 12.5, 32), new THREE.MeshBasicMaterial({ color: '#f3c46a', transparent: true, opacity: .9 }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .6; playerMesh.add(ring);
  playerMesh.position.set(player.x, 0, player.y);
}
let prevP = [player.x, player.y]; let prevN: number[][] = []; let ferryT = 0;
export function updateWorld(dt: number, t: number) {
  const dx = player.x - prevP[0], dz = player.y - prevP[1];
  playerMesh.position.set(player.x, 0, player.y); if (Math.abs(dx) + Math.abs(dz) > .05) faceTo(playerMesh, dx, dz, dt); prevP = [player.x, player.y];
  poseChar(playerMesh, player.walk, player.moving, t);
  npcs.forEach((n, i) => {
    const m = npcMeshes[i]; const p = prevN[i] || [n.x, n.y]; const ddx = n.x - p[0], ddz = n.y - p[1]; m.position.set(n.x, 0, n.y);
    if (Math.abs(ddx) + Math.abs(ddz) > .02) faceTo(m, ddx, ddz, dt); else if (n.bubble > 0) faceTo(m, player.x - n.x, player.y - n.y, dt);
    prevN[i] = [n.x, n.y]; poseChar(m, n.walk, n.moving, t + i);
  });
  catMeshes.forEach((c, i) => { if (c.visible) c.userData.tail.rotation.z = Math.sin(t * 3 + i) * .5; });
  ferryT = (ferryT + dt * .018) % 1; const F = ZONE.ferryLine; let tot = 0; const seg: number[] = [];
  for (let i = 1; i < F.length; i++) { const d = Math.hypot(F[i][0] - F[i - 1][0], F[i][1] - F[i - 1][1]); seg.push(d); tot += d; }
  const pp = ferryT < .5 ? ferryT * 2 : 2 - ferryT * 2; let want = pp * tot, si = 0; while (si < seg.length - 1 && want > seg[si]) { want -= seg[si]; si++; }
  const a = F[si], b = F[si + 1], kk = Math.min(1, want / seg[si]); const fdir = ferryT < .5 ? 1 : -1;
  ferryG.position.set(a[0] + (b[0] - a[0]) * kk, -3 + Math.sin(t * 1.6) * .6, a[1] + (b[1] - a[1]) * kk);
  ferryG.rotation.y = Math.atan2(-(b[1] - a[1]) * fdir, (b[0] - a[0]) * fdir);
  (waterFx.material as THREE.ShaderMaterial).uniforms.t.value = motion.reduced ? 0 : t;
  for (const c of clouds) { const [hx] = c.userData.home; c.position.x = hx + Math.sin(t * c.userData.speed * .004 + hx) * 140; }
}

export function buildWorld(groundT: THREE.Texture, seaT: THREE.Texture) {
  document.getElementById('app')!.insertBefore(labelLayer, document.querySelector('.hud-top'));
  buildIsland(groundT, seaT); buildHouses(); buildTrees(); buildStations(); buildCats(); buildFerry(); buildClouds();
  for (const ex of ZONE.exits) { const [x, y] = exitPost(ex, (ZONE as any)[ex.at]); post(x, y); mkLabel('exit-' + ex.kind, 'sign'); }
  for (const id of IDS) mkLabel(id, 'lm');
  for (const n of npcs) { mkLabel('npc-' + n.id, 'bub'); const m = makeChar(n.look, n.outfit, false); m.scale.setScalar(.88); scene.add(m); npcMeshes.push(m); }
  destMark = new THREE.Mesh(new THREE.RingGeometry(9, 12, 32), new THREE.MeshBasicMaterial({ color: '#b8455f', transparent: true, opacity: .85, depthWrite: false }));
  destMark.rotation.x = -Math.PI / 2; scene.add(destMark);
  rebuildPlayer(); syncReveal(); uploadReveal();
}
export { camera };
export const exitAt = (kind: string) => { const ex = ZONE.exits.find(e => e.kind === kind); return ex ? exitPost(ex, (ZONE as any)[ex.at]) : null; };
export const _L = L;
