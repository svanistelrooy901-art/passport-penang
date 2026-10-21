/* Sound: synthesised effects, ambient sea + birds, and a short original pentatonic loop.
   Everything is generated in code (no audio files, no licensing). Audio starts only after a user gesture. */
import { save } from './game/save';

let ac: AudioContext | null = null; let master: GainNode, fxBus: GainNode, musicBus: GainNode, ambBus: GainNode, verb: ConvolverNode;
function ctx() {
  if (ac) return ac;
  const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return null;
  ac = new AC(); master = ac.createGain(); master.gain.value = .9; master.connect(ac.destination);
  fxBus = ac.createGain(); fxBus.connect(master); musicBus = ac.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
  ambBus = ac.createGain(); ambBus.gain.value = 0; ambBus.connect(master);
  // small generated reverb for warmth
  verb = ac.createConvolver(); const len = ac.sampleRate * 1.8, ir = ac.createBuffer(2, len, ac.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  verb.buffer = ir; const vg = ac.createGain(); vg.gain.value = .28; verb.connect(vg).connect(master);
  return ac;
}
export function sfx(f: number, d: number, type: OscillatorType = 'sine') {
  if (!save.settings.sound) return;
  try {
    const a = ctx(); if (!a) return; if (a.state === 'suspended') a.resume();
    const o = a.createOscillator(), g = a.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.1, a.currentTime); g.gain.exponentialRampToValueAtTime(.001, a.currentTime + d);
    o.connect(g).connect(fxBus); o.start(); o.stop(a.currentTime + d + .02);
  } catch { /* audio unavailable */ }
}

/* ---------- ambience: filtered-noise waves with a slow swell, occasional birds ---------- */
let ambStarted = false, birdTimer = 0;
function startAmbience(a: AudioContext) {
  if (ambStarted) return; ambStarted = true;
  const buf = a.createBuffer(1, a.sampleRate * 4, a.sampleRate); const d = buf.getChannelData(0); let last = 0;
  for (let i = 0; i < d.length; i++) { last = (last + (Math.random() * 2 - 1) * .08) * .985; d[i] = last; }
  const src = a.createBufferSource(); src.buffer = buf; src.loop = true;
  const lp = a.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 700;
  const swell = a.createGain(); swell.gain.value = .5; const lfo = a.createOscillator(); lfo.frequency.value = .09; const lg = a.createGain(); lg.gain.value = .35;
  lfo.connect(lg).connect(swell.gain); src.connect(lp).connect(swell).connect(ambBus); src.start(); lfo.start();
  const bird = () => {
    if (save.settings.sound && a.state === 'running') {
      const n = 2 + Math.floor(Math.random() * 3); let t = a.currentTime;
      for (let i = 0; i < n; i++) { const o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; const f = 2400 + Math.random() * 1400;
        o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 1.35, t + .09);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.025, t + .02); g.gain.exponentialRampToValueAtTime(.0008, t + .12);
        o.connect(g).connect(ambBus); o.start(t); o.stop(t + .14); t += .16 + Math.random() * .08; }
    }
    birdTimer = window.setTimeout(bird, 6000 + Math.random() * 9000);
  };
  birdTimer = window.setTimeout(bird, 4000);
}

/* ---------- music: original loop in D major pentatonic, soft plucks + bass ---------- */
const SCALE = [62, 64, 66, 69, 71, 74, 76, 78, 81]; // D E F# A B D E F# A
const MEL = [0, -1, 2, -1, 4, 3, 2, -1, 1, -1, 3, -1, 5, 4, 3, -1, 2, -1, 4, -1, 6, 5, 4, 2, 3, -1, 1, 2, 0, -1, -1, -1];
const BASS = [50, 50, 47, 47, 43, 43, 45, 45]; // D, Bm, G, A (one bar each, two steps per entry)
const BPM = 92, STEP = 60 / BPM / 2;
let musicOn = false, nextT = 0, step = 0, sched = 0;
const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);
function pluck(a: AudioContext, m: number, t: number, vol: number, dur: number, type: OscillatorType) {
  const o = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter(); o.type = type; o.frequency.value = hz(m);
  f.type = 'lowpass'; f.frequency.setValueAtTime(3200, t); f.frequency.exponentialRampToValueAtTime(600, t + dur);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(f).connect(g); g.connect(musicBus); g.connect(verb); o.start(t); o.stop(t + dur + .05);
}
function tick() {
  const a = ac!; if (!musicOn) return;
  while (nextT < a.currentTime + .25) {
    const n = MEL[step % MEL.length]; if (n >= 0) pluck(a, SCALE[n], nextT, .14, .55, 'triangle');
    if (step % 4 === 0) pluck(a, BASS[(step / 4 | 0) % BASS.length], nextT, .16, 1.1, 'sine');
    if (step % 8 === 4) pluck(a, SCALE[(step / 8 | 0) % 5] + 12, nextT, .04, .3, 'sine');
    nextT += STEP; step++;
  }
}
export function applyAudio() {
  const a = ctx(); if (!a) return;
  if (a.state === 'suspended') a.resume().catch(() => {});
  startAmbience(a);
  ambBus.gain.setTargetAtTime(save.settings.sound ? .55 : 0, a.currentTime, .3);
  musicBus.gain.setTargetAtTime(save.settings.music ? .55 : 0, a.currentTime, .3);
  if (save.settings.music && !musicOn) { musicOn = true; nextT = a.currentTime + .1; sched = window.setInterval(tick, 90); }
  if (!save.settings.music && musicOn) { musicOn = false; clearInterval(sched); }
}
if (typeof document !== 'undefined') document.addEventListener('visibilitychange', () => { if (!ac) return; if (document.hidden) ac.suspend(); else if (save.settings.sound || save.settings.music) ac.resume(); });
export const _test = { MEL, SCALE, BASS, birdTimer: () => birdTimer };
