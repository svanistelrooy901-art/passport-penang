/* Renderer, scene, lights, camera rig and the sketch→colour reveal shader shared by every material. */
import * as THREE from 'three';
import { player } from '../game/state';

export const cv = document.getElementById('game') as HTMLCanvasElement;
export const view = { w: 0, h: 0 };
export const renderer = new THREE.WebGLRenderer({ canvas: cv, antialias: true, powerPreference: 'high-performance' });
export const MOBILE = Math.min(screen.width, screen.height) < 700;
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MOBILE ? 1.6 : 1.75));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

export const scene = new THREE.Scene();
scene.background = new THREE.Color('#cfe8e2');
scene.fog = new THREE.Fog('#d7ebe3', 2600, 9000); // far land (the rest of Penang) fades into this haze
export const camera = new THREE.PerspectiveCamera(32, 1, 5, 14000);
const PI = Math.PI; // r155+ uses physical light units; scale to match the approved prototype look
export const hemi = new THREE.HemisphereLight('#fff0d6', '#5c837d', .52 * PI); scene.add(hemi);
export const sun = new THREE.DirectionalLight('#ffd9a8', 1.0 * PI);
sun.castShadow = true;
sun.shadow.mapSize.set(MOBILE ? 1024 : 2048, MOBILE ? 1024 : 2048);
Object.assign(sun.shadow.camera, { left: -520, right: 520, top: 520, bottom: -520, near: 10, far: 1600 });
sun.shadow.bias = -.0008; sun.shadow.normalBias = .6;
scene.add(sun, sun.target);

/* ---------- reveal shader ---------- */
export const REV_MAX = 16; // one reveal circle per station in the zone (+ the start area)
export const REV = { value: Array.from({ length: REV_MAX }, () => new THREE.Vector3(-9999, -9999, 0)) };
export const REVN = { value: 0 };
export const gradient = new THREE.DataTexture(new Uint8Array([80, 150, 205, 240]), 4, 1, THREE.RedFormat);
gradient.minFilter = gradient.magFilter = THREE.NearestFilter; gradient.needsUpdate = true;

export function patch<T extends THREE.Material>(m: T, sat?: { value: number }): T {
  m.onBeforeCompile = (sh: any) => {
    sh.uniforms.uRev = REV; sh.uniforms.uRevN = REVN; if (sat) sh.uniforms.uSat = sat;
    sh.vertexShader = 'varying vec2 vRP;\n' + sh.vertexShader.replace('#include <project_vertex>',
      '#include <project_vertex>\n vec4 rp=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\n rp=instanceMatrix*rp;\n#endif\n vRP=(modelMatrix*rp).xz;');
    sh.fragmentShader = 'uniform vec3 uRev[16];uniform int uRevN;varying vec2 vRP;' + (sat ? 'uniform float uSat;' : '') + '\n' +
      sh.fragmentShader.replace('#include <dithering_fragment>',
        '#include <dithering_fragment>\n float rm=0.0;\n for(int i=0;i<16;i++){ if(i>=uRevN) break; float d=distance(vRP,uRev[i].xy); rm=max(rm,1.0-smoothstep(uRev[i].z*0.7,uRev[i].z,d)); }\n' +
        (sat ? ' rm=uSat;\n' : '') +
        ' vec3 c0=gl_FragColor.rgb; float gg=dot(c0,vec3(.299,.587,.114)); vec3 paper=mix(vec3(gg)*vec3(1.06,1.0,.88),vec3(.93,.9,.82),.28); gl_FragColor.rgb=mix(paper,c0,rm);');
  };
  m.customProgramCacheKey = () => sat ? 'revsat' : 'rev';
  return m;
}
export type Sat = { k: string; u: { value: number } };
const MATS: Record<string, THREE.Material> = {};
export function mat(color: string, o: { sat?: Sat; map?: THREE.Texture; ds?: boolean; flat?: boolean } = {}) {
  const key = color + '|' + (o.sat ? o.sat.k : '') + '|' + (o.map ? o.map.uuid : '') + '|' + (o.ds ? 1 : 0) + (o.flat ? 1 : 0);
  if (MATS[key]) return MATS[key];
  const m = new THREE.MeshToonMaterial({ color, gradientMap: gradient, map: o.map || null, side: o.ds ? THREE.DoubleSide : THREE.FrontSide });
  patch(m, o.sat ? o.sat.u : undefined); MATS[key] = m; return m;
}
function prismGeo() {
  const v = [-.5, 0, -.5, .5, 0, -.5, .5, 0, .5, -.5, 0, .5, -.5, 1, 0, .5, 1, 0];
  const idx = [3, 2, 5, 3, 5, 4, 1, 0, 4, 1, 4, 5, 0, 3, 4, 2, 1, 5];
  const pos: number[] = []; for (const i of idx) pos.push(v[i * 3], v[i * 3 + 1], v[i * 3 + 2]);
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv: number[] = []; for (let i = 0; i < pos.length / 3; i++) uv.push(pos[i * 3] + .5, pos[i * 3 + 1]);
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.computeVertexNormals(); return g;
}
export const GEO: Record<string, THREE.BufferGeometry> = {
  box: new THREE.BoxGeometry(1, 1, 1), cyl: new THREE.CylinderGeometry(1, 1, 1, 16), cyl8: new THREE.CylinderGeometry(1, 1, 1, 8),
  sph: new THREE.SphereGeometry(1, 16, 12), ico: new THREE.IcosahedronGeometry(1, 0), cone: new THREE.ConeGeometry(1, 1, 12), prism: prismGeo(),
};
export function M(geo: string | THREE.BufferGeometry, color: string, sx: number, sy: number, sz: number, x: number, y: number, z: number, o: any = {}) {
  const m = new THREE.Mesh(typeof geo === 'string' ? GEO[geo] : geo, mat(color, o));
  m.scale.set(sx, sy, sz); m.position.set(x, y, z); m.castShadow = !o.noShadow; m.receiveShadow = true; return m;
}
export const G = () => new THREE.Group();

