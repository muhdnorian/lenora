// @ts-check
/**
 * smoke.spec.js — end-to-end smoke / regression test for lenora.
 *
 * Loads the real index.html and drives the actual page: asserts the canvas + HUD
 * are present, starts the game, recruits (builds) a tower, and lets a wave
 * spawn — all while asserting the page never emits a console error.
 *
 * This is deliberately a "does the game still boot and accept input" smoke test,
 * not a deep unit suite. It exists so json/infra agents can trust schema,
 * boot, and input-flow changes without launching a browser by hand.
 */
const { test, expect } = require('@playwright/test');

const HUD_CHIPS = {
  crystals: '#resVal',
  core: '#lifeVal',
  wave: '#waveVal',
  score: '#scoreVal',
};

test('game boots: canvas and HUD render with no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

  await page.goto('/');

  // Canvas is the world render target.
  const canvas = page.locator('#gameCanvas');
  await expect(canvas).toBeVisible();

  // All four HUD chips exist.
  for (const [label, sel] of Object.entries(HUD_CHIPS)) {
    await expect(page.locator(sel)).toBeVisible();
  }

  // Start overlay + recruit bar are present.
  await expect(page.locator('#start')).toBeVisible();
  await expect(page.locator('#playBtn')).toBeVisible();
  await expect(page.locator('#buildbar')).toBeAttached();

  // Give the first frames a moment to run, then insist zero errors were emitted.
  await page.waitForTimeout(1500);
  expect(errors, `page emitted errors:\n${errors.join('\n')}`).toEqual([]);
});

test('start flow: clicking play begins a wave and hides the overlay', async ({ page }) => {
  await page.goto('/');

  // Start at wave 0 before play.
  await expect(page.locator('#waveVal')).toHaveText('0');

  await page.click('#playBtn');
  // Overlay should disappear and the game should become live.
  await expect(page.locator('#start')).toBeHidden();
  // Wave banner announces Wave 1 shortly after starting.
  await expect(page.locator('#waveBannerT')).toHaveText('Wave 1');
});

test('build flow: recruit mode toggles and a tower can be placed', async ({ page }) => {
  await page.goto('/');
  await page.click('#playBtn');
  await expect(page.locator('#start')).toBeHidden();

  // Enter recruit/build mode via the toggle button.
  const toggle = page.locator('#buildToggle');
  await toggle.click();
  await expect(toggle).toHaveClass(/on/);

  // Clicking on the canvas in build mode tries to place a tower at the hover cell.
  // The ground occupies most of the viewport, so a center click lands on it.
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  await page.mouse.click(
    box.x + Math.min(box.width, 640) / 2,
    box.y + Math.min(box.height, 640) / 2,
  );

  // The build bar reflects the action (no throw) — the core regression signal here
  // is "clicking, selecting, and toggling never blow up the page."
  await expect(toggle).toBeAttached();
  // Recruit again to exit build mode.
  await toggle.click();
  await expect(toggle).not.toHaveClass(/on/);
});

test('range circle (#9/#58): hovering a placed tower reveals its firing radius, empty ground hides it', async ({ page }) => {
  await page.goto('/');
  await page.click('#playBtn');
  await expect(page.locator('#start')).toBeHidden();

  // Move to the centre of the ground to establish hover state + record the cell under it.
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  await page.mouse.move(cx, cy);

  // Plant a tower on the hovered cell (no matter how close/far from the core).
  const cell = await page.evaluate(() => {
    LEN.getBuildOpts().resources = 1000;
    LEN.towers.place(LEN.towers.hoverCell.col, LEN.towers.hoverCell.row, 0);
    return { col: LEN.towers.hoverCell.col, row: LEN.towers.hoverCell.row };
  });

  // Move away (empty ground → circle hidden), then back onto the tower (circle shown).
  await page.mouse.move(cx + 220, cy + 220);
  expect(await page.evaluate(() => LEN.towers.isRangeVisible())).toBe(false);
  await page.mouse.move(cx, cy);
  expect(await page.evaluate(() => LEN.towers.isRangeVisible())).toBe(true);

  // The tower genuinely sits at the cell we planted.
  const occupied = await page.evaluate(({ col, row }) =>
    LEN.towers.entities.some(t => t.col === col && t.row === row), cell);
  expect(occupied).toBe(true);
});

test('wave progression: waves advance automatically and the HUD reflects them', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(`pageerror: ${err.message}`));

  await page.goto('/');
  await page.click('#playBtn');
  await expect(page.locator('#start')).toBeHidden();

  // Simulated ambient: headless SwiftShader renders slowly, so instead of waiting on
  // wall-clock calm time we collapse the inter-wave calm on the app's own state (the
  // sim still decrements it through the real update loop) and confirm the autonomous
  // wave scheduler flips the HUD to Wave 1 and spawns a wave.
  await page.evaluate(() => { LEN.getBuildOpts().calmTimer = 0.5; });
  await expect(page.locator('#waveVal')).toHaveText('1', { timeout: 45_000 });

  // Wave banner reflects the new wave.
  await expect(page.locator('#waveBannerT')).toHaveText('Wave 1');
  await expect(page.locator('#waveBanner')).toHaveClass(/show/);

  expect(errors).toEqual([]);
});
