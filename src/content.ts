/* Content loader: zones and stations are plain JSON under /content so new places are data, not code. */
import outfitsData from '../content/outfits.json';

export type Txt = { bm: string; en: string };
export interface Station {
  id: string; zone: string; order: number; coordinates: [number, number];
  name: Txt; category: Txt; blurb: Txt;
  official: { url: string; label: Txt | null };
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
  npcs: any[]; exits: any[];
}

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

export const ZONE_ID = 'george-town';
export const ZONE = ZONES[ZONE_ID];
export const W3 = WORLD3D[ZONE_ID];
export const IDS: string[] = ZONE.stations.slice().sort((a, b) => STATIONS[a].order - STATIONS[b].order);
export const TOTAL = IDS.length * 3;
export const OUTFITS: { id: string; need: number }[] = (outfitsData as any).outfits;
export const SKINS: string[] = (outfitsData as any).skins;
export const BASE = import.meta.env.BASE_URL;
export const zoneAsset = (f: string) => `${BASE}zones/${ZONE_ID}/${f}`;
export const sprite = (id: string, sketch = false) => zoneAsset(`sprites/${id}${sketch ? '-sketch' : ''}.webp`);
