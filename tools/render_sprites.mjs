// Render station sprites from the 3D models (tools/sprites.html), then post-process with tools/sprite_post.py:
// crop + resize to the UI sprite size, pencil-sketch version, and find-game hotspots written into content/stations.
//   node tools/render_sprites.mjs bluemansion esplanade ...   (no ids = all Phase 2 stations)
import { createServer } from 'vite';
import { chromium } from 'playwright';
import { writeFile, mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';

const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['bluemansion', 'esplanade', 'peranakan', 'kuanyin', 'mariamman', 'kapitan', 'armenian'];
const OUT = 'test-results/sprites'; await mkdir(OUT, { recursive: true });
const server = await createServer({ server: { port: 0 }, logLevel: 'error' }); await server.listen();
const url = server.resolvedUrls.local[0];
const exe = process.env.CHROME === undefined ? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' : (process.env.CHROME || undefined);
const b = await chromium.launch({ executablePath: exe, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1080, height: 1140 } });
p.on('pageerror', e => console.error('page', e));
await p.goto(`${url}tools/sprites.html`); await p.waitForFunction(() => window.ready, null, { timeout: 120000 });
const meta = {};
for (const id of ids) {
  const r = await p.evaluate(i => window.renderStation(i), id);
  await writeFile(`${OUT}/${id}.png`, Buffer.from(r.png.split(',')[1], 'base64'));
  meta[id] = r.spots; console.log('rendered', id);
}
await writeFile(`${OUT}/spots.json`, JSON.stringify(meta));
await b.close(); await server.close();
execFileSync('python3', ['tools/sprite_post.py', OUT, ...ids], { stdio: 'inherit' });
