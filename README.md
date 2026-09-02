# lenora · a calm tower defense

A gentle, dependency-free tower-defense game built with vanilla JavaScript and a single
HTML5 canvas. No build step — open `index.html` in a browser and play.

## Run it

```bash
# open directly
open index.html
# or serve locally
python3 -m http.server 8000   # then visit http://localhost:8000
```

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
