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

  offsetX: 0,
  curves: [
    { worldY: 0,     offsetX: 0 },
    { worldY: 15000, offsetX: 0 },
    { worldY: 21000, offsetX: 60 },
    { worldY: 36000, offsetX: 60 },
    { worldY: 42000, offsetX: -60 },
    { worldY: 56000, offsetX: -60 },
    { worldY: 62000, offsetX: 60 },
    { worldY: 73000, offsetX: 60 },
    { worldY: 78000, offsetX: 0 },
  ],

  update(dt) {
    this.scrollY += this.speed * dt;
    this.offsetX = this.computeOffset(this.scrollY);
  },

  computeOffset(scrollY) {
    for (let i = 0; i < this.curves.length - 1; i++) {
      const a = this.curves[i];
      const b = this.curves[i + 1];
      if (scrollY <= b.worldY) {
        const t = Math.max(0, Math.min(1, (scrollY - a.worldY) / (b.worldY - a.worldY)));
        const eased = t * t * (3 - 2 * t);
        return a.offsetX + eased * (b.offsetX - a.offsetX);
      }
    }
    return this.curves[this.curves.length - 1].offsetX;
  },

  render(ctx) {
    const W = ctx.canvas.width;
    const H = ctx.canvas.height;
    const roadX = this.edgeWidth;
    const roadW = W - this.edgeWidth * 2;
    const laneW = roadW / this.laneCount;

    const sampleStep = 6;
    const samples = [];
    for (let y = -sampleStep; y <= H + sampleStep; y += sampleStep) {
      const worldY = this.scrollY + (PLAYER_SCREEN_Y - y);
      samples.push({ y, off: this.computeOffset(worldY) });
    }

    ctx.fillStyle = '#258a3a';
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = '#4a4a4a';
    ctx.beginPath();
    ctx.moveTo(roadX + samples[0].off, samples[0].y);
    for (const s of samples) {
      ctx.lineTo(roadX + s.off, s.y);
    }
    for (let i = samples.length - 1; i >= 0; i--) {
      ctx.lineTo(W - this.edgeWidth + samples[i].off, samples[i].y);
    }
    ctx.closePath();
    ctx.fill();

    drawDecorations(ctx, this.scrollY, this.edgeWidth, W, H, (wy) => this.computeOffset(wy));

    const dashH = 40;
    const dashGap = 60;
    const segment = dashH + dashGap;
    const dashScrollOffset = this.scrollY % segment;

    ctx.fillStyle = '#fff';
    for (let i = 1; i < this.laneCount; i++) {
      for (let y = -segment + dashScrollOffset; y < H; y += segment) {
        const worldY = this.scrollY + (PLAYER_SCREEN_Y - y);
        if (worldY < NO_DASH_UNTIL_WORLD_Y) continue;
        const off = this.computeOffset(worldY);
        ctx.fillRect(roadX + i * laneW - 3 + off, y, 6, dashH);
      }
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(roadX - 2 + samples[0].off, samples[0].y);
    for (const s of samples) ctx.lineTo(roadX - 2 + s.off, s.y);
    for (let i = samples.length - 1; i >= 0; i--) ctx.lineTo(roadX + samples[i].off, samples[i].y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(W - this.edgeWidth + samples[0].off, samples[0].y);
    for (const s of samples) ctx.lineTo(W - this.edgeWidth + s.off, s.y);
    for (let i = samples.length - 1; i >= 0; i--) ctx.lineTo(W - this.edgeWidth + 2 + samples[i].off, samples[i].y);
    ctx.closePath();
    ctx.fill();

    const plankH = 34;
    const plankSeg = plankH;
    const plankOffset = this.scrollY % plankSeg;
    for (let y = -plankSeg + plankOffset; y < H; y += plankSeg) {
      const worldY = this.scrollY + (PLAYER_SCREEN_Y - y);
      const off = this.computeOffset(worldY);

      ctx.fillStyle = '#cfcfcf';
      ctx.fillRect(roadX - 9 + off, y, 7, plankH);
      ctx.fillRect(roadX + roadW + 2 + off, y, 7, plankH);

      ctx.fillStyle = '#7d7d7d';
      ctx.fillRect(roadX - 9 + off, y + plankH - 2, 7, 2);
      ctx.fillRect(roadX + roadW + 2 + off, y + plankH - 2, 7, 2);
    }

    const startScreenY = PLAYER_SCREEN_Y - (START_TEXT_WORLD_Y - this.scrollY);
    if (startScreenY > -40 && startScreenY < H + 40) {
      const startOff = this.computeOffset(START_TEXT_WORLD_Y);
      ctx.save();
      ctx.font = 'bold 38px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const textW = ctx.measureText('START').width;
      const padX = 14;
      const padY = 8;
      const boxW = textW + padX * 2;
      const boxH = 38 + padY * 2;
      const boxX = W / 2 + startOff - boxW / 2;
      const boxY = startScreenY - boxH / 2;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.strokeRect(boxX, boxY, boxW, boxH);
      ctx.fillStyle = '#ffffff';
      ctx.fillText('START', W / 2 + startOff, startScreenY);
      ctx.restore();
    }

    if (typeof Game !== 'undefined' && Game.raceLength) {
      const finishScreenY = PLAYER_SCREEN_Y - (Game.raceLength - this.scrollY);
      if (finishScreenY > -40 && finishScreenY < H + 40) {
        const finishOff = this.computeOffset(Game.raceLength);
        const checkerSize = 11;
        const stripeH = 22;
        const numChecks = Math.ceil(roadW / checkerSize);
        for (let row = 0; row < 2; row++) {
          for (let i = 0; i < numChecks; i++) {
            ctx.fillStyle = ((i + row) % 2 === 0) ? '#fff' : '#000';
            ctx.fillRect(roadX + i * checkerSize + finishOff, finishScreenY - stripeH / 2 + row * (stripeH / 2), checkerSize, stripeH / 2);
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

function drawDecorations(ctx, scrollY, edgeWidth, W, H, getOffset) {
  const offset = scrollY % DECO_SPACING;
  const baseIndex = Math.floor(scrollY / DECO_SPACING);

  for (let y = -DECO_SPACING + offset, i = 0; y < H + DECO_SPACING; y += DECO_SPACING, i++) {
    const patternIdx = ((baseIndex - i - 1) % DECO_PATTERN.length + DECO_PATTERN.length) % DECO_PATTERN.length;
    const slot = DECO_PATTERN[patternIdx];

    const worldY = scrollY + (PLAYER_SCREEN_Y - y);
    const off = getOffset ? getOffset(worldY) : 0;

    const leftX = edgeWidth / 2 + off;
    const rightX = W - edgeWidth / 2 + off;

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
