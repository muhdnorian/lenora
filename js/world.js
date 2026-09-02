/* world.js — renderer, scene, lights, ground, decorative scenery */
LEN.world = (function () {
  const canvas = document.getElementById('gameCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xf3f6f3);
  scene.fog = new THREE.Fog(0xf3f6f3, 70, 190);

  const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 46, 46);

  /* lights */
  const DAY_BG = new THREE.Color(0xf3f6f3);
  const NIGHT_BG = new THREE.Color(0x161a2e);
  const DAY_FOG = new THREE.Color(0xf3f6f3);
  const NIGHT_FOG = new THREE.Color(0x10131f);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xd9e7dc, 0.85);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff4e0, 0.95);
  sun.position.set(34, 60, 24);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -70;
  sun.shadow.camera.right = sun.shadow.camera.top = 70;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 160;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xbcd9ff, 0.25);
  fill.position.set(-30, 30, -30);
  scene.add(fill);

  /* gentle day/night cycle — t in [0,1): 0 = mid-morning light, wraps through dusk & night */
  const DAY_SUN = new THREE.Color(0xfff4e0);
  const NIGHT_SUN = new THREE.Color(0x9fb4ff);   // cool moonlight at night
  let night = 0;   // 0 = full day, 1 = full night (exposed so enemies can glow brighter at night)
  function setTime(t) {
    const theta = t * Math.PI * 2;
    // smooth bell: ~1 around midday, ~0.15 at deepest night
    const day = 0.5 + 0.5 * Math.cos(theta);
    night = 1 - day;
    scene.background.copy(DAY_BG).lerp(NIGHT_BG, night * 0.85);
    scene.fog.color.copy(DAY_FOG).lerp(NIGHT_FOG, night * 0.85);
    scene.fog.near = 70 + 60 * night; scene.fog.far = 190 + 60 * night;
    hemi.intensity = 0.32 + 0.55 * day;
    sun.intensity = 0.14 + 0.85 * day;
    sun.color.copy(DAY_SUN).lerp(NIGHT_SUN, night);
    fill.intensity = 0.08 + 0.22 * night;
    return day;
  }

  /* ground plane (used for raycasting placement) */
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(LEN.CFG.world * 2.4, LEN.CFG.world * 2.4),
    new THREE.MeshStandardMaterial({ color: 0xdcead8, roughness: 0.95, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* soft ring marking the protected core area */
  const ring = new THREE.Mesh(new THREE.RingGeometry(6.5, 7.2, 64),
    new THREE.MeshBasicMaterial({ color: 0x6fa8a0, transparent: true, opacity: 0.25, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = 0.02;
  scene.add(ring);

  /* decorative soft trees */
  const palette = [0xa7c7a0, 0x9fbfa8, 0xb3cfa8, 0x96b8a2];
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0xbca88e, roughness: 1 });
  function addTree(x, z, s) {
    const g = new THREE.Group();
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.5 * s, 0.7 * s, 2.4 * s, 7), trunkMat);
    trunk.position.y = 1.2 * s; trunk.castShadow = true;
    const f1 = new THREE.Mesh(new THREE.ConeGeometry(1.5 * s, 2.1 * s, 8),
      new THREE.MeshStandardMaterial({ color: palette[(Math.random() * palette.length) | 0], roughness: 1 }));
    f1.position.y = 2.9 * s; f1.castShadow = true;
    const f2 = new THREE.Mesh(new THREE.ConeGeometry(1.0 * s, 1.6 * s, 8),
      new THREE.MeshStandardMaterial({ color: palette[(Math.random() * palette.length) | 0], roughness: 1 }));
    f2.position.y = 4.3 * s; f2.castShadow = true;
    g.add(trunk, f1, f2);
    g.position.set(x, 0, z);
    g.rotation.y = Math.random() * Math.PI * 2;
    scene.add(g);
  }
  for (let i = 0; i < 46; i++) {
    const ang = Math.random() * Math.PI * 2;
    const r = 14 + Math.random() * (LEN.CFG.world - 14);
    addTree(Math.cos(ang) * r, Math.sin(ang) * r, 0.7 + Math.random() * 0.8);
  }

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  return { renderer, scene, camera, sun, ground, ring, setTime, get night() { return night; } };
})();
