/* enemies.js — drifting shadow-creeps: several kinds, each with distinct stats & look */
LEN.enemies = (function () {
  const { scene } = LEN.world;
  const CFG = LEN.CFG;
  const enemies = [];

  const TYPES = {
    drifter: { color: 0x9aa7b8, r: 0.9,  hpMul: 1,    speedMul: 1,    dmgMul: 1,    barY: 2.5, glow: 0x8fd6e8 },
    racer:   { color: 0x7fc6d4, r: 0.55, hpMul: 0.45, speedMul: 2.0,  dmgMul: 0.6,  barY: 1.9, glow: 0x8fe0ee },
    tank:    { color: 0xb39bc4, r: 1.4,  hpMul: 3.2,  speedMul: 0.5,  dmgMul: 2.6,  barY: 3.1, glow: 0xd0b0f0 },
    // wisp: a fast rusher that slips past weak walls and punishes slow builds (#55)
    wisp:    { color: 0x9fc7a8, r: 0.6,  hpMul: 0.62, speedMul: 2.6,  dmgMul: 0.9,  barY: 2.0, glow: 0xa8e8b0 },
    // bastion: an armored juggernaut — an armor pool absorbs every hit before its HP,
    // forcing the player to invest sustained damage or let it through (#55)
    bastion: { color: 0xd6a56a, r: 1.55, hpMul: 3.9,  speedMul: 0.42, dmgMul: 2.2,  barY: 3.4, glow: 0xffd79a, armorMul: 0.9 },
  };

  /* warden boss — appears every 5th wave, one of three rotating mechanics */
  const BOSS_MECH = ['shield', 'heal', 'split'];
  // glowing crown that overwrites the boss's emissive per mechanic
  const BOSS_GLOW = { shield: 0x9fd6ff, heal: 0xa8e6a0, split: 0xefb2d0 };

  /* every 5th wave sends a warden: big HP, plus a rotating unique mechanic */
  function spawnBoss(wave) {
    const cycle = Math.floor(wave / 5);
    const mechanic = BOSS_MECH[cycle % BOSS_MECH.length];
    const r = 2.4;
    const baseHp = (CFG.wave.hpBase + wave * CFG.wave.hpPerWave) * 9;
    const hp = baseHp;
    const a = Math.random() * Math.PI * 2;
    const pos = new THREE.Vector3(Math.cos(a) * (CFG.world + 7), 0, Math.sin(a) * (CFG.world + 7));
    const g = new THREE.Group();

    const bodyMat = new THREE.MeshStandardMaterial({ color: 0x6c5b74, roughness: 0.7 });
    const body = new THREE.Mesh(new THREE.SphereGeometry(r, 20, 16), bodyMat);
    body.scale.set(1, 1.2, 0.95); body.position.y = r; body.castShadow = true;
    const glow = new THREE.Mesh(new THREE.SphereGeometry(r * 0.4, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0xbfe3ff, emissive: BOSS_GLOW[mechanic], emissiveIntensity: 1.4, roughness: 0.3 }));
    glow.position.y = r * 1.25;
    // crown of spikes so it reads as a boss
    const spikeMat = new THREE.MeshStandardMaterial({ color: 0x4a3f55, roughness: 0.6 });
    for (let i = 0; i < 8; i++) {
      const ang = (i / 8) * Math.PI * 2;
      const spike = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 6), spikeMat);
      spike.position.set(Math.cos(ang) * r * 0.75, r * 2.4, Math.sin(ang) * r * 0.75);
      spike.rotation.x = Math.PI * 0.85;
      spike.rotation.z = ang;
      spike.castShadow = true;
      g.add(spike);
    }
    // two heavy feet
    const footMat = new THREE.MeshStandardMaterial({ color: 0x4a3f55, roughness: 1 });
    const fs = r * 0.3;
    const f1 = new THREE.Mesh(new THREE.SphereGeometry(fs, 10, 8), footMat);
    f1.position.set(-r * 0.4, r * 0.3, r * 0.3);
    const f2 = f1.clone(); f2.position.x = r * 0.4;
    // stern eyes
    const eR = r * 0.14;
    const eL = new THREE.Mesh(new THREE.SphereGeometry(eR, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffe9c4 }));
    eL.position.set(-r * 0.36, r * 1.2, r * 0.8);
    const er2 = eL.clone(); er2.position.x = r * 0.36;
    g.add(body, glow, f1, f2, eL, er2);

    const bar = LEN.bars.make(6.5, 0.7);
    bar.sprite.position.y = r * 2.6 + 2.2; g.add(bar.sprite);

    g.position.copy(pos);
    scene.add(g);

    const e = {
      group: g, pos, hp, maxHp: hp, boss: true, mechanic,
      speed: CFG.wave.speed * 0.62, wob: Math.random() * 6.28,
      killVal: Math.round(60 + wave * 9),
      glow, bar, dmgMul: 1, collideR: r, attackCd: 0,
      // mechanic state
      shield: mechanic === 'shield' ? 16 : 0,   // absorbs this many hit events before it shatters
      auraCd: 1.2,
      healCd: 0,
    };
    LEN.bars.draw(bar, hp, hp);
    enemies.push(e);
    return e;
  }

  /* mix of kinds grows with wave number */
  function pickType(wave) {
    const pool = [['drifter', 1]];
    if (wave >= 2) pool.push(['racer', Math.min(0.55, 0.22 + wave * 0.03)]);
    if (wave >= 3) pool.push(['wisp', Math.min(0.5, 0.18 + wave * 0.03)]);
    if (wave >= 4) pool.push(['tank', Math.min(0.4, 0.12 + wave * 0.02)]);
    if (wave >= 5) pool.push(['bastion', Math.min(0.3, 0.1 + wave * 0.015)]);
    let total = 0; for (const [, w] of pool) total += w;
    let r = Math.random() * total;
    for (const [t, w] of pool) { r -= w; if (r <= 0) return t; }
    return 'drifter';
  }

  function spawn(wave) {
    const type = TYPES[pickType(wave)];
    const diff = (LEN.diff && LEN.diff()) || {};
    const baseHp = CFG.wave.hpBase + wave * CFG.wave.hpPerWave;
    const hp = baseHp * type.hpMul * (diff.hpMul || 1);
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

    const armor = (type.armorMul || 0) > 0 ? hp * type.armorMul : 0;
    bar.maxArmor = armor;
    const e = {
      group: g, pos: g.position.clone(), hp, maxHp: hp,
      armor, maxArmor: armor,
      speed: CFG.wave.speed * type.speedMul * (diff.speedMul || 1) * LEN.entities.random(0.9, 1.1),
      wob: Math.random() * 6.28, killVal: Math.round(12 * type.hpMul),
      type, glow, bar, dmgMul: type.dmgMul, collideR: type.r, attackCd: 0,
    };
    LEN.bars.draw(bar, hp, hp, armor);
    enemies.push(e);
    return e;
  }

  function hit(e, dmg) {
    if (e.hp <= 0) return false;   // already dead this frame — avoid double-awarding kill score
    if (e.boss && e.shield > 0) {
      // shield mechanic: absorbs this hit entirely, then shatters with a flash
      e.shield--;
      LEN.towers.puff(e.pos.clone(), 0xbfe3ff);
      if (e.shield === 0) {
        e.glow.material.emissiveIntensity = 0.4;   // dim to boss-glow after shield breaks
        LEN.towers.puff(e.pos.clone(), 0x9fd6ff);
      }
      return false;
    }
    // armor absorbs hits first; once broken the remaining damage spills into health (#55)
    if (e.armor > 0) {
      const absorbed = Math.min(e.armor, dmg);
      e.armor -= absorbed; dmg -= absorbed;
    }
    e.hp -= dmg;
    LEN.bars.draw(e.bar, Math.max(0, e.hp), e.maxHp, Math.max(0, e.armor));
    LEN.towers.puff(e.pos.clone(), e.boss ? 0xdcb7e8 : 0xeef3f5);
    LEN.fx.spark(e.pos.clone(), 0xe7f2f6, { count: 5, speed: 3.2, life: 0.5, size: 0.09 });
    if (e.hp <= 0) {
      scene.remove(e.group); remove(e);
      LEN.addScore(e.killVal + Math.floor(e.maxHp * 0.3));
      // split mechanic: on death the warden shatters into a burst of drifters
      if (e.boss && e.mechanic === 'split') {
        for (let i = 0; i < 4; i++) {
          const d = spawn(20);
          d.pos.copy(e.pos);
          d.group.position.copy(e.pos);
        }
      }
      return true;
    }
    return false;
  }

  /* heal aura / ongoing boss behaviour — called from the sim loop */
  function tickBoss(e, dt) {
    if (e.mechanic === 'heal') {
      e.auraCd -= dt;
      if (e.auraCd <= 0) {
        e.auraCd = 1.2;
        for (const other of enemies) {
          if (other.hp <= 0 || other === e) continue;
          if (other.pos.distanceTo(e.pos) < 16 && other.hp < other.maxHp) {
            other.hp = Math.min(other.maxHp, other.hp + 4);
            LEN.bars.draw(other.bar, other.hp, other.maxHp);
          }
        }
      }
    }
  }
  function remove(e) { const i = enemies.indexOf(e); if (i >= 0) enemies.splice(i, 1); }

  return { all: enemies, spawn, spawnBoss, hit, remove, tickBoss, TYPES };
})();
