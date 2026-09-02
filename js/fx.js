/* fx.js — lightweight additive particle FX: sparks + expanding rings (visual juice) */
LEN.fx = (function () {
  const { scene } = LEN.world;
  const parts = [];
  const SCR = new THREE.Vector3();

  /* burst of flying mineral splinters */
  function spark(pos, color, opts = {}) {
    const count = opts.count || 6;
    const speed = opts.speed || 4;
    const size = opts.size || 0.1;
    const max = opts.life || 0.5;
    const gravity = opts.gravity ?? 2.5;
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true });
    for (let i = 0; i < count; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(size * (0.7 + Math.random() * 0.6), 6, 5), mat.clone());
      m.position.copy(pos);
      SCR.set((Math.random() - 0.5) * 2, Math.random() * 2 + 0.4, (Math.random() - 0.5) * 2).normalize();
      const v = SCR.clone().multiplyScalar(speed * (0.4 + Math.random() * 0.8));
      v.y = Math.abs(v.y) * 0.6 + 0.5;
      scene.add(m);
      parts.push({ mesh: m, v, life: 0, max: max * (0.6 + Math.random() * 0.8), gravity, spark: true });
    }
  }

  /* expanding flat ring (muzzle flash / placement / wave-clear) */
  function ring(pos, color, opts = {}) {
    const grow = opts.grow || 2;
    const max = opts.life || 0.5;
    const r = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.7, 24),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.85, side: THREE.DoubleSide,
        depthWrite: false }));
    r.position.copy(pos);
    r.rotation.x = -Math.PI / 2;
    r.position.y = (pos.y || 0) + (opts.y || 0.06);
    scene.add(r);
    parts.push({ mesh: r, v: new THREE.Vector3(), life: 0, max, ring: true, grow });
  }

  /* single short-lived additive glow sprite (muzzle flash at the barrel) */
  function flash(pos, color, opts = {}) {
    const max = opts.life || 0.16;
    const m = new THREE.Mesh(new THREE.SphereGeometry(opts.size || 0.5, 8, 6),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false }));
    m.position.copy(pos);
    scene.add(m);
    parts.push({ mesh: m, v: new THREE.Vector3(), life: 0, max, flash: true });
  }

  function update(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life += dt;
      const f = Math.min(1, p.life / p.max);
      if (p.ring) {
        const s = p.grow * (0.4 + 2.4 * f);
        p.mesh.scale.set(s, s, s);
        p.mesh.material.opacity = 0.85 * (1 - f);
      } else if (p.flash) {
        p.mesh.material.opacity = 0.9 * (1 - f);
        p.mesh.scale.setScalar(1 + f * 2.4);
      } else {
        p.v.y -= p.gravity * dt;
        p.mesh.position.addScaledVector(p.v, dt);
        p.mesh.material.opacity = 0.9 * (1 - f);
      }
      if (p.life >= p.max) { scene.remove(p.mesh); parts.splice(i, 1); }
    }
  }

  return { spark, ring, flash, update };
})();
