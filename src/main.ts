/* Entry: wires engine, game state and UI; runs the frame loop and input. */
import * as THREE from 'three';
import './styles.css';
import { ZONE, ZONE_ID, IDS, MODE, zoneAsset, navParams, TEST } from './content';
import { save, persist, catsIn } from './game/save';
import { flags, player, npcs, keysDown, hooks } from './game/state';
import { goTo, stepActor, stepKeys, stepNpc } from './game/actors';
import { renderer, scene, camera, cv, view, camS, ZOOM, MOBILE, updateCamera, resize, loadTex, applyQuality, fitShadow, quality, type QualityName } from './engine/core';
import { loadGrid, nearestWalkable, walkableAt, CELL } from './engine/pathfinding';
import { buildWorld, updateWorld, updateLabels, uploadReveal, syncReveal, rebuildPlayer, reveals, revState, landmarkGroups, catMeshes, motion } from './engine/world';
import { SAT } from './engine/stations';
import { $, initHud, updateHud, refreshText, toast, act } from './ui/hud';
import { initSheet, closeSheet } from './ui/dom';
import { openStation, openPassport } from './ui/sheets';
import { renderIntro, updateLoading, progress, startPlaying, shouldAutoStart } from './ui/intro';
import { sfx, applyAudio } from './audio';
import { openSettings } from './ui/settings';
import { tutorialTick, tutorialEvent, setTutorialOrigin, renderTutorial } from './ui/tutorial';
import { reducedMotion } from './game/save';
import { openTravel, openTravelAll, goMap, travelTo } from './ui/travel';
import { exitPoint } from './engine/world';
import { zoneName } from './game/zones';
import { bootMap } from './overworld';
import { L } from './i18n';

hooks.openStation = openStation; hooks.toast = toast; hooks.sfx = sfx; hooks.tutorial = tutorialEvent;
hooks.applySettings = applySettings; hooks.openTravel = openTravel;
hooks.restartTutorial = () => { setTutorialOrigin(); renderTutorial(); };
hooks.onStart = () => { applySettings(); setTutorialOrigin(); if (ARRIVED) setTimeout(() => toast(L().welcome(zoneName(ZONE_ID, save.lang))), 400); };
const ARRIVED = navParams.get('from');
hooks.rebuildPlayer = () => { if (flags.ready) rebuildPlayer(); };
hooks.startReveal = r => reveals.push(r);
hooks.resetWorld = () => { syncReveal(); catMeshes.forEach(m => m.visible = true); rebuildPlayer(); spawn(); };

function spawn() {
  // arriving from another zone: start beside the stop that goes back there
  const ex = ARRIVED ? ZONE.exits.find(e => e.to.includes(ARRIVED)) : null; const [ax, ay] = ex ? exitPoint(ex) : [ZONE.start[0] + 70, ZONE.start[1] + 70];
  const sp = nearestWalkable(Math.floor(ax / CELL), Math.floor((ay + (ex ? 30 : 0)) / CELL));
  if (sp) { player.x = sp[0] * CELL + 5; player.y = sp[1] * CELL + 5; }
  player.path = []; camS.tx = player.x; camS.tz = player.y;
}

