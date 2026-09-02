/* main.js — game state, controllers, and the main simulation loop */
LEN.projectiles = [];
LEN.puffs = [];

LEN.startGame = startGame;
LEN.togglePause = togglePause;
LEN.setTowerType = setTowerType;
LEN.toggleBuild = toggleBuild;
LEN.getBuildOpts = () => state;
LEN.addScore = addScore;
LEN.cycleTarget = cycleTarget;
LEN.getTargetMode = () => ({ index: state.targeting, label: TARGET_MODES[state.targeting] });

/* tower targeting priority: closest / first(most advanced) / weakest (#15) */
const TARGET_MODES = ['closest', 'first', 'weakest'];

const state = {
  resources: 90,
  lives: LEN.CFG.baseHP,
  wave: 0,
  score: 0,
  running: false,
  paused: false,
  buildMode: false,
  towerType: 0,
  targeting: 0,
  calmTimer: LEN.CFG.wave.calm,
  timeOfDay: 0.28,      // start mid-morning so the first waves are sunny
  spawning: false,
  waveSpawnQueue: 0,
  spawnTimer: 0,
  bossSpawned: false,
  gatherTimer: 0,
  gameOver: false,
};

const { player, core, crystals } = LEN.entities;
const towers = LEN.towers;
const enemies = LEN.enemies;
const ui = LEN.ui;

ui.bindInput();

/* ---------------- game-flow controls (referenced above) ---------------- */
function addScore(n) { state.score += n; ui.markDirty(); }
function setTowerType(i) { state.towerType = i; updateGhost(); };
function cycleTarget() { state.targeting = (state.targeting + 1) % TARGET_MODES.length; ui.updateTargetBtn(); }
function toggleBuild() { state.buildMode = !state.buildMode; updateGhost(); }
function togglePause() {
  if (!state.running || state.gameOver) return;
  state.paused = !state.paused;
}
function startGame() {
  state.running = true;
  state.paused = false;
  ui.showBanner('Wave 1', 'drifters approach…');
  ui.updateHud(state);
  updateGhost();
}
function gameOver() {
  state.gameOver = true; state.running = false;
  LEN.audio.lose();
  ui.el.goWave.textContent = state.wave;
  ui.el.goScore.textContent = state.score;
  // persistent meta-progression (#11): best wave / best score via localStorage
  let meta = {};
  try { meta = JSON.parse(localStorage.getItem('lenora.meta') || '{}'); } catch (e) {}
  if (state.wave > (meta.bestWave || 0)) meta.bestWave = state.wave;
  if (state.score > (meta.bestScore || 0)) meta.bestScore = state.score;
  try { localStorage.setItem('lenora.meta', JSON.stringify(meta)); } catch (e) {}
  ui.el.goBest.textContent = meta.bestWave || 0;
  ui.el.goBestScore.textContent = meta.bestScore || 0;
  ui.el.go.style.display = 'flex';
}
function updateGhost() {
  towers.updateGhost(towers.hoverCell.col, towers.hoverCell.row, state);
}

/* ---------------- wave spawning ---------------- */
function startNextWave() {
  state.wave++;
  state.waveClearPlayed = false;
  state.calmTimer = LEN.CFG.wave.calm;   // re-arm the pause between waves
  state.waveSpawnQueue = Math.floor(LEN.CFG.wave.countBase + state.wave * LEN.CFG.wave.countPerWave);
  state.spawning = true;
  state.bossSpawned = false;   // every 5th wave also sends a warden
  if (state.wave % 5 === 0) {
    ui.showBanner('Wave ' + state.wave, 'A warden draws near…');
  } else {
    ui.showBanner('Wave ' + state.wave, 'drifters appear…');
  }
  ui.markDirty();
}

/* ---------------- touch / portrait detection ---------------- */
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
if (isTouch) document.body.classList.add('touch');
const joy = { active: false, dx: 0, dy: 0 };

/* right-click on a placed tower sells it for a refund (#14) */
window.addEventListener('contextmenu', e => {
  const t = towers.pickFromScreen(e.clientX, e.clientY);
  if (t) { e.preventDefault(); const r = towers.sell(t); if (r) { state.resources += r; LEN.audio.blip(true); ui.updateHud(state); } }
});

/* ---------------- keyboard ---------------- */
const keys = {};
window.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT') return;
  const k = e.key.toLowerCase();
  keys[k] = true;
  if (k === '1') ui.selectTower(0);
  if (k === '2') ui.selectTower(1);
  if (k === '3') ui.selectTower(2);
  if (k === 'b') ui.toggleBuild();
  if (k === 'p' || k === 'escape') { togglePause(); ui.el.pause.textContent = state.paused ? '▶' : '⏸'; }
  if (k === ' ') { e.preventDefault(); ui.toggleBuild(); }
});
window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

