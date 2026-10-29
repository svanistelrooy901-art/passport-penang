/* HUD: top bar, quest pointer, proximity prompt, toasts, language switch. */
import { ZONE, ZONE_ID, IDS, STATIONS, TOTAL, ALL_TOTAL } from '../content';
import { save, persist, tierOf, doneCount, doneIn, catsIn } from '../game/save';
import { player, npcs, flags, hooks } from '../game/state';
import { questArrowDeg } from '../engine/core';
import { exitPoint } from '../engine/world';
import { L } from '../i18n';
import { sfx } from '../audio';

export const $ = (id: string) => document.getElementById(id) as HTMLElement;
export const nm = (id: string) => STATIONS[id].name[save.lang];
let nearId: string | null = null, nearKind: string | null = null;

export function nextTarget() {
  for (const id of IDS) if (tierOf(id) === 0) return { id, gold: false };
  for (const id of IDS) if (tierOf(id) < 3) return { id, gold: true };
  return null;
}
export function updateHud() {
  let best: string | null = null, bd = 1e9, kind: string | null = null;
  for (const id of IDS) { const [x, y] = ZONE.triggers[id]; const d = Math.hypot(player.x - x, player.y - y); if (d < bd) { bd = d; best = id; kind = 'place'; } }
  ZONE.exits.forEach((ex, i) => { const [x, y] = exitPoint(ex); const d = Math.hypot(player.x - x, player.y - y); if (d < 70 && d < bd) { best = String(i); bd = d; kind = 'exit'; } });
  for (const n of npcs) { const d = Math.hypot(player.x - n.x, player.y - n.y); if (d < 60 && d < bd) { best = n.id; bd = d; kind = 'npc'; } }
  const id = bd < (kind === 'place' ? 90 : 80) ? best : null;
  if (id !== nearId || kind !== nearKind) { nearId = id; nearKind = kind; showPrompt(); }
  const q = nextTarget();
  if (q) { const [x, y] = ZONE.landmarks[q.id]; $('quest-arrow').style.transform = `rotate(${questArrowDeg(x, y)}deg)`; }
}
export function showPrompt() {
  const p = $('prompt'), h = $('hint'); const t = L();
  if (!nearId || flags.modalOpen) { p.hidden = true; h.hidden = flags.modalOpen || doneCount() > 0 || !flags.running || !IDS.length; h.textContent = t.walk; return; }
  h.hidden = true; p.hidden = false;
  $('prompt-go').dataset.kind = nearKind || '';
  if (nearKind === 'place') { $('prompt-k').textContent = t.near + ' · ' + t.tiers[tierOf(nearId)].toUpperCase() + ' · ' + tierOf(nearId) + '/3'; $('prompt-name').textContent = nm(nearId); $('prompt-go').textContent = t.open; }
  else if (nearKind === 'npc') { const n = npcs.find(n => n.id === nearId); $('prompt-k').textContent = t.near; $('prompt-name').textContent = n.say[save.lang].split(' ').slice(0, 3).join(' ') + '…'; $('prompt-go').textContent = t.talk; }
  else { const ex = ZONE.exits[+nearId]; $('prompt-k').textContent = t.travelK; $('prompt-name').textContent = ex.label[save.lang]; $('prompt-go').textContent = t.board[ex.kind]; }
}
export function act() {
  if (!nearId) return;
  if (nearKind === 'place') hooks.openStation(nearId);
  else if (nearKind === 'npc') { const n = npcs.find(n => n.id === nearId); n.bubble = 3.2; sfx(660, .08); }
  else if (nearKind === 'exit') hooks.openTravel(+nearId);
}
let rerender: () => void = () => {};
export const setRerender = (f: () => void) => { rerender = f; };
export function refreshText() {
  const t = L(); document.documentElement.lang = save.lang === 'bm' ? 'ms' : 'en';
  $('game').setAttribute('aria-label', t.canvas); $('btn-set').setAttribute('aria-label', t.settings);
  $('t-zone').textContent = ZONE.label[save.lang]; $('t-zname').textContent = ZONE.name[save.lang]; $('btn-map').setAttribute('aria-label', t.mapOpen); $('t-pass').textContent = t.pass;
  $('stamp-count').textContent = TOTAL ? doneIn(IDS) + '/' + TOTAL : doneCount() + '/' + ALL_TOTAL;
  $('cat-count').textContent = catsIn(ZONE_ID).length + '/' + ZONE.cats.length; $('btn-cats').setAttribute('aria-label', t.cats);
  const q = nextTarget(); $('quest-text').innerHTML = !IDS.length ? t.soonQuest : q ? (q.gold ? t.nextGold(nm(q.id)) : t.next(nm(q.id))) : t.done;
  showPrompt();
}
let toastT = 0;
export function toast(m: string) { const el = $('toast'); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = window.setTimeout(() => el.hidden = true, 3200); }
export function initHud() {
  $('prompt-go').addEventListener('click', act);
  hooks.refreshText = () => { refreshText(); rerender(); };
}
