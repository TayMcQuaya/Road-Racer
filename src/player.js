const Player = {
  x: 200,
  y: 500,
  width: 22,
  height: 38,

  vx: 0,
  maxSpeed: 280,
  accel: 1500,
  friction: 1200,

  forwardAccel: 380,
  forwardFriction: 220,

  bumpTimer: 0,
  bumpDuration: 1.5,
  bumpSpeed: 60,
  lastBumpCar: null,
  sameCarCooldown: 0.4,

  isBumped() {
    return this.bumpTimer > 0;
  },

  bumpFrom(carX, carRef) {
    if (this.isBumped()
        && carRef === this.lastBumpCar
        && this.bumpTimer > this.bumpDuration - this.sameCarCooldown) {
      return;
    }

    const dx = this.x - carX;
    const dir = dx === 0 ? (Math.random() < 0.5 ? -1 : 1) : Math.sign(dx);
    this.vx = dir * this.bumpSpeed;
    this.bumpTimer = this.bumpDuration;
    this.lastBumpCar = carRef || null;
  },

  update(dt, canvasW, canDrive) {
    if (!canDrive) {
      this.vx = 0;
      return;
    }

    if (this.bumpTimer > 0) {
      this.bumpTimer -= dt;

      this.x += this.vx * dt;

      const minXb = Road.edgeWidth + this.width / 2;
      const maxXb = canvasW - Road.edgeWidth - this.width / 2;
      if (this.x < minXb || this.x > maxXb) {
        Game.crash(this.x, this.y);
        return;
      }
      return;
    }

    let dir = 0;
    if (Input.isDown('ArrowLeft', 'KeyA')) dir -= 1;
    if (Input.isDown('ArrowRight', 'KeyD')) dir += 1;

    if (dir !== 0) {
      this.vx += dir * this.accel * dt;
    } else {
      const drop = this.friction * dt;
      if (Math.abs(this.vx) <= drop) this.vx = 0;
      else this.vx -= Math.sign(this.vx) * drop;
    }

    if (this.vx > this.maxSpeed) this.vx = this.maxSpeed;
    if (this.vx < -this.maxSpeed) this.vx = -this.maxSpeed;

    this.x += this.vx * dt;

    const minX = Road.edgeWidth + this.width / 2;
    const maxX = canvasW - Road.edgeWidth - this.width / 2;
    if (this.x < minX || this.x > maxX) {
      Game.crash(this.x, this.y);
      return;
    }

    if (Input.isDown('KeyX', 'KeyW', 'ArrowUp', 'Space') && Game.fuel > 0) {
      Road.speed += this.forwardAccel * dt;
    } else {
      Road.speed -= this.forwardFriction * dt;
    }
    if (Road.speed < 0) Road.speed = 0;
    if (Road.speed > Road.maxSpeed) Road.speed = Road.maxSpeed;
  },

  render(ctx) {
    if (this.bumpTimer > 0) {
      const progress = 1 - this.bumpTimer / this.bumpDuration;
      const dir = this.vx >= 0 ? 1 : -1;
      drawCarBumped(ctx, this.x, this.y, this.width, this.height, RED_PALETTE, progress, dir, true);
    } else {
      drawSportsCar(ctx, this.x, this.y, this.width, this.height, RED_PALETTE);
    }
  },
};

const RED_PALETTE = {
  kind: 'red',
  body: '#d63838',
  shade: '#9e1c1c',
  windshield: '#3a1414',
  headlight: '#ffeb3b',
  taillight: '#ff5252',
};

const BLUE_PALETTE = {
  kind: 'blue',
  body: '#3a7ad6',
  shade: '#1c4e9e',
  windshield: '#142a3a',
  headlight: '#ffeb3b',
  taillight: '#ff5252',
};

const GREEN_PALETTE = {
  kind: 'green',
  body: '#3aa83a',
  shade: '#1f6f1f',
  windshield: '#0e2a0e',
  headlight: '#ffeb3b',
  taillight: '#ff5252',
};

