/* Station hub, stamp award, Kisah page, Pasport and wardrobe. */
import { STATIONS, IDS, TOTAL, ZONE, OUTFITS, sprite } from '../content';
import { save, persist, tierOf, doneCount, blank, replaceSave } from '../game/save';
import { player, hooks } from '../game/state';
import { L } from '../i18n';
import { sfx } from '../audio';
import { $, nm, toast, setRerender } from './hud';
import { openSheet, closeSheet, q, qa, esc, icon, ICON_X, ICON_BACK, ICON_TICK } from './dom';
import { startGame } from './games';
import { charPreview } from '../engine/character';
import { RADII } from '../engine/world';

export const TIER_COL = ['#8d7c5c', '#b07a43', '#8f9aa6', '#e2a93f'];
const FADE = [0, .45, .75, 1];
const medals = (id: string) => { const t = tierOf(id); return `<div class="medals" aria-label="${L().tiers[t]}">${['b', 's', 'g'].map((c, i) => `<span class="medal ${c} ${t > i ? 'on' : ''}">${t > i ? L().tiers[i + 1][0] : ''}</span>`).join('')}</div>`; };

export function openStation(id: string) {
  player.path = []; hooks.tutorial('station'); const st = STATIONS[id], t = L(); const tier = tierOf(id); setRerender(() => openStation(id));
  const gamesHtml = st.games.map((g, i) => { const d = save.games[id][i];
    return `<button type="button" class="game ${d ? 'done' : ''}" data-g="${i}"><span class="ic">${icon(g.type, d ? '#12384a' : undefined)}</span><span class="tx"><b>${esc(g.title[save.lang])}</b><span>${t.game} ${i + 1} · ${d ? t.done1 : t.play}</span></span>${d ? `<span class="tick">${ICON_TICK}</span>` : ''}</button>`; }).join('');
  const lock = tier < 3;
  openSheet(`<div class="row"><div><div class="kicker">${esc(st.category[save.lang])} · ${t.games}</div><h2 id="sheet-title">${esc(nm(id))}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
   <div class="art"><img src="${sprite(id, !tier)}" alt="${esc(nm(id))}" style="${tier && tier < 3 ? 'filter:saturate(' + (.35 + tier * .3) + ')' : ''}"></div>
   <div class="row" style="justify-content:space-between"><b style="font-size:14px">${t.tiers[tier]} · ${tier}/3</b>${medals(id)}</div>
   <p>${esc(st.blurb[save.lang])}</p><div class="games">${gamesHtml}</div>
   <button type="button" class="kisah-btn ${lock ? 'locked' : ''}" id="kis"><svg aria-hidden="true" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${lock ? '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>' : '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2zM4 21V5M8 7h7"/>'}</svg><span style="display:flex;flex-direction:column;gap:2px"><b>${t.kisah}</b><span style="font-size:12px;font-weight:800">${lock ? t.kisahLock : t.kisahOpen}</span></span></button>`,
    () => { $('x').onclick = closeSheet; qa('.game').forEach(b => b.onclick = () => startGame(id, +b.dataset.g!)); $('kis').onclick = () => { if (tierOf(id) === 3) openKisah(id); else { sfx(220, .08); toast(t.kisahLock); } }; });
}
export function complete(id: string, gi: number) {
  const before = tierOf(id), beforeDone = doneCount();
  if (!save.games[id][gi]) { save.games[id][gi] = 1; persist(); }
  const after = tierOf(id);
  if (after > before) hooks.startReveal({ id, r: RADII[before] || 20, r0: RADII[before] || 20, target: RADII[after], fromF: FADE[before], toF: FADE[after] });
  const unlocked = OUTFITS.find(o => o.need > beforeDone && o.need <= doneCount());
  sfx(140, .25, 'triangle'); setTimeout(() => sfx(990, .12), 120); hooks.tutorial('game');
  showStamp(id, after, after > before, unlocked);
}
function stampSvg(id: string, tier: number) {
  const col = TIER_COL[tier]; const d = new Date(); const ds = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getFullYear()).slice(2)}`;
  return `<div class="stamp"><svg role="img" aria-label="${esc(nm(id))} · ${L().tiers[tier]}" width="150" height="150" viewBox="0 0 156 156"><defs><path id="ring-${id}" d="M78 78m-58 0a58 58 0 1 1 116 0a58 58 0 1 1 -116 0"/></defs><circle cx="78" cy="78" r="76" fill="#fffaf0"/><circle cx="78" cy="78" r="72" fill="none" stroke="${col}" stroke-width="4"/><circle cx="78" cy="78" r="66" fill="none" stroke="${col}" stroke-width="1.2" stroke-dasharray="3 3"/><circle cx="78" cy="78" r="48" fill="${col}" fill-opacity=".22"/><text font-family="Nunito Sans, sans-serif" font-size="10.5" font-weight="900" letter-spacing="2.2" fill="${col}"><textPath href="#ring-${id}" startOffset="2%">${esc(nm(id).toUpperCase())} · ${L().tiers[tier].toUpperCase()} · ${ds} ·</textPath></text></svg><img src="${sprite(id)}" alt=""></div>`;
}
function showStamp(id: string, tier: number, fresh: boolean, unlocked: any) {
  const t = L(); const allGold = IDS.every(i => tierOf(i) === 3); setRerender(() => showStamp(id, tier, false, null));
  openSheet(`<div class="row"><div class="kicker">${fresh ? t.stamped(t.tiers[tier]) : esc(nm(id))}</div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
    ${stampSvg(id, tier)}<h2 id="sheet-title" style="text-align:center">${esc(nm(id))} · ${t.tiers[tier]}</h2><div style="display:flex;justify-content:center">${medals(id)}</div>
    ${tier === 3 ? `<div class="fb good" style="text-align:center"><b>${t.goldUnlocked}</b></div><button type="button" class="btn gold" id="rk">${t.readKisah}</button>` : `<p style="text-align:center">${t.toNext(3 - tier)}</p>`}
    ${allGold && fresh ? `<div class="fb good" style="text-align:center"><b>${t.badge}</b><br><span class="small">${t.badgeSub}</span></div>` : ''}
    ${unlocked ? `<div class="fb" style="text-align:center">${esc(t.newOutfit(t.outfits[unlocked.id]))}</div>` : ''}
    <button type="button" class="btn ${tier === 3 ? 'ghost' : 'pink'}" id="bs">${t.backStation}</button>`,
    () => { $('x').onclick = closeSheet; $('bs').onclick = () => openStation(id); const r = document.getElementById('rk'); if (r) r.onclick = () => openKisah(id); });
}
export function openKisah(id: string) {
  const st = STATIONS[id], k = st.kisah, t = L(), lg = save.lang; setRerender(() => openKisah(id));
  const [lon, lat] = st.coordinates; const maps = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
  const offLabel = st.official.label ? st.official.label[lg] : t.official;
  const partner = st.partner ? `<a class="partner" href="${st.partner.url}" target="_blank" rel="noopener sponsored"><span>${t.partnerTag}</span><span>${esc(st.partner.label[lg])} ↗</span></a>` : `<div class="partner"><span>${t.partnerTag}</span><span>${t.partner}</span></div>`;
  openSheet(`<div class="row"><button type="button" class="back" id="bk">${ICON_BACK}${t.back}</button><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
   <div class="kis"><div class="art"><img src="${sprite(id)}" alt="${esc(nm(id))}"></div><div class="kicker">${t.kisah} · ${esc(st.category[lg])}</div><h2 id="sheet-title">${esc(nm(id))}</h2>
    <p>${esc(k.intro[lg])}</p><ul>${k.facts[lg].map(f => `<li>${esc(f)}</li>`).join('')}</ul>
    <div class="box"><h3>${t.lookFor}</h3><ul style="margin-top:6px">${k.look[lg].map(f => `<li>${esc(f)}</li>`).join('')}</ul></div>
    <div class="fb good"><b>${t.didYou}</b> ${esc(k.fun[lg])}</div>
    <div class="kicker" style="color:#12384a">${t.visit}</div>
    <div class="links"><a class="btn navy" href="${st.official.url}" target="_blank" rel="noopener">${offLabel}</a><a class="btn ghost" href="${maps}" target="_blank" rel="noopener">${t.maps}</a></div>
    ${partner}<div class="src"><b>${t.sources}:</b> ${k.src.map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${esc(n)}</a>`).join(' · ')}</div></div>`,
    () => { $('x').onclick = closeSheet; $('bk').onclick = () => openStation(id); });
}
const rankName = () => { const n = doneCount(), t = L(); return t.ranks[n >= 15 ? 3 : n >= 9 ? 2 : n >= 3 ? 1 : 0]; };
export function openPassport() {
  const t = L(), n = doneCount(); setRerender(openPassport);
  const cells = IDS.map(id => { const tr = tierOf(id); return `<button type="button" class="st t${tr}" data-id="${id}"><span class="c"><img src="${sprite(id, !tr)}" alt=""></span><span>${esc(nm(id))}</span><span class="small">${t.tiers[tr]}</span></button>`; }).join('');
  openSheet(`<div class="row"><div><div class="kicker">PASPORT PENANG</div><h2 id="sheet-title">${t.passTitle}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
   <div class="row"><canvas id="pv" width="80" height="100" style="width:64px;height:80px;border-radius:14px;background:#e9dcbd"></canvas>
    <div style="flex:1;display:flex;flex-direction:column;gap:6px"><div style="display:flex;justify-content:space-between;font-size:13px;font-weight:900"><span>${rankName()} · ${esc(ZONE.name[save.lang])}</span><span>${t.stamps(n, TOTAL)}</span></div>
    <div class="bar"><i style="width:${n / TOTAL * 100}%"></i></div><div class="small">${t.cats}: ${t.catsTxt(save.cats.length, ZONE.cats.length)}</div></div></div>
   <div class="grid3">${cells}</div><button type="button" class="btn navy" id="wd">${t.wardrobe}</button><div class="small">${t.note}</div>
   <div id="rs"><button type="button" class="btn ghost" id="reset" style="width:100%">${t.reset}</button></div>`,
    () => {
      $('x').onclick = closeSheet; charPreview($('pv') as HTMLCanvasElement, save.look, save.outfit);
      qa('.st').forEach(b => b.onclick = () => { const id = b.dataset.id!; if (tierOf(id) === 3) openKisah(id); else openStation(id); });
      $('wd').onclick = openWardrobe;
      $('reset').onclick = () => {
        $('rs').innerHTML = `<div class="fb" style="display:flex;gap:8px;align-items:center;justify-content:space-between;flex-wrap:wrap"><span>${t.resetQ}</span><span style="display:flex;gap:8px"><button type="button" class="btn ghost" id="rn">${t.no}</button><button type="button" class="btn pink" id="ry">${t.yes}</button></span></div>`;
        $('rn').onclick = openPassport;
        $('ry').onclick = () => { const nb = blank(); nb.lang = save.lang; nb.look = save.look; nb.created = true; replaceSave(nb); persist(); hooks.resetWorld(); closeSheet(); };
      };
    });
}
export function openWardrobe() {
  const t = L(), n = doneCount(); setRerender(openWardrobe);
  const cells = OUTFITS.map(o => { const ok = n >= o.need; return `<button type="button" class="ward ${ok ? '' : 'lock'}" data-o="${o.id}" aria-pressed="${save.outfit === o.id}" ${ok ? '' : 'aria-disabled="true"'}><canvas width="90" height="112" data-o="${o.id}"></canvas><span>${t.outfits[o.id]}</span><small>${ok ? (save.outfit === o.id ? '✓' : t.wear) : t.locked(o.need)}</small></button>`; }).join('');
  openSheet(`<div class="row"><button type="button" class="back" id="bk">${ICON_BACK}${t.back}</button><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div><h2 id="sheet-title">${t.wardrobe}</h2><div class="wardrobe">${cells}</div>`,
    () => {
      $('x').onclick = closeSheet; $('bk').onclick = openPassport;
      qa('.ward canvas').forEach(c => charPreview(c as HTMLCanvasElement, save.look, c.dataset.o!));
      qa('.ward').forEach(b => b.onclick = () => { const o = OUTFITS.find(x => x.id === b.dataset.o)!; if (n < o.need) { sfx(220, .08); toast(t.locked(o.need)); return; } save.outfit = o.id; persist(); hooks.rebuildPlayer(); sfx(660, .08); openWardrobe(); });
    });
}
export { q };
