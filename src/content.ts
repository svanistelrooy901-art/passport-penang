/* Content loader: zones and stations are plain JSON under /content so new places are data, not code. */
import outfitsData from '../content/outfits.json';
import overworldData from '../content/overworld.json';

export type Txt = { bm: string; en: string };
export interface Station {
  id: string; zone: string; order: number; coordinates: [number, number];
  name: Txt; category: Txt; blurb: Txt;
  official: { url: string; label: Txt | null } | null;
  partner: { url: string; label: Txt } | null;
  games: any[];
  kisah: { intro: Txt; facts: { bm: string[]; en: string[] }; look: { bm: string[]; en: string[] }; fun: Txt; src: [string, string][] };
  factsChecked: string; review: { owner: string };
}
export interface Zone {
  id: string; name: Txt; label: Txt; stations: string[];
  world: { w: number; h: number; cell: number; grid: [number, number] };
  landmarks: Record<string, [number, number]>; sprites: Record<string, [number, number]>; triggers: Record<string, [number, number]>;
  start: [number, number]; ferryStop: [number, number]; ferryLine: [number, number][]; cats: [number, number][];
  npcs: any[]; exits: Exit[]; placeholder?: boolean;
}
export type TravelKind = 'bus' | 'ferry' | 'funicular' | 'bridge';
export interface Exit { kind: TravelKind; at: string | [number, number]; to: string[]; label: Txt }
export interface OwZone { id: string; name: Txt; at: [number, number]; lonlat: [number, number]; arrive: TravelKind; status: 'open' | 'soon'; via?: string }
export interface Overworld { scale: number; bounds: [number, number, number, number]; land: number[][][]; bridges: number[][][]; ferries: number[][][]; zones: OwZone[]; unlock: { zone: string; stamps: number } }

const zoneFiles = import.meta.glob('../content/zones/*.json', { eager: true, import: 'default' }) as Record<string, any>;
const stationFiles = import.meta.glob('../content/stations/*.json', { eager: true, import: 'default' }) as Record<string, Station>;

export const ZONES: Record<string, Zone> = {};
export const WORLD3D: Record<string, any> = {};
for (const [path, data] of Object.entries(zoneFiles)) {
  const file = path.split('/').pop()!;
  if (file.endsWith('.world3d.json')) WORLD3D[file.replace('.world3d.json', '')] = data;
  else ZONES[data.id] = data as Zone;
}
export const STATIONS: Record<string, Station> = {};
for (const st of Object.values(stationFiles)) STATIONS[st.id] = st;

/* One zone (or the overworld map) per page load: ?z=<zone id> or ?z=map. Travel reloads the page, so only
   one zone's world is ever in memory. */
export const OVERWORLD = overworldData as unknown as Overworld;
/* page state lives in the hash (#z=air-itam&from=george-town) so any static host or preview can serve it */
export const navParams = (() => { const p = new URLSearchParams(typeof location !== 'undefined' ? location.search : ''); if (typeof location !== 'undefined') new URLSearchParams(location.hash.slice(1)).forEach((v, k) => p.set(k, v)); return p; })();
export const TEST = navParams.has('test');
export function navigate(z: string, from?: string) { const h = new URLSearchParams(); h.set('z', z); if (from) h.set('from', from); if (TEST) h.set('test', ''); location.hash = h.toString(); location.reload(); }
const req = navParams.get('z');
export const MODE: 'zone' | 'map' = req === 'map' ? 'map' : 'zone';
export const ZONE_ID = req && ZONES[req] ? req : 'george-town';
export const ZONE = ZONES[ZONE_ID];
export const W3 = WORLD3D[ZONE_ID];
const byOrder = (ids: string[]) => ids.slice().sort((a, b) => STATIONS[a].order - STATIONS[b].order);
export const zoneIds = (zid: string) => byOrder(ZONES[zid]?.stations || []);
export const IDS: string[] = zoneIds(ZONE_ID);
export const TOTAL = IDS.length * 3;
export const ALL_IDS: string[] = Object.keys(ZONES).flatMap(zoneIds);
export const ALL_TOTAL = ALL_IDS.length * 3;
export const OUTFITS: { id: string; need: number }[] = (outfitsData as any).outfits;
export const SKINS: string[] = (outfitsData as any).skins;
export const BASE = import.meta.env.BASE_URL;
export const zoneAsset = (f: string) => `${BASE}zones/${ZONE_ID}/${f}`;
export const sprite = (id: string, sketch = false) => zoneAsset(`sprites/${id}${sketch ? '-sketch' : ''}.webp`);
