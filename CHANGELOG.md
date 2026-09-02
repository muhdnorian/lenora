# Changelog

All notable changes to **lenora** are documented here.

The format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

Summarizes the initial game import plus repo tooling that have landed on `main`.

### Added

- **Core game** (`af8304f` — initial import of the game engine):
  - Calm, dependency-free tower defense rendered with Three.js on a single HTML5 canvas.
  - **Gatherer** player character that roams a circular valley gathering resource crystals.
  - **Core** structure at the center to defend; game over when its HP reaches 0.
  - Three defensive **towers**: Sprout (cheap single-target), Cinder (AoE splash),
    Bramble (tanky close-range sentry) — auto-target nearest enemy, homing projectiles.
  - Three **enemy** types — Drifter, Racer (fast, frail), Tank (slow, tough) — with
    wave-scaled HP/speed/damage and a growing unit mix as waves progress.
  - **Wave system**: sequential spawning, calm breathers between waves, escalating difficulty.
  - Resource **gathering**, grid-snapped tower **placement** with preview ghost, floating
    health bars, ambient puffs/particles, and a soft pentatonic **WebAudio** soundtrack.
  - Keyboard + mouse + touch (virtual joystick and recruit cards) controls, pause, score.
- **CI workflow** (`8eb4300`): PR/`main` GitHub Actions job running `node --check` on every
  `js/*.js` module.
- **README** (`8eb4300`): project overview, run instructions, module map, dev workflow, milestones.
- **CI refinement** (`dc422f6`): ignore external CDN references in the local-resolve check so the
  Three.js CDN script tag doesn't fail the gate.
- **Docs** (`docs/GAME_DESIGN.md`): design doc covering core loop, controls, stats tables, and
  wave/economy rules.

## [0.0.1] - Initial import

- Seed commit baseline (`7361ebb`): project scaffold and import of the lenora game.

<!-- Template:
## [Unreleased]
### Added / Changed / Deprecated / Removed / Fixed / Security
-->
