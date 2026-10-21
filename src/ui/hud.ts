/* HUD: top bar, quest pointer, proximity prompt, toasts, language switch. */
import { ZONE, IDS, STATIONS, TOTAL } from '../content';
import { save, persist, tierOf, doneCount } from '../game/save';
import { player, npcs, flags, hooks } from '../game/state';
import { questArrowDeg } from '../engine/core';
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
  const bs = Math.hypot(player.x - ZONE.start[0], player.y - ZONE.start[1]), fs = Math.hypot(player.x - ZONE.ferryStop[0], player.y - ZONE.ferryStop[1]);
  if (bs < 60 && bs < bd) { best = 'bus'; bd = bs; kind = 'bus'; }
  if (fs < 80 && fs < bd) { best = 'ferry'; bd = fs; kind = 'ferry'; }
  for (const n of npcs) { const d = Math.hypot(player.x - n.x, player.y - n.y); if (d < 60 && d < bd) { best = n.id; bd = d; kind = 'npc'; } }
  const id = bd < (kind === 'place' ? 90 : 80) ? best : null;
  if (id !== nearId || kind !== nearKind) { nearId = id; nearKind = kind; showPrompt(); }
  const q = nextTarget();
  if (q) { const [x, y] = ZONE.landmarks[q.id]; $('quest-arrow').style.transform = `rotate(${questArrowDeg(x, y)}deg)`; }
}
export function showPrompt() {
  const p = $('prompt'), h = $('hint'); const t = L();
  if (!nearId || flags.modalOpen) { p.hidden = true; h.hidden = flags.modalOpen || doneCount() > 0 || !flags.running; h.textContent = t.walk; return; }
  h.hidden = true; p.hidden = false;
  $('prompt-go').dataset.kind = nearKind || '';
  if (nearKind === 'place') { $('prompt-k').textContent = t.near + ' · ' + t.tiers[tierOf(nearId)].toUpperCase() + ' · ' + tierOf(nearId) + '/3'; $('prompt-name').textContent = nm(nearId); $('prompt-go').textContent = t.open; }
  else if (nearKind === 'npc') { const n = npcs.find(n => n.id === nearId); $('prompt-k').textContent = t.near; $('prompt-name').textContent = n.say[save.lang].split(' ').slice(0, 3).join(' ') + '…'; $('prompt-go').textContent = t.talk; }
  else { $('prompt-k').textContent = t.soon; $('prompt-name').textContent = nearKind === 'bus' ? t.bus : t.ferry; $('prompt-go').textContent = t.view; }
}
export function act() {
  if (!nearId) return;
  if (nearKind === 'place') hooks.openStation(nearId);
  else if (nearKind === 'npc') { const n = npcs.find(n => n.id === nearId); n.bubble = 3.2; sfx(660, .08); }
  else toast(nearKind === 'bus' ? L().busTxt : L().ferryTxt);
}
let rerender: () => void = () => {};
export const setRerender = (f: () => void) => { rerender = f; };
export function refreshText() {
  const t = L(); document.documentElement.lang = save.lang === 'bm' ? 'ms' : 'en';
  $('game').setAttribute('aria-label', t.canvas); $('btn-set').setAttribute('aria-label', t.settings);
  $('t-zone').textContent = ZONE.label[save.lang]; $('t-pass').textContent = t.pass; $('stamp-count').textContent = doneCount() + '/' + TOTAL;
  $('cat-count').textContent = save.cats.length + '/' + ZONE.cats.length; $('btn-cats').setAttribute('aria-label', t.cats);
  const q = nextTarget(); $('quest-text').innerHTML = q ? (q.gold ? t.nextGold(nm(q.id)) : t.next(nm(q.id))) : t.done;
  showPrompt();
}
let toastT = 0;
export function toast(m: string) { const el = $('toast'); el.textContent = m; el.hidden = false; clearTimeout(toastT); toastT = window.setTimeout(() => el.hidden = true, 3200); }
export function initHud() {
  $('prompt-go').addEventListener('click', act);
  hooks.refreshText = () => { refreshText(); rerender(); };
}