/* ---------------- mouse ---------------- */
window.addEventListener('pointermove', towers.pointerEvent);
window.addEventListener('pointerdown', e => {
  if (isTouch && e.target.closest('.recruit, #joyzone, .recruitbtn')) return; // let touch buttons handle it
  towers.pointerEvent(e);
  if (!state.buildMode || !towers.isMouseOnGround()) return;
  tryPlace(towers.hoverCell.col, towers.hoverCell.row);
});

/* ---------------- virtual joystick + touch recruit buttons ---------------- */
if (isTouch) {
  const joyZone = document.getElementById('joyzone');
  const joyKnob = document.getElementById('joyknob');
  let joyPointer = null, top = { x: 0, y: 0 };
  const joyStart = e => { joyPointer = e.pointerId; top = { x: e.clientX, y: e.clientY }; joyZone.classList.add('active'); };
  const joyMove = e => {
    if (e.pointerId !== joyPointer) return;
    const R = 46, dx = e.clientX - top.x, dy = e.clientY - top.y;
    const len = Math.hypot(dx, dy) || 1;
    const f = Math.min(1, len / R);
    joy.active = true; joy.dx = (dx / len) * f; joy.dy = (dy / len) * f;
    joyKnob.style.transform = `translate(${joy.dx * R}px, ${joy.dy * R}px)`;
  };
  const joyEnd = e => {
    if (e.pointerId !== joyPointer) return;
    joyPointer = null; joy.active = false; joy.dx = 0; joy.dy = 0;
    joyKnob.style.transform = 'translate(0,0)'; joyZone.classList.remove('active');
  };
  joyZone.addEventListener('pointerdown', e => { e.preventDefault(); joyZone.setPointerCapture(e.pointerId); joyStart(e); });
  joyZone.addEventListener('pointermove', joyMove);
  joyZone.addEventListener('pointerup', joyEnd);
  joyZone.addEventListener('pointercancel', joyEnd);

  // tap a recruit card: pick the unit, enter placement, then tap the map to drop it
  document.querySelectorAll('.recruit').forEach(b => {
    b.addEventListener('pointerdown', e => {
      e.preventDefault();
      ui.selectTower(+(b.dataset.i || 0));
      if (!state.buildMode) ui.toggleBuild();
    });
  });
}
function tryPlace(col, row) {
  const cfg = LEN.CFG.towers[state.towerType];
  if (!towers.cellValid(col, row) || state.resources < cfg.cost) { LEN.audio.blip(false); return; }
  state.resources -= cfg.cost;
  towers.place(col, row, state.towerType);
  LEN.audio.blip(true);
  ui.markDirty();
  updateGhost();
}

/* ---------------- camera smoothing state ---------------- */
const { camera } = LEN.world;
const camPos = camera.position.clone();
const camTarget = player.pos.clone();

/* reusable scratch vectors — avoid per-frame Vector3 allocation churn in hot loops (#32) */
const camDesired = new THREE.Vector3();
const vAim = new THREE.Vector3();
const vDir = new THREE.Vector3();
const vToCore = new THREE.Vector3();

/* ---------------- main loop ---------------- */
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (state.running && !state.paused && !state.gameOver) update(dt);
  if (ui.consumeDirty()) ui.updateHud(state);   // HUD sync only on real state change (issue #35)
  ui.tick(dt);
  LEN.world.renderer.render(LEN.world.scene, camera);
}

function update(dt) {
  updatePlayer(dt);
  updateCamera(dt);
  updateGathering(dt);
  updateTowers(dt);
  updateProjectiles(dt);
  updateEnemies(dt);
  updateWaves(dt);
  updateAmbient(dt);
  // slow gentle day/night cycle
  state.timeOfDay = (state.timeOfDay + dt / LEN.CFG.dayNight.period) % 1;
  LEN.world.setTime(state.timeOfDay);
}

