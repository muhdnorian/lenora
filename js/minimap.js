/* minimap.js — compact corner radar of the valley: crystals, towers, core, enemies, player.
   Read-only overlay (no interaction), drawn with plain 2D canvas a few times per second. */
LEN.minimap = (function () {
  const el = document.getElementById('minimap');
  const ctx = el.getContext('2d');
  const SIZE = el.width;            // 150 px internal resolution
  const PAD = 9;                // inset so dots near the edge stay visible
  const world = LEN.CFG.world;   // half-extent of the playable world
  const half = SIZE / 2;

  // map a world (x, z) to minimap pixel coords; +z (camera/south) goes downward
  function px(x) { return PAD + ((x + world) / (2 * world)) * (SIZE - 2 * PAD); }
  function py(z) { return SIZE - PAD - ((z + world) / (2 * world)) * (SIZE - 2 * PAD); }
  function dot(x, z, r, color, alpha) {
    ctx.globalAlpha = alpha == null ? 1 : alpha;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(px(x), py(z), r, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // redraw every N frames (≈10 Hz) — plenty for a radar and very cheap.
  let acc = 0;
  function render(dt) {
    acc = (acc + dt) % 0.1;
    if (acc < dt) draw();
  }

  function draw() {
    ctx.clearRect(0, 0, SIZE, SIZE);

    // gentle terrain tint so the panel doesn't feel empty
    ctx.fillStyle = 'rgba(111,168,160,0.10)';
    ctx.beginPath();
    ctx.arc(half, half, half - PAD, 0, Math.PI * 2);
    ctx.fill();

    // protected core at the valley centre
    dot(0, 0, 4, '#6fa8a0', 0.95);

    // crystals (gatherable resources)
    for (const c of LEN.entities.crystals) {
      if (!c.mesh.visible) continue;
      dot(c.mesh.position.x, c.mesh.position.z, 1.7, '#8fb8d8', 0.9);
    }

    // player
    const p = LEN.entities.player.pos;
    dot(p.x, p.z, 2.2, '#ffffff', 1);

    // towers
    for (const t of LEN.towers.entities) {
      if (t.dead) continue;
      dot(t.pos.x, t.pos.z, 2.4, LEN.CFG.towers[t.type].color, 0.95);
    }

    // enemies — fade slightly as they near the core for readability
    for (const e of LEN.enemies.all) {
      const near = Math.max(0, 1 - e.pos.length() / 46);
      dot(e.pos.x, e.pos.z, e.collideR > 1 ? 2.6 : 1.8, '#d96a6a', 0.5 + 0.5 * near);
    }
  }

  return { render, draw, px, py };
})();
