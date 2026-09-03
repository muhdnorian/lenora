/* towers.js — building placement, turret geometry, projectiles, build ghost */
LEN.towers = (function () {
  const { scene, ground, camera } = LEN.world;
  const CFG = LEN.CFG;
  const entities = [];

  function buildUnitGroup(type) {
    const cfg = CFG.towers[type];
    const g = new THREE.Group();
    const stone = new THREE.MeshStandardMaterial({ color: 0xe9e4d8, roughness: 0.9 });
    const metal = new THREE.MeshStandardMaterial({ color: 0xddddd6, roughness: 0.5, metalness: 0.1 });
    const base = new THREE.Mesh(new THREE.CylinderGeometry(1.9, 2.3, 1.1, 18), stone);
    base.position.y = 0.55; base.castShadow = true;
    g.add(base);
    let turret; // the rotating firing assembly
    if (type === 1) {
      // Cinder: a round firing golem
      const drum = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.5, 1.7, 16), metal);
      drum.position.y = 2.2; drum.castShadow = true;
      const ringG = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.16, 8, 18),
        new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.6 }));
      ringG.rotation.x = Math.PI / 2; ringG.position.y = 2.2;
      turret = new THREE.Group(); turret.add(drum, ringG); g.add(turret);
    } else if (type === 2) {
      // Bramble: tall spiky sentry (tank)
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.15, 2.6, 12), metal);
      pillar.position.y = 2.4; pillar.castShadow = true;
      turret = new THREE.Group(); turret.add(pillar);
      for (let i = 0; i < 4; i++) {
        const a = (i / 4) * Math.PI * 2;
        const spike = new THREE.Mesh(new THREE.ConeGeometry(0.4, 1.1, 5),
          new THREE.MeshStandardMaterial({ color: cfg.color, roughness: 0.8 }));
        spike.position.set(Math.cos(a) * 0.75, 3.5, Math.sin(a) * 0.75);
        spike.rotation.x = Math.PI;
        spike.castShadow = true;
        turret.add(spike);
      }
      g.add(turret);
    } else {
      // Sprout: slender guardian with an antenna eye
      const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.7, 1.7, 12), stone);
      neck.position.y = 1.8;
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.8, 18, 14), metal);
      head.position.y = 2.9; head.castShadow = true;
      const antenna = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.14, 1.2, 6), metal);
      antenna.position.y = 3.8;
      turret = new THREE.Group(); turret.add(neck, head, antenna); g.add(turret);
    }
    return { g, turret };
  }
  const orbMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.7, roughness: 0.3 });

  function place(col, row, type) {
    const cfg = CFG.towers[type];
    const { g, turret } = buildUnitGroup(type);
    const orb = new THREE.Mesh(new THREE.OctahedronGeometry(type === 2 ? 0.5 : 0.42, 0), orbMat.clone());
    orb.material.emissive.setHex(cfg.orb);
    orb.position.y = type === 1 ? 2.9 : (type === 2 ? 3.5 : 4.0);
    turret.add(orb);
    const x = col * CFG.grid + CFG.grid / 2;
    const z = row * CFG.grid + CFG.grid / 2;
    g.position.set(x, 0, z);
    scene.add(g);
    const bar = LEN.bars.make(3.2, 0.44);
    bar.sprite.position.y = cfg.barY; g.add(bar.sprite);
    LEN.bars.draw(bar, cfg.hp, cfg.hp);
    const t = { group: g, turret, orb, type, cfg, col, row, pos: new THREE.Vector3(x, 0, z), cooldown: 0, hp: cfg.hp, maxHp: cfg.hp, bar, collideR: cfg.collideR, dead: false };
    entities.push(t);
    // placement glow: expanding ring + sparkle puff on the fresh unit (#45)
    LEN.fx.ring(new THREE.Vector3(x, 0, z), cfg.color, 3);
    LEN.fx.spark(new THREE.Vector3(x, 1, z), cfg.color, { count: 10, speed: 3.2, life: 0.7, size: 0.12 });
    return t;
  }

  function damageUnit(u, dmg) {
    if (u.dead) return;
    u.hp -= dmg;
    LEN.bars.draw(u.bar, Math.max(0, u.hp), u.maxHp);
    puff(u.pos.clone(), 0xf0e4d0);
    if (u.hp <= 0) {
      u.dead = true;
      scene.remove(u.group);
      const i = entities.indexOf(u); if (i >= 0) entities.splice(i, 1);
    }
  }

  /* ---- sell / refund (issue #14) ---- */
  const SELL_RATIO = 0.6;
  function sell(t) {
    if (!t || t.dead || t.group.parent !== scene) return 0;
    scene.remove(t.group);
    const i = entities.indexOf(t); if (i >= 0) entities.splice(i, 1);
    return Math.floor(t.cfg.cost * SELL_RATIO);
  }
  function pickFromScreen(clientX, clientY) {
    const v = new THREE.Vector2((clientX / window.innerWidth) * 2 - 1, -(clientY / window.innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(v, camera);
    let best = null, bestD = Infinity;
    for (const t of entities) {
      if (t.dead || !t.group.parent) continue;
      const hits = ray.intersectObject(t.group, true);
      if (hits.length && hits[0].distance < bestD) { bestD = hits[0].distance; best = t; }
    }
    return best;
  }

  /* ---- projectiles ---- */
  function fire(tower, enemy) {
    const p = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8),
      new THREE.MeshBasicMaterial({ color: tower.cfg.orb }));
    p.position.copy(tower.pos); p.position.y = 3.0;
    scene.add(p);
    LEN.fx.flash(new THREE.Vector3(tower.pos.x, 3.0, tower.pos.z), tower.cfg.orb, { life: 0.14, size: 0.55 });
    LEN.projectiles.push({
      mesh: p, target: enemy, speed: tower.cfg.projSpeed,
      dmg: tower.cfg.dmg, aoe: tower.cfg.aoe, from: tower.pos.clone(),
      age: 0, maxAge: LEN.CFG.projectileMaxLife || 4,   // bound homing chase so a projectile can't follow one survivor forever
    });
  }
  function puff(pos, color) {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.8 }));
    m.position.copy(pos); m.position.y = 1;
    scene.add(m);
    LEN.puffs.push({ mesh: m, life: 0 });
  }

  /* ---- build ghost + cell validation ---- */
  const ghost = (() => {
    const g = new THREE.Group();
    const ringG = new THREE.Mesh(new THREE.RingGeometry(1.6, 2.4, 32),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6, side: THREE.DoubleSide }));
    ringG.rotation.x = -Math.PI / 2; ringG.position.y = 0.06;
    const marker = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.6, 0.3, 16),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.4 }));
    marker.position.y = 0.15;
    const rng = buildUnitGroup(0);
    rng.g.traverse(o => { if (o.isMesh) o.material = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, depthWrite: false }); });
    // fat ring that shows the selected tower's firing range on hover (issue #9)
    const rangeRing = new THREE.Mesh(new THREE.RingGeometry(0.95, 1, 48),
      new THREE.MeshBasicMaterial({ color: 0x6fa8a0, transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false }));
    rangeRing.rotation.x = -Math.PI / 2; rangeRing.position.y = 0.1;
    g.add(ringG, marker, rng.g, rangeRing);
    scene.add(g);
    g.visible = false;
    return { g, rng, rangeRing };
  })();

  const ray = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const hoverCell = { col: 0, row: 0 };
  let mouseOnGround = false;

  function cellValid(col, row) {
    const x = col * CFG.grid + CFG.grid / 2;
    const z = row * CFG.grid + CFG.grid / 2;
    const lim = CFG.world - 6;
    if (x < -lim || x > lim || z < -lim || z > lim) return false;
    if (Math.hypot(x, z) < 14) return false;   // keep clear of the core at the origin
    if (entities.some(t => t.col === col && t.row === row)) return false;
    if (LEN.entities.crystals.some(c => Math.hypot(c.mesh.position.x - x, c.mesh.position.z - z) < CFG.grid * 0.6)) return false;
    return true;
  }

  function updateGhost(col, row, opts = {}) {
    const { buildMode, towerType, resources } = opts;
    const x = col * CFG.grid + CFG.grid / 2;
    const z = row * CFG.grid + CFG.grid / 2;
    const cfg = CFG.towers[towerType];
    const ok = buildMode && cellValid(col, row) && resources >= cfg.cost;
    const color = ok ? cfg.color : 0xe07a7a;
    ghost.g.position.set(x, 0, z);
    ghost.rng.g.traverse(o => { if (o.isMesh) o.material.color.setHex(color); });
    // scale + color the range indicator to the selected tower (#9)
    ghost.rangeRing.scale.setScalar(cfg.range);
    ghost.rangeRing.material.color.setHex(color);
    ghost.rangeRing.material.opacity = 0.25;
    ghost.g.visible = buildMode && mouseOnGround;
    ghost.rng.g.visible = buildMode && mouseOnGround;
  }

  function pointerEvent(e) {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
    ray.setFromCamera(pointer, camera);
    const hit = ray.intersectObject(ground, false)[0];
    mouseOnGround = !!hit;
    if (hit) {
      hoverCell.col = Math.floor(hit.point.x / CFG.grid);
      hoverCell.row = Math.floor(hit.point.z / CFG.grid);
      updateGhost(hoverCell.col, hoverCell.row, LEN.getBuildOpts());
    }
  }

  return { entities, place, damageUnit, sell, pickFromScreen, fire, puff, cellValid, updateGhost, pointerEvent, hoverCell, isMouseOnGround: () => mouseOnGround };
})();
