# lenora · a calm tower defense

A gentle, dependency-free tower-defense game built with vanilla JavaScript and a single
HTML5 canvas. No build step — open `index.html` in a browser and play.

## Quick start

```bash
# open directly
open index.html
# or serve locally
python3 -m http.server 8000   # then visit http://localhost:8000
```

## Controls

| Input | Action |
|-------|--------|
| `W A S D` / arrows | Move your gatherer |
| `1 · 2 · 3` | Choose a unit (Sprout / Cinder / Bramble) |
| `B` or `Space` | Toggle build mode |
| Click / tap land | Place the selected tower |
| `P` / `Esc` | Pause |

Touch devices get a virtual joystick plus a recruit-card column.

> Design details (tower/enemy stats, waves, economy) live in
> [`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md).

## Project structure

| File | Responsibility |
|------|----------------|
| `index.html` | Canvas, HUD, styles |
| `js/main.js` | Game state, controllers, main loop |
| `js/entities.js` | Entities / units / projectiles |
| `js/towers.js` | Tower definitions & behavior |
| `js/enemies.js` | Enemy waves |
| `js/world.js` | World / map logic |
| `js/config.js` | Tuning constants |
| `js/ui.js` | HUD / UI wiring |
| `js/audio.js` | Sound |
| `js/bars.js` | Bars / meters |
| `docs/GAME_DESIGN.md` | Design doc: loop, controls, stats, waves |

## Development workflow

Everything is **issue-driven** and lands via **pull requests** into `main` (protected:
requires review + passing CI).

1. An issue is created for each piece of work (labels: `bug`, `feature`,
   `improvement`, `critique`, `test`; grouped into milestones).
2. Work happens on a short-lived branch; a PR references the issue (`Fixes #N`).
3. CI runs a JS syntax gate (`node --check`) on every PR.
4. On merge, GitHub closes the linked issue automatically.

Agent orchestration (Orca) drives this loop: a *tester* finds bugs, a *feature
reviewer* proposes improvements, a *critic* synthesizes prioritized feedback, and a
*fixer* implements it — each step as an issue → branch → PR.

## Milestones

| Milestone | Focus |
|-----------|-------|
| `v0.1-alpha` | Get the core solid (fix bugs) |
| `v0.2-beta` | Ship new features from reviews |
| `v0.3-rc` | Polish & tuning |