/* ---------- frame loop ---------- */
/* graphics: an explicit choice is kept; 'auto' starts medium (phones) / high (desktop) and steps down if the frame rate drops */
const LEVELS: QualityName[] = ['low', 'medium', 'high'];
const qa = { n: 0, t: 0, auto: (MOBILE ? 'medium' : 'high') as QualityName };
function applySettings() {
  const q = save.settings.quality === 'auto' ? qa.auto : save.settings.quality; if (q !== quality.name || !flags.ready) applyQuality(q);
  motion.reduced = reducedMotion(); if (flags.running) applyAudio(); refreshText();
}
let last = performance.now(); const T0 = last;
function frame(now: number) {
  const dt = Math.min(.05, (now - last) / 1000); last = now; const t = (now - T0) / 1000;
  if (flags.running && !flags.modalOpen) { if (!stepKeys(dt)) stepActor(player, dt); }
  for (const n of npcs) { stepNpc(n, dt); if (n.bubble > 0) n.bubble -= dt * .25; }
  for (let i = reveals.length - 1; i >= 0; i--) {
    const r = reveals[i]; r.r = Math.min(r.target, r.r + dt * (motion.reduced ? 4000 : 480)); revState[r.id] = r.r;
    const k = (r.r - r.r0) / ((r.target - r.r0) || 1); if (SAT[r.id]) SAT[r.id].u.value = .38 + (r.fromF + (r.toF - r.fromF) * k) * .62;
    if (r.r >= r.target) reveals.splice(i, 1);
  }
  uploadReveal();
  if (flags.running && !flags.modalOpen) { const got = catsIn(ZONE_ID); ZONE.cats.forEach((p, i) => {
    if (!got.includes(i) && Math.hypot(player.x - p[0], player.y - p[1]) < 42) {
      got.push(i); persist(); catMeshes[i].visible = false; sfx(900, .08); setTimeout(() => sfx(1200, .1), 90);
      toast(got.length === ZONE.cats.length ? L().catAll : L().catFound(got.length, ZONE.cats.length)); refreshText();
    }
  }); }
  updateWorld(dt, t); updateCamera(motion.reduced ? 1 : dt); fitShadow(); renderer.render(scene, camera); updateLabels();
  if (flags.running) {
    updateHud(); tutorialTick();
    qa.n++; qa.t += dt;
    if (qa.t > 3) {
      const fps = qa.n / qa.t; qa.n = 0; qa.t = 0;
      if (fps < 24 && save.settings.quality === 'auto' && qa.auto !== 'low') { qa.auto = LEVELS[LEVELS.indexOf(qa.auto) - 1]; applyQuality(qa.auto); }
    }
  }
  if (player.intent && !player.path.length && !flags.modalOpen) { const id = player.intent; player.intent = null; openStation(id); }
  requestAnimationFrame(frame);
}

