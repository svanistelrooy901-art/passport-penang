/* First-time guided tutorial: walk → follow the arrow → open a station and play → first stamp explained.
   Short, child-friendly steps; skippable; replayable from Settings. */
import { IDS, STATIONS } from '../content';
import { save, persist, TUTORIAL_DONE } from '../game/save';
import { flags, player } from '../game/state';
import { L } from '../i18n';
import { $ } from './hud';

let origin: [number, number] | null = null;
const coach = () => $('coach');
export function setTutorialOrigin() { origin = [player.x, player.y]; }
function nextStationName() { const id = IDS[0]; return STATIONS[id].name[save.lang]; }
export function renderTutorial() {
  const el = coach(); const step = save.tutorial; const t = L();
  const show = flags.running && !flags.modalOpen && step < TUTORIAL_DONE;
  el.hidden = !show; $('quest').classList.toggle('pulse', show && step === 1);
  if (!show) return;
  const text = t.tut[step].replace('{n}', nextStationName());
  const html = `<div class="coach-t"><span class="small">${t.tutStep(step + 1, TUTORIAL_DONE)}</span><b>${text}</b>${step === 0 ? `<span class="small">${t.tutCam}</span>` : ''}</div>` +
    (step === 3 ? `<button type="button" class="btn gold" id="tut-ok">${t.tutOk}</button>` : `<button type="button" class="btn ghost light" id="tut-skip">${t.tutSkip}</button>`);
  if ((el as any)._h !== html) {
    el.innerHTML = html; (el as any)._h = html;
    const ok = document.getElementById('tut-ok'); if (ok) ok.onclick = () => advance(TUTORIAL_DONE);
    const sk = document.getElementById('tut-skip'); if (sk) sk.onclick = () => advance(TUTORIAL_DONE);
  }
}
function advance(to: number) { if (to <= save.tutorial) return; save.tutorial = to; persist(); renderTutorial(); }
/** called every frame while playing */
export function tutorialTick() {
  if (save.tutorial >= TUTORIAL_DONE) { if (!coach().hidden) renderTutorial(); return; }
  if (save.tutorial === 0 && origin && Math.hypot(player.x - origin[0], player.y - origin[1]) > 40) advance(1);
  if (save.tutorial === 1 && !$('prompt').hidden && $('prompt-go').dataset.kind === 'place') advance(2);
  renderTutorial();
}
export function tutorialEvent(e: 'station' | 'game') {
  if (e === 'station' && save.tutorial < 2) advance(2);
  if (e === 'game' && save.tutorial < 3) advance(3);
}