/* ---------- textures ---------- */
const TL = new THREE.TextureLoader();
export const loadTex = (url: string) => new Promise<THREE.Texture | null>(r => TL.load(url, t => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy()); r(t); }, undefined, () => r(null)));
export function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, rep = false) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d')!, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
}

/* ---------- camera rig ---------- */
export const camS = { tx: player.x, tz: player.y, yaw: 0, yawT: 0, dist: 1250, distT: 1250, pitch: .95, panX: 0, panZ: 0 };
export const ZOOM = { min: 280, max: 7000 };
export function updateCamera(dt: number) {
  const k = Math.min(1, dt * 7);
  camS.yaw += (camS.yawT - camS.yaw) * k; camS.dist += (camS.distT - camS.dist) * k;
  const tx = player.x + camS.panX, tz = player.y + camS.panZ, f = Math.min(1, dt * 6);
  camS.tx += (tx - camS.tx) * f; camS.tz += (tz - camS.tz) * f;
  const cp = Math.cos(camS.pitch), sp = Math.sin(camS.pitch);
  camera.position.set(camS.tx + Math.sin(camS.yaw) * cp * camS.dist, sp * camS.dist, camS.tz + Math.cos(camS.yaw) * cp * camS.dist);
  camera.lookAt(camS.tx, 18, camS.tz);
  sun.position.set(camS.tx - 320, 560, camS.tz - 260); sun.target.position.set(camS.tx, 0, camS.tz);
}
const tmpV = new THREE.Vector3();
export function project(x: number, y: number, z: number): [number, number, number] {
  tmpV.set(x, y, z).project(camera); return [(tmpV.x * .5 + .5) * view.w, (-tmpV.y * .5 + .5) * view.h, tmpV.z];
}
export function screenDirToWorld(kx: number, ky: number): [number, number] {
  const y = camS.yaw; const fx = -Math.sin(y), fz = -Math.cos(y), rx = Math.cos(y), rz = -Math.sin(y);
  return [rx * kx + fx * (-ky), rz * kx + fz * (-ky)];
}
export function questArrowDeg(x: number, y: number) {
  const [ax, ay] = project(player.x, 10, player.y), [bx, by] = project(x, 10, y);
  return Math.atan2(by - ay, bx - ax) * 180 / Math.PI + 90;
}
export function resize() {
  view.w = cv.clientWidth; view.h = cv.clientHeight; renderer.setSize(view.w, view.h, false);
  camera.aspect = view.w / Math.max(1, view.h); camera.updateProjectionMatrix();
}

