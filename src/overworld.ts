/* Overworld: a 3D diorama of the whole state (approved coastline, bridges, ferry route) with one hotspot per
   zone. Tap a zone to see its places (map mode for visitors) and travel there. Loaded with ?z=map. */
import * as THREE from 'three';
import { OVERWORLD, STATIONS, ZONES, zoneIds, sprite, navigate, TEST, type OwZone } from './content';
import { save, persist, tierOf, doneIn } from './game/save';
import { flags, player, hooks } from './game/state';
import { renderer, scene, camera, cv, view, camS, ZOOM, resize, updateCamera, fitShadow, project, mat, M, G, REV, REVN, addOutline, applyQuality, quality, MOBILE, sky } from './engine/core';
import { L } from './i18n';
import { sfx, applyAudio } from './audio';
import { $, refreshText, setRerender, toast } from './ui/hud';
import { initSheet, openSheet, closeSheet, qa, esc, ICON_X, ICON_BACK } from './ui/dom';
import { openSettings } from './ui/settings';
import { openPassport, openKisah } from './ui/sheets';
import { zoneState, zoneName, unlockNeed } from './game/zones';
import { travelTo, zoneArt } from './ui/travel';
import { reducedMotion } from './game/save';
import { motion } from './engine/world';

const sprites: Record<string, THREE.Sprite> = {}; const labels: Record<string, HTMLDivElement & { _h?: string }> = {};
const layer = document.createElement('div'); layer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden';
let boat: THREE.Group, here: THREE.Mesh;

