/* Low-poly chibi built from primitives, animated in code. Outfits and hair are part/colour swaps. */
import * as THREE from 'three';
import { GEO, gradient } from './core';
import { SKINS } from '../content';

export const OUTFIT_STYLE: Record<string, any> = {
  batik: { top: '#2f7f77', pants: '#24405a', acc: '#f3c46a', pat: 'batik' },
  melayu: { top: '#7b2d4a', pants: '#7b2d4a', acc: '#e2a93f', pat: 'samping', hat: 'songkok' },
  samfu: { top: '#c8402f', pants: '#2b2433', acc: '#f3c46a', pat: 'frog' },
  samfuB: { top: '#3f6f8f', pants: '#2b2433', acc: '#e8e2d0', pat: 'frog' },
  kurta: { top: '#e08a2c', pants: '#f2ead8', acc: '#b8455f', pat: 'kurta', long: 1 },
  kurung: { top: '#3e7d5e', pants: '#3e7d5e', acc: '#f3c46a', pat: 'kurung', long: 1 },
  explorer: { top: '#c9a56a', pants: '#6b5a3e', acc: '#2f7f77', pat: 'vest', hat: 'safari' },
};
const CMATS: Record<string, THREE.Material> = {};
const cm = (c: string) => CMATS[c] || (CMATS[c] = new THREE.MeshToonMaterial({ color: c, gradientMap: gradient }));
function C(geo: string, color: string, sx: number, sy: number, sz: number, x: number, y: number, z: number) {
  const m = new THREE.Mesh(GEO[geo], cm(color)); m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = true; return m;
}
const G = () => new THREE.Group();
const capGeo = new THREE.SphereGeometry(10.8, 16, 12, 0, Math.PI * 2, 0, Math.PI * .52);
const domeGeo = new THREE.SphereGeometry(9.6, 14, 10, 0, Math.PI * 2, 0, Math.PI / 2);
const drapeGeo = new THREE.CylinderGeometry(9, 13, 9, 16);

