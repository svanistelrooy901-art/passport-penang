/* Tiny synthesised sound effects. Audio starts only after the first user gesture. */
let ac: AudioContext | null = null;
export function sfx(f: number, d: number, type: OscillatorType = 'sine') {
  try {
    if (!ac) ac = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.value = f;
    g.gain.setValueAtTime(.1, ac.currentTime); g.gain.exponentialRampToValueAtTime(.001, ac.currentTime + d);
    o.connect(g).connect(ac.destination); o.start(); o.stop(ac.currentTime + d + .02);
  } catch { /* audio unavailable */ }
}
