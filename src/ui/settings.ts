/* Settings sheet: language, sound, music, graphics quality, reduced motion, controls, tutorial replay, about. */
import { save, persist, type Quality } from '../game/save';
import { hooks } from '../game/state';
import { L } from '../i18n';
import { sfx } from '../audio';
import { $, refreshText, setRerender } from './hud';
import { openSheet, closeSheet, qa, ICON_X } from './dom';

declare const __APP_VERSION__: string;
const sw = (id: string, on: boolean, label: string) =>
  `<button type="button" class="switch" role="switch" id="${id}" aria-checked="${on}" aria-label="${label}"><span></span></button>`;

export function openSettings() {
  const t = L(), st = save.settings; setRerender(openSettings);
  const qs: Quality[] = ['auto', 'low', 'medium', 'high'];
  const motionOn = st.reduceMotion ?? matchMedia('(prefers-reduced-motion: reduce)').matches;
  openSheet(`<div class="row"><div><div class="kicker">PASPORT PENANG</div><h2 id="sheet-title">${t.settings}</h2></div><button type="button" class="close" id="x" aria-label="${t.close}">${ICON_X}</button></div>
   <div class="set"><span class="set-l" id="l-lang">${t.lang}</span><div class="seg" role="group" aria-labelledby="l-lang"><button type="button" data-lang="bm" aria-pressed="${save.lang === 'bm'}">BM</button><button type="button" data-lang="en" aria-pressed="${save.lang === 'en'}">EN</button></div></div>
   <div class="set"><span class="set-l">${t.sound}</span>${sw('s-sound', st.sound, t.sound)}</div>
   <div class="set"><span class="set-l">${t.music}</span>${sw('s-music', st.music, t.music)}</div>
   <div class="set col"><span class="set-l" id="l-q">${t.graphics}</span><div class="seg wide" role="group" aria-labelledby="l-q">${qs.map(q => `<button type="button" data-q="${q}" aria-pressed="${st.quality === q}">${t.qual[q]}</button>`).join('')}</div><span class="small">${t.qualHint}</span></div>
   <div class="set col"><div class="set" style="padding:0;border:0"><span class="set-l">${t.motion}</span>${sw('s-motion', motionOn, t.motion)}</div><span class="small">${t.motionHint}</span></div>
   <div class="set col"><span class="set-l">${t.controls}</span><span class="small">${t.controlsTxt}</span></div>
   <button type="button" class="btn ghost" id="s-tut">${t.replayTut}</button>
   <div class="set col"><span class="set-l">${t.about}</span><span class="small">${t.aboutTxt}</span><span class="small">${t.version} ${typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : 'dev'}</span></div>`,
    () => {
      $('x').onclick = closeSheet;
      qa('[data-lang]').forEach(b => b.onclick = () => { save.lang = b.dataset.lang as any; persist(); refreshText(); hooks.applySettings(); openSettings(); });
      const toggle = (id: string, key: 'sound' | 'music') => $(id).onclick = () => { st[key] = !st[key]; persist(); hooks.applySettings(); sfx(660, .06); openSettings(); };
      toggle('s-sound', 'sound'); toggle('s-music', 'music');
      $('s-motion').onclick = () => { st.reduceMotion = !motionOn; persist(); hooks.applySettings(); openSettings(); };
      qa('[data-q]').forEach(b => b.onclick = () => { st.quality = b.dataset.q as Quality; persist(); hooks.applySettings(); sfx(520, .05); openSettings(); });
      $('s-tut').onclick = () => { save.tutorial = 0; persist(); closeSheet(); hooks.restartTutorial(); };
    });
}
