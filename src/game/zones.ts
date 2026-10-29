/* Zone unlocks and routes between zones (shared by the zone HUD, the travel sheet and the overworld map). */
import { OVERWORLD, ZONES, zoneIds, type OwZone, type TravelKind } from '../content';
import { doneIn } from './save';

export const owZone = (id: string): OwZone | undefined => OVERWORLD.zones.find(z => z.id === id);
export const zoneName = (id: string, lang: 'bm' | 'en') => owZone(id)?.name[lang] || ZONES[id]?.name[lang] || id;
/** 'open': can travel; 'locked': needs stamps; 'soon': not built yet */
export function zoneState(id: string): 'open' | 'locked' | 'soon' {
  const z = owZone(id); if (!z || z.status === 'soon' || !ZONES[id]) return 'soon';
  if (id === OVERWORLD.unlock.zone) return 'open';
  return doneIn(zoneIds(OVERWORLD.unlock.zone)) >= OVERWORLD.unlock.stamps ? 'open' : 'locked';
}
export const unlockNeed = () => ({ n: OVERWORLD.unlock.stamps, zone: OVERWORLD.unlock.zone, have: doneIn(zoneIds(OVERWORLD.unlock.zone)) });
/** how you get from one zone to another: a zone exit that lists the destination wins, else the destination's usual way in */
export function routeKind(from: string, to: string): TravelKind {
  const ex = ZONES[from]?.exits.find(e => e.to.includes(to)); if (ex) return ex.kind;
  const z = owZone(to)!; if (z.via && from !== z.via) return 'bus';
  if (to === 'butterworth' && from !== 'george-town') return 'bridge';
  if (from === 'butterworth' && to !== 'george-town') return 'bridge';
  return z.arrive;
}
/** polyline (overworld units) for the travel animation */
export function routePath(from: string, to: string, kind: TravelKind): number[][] {
  const a = owZone(from)!.at, b = owZone(to)!.at;
  const near = (line: number[][], p: number[]) => Math.hypot(line[0][0] - p[0], line[0][1] - p[1]) < Math.hypot(line[line.length - 1][0] - p[0], line[line.length - 1][1] - p[1]);
  if (kind === 'ferry' && OVERWORLD.ferries[0]) { const f = OVERWORLD.ferries[0]; const l = near(f, a) ? f : f.slice().reverse(); return [a, ...l, b]; }
  if (kind === 'bridge' && OVERWORLD.bridges[0]) {
    const br = OVERWORLD.bridges[0]; let w = br[0], e = br[0]; for (const p of br) { if (p[0] < w[0]) w = p; if (p[0] > e[0]) e = p; }
    const [s, t] = Math.hypot(w[0] - a[0], w[1] - a[1]) < Math.hypot(e[0] - a[0], e[1] - a[1]) ? [w, e] : [e, w]; return [a, s, t, b];
  }
  const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; const bend = kind === 'funicular' ? 0 : .18;
  const c = [mx - dy * bend, my + dx * bend]; const pts: number[][] = [];
  for (let i = 0; i <= 24; i++) { const t = i / 24; pts.push([(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]); }
  return pts;
}

