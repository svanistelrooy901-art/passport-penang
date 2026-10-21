/* Title card + character creator (skin tone, hair incl. tudung). */
import { SKINS } from '../content';
import { save, persist, doneCount } from '../game/save';
import { flags, hooks } from '../game/state';
import { L } from '../i18n';
import { sfx } from '../audio';
import { $, refreshText } from './hud';
import { charPreview } from '../engine/character';

let timer = 0;
export const progress = { loaded: 0, total: 1 };
export function renderIntro() {
  const t = L(); const card = $('intro-card');
  card.innerHTML = `<div class="kicker">${t.ik}</div><h1>${t.ih}</h1><p>${t.ip}</p>
   <div class="kicker" style="color:#12384a">${t.make}</div>
   <div class="creator"><canvas id="cr" width="132" height="168"></canvas><div class="choices">
     <div class="lbl">${t.skin}</div><div class="sw">${SKINS.map((c, i) => `<button type="button" class="skin" data-s="${i}" aria-label="${t.skin} ${i + 1}" aria-pressed="${save.look.skin === i}" style="background:${c}"></button>`).join('')}</div>
     <div class="lbl">${t.hair}</div><div class="sw">${t.hairs.map((h: string, i: number) => `<button type="button" data-h="${i}" aria-pressed="${save.look.hair === i}">${h}</button>`).join('')}</div>
   </div></div>
   <button type="button" class="btn pink" id="start" ${flags.ready ? '' : 'disabled'}>${flags.ready ? t.start : t.loading + ' ' + Math.round(progress.loaded / progress.total * 100) + '%'}</button>
   <div class="small">${t.is}</div>`;
  card.querySelectorAll<HTMLElement>('[data-s]').forEach(b => b.onclick = () => { save.look.skin = +b.dataset.s!; persist(); renderIntro(); });
  card.querySelectorAll<HTMLElement>('[data-h]').forEach(b => b.onclick = () => { save.look.hair = +b.dataset.h!; persist(); renderIntro(); });
  $('start').onclick = startPlaying;
  const cr = $('cr') as HTMLCanvasElement; let k = 0; const dirs = ['down', 'right', 'up', 'left'];
  clearInterval(timer); charPreview(cr, save.look, save.outfit, 'down');
  timer = window.setInterval(() => { if (!document.body.contains(cr)) return clearInterval(timer); k = (k + 1) % 4; charPreview(cr, save.look, save.outfit, dirs[k]); }, 1100);
}
export function updateLoading() { const b = document.getElementById('start'); if (b && !flags.ready) b.textContent = L().loading + ' ' + Math.round(progress.loaded / progress.total * 100) + '%'; }
export function startPlaying() {
  if (!flags.ready) return; save.created = true; persist(); hooks.rebuildPlayer();
  $('intro').hidden = true; clearInterval(timer); flags.running = true; sfx(660, .08); refreshText();
}
export const shouldAutoStart = () => save.created && doneCount() > 0;
