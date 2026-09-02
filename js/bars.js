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
  function draw(bar, hp, maxHp) {
    const ctx = bar.ctx;
    ctx.clearRect(0, 0, 64, 10);
    ctx.fillStyle = 'rgba(15,25,30,0.55)'; ctx.fillRect(0, 0, 64, 10);
    const f = Math.max(0, Math.min(1, hp / maxHp));
    ctx.fillStyle = f > 0.5 ? '#8fd6c9' : (f > 0.25 ? '#e8c98b' : '#e8968b');
    ctx.fillRect(1, 2, 62 * f, 6);
    bar.tex.needsUpdate = true;
  }
  return { make, draw };
})();
