const TRAFFIC_TYPES = [
  { kind: 'yellow', palette: YELLOW_PALETTE,       weight: 60 },
  { kind: 'blue',   palette: BLUE_PALETTE,         weight: 30 },
  { kind: 'red',    palette: RED_TRAFFIC_PALETTE,  weight: 10 },
];

const MAX_CARS = 5;

const Traffic = {
  cars: [],
  spawnTimer: 0,
  nextSpawnIn: 2.0,

  carWidth: 22,
  carHeight: 38,

  init() {
    this.cars = [];
    this.spawnTimer = 0;
    this.nextSpawnIn = 2.0;
  },

  update(dt) {
    if (Game.phase !== 'racing' && Game.phase !== 'finishing') return;
    const isRacing = Game.phase === 'racing';

    const d = Game.difficulty;

    if (isRacing) {
      if (Road.speed > 0) {
        this.spawnTimer += dt;
      }
      if (this.spawnTimer >= this.nextSpawnIn) {
        this.spawnTimer = 0;
        const minI = lerp(1.5, 0.55, d);
        const maxI = lerp(2.8, 1.2, d);
        this.nextSpawnIn = minI + Math.random() * (maxI - minI);

        if (this.cars.length < MAX_CARS) {
          this.spawnGroup(d);
        }
      }
    }

    const W = ctx.canvas.width;
    const minX = Road.edgeWidth + this.carWidth / 2;
    const maxX = W - Road.edgeWidth - this.carWidth / 2;

    for (const car of this.cars) {
      car.worldY += car.worldSpeed * dt;

      if (car.bumpTimer > 0) {
        car.bumpTimer -= dt;
        car.x += car.bumpVx * dt;
        continue;
      }

      if (car.kind === 'blue') {
        car.x = car.baseX + Math.sin(state.time * 2.2 + car.phase) * 16;
      } else if (car.kind === 'red') {
        const dy = car.worldY - Road.scrollY;
        if (dy > 50 && dy < 280) {
          if (car.chaseDir === 0) {
            const playerLogical = Player.x - Road.offsetX;
            const dx = playerLogical - car.x;
            car.chaseDir = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
          }
          car.x += car.chaseDir * 90 * dt;
        }
      }

      if (car.x < minX) car.x = minX;
      if (car.x > maxX) car.x = maxX;
    }

    for (const car of this.cars) {
      if (car.bumpTimer > 0 && (car.x <= minX || car.x >= maxX)) {
        const screenY = PLAYER_SCREEN_Y - (car.worldY - Road.scrollY);
        Game.spawnExplosion(car.x, screenY);
        car.dead = true;
      }
    }
    this.cars = this.cars.filter((c) => !c.dead);

    this.resolveCarOverlaps();

    for (let i = 0; i < this.cars.length; i++) {
      for (let j = i + 1; j < this.cars.length; j++) {
        const a = this.cars[i];
        const b = this.cars[j];
        if (a.bumpTimer <= 0 && b.bumpTimer <= 0) continue;
        const dx = Math.abs(a.x - b.x);
        const dy = Math.abs(a.worldY - b.worldY);
        if (dx < 22 && dy < 32) {
          const aY = PLAYER_SCREEN_Y - (a.worldY - Road.scrollY);
          const bY = PLAYER_SCREEN_Y - (b.worldY - Road.scrollY);
          Game.spawnExplosion(a.x, aY);
          Game.spawnExplosion(b.x, bY);
          a.dead = true;
          b.dead = true;
        }
      }
    }
    this.cars = this.cars.filter((c) => !c.dead);

    this.cars = this.cars.filter((c) => {
      const ahead = c.worldY - Road.scrollY;
      return ahead > -200 && ahead < 1500;
    });

    if (isRacing) {
      const halfW = (Player.width + this.carWidth) / 2 - 4;
      const halfH = (Player.height + this.carHeight) / 2 - 4;
      for (const car of this.cars) {
        const off = Road.computeOffset(car.worldY);
        const screenX = car.x + off;
        const screenY = PLAYER_SCREEN_Y - (car.worldY - Road.scrollY);
        if (Math.abs(Player.x - screenX) < halfW && Math.abs(Player.y - screenY) < halfH) {
          const wasBumped = Player.isBumped();
          Player.bumpFrom(screenX, car);
          if (Player.lastBumpCar === car && (!wasBumped || car.bumpTimer <= 0)) {
            let dir = -Math.sign(Player.x - screenX);
            if (dir === 0) dir = Math.random() < 0.5 ? -1 : 1;
            car.bumpVx = dir * 60;
            car.bumpTimer = 1.5;
          }
          break;
        }
      }

      for (const car of this.cars) {
        if (car.nearMissCounted) continue;
        const ahead = car.worldY - Road.scrollY;
        if (ahead > 0) continue;
        car.nearMissCounted = true;
        if (car.bumpTimer > 0) continue;
        const off = Road.computeOffset(car.worldY);
        const screenX = car.x + off;
        const dx = Math.abs(Player.x - screenX);
        if (dx <= halfW || dx > halfW + 20) continue;
        let bonus = 100;
        if (car.kind === 'blue') bonus = 200;
        else if (car.kind === 'red') bonus = 300;
        Game.bonusScore += bonus;
        Game.addFloatText(`${bonus}`, Player.x, Player.y - 30, '#ffffff');
        Sound.whoosh();
      }
    }
  },

  spawnGroup(d) {
    const r = Math.random();
    let count;
    if (r < lerp(0.85, 0.40, d)) count = 1;
    else if (r < lerp(1.0, 0.80, d)) count = 2;
    else count = 3;

    count = Math.min(count, MAX_CARS - this.cars.length);
    if (count <= 0) return;

    const xPositions = [120, 145, 175, 200, 225, 255, 280];
    const yOffsets = [700, 800, 900];

    const slots = [];
    for (const yOff of yOffsets) {
      for (const xp of xPositions) {
        slots.push({ x: xp, worldY: Road.scrollY + yOff });
      }
    }

    for (let i = slots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [slots[i], slots[j]] = [slots[j], slots[i]];
    }

    let spawned = 0;
    for (const slot of slots) {
      if (spawned >= count) break;
      if (this.overlapsExisting(slot.x, slot.worldY)) continue;
      this.spawnOne(slot.x, slot.worldY);
      spawned++;
    }
  },

  resolveCarOverlaps() {
    const cars = this.cars;
    for (let i = 0; i < cars.length; i++) {
      for (let j = i + 1; j < cars.length; j++) {
        const a = cars[i];
        const b = cars[j];
        if (a.bumpTimer > 0 || b.bumpTimer > 0) continue;
        if (Math.abs(a.x - b.x) >= 28) continue;
        const dy = a.worldY - b.worldY;
        if (Math.abs(dy) >= 42) continue;

        if (dy > 0) {
          b.worldY = a.worldY - 42;
          if (b.worldSpeed > a.worldSpeed) b.worldSpeed = a.worldSpeed;
        } else {
          a.worldY = b.worldY - 42;
          if (a.worldSpeed > b.worldSpeed) a.worldSpeed = b.worldSpeed;
        }
      }
    }
  },

  overlapsExisting(x, worldY) {
    return this.cars.some((c) => {
      const dx = Math.abs(c.baseX - x);
      const dy = Math.abs(c.worldY - worldY);
      return dx < 36 && dy < 80;
    });
  },

  spawnOne(x, worldY) {
    const type = pickTrafficType();
    let worldSpeed;
    if (type.kind === 'yellow') {
      worldSpeed = 170;
    } else if (type.kind === 'blue') {
      worldSpeed = 100 + Math.random() * 140;
    } else {
      worldSpeed = 140 + Math.random() * 100;
    }

    this.cars.push({
      kind: type.kind,
      x,
      baseX: x,
      worldY,
      worldSpeed,
      palette: type.palette,
      phase: Math.random() * Math.PI * 2,
      bumpVx: 0,
      bumpTimer: 0,
      nearMissCounted: false,
      chaseDir: 0,
    });
  },

  render(ctx) {
    for (const car of this.cars) {
      const off = Road.computeOffset(car.worldY);
      const screenX = car.x + off;
      const screenY = PLAYER_SCREEN_Y - (car.worldY - Road.scrollY);
      if (car.bumpTimer > 0) {
        const progress = 1 - car.bumpTimer / 1.5;
        const dir = car.bumpVx >= 0 ? 1 : -1;
        drawCarBumped(ctx, screenX, screenY, this.carWidth, this.carHeight, car.palette, progress, dir, false);
      } else {
        drawCar(ctx, screenX, screenY, this.carWidth, this.carHeight, car.palette);
      }
    }
  },
};

function pickTrafficType() {
  const total = TRAFFIC_TYPES.reduce((s, t) => s + t.weight, 0);
  let r = Math.random() * total;
  for (const t of TRAFFIC_TYPES) {
    r -= t.weight;
    if (r <= 0) return t;
  }
  return TRAFFIC_TYPES[0];
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}
