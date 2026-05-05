const Pickups = {
  items: [],
  spawnTimer: 0,
  nextSpawnIn: 25,

  init() {
    this.items = [];
    this.spawnTimer = 0;
    this.nextSpawnIn = 13 + Math.random() * 12;
  },

  update(dt) {
    if (Game.phase !== 'racing') return;

    if (Road.speed > 0) {
      this.spawnTimer += dt;
    }
    if (this.spawnTimer >= this.nextSpawnIn) {
      this.spawnTimer = 0;
      this.nextSpawnIn = 13 + Math.random() * 12;
      this.spawn();
    }

    for (const it of this.items) {
      it.worldY += it.worldSpeed * dt;
    }

    this.items = this.items.filter((it) => {
      const ahead = it.worldY - Road.scrollY;
      return ahead > -100 && ahead < 1500;
    });

    if (!Player.isBumped()) {
      const halfW = (Player.width + 22) / 2 - 2;
      const halfH = (Player.height + 38) / 2 - 2;
      for (let i = this.items.length - 1; i >= 0; i--) {
        const it = this.items[i];
        const off = Road.computeOffset(it.worldY);
        const screenX = it.x + off;
        const screenY = PLAYER_SCREEN_Y - (it.worldY - Road.scrollY);
        if (Math.abs(Player.x - screenX) < halfW && Math.abs(Player.y - screenY) < halfH) {
          Game.bonusScore += 1000;
          Game.fuel = Math.min(Game.maxFuel, Game.fuel + 25);
          Game.addFloatText('1000', screenX, screenY - 10, '#ffffff');
          Sound.pickup();
          this.items.splice(i, 1);
        }
      }
    }
  },

  spawn() {
    const lanes = [145, 200, 255];
    const x = lanes[Math.floor(Math.random() * lanes.length)];
    this.items.push({
      x,
      worldY: Road.scrollY + 800,
      worldSpeed: 280,
    });
  },

  render(ctx) {
    for (const it of this.items) {
      const off = Road.computeOffset(it.worldY);
      const screenY = PLAYER_SCREEN_Y - (it.worldY - Road.scrollY);
      drawPickup(ctx, it.x + off, screenY);
    }
  },
};

function drawPickup(ctx, cx, cy) {
  const t = state.time;
  const blinkOn = Math.floor(t * 5) % 2 === 0;

  ctx.save();
  ctx.globalAlpha = blinkOn ? 1.0 : 0.3;
  drawTriColorCar(ctx, cx, cy, 22, 38);
  ctx.restore();

  const sparkleAlpha = 0.5 + 0.5 * Math.sin(t * 9);
  ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha})`;
  const sx = cx + Math.cos(t * 2.5) * 18;
  const sy = cy + Math.sin(t * 2.5) * 24;
  ctx.fillRect(sx - 1, sy - 1, 3, 3);

  const sx2 = cx + Math.cos(t * 2.5 + Math.PI) * 14;
  const sy2 = cy + Math.sin(t * 2.5 + Math.PI) * 20;
  ctx.fillStyle = `rgba(255,255,255,${sparkleAlpha})`;
  ctx.fillRect(sx2 - 1, sy2 - 1, 2, 2);
}

function drawTriColorCar(ctx, cx, cy, w, h) {
  const x = Math.round(cx - w / 2);
  const y = Math.round(cy - h / 2);
  const noseR = w / 2;

  const bodyTop = y + noseR;
  const bodyBot = y + h;
  const split = bodyTop + Math.round((bodyBot - bodyTop) / 2);

  ctx.fillStyle = '#3a7ad6';
  ctx.fillRect(x, split, w, bodyBot - split);

  ctx.fillStyle = '#d63838';
  ctx.fillRect(x, bodyTop, w, split - bodyTop);

  ctx.fillStyle = '#3a7ad6';
  ctx.beginPath();
  ctx.arc(x + w / 2, y + noseR, noseR, Math.PI, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + 2, split - 1, w - 4, 1);
  ctx.fillRect(x + 2, bodyTop, w - 4, 1);

  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.moveTo(x + 4, y + noseR + 4);
  ctx.lineTo(x + w - 4, y + noseR + 4);
  ctx.lineTo(x + w - 5, y + noseR + 13);
  ctx.lineTo(x + 5, y + noseR + 13);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffeb3b';
  ctx.fillRect(x + 4, y + noseR - 4, 4, 3);
  ctx.fillRect(x + w - 8, y + noseR - 4, 4, 3);

  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 2, y + h - 2, 6, 2);
  ctx.fillRect(x + w - 8, y + h - 2, 6, 2);
}
