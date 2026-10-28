/* Geometry baking for phone performance: merge many small coloured meshes into one vertex-coloured mesh.
   Textured meshes, instanced meshes and anything flagged userData.keep stay separate. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP_ATTRS = ['position', 'normal', 'uv', 'color'];
function prepared(m: THREE.Mesh, rel: THREE.Matrix4) {
  let g = m.geometry.clone(); if (g.index) g = g.toNonIndexed();
  g.applyMatrix4(rel);
  const n = g.attributes.position.count; const col = (m.material as any).color as THREE.Color;
  const c = new Float32Array(n * 3); for (let i = 0; i < n; i++) { c[i * 3] = col.r; c[i * 3 + 1] = col.g; c[i * 3 + 2] = col.b; }
  g.setAttribute('color', new THREE.BufferAttribute(c, 3));
  if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
  if (!g.attributes.normal) g.computeVertexNormals();
  for (const k of Object.keys(g.attributes)) if (!KEEP_ATTRS.includes(k)) g.deleteAttribute(k);
  g.morphAttributes = {}; g.clearGroups();
  return g;
}
const bakeable = (o: any) => o.isMesh && !o.isInstancedMesh && !o.userData.keep && !o.userData.outline && !Array.isArray(o.material) && !o.material.map && o.material.color;

/** Merge every bakeable mesh anywhere under `root` into one mesh added to `root`. */
export function bakeDeep(root: THREE.Object3D, material: THREE.Material, castShadow = true) {
  root.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(root.matrixWorld).invert(); const geos: THREE.BufferGeometry[] = []; const dead: THREE.Object3D[] = [];
  root.traverse((o: any) => { if (bakeable(o)) { geos.push(prepared(o, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); dead.push(o); } });
  return finish(root, geos, dead, material, castShadow);
}
/** Merge only the direct mesh children of `group` (keeps animated sub-groups such as limbs intact). */
export function bakeChildren(group: THREE.Object3D, material: THREE.Material, castShadow = true) {
  group.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(group.matrixWorld).invert(); const geos: THREE.BufferGeometry[] = []; const dead: THREE.Object3D[] = [];
  for (const o of group.children as any[]) if (bakeable(o)) { geos.push(prepared(o, new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld))); dead.push(o); }
  return finish(group, geos, dead, material, castShadow);
}
function finish(root: THREE.Object3D, geos: THREE.BufferGeometry[], dead: THREE.Object3D[], material: THREE.Material, castShadow: boolean) {
  if (!geos.length) return null;
  for (const o of dead) o.parent!.remove(o);
  const merged = mergeGeometries(geos, false)!; geos.forEach(g => g.dispose());
  const mesh = new THREE.Mesh(merged, material); mesh.castShadow = castShadow; mesh.receiveShadow = true; mesh.userData.baked = true;
  root.add(mesh); return mesh;
}
export function disposeTree(root: THREE.Object3D) {
  root.traverse((o: any) => { if (o.isMesh && o.userData.baked) o.geometry.dispose(); });
}
