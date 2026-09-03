/* config.js — central tunable constants + shared namespace */
window.LEN = window.LEN || {};

LEN.RES_MAX = 240;

LEN.CFG = {
  world: 90,                 // world half-extent
  grid: 7,                   // build cell size
  player: { speed: 9.5, radius: 1.5 },
  gather: { radius: 7.5, rate: 20 },
  baseHP: 100,
  // start-resource budget — used to seed a run (difficulty may scale it, #53)
  startRes: 90,
  /* optional difficulty presets (#53). 'normal' ≈ legacy curve; 'calm' relaxes it for
   * a gentle intro; 'relentless' scales HP/count/speed and leak damage up so the game
   * stays a real tower defense for experienced players. Every run reads its preset through
   * LEN.diff() so enemies, waves and leaks share one source of truth. */
  difficulty: {
    calm:       { label: 'Calm',       hpMul: 0.8,  countMul: 0.8,  speedMul: 0.9,  leakMul: 0.7,  resMul: 1.2, calm: 12 },
    normal:     { label: 'Normal',      hpMul: 1.0,  countMul: 1.0,  speedMul: 1.0,  leakMul: 1.0,  resMul: 1.0, calm: 8  },
    relentless:{ label: 'Relentless',  hpMul: 1.4,  countMul: 1.35, speedMul: 1.15, leakMul: 1.5,  resMul: 0.8, calm: 5  },
  },
  wave: {
    calm: 8,                 // seconds between waves (overridden by the chosen difficulty, #53)
    spawnInterval: 0.62,       // continuous pressure: faster cadence than legacy 0.72
    countBase: 5,
    countPerWave: 2.0,        // wave size grows briskly — every wave must be answered
    hpBase: 16,
    hpPerWave: 8.5,           // towered DPS has to keep climbing
    speed: 2.3,
    dmgBase: 8,               // core leaks hurt more immediately
    dmgPerWave: 1.4,         // a broken wall genuinely threatens the core (#54)
    // periodic "surge" pressure spikes — every surgeEvery-th wave arrives as a denser,
    // faster-cadence rush that demands an active response rather than an AFK wall (#54)
    surgeEvery: 4,
    surgeCountMul: 1.45,
    surgeSpawnInterval: 0.4,
  },
  crystal: { capacity: 42, count: 14 },
  dayNight: { period: 240 },   // seconds for a full gentle day/night cycle
  projectileMaxLife: 4,          // seconds a homing projectile may live before expiring

  towers: [
    { name: 'Sprout', color: 0x6fa8a0, cost: 30, range: 24, dmg: 13, rate: 0.75, aoe: 0,   projSpeed: 30, orb: 0x8fd6c9, hp: 70,  collideR: 3.0, barY: 5.0 },
    { name: 'Cinder', color: 0xe8b58b, cost: 50, range: 17, dmg: 30, rate: 1.5,  aoe: 8,   projSpeed: 22, orb: 0xffd7ad, hp: 85,  collideR: 3.2, barY: 4.8 },
    { name: 'Bramble', color: 0x9fbf8b, cost: 45, range: 10, dmg: 26, rate: 0.9,  aoe: 0,   projSpeed: 26, orb: 0xc3e2a8, hp: 170, collideR: 3.4, barY: 5.4 },
  ],
};
