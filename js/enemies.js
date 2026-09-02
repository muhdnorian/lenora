/* enemies.js — drifting shadow-creeps: several kinds, each with distinct stats & look */
LEN.enemies = (function () {
  const { scene } = LEN.world;
  const CFG = LEN.CFG;
  const enemies = [];

  const TYPES = {
    drifter: { color: 0x9aa7b8, r: 0.9,  hpMul: 1,    speedMul: 1,    dmgMul: 1,    barY: 2.5, glow: 0x8fd6e8 },
    racer:   { color: 0x7fc6d4, r: 0.55, hpMul: 0.45, speedMul: 2.0,  dmgMul: 0.6,  barY: 1.9, glow: 0x8fe0ee },
    tank:    { color: 0xb39bc4, r: 1.4,  hpMul: 3.2,  speedMul: 0.5,  dmgMul: 2.6,  barY: 3.1, glow: 0xd0b0f0 },
  };

  /* mix of kinds grows with wave number */
  function pickType(wave) {
    const pool = [['drifter', 1]];
    if (wave >= 2) pool.push(['racer', Math.min(0.55, 0.22 + wave * 0.03)]);
    if (wave >= 4) pool.push(['tank', Math.min(0.4, 0.12 + wave * 0.02)]);
    let total = 0; for (const [, w] of pool) total += w;
    let r = Math.random() * total;
    for (const [t, w] of pool) { r -= w; if (r <= 0) return t; }
    return 'drifter';
  }

  function spawn(wave) {
    const type = TYPES[pickType(wave)];
    const baseHp = CFG.wave.hpBase + wave * CFG.wave.hpPerWave;
    const hp = baseHp * type.hpMul;
    const a = Math.random() * Math.PI * 2;
    const r = CFG.world + 7;
    const g = new THREE.Group();

    // rounded blob body
    const body = new THREE.Mesh(new THREE.SphereGeometry(type.r, 16, 12),
      new THREE.MeshStandardMaterial({ color: type.color, roughness: 0.85 }));
    body.scale.set(1, 1.12, 0.92); body.position.y = type.r; body.castShadow = true;
    // glowing core that dims as it is damaged
    const glow = new THREE.Mesh(new THREE.SphereGeometry(type.r * 0.38, 14, 12),
      new THREE.MeshStandardMaterial({ color: 0xbfe3ff, emissive: type.glow, emissiveIntensity: 1.1, roughness: 0.3 }));
    glow.position.y = type.r * 1.2;
    // two little feet
    const footMat = new THREE.MeshStandardMaterial({ color: type.color, roughness: 1 });
    const fs = type.r * 0.28;
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(fs, 10, 8), footMat);
    f1.position.set(-type.r * 0.32, type.r * 0.25, type.r * 0.25);
    const f2 = f1.clone(); f2.position.x = type.r * 0.32;
    // sleepy eyes
    const eR = type.r * 0.13;
    const eL = new THREE.Mesh(new THREE.SphereGeometry(eR, 8, 8), new THREE.MeshBasicMaterial({ color: 0xfff2dd }));
    eL.position.set(-type.r * 0.32, type.r * 1.15, type.r * 0.7);
    const er2 = eL.clone(); er2.position.x = type.r * 0.32;
    g.add(body, glow, f1, f2, eL, er2);

    // floating health bar
    const bar = LEN.bars.make(type.r > 0.8 ? 3.1 : (type.r < 0.7 ? 2.0 : 2.4), 0.4);
    bar.sprite.position.y = type.barY; g.add(bar.sprite);

    g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    scene.add(g);

    const e = {
      group: g, pos: g.position.clone(), hp, maxHp: hp,
      speed: CFG.wave.speed * type.speedMul * LEN.entities.random(0.9, 1.1),
      wob: Math.random() * 6.28, killVal: Math.round(12 * type.hpMul),
      type, glow, bar, dmgMul: type.dmgMul, collideR: type.r, attackCd: 0,
    };
    LEN.bars.draw(bar, hp, hp);
    enemies.push(e);
    return e;
  }

  function hit(e, dmg) {
    if (e.hp <= 0) return false;   // already dead this frame — avoid double-awarding kill score
    e.hp -= dmg;
    LEN.bars.draw(e.bar, e.hp, e.maxHp);
    LEN.towers.puff(e.pos.clone(), 0xeef3f5);
    if (e.hp <= 0) {
      scene.remove(e.group); remove(e);
      LEN.addScore(e.killVal + Math.floor(e.maxHp * 0.3));
      return true;
    }
    return false;
  }
  function remove(e) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }

  return { all: enemies, spawn, hit, remove, TYPES };
})();
