const Game = {
  phase: 'countdown',
  countdown: 3,
  countdownTimer: 0,
  enemies: [],
  explosions: [],
  crashTimer: 0,
  crashDuration: 1.4,

  difficulty: 0,
  speedDifficulty: 0,

  fuel: 100,
  maxFuel: 100,
  fuelDrainRate: 2,

  gameoverTimer: 0,
  gameoverGrace: 1,

  bonusScore: 0,
  floatingTexts: [],
  paused: false,

  raceLength: 80000,
  highScore: 0,
  finishStopOffset: 35,
  finishHaltTimer: 0,
  finishExitSpeed: 0,

  bumpFreeTimer: 0,
  maxSpeedStreakTimer: 0,
  SUPERMAN_TRIGGER_SECONDS: 30,
  SUPERMAN_CRUISE_DURATION: 3.5,
  supermanPlayed: false,
  supermanPhase: 'inactive',
  supermanY: 0,
  supermanSide: 'left',
  supermanCruiseTimer: 0,
  supermanExitVy: 0,

  init() {
    this.phase = 'pregame';
    this.countdown = 3;
    this.countdownTimer = 0;
    this.explosions = [];
    this.crashTimer = 0;
    this.difficulty = 0;
    this.speedDifficulty = 0;
    this.fuel = this.maxFuel;
    this.gameoverTimer = 0;
    this.bonusScore = 0;
    this.floatingTexts = [];
    this.finishHaltTimer = 0;
    this.finishExitSpeed = 0;
    this.bumpFreeTimer = 0;
    this.maxSpeedStreakTimer = 0;
    this.supermanPlayed = false;
    this.supermanPhase = 'inactive';
    this.supermanY = 0;
    this.supermanSide = 'left';
    this.supermanCruiseTimer = 0;
    this.supermanExitVy = 0;
    Player.y = PLAYER_SCREEN_Y;
    this.enemies = [
      { x: 130, y: 200, vy: 0 },
      { x: 270, y: 200, vy: 0 },
      { x: 200, y: 255, vy: 0 },
      { x: 130, y: 310, vy: 0 },
      { x: 270, y: 310, vy: 0 },
      { x: 200, y: 370, vy: 0 },
      { x: 270, y: 435, vy: 0 },
      { x: 130, y: 420, vy: 0 },
    ];
  },

  crash(x, y) {
    if (this.phase === 'crashing') return;
    this.phase = 'crashing';
    this.crashTimer = 0;
    Road.speed = 0;
    Player.vx = 0;
    Traffic.cars = [];
    this.fuel = Math.max(0, this.fuel - 5);
    this.spawnExplosion(x, y);
    Sound.crash();
  },

  spawnExplosion(x, y) {
    const colors = ['#ffeb3b', '#ff9800', '#ff5722', '#ffffff'];
    this.explosions.push({
      x, y,
      timer: 0,
      duration: 1.4,
      particles: Array.from({ length: 32 }, (_, i) => {
        const angle = (i / 32) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
        return {
          angle,
          speed: 50 + Math.random() * 90,
          color: colors[i % colors.length],
          size: 3 + Math.floor(Math.random() * 3),
        };
      }),
    });
  },

  respawnPlayer() {
    Player.x = ctx.canvas.width / 2;
    Player.vx = 0;
    Player.bumpTimer = 0;
    Player.lastBumpCar = null;
    Road.speed = 0;
    Hazards.manholes = [];
  },

  update(dt) {
    for (const exp of this.explosions) {
      exp.timer += dt;
    }
    this.explosions = this.explosions.filter((e) => e.timer < e.duration);

    for (const t of this.floatingTexts) {
      t.age += dt;
      t.y -= 36 * dt;
    }
    this.floatingTexts = this.floatingTexts.filter((t) => t.age < t.duration);

    if (this.phase === 'pregame') {
      if (Input.pressed.size > 0) {
        Sound.ensureCtx();
        Sound.intro();
        this.phase = 'intro';
        this.introTimer = 0;
      }
      return;
    }

    if (this.phase === 'intro') {
      this.introTimer += dt;
      if (this.introTimer >= 2.2) {
        this.phase = 'countdown';
        this.countdownTimer = 0;
        Sound.countdown(3);
      }
      return;
    }

    if (this.phase === 'countdown') {
      this.countdownTimer += dt;
      if (this.countdownTimer >= 1) {
        this.countdownTimer -= 1;
        this.countdown -= 1;
        Sound.countdown(this.countdown);
        if (this.countdown <= 0) {
          this.phase = 'launch';
        }
      }
      return;
    }

    if (this.phase === 'launch') {
      const launchAccel = 2400;
      let allGone = true;
      for (const e of this.enemies) {
        e.vy -= launchAccel * dt;
        e.y += e.vy * dt;
        if (e.y > -80) allGone = false;
      }
      if (allGone) {
        this.phase = 'racing';
        this.enemies = [];
      }
      return;
    }

    if (this.phase === 'crashing') {
      this.crashTimer += dt;
      if (this.crashTimer >= this.crashDuration) {
        this.respawnPlayer();
        this.phase = 'racing';
      }
      return;
    }

    if (this.phase === 'gameover') {
      this.gameoverTimer += dt;
      if (this.gameoverTimer >= this.gameoverGrace && Input.isDown('Space')) {
        this.restart();
      }
      return;
    }

    if (this.phase === 'finished') {
      if (Input.isDown('Space')) {
        this.restart();
      }
      return;
    }

    if (this.phase === 'racing') {
      const fast = Road.speed > Road.maxSpeed * 0.55;
      this.speedDifficulty += (fast ? 0.07 : -0.06) * dt;
      if (this.speedDifficulty < 0) this.speedDifficulty = 0;
      if (this.speedDifficulty > 1) this.speedDifficulty = 1;

      const distanceDifficulty = Math.min(1, Road.scrollY / this.raceLength);
      this.difficulty = Math.max(this.speedDifficulty, distanceDifficulty);

      const fastEnough = Road.speed >= Road.maxSpeed * 0.95;
      const notBumped = !Player.isBumped();
      if (fastEnough && notBumped) {
        this.bumpFreeTimer += dt;
        this.maxSpeedStreakTimer += dt;
      } else {
        this.bumpFreeTimer = 0;
        this.maxSpeedStreakTimer = 0;
      }

      if (!this.supermanPlayed
          && this.bumpFreeTimer >= this.SUPERMAN_TRIGGER_SECONDS
          && this.maxSpeedStreakTimer >= this.SUPERMAN_TRIGGER_SECONDS
          && this.supermanPhase === 'inactive') {
        this.supermanPlayed = true;
        this.supermanPhase = 'entering';
        this.supermanSide = Road.offsetX < -5 ? 'right' : 'left';
        this.supermanY = ctx.canvas.height + 40;
        this.supermanCruiseTimer = 0;
        this.supermanExitVy = 0;
        Sound.superman();
      }
    }

    if (this.supermanPhase === 'entering' || this.supermanPhase === 'cruising') {
      const broken = Road.speed < Road.maxSpeed * 0.95
                  || Player.isBumped()
                  || this.phase === 'crashing';
      if (broken) {
        this.supermanPhase = 'exiting';
        this.supermanExitVy = 200;
      }
    }

    if (this.supermanPhase === 'entering') {
      this.supermanY -= 320 * dt;
      if (this.supermanY <= ctx.canvas.height * 0.5) {
        this.supermanY = ctx.canvas.height * 0.5;
        this.supermanPhase = 'cruising';
        this.supermanCruiseTimer = 0;
      }
    } else if (this.supermanPhase === 'cruising') {
      this.supermanCruiseTimer += dt;
      if (this.supermanCruiseTimer >= this.SUPERMAN_CRUISE_DURATION) {
        this.supermanPhase = 'exiting';
        this.supermanExitVy = 200;
      }
    } else if (this.supermanPhase === 'exiting') {
      this.supermanExitVy += 1500 * dt;
      this.supermanY -= this.supermanExitVy * dt;
      if (this.supermanY < -80) {
        this.supermanPhase = 'inactive';
        Sound.stopSuperman();
      }
    }

    if (this.phase === 'racing') {

      this.fuel -= this.fuelDrainRate * dt;
      if (this.fuel < 0) this.fuel = 0;

      if (this.fuel <= 0 && Road.speed <= 0.5) {
        this.phase = 'gameover';
        this.gameoverTimer = 0;
        Road.speed = 0;
        Player.vx = 0;
        Sound.failure();
      }

      const stopAt = this.raceLength - this.finishStopOffset;
      if (Road.scrollY >= stopAt) {
        Road.scrollY = stopAt;
        Road.speed = 0;
        this.phase = 'finishing';
        this.finishHaltTimer = 0;
        this.finishExitSpeed = 0;
        Player.vx = 0;
        Sound.finish();
      }
    }

    if (this.phase === 'finishing') {
      Road.speed = 0;
      Road.scrollY = this.raceLength - this.finishStopOffset;
      this.finishHaltTimer += dt;
      if (this.finishHaltTimer > 1.6) {
        this.finishExitSpeed += 2400 * dt;
        Player.y -= this.finishExitSpeed * dt;
        if (Player.y < -50) {
          this.phase = 'finished';
          Sound.success();
        }
      }
      return;
    }
  },

  canDrive() {
    return this.phase === 'racing';
  },

  isOnFinishLine() {
    return this.phase === 'finishing';
  },

  restart() {
    this.init();
    Road.scrollY = 0;
    Road.speed = 0;
    Player.x = ctx.canvas.width / 2;
    Player.vx = 0;
    Player.bumpTimer = 0;
    Player.lastBumpCar = null;
    Traffic.init();
    Hazards.init();
    Pickups.init();
  },

  shouldRenderPlayer() {
    return this.phase !== 'crashing';
  },

  addFloatText(text, x, y, color) {
    this.floatingTexts.push({ text, x, y, color, age: 0, duration: 1.4 });
  },

  render(ctx) {
    for (const e of this.enemies) {
      drawCar(ctx, e.x, e.y, 22, 38, BLUE_PALETTE);
    }

    if (this.phase === 'pregame') {
      drawHudText(ctx, 'PRESS ANY KEY', ctx.canvas.width / 2, ctx.canvas.height / 2 - 10, 28, {
        align: 'center', baseline: 'middle', fillStyle: '#ffffff', lineWidth: 4,
      });
      drawHudText(ctx, 'TO START', ctx.canvas.width / 2, ctx.canvas.height / 2 + 20, 28, {
        align: 'center', baseline: 'middle', fillStyle: '#ffffff', lineWidth: 4,
      });
    }

    if (this.phase === 'countdown' || this.phase === 'launch') {
      const text = this.phase === 'countdown' ? String(this.countdown) : 'GO!';
      ctx.save();
      ctx.fillStyle = '#ffffff';
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 5;
      ctx.font = 'bold 88px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeText(text, ctx.canvas.width / 2, 170);
      ctx.fillText(text, ctx.canvas.width / 2, 170);
      ctx.restore();
    }

    if (this.phase === 'racing' && Road.speed === 0) {
      drawHudText(ctx, 'HOLD  X  TO  ACCELERATE', ctx.canvas.width / 2, 200, 18, { align: 'center' });
    }

    for (const exp of this.explosions) {
      renderExplosion(ctx, exp, exp.timer / exp.duration);
    }

    if (this.supermanPhase !== 'inactive') {
      const sx = this.supermanSide === 'left'
        ? Road.edgeWidth / 2
        : ctx.canvas.width - Road.edgeWidth / 2;
      drawSuperman(ctx, sx, this.supermanY);
    }

    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, 1 - ft.age / ft.duration);
      ctx.save();
      ctx.globalAlpha = alpha;
      drawHudText(ctx, ft.text, ft.x, ft.y, 20, {
        align: 'center', baseline: 'middle', fillStyle: ft.color, lineWidth: 4,
      });
      ctx.restore();
    }
  },

  renderOverlay(ctx) {
    if (this.phase === 'finished') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();

      drawHudText(ctx, 'STAGE CLEAR', ctx.canvas.width / 2, ctx.canvas.height / 2 - 20, 48, {
        align: 'center', baseline: 'middle', fillStyle: '#ffd84a', lineWidth: 5,
      });
      const finalScore = Math.floor(Road.scrollY / 10) + this.bonusScore;
      drawHudText(ctx, `SCORE  ${pad(finalScore, 9)}`, ctx.canvas.width / 2, ctx.canvas.height / 2 + 30, 18, {
        align: 'center', baseline: 'middle', fillStyle: '#ddd', lineWidth: 3,
      });
      drawHudText(ctx, 'PRESS SPACE TO RESTART', ctx.canvas.width / 2, ctx.canvas.height / 2 + 80, 14, {
        align: 'center', baseline: 'middle', fillStyle: '#aaa', lineWidth: 2,
      });
    }

    if (this.phase === 'gameover') {
      ctx.save();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.65)';
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.restore();

      drawHudText(ctx, 'GAME OVER', ctx.canvas.width / 2, ctx.canvas.height / 2, 56, {
        align: 'center', baseline: 'middle', fillStyle: '#ff5252', lineWidth: 5,
      });
      drawHudText(ctx, 'OUT OF FUEL', ctx.canvas.width / 2, ctx.canvas.height / 2 + 50, 18, {
        align: 'center', baseline: 'middle', fillStyle: '#ddd', lineWidth: 3,
      });
      if (this.gameoverTimer >= this.gameoverGrace) {
        drawHudText(ctx, 'PRESS SPACE TO RESTART', ctx.canvas.width / 2, ctx.canvas.height / 2 + 100, 14, {
          align: 'center', baseline: 'middle', fillStyle: '#aaa', lineWidth: 2,
        });
      }
    }
  },
};

