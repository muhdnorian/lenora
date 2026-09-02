/* ui.js — HUD, build bar, wave banner, and top-level game-flow controls */
LEN.ui = (function () {
  const $ = id => document.getElementById(id);
  const el = {
    res: $('resVal'), life: $('lifeVal'), wave: $('waveVal'), score: $('scoreVal'),
    wb: $('waveBanner'), wbT: $('waveBannerT'), wbS: $('waveBannerS'),
    buildToggle: $('buildToggle'), buildToggleT: $('buildToggleT'),
    pause: $('pause'), start: $('start'), play: $('playBtn'),
    go: $('gameover'), goWave: $('goWave'), goScore: $('goScore'), goBest: $('goBest'), goBestScore: $('goBestScore'), restart: $('restart'),
    stBest: $('stBestWave'), stBestScore: $('stBestScore'),
    mute: $('mute'),
  };
  const tbtns = [...document.querySelectorAll('.tbtn')];
  let bannerTimer = 0;
  // last rendered values — skip DOM writes when nothing changed
  const last = { res: null, life: null, wave: null, score: null, dis: null };
  // dirty flag: HUD is only re-synced after an actual state change, never per-frame
  // from the sim hot loop (issue #35).
  let dirty = true;
  function markDirty() { dirty = true; }
  function consumeDirty() { const d = dirty; dirty = false; return d; }

  function updateHud(state) {
    const res = Math.floor(state.resources);
    if (res !== last.res) { el.res.textContent = res; last.res = res; }
    const life = Math.max(0, Math.floor(state.lives));
    if (life !== last.life) { el.life.textContent = life; last.life = life; }
    if (state.wave !== last.wave) { el.wave.textContent = state.wave; last.wave = state.wave; }
    if (state.score !== last.score) { el.score.textContent = state.score; last.score = state.score; }
    const dis = tbtns.map((b, i) => state.resources < LEN.CFG.towers[i].cost);
    if (JSON.stringify(dis) !== last.dis) {
      tbtns.forEach((b, i) => b.classList.toggle('dis', dis[i]));
      last.dis = JSON.stringify(dis);
    }
  }

  function selectTower(i) {
    LEN.setTowerType(i);
    tbtns.forEach((b, idx) => b.classList.toggle('sel', idx === i));
  }
  function syncTowerButtons() {
    tbtns.forEach((b, i) => b.classList.toggle('sel', i === LEN.getBuildOpts().towerType));
  }
  function toggleBuild() {
    LEN.toggleBuild();
    el.buildToggle.classList.toggle('on', LEN.getBuildOpts().buildMode);
    el.buildToggleT.textContent = LEN.getBuildOpts().buildMode ? 'Placing…' : 'Recruit';
  }

  function showBanner(title, sub, dur = 2.6) {
    el.wbT.textContent = title; el.wbS.textContent = sub;
    el.wb.classList.add('show');
    bannerTimer = dur;
  }

  function start() {
    LEN.audio.init();
    LEN.audio.resume();
    LEN.audio.setMusic(true);
    el.start.style.display = 'none';
    LEN.startGame();
  }
  function togglePause() { LEN.togglePause(); el.pause.textContent = LEN.getBuildOpts().paused ? '▶' : '⏸'; }
  function toggleMute() { const muted = LEN.audio.toggleMute(); el.mute.textContent = muted ? '🔇' : '🔊'; el.mute.classList.toggle('muted', muted); }
  function syncMute() { const muted = LEN.audio.isMuted(); el.mute.textContent = muted ? '🔇' : '🔊'; el.mute.classList.toggle('muted', muted); }

  function bindInput() {
    tbtns.forEach((b, i) => b.addEventListener('click', () => selectTower(i)));
    el.buildToggle.addEventListener('click', toggleBuild);
    el.pause.addEventListener('click', togglePause);
    el.mute.addEventListener('click', toggleMute);
    el.play.addEventListener('click', start);
    el.restart.addEventListener('click', () => window.location.reload());
    syncMute();   // reflect the persisted mute preference on load (#47)
  }

  /* called from main's frame loop */
  function tick(dt) {
    if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) el.wb.classList.remove('show'); }
  }

  return { el, tbtns, updateHud, markDirty, consumeDirty, showBanner, toggleBuild, selectTower, syncTowerButtons, bindInput, tick };
})();