function inside(pt: number[], ring: number[][]) { let c = false; for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) { const [xi, yi] = ring[i], [xj, yj] = ring[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < (xj - xi) * (pt[1] - yi) / (yj - yi) + xi) c = !c; } return c; }
function build() {
  const [x0, y0, x1, y1] = OVERWORLD.bounds, cx = (x0 + x1) / 2, cz = (y0 + y1) / 2;
  REV.value[0].set(cx, cz, 1e6); REVN.value = 1; // everything in full colour
  scene.fog = new THREE.Fog('#d7ebe3', 5200, 9800);
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(9000, 9000), mat('#5bb7c8')); sea.rotation.x = -Math.PI / 2; sea.position.set(cx, -10, cz); scene.add(sea);
  const top = mat('#95c47a'), side = mat('#c9ad7c');
  OVERWORLD.land.forEach(ring => {
    const g = new THREE.ExtrudeGeometry(new THREE.Shape(ring.map(p => new THREE.Vector2(p[0], p[1]))), { depth: 12, bevelEnabled: false, curveSegments: 1 }); g.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(g, [top, side]); m.receiveShadow = true; scene.add(m);
  });
  // interpretive relief: forested hills along the island's spine, trees scattered over all land
  const island = OVERWORLD.land[0];
  const hills = G(); const hillAt: number[][] = [];
  for (const z of OVERWORLD.zones) if (z.id === 'penang-hill') hillAt.push(z.at);
  const ph = hillAt[0] || [cx, cz];
  [[0, 0, 120, 60], [-110, 90, 95, 42], [100, -50, 90, 40], [-80, 250, 100, 38], [-40, 450, 95, 34], [-190, 370, 80, 30], [60, 170, 75, 30]].forEach(([dx, dz, r, h]) => {
    const m = M('sph', '#6f9f52', r, h, r * .85, ph[0] + dx, 0, ph[1] + dz); hills.add(m);
  });
  scene.add(hills);
  const N = MOBILE ? 260 : 420, can = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), mat('#ffffff', { flat: true }), N); const o = new THREE.Object3D(), c = new THREE.Color(); let k = 0, tries = 0;
  const greens = ['#6fa45a', '#82b866', '#5d9450', '#94c46e'];
  while (k < N && tries < N * 30) {
    tries++; const ring = OVERWORLD.land[tries % 3 === 0 ? 1 : 0]; if (!ring) continue;
    const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); const p = [Math.min(...xs) + Math.random() * (Math.max(...xs) - Math.min(...xs)), Math.min(...ys) + Math.random() * (Math.max(...ys) - Math.min(...ys))];
    if (!inside(p, ring)) continue; if (OVERWORLD.zones.some(z => Math.hypot(z.at[0] - p[0], z.at[1] - p[1]) < 140)) continue;
    const s = 9 + Math.random() * 9; o.position.set(p[0], s * .8 + (Math.hypot(p[0] - ph[0], p[1] - ph[1]) < 260 ? 30 : 0), p[1]); o.rotation.set(k, k * 1.3, 0); o.scale.set(s, s * .85, s); o.updateMatrix();
    can.setMatrixAt(k, o.matrix); can.setColorAt(k++, c.set(greens[k % 4]));
  }
  can.count = k; scene.add(can); void island;
  // bridges: thick deck along each footprint's centreline
  const bm = mat('#8f8a80');
  for (const br of OVERWORLD.bridges) {
    const xs = br.map(p => p[0]); const lo = Math.min(...xs), hi = Math.max(...xs); const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 16; i++) { const x = lo + (hi - lo) * i / 16; const near = br.filter(p => Math.abs(p[0] - x) < (hi - lo) / 24 + 2); if (!near.length) continue; pts.push(new THREE.Vector3(x, 4, near.reduce((a, p) => a + p[1], 0) / near.length)); }
    if (pts.length > 1) { const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 48, 5, 6, false), bm); scene.add(m); addOutline(m, 1.2); }
  }
  // ferry route (dashed) and a little ferry on it
  for (const f of OVERWORLD.ferries.slice(0, 1)) {
    const g = new THREE.BufferGeometry().setFromPoints(f.map(p => new THREE.Vector3(p[0], 1, p[1]))); const l = new THREE.Line(g, new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 10, gapSize: 8 })); l.computeLineDistances(); scene.add(l);
  }
  boat = G(); boat.add(M('box', '#f4f1ea', 26, 8, 12, 0, 2, 0), M('box', '#2f6fb0', 26.4, 3, 12.4, 0, -1, 0), M('box', '#f3c46a', 12, 5, 9, -3, 8, 0)); scene.add(boat);
  // zone hotspots
  const TL = new THREE.TextureLoader();
  for (const z of OVERWORLD.zones) {
    const st = zoneState(z.id); const tex = TL.load(zoneArt(z.id)); tex.colorSpace = THREE.SRGBColorSpace;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, color: st === 'open' ? '#ffffff' : st === 'locked' ? '#b5b0a6' : '#9a968e', transparent: true, depthWrite: false }));
    sp.scale.set(220, 220, 1); sp.position.set(z.at[0], 110, z.at[1]); sp.userData.zone = z.id; sp.renderOrder = 2; scene.add(sp); sprites[z.id] = sp;
    const el = document.createElement('div') as any; el.className = 'lbl3 zl'; layer.appendChild(el); labels[z.id] = el;
  }
  here = M('cone', '#b8455f', 14, 30, 14, 0, 0, 0, { noShadow: 1 }); here.rotation.x = Math.PI; scene.add(here);
}
/* frame the island and the channel (the mean of the zone hotspots) */
function centre() { const zs = OVERWORLD.zones; camS.panX = zs.reduce((a, z) => a + z.at[0], 0) / zs.length - player.x; camS.panZ = zs.reduce((a, z) => a + z.at[1], 0) / zs.length - player.y; }
function zoneLine(id: string) {
  const t = L(), st = zoneState(id), ids = zoneIds(id);
  if (st === 'soon') return t.soonLock; if (st === 'locked') return t.lockedZone(unlockNeed().n, zoneName(unlockNeed().zone, save.lang));
  return ids.length ? t.zoneStamps(doneIn(ids), ids.length * 3) : t.zoneNone;
}
function updateLabels(t: number) {
  for (const z of OVERWORLD.zones) {
    const el = labels[z.id], st = zoneState(z.id), isHere = z.id === save.zone;
    const html = `<small>${isHere ? L().hereNow.toUpperCase() : esc(zoneLine(z.id))}</small>${esc(z.name[save.lang])}`;
    if (el._h !== html) { el.innerHTML = html; el._h = html; el.className = 'lbl3 zl' + (isHere ? ' here' : st !== 'open' ? ' lock' : ''); }
    const [sx, sy, sz] = project(z.at[0], 225, z.at[1]); el.style.transform = `translate(${sx}px,${sy}px) translate(-50%,-100%)`; el.style.opacity = sz > 1 || sy < 70 ? '0' : '1';
  }
  const h = OVERWORLD.zones.find(z => z.id === save.zone); if (h) here.position.set(h.at[0], 270 + (motion.reduced ? 0 : Math.sin(t * 3) * 8), h.at[1]);
  const f = OVERWORLD.ferries[0]; if (f) { const k = (Math.sin(t * .25) + 1) / 2, i = Math.min(f.length - 2, Math.floor(k * (f.length - 1))), u = k * (f.length - 1) - i; const a = f[i], b = f[i + 1]; boat.position.set(a[0] + (b[0] - a[0]) * u, 0, a[1] + (b[1] - a[1]) * u); boat.rotation.y = Math.atan2(-(b[1] - a[1]), b[0] - a[0]); }
}

