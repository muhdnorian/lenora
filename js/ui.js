/* ui.js — HUD, build bar, wave banner, and top-level game-flow controls */
LEN.ui = (function () {
  const $ = id => document.getElementById(id);
  const el = {
    res: $('resVal'), life: $('lifeVal'), wave: $('waveVal'), score: $('scoreVal'),
    wb: $('waveBanner'), wbT: $('waveBannerT'), wbS: $('waveBannerS'),
    buildToggle: $('buildToggle'), buildToggleT: $('buildToggleT'),
    pause: $('pause'), start: $('start'), play: $('playBtn'),
    go: $('gameover'), goWave: $('goWave'), goScore: $('goScore'), restart: $('restart'),
  };
  const tbtns = [...document.querySelectorAll('.tbtn')];
  let bannerTimer = 0;

  function updateHud(state) {
    el.res.textContent = Math.floor(state.resources);
    el.life.textContent = Math.max(0, Math.floor(state.lives));
    el.wave.textContent = state.wave;
    el.score.textContent = state.score;
    tbtns.forEach((b, i) => b.classList.toggle('dis', state.resources < LEN.CFG.towers[i].cost));
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

  function bindInput() {
    tbtns.forEach((b, i) => b.addEventListener('click', () => selectTower(i)));
    el.buildToggle.addEventListener('click', toggleBuild);
    el.pause.addEventListener('click', togglePause);
    el.play.addEventListener('click', start);
    el.restart.addEventListener('click', () => window.location.reload());
  }

  /* called from main's frame loop */
  function tick(dt) {
    if (bannerTimer > 0) { bannerTimer -= dt; if (bannerTimer <= 0) el.wb.classList.remove('show'); }
  }

  return { el, tbtns, updateHud, showBanner, toggleBuild, selectTower, syncTowerButtons, bindInput, tick };
})();
