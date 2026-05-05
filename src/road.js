const PLAYER_SCREEN_Y = 500;
const NO_DASH_UNTIL_WORLD_Y = 600;
const START_TEXT_WORLD_Y = 420;

const Road = {
  scrollY: 0,
  speed: 0,
  maxSpeed: 750,
  displayMax: 400,

  edgeWidth: 90,
  laneCount: 2,

  update(dt) {
    this.scrollY += this.speed * dt;
  },

  render(ctx) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const roadX = this.edgeWidth;
    const roadW = W - this.edgeWidth * 2;
    const laneW = roadW / this.laneCount;

    ctx.fillStyle = '#258a3a';
    ctx.fillRect(0, 0, this.edgeWidth, H);
    ctx.fillRect(W - this.edgeWidth, 0, this.edgeWidth, H);

    ctx.fillStyle = '#4a4a4a';
    ctx.fillRect(roadX, 0, roadW, H);

    drawDecorations(ctx, this.scrollY, this.edgeWidth, W, H);

    const dashH = 40;
    const dashGap = 60;
    const segment = dashH + dashGap;
    const offset = this.scrollY % segment;

    ctx.fillStyle = '#fff';
    for (let i = 1; i < this.laneCount; i++) {
      const x = roadX + i * laneW - 3;
      for (let y = -segment + offset; y < H; y += segment) {
        const worldY = this.scrollY + (PLAYER_SCREEN_Y - y);
        if (worldY < NO_DASH_UNTIL_WORLD_Y) continue;
        ctx.fillRect(x, y, 6, dashH);
      }
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(roadX - 2, 0, 2, H);
    ctx.fillRect(roadX + roadW, 0, 2, H);

    const plankH = 34;
    const plankSeg = plankH;
    const plankOffset = this.scrollY % plankSeg;
    for (let y = -plankSeg + plankOffset; y < H; y += plankSeg) {
      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(roadX - 9, y, 7, plankH);
      ctx.fillRect(roadX + roadW + 2, y, 7, plankH);

      ctx.fillStyle = '#7d7d7d';
      ctx.fillRect(roadX - 9, y + plankH - 2, 7, 2);
      ctx.fillRect(roadX + roadW + 2, y + plankH - 2, 7, 2);
    }

    const startScreenY = PLAYER_SCREEN_Y - (START_TEXT_WORLD_Y - this.scrollY);
    if (startScreenY > -40 && startScreenY < H + 40) {
      ctx.save();
      ctx.fillStyle = '#ffd84a';
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineWidth = 3;
      ctx.font = 'bold 38px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText('START', W / 2, startScreenY);
      ctx.fillText('START', W / 2, startScreenY);
      ctx.restore();
    }

    if (typeof Game !== 'undefined' && Game.raceLength) {
      const finishScreenY = PLAYER_SCREEN_Y - (Game.raceLength - this.scrollY);
      if (finishScreenY > -40 && finishScreenY < H + 40) {
        const checkerSize = 11;
        const stripeH = 22;
        const numChecks = Math.ceil(roadW / checkerSize);
        for (let row = 0; row < 2; row++) {
          for (let i = 0; i < numChecks; i++) {
            ctx.fillStyle = ((i + row) % 2 === 0) ? '#fff' : '#000';
            ctx.fillRect(roadX + i * checkerSize, finishScreenY - stripeH / 2 + row * (stripeH / 2), checkerSize, stripeH / 2);
          }
        }
      }
    }
  },
};

const DECO_PATTERN = [
  { left: 'tree',   right: 'flower' },
  { left: 'flower', right: 'tree'   },
  { left: 'tree',   right: 'tree'   },
  { left: 'flower', right: 'flower' },
  { left: 'tree',   right: 'flower' },
  { left: 'none',   right: 'tree'   },
  { left: 'tree',   right: 'none'   },
  { left: 'flower', right: 'flower' },
];

const DECO_SPACING = 90;

function drawDecorations(ctx, scrollY, edgeWidth, W, H) {
  const offset = scrollY % DECO_SPACING;
  const baseIndex = Math.floor(scrollY / DECO_SPACING);

  for (let y = -DECO_SPACING + offset, i = 0; y < H + DECO_SPACING; y += DECO_SPACING, i++) {
    const patternIdx = ((baseIndex - i - 1) % DECO_PATTERN.length + DECO_PATTERN.length) % DECO_PATTERN.length;
    const slot = DECO_PATTERN[patternIdx];

    const leftX = edgeWidth / 2;
    const rightX = W - edgeWidth / 2;

    drawDeco(ctx, slot.left, leftX, y);
    drawDeco(ctx, slot.right, rightX, y);
  }
}

function drawDeco(ctx, kind, x, y) {
  if (kind === 'tree') drawTree(ctx, x, y);
  else if (kind === 'flower') drawFlower(ctx, x, y);
}

function drawTree(ctx, x, y) {
  ctx.fillStyle = '#5a3820';
  ctx.fillRect(x - 3, y, 6, 14);

  ctx.fillStyle = '#164a1c';
  ctx.beginPath();
  ctx.arc(x, y - 2, 14, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#2a7a36';
  ctx.beginPath();
  ctx.arc(x - 4, y - 6, 6, 0, Math.PI * 2);
  ctx.fill();
}

function drawFlower(ctx, x, y) {
  ctx.fillStyle = '#1a5a25';
  ctx.fillRect(x - 1, y - 2, 2, 10);

  ctx.fillStyle = '#ffd84a';
  ctx.beginPath();
  ctx.arc(x - 4, y - 4, 3, 0, Math.PI * 2);
  ctx.arc(x + 4, y - 4, 3, 0, Math.PI * 2);
  ctx.arc(x, y - 7, 3, 0, Math.PI * 2);
  ctx.arc(x, y, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#e63636';
  ctx.beginPath();
  ctx.arc(x, y - 4, 2, 0, Math.PI * 2);
  ctx.fill();
}
