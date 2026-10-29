import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const stations = readdirSync('content/stations').map(f => JSON.parse(readFileSync('content/stations/' + f, 'utf8')));
const zone = JSON.parse(readFileSync('content/zones/george-town.json', 'utf8'));
const both = (t: any) => typeof t?.bm === 'string' && t.bm.trim() && typeof t?.en === 'string' && t.en.trim();
const TYPES = ['quiz', 'multi', 'find', 'puzzle', 'order', 'memory'];

describe('approved geography is untouched', () => {
  const approval = JSON.parse(readFileSync('data/geography/geography-approval.json', 'utf8'));
  const files: Record<string, string> = { 'data/geography.geojson': 'geography.geojson', 'data/places.json': 'places.json', 'data/source-receipts.json': 'source-receipts.json' };
  for (const [key, file] of Object.entries(files)) {
    it(file, () => {
      const hash = createHash('sha256').update(readFileSync('data/geography/' + file)).digest('hex');
      const want = approval.files[key];
      expect(want, 'hash recorded in geography-approval.json').toBeTruthy();
      expect(hash).toBe(want);
    });
  }
});

describe('stations', () => {
  it('route order is unique', () => { const o = stations.map(s => s.order); expect(new Set(o).size).toBe(o.length); });
  it('every zone station has a content file', () => { for (const id of zone.stations) expect(stations.find(s => s.id === id), id).toBeTruthy(); });
  for (const st of stations) describe(st.id, () => {
    it('has BM and EN text', () => { for (const k of ['name', 'category', 'blurb']) expect(both(st[k]), k).toBeTruthy(); });
    it('has exactly 3 valid games', () => {
      expect(st.games).toHaveLength(3);
      for (const g of st.games) {
        expect(TYPES).toContain(g.type); expect(both(g.title)).toBeTruthy();
        if (g.type === 'quiz') { expect(g.opts.filter((o: any) => o.ok)).toHaveLength(1); expect(both(g.ask) && both(g.why)).toBeTruthy(); g.opts.forEach((o: any) => expect(both(o)).toBeTruthy()); }
        if (g.type === 'multi') { expect(g.opts.filter((o: any) => o.ok)).toHaveLength(g.need); }
        if (g.type === 'find') { expect(g.targets.length).toBeGreaterThanOrEqual(3); g.targets.forEach((t: any) => { expect(both(t)).toBeTruthy(); expect(t.pts.length).toBeGreaterThan(0); }); }
        if (g.type === 'order') { expect(g.items.length).toBeGreaterThanOrEqual(3); g.items.forEach((t: any) => expect(both(t)).toBeTruthy()); }
        if (g.type === 'memory') { expect(g.pairs.length).toBeGreaterThanOrEqual(3); }
      }
    });
    it('Kisah is complete and sourced', () => {
      const k = st.kisah; expect(both(k.intro) && both(k.fun)).toBeTruthy();
      expect(k.facts.bm.length).toBe(k.facts.en.length); expect(k.facts.bm.length).toBeGreaterThanOrEqual(3);
      expect(k.look.bm.length).toBe(k.look.en.length);
      expect(k.src.length).toBeGreaterThan(0); for (const [, u] of k.src) expect(u).toMatch(/^https:\/\//);
    });
    it('has coordinates, artwork and (when set) an https official link', () => {
      if (st.official) expect(st.official.url).toMatch(/^https:\/\//);
      const [lon, lat] = st.coordinates; expect(lon).toBeGreaterThan(100); expect(lon).toBeLessThan(100.6); expect(lat).toBeGreaterThan(5.1); expect(lat).toBeLessThan(5.6);
      expect(existsSync(`public/zones/${st.zone}/sprites/${st.id}.webp`)).toBe(true); expect(existsSync(`public/zones/${st.zone}/sprites/${st.id}-sketch.webp`)).toBe(true);
      for (const key of ['landmarks', 'triggers', 'sprites']) expect(zone[key][st.id], key).toBeTruthy();
    });
    it('find-game hotspots sit inside the sprite', () => {
      const [w, h] = zone.sprites[st.id];
      for (const g of st.games.filter((g: any) => g.type === 'find')) for (const t of g.targets) for (const [x, y] of t.pts) { expect(x, t.en).toBeGreaterThanOrEqual(0); expect(x, t.en).toBeLessThanOrEqual(w); expect(y, t.en).toBeGreaterThanOrEqual(0); expect(y, t.en).toBeLessThanOrEqual(h); }
    });
    it('records fact-check date and owner review state', () => { expect(st.factsChecked).toMatch(/^\d{4}-\d{2}-\d{2}$/); expect(['pending', 'approved']).toContain(st.review.owner); });
  });
});
