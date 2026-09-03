# lenora — Game Design Document

> A calm, dependency-free tower-defense game built with vanilla JavaScript and a single
> HTML5 canvas. No build step: open `index.html` in a browser and play.
> All tunable constants live in `js/config.js` (`LEN.CFG`).

## Core loop

1. **Gather.** Move the gatherer (the cute blob) near resource crystals to collect
   resources (`gather.radius 7.5`, `rate 20`/s). Crystals hold up to
   `crystal.capacity 42` each; a drained crystal teleports to a new spot and refills.
2. **Build.** Spend resources to "recruit" defensive towers that auto-target enemies in
   range. You are a hill-defender: enemies always march on the **core** at the origin.
3. **Defend.** Enemy waves spawn from the world edge and move toward the core. Towers shoot
   them; any enemy that reaches the core leaks damage.
4. **Survive / score.** Surviving waves grows their size and difficulty. Kills add score.
   Lose when core HP (`lives`) reaches 0.

**Win condition:** there is no explicit win — survive as many waves as possible and chase a
high score. **Loss:** `lives` (`baseHP 100`) drops to 0.

## World

- Map is a large circular plane centered on the origin (`world` half-extent = 90).
- The **core** sits at (0, 0) at the center of a soft deco ring; it is the enemy
  objective. Player spawns just south of it.
- **Grid:** building placement snaps to cells of `grid 7`. Cells within ~14 units of the
  origin are kept clear for the core, and cells occupied by a tower or a crystal are
  unbuildable.
- **Camera:** a fixed offset follow-cam trails the player from above.
- **Environment:** 46 low-poly decorative trees; fog; soft shadows.

## Controls

| Input | Action |
|-------|--------|
| `W` / `A` / `S` / `D` (or arrows) | Move the gatherer |
| `1` / `2` / `3` | Select Sprout / Cinder / Bramble |
| `B` or `Space` (or click **Recruit**) | Toggle build ("recruit") mode |
| Click / tap on ground | Place the selected tower on the hovered cell |
| `P` or `Esc` | Pause / resume |
| Touch (joystick + recruit cards) | Same controls on mobile |

A ghost marker shows the placement preview (green if valid + affordable, red otherwise).

## Towers

Towers are damageable units that also take contact damage from enemies. Auto-target the
*nearest* enemy in range and fire a homing projectile (see `js/config.js` → `CFG.towers`).

| Tower | Role | Cost | Range | Damage | Fire rate (s) | AoE | Proj. speed | HP |
|-------|------|------|-------|--------|---------------|-----|-------------|-----|
| **Sprout** | cheap single-target | 30 | 24 | 13 | 0.75 | 0 | 30 | 70 |
| **Cinder** | AoE splash | 60 | 17 | 30 | 1.5 | 8 | 22 | 85 |
| **Bramble** | tank / tanky sentry | 45 | 10 | 26 | 0.9 | 0 | 26 | 170 |

- **Sprout** — slender guardian, fast-firing cheap DPS. (Shown as **"Pulse"** in the
  build-bar HTML on some screens; see issue #4 — being unified to *Sprout*.)
- **Cinder** — round firing golem whose shots damage **all** enemies within its `aoe` radius.
- **Bramble** — tall spiky sentry; highest HP, shortest range.

## Enemies

Three creeps share a body blueprint, scaled by per-type multipliers (`js/enemies.js` → `TYPES`).

| Type | Size (r) | HP × | Speed × | Damage × | Unlocks |
|------|----------|------|---------|---------|---------|
| **Drifter** | 0.90 | 1.00 | 1.00 | 1.00 | wave 1 |
| **Racer**  | 0.55 | 0.45 | 2.00 | 0.60 | wave 2 |
| **Wisp**   | 0.60 | 0.62 | 2.60 | 0.90 | wave 3 | fast rusher — slips past weak walls |
| **Tank**   | 1.40 | 3.20 | 0.50 | 2.60 | wave 4 |
| **Bastion**| 1.55 | 3.90 | 0.42 | 2.20 | wave 5 | **armor** pool absorbs damage before HP |

Encounter mix ramps with wave number (racer and tank weights grow, plus wisp from
wave 3 and bastion from wave 5). Armored bastions show a gold armor bar and absorb
hits until it breaks — forcing enough sustained damage.

**Base stats** scale with wave `W` (`js/config.js` → `CFG.wave`):
- HP = `(hpBase + W · hpPerWave) · type.hpMul` = `(16 + 9W) · hpMul`
- Move speed = `2.3 · type.speedMul · rand(0.9, 1.1)`
- Core damage on leak = `dmgBase + W · dmgPerWave` = `8 + 1.4W`
  (see issue #2: this leak value currently ignores `type.dmgMul`).
- Enemies deal **contact damage** of `7 · dmgMul` to adjacent towers.

## Waves & economy

- **Starting resources:** 90. **Cap:** `RES_MAX = 240`.
- **Wave size:** `⌊countBase + W · countPerWave⌋` = `⌊5 + 2.0W⌋` enemies,
  spawned every `spawnInterval 0.62` s.
- **Surge waves:** every `surgeEvery 4`th wave is a denser, faster-cadence rush
  (`surgeCountMul 1.45`, `surgeSpawnInterval 0.4` s) that breaks a passive wall.
- **Leak damage** grows at `dmgPerWave 1.4` — a broken ring genuinely threatens the core.
- **Between waves:** after the field is cleared, a `calm 8` s breather before the next
  wave.
- **Money/sinks:** starting budget 90 buys one Cinder or Sprout+Bramble etc.; income comes
  only from gathering crystals. Turret placement has no ongoing upkeep. (No sell/refund yet —
  feature #14.)
- **Scoring:** kill value `round(12 · type.hpMul) + ⌊maxHp · 0.3⌋`.

## Module map

| File | Responsibility |
|------|----------------|
| `js/config.js` | Tuning constants (`LEN.CFG`) |
| `js/main.js` | State, controllers, main loop, wave sequencing |
| `js/world.js` | Renderer, scene, lights, ground, scenery |
| `js/entities.js` | Player gatherer, core, resource crystals |
| `js/towers.js` | Tower defs, placement, projectiles, build ghost |
| `js/enemies.js` | Enemy types, spawn, damage, contact rules |
| `js/audio.js` | WebAudio ambient pad + UI blips |
| `js/ui.js` | HUD, build bar, banners, game-flow buttons |
| `js/bars.js` | Canvas-based health bars |
