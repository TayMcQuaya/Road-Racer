const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const hudScoreEl = document.getElementById('hud-score');
const hudSpeedEl = document.getElementById('hud-speed');
const hudFuelEl = document.getElementById('hud-fuel');
const hudHiEl = document.getElementById('hud-hi');

const HIGH_SCORE_KEY = 'roadfighter_highscore';
try {
  const stored = localStorage.getItem(HIGH_SCORE_KEY);
  if (stored !== null) {
    const n = parseInt(stored, 10);
    if (!isNaN(n) && n >= 0) Game.highScore = n;
  }
} catch (e) {}
const trackMarkerEl = document.getElementById('track-marker');
const trackDisplayEl = document.querySelector('.track-display');

function pad(n, len) {
  return String(Math.max(0, Math.floor(n))).padStart(len, '0');
}

function updateHud() {
  const displaySpeed = (Road.speed / Road.maxSpeed) * Road.displayMax;
  const score = Math.floor(Road.scrollY / 10) + Game.bonusScore;
  if (score > Game.highScore) {
    Game.highScore = score;
    try {
      localStorage.setItem(HIGH_SCORE_KEY, String(score));
    } catch (e) {}
  }
  hudScoreEl.textContent = pad(score, 9);
  hudHiEl.textContent = pad(Game.highScore, 9);
  hudSpeedEl.textContent = pad(Math.round(displaySpeed), 3);
  hudFuelEl.textContent = pad(Game.fuel, 3);
  hudFuelEl.classList.toggle('low-fuel', Game.fuel <= 15);

  const progress = Math.min(1, Math.max(0, Road.scrollY / Game.raceLength));
  const trackH = trackDisplayEl.clientHeight;
  const markerH = trackMarkerEl.getBoundingClientRect().height;
  const minBottom = 22;
  const maxBottom = trackH - 22 - markerH;
  const bottom = minBottom + progress * (maxBottom - minBottom);
  trackMarkerEl.style.bottom = `${bottom}px`;
}

const Sprites = {
  cars: null,
  loaded: false,
  enabled: false,
  slices: {
    red:    { sx: 5,    sy: 5, sw: 280, sh: 355 },
    green:  { sx: 360,  sy: 5, sw: 280, sh: 355 },
    yellow: { sx: 720,  sy: 5, sw: 280, sh: 355 },
    blue:   { sx: 1080, sy: 5, sw: 280, sh: 355 },
  },
  load() {
    const img = new Image();
    img.onload = () => {
      this.cars = img;
      this.loaded = true;
    };
    img.src = 'assets/cars.svg';
  },
  draw(ctx, kind, cx, cy, w, h) {
    if (!this.enabled || !this.loaded) return false;
    const s = this.slices[kind];
    if (!s) return false;
    const aspect = s.sw / s.sh;
    const renderH = h * 1.05;
    const renderW = renderH * aspect;
    ctx.drawImage(this.cars, s.sx, s.sy, s.sw, s.sh, cx - renderW / 2, cy - renderH / 2, renderW, renderH);
    return true;
  },
};

function drawHudText(ctx, text, x, y, size, opts = {}) {
  ctx.save();
  ctx.font = `bold ${size}px monospace`;
  ctx.textAlign = opts.align || 'left';
  ctx.textBaseline = opts.baseline || 'alphabetic';
  ctx.lineWidth = opts.lineWidth || 4;
  ctx.strokeStyle = opts.strokeStyle || '#000';
  ctx.fillStyle = opts.fillStyle || '#fff';
  ctx.strokeText(text, x, y);
  ctx.fillText(text, x, y);
  ctx.restore();
}

const state = {
  fps: 60,
  time: 0,
};

function update(dt) {
  if (Input.justPressed('Escape') && Game.phase !== 'gameover' && Game.phase !== 'finished') {
    Game.paused = !Game.paused;
    if (Game.paused) Sound.pause();
    else Sound.unpause();
  }

  if (Input.justPressed('KeyM')) {
    Sound.enabled = !Sound.enabled;
    if (!Sound.enabled) {
      Sound.stopEngine();
      Sound.stopSkid();
    }
    Game.addFloatText(Sound.enabled ? 'SOUND ON' : 'MUTED', canvas.width / 2, 100, '#ffd84a');
  }

  const supermanActive = Game.supermanPhase !== 'inactive';

  if (Game.paused || Game.phase === 'gameover' || Game.phase === 'finished' || Player.isBumped() || supermanActive) {
    Sound.stopEngine();
  } else if (Road.speed > 0) {
    Sound.startEngine();
    Sound.updateEngine(Road.speed / Road.maxSpeed);
  } else {
    Sound.stopEngine();
  }

  if (Game.paused || Game.phase === 'gameover' || Game.phase === 'finished' || !Player.isBumped() || supermanActive) {
    Sound.stopSkid();
  }

  if (Game.phase === 'racing' && Game.fuel > 0 && Game.fuel <= 15 && !supermanActive) {
    state.lowFuelTimer = (state.lowFuelTimer || 0) + dt;
    if (state.lowFuelTimer >= 0.7) {
      state.lowFuelTimer = 0;
      Sound.lowFuelBeep();
    }
  } else {
    state.lowFuelTimer = 0;
  }

  if (Game.paused) return;

  state.time += dt;
  Game.update(dt);
  Road.update(dt);
  Player.update(dt, canvas.width, Game.canDrive());
  Traffic.update(dt);
  Hazards.update(dt);
  Pickups.update(dt);
}

function render() {
  Road.render(ctx);
  Hazards.render(ctx);
  Pickups.render(ctx);
  Traffic.render(ctx);

  Game.render(ctx);
  if (Game.shouldRenderPlayer()) Player.render(ctx);
  Game.renderOverlay(ctx);

  if (Game.paused) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    drawHudText(ctx, 'PAUSED', canvas.width / 2, canvas.height / 2, 56, {
      align: 'center', baseline: 'middle', fillStyle: '#fff', lineWidth: 5,
    });
    drawHudText(ctx, 'PRESS ESC TO RESUME', canvas.width / 2, canvas.height / 2 + 50, 14, {
      align: 'center', baseline: 'middle', fillStyle: '#aaa', lineWidth: 2,
    });
  }

  drawHudText(ctx, `FPS: ${state.fps.toFixed(0)}`, 12, 24, 14, { lineWidth: 3 });
}

let lastTime = performance.now();

function loop(now) {
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;

  state.fps = state.fps * 0.9 + (1 / dt) * 0.1;

  update(dt);
  render();
  updateHud();
  Input.endFrame();

  requestAnimationFrame(loop);
}

Input.init();
Game.init();
Traffic.init();
Hazards.init();
Pickups.init();
Sprites.load();

requestAnimationFrame((t) => {
  lastTime = t;
  requestAnimationFrame(loop);
});
