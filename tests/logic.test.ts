import { describe, it, expect, vi } from 'vitest';
vi.mock('../src/content', () => ({ IDS: ['a', 'b'], ZONE: { world: { grid: [10, 10], cell: 10 } } }));

describe('save', async () => {
  const { blank, tierOf, doneCount, replaceSave } = await import('../src/game/save');
  it('starts empty and counts tiers', () => {
    const s = blank(); replaceSave(s); expect(doneCount()).toBe(0);
    s.games.a = [1, 1, 0]; s.games.b = [1, 0, 0]; expect(tierOf('a')).toBe(2); expect(doneCount()).toBe(3);
  });
});
describe('pathfinding', async () => {
  const pf = await import('../src/engine/pathfinding');
  it('routes around a wall', () => {
    const g = new Uint8Array(100).fill(1); for (let y = 0; y < 8; y++) g[y * 10 + 5] = 0; pf.setGrid(g);
    const path = pf.astar([15, 15], 8, 1)!; expect(path).toBeTruthy();
    const end = path[path.length - 1]; expect(Math.floor(end[0] / 10)).toBe(8); expect(Math.floor(end[1] / 10)).toBe(1);
    for (const [x, y] of path) expect(pf.walkableAt(x, y)).toBe(true);
  });
  it('finds the nearest walkable cell', () => {
    const g = new Uint8Array(100); g[55] = 1; pf.setGrid(g); expect(pf.nearestWalkable(2, 2)).toEqual([5, 5]);
  });
});