/* ---------- sky dome (follows the camera) ---------- */
export const sky = new THREE.Mesh(new THREE.SphereGeometry(5200, 32, 16), new THREE.ShaderMaterial({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color('#79c3dc') }, mid: { value: new THREE.Color('#bde5e6') }, hor: { value: new THREE.Color('#fde6c4') } },
  vertexShader: 'varying vec3 vW;void main(){vec4 w=modelMatrix*vec4(position,1.0);vW=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}',
  fragmentShader: 'uniform vec3 top,mid,hor;varying vec3 vW;void main(){float h=normalize(vW-cameraPosition).y;vec3 c=mix(hor,mid,smoothstep(-.05,.18,h));c=mix(c,top,smoothstep(.18,.65,h));gl_FragColor=vec4(c,1.0);\n#include <colorspace_fragment>\n}',
}));
sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky);

/* ---------- toon outlines (inverted hull, world-space thickness, works with instancing) ---------- */
export const outlines: THREE.Object3D[] = [];
const OUTLINE_MATS: Record<string, THREE.ShaderMaterial> = {};
export function outlineMat(color = '#3b2f2a', thick = 1.1) {
  const key = color + thick;
  return OUTLINE_MATS[key] || (OUTLINE_MATS[key] = new THREE.ShaderMaterial({
    side: THREE.BackSide, uniforms: { uColor: { value: new THREE.Color(color) }, uThick: { value: thick } },
    vertexShader: 'uniform float uThick;void main(){vec4 p=vec4(position,1.0);vec3 n=normal;\n#ifdef USE_INSTANCING\np=instanceMatrix*p;n=mat3(instanceMatrix)*n;\n#endif\nvec4 wp=modelMatrix*p;vec3 wn=normalize(mat3(modelMatrix)*n);wp.xyz+=wn*uThick;gl_Position=projectionMatrix*viewMatrix*wp;}',
    fragmentShader: 'uniform vec3 uColor;void main(){gl_FragColor=vec4(uColor,1.0);\n#include <colorspace_fragment>\n}',
  }));
}
/** Adds an outline twin to a mesh (child) or instanced mesh (sibling sharing the instance buffer). */
export function addOutline(m: THREE.Mesh, thick = 1.1, color?: string) {
  let o: THREE.Mesh;
  if ((m as any).isInstancedMesh) {
    const im = m as THREE.InstancedMesh; const oi = new THREE.InstancedMesh(im.geometry, outlineMat(color, thick), im.count);
    oi.instanceMatrix = im.instanceMatrix; oi.count = im.count; oi.frustumCulled = im.frustumCulled; m.parent!.add(oi); o = oi;
  } else { o = new THREE.Mesh(m.geometry, outlineMat(color, thick)); m.add(o); }
  o.castShadow = false; o.receiveShadow = false; o.userData.outline = true; o.raycast = () => {}; o.visible = quality.outlines; outlines.push(o); return o;
}

/* ---------- graphics quality ---------- */
export type QualityName = 'low' | 'medium' | 'high';
export const quality = { name: (MOBILE ? 'medium' : 'high') as QualityName, outlines: true };
export function applyQuality(q: QualityName) {
  const dpr = window.devicePixelRatio || 1; quality.name = q; quality.outlines = q !== 'low';
  renderer.setPixelRatio(q === 'low' ? 1 : q === 'medium' ? Math.min(dpr, 1.35) : Math.min(dpr, 2));
  const shadows = q !== 'low'; const size = q === 'high' ? 2048 : 1024;
  if (renderer.shadowMap.enabled !== shadows || sun.shadow.mapSize.x !== size) {
    renderer.shadowMap.enabled = shadows; sun.shadow.mapSize.set(size, size);
    if (sun.shadow.map) { sun.shadow.map.dispose(); (sun.shadow as any).map = null; }
    scene.traverse((o: any) => { if (o.material) [].concat(o.material).forEach((m: any) => m.needsUpdate = true); });
  }
  for (const o of outlines) o.visible = quality.outlines;
  resize();
}
/** keep the shadow box tight around what the camera sees */
export function fitShadow() {
  const half = Math.max(320, Math.min(950, camS.dist * .55)); const c = sun.shadow.camera;
  if (Math.abs(c.right - half) > 20) { c.left = c.bottom = -half; c.right = c.top = half; c.updateProjectionMatrix(); }
  sky.position.copy(camera.position);
}
