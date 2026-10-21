/* Per-device progress. Storage can be missing or throw (private mode); the game falls back to memory. */
import { IDS } from '../content';

export const SAVE_KEY = 'pasportPenang.save.v1';
export type Quality = 'auto' | 'low' | 'medium' | 'high';
export interface Settings { sound: boolean; music: boolean; quality: Quality; reduceMotion: boolean | null }
export interface Save {
  v: 1; games: Record<string, number[]>; cats: number[]; outfit: string;
  look: { skin: number; hair: number }; lang: 'bm' | 'en'; created: boolean;
  settings: Settings; tutorial: number;
}
/** tutorial steps: 0 walk · 1 follow the arrow · 2 play a game · 3 first stamp explained · 4 done */
export const TUTORIAL_DONE = 4;
export const defaultSettings = (): Settings => ({ sound: true, music: true, quality: 'auto', reduceMotion: null });
export const blank = (): Save => ({
  v: 1, games: Object.fromEntries(IDS.map(i => [i, [0, 0, 0]])), cats: [], outfit: 'batik', look: { skin: 1, hair: 0 }, lang: 'bm', created: false,
  settings: defaultSettings(), tutorial: 0,
});

export function normalise(raw: any): Save {
  let s = blank();
  if (raw && raw.v === 1) {
    s = Object.assign(blank(), raw);
    s.settings = Object.assign(defaultSettings(), raw.settings || {});
    // players from Phase 0 already know the basics: skip the tutorial for them
    if (typeof raw.tutorial !== 'number') s.tutorial = raw.created ? TUTORIAL_DONE : 0;
  }
  for (const i of IDS) if (!Array.isArray(s.games[i]) || s.games[i].length !== 3) s.games[i] = [0, 0, 0];
  if (!['auto', 'low', 'medium', 'high'].includes(s.settings.quality)) s.settings.quality = 'auto';
  return s;
}
function load(): Save {
  try { return normalise(JSON.parse(localStorage.getItem(SAVE_KEY) || 'null')); } catch { return blank(); }
}
export let save: Save = load();
export function replaceSave(next: Save) { save = next; }
export function persist() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch { /* ignore */ } }
export const tierOf = (id: string) => save.games[id].reduce((a, b) => a + b, 0);
export const doneCount = () => IDS.reduce((a, i) => a + tierOf(i), 0);
export const reducedMotion = () => save.settings.reduceMotion ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