/* ---- player ---- */
function updatePlayer(dt) {
  let mx = 0, mz = 0;
  if (!isTouch || !joy.active) {
    if (keys['w'] || keys['arrowup']) mz -= 1;
    if (keys['s'] || keys['arrowdown']) mz += 1;
    if (keys['a'] || keys['arrowleft']) mx -= 1;
    if (keys['d'] || keys['arrowright']) mx += 1;
  }
  if (joy.active) { mx += joy.dx; mz += joy.dy; }
  const len = Math.hypot(mx, mz);
  player.moving = len > 0;
  if (len > 0) {
    mx /= len; mz /= len;
    player.pos.x += mx * LEN.CFG.player.speed * dt;
    player.pos.z += mz * LEN.CFG.player.speed * dt;
    // world is centered on the origin (core at 0,0); allow roaming the full map
    const limit = LEN.CFG.world - 3;
    player.pos.x = Math.max(-limit, Math.min(limit, player.pos.x));
    player.pos.z = Math.max(-limit, Math.min(limit, player.pos.z));
    player.look = Math.atan2(mx, mz);
  }
  player.group.position.copy(player.pos);
  player.group.rotation.y = player.look;
  player.bob += dt * (player.moving ? 8 : 0);
  player.group.position.y = Math.abs(Math.sin(player.bob)) * (player.moving ? 0.28 : 0.08);
  player.group.rotation.z = (Math.sin(player.bob) * (player.moving ? 0.06 : 0.02)) * Math.cos(player.look);
}

/* ---- camera ---- */
function updateCamera(dt) {
  camDesired.set(player.pos.x, 46, player.pos.z + 34);
  camPos.lerp(camDesired, 1 - Math.pow(0.0008, dt));
  camTarget.lerp(player.pos, 1 - Math.pow(0.0006, dt));
  camera.position.copy(camPos);
  camera.lookAt(camTarget);
  const sun = LEN.world.sun;
  sun.position.set(player.pos.x + 30, 60, player.pos.z + 20);
  sun.target.position.set(player.pos.x, 0, player.pos.z);
  sun.target.updateMatrixWorld();
}

/* ---- resource gathering ---- */
function updateGathering(dt) {
  state.gatherTimer -= dt;
  if (state.gatherTimer > 0) return;
  state.gatherTimer = 0.15;
  let gained = false;
  for (const c of crystals) {
    if (!c.mesh.visible || c.amount <= 0) continue;
    if (player.pos.distanceTo(c.mesh.position) < LEN.CFG.gather.radius) {
      const got = Math.min(0.15 * LEN.CFG.gather.rate, c.amount, LEN.RES_MAX - state.resources);
      c.amount -= got; state.resources += got;
      c.mesh.scale.setScalar(0.8 + 0.2 * (c.amount / LEN.CFG.crystal.capacity));
      if (c.amount <= 0) LEN.entities.refreshCrystal(c);
      gained = true;
      if (state.resources >= LEN.RES_MAX) break;
    }
  }
  if (gained) { LEN.audio.aura(); ui.markDirty(); }
}

/* ---- towers target & fire ---- */
function updateTowers(dt) {
  const mode = TARGET_MODES[state.targeting];
  for (const t of towers.entities) {
    t.cooldown -= dt;
    t.turret.rotation.y += dt * 0.6;
    let target = null, best = Infinity;
    for (const e of enemies.all) {
      if (e.hp <= 0) continue;
      const d = t.pos.distanceTo(e.pos);
      let score;
      if (mode === 'first') score = e.pos.length();   // most advanced toward the core
      else if (mode === 'weakest') score = e.hp;    // lowest remaining HP
      else score = d;                                 // closest
      if (d < t.cfg.range && score < best) { best = score; target = e; }
    }
    if (target && t.cooldown <= 0) {
      t.cooldown = t.cfg.rate;
      t.turret.rotation.y = Math.atan2(target.pos.x - t.pos.x, target.pos.z - t.pos.z);
      towers.fire(t, target);
      LEN.audio.shoot(t.type);
      const flash = t.orb.material;
      flash.emissiveIntensity = 3;
      setTimeout(() => flash.emissiveIntensity = 0.7, 90);
    }
  }
}

/* ---- projectiles ---- */
function updateProjectiles(dt) {
  for (let i = LEN.projectiles.length - 1; i >= 0; i--) {
    const p = LEN.projectiles[i];
    p.age += dt;
    if (!p.target || !p.target.group.parent || p.age > p.maxAge) {
      LEN.world.scene.remove(p.mesh);
      LEN.projectiles.splice(i, 1);
      continue;
    }
    vAim.copy(p.target.pos); vAim.y += 0.8;   // reusable scratch — no per-projectile Vector3 allocs
    vDir.copy(vAim).sub(p.mesh.position);
    const step = p.speed * dt;
    if (vDir.length() <= step) {
      if (p.aoe > 0) {
        for (let j = enemies.all.length - 1; j >= 0; j--) {
          const e = enemies.all[j];
          if (e.hp <= 0) continue; // skip enemies already killed this frame
          if (e.pos.distanceTo(p.target.pos) < p.aoe) enemies.hit(e, p.dmg);
        }
        towers.puff(p.target.pos.clone(), 0xffd7ad);
        LEN.audio.explosion();
      } else {
        enemies.hit(p.target, p.dmg);
        LEN.audio.hit();
      }
      LEN.world.scene.remove(p.mesh);
      LEN.projectiles.splice(i, 1);
    } else {
      p.mesh.position.add(vDir.normalize().multiplyScalar(step));
    }
  }
}

