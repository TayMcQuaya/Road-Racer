# Road Fighter

A web-based arcade racing game built with vanilla JavaScript and HTML5 Canvas.

## Inspiration

This project is a love letter to **Konami's Road Fighter** (1984) — the classic top-down arcade racer that later landed on the NES. The original game gave you a single car, a long stretch of highway, traffic to dodge, and one cardinal rule: don't hit the wall, don't crash into the cars, and watch your fuel.

I wanted to rebuild that experience in a modern web browser — sticking close to the spirit of the original while implementing every system from scratch: the scrolling road, the 8-bit-style HUD, the spin-out physics on contact, the fuel pressure, the finish-line checkered stripe. No frameworks, no game engine, no asset packs. Just a `<canvas>` element and a few JavaScript files.

## How to play

1. Open `index.html` in a modern browser (Chrome, Firefox, Edge, Safari)
2. Watch the countdown (3 → 2 → 1 → GO!) — blue cars line up in front of you and rocket off the start
3. Hold the gas to accelerate, steer to dodge traffic, grab fuel pickups, race to the finish line

### Controls

| Action | Keys |
|---|---|
| Steer left / right | **A** / **D** or **←** / **→** |
| Accelerate | **X**, **W**, **↑**, or **Space** |
| Pause / Resume | **Esc** |
| Restart (game over / stage clear) | **Space** |

## Features

### Driving feel
- Free-steering arcade physics with momentum and friction
- Speed shown in km/h (0–400 display range, tuned for arcade feel)
- World scrolls relative to your speed; you stay fixed at the bottom of the screen

### Traffic
Three behaviors of opponent cars, each with distinct AI:
- **Yellow** — slow, holds straight, predictable obstacles
- **Blue** — gentle sine-wave wobble within their lane
- **Red** — locks onto your lateral position and commits to one direction (rare aggressive cars)

Cars spawn in random configurations (1–3 per group) across 7 possible road positions including over the lane divider. Faster cars catching up to slower ones automatically slow to match — natural convoy behavior.

### Crash physics
- **Side-swipe a car** → spin out for 1.5 seconds, glide sideways at 60 px/s, no steering control. Forward speed unaffected. Both cars bounce in opposite directions.
- **Hit a wall** → explosion with 32 colored debris particles, respawn at center of road, fuel penalty of −5
- **Bumped car hits another car or wall** → both explode (chain reactions possible)
- **Re-bump from new car during spin-out** → resets the timer in a fresh direction (frantic chains in dense traffic)

### Hazards
- **Empty manholes** — appear rarely (every 30–50 sec of driving), bump you in a random direction on contact
- **Fuel pickups** — tri-color cars (red middle, blue front and back) that blink and have orbiting sparkles. Grant +25 fuel and +1000 score.

### Resource management
- **Fuel** drains at 2 units/sec — start with 100, max 100
- **No fuel** → can't accelerate, coast to a halt, GAME OVER
- **Difficulty curve** — sustained high-speed driving raises spawn rate and group sizes; slowing down lets the world calm

### Scoring
- Continuous distance score (1 point per 10 world units)
- **Pickup bonus**: +1000
- **Near-miss bonus**: +100 yellow, +200 blue, +300 red — earned by passing close to a car without colliding

### Race structure
- Finite **90,000-unit** track with a checkered finish line stripe
- Visual **progress map** on the left HUD: green flag (start), red flag (finish), your car icon sliding up the road
- Cross the line → abrupt halt, brief pause, your car launches off the top of the screen
- "STAGE CLEAR" with final score and SPACE to restart

### HUD
Two side panels framing the play area:
- **Left**: vertical track map showing your progress with proper pole-and-pennant flags
- **Right**: 9-digit score, speedometer, fuel (turns blue under 15), and live keyboard reference

## Running locally

No build step, no dependencies. Just clone or download and open `index.html`.

```bash
# Optional: serve via a local web server (only needed if you re-enable the SVG sprites)
python -m http.server 8000
# Then open http://localhost:8000
```

## Project structure

```
RoadFighter/
├── index.html            # Entry point — canvas + HUD elements
├── style.css             # Page + HUD styling
├── README.md             # This file
├── assets/
│   └── cars.svg          # Optional sprite sheet (toggleable in code)
└── src/
    ├── main.js           # Game loop, init, HUD updates
    ├── input.js          # Keyboard state tracker (with justPressed)
    ├── road.js           # Road scrolling, decorations, finish line, dashes
    ├── player.js         # Player car physics, steering, accelerate, crash trigger
    ├── traffic.js        # Enemy car spawning, AI, collisions, near-miss
    ├── hazards.js        # Manhole spawning + collision
    ├── pickups.js        # Fuel pickups + tri-color sprite
    └── game.js           # Game state machine, phases, score, fuel, overlays
```

## Technical notes

### Architecture
The game uses a simple state machine in `Game.phase`:
- `countdown` → `launch` → `racing` → (`crashing`, `finishing`, `gameover`) → restart

Each system (Road, Player, Traffic, Hazards, Pickups, Game) has `update(dt)` and `render(ctx)` methods called from a single `requestAnimationFrame` loop in `main.js`. World coordinates (`worldY`) decouple game logic from screen position — every entity stores a `worldY` and is rendered relative to `Road.scrollY`.

### Why no framework?
Vanilla JS Canvas keeps the codebase tiny (~1000 lines total) and fast. Every behavior — collision detection, particle systems, sprite drawing, HUD updates — is hand-rolled. This was the right call for a 2D arcade game with custom feel requirements; a framework would have added overhead without unlocking any capability we actually needed.

### Tunables (DevTools console)
Most game values are exposed as object properties:
```js
Road.maxSpeed = 1000           // top scroll speed
Player.bumpDuration = 2.0      // longer spin-out
Game.fuelDrainRate = 1         // halve fuel pressure
Game.raceLength = 30000        // shorter race
Sprites.enabled = true         // switch to SVG cars
```

## Credits

- Original design inspiration: **Road Fighter** by Konami (1984)
- Everything else: built from scratch as a learning exercise and homage
