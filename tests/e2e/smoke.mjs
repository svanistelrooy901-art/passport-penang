// Browser smoke test of the production build: boot, create character, walk, open a station,
// check tutorial + settings, finish all 3 Komtar games to gold, read the Kisah, open Pasport + wardrobe. Fails on any page error.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const OUT = process.env.SHOTS || 'test-results'; const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const server = createServer(async (req, res) => { const p = join('dist', decodeURIComponent(req.url.split('?')[0].split('#')[0]).replace(/\/$/, '/index.html')); try { const b = await readFile(p); res.writeHead(200, { 'content-type': types[extname(p)] || 'application/octet-stream' }); res.end(b); } catch { res.writeHead(404); res.end(); } }).listen(0);
const port = server.address().port; const errs = [];
const exe = process.env.CHROME === undefined ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : (process.env.CHROME || undefined);
const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const run = async (vp, tag) => {
  const p = await b.newPage({ viewport: vp, hasTouch: vp.width < 500 });
  p.on('pageerror', e => errs.push(`${tag} ${e}`)); p.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_TUNNEL|favicon/.test(m.text())) errs.push(`${tag} console ${m.text()}`); });
  await p.goto(`http://localhost:${port}/#test`); await p.waitForFunction(() => !document.getElementById('start')?.hasAttribute('disabled'), null, { timeout: 60000 });
  await p.click('[data-h="2"]'); await p.screenshot({ path: `${OUT}/${tag}-1-intro.png` });
  await p.click('#start'); await p.waitForTimeout(1500); await p.screenshot({ path: `${OUT}/${tag}-2-world.png` });
  // Phase 1: tutorial coach shows for a new player; settings change quality + language; draw-call budget
  if (await p.isHidden('#coach')) errs.push(`${tag} tutorial coach not shown`);
  const calls = await p.evaluate(() => window.__pp.calls()), budget = tag === 'phone' ? 80 : 160; if (calls > budget) errs.push(`${tag} draw calls ${calls} > ${budget}`);
  await p.click('#btn-set'); await p.waitForSelector('[data-q="low"]'); await p.click('[data-q="low"]');
  if (await p.evaluate(() => window.__pp.quality.name) !== 'low') errs.push(`${tag} quality did not switch to low`);
  await p.click('[data-q="auto"]'); await p.click('[data-lang="en"]');
  if ((await p.textContent('#sheet-title')).trim() !== 'Settings') errs.push(`${tag} language switch failed`);
  await p.screenshot({ path: `${OUT}/${tag}-2b-settings.png` }); await p.click('#x');
  // Phase 2: every trigger, cat and NPC stands on walkable ground; a new station plays; ad placeholder shows
  const bad = await p.evaluate(() => { const q = window.__pp, z = q.zone, out = []; for (const [k, [x, y]] of Object.entries(z.triggers)) if (!q.walkable(x, y)) out.push('trigger ' + k); z.cats.forEach(([x, y], i) => { if (!q.walkable(x, y)) out.push('cat ' + i); }); z.npcs.forEach(n => { if (!q.walkable(n.x, n.y)) out.push('npc ' + n.id); }); return out; });
  if (bad.length) errs.push(`${tag} not walkable: ${bad.join(', ')}`);
  await p.click('#tut-skip');
  await p.evaluate(() => window.__pp.openStation('kuanyin')); await p.waitForSelector('.game[data-g="1"]');
  if (!(await p.$('.ad[data-ad="station"]'))) errs.push(`${tag} station ad slot missing`);
  await p.click('.game[data-g="1"]'); await p.click('.opt[data-i="0"]'); await p.click('#fin'); await p.click('#bs');
  await p.click('#x'); if (!(await p.isHidden('#coach'))) errs.push(`${tag} tutorial skip failed`);
  await p.evaluate(() => window.__pp.openStation('komtar')); await p.waitForSelector('.game[data-g="0"]');
  // find
  await p.click('.game[data-g="0"]'); await p.waitForSelector('#fimg');
  for (const [x, y] of [[137, 38], [80, 208], [22, 205]]) { const r = await p.evaluate(() => { const i = document.getElementById('fimg'); const b = i.getBoundingClientRect(); return [b.left, b.top, b.width / i.naturalWidth]; }); await p.mouse.click(r[0] + x * r[2], r[1] + y * r[2]); await p.waitForTimeout(150); }
  await p.click('#fin'); await p.click('#bs');
  // quiz
  await p.click('.game[data-g="1"]'); await p.click('.opt[data-i="0"]'); await p.click('#fin'); await p.click('#bs');
  // puzzle
  await p.click('.game[data-g="2"]');
  for (let k = 0; k < 12; k++) { const st = await p.evaluate(() => [...document.querySelectorAll('#pz button')].map(b => { const [x, y] = b.style.backgroundPosition.split(' ').map(v => parseFloat(v) / 50); return y * 3 + x; })); const i = st.findIndex((v, k) => v !== k); if (i < 0) break; const j = st.indexOf(i); await p.click(`#pz button[data-i="${i}"]`); await p.click(`#pz button[data-i="${j}"]`); }
  await p.click('#fin'); await p.waitForSelector('#rk'); await p.screenshot({ path: `${OUT}/${tag}-3-gold.png` });
  await p.click('#rk'); await p.waitForSelector('.kis'); await p.screenshot({ path: `${OUT}/${tag}-4-kisah.png` });
  await p.click('#x'); await p.click('#btn-pass'); await p.waitForSelector('#wd'); await p.click('#wd'); await p.waitForSelector('.ward'); await p.screenshot({ path: `${OUT}/${tag}-5-wardrobe.png` });
  const state = await p.evaluate(() => window.__pp.save().games.komtar.join(''));
  if (state !== '111') errs.push(`${tag} komtar progress ${state}`);
  if (tag === 'phone') await travel(p, tag);
  await p.close();
};
// Phase 3: unlock with 6 stamps, bus to Air Itam (progress kept), funicular to Penang Hill, the map, back to George Town
async function travel(p, tag) {
  const ready = () => p.waitForFunction(() => window.__pp, null, { timeout: 90000 });
  await p.evaluate(() => { const s = window.__pp.save(); ['chowrasta', 'bluemansion'].forEach(k => s.games[k] = [1, 1, 1]); localStorage.setItem('pasportPenang.save.v1', JSON.stringify(s)); });
  const before = await p.evaluate(() => JSON.stringify(window.__pp.save().games));
  await p.evaluate(() => window.__pp.openTravel(0)); await p.waitForSelector('.dest[data-dest="air-itam"]');
  if (await p.getAttribute('.dest[data-dest="air-itam"]', 'aria-disabled')) errs.push(`${tag} Air Itam still locked after 6 stamps`);
  await p.click('.dest[data-dest="air-itam"]'); await p.waitForSelector('.travel svg');
  await p.waitForURL(/z=air-itam/, { timeout: 20000 }); await ready(); await p.waitForTimeout(800);
  const ai = await p.evaluate(() => ({ z: window.__pp.zoneId, g: JSON.stringify(window.__pp.save().games), saved: window.__pp.save().zone }));
  if (ai.z !== 'air-itam' || ai.saved !== 'air-itam') errs.push(`${tag} did not arrive in Air Itam: ${JSON.stringify(ai)}`);
  if (ai.g !== before) errs.push(`${tag} progress changed after travel`);
  await p.screenshot({ path: `${OUT}/${tag}-6-air-itam.png` });
  await p.evaluate(() => window.__pp.travelTo('penang-hill', 'funicular')); await p.waitForURL(/z=penang-hill/, { timeout: 20000 }); await ready();
  if ((await p.evaluate(() => window.__pp.zoneId)) !== 'penang-hill') errs.push(`${tag} funicular did not reach Penang Hill`);
  await p.click('#btn-map'); await p.waitForURL(/z=map/, { timeout: 20000 }); await ready(); await p.waitForTimeout(1200);
  if ((await p.evaluate(() => window.__pp.mode)) !== 'map') errs.push(`${tag} map did not open`);
  if ((await p.evaluate(() => window.__pp.zoneState('north'))) !== 'soon') errs.push(`${tag} north coast should be coming soon`);
  await p.screenshot({ path: `${OUT}/${tag}-7-map.png` });
  await p.evaluate(() => window.__pp.openInfo('kuanyin')); await p.waitForSelector('#play');
  await p.evaluate(() => window.__pp.travelTo('george-town')); await p.waitForURL(/z=george-town/, { timeout: 20000 }); await ready();
  if ((await p.evaluate(() => JSON.stringify(window.__pp.save().games))) !== before) errs.push(`${tag} progress changed after the round trip`);
}
try { await run({ width: 390, height: 844 }, 'phone'); await run({ width: 1280, height: 800 }, 'desktop'); }
catch (e) { errs.push(String(e)); }
await b.close(); server.close();
if (errs.length) { console.error('FAIL\n' + errs.join('\n')); process.exit(1); } else console.log('smoke ok');
