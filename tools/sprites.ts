/* Renders one station model to a transparent PNG for the UI sprite (station card, stamp, Pasport, find game).
   Driven by tools/render_sprites.mjs: window.renderStation(id) → { png, spots } where spots are
   pixel positions in the rendered image. Same toon materials and outlines as the game. */
import * as THREE from 'three';
import { renderer, addOutline } from '../src/engine/core';
import { BUILDERS, stationMat, satFor } from '../src/engine/stations';
import { bakeDeep } from '../src/engine/bake';

const W = 1080, H = 1140;
renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.setClearColor(0x000000, 0);
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight('#fff0d6', '#5c837d', .5 * Math.PI));
const sun = new THREE.DirectionalLight('#ffd9a8', 1.25 * Math.PI); sun.position.set(-160, 260, 180); sun.castShadow = true;
Object.assign(sun.shadow.camera, { left: -160, right: 160, top: 160, bottom: -160, near: 10, far: 800 }); sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -.0006;
scene.add(sun, sun.target);
const cam = new THREE.PerspectiveCamera(20, W / H, 10, 4000);

(window as any).renderStation = (id: string) => {
  for (const c of [...scene.children]) if ((c as any).userData.station) scene.remove(c);
  satFor(id).u.value = 1;
  const g = BUILDERS[id](); g.userData.station = true; g.rotation.y = 0; g.position.set(0, 0, 0);
  const spots = g.userData.spots || {};
  scene.add(g); bakeDeep(g, stationMat(id));
  const meshes: THREE.Mesh[] = []; g.traverse((m: any) => { if (m.isMesh && !m.userData.outline) meshes.push(m); }); meshes.forEach(m => addOutline(m, 1.5));
  // frame the model: 3/4 view from the front-left, like the original painted sprites
  const box = new THREE.Box3().setFromObject(g); const c = box.getCenter(new THREE.Vector3()); const size = box.getSize(new THREE.Vector3());
  const yaw = -.62, pitch = .62, r = Math.max(size.x, size.z, size.y * 1.3) * 3.15;
  cam.position.set(c.x + Math.sin(yaw) * Math.cos(pitch) * r, c.y + Math.sin(pitch) * r, c.z + Math.cos(yaw) * Math.cos(pitch) * r); cam.lookAt(c);
  cam.updateMatrixWorld(); renderer.render(scene, cam);
  const px: Record<string, number[][]> = {};
  for (const [k, list] of Object.entries(spots) as [string, number[][]][]) px[k] = list.map(([x, y, z, rad]) => { const v = new THREE.Vector3(x, y, z).applyMatrix4(g.matrixWorld).project(cam); return [(v.x + 1) / 2 * W, (1 - v.y) / 2 * H, rad]; });
  return { png: renderer.domElement.toDataURL('image/png'), spots: px };
};
(window as any).ready = true;