/* ---------- input ---------- */
const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), gplane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitP = new THREE.Vector3();
function pick(sx: number, sy: number): { id?: string; x?: number; y?: number } | null {
  ndc.set(sx / view.w * 2 - 1, -(sy / view.h) * 2 + 1); ray.setFromCamera(ndc, camera);
  const hits = ray.intersectObjects(IDS.map(id => landmarkGroups[id]), true);
  if (hits.length) { let o: any = hits[0].object; while (o && !o.userData.id) o = o.parent; if (o && o.userData.id) return { id: o.userData.id }; }
  if (ray.ray.intersectPlane(gplane, hitP)) return { x: hitP.x, y: hitP.z };
  return null;
}
function initInput() {
  const pointers = new Map<number, number[]>(); let downAt: any = null, pinch0: any = null, moved = false;
  cv.addEventListener('pointerdown', e => {
    cv.setPointerCapture(e.pointerId); pointers.set(e.pointerId, [e.clientX, e.clientY]); moved = false;
    if (pointers.size === 1) downAt = { x: e.clientX, y: e.clientY, px: camS.panX, pz: camS.panZ };
    if (pointers.size === 2) { const [a, b] = [...pointers.values()]; pinch0 = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), z: camS.distT }; }
  });
  cv.addEventListener('pointermove', e => {
    if (!pointers.has(e.pointerId)) return; pointers.set(e.pointerId, [e.clientX, e.clientY]);
    if (pointers.size === 2 && pinch0) { const [a, b] = [...pointers.values()]; const d = Math.hypot(a[0] - b[0], a[1] - b[1]); camS.distT = Math.max(ZOOM.min, Math.min(ZOOM.max, pinch0.z * pinch0.d / d)); moved = true; return; }
    if (downAt) {
      const ddx = e.clientX - downAt.x, ddy = e.clientY - downAt.y; if (Math.hypot(ddx, ddy) > 12) moved = true;
      if (moved) { const s = camS.dist / view.h * 1.15; const y = camS.yaw; const rx = Math.cos(y), rz = -Math.sin(y), fx = -Math.sin(y), fz = -Math.cos(y);
        camS.panX = downAt.px - rx * ddx * s + fx * ddy * s * 1.6; camS.panZ = downAt.pz - rz * ddx * s + fz * ddy * s * 1.6; }
    }
  });
  const up = (e: PointerEvent) => {
    const was = pointers.size; pointers.delete(e.pointerId); if (pointers.size < 2) pinch0 = null;
    if (was === 1 && !moved && downAt && !flags.modalOpen && flags.running) {
      const r = cv.getBoundingClientRect(); const hit = pick(e.clientX - r.left, e.clientY - r.top);
      if (hit) {
        sfx(420, .04);
        if (hit.id) { const [tx, ty] = ZONE.triggers[hit.id]; goTo(tx, ty, hit.id); }
        else { const npcHit = npcs.find(n => Math.hypot(hit.x! - n.x, hit.y! - n.y) < 26); if (npcHit) { goTo(npcHit.x, npcHit.y + 20); npcHit.bubble = 3.2; } else goTo(hit.x!, hit.y!); }
      }
    }
    if (pointers.size === 0) downAt = null;
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('wheel', e => { e.preventDefault(); camS.distT = Math.max(ZOOM.min, Math.min(ZOOM.max, camS.distT * (e.deltaY < 0 ? .9 : 1.1))); }, { passive: false });
  $('zin').onclick = () => camS.distT = Math.max(ZOOM.min, camS.distT / 1.25); $('zout').onclick = () => camS.distT = Math.min(ZOOM.max, camS.distT * 1.25);
  $('zme').onclick = () => { camS.panX = camS.panZ = 0; };
  $('rotl').onclick = () => { camS.yawT -= Math.PI / 4; }; $('rotr').onclick = () => { camS.yawT += Math.PI / 4; };
  window.addEventListener('keydown', e => {
    if (!flags.running) return; if (flags.modalOpen) { if (e.key === 'Escape') closeSheet(); return; }
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'w', 'a', 's', 'd'].includes(k)) { keysDown.add(k); e.preventDefault(); }
    if (k === 'q') camS.yawT -= Math.PI / 4; if (k === 'r') camS.yawT += Math.PI / 4;
    if ((k === 'e' || k === ' ' || k === 'Enter') && (document.activeElement === document.body || document.activeElement === cv)) { act(); e.preventDefault(); }
  });
  window.addEventListener('keyup', e => { keysDown.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key); });
  window.addEventListener('blur', () => keysDown.clear());
  $('btn-pass').onclick = () => { if (flags.running) openPassport(); };
  $('btn-set').onclick = () => { if (flags.running) openSettings(); };
  $('btn-cats').onclick = () => { const n = catsIn(ZONE_ID).length; if (flags.running) toast(n === ZONE.cats.length ? L().catAll : L().catsHelp + ' (' + n + '/' + ZONE.cats.length + ')'); };
  $('btn-map').onclick = () => { if (flags.running && !flags.modalOpen) goMap(); };
  $('btn-travel').onclick = () => { if (flags.running && !flags.modalOpen) openTravelAll(); };
  // audio needs a gesture after every page load (travel reloads the page)
  const unlockAudio = () => { if (flags.running) { applyAudio(); window.removeEventListener('pointerdown', unlockAudio); } }; window.addEventListener('pointerdown', unlockAudio);
}

/* ---------- boot ---------- */
function loadImg(src: string) { return new Promise<HTMLImageElement>((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = src; }); }
async function boot() {
  resize(); const base = view.w < view.h ? 1250 : 950; camS.dist = camS.distT = base;
  window.addEventListener('resize', resize);
  initHud(); initSheet(); initInput(); refreshText(); renderIntro();
  progress.total = 3; const tick = () => { progress.loaded++; updateLoading(); };
  const [walk, ground, sea] = await Promise.all([loadImg(zoneAsset('walk.png')).then(i => (tick(), i)), loadTex(zoneAsset('ground.webp')).then(t => (tick(), t)), loadTex(zoneAsset('sea.webp')).then(t => (tick(), t))]);
  loadGrid(walk); spawn(); buildWorld(ground!, sea!); applySettings();
  flags.ready = true; renderIntro();
  if (shouldAutoStart()) startPlaying();
  if (TEST) (window as any).__pp = { openStation, save: () => save, camS, player, syncReveal, revState, SAT, MOBILE, quality, calls: () => renderer.info.render.calls, walkable: walkableAt, zone: ZONE, zoneId: ZONE_ID, travelTo, openTravel, tris: () => renderer.info.render.triangles };
  requestAnimationFrame(t => { last = t; frame(t); });
}
(MODE === 'map' ? bootMap() : boot()).catch(err => { console.error(err); const b = document.getElementById('start'); if (b) b.textContent = 'Ralat memuatkan · Load error'; });
