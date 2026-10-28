/* Bottom-sheet helper and shared icons. */
import { flags } from '../game/state';
import { $, refreshText, setRerender } from './hud';

const sheetWrap = () => $('sheet-wrap'); const sheet = () => $('sheet');
export const esc = (s: string) => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' } as any)[c]);
let opener: HTMLElement | null = null;
export function openSheet(html: string, after?: () => void) {
  if (!flags.modalOpen) opener = document.activeElement as HTMLElement;
  const s = sheet(); s.innerHTML = html; sheetWrap().hidden = false; flags.modalOpen = true; $('prompt').hidden = true; $('hint').hidden = true; s.scrollTop = 0;
  if (after) after(); const f = s.querySelector('.close,button,a') as HTMLElement; if (f) f.focus({ preventScroll: true });
}
export function closeSheet() { sheetWrap().hidden = true; flags.modalOpen = false; setRerender(() => {}); refreshText(); if (opener && document.body.contains(opener)) opener.focus({ preventScroll: true }); opener = null; }
export const q = (sel: string) => sheet().querySelector(sel) as HTMLElement;
export const qa = (sel: string) => Array.from(sheet().querySelectorAll(sel)) as HTMLElement[];
export const ICON_X = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
export const ICON_BACK = '<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
export const ICON_TICK = '<svg aria-hidden="true" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#12384a" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
const PATHS: Record<string, string> = {
  find: '<path d="M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4"/>', quiz: '<path d="M9 9a3 3 0 1 1 4 2.8c-.8.3-1 .9-1 1.7V15M12 18.5v.5"/>',
  multi: '<path d="M4 7h3M4 12h3M4 17h3M10 7h10M10 12h10M10 17h10"/>', puzzle: '<path d="M4 4h7v3a2 2 0 1 0 4 0V4h5v7h-3a2 2 0 1 0 0 4h3v5h-7v-3a2 2 0 1 0-4 0v3H4z"/>',
  order: '<path d="M5 6h2M5 12h2M5 18h2M10 6h9M10 12h7M10 18h5"/>', memory: '<rect x="3" y="5" width="8" height="12" rx="2"/><rect x="13" y="5" width="8" height="12" rx="2"/>',
};
export const icon = (ty: string, col?: string) => `<svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="${col || '#b8455f'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${PATHS[ty] || PATHS.quiz}</svg>`;
export function initSheet() {
  sheetWrap().addEventListener('click', e => { if (e.target === sheetWrap()) closeSheet(); });
  // keep keyboard focus inside the open sheet
  sheet().addEventListener('keydown', e => {
    if (e.key !== 'Tab') return; const f = Array.from(sheet().querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input,[tabindex]:not([tabindex="-1"])')).filter(x => x.offsetParent !== null);
    if (!f.length) return; const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { last.focus(); e.preventDefault(); } else if (!e.shiftKey && document.activeElement === last) { first.focus(); e.preventDefault(); }
  });
}
export const shuffle = <T,>(a: T[]) => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
