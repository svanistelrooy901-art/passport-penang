/* Walk grid (1 = walkable) baked per zone, A* with corner rules and string-pull smoothing. */
import { ZONE } from '../content';

const [GW, GH] = ZONE.world.grid; const CELL = ZONE.world.cell;
let grid: Uint8Array | null = null;
export { CELL };
export function loadGrid(img: HTMLImageElement) {
  const c = document.createElement('canvas'); c.width = GW; c.height = GH; const g = c.getContext('2d')!; g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, GW, GH).data; grid = new Uint8Array(GW * GH);
  for (let i = 0; i < GW * GH; i++) grid[i] = d[i * 4] > 127 ? 1 : 0;
}
export function setGrid(g: Uint8Array) { grid = g; }
export const walkable = (gx: number, gy: number) => !!grid && gx >= 0 && gy >= 0 && gx < GW && gy < GH && grid[gy * GW + gx] === 1;
export const walkableAt = (x: number, y: number) => walkable(Math.floor(x / CELL), Math.floor(y / CELL));

export function nearestWalkable(gx: number, gy: number): [number, number] | null {
  if (walkable(gx, gy)) return [gx, gy];
  for (let r = 1; r < 40; r++) {
    let best: [number, number] | null = null, bd = 1e9;
    for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      if (walkable(gx + dx, gy + dy)) { const dd = dx * dx + dy * dy; if (dd < bd) { bd = dd; best = [gx + dx, gy + dy]; } }
    }
    if (best) return best;
  }
  return null;
}
function lineClear(a: number[], b: number[]) {
  const dx = b[0] - a[0], dy = b[1] - a[1], n = Math.ceil(Math.hypot(dx, dy) / (CELL * .5));
  for (let k = 0; k <= n; k++) { const x = a[0] + dx * k / n, y = a[1] + dy * k / n; if (!walkableAt(x, y)) return false; }
  return true;
}
function smooth(from: number[], pts: [number, number][]) {
  if (pts.length < 3) return pts; const out: [number, number][] = []; let a = from, i = 0;
  while (i < pts.length) { let j = pts.length - 1; while (j > i && !lineClear(a, pts[j])) j--; out.push(pts[j]); a = pts[j]; i = j + 1; }
  return out;
}
export function astar(from: [number, number], tx: number, ty: number): [number, number][] | null {
  const sx = Math.floor(from[0] / CELL), sy = Math.floor(from[1] / CELL);
  const N = GW * GH, g = new Float32Array(N).fill(1e9), came = new Int32Array(N).fill(-1), closed = new Uint8Array(N);
  const heap: [number, number][] = [];
  const push = (i: number, f: number) => { heap.push([f, i]); let k = heap.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (heap[p][0] <= heap[k][0]) break; [heap[p], heap[k]] = [heap[k], heap[p]]; k = p; } };
  const pop = () => { const top = heap[0]; const last = heap.pop()!; if (heap.length) { heap[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === k) break; [heap[m], heap[k]] = [heap[k], heap[m]]; k = m; } } return top; };
  const h = (x: number, y: number) => { const dx = Math.abs(x - tx), dy = Math.abs(y - ty); return (dx + dy) + (1.414 - 2) * Math.min(dx, dy); };
  const s = sy * GW + sx, t = ty * GW + tx; g[s] = 0; push(s, h(sx, sy));
  const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
  let guard = 0;
  while (heap.length && guard++ < 60000) {
    const [, i] = pop(); if (closed[i]) continue; closed[i] = 1; if (i === t) break;
    const x = i % GW, y = (i / GW) | 0;
    for (const [dx, dy, c] of D) {
      const nx = x + dx, ny = y + dy; if (!walkable(nx, ny)) continue; if (dx && dy && (!walkable(x + dx, y) || !walkable(x, y + dy))) continue;
      const j = ny * GW + nx; const ng = g[i] + c; if (ng < g[j]) { g[j] = ng; came[j] = i; push(j, ng + h(nx, ny)); }
    }
  }
  if (came[t] === -1 && s !== t) return null;
  const path: number[] = []; let c = t; while (c !== -1 && c !== s) { path.push(c); c = came[c]; } path.reverse();
  return smooth(from, path.map(i => [(i % GW) * CELL + CELL / 2, ((i / GW) | 0) * CELL + CELL / 2] as [number, number]));
}
