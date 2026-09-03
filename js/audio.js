/* audio.js — procedural WebAudio: soft one-shot SFX + a calm generative music loop
   All sounds are synthesized in-browser. Everything is kept gentle and quiet to match
   lenora's calm, low-pressure woodland mood. */
LEN.audio = (function () {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const MUTE_KEY = 'lenora.muted';
  let actx = null, master = null, music = null, sfx = null;
  let musicOn = false, muted = false;
  let ambientTimer = 0;
  let noisepool = {};
  // (#47) restore the persisted mute preference on load so a reload doesn't unmute
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  function init() {
    if (actx) return;
    actx = new Ctx();
    master = actx.createGain();
    master.gain.value = 0.9;
    // two helper busses so SFX and music never clip into each other
    music = actx.createGain(); music.gain.value = 0.16;
    sfx = actx.createGain();  sfx.gain.value = 0.35;
    music.connect(master); sfx.connect(master);
    if (muted) { master.gain.value = 0; }
    master.connect(actx.destination);
    startMusicLoop();
    musicOn = true;
  }

  /* ---------- tiny helpers ---------- */
  function noiseBuffer(dur) {
    const key = dur.toFixed(2);
    if (noisepool[key]) return noisepool[key];
    const len = Math.max(1, Math.floor(actx.sampleRate * dur));
    const buf = actx.createBuffer(1, len, actx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    noisepool[key] = buf;
    return buf;
  }
  // filtered noise one-shot
  function noise(t, dur, vol, flt = 'bandpass', freq = 1000, q = 1, endFreq) {
    const src = actx.createBufferSource(); src.buffer = noiseBuffer(dur);
    const f = actx.createBiquadFilter(); f.type = flt; f.Q.value = q;
    f.frequency.setValueAtTime(freq, t);
    if (endFreq) f.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(sfx);
    src.start(t); src.stop(t + dur + 0.05);
  }
  // oscillator tone one-shot
  function tone(t, type, freq, endFreq, dur, vol) {
    const o = actx.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    const g = actx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(sfx);
    o.start(t); o.stop(t + dur + 0.05);
  }

  /* ---------- SFX ---------- */
  function shoot(kind = 0) {
    if (!actx || muted) return;
    const t = actx.currentTime;
    // distinct, brighter pitch per tower kind (0 sprout, 1 cinder, 2 bramble)
    const base = [660, 520, 460][kind] || 600;
    tone(t, 'triangle', base, base * 0.6, 0.14, 0.10);
    noise(t, 0.05, 0.08, 'highpass', 1500, 0.8, 800);
    if (kind === 1) { tone(t + 0.01, 'sawtooth', 220, 120, 0.12, 0.05); }
    if (kind === 2) { tone(t, 'sine', 140, 90, 0.16, 0.12); }
  }
  function hit() {
    if (!actx || muted) return;
    const t = actx.currentTime;
    noise(t, 0.06, 0.10, 'lowpass', 900, 1, 300);
    tone(t, 'sine', 220, 120, 0.07, 0.12);
  }
  function explosion() {
    if (!actx || muted) return;
    const t = actx.currentTime;
    noise(t, 0.34, 0.30, 'lowpass', 1100, 0.8, 140);
    tone(t, 'sine', 190, 55, 0.3, 0.22);
    tone(t + 0.05, 'triangle', 320, 90, 0.22, 0.08);
  }
  function place(ok = true) {
    if (!actx || muted) return;
    const t = actx.currentTime;
    if (ok) {
      tone(t, 'sine', 620, 660, 0.10, 0.12);
      tone(t + 0.06, 'sine', 830, 880, 0.12, 0.10);
      noise(t, 0.06, 0.06, 'bandpass', 1400, 2, 900);
    } else {
      tone(t, 'square', 220, 180, 0.12, 0.06);
    }
  }
  function sell() {
    if (!actx || muted) return;
    const t = actx.currentTime;
    tone(t, 'sine', 700, 880, 0.10, 0.10);
    tone(t + 0.08, 'sine', 880, 1100, 0.14, 0.09);
  }
  function waveClear() {
    if (!actx || muted) return;
    const t = actx.currentTime;
    [523, 659, 784, 1047].forEach((f, i) => tone(t + i * 0.07, 'sine', f, f, 0.16, 0.07));
    noise(t, 0.18, 0.05, 'lowpass', 700, 1, 300);
  }
  function lose() {
    if (!actx || muted) return;
    const t = actx.currentTime;
    [392, 349, 311, 262].forEach((f, i) => tone(t + i * 0.16, 'sine', f, f * 0.92, 0.3, 0.10));
  }
  function aura() {                       // gentle resource-gather shimmer
    if (!actx || muted) return;
    const t = actx.currentTime;
    tone(t, 'sine', 720, 820, 0.12, 0.06);
    tone(t + 0.05, 'sine', 1080, 1180, 0.12, 0.045);
  }

  /* ---------- calm generative music loop ----------
     A soft pentatonic bed: sparse low drone + occasional plucked arpeggio notes. */
  const scale = [0, 3, 5, 7, 10, 12, 15];
  const semi = s => 110 * Math.pow(2, s / 12);
  function playNote(when, sC, dur, vol) {
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = semi(sC);
    const g = actx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(vol, when + dur * 0.35);
    g.gain.linearRampToValueAtTime(0, when + dur);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 800;
    o.connect(g); g.connect(lp); lp.connect(music);
    o.start(when); o.stop(when + dur + 0.1);
  }
  function loop() {
    if (!musicOn || !actx) return;
    const now = actx.currentTime;
    const rootSemi = [0, 2, 4][(Math.random() * 3) | 0];
    // warm bass drone
    tone(now, 'sine', semi(rootSemi) / 2, semi(rootSemi) / 2, 7, 0.10);
    // a few airy plucked notes in the scale
    for (let i = 0; i < 4; i++) {
      const sC = rootSemi + scale[(Math.random() * scale.length) | 0];
      const t = now + i * 1.55 + Math.random() * 0.6;
      playNote(t, sC + 12, 1.4 + Math.random(), 0.035);
      if (Math.random() < 0.4) playNote(t + 0.3, sC, 1.1, 0.022);
    }
    ambientTimer = actx.currentTime + 6.5;
  }
  function startMusicLoop() {
    loop();
    setInterval(() => { if (actx && actx.currentTime >= ambientTimer) loop(); }, 400);
  }

  function resume() { if (actx && actx.state !== 'running') actx.resume(); }
  function setMuted(m) {
    muted = m;
    if (master) master.gain.value = m ? 0 : 0.9;
  }
  function setMusic(on) { musicOn = on; if (!muted && master) master.gain.value = on ? 0.7 : 0; }
  function toggleMute() {
    muted = !muted;
    try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
    if (master) master.gain.value = muted ? 0 : (musicOn ? 0.7 : 0);
    return muted;
  }
  function isMuted() { return muted; }
  function isMusic() { return musicOn; }
  function blip(ok) { place(ok); }

  return { init, resume, setMuted, isMuted, setMusic, isMusic, toggleMute,
           shoot, hit, explosion, place, sell, waveClear, lose, aura, blip };
})();