/* ---------- map mode sheets ---------- */
export function openZone(id: string) {
  const t = L(), z = OVERWORLD.zones.find(q => q.id === id)!, st = zoneState(id), ids = zoneIds(id), isHere = id === save.zone; setRerender(() => openZone(id));
  const u = unlockNeed();
  const action = isHere ? `<button type="button" class="btn pink" id="zgo">${t.mapBack(esc(z.name[save.lang]))}</button>`
    : st === 'open' ? `<button type="button" class="btn pink" id="zgo">${t.travelGo} · ${esc(z.name[save.lang])}</button>`
      : `<div class="fb">${st === 'soon' ? t.soonLock : esc(t.lockedZone(u.n, zoneName(u.zone, save.lang))) + ` (${u.have}/${u.n})`}</div>`;
  const rows = ids.map(sid => { const s = STATIONS[sid], tr = tierOf(sid); return `<button type="button" class="strow" data-sid="${sid}"><img src="${sprite(sid)}" alt=""><span class="tx"><b>${esc(s.name[save.lang])}</b><span class="small">${esc(s.category[save.lang])} · ${t.tiers[tr]}</span></span></button>`; }).join('');
  openSheet(`<div class="row"><div><div class="kicker">${t.mapK}</div><h2 id="sheet-title">${esc(z.name[save.lang])}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
    <div class="art"><img src="${zoneArt(id)}" alt="${esc(z.name[save.lang])}" style="${st === 'open' ? '' : 'filter:grayscale(.8)'}"></div>
    <div class="small">${esc(zoneLine(id))}${z.via ? ' · ' + t.viaFun : ''}</div>${action}
    ${rows ? `<div class="kicker" style="color:#12384a">${t.stationsK}</div><div style="display:flex;flex-direction:column;gap:8px">${rows}</div>` : ''}`,
    () => {
      $('x').onclick = closeSheet; const go = document.getElementById('zgo');
      if (go) go.onclick = () => { if (isHere) navigate(id, 'map'); else travelTo(id); };
      qa('.strow').forEach(b => b.onclick = () => openInfo(b.dataset.sid!));
    });
}
/** visitor card for any station: what it is, how to get there, official and partner links (the full Kisah stays a gold reward) */
export function openInfo(sid: string) {
  const s = STATIONS[sid], t = L(), lg = save.lang, tr = tierOf(sid); setRerender(() => openInfo(sid));
  const [lon, lat] = s.coordinates; const maps = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const off = s.official?.url ? `<a class="btn navy" href="${s.official.url}" target="_blank" rel="noopener">${s.official.label ? s.official.label[lg] : t.official}</a>` : '';
  const partner = s.partner ? `<a class="partner" href="${s.partner.url}" target="_blank" rel="noopener sponsored"><span>${t.partnerTag}</span><span>${esc(s.partner.label[lg])} ↗</span></a>` : `<div class="partner"><span>${t.partnerTag}</span><span>${t.partner}</span></div>`;
  openSheet(`<div class="row"><button type="button" class="back" id="bk">${ICON_BACK}${t.back}</button><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
    <div class="art"><img src="${sprite(sid)}" alt="${esc(s.name[lg])}"></div><div class="kicker">${t.infoK} · ${esc(s.category[lg])}</div><h2 id="sheet-title">${esc(s.name[lg])}</h2>
    <p>${esc(s.blurb[lg])}</p><div class="links">${off}<a class="btn ghost" href="${maps}" target="_blank" rel="noopener">${t.maps}</a></div>${partner}
    ${tr === 3 ? `<button type="button" class="btn gold" id="kis">${t.readKisah}</button>` : ''}
    <button type="button" class="btn pink" id="play">${t.playHere} · ${esc(zoneName(s.zone, lg))}</button>`,
    () => {
      $('x').onclick = closeSheet; $('bk').onclick = () => openZone(s.zone);
      const k = document.getElementById('kis'); if (k) k.onclick = () => openKisah(sid);
      $('play').onclick = () => { if (s.zone === save.zone) navigate(s.zone, 'map'); else if (zoneState(s.zone) === 'open') travelTo(s.zone); else { sfx(220, .08); toast(t.lockedZone(unlockNeed().n, zoneName(unlockNeed().zone, lg))); } };
    });
}

