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
describe('settings & tutorial save migration', async () => {
  const { normalise, TUTORIAL_DONE, defaultSettings } = await import('../src/game/save');
  it('fills default settings for a Phase 0 save and skips the tutorial for returning players', () => {
    const s = normalise({ v: 1, games: { a: [1, 0, 0] }, created: true, lang: 'en' });
    expect(s.settings).toEqual(defaultSettings()); expect(s.tutorial).toBe(TUTORIAL_DONE); expect(s.games.b).toEqual([0, 0, 0]);
  });
  it('starts the tutorial for brand-new players', () => { expect(normalise(null).tutorial).toBe(0); expect(normalise({ v: 1, created: false }).tutorial).toBe(0); });
  it('keeps chosen settings and rejects unknown quality', () => {
    const s = normalise({ v: 1, created: true, tutorial: 2, settings: { music: false, quality: 'ultra' } });
    expect(s.settings.music).toBe(false); expect(s.settings.sound).toBe(true); expect(s.settings.quality).toBe('auto'); expect(s.tutorial).toBe(2);
  });
});
describe('music', async () => {
  const { _test } = await import('../src/audio');
  it('melody stays inside the pentatonic scale', () => { for (const n of _test.MEL) expect(n === -1 || (n >= 0 && n < _test.SCALE.length)).toBe(true); });
});
