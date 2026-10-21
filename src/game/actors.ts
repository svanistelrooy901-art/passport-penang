/* Player and NPC movement on the walk grid. */
import { player, keysDown } from './state';
import { astar, nearestWalkable, walkableAt, CELL } from '../engine/pathfinding';
import { camS, screenDirToWorld } from '../engine/core';

export function goTo(wx: number, wy: number, intent?: string) {
  const t = nearestWalkable(Math.floor(wx / CELL), Math.floor(wy / CELL)); if (!t) return;
  const p = astar([player.x, player.y], t[0], t[1]); if (!p) return;
  player.path = p; player.target = [t[0] * CELL + CELL / 2, t[1] * CELL + CELL / 2]; player.intent = intent || null; camS.panX = camS.panZ = 0;
}
export function stepActor(a: any, dt: number) {
  if (!a.path.length) { a.moving = false; return; }
  const [tx, ty] = a.path[0]; const dx = tx - a.x, dy = ty - a.y, d = Math.hypot(dx, dy); const s = a.speed * dt;
  if (d <= s) { a.x = tx; a.y = ty; a.path.shift(); } else { a.x += dx / d * s; a.y += dy / d * s; }
  a.moving = true; a.walk += dt * 11;
}
export function stepKeys(dt: number) {
  let kx = 0, ky = 0;
  if (keysDown.has('ArrowLeft') || keysDown.has('a')) kx--; if (keysDown.has('ArrowRight') || keysDown.has('d')) kx++;
  if (keysDown.has('ArrowUp') || keysDown.has('w')) ky--; if (keysDown.has('ArrowDown') || keysDown.has('s')) ky++;
  if (!kx && !ky) return false;
  player.path = []; player.intent = null; camS.panX = camS.panZ = 0;
  const l = Math.hypot(kx, ky); const s = player.speed * dt; const [wx, wz] = screenDirToWorld(kx / l, ky / l);
  const nx = player.x + wx * s, ny = player.y + wz * s;
  if (walkableAt(nx, player.y)) player.x = nx; if (walkableAt(player.x, ny)) player.y = ny;
  player.moving = true; player.walk += dt * 11; return true;
}
export function stepNpc(n: any, dt: number) {
  if (!n.wander) { n.moving = false; return; }
  if (n.path.length) { stepActor(n, dt); return; }
  n.moving = false; n.wait -= dt; if (n.wait > 0) return; n.wait = 2 + Math.random() * 4;
  const ang = Math.random() * Math.PI * 2, r = 60 + Math.random() * 160;
  const t = nearestWalkable(Math.floor((n.home[0] + Math.cos(ang) * r) / CELL), Math.floor((n.home[1] + Math.sin(ang) * r) / CELL)); if (!t) return;
  const p = astar([n.x, n.y], t[0], t[1]); if (p && p.length < 40) n.path = p;
}