/* ---------- input: drag to pan, pinch/wheel to zoom, tap a zone ---------- */
function initInput() {
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); const pointers = new Map<number, number[]>(); let down: any = null, pinch: any = null, moved = false;
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); moved = false; if (pointers.size === 1) down = { x: e.clientX, y: e.clientY, px: camS.panX, pz: camS.panZ }; if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: camS.distT }; } });
  cv.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2 && pinch) { const [a, b] = [...pointers.values()]; camS.distT = Math.max(ZOOM.min, Math.min(ZOOM.max, pinch.z * pinch.d / Math.hypot(a[0] - b[0], a[1] - b[1]))); moved = true; return; }
    if (down) { const dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 10) moved = true; if (moved) { const s = camS.dist / view.h * 1.15, y = camS.yaw; camS.panX = down.px - Math.cos(y) * dx * s - Math.sin(y) * dy * s * 1.6; camS.panZ = down.pz + Math.sin(y) * dx * s - Math.cos(y) * dy * s * 1.6; } }
  });
  const up = (e: PointerEvent) => {
    const was = pointers.size; pointers.delete(e.pointerId); if (pointers.size < 2) pinch = null;
    if (was === 1 && !moved && !flags.modalOpen) {
      const r = cv.getBoundingClientRect(); ndc.set((e.clientX - r.left) / view.w * 2 - 1, -((e.clientY - r.top) / view.h) * 2 + 1); ray.setFromCamera(ndc, camera);
      const hit = ray.intersectObjects(Object.values(sprites))[0]; if (hit) { sfx(420, .04); openZone(hit.object.userData.zone); }
    }
    if (!pointers.size) down = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); camS.distT = Math.max(ZOOM.min, Math.min(ZOOM.max, camS.distT * (e.deltaY < 0 ? .9 : 1.1))); }, { passive: false });
  $('zin').onclick = () => camS.distT = Math.max(ZOOM.min, camS.distT / 1.25); $('zout').onclick = () => camS.distT = Math.min(ZOOM.max, camS.distT * 1.25);
  $('zme').onclick = () => { centre(); camS.distT = view.w < view.h ? 5000 : 3400; }; $('rotl').onclick = () => { camS.yawT -= Math.PI / 4; }; $('rotr').onclick = () => { camS.yawT += Math.PI / 4; };
  window.addEventListener('keydown', e => { if (flags.modalOpen && e.key === 'Escape') closeSheet(); });
  $('btn-pass').onclick = () => openPassport(); $('btn-set').onclick = () => openSettings(); $('btn-map').onclick = () => { if (!flags.modalOpen) navigate(save.zone, 'map'); };
  $('btn-cats').onclick = () => toast(L().mapHint);
  const unlock = () => { applyAudio(); window.removeEventListener('pointerdown', unlock); }; window.addEventListener('pointerdown', unlock);
}
function mapText() {
  const t = L(); refreshText();
  $('t-zone').textContent = t.mapK.split(' · ')[1] || 'PETA'; $('t-zname').textContent = t.mapTitle;
  const have = Object.keys(ZONES).reduce((a, z) => a + (save.cats[z]?.length || 0), 0), all = Object.values(ZONES).reduce((a, z) => a + z.cats.length, 0);
  $('cat-count').textContent = have + '/' + all; $('mapbar-t').textContent = t.mapHint; $('mapbar-b').textContent = t.mapBack(zoneName(save.zone, save.lang));
}

