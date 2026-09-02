/* entities.js — player character, the core/relic, and resource crystals */
LEN.entities = (function () {
  const { scene, ground } = LEN.world;
  const CFG = LEN.CFG;

  const helpers = {
    rand: (a, b) => a + Math.random() * (b - a),
    randPos() {
      let x, z, tries = 0;
      do {
        const a = Math.random() * Math.PI * 2;
        const r = 9 + Math.random() * (CFG.world - 12);
        x = Math.cos(a) * r; z = Math.sin(a) * r;
        tries++;
      } while (tries < 40 && Math.hypot(x, z) < 7);
      return { x, z };
    },
  };

  /* ---- the gatherer: a cute low-poly blob ---- */
  const player = (() => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.95, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0x7fa8c9, roughness: 0.7 }));
    body.scale.set(1, 1.05, 0.95); body.position.y = 0.95; body.castShadow = true;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.6, 20, 16),
      new THREE.MeshStandardMaterial({ color: 0x8db6d6, roughness: 0.6 }));
    head.position.y = 2.15; head.castShadow = true;
    const eL = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eL.position.set(-0.18, 2.25, 0.55);
    const eR = eL.clone(); eR.position.x = 0.18;
    const pL = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 6), new THREE.MeshBasicMaterial({ color: 0x4a5560 }));
    pL.position.set(-0.18, 2.22, 0.67);
    const pR = pL.clone(); pR.position.x = 0.18;
    const bag = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 10),
      new THREE.MeshStandardMaterial({ color: 0xe8c9a0, roughness: 0.8 }));
    bag.position.set(0.75, 1.0, 0); bag.scale.set(0.7, 1, 0.8);
    // two little waddling feet
    const footMat = new THREE.MeshStandardMaterial({ color: 0x6f93b3, roughness: 1 });
    const fL = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), footMat);
    fL.position.set(-0.34, 0.18, 0.18);
    const fR = fL.clone(); fR.position.x = 0.34;
    // a tiny sprout leaf on the head (calm woodland theme)
    const leaf = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.5, 4),
      new THREE.MeshStandardMaterial({ color: 0x8fc49a, roughness: 1 }));
    leaf.position.y = 2.7; leaf.rotation.x = -0.2; leaf.rotation.z = 0.5;
    g.add(body, head, eL, eR, pL, pR, bag, fL, fR, leaf);
    scene.add(g);
    // spawn just south of the core so it is visible immediately
    return { group: g, pos: new THREE.Vector3(0, 0, 20), look: 0, bob: 0, moving: false };
  })();
  player.group.position.copy(player.pos);

  /* ---- the protected core ---- */
  const core = (() => {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.0, 1.6, 24),
      new THREE.MeshStandardMaterial({ color: 0xdfe8dd, roughness: 0.9 }));
    base.position.y = 0.8; base.castShadow = true;
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.8, 4.4, 12),
      new THREE.MeshStandardMaterial({ color: 0xf0f4ee, roughness: 0.6 }));
    col.position.y = 3.8; col.castShadow = true;
    const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.95, 1),
      new THREE.MeshStandardMaterial({ color: 0x6fa8a0, emissive: 0x3f7f76, emissiveIntensity: 0.9, roughness: 0.3 }));
    orb.position.y = 6.3;
    // soft halo so the core reads clearly from a distance
    const haloTex = (() => {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const cx = c.getContext('2d');
      const grd = cx.createRadialGradient(32,32,2,32,32,30);
      grd.addColorStop(0,'rgba(140,220,200,0.9)'); grd.addColorStop(1,'rgba(140,220,200,0)');
      cx.fillStyle = grd; cx.fillRect(0,0,64,64);
      return new THREE.CanvasTexture(c);
    })();
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: haloTex, transparent: true, depthWrite: false }));
    halo.scale.set(9, 9, 1); halo.position.y = 6.3;
    g.add(base, col, orb, halo);
    scene.add(g);
    return { group: g, orb, halo };
  })();

  /* ---- toggleable crystals for gathering ---- */
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x8fb8d8, emissive: 0x6ba6cf, emissiveIntensity: 0.35, roughness: 0.25, metalness: 0.1 });
  const crystals = [];
  for (let i = 0; i < CFG.crystal.count; i++) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), crystalMat);
    m.position.y = 0.4; m.castShadow = true;
    scene.add(m);
    const inner = new THREE.Mesh(new THREE.OctahedronGeometry(0.34, 0),
      new THREE.MeshBasicMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.9 }));
    m.add(inner);
    const c = { mesh: m, inner, amount: CFG.crystal.capacity, phase: Math.random() * 10 };
    refreshCrystal(c);
    crystals.push(c);
  }
  function refreshCrystal(c) {
    const p = helpers.randPos();
    c.mesh.position.set(p.x, 0.4, p.z);
    c.amount = CFG.crystal.capacity;
    c.mesh.visible = true;
  }

  return { player, core, crystals, refreshCrystal, crystalMat, random: helpers.rand, randPos: helpers.randPos };
})();
