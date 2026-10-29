/* Travel between zones: the stop's destination sheet, then a short map animation, then the next zone loads. */
import { OVERWORLD, ZONE, ZONE_ID, MODE, navigate, type TravelKind } from '../content';
import { save, persist, reducedMotion } from '../game/save';
import { L } from '../i18n';
import { sfx } from '../audio';
import { $, setRerender } from './hud';
import { openSheet, closeSheet, qa, esc, ICON_X } from './dom';
import { zoneState, zoneName, unlockNeed, routeKind, routePath } from '../game/zones';

const BASE = import.meta.env.BASE_URL;
export const zoneArt = (id: string) => `${BASE}overworld/${id}.webp`;

export function destRow(id: string, here = false) {
  const t = L(), st = zoneState(id), u = unlockNeed();
  const sub = here ? t.hereNow : st === 'soon' ? t.soonLock : st === 'locked' ? t.lockedZone(u.n, zoneName(u.zone, save.lang)) + ` (${u.have}/${u.n})` : t.travelGo + ' →';
  return `<button type="button" class="dest ${st !== 'open' || here ? 'lock' : ''}" data-dest="${id}" ${st !== 'open' || here ? 'aria-disabled="true"' : ''}><img src="${zoneArt(id)}" alt=""><span class="tx"><b>${esc(zoneName(id, save.lang))}</b><span class="small">${esc(sub)}</span></span></button>`;
}
export function openTravel(exitIndex: number) {
  const ex = ZONE.exits[exitIndex], t = L(); setRerender(() => openTravel(exitIndex));
  openSheet(`<div class="row"><div><div class="kicker">${t.travelIc[ex.kind]} · ${esc(ex.label[save.lang])}</div><h2 id="sheet-title">${t.travelTitle}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
    ${ex.to.map(id => destRow(id)).join('')}<button type="button" class="btn ghost" id="tmap">${t.travelMap}</button>`,
    () => {
      $('x').onclick = closeSheet; $('tmap').onclick = () => goMap();
      qa('.dest').forEach(b => b.onclick = () => { const d = b.dataset.dest!; if (zoneState(d) !== 'open') { sfx(220, .08); return; } travelTo(d, ex.kind); });
    });
}
/* the travel button: every other zone, from anywhere in play (the bus stop and jetty stay the everyday way) */
export function openTravelAll() {
  const t = L(); setRerender(() => openTravelAll());
  const others = OVERWORLD.zones.filter(z => z.id !== ZONE_ID);
  openSheet(`<div class="row"><div><div class="kicker">${t.travelK}</div><h2 id="sheet-title">${t.travelTitle}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
    <p class="small">${t.travelAll}</p>${others.map(z => destRow(z.id)).join('')}<button type="button" class="btn ghost" id="tmap">${t.travelMap}</button>`,
    () => {
      $('x').onclick = closeSheet; $('tmap').onclick = () => goMap();
      qa('.dest').forEach(b => b.onclick = () => { const d = b.dataset.dest!; if (zoneState(d) !== 'open') { sfx(220, .08); return; } travelTo(d); });
    });
}
export function goMap() { closeSheet(); navigate('map'); }

/* travel animation drawn on a small SVG of Penang (same approved outlines as the overworld) */
let svgBase = '';
function mapSvg() {
  if (svgBase) return svgBase;
  const [x0, y0, x1, y1] = OVERWORLD.bounds, pad = 60; const path = (r: number[][], close = true) => 'M' + r.map(p => p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join('L') + (close ? 'Z' : '');
  svgBase = `<svg viewBox="${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}" role="img" aria-hidden="true">
    ${OVERWORLD.land.map(r => `<path d="${path(r)}" fill="#e6d9b4" stroke="#8b7a5c" stroke-width="4"/>`).join('')}
    ${OVERWORLD.bridges.map(r => `<path d="${path(r)}" fill="#5a4b3b" stroke="#5a4b3b" stroke-width="8"/>`).join('')}
    ${OVERWORLD.ferries.map(r => `<path d="${path(r, false)}" fill="none" stroke="#fff" stroke-width="6" stroke-dasharray="14 12"/>`).join('')}
    ${OVERWORLD.zones.map(z => `<circle cx="${z.at[0]}" cy="${z.at[1]}" r="22" fill="${z.status === 'soon' ? '#b9ad90' : '#12384a'}" stroke="#fff" stroke-width="6"/>`).join('')}`;
  return svgBase;
}
export function travelTo(dest: string, kind?: TravelKind) {
  const from = MODE === 'map' ? save.zone : ZONE_ID; const k = kind || routeKind(from, dest); const t = L();
  closeSheet(); sfx(520, .08);
  const pts = routePath(from, dest, k); const d = 'M' + pts.map(p => p[0].toFixed(0) + ' ' + p[1].toFixed(0)).join('L');
  const ov = document.createElement('div'); ov.className = 'travel'; ov.setAttribute('role', 'status');
  ov.innerHTML = `<div class="kicker" style="color:#f3c46a">${t.travelIc[k]}</div><b>${t.travelling[k]} ${esc(zoneName(dest, save.lang))}…</b>
    ${mapSvg()}<path d="${d}" fill="none" stroke="#f3c46a" stroke-width="10" stroke-linecap="round" stroke-dasharray="4 18"/><circle id="veh" r="30" fill="#b8455f" stroke="#fff" stroke-width="8"/></svg>`;
  document.getElementById('app')!.appendChild(ov);
  const veh = ov.querySelector('#veh') as SVGCircleElement; const pathEl = ov.querySelectorAll('path'); const route = pathEl[pathEl.length - 1] as SVGPathElement; const len = route.getTotalLength();
  const dur = reducedMotion() ? 600 : 2600; const t0 = performance.now();
  save.zone = dest; persist();
  const step = (now: number) => {
    const p = Math.min(1, (now - t0) / dur), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2; const pt = route.getPointAtLength(e * len);
    veh.setAttribute('cx', String(pt.x)); veh.setAttribute('cy', String(pt.y));
    if (p < 1) requestAnimationFrame(step); else navigate(dest, from);
  };
  requestAnimationFrame(step);
}