function drawSuperman(ctx, cx, cy) {
  const flutter = Math.sin(state.time * 14) * 1.2;
  const y = cy + flutter;

  ctx.fillStyle = '#c8281f';
  ctx.beginPath();
  ctx.moveTo(cx - 6, y + 4);
  ctx.lineTo(cx + 6, y + 4);
  ctx.lineTo(cx + 13, y + 26);
  ctx.lineTo(cx, y + 32);
  ctx.lineTo(cx - 13, y + 26);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1f4eb8';
  ctx.fillRect(cx - 7, y - 4, 5, 16);
  ctx.fillRect(cx + 2, y - 4, 5, 16);

  ctx.fillStyle = '#1f4eb8';
  ctx.beginPath();
  ctx.ellipse(cx, y + 6, 8, 11, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffd84a';
  ctx.beginPath();
  ctx.moveTo(cx, y + 2);
  ctx.lineTo(cx + 3, y + 6);
  ctx.lineTo(cx, y + 10);
  ctx.lineTo(cx - 3, y + 6);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#fbcfa9';
  ctx.beginPath();
  ctx.arc(cx, y - 6, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#1a1208';
  ctx.beginPath();
  ctx.arc(cx, y - 8, 5, Math.PI, Math.PI * 2);
  ctx.fill();
}

function renderExplosion(ctx, exp, t) {
  ctx.save();

  if (t < 0.5) {
    const flashT = t / 0.5;
    ctx.globalAlpha = 1 - flashT;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, 18 * (1 - flashT) + 4, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = Math.max(0, 1 - t);
  for (const p of exp.particles) {
    const dist = p.speed * t * 0.7;
    const px = exp.x + Math.cos(p.angle) * dist;
    const py = exp.y + Math.sin(p.angle) * dist;
    ctx.fillStyle = p.color;
    ctx.fillRect(px - p.size / 2, py - p.size / 2, p.size, p.size);
  }

  ctx.restore();
}