export interface Look { skin: number; hair: number; grey?: number }
export function makeChar(look: Look, outfit: string, me: boolean) {
  const st = OUTFIT_STYLE[outfit] || OUTFIT_STYLE.batik, skin = SKINS[look.skin || 0], hairC = look.grey ? '#c9c6c0' : '#2a1f1a';
  const root = G(), body = G(); root.add(body);
  const legs: THREE.Group[] = [];
  for (const sx of [-3.3, 3.3]) { const lg = G(); lg.position.set(sx, 13, 0); lg.add(C('box', st.pants, 5.2, 11, 5.4, 0, -5.5, 0), C('box', '#3b2a20', 5.8, 3, 7, 0, -11, 1)); body.add(lg); legs.push(lg); }
  body.add(C('box', st.top, 16, 15, 11, 0, 20, 0));
  if (st.long) body.add(C('box', st.top, 17, 8, 12, 0, 11.5, 0));
  if (st.pat === 'batik') for (let i = 0; i < 6; i++) body.add(C('sph', st.acc, 1.3, 1.3, .6, -4.5 + (i % 3) * 4.5, 24 - Math.floor(i / 3) * 6, 5.6));
  if (st.pat === 'samping') body.add(C('box', st.acc, 17, 5, 12, 0, 14.5, 0));
  if (st.pat === 'frog') for (let i = 0; i < 3; i++) body.add(C('box', st.acc, 5, 1, .8, 0, 25 - i * 3.6, 5.6));
  if (st.pat === 'kurta') body.add(C('box', st.acc, 1.6, 10, .8, 0, 23, 5.6), C('box', st.acc, 17.2, 1.4, 12.2, 0, 9, 0));
  if (st.pat === 'kurung') for (let i = 0; i < 5; i++) body.add(C('sph', st.acc, 1, 1, .5, -6 + i * 3, 18 + (i % 2) * 5, 5.6));
  if (st.pat === 'vest') body.add(C('box', '#8d7448', 5, 14, 11.4, -5.6, 20, 0), C('box', '#8d7448', 5, 14, 11.4, 5.6, 20, 0));
  const arms: THREE.Group[] = [];
  for (const sx of [-10.4, 10.4]) { const ag = G(); ag.position.set(sx, 27, 0); ag.add(C('box', st.top, 4.6, 11, 4.8, 0, -5.5, 0), C('sph', skin, 2.6, 2.6, 2.6, 0, -12, 0)); body.add(ag); arms.push(ag); }
  if (me) body.add(C('box', '#f3c46a', 11, 12, 5, 0, 21, -7.6));
  const head = G(); head.position.set(0, 39, 0); body.add(head);
  head.add(C('sph', skin, 10.2, 9.8, 10, 0, 0, 0));
  const hair = look.hair || 0;
  if (hair === 2) {
    head.add(C('sph', '#d77a91', 11.6, 11.4, 11.4, 0, .6, -.6), C('sph', skin, 7.6, 8, 3.2, 0, -.6, 8.6));
    const dr = new THREE.Mesh(drapeGeo, cm('#d77a91')); dr.position.y = 31.5; dr.castShadow = true; body.add(dr);
  } else {
    const cap = new THREE.Mesh(capGeo, cm(hairC)); cap.rotation.x = -.32; cap.castShadow = true; head.add(cap);
    head.add(C('box', hairC, 12, 3, 3, 0, 6, 8.4));
    if (hair === 1) head.add(C('sph', hairC, 4.6, 4.6, 4.6, 0, 2, -11.5), C('sph', '#b8455f', 1.8, 1.8, 1.8, 0, 4.4, -8.6));
  }
  if (st.hat === 'songkok' && hair !== 2) head.add(C('cyl', '#1d1b22', 9.6, 7, 9.6, 0, 9.5, 0));
  if (st.hat === 'safari') { head.add(C('cyl', '#d9bf86', 15, 1.2, 15, 0, 7, 0)); const dm = new THREE.Mesh(domeGeo, cm('#d9bf86')); dm.position.y = 7; head.add(dm, C('cyl', '#2f7f77', 9.8, 2, 9.8, 0, 8.4, 0)); }
  const fz = hair === 2 ? 11.3 : 9.4;
  head.add(C('sph', '#2b2433', 1.5, 2, 1, -3.5, 0, fz), C('sph', '#2b2433', 1.5, 2, 1, 3.5, 0, fz), C('sph', '#ffffff', .6, .6, .5, -3, .8, fz + .8), C('sph', '#ffffff', .6, .6, .5, 4, .8, fz + .8),
    C('sph', '#e48f8f', 2, 1.2, .6, -6.2, -3.6, fz - 1.6), C('sph', '#e48f8f', 2, 1.2, .6, 6.2, -3.6, fz - 1.6), C('box', '#7a3b3b', 3, .9, .6, 0, -4.4, fz + .2));
  root.userData = { body, legs, arms, head };
  return root;
}
export function poseChar(ch: THREE.Object3D, walk: number, moving: boolean, t: number) {
  const u = ch.userData; const s = moving ? Math.sin(walk) : 0;
  u.legs[0].rotation.x = s * .7; u.legs[1].rotation.x = -s * .7; u.arms[0].rotation.x = -s * .6; u.arms[1].rotation.x = s * .6;
  u.body.position.y = moving ? Math.abs(Math.sin(walk)) * 1.6 : Math.sin(t * 2.2) * .4; u.head.rotation.z = moving ? 0 : Math.sin(t * .9) * .04;
}
export function faceTo(mesh: THREE.Object3D, dx: number, dz: number, dt: number) {
  const target = Math.atan2(dx, dz); let d = target - mesh.rotation.y;
  while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; mesh.rotation.y += d * Math.min(1, dt * 12);
}

/* small offscreen renderer for the creator, Pasport and wardrobe previews */
let prevR: THREE.WebGLRenderer | null = null, prevScene: THREE.Scene, prevCam: THREE.PerspectiveCamera;
export function charPreview(canvas: HTMLCanvasElement, look: Look, outfit: string, dir?: string) {
  try {
    if (!prevR) {
      prevR = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true }); prevR.setPixelRatio(1); prevR.setSize(180, 224, false);
      prevScene = new THREE.Scene(); prevScene.add(new THREE.HemisphereLight('#fff5df', '#88aaaa', .85 * Math.PI));
      const dl = new THREE.DirectionalLight('#ffffff', .75 * Math.PI); dl.position.set(-40, 70, 90); prevScene.add(dl);
      prevCam = new THREE.PerspectiveCamera(30, 180 / 224, 1, 1000); prevCam.position.set(0, 34, 132); prevCam.lookAt(0, 27, 0);
    }
    const ch = makeChar(look, outfit, true);
    ch.rotation.y = ({ down: .35, right: Math.PI / 2, up: Math.PI, left: -Math.PI / 2 } as any)[dir || 'down'];
    poseChar(ch, 0, false, 0); prevScene.add(ch); prevR.render(prevScene, prevCam); prevScene.remove(ch);
    const c = canvas.getContext('2d')!; c.clearRect(0, 0, canvas.width, canvas.height); c.drawImage(prevR.domElement, 0, 0, canvas.width, canvas.height);
  } catch { /* WebGL unavailable: leave the preview blank */ }
}