const YELLOW_PALETTE = {
  kind: 'yellow',
  body: '#e6b91f',
  shade: '#9c7a0c',
  windshield: '#3a2e08',
  headlight: '#fff5a0',
  taillight: '#ff5252',
};

const PICKUP_PALETTE = {
  kind: 'pickup',
  body: '#00e5ff',
  shade: '#006a7a',
  windshield: '#003138',
  headlight: '#ffffff',
  taillight: '#ffffff',
};

const RED_TRAFFIC_PALETTE = {
  kind: 'red',
  body: '#a82828',
  shade: '#651414',
  windshield: '#280808',
  headlight: '#ffeb3b',
  taillight: '#ff5252',
};

const WRECK_PALETTE = {
  body: '#9a5a28',
  shade: '#5a3416',
  windshield: '#1a1408',
  headlight: '#888',
  taillight: '#7a3030',
};

function drawCarBumped(ctx, cx, cy, w, h, palette, progress, dir, isSports) {
  const angle = progress * Math.PI * 2 * dir;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  if (isSports) drawSportsCar(ctx, 0, 0, w, h, palette);
  else drawCar(ctx, 0, 0, w, h, palette);
  ctx.restore();
}

function drawSportsCar(ctx, cx, cy, w, h, palette) {
  if (Sprites.draw(ctx, palette.kind, cx, cy, w, h)) return;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const noseR = w / 2;

  ctx.fillStyle = '#222';
  ctx.fillRect(x - 3, y + noseR + 1, 4, 9);
  ctx.fillRect(x + w - 1, y + noseR + 1, 4, 9);
  ctx.fillRect(x - 3, y + h - 14, 4, 9);
  ctx.fillRect(x + w - 1, y + h - 14, 4, 9);

  ctx.fillStyle = palette.body;
  ctx.fillRect(x, y + noseR, w, h - noseR);
  ctx.beginPath();
  ctx.arc(x + w / 2, y + noseR, noseR, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = palette.shade;
  ctx.fillRect(x + 3, y + noseR, w - 6, 2);
  ctx.fillRect(x - 1, y + h - 5, w + 2, 5);

  ctx.fillStyle = palette.windshield;
  ctx.beginPath();
  ctx.moveTo(x + 4, y + noseR + 4);
  ctx.lineTo(x + w - 4, y + noseR + 4);
  ctx.lineTo(x + w - 5, y + noseR + 13);
  ctx.lineTo(x + 5, y + noseR + 13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = palette.headlight;
  ctx.fillRect(x + 4, y + noseR - 4, 4, 3);
  ctx.fillRect(x + w - 8, y + noseR - 4, 4, 3);

  ctx.fillStyle = palette.taillight;
  ctx.fillRect(x + 2, y + h - 2, 6, 2);
  ctx.fillRect(x + w - 8, y + h - 2, 6, 2);
}

function drawCar(ctx, cx, cy, w, h, palette) {
  if (Sprites.draw(ctx, palette.kind, cx, cy, w, h)) return;
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);

  ctx.fillStyle = '#222';
  ctx.fillRect(x - 3, y + 5, 4, 10);
  ctx.fillRect(x + w - 1, y + 5, 4, 10);
  ctx.fillRect(x - 3, y + h - 15, 4, 10);
  ctx.fillRect(x + w - 1, y + h - 15, 4, 10);

  ctx.fillStyle = palette.body;
  ctx.fillRect(x, y, w, h);

  ctx.fillStyle = palette.shade;
  ctx.fillRect(x + 3, y + 3, w - 6, 3);
  ctx.fillRect(x + 3, y + h - 6, w - 6, 3);

  ctx.fillStyle = palette.windshield;
  ctx.fillRect(x + 4, y + 9, w - 8, 10);

  ctx.fillStyle = palette.headlight;
  ctx.fillRect(x + 3, y + 1, 5, 2);
  ctx.fillRect(x + w - 8, y + 1, 5, 2);

  ctx.fillStyle = palette.taillight;
  ctx.fillRect(x + 3, y + h - 3, 5, 2);
  ctx.fillRect(x + w - 8, y + h - 3, 5, 2);
}
