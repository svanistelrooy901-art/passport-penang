/* Shared runtime state and a small hook registry so engine and UI modules stay decoupled. */
import { ZONE } from '../content';

export const flags = { ready: false, running: false, modalOpen: false };
export const player = { x: ZONE.start[0], y: ZONE.start[1], dir: 'down', walk: 0, path: [] as [number, number][], speed: 170, moving: false, target: null as null | [number, number], intent: null as null | string };
export const npcs = ZONE.npcs.map((n: any) => Object.assign({ dir: 'down', walk: 0, path: [], speed: 60, wait: Math.random() * 3, home: [n.x, n.y], bubble: 0, moving: false }, n));
export const keysDown = new Set<string>();

export const hooks: {
  openStation: (id: string) => void; refreshText: () => void; toast: (m: string) => void; rebuildPlayer: () => void;
  resetWorld: () => void; startReveal: (r: any) => void; sfx: (f: number, d: number, t?: OscillatorType) => void;
  applySettings: () => void; restartTutorial: () => void; onStart: () => void; tutorial: (e: 'station' | 'game') => void;
} = {} as any;