/* ---- enemies ---- */
function updateEnemies(dt) {
  for (let i = enemies.all.length - 1; i >= 0; i--) {
    const e = enemies.all[i];
    vToCore.set(-e.pos.x, 0, -e.pos.z);   // reusable scratch — no per-enemy Vector3 allocs
    e.wob += dt * 2;
    vToCore.x += Math.sin(e.wob) * 0.6;
    vToCore.z += Math.cos(e.wob * 0.7) * 0.6;
    vToCore.normalize().multiplyScalar(e.speed * dt);
    e.pos.add(vToCore);
    e.group.position.copy(e.pos);
    e.group.position.y = Math.abs(Math.sin(e.wob)) * 0.15;
    e.group.rotation.y = Math.atan2(-e.pos.x, -e.pos.z);
    // inner glow fades as the enemy is damaged
    e.glow.material.emissiveIntensity = (0.25 + 1.2 * (e.hp / e.maxHp)) * (1 + LEN.world.night * 0.7); // glow brighter at night
    // boss mechanics run in the same loop (heal aura etc.)
    if (e.boss) enemies.tickBoss(e, dt);
    // contact damage against nearby army units
    e.attackCd -= dt;
    if (e.attackCd <= 0) {
      for (const u of towers.entities) {
        if (u.dead) continue;
        if (Math.hypot(u.pos.x - e.pos.x, u.pos.z - e.pos.z) < u.collideR + e.collideR) {
          towers.damageUnit(u, 7 * e.dmgMul);
          e.attackCd = 0.65;
          break;
        }
      }
    }
    if (e.pos.length() < 5) {
      state.lives -= (LEN.CFG.wave.dmgBase + state.wave * LEN.CFG.wave.dmgPerWave) * e.dmgMul;
      enemies.remove(e);
      ui.markDirty();
      if (state.lives <= 0) { state.lives = 0; ui.markDirty(); gameOver(); return; }
    }
  }
}

/* ---- wave sequencing ---- */
function updateWaves(dt) {
  if (state.spawning && state.waveSpawnQueue > 0) {
    state.spawnTimer -= dt;
    if (state.spawnTimer <= 0) {
      state.spawnTimer = LEN.CFG.wave.spawnInterval;
      enemies.spawn(state.wave);
      // every 5th wave: send the warden boss alongside the normal spawn
      if (state.wave % 5 === 0 && !state.bossSpawned) {
        state.bossSpawned = true;
        enemies.spawnBoss(state.wave);
      }
      state.waveSpawnQueue--;
      if (state.waveSpawnQueue <= 0) state.spawning = false;
    }
  }
  if (!state.spawning && state.waveSpawnQueue <= 0 && enemies.all.length === 0) {
    if (state.wave > 0 && !state.waveClearPlayed) { state.waveClearPlayed = true; LEN.audio.waveClear(); }
    state.calmTimer -= dt;
    if (state.calmTimer <= 0) startNextWave();
  }
}

/* ---- ambient floaters ---- */
function updateAmbient(dt) {
  for (const c of crystals) {
    if (!c.mesh.visible) continue;
    c.phase += dt;
    c.mesh.position.y = 0.4 + Math.sin(c.phase) * 0.12;
    c.mesh.rotation.y += dt * 0.6;
    c.inner.rotation.y -= dt * 1.2;
  }
  core.orb.rotation.y += dt * 0.5;
  core.orb.position.y = 6.3 + Math.sin(performance.now() * 0.001) * 0.1;
  core.orb.material.emissiveIntensity = 0.9 + LEN.world.night * 2.2;   // core halo reads at night
  LEN.world.ring.rotation.z += dt * 0.1;
  for (let i = LEN.puffs.length - 1; i >= 0; i--) {
    const p = LEN.puffs[i];
    p.life += dt;
    p.mesh.scale.setScalar(1 + p.life * 1.6);
    p.mesh.material.opacity = 0.8 - p.life * 1.6;
    p.mesh.position.y += dt * 1.2;
    if (p.life > 0.5) {
      LEN.world.scene.remove(p.mesh);
      LEN.puffs.splice(i, 1);
    }
  }
}

/* ---------------- init ---------------- */
LEN.world.setTime(state.timeOfDay);   // apply the starting day phase before first frame
ui.updateHud(state);
camPos.set(player.pos.x + 6, 46, player.pos.z + 40);
camTarget.copy(player.pos);
updateGhost();
requestAnimationFrame(frame);
