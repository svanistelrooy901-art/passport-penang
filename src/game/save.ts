/* Per-device progress. Storage can be missing or throw (private mode); the game falls back to memory. */
import { ALL_IDS, ZONES } from '../content';

export const SAVE_KEY = 'pasportPenang.save.v1';
export type Quality = 'auto' | 'low' | 'medium' | 'high';
export interface Settings { sound: boolean; music: boolean; quality: Quality; reduceMotion: boolean | null }
export interface Save {
  v: 1; games: Record<string, number[]>; cats: Record<string, number[]>; outfit: string; zone: string;
  look: { skin: number; hair: number }; lang: 'bm' | 'en'; created: boolean;
  settings: Settings; tutorial: number;
}
/** tutorial steps: 0 walk · 1 follow the arrow · 2 play a game · 3 first stamp explained · 4 done */
export const TUTORIAL_DONE = 4;
export const defaultSettings = (): Settings => ({ sound: true, music: true, quality: 'auto', reduceMotion: null });
export const blank = (): Save => ({
  v: 1, games: Object.fromEntries(ALL_IDS.map(i => [i, [0, 0, 0]])), cats: {}, outfit: 'batik', zone: 'george-town', look: { skin: 1, hair: 0 }, lang: 'bm', created: false,
  settings: defaultSettings(), tutorial: 0,
});

export function normalise(raw: any): Save {
  let s = blank();
  if (raw && raw.v === 1) {
    s = Object.assign(blank(), raw);
    s.settings = Object.assign(defaultSettings(), raw.settings || {});
    // players from Phase 0 already know the basics: skip the tutorial for them
    if (typeof raw.tutorial !== 'number') s.tutorial = raw.created ? TUTORIAL_DONE : 0;
    // Phase 3: cats are counted per zone (older saves only had George Town)
    if (Array.isArray(raw.cats)) s.cats = { 'george-town': raw.cats };
    if (!s.cats || typeof s.cats !== 'object') s.cats = {};
    if (!ZONES[s.zone]) s.zone = 'george-town';
  }
  for (const i of ALL_IDS) if (!Array.isArray(s.games[i]) || s.games[i].length !== 3) s.games[i] = [0, 0, 0];
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
export const doneIn = (ids: string[]) => ids.reduce((a, i) => a + tierOf(i), 0);
/** stamps across every zone (outfits, rank) */
export const doneCount = () => doneIn(ALL_IDS);
export const catsIn = (zid: string) => save.cats[zid] || (save.cats[zid] = []);
export const reducedMotion = () => save.settings.reduceMotion ?? (typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