export async function bootMap() {
  if (!save.created) { navigate('george-town'); return; }
  document.body.classList.add('map-mode');
  for (const id of ['intro', 'quest', 'hint', 'coach', 'prompt']) { const el = document.getElementById(id); if (el) el.hidden = true; }
  const bar = document.createElement('div'); bar.className = 'mapbar'; bar.innerHTML = `<span id="mapbar-t"></span><button type="button" class="btn pink" id="mapbar-b" style="padding:8px 12px;font-size:13px"></button>`;
  const app = document.getElementById('app')!; app.insertBefore(layer, document.querySelector('.hud-top')); app.insertBefore(bar, document.querySelector('.hud-top'));
  resize(); window.addEventListener('resize', resize); initSheet(); initInput();
  hooks.refreshText = () => { mapText(); }; hooks.applySettings = () => { motion.reduced = reducedMotion(); applyAudio(); mapText(); };
  hooks.openStation = id => openInfo(id); hooks.toast = toast; hooks.sfx = sfx; hooks.rebuildPlayer = () => {}; hooks.tutorial = () => {}; hooks.resetWorld = () => location.reload();
  (window as any).__ppOpenInfo = openInfo;
  $('mapbar-b').onclick = () => { navigate(save.zone, 'map'); };
  renderer.shadowMap.enabled = false; applyQuality(quality.name); motion.reduced = reducedMotion();
  build(); flags.ready = flags.running = true;
  const h = OVERWORLD.zones.find(z => z.id === save.zone) || OVERWORLD.zones[0];
  player.x = h.at[0]; player.y = h.at[1] + 180; camS.tx = player.x; camS.tz = player.y;
  ZOOM.min = 900; ZOOM.max = 6000; camera.far = 14000; camera.updateProjectionMatrix(); sky.scale.setScalar(2.4); camS.dist = camS.distT = view.w < view.h ? 5000 : 3400; camS.pitch = 1.05;
  centre();
  mapText(); persist();
  if (TEST) (window as any).__pp = { save: () => save, openZone, openInfo, travelTo, zoneState, calls: () => renderer.info.render.calls, mode: 'map' };
  let last = performance.now(); const T0 = last;
  const frame = (now: number) => { bar.hidden = flags.modalOpen; layer.style.visibility = flags.modalOpen ? 'hidden' : 'visible'; const dt = Math.min(.05, (now - last) / 1000); last = now; updateCamera(motion.reduced ? 1 : dt); fitShadow(); renderer.render(scene, camera); updateLabels((now - T0) / 1000); requestAnimationFrame(frame); };
  requestAnimationFrame(frame);
}
export type { OwZone };
