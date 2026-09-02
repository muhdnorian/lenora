/* audio.js — soft WebAudio ambient pad + one-shot UI blips */
LEN.audio = (function () {
  const Ctx = window.AudioContext || window.webkitAudioContext;
  let actx = null, master = null, musicOn = false, muted = false;

  function init() {
    if (actx) return;
    actx = new Ctx();
    master = actx.createGain();
    master.gain.value = 0;
    master.connect(actx.destination);
    startAmbientLoop();
    musicOn = true;
  }

  /* gentle pentatonic drone, slowly evolving chords */
  const scale = [0, 3, 5, 7, 10, 14];
  const freq = semi => 110 * Math.pow(2, semi / 12);
  function playNote(when, semi, dur, gain) {
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = freq(semi);
    const g = actx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + dur * 0.4);
    g.gain.linearRampToValueAtTime(0, when + dur);
    const lp = actx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900;
    o.connect(g); g.connect(lp); lp.connect(master);
    o.start(when); o.stop(when + dur + 0.1);
  }
  function loop() {
    if (!musicOn || !actx) return;
    const now = actx.currentTime;
    const rootSemi = [0, 2, 4][(Math.random() * 3) | 0];
    for (let i = 0; i < 3; i++) {
      const semi = rootSemi + scale[(Math.random() * scale.length) | 0];
      const t = now + i * 2.1 + Math.random();
      playNote(t, semi + 12, 9, 0.028);
      if (Math.random() < 0.5) playNote(t + 0.4, semi, 6, 0.02);
    }
    ambientTimer = actx.currentTime + 6.5;
  }
  let ambientTimer = 0;
  function startAmbientLoop() {
    loop();
    setInterval(() => { if (actx && actx.currentTime >= ambientTimer) loop(); }, 400);
  }

  function blip(ok) {                       // soft build click
    if (!actx || muted) return;
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = ok ? 520 : 220;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.05, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.18);
    o.connect(g); g.connect(master);
    o.start(); o.stop(actx.currentTime + 0.2);
  }
  function aura() {                         // resource gather shimmer
    if (!actx || muted) return;
    const o = actx.createOscillator(); o.type = 'sine'; o.frequency.value = 720;
    const g = actx.createGain();
    g.gain.setValueAtTime(0.02, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, actx.currentTime + 0.5);
    o.connect(g); g.connect(master);
    o.start(); o.stop(actx.currentTime + 0.55);
  }
  function setMusic(on) { musicOn = on; if (!muted && master) master.gain.value = on ? 0.7 : 0; }
  function toggleMute() {
    muted = !muted;
    if (master) master.gain.value = muted ? 0 : (musicOn ? 0.7 : 0);
    return muted;
  }
  function isMuted() { return muted; }
  function resume() { if (actx && actx.state === 'suspended') actx.resume(); }

  return { init, resume, blip, aura, setMusic, toggleMute, isMuted, isOn: () => musicOn };
})();
