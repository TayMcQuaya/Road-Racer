const Hazards = {
  manholes: [],
  spawnTimer: 0,
  nextSpawnIn: 10,
  manholeR: 14,

  init() {
    this.manholes = [];
    this.spawnTimer = 0;
    this.nextSpawnIn = 30 + Math.random() * 20;
  },

  update(dt) {
    if (Game.phase !== 'racing') return;

    if (Road.speed > 0) {
      this.spawnTimer += dt;
    }
    if (this.spawnTimer >= this.nextSpawnIn) {
      this.spawnTimer = 0;
      this.nextSpawnIn = 30 + Math.random() * 20;
      this.spawn();
    }

    this.manholes = this.manholes.filter((m) => {
      const ahead = m.worldY - Road.scrollY;
      return ahead > -100 && ahead < 1500;
    });

    if (!Player.isBumped()) {
      for (const m of this.manholes) {
        const screenY = PLAYER_SCREEN_Y - (m.worldY - Road.scrollY);
        const dx = Math.abs(Player.x - m.x);
        const dy = Math.abs(Player.y - screenY);
        if (dx < Player.width / 2 + m.r - 4 && dy < Player.height / 2 + m.r - 4) {
          Player.bumpFrom(Player.x, m);
          break;
        }
      }
    }
  },

  spawn() {
    const W = ctx.canvas.width;
    const minX = Road.edgeWidth + this.manholeR + 6;
    const maxX = W - Road.edgeWidth - this.manholeR - 6;
    const x = minX + Math.random() * (maxX - minX);

    this.manholes.push({
      x,
      worldY: Road.scrollY + 800,
      r: this.manholeR,
    });
  },

  render(ctx) {
    for (const m of this.manholes) {
      const screenY = PLAYER_SCREEN_Y - (m.worldY - Road.scrollY);
      drawManhole(ctx, m.x, screenY, m.r);
    }
  },
};

function drawManhole(ctx, x, y, r) {
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(x, y, r + 3, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(x - 2, y - 2, r * 0.5, 0, 2 * Math.PI);
  ctx.fill();
}
