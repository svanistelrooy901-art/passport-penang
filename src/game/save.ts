/* Per-device progress. Storage can be missing or throw (private mode); the game falls back to memory. */
import { IDS } from '../content';

export const SAVE_KEY = 'pasportPenang.save.v1';
export interface Save {
  v: 1; games: Record<string, number[]>; cats: number[]; outfit: string;
  look: { skin: number; hair: number }; lang: 'bm' | 'en'; created: boolean;
}
export const blank = (): Save => ({ v: 1, games: Object.fromEntries(IDS.map(i => [i, [0, 0, 0]])), cats: [], outfit: 'batik', look: { skin: 1, hair: 0 }, lang: 'bm', created: false });

function load(): Save {
  let s = blank();
  try {
    const raw = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (raw && raw.v === 1) s = Object.assign(blank(), raw);
  } catch { /* storage unavailable */ }
  for (const i of IDS) if (!Array.isArray(s.games[i]) || s.games[i].length !== 3) s.games[i] = [0, 0, 0];
  return s;
}
export let save: Save = load();
export function replaceSave(next: Save) { save = next; }
export function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ } }
export const tierOf = (id: string) => save.games[id].reduce((a, b) => a + b, 0);
export const doneCount = () => IDS.reduce((a, i) => a + tierOf(i), 0);
