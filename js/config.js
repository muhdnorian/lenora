/* config.js — central tunable constants + shared namespace */
window.LEN = window.LEN || {};

LEN.RES_MAX = 240;

LEN.CFG = {
  world: 90,                 // world half-extent
  grid: 7,                   // build cell size
  player: { speed: 9.5, radius: 1.5 },
  gather: { radius: 7.5, rate: 20 },
  baseHP: 100,
  wave: {
    calm: 8,                 // seconds between waves
    spawnInterval: 0.72,
    countBase: 5,
    countPerWave: 2.2,
    hpBase: 16,
    hpPerWave: 9,
    speed: 2.3,
    dmgBase: 8,
    dmgPerWave: 1.4,
  },
  crystal: { capacity: 42, count: 14 },
  projectileMaxLife: 4,          // seconds a homing projectile may live before expiring

  towers: [
    { name: 'Sprout', color: 0x6fa8a0, cost: 30, range: 24, dmg: 13, rate: 0.75, aoe: 0,   projSpeed: 30, orb: 0x8fd6c9, hp: 70,  collideR: 3.0, barY: 5.0 },
    { name: 'Cinder', color: 0xe8b58b, cost: 60, range: 17, dmg: 30, rate: 1.5,  aoe: 8,   projSpeed: 22, orb: 0xffd7ad, hp: 85,  collideR: 3.2, barY: 4.8 },
    { name: 'Bramble', color: 0x9fbf8b, cost: 45, range: 10, dmg: 26, rate: 0.9,  aoe: 0,   projSpeed: 26, orb: 0xc3e2a8, hp: 170, collideR: 3.4, barY: 5.4 },
  ],
};
