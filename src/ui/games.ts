/* The six station game types. Each renders into the bottom sheet and calls complete() when solved. */
import { STATIONS, sprite } from '../content';
import { save } from '../game/save';
import { L } from '../i18n';
import { sfx } from '../audio';
import { $, nm, setRerender } from './hud';
import { openSheet, q, qa, esc, ICON_BACK, shuffle } from './dom';
import { openStation, complete } from './sheets';

const head = (id: string, g: any) => `<div class="row"><button type="button" class="back" id="bk">${ICON_BACK}${L().back}</button><div class="kicker" style="margin-left:auto">${esc(nm(id))} · ${esc(g.title[save.lang])}</div></div>`;
const wireBack = (id: string) => { $('bk').onclick = () => openStation(id); };
const done = (t: any) => `<div class="fb good"><b>${t.right}</b></div><button type="button" class="btn pink" id="fin">${t.done1}</button>`;
const wireFin = (id: string, gi: number) => { const f = document.getElementById('fin'); if (f) f.onclick = () => complete(id, gi); };

export function startGame(id: string, gi: number) {
  const g = STATIONS[id].games[gi];
  const fn = ({ quiz, multi, find, puzzle, order, memory } as any)[g.type];
  fn(id, gi, g);
}
function quiz(id: string, gi: number, g: any) {
  const t = L(); let picked: number | null = null, solved = false; const ord = shuffle<number>(g.opts.map((_: any, i: number) => i));
  const draw = () => {
    const opts = ord.map(i => { const o = g.opts[i]; let cls = 'opt'; if (solved && o.ok) cls += ' right'; else if (picked === i && !o.ok) cls += ' wrong'; return `<button type="button" class="${cls}" data-i="${i}" aria-pressed="${picked === i}">${esc(o[save.lang])}</button>`; }).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${esc(g.ask[save.lang])}</h2>${g.art ? `<div class="art"><img src="${sprite(id)}" alt="${esc(nm(id))}"></div>` : ''}
      <div class="opts">${opts}</div>${solved ? `<div class="fb good"><b>${t.right}</b> ${esc(g.why[save.lang])}</div><button type="button" class="btn pink" id="fin">${t.done1}</button>` : (picked != null ? `<div class="fb">${t.wrong}</div>` : '')}`,
      () => { wireBack(id); qa('.opt').forEach(b => b.onclick = () => { if (solved) return; picked = +b.dataset.i!; if (g.opts[picked].ok) { solved = true; sfx(880, .12); } else sfx(220, .12); draw(); }); wireFin(id, gi); });
  };
  draw(); setRerender(draw);
}
function multi(id: string, gi: number, g: any) {
  const t = L(); let picked = new Set<number>(), solved = false, wrong = false; const ord = shuffle<number>(g.opts.map((_: any, i: number) => i));
  const draw = () => {
    const opts = ord.map(i => { const o = g.opts[i]; let cls = 'opt'; if (solved && o.ok) cls += ' right'; return `<button type="button" class="${cls}" data-i="${i}" aria-pressed="${picked.has(i)}">${esc(o[save.lang])}</button>`; }).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${esc(g.ask[save.lang])}</h2><div class="small">${t.pickN(g.need)}</div><div class="opts">${opts}</div>
      ${solved ? `<div class="fb good"><b>${t.right}</b> ${esc(g.why[save.lang])}</div><button type="button" class="btn pink" id="fin">${t.done1}</button>` : `${wrong ? `<div class="fb">${t.wrong}</div>` : ''}<button type="button" class="btn navy" id="chk" ${picked.size === g.need ? '' : 'disabled'}>${t.check} · ${picked.size}/${g.need}</button>`}`,
      () => {
        wireBack(id);
        qa('.opt').forEach(b => b.onclick = () => { if (solved) return; const i = +b.dataset.i!; wrong = false; if (picked.has(i)) picked.delete(i); else if (picked.size < g.need) picked.add(i); sfx(520, .04); draw(); });
        const c = document.getElementById('chk'); if (c) c.onclick = () => { if ([...picked].every(i => g.opts[i].ok)) { solved = true; sfx(880, .12); } else { wrong = true; picked = new Set(); sfx(220, .12); } draw(); };
        wireFin(id, gi);
      });
  };
  draw(); setRerender(draw);
}
function find(id: string, gi: number, g: any) {
  const t = L(); const got = new Set<number>(); let misses = 0; const marks: number[][] = [];
  const draw = () => {
    const all = got.size === g.targets.length;
    const tg = g.targets.map((x: any, i: number) => `<span class="${got.has(i) ? 'got' : ''}">${got.has(i) ? '✓ ' : ''}${esc(x[save.lang])}</span>`).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${t.find}</h2><div class="targets">${tg}</div>
      <div class="find"><div class="wrapimg" id="fw"><img id="fimg" src="${sprite(id)}" alt="${esc(nm(id))}" draggable="false"></div></div>
      ${all ? done(t) : `<div class="small">${t.findHint}</div>`}`,
      () => {
        wireBack(id); const img = $('fimg') as HTMLImageElement, fw = $('fw');
        const mark = (cls: string, px: number, py: number) => { const m = document.createElement('div'); m.className = cls; m.style.left = (px / img.naturalWidth * 100) + '%'; m.style.top = (py / img.naturalHeight * 100) + '%'; fw.appendChild(m); return m; };
        const place = () => {
          fw.querySelectorAll('.mk,.pulse').forEach(e => e.remove()); for (const [px, py] of marks) mark('mk', px, py);
          if (misses >= 3 && !all) { const i = g.targets.findIndex((_: any, k: number) => !got.has(k)); if (i >= 0) { const [px, py] = g.targets[i].pts[0]; mark('pulse', px, py); } }
        };
        if (img.complete) place(); else img.onload = place;
        img.onclick = e => {
          if (all) return; const r = img.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width * img.naturalWidth, py = (e.clientY - r.top) / r.height * img.naturalHeight;
          let hit = -1, hp: number[] | null = null;
          g.targets.forEach((tgt: any, i: number) => { if (got.has(i)) return; for (const [x, y, rad] of tgt.pts) if (rad && Math.hypot(px - x, py - y) < rad + 10) { hit = i; hp = [x, y]; } });
          if (hit >= 0) { got.add(hit); marks.push(hp!); sfx(880, .1); draw(); }
          else { misses++; sfx(220, .06); const m = mark('miss', px, py); setTimeout(() => m.remove(), 650); if (misses === 3) place(); }
        };
        wireFin(id, gi);
      });
  };
  draw(); setRerender(draw);
}
function puzzle(id: string, gi: number, g: any) {
  const t = L(); let perm: number[]; do { perm = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]); } while (perm.every((v, i) => v === i)); let sel: number | null = null;
  const draw = () => {
    const solved = perm.every((v, i) => v === i);
    const tiles = perm.map((v, i) => `<button type="button" class="${sel === i ? 'sel' : ''}" data-i="${i}" aria-label="${i + 1}" style="background-image:url(${sprite(id)});background-size:300% 300%;background-position:${(v % 3) * 50}% ${Math.floor(v / 3) * 50}%"></button>`).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${t.puzzle}</h2><div class="small">${t.puzzleHint}</div><div class="puz ${solved ? 'solved' : ''}" id="pz">${tiles}</div>${solved ? done(t) : ''}`,
      () => {
        wireBack(id);
        qa('#pz button').forEach(b => b.onclick = () => { if (solved) return; const i = +b.dataset.i!; if (sel === null) { sel = i; sfx(520, .04); } else { if (sel !== i) { [perm[sel], perm[i]] = [perm[i], perm[sel]]; sfx(660, .05); } sel = null; if (perm.every((v, k) => v === k)) sfx(880, .15); } draw(); });
        wireFin(id, gi);
      });
  };
  draw(); setRerender(draw);
}
function order(id: string, gi: number, g: any) {
  const t = L(); const ord = shuffle<number>(g.items.map((_: any, i: number) => i)); if (ord.every((v, i) => v === i)) ord.reverse(); let next = 0, bad = -1;
  const draw = () => {
    const solved = next === g.items.length;
    const btns = ord.map(i => `<button type="button" class="${i < next ? 'done' : ''} ${bad === i ? 'bad' : ''}" data-i="${i}"><span class="no">${i < next ? i + 1 : ''}</span><span>${esc(g.items[i][save.lang])}</span></button>`).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${t.order}</h2><div class="small">${t.orderHint}</div><div class="ord">${btns}</div>${solved ? done(t) : ''}`,
      () => { wireBack(id); qa('.ord button').forEach(b => b.onclick = () => { const i = +b.dataset.i!; if (i < next) return; if (i === next) { next++; bad = -1; sfx(next === g.items.length ? 880 : 660, .08); } else { bad = i; sfx(220, .1); } draw(); }); wireFin(id, gi); });
  };
  draw(); setRerender(draw);
}
function memory(id: string, gi: number, g: any) {
  const t = L(); const cards = shuffle(g.pairs.flatMap((p: string[], i: number) => [{ p: i, txt: p[0], l: 'BM' }, { p: i, txt: p[1], l: 'EN' }])) as any[];
  const matched = new Set<number>(); let open: number[] = []; let lock = false;
  const draw = () => {
    const solved = matched.size === g.pairs.length;
    const btns = cards.map((c, i) => { const up = open.includes(i) || matched.has(c.p); return `<button type="button" class="${matched.has(c.p) ? 'ok' : up ? 'up' : ''}" data-i="${i}" aria-label="${up ? esc(c.txt) : '?'}">${up ? `<span>${esc(c.txt)}<br><small style="font-size:10px;opacity:.7">${c.l}</small></span>` : '<span class="q">?</span>'}</button>`; }).join('');
    openSheet(`${head(id, g)}<h2 id="sheet-title">${t.memory}</h2><div class="small">${t.memoryHint}</div><div class="mem">${btns}</div>${solved ? done(t) : ''}`,
      () => {
        wireBack(id);
        qa('.mem button').forEach(b => b.onclick = () => {
          if (lock) return; const i = +b.dataset.i!; const c = cards[i]; if (matched.has(c.p) || open.includes(i)) return;
          open.push(i); sfx(520, .04);
          if (open.length === 2) { const [a, b2] = open; if (cards[a].p === cards[b2].p) { matched.add(c.p); open = []; sfx(880, .1); } else { lock = true; setTimeout(() => { open = []; lock = false; draw(); }, 800); } }
          draw();
        });
        wireFin(id, gi);
      });
  };
  draw(); setRerender(draw);
}
export { q };
