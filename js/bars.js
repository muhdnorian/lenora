/* bars.js — tiny shared floating health-bar sprites (used by units and enemies) */
LEN.bars = (function () {
  function make(scaleW, scaleH) {
    const c = document.createElement('canvas'); c.width = 64; c.height = 10;
    const ctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    const sprite = new THREE.Sprite(
      new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
    sprite.scale.set(scaleW || 2.6, scaleH || 0.42, 1);
    return { ctx, tex, sprite };
  }
  function draw(bar, hp, maxHp, armorFrac) {
    const ctx = bar.ctx;
    ctx.clearRect(0, 0, 64, 10);
    ctx.fillStyle = 'rgba(15,25,30,0.55)'; ctx.fillRect(0, 0, 64, 10);
    const f = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = f > 0.5 ? '#8fd6c9' : (f > 0.25 ? '#e8c98b' : '#e8968b');
    ctx.fillRect(1, 2, 62 * f, 6);
    // gold armor layer drawn on top (#55) so an armored enemy's remaining shield reads clearly
    if (armorFrac > 0) {
      const af = Math.max(0, Math.min(1, armorFrac / (bar.maxArmor || armorFrac || 1)));
      ctx.fillStyle = 'rgba(232,196,120,0.95)'; ctx.fillRect(1, 2, 62 * af, 2.4);
    }
    bar.tex.needsUpdate = true;
  }
  return { make, draw };
})();
