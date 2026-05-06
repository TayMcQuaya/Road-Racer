const Sound = {
  ctx: null,
  engineOsc: null,
  engineGain: null,
  skidSrc: null,
  skidGain: null,
  enabled: true,

  ensureCtx() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    try {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      this.ctx = new Ctor();
    } catch (e) {
      this.enabled = false;
    }
  },

  beep(freq, duration, volume = 0.2, type = 'square') {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration + 0.05);
  },

  countdown(num) {
    if (num > 0) this.beep(440, 0.18, 0.25, 'square');
    else this.beep(880, 0.45, 0.3, 'square');
  },

  pickup() {
    this.beep(660, 0.08, 0.22, 'square');
    setTimeout(() => this.beep(880, 0.08, 0.22, 'square'), 80);
    setTimeout(() => this.beep(1320, 0.18, 0.28, 'square'), 160);
  },

  superman() {
    this.stopEngine();
    this.stopSkid();
    if (this.supermanWindSrc) return;
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    this.supermanGain = ctx.createGain();
    this.supermanGain.gain.setValueAtTime(0, t);
    this.supermanGain.gain.linearRampToValueAtTime(0.22, t + 0.4);
    this.supermanGain.connect(ctx.destination);

    this.supermanWindSrc = this.makeNoise(2);
    this.supermanWindSrc.loop = true;
    this.supermanWindFilter = ctx.createBiquadFilter();
    this.supermanWindFilter.type = 'lowpass';
    this.supermanWindFilter.frequency.value = 600;
    this.supermanWindFilter.Q.value = 0.9;
    const windGain = ctx.createGain();
    windGain.gain.value = 0.85;
    this.supermanWindSrc.connect(this.supermanWindFilter);
    this.supermanWindFilter.connect(windGain);
    windGain.connect(this.supermanGain);
    this.supermanWindSrc.start();

    this.supermanWindLFO = ctx.createOscillator();
    this.supermanWindLFO.type = 'sine';
    this.supermanWindLFO.frequency.value = 0.7;
    const windLFOGain = ctx.createGain();
    windLFOGain.gain.value = 200;
    this.supermanWindLFO.connect(windLFOGain);
    windLFOGain.connect(this.supermanWindFilter.frequency);
    this.supermanWindLFO.start();

    this.supermanShimmerOsc = ctx.createOscillator();
    this.supermanShimmerOsc.type = 'sine';
    this.supermanShimmerOsc.frequency.value = 880;
    this.supermanShimmerLFO = ctx.createOscillator();
    this.supermanShimmerLFO.type = 'sine';
    this.supermanShimmerLFO.frequency.value = 4;
    const shimmerLFOGain = ctx.createGain();
    shimmerLFOGain.gain.value = 15;
    this.supermanShimmerLFO.connect(shimmerLFOGain);
    shimmerLFOGain.connect(this.supermanShimmerOsc.frequency);
    const shimmerGain = ctx.createGain();
    shimmerGain.gain.value = 0.08;
    this.supermanShimmerOsc.connect(shimmerGain);
    shimmerGain.connect(this.supermanGain);
    this.supermanShimmerOsc.start();
    this.supermanShimmerLFO.start();
  },

  stopSuperman() {
    if (!this.supermanWindSrc || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.supermanGain.gain.cancelScheduledValues(t);
    this.supermanGain.gain.setValueAtTime(this.supermanGain.gain.value, t);
    this.supermanGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
    const sources = [this.supermanWindSrc, this.supermanWindLFO, this.supermanShimmerOsc, this.supermanShimmerLFO];
    setTimeout(() => {
      sources.forEach((s) => { try { s.stop(); } catch (e) {} });
    }, 600);
    this.supermanWindSrc = null;
    this.supermanWindLFO = null;
    this.supermanWindFilter = null;
    this.supermanShimmerOsc = null;
    this.supermanShimmerLFO = null;
    this.supermanGain = null;
  },

  whoosh() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const noise = this.makeNoise(0.4);
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.4;
    filter.frequency.setValueAtTime(2400, t);
    filter.frequency.exponentialRampToValueAtTime(350, t + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.28, t + 0.06);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(t + 0.45);
  },

  lowFuelBeep() {
    this.beep(880, 0.08, 0.2, 'square');
    setTimeout(() => this.beep(660, 0.1, 0.2, 'square'), 95);
  },

  finish() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => {
      setTimeout(() => this.beep(f, i === notes.length - 1 ? 0.55 : 0.15, 0.27, 'triangle'), i * 150);
    });
  },

  intro() {
    const melody = [
      [392, 0.10, 0],
      [523, 0.10, 130],
      [659, 0.10, 260],
      [784, 0.10, 390],
      [1047, 0.22, 520],
      [988, 0.08, 850],
      [1047, 0.08, 960],
      [1175, 0.08, 1070],
      [1319, 0.55, 1180],
    ];
    melody.forEach(([f, d, t]) => {
      setTimeout(() => this.beep(f, d, 0.24, 'square'), t);
    });

    const bass = [
      [131, 0.18, 0],
      [196, 0.18, 260],
      [131, 0.18, 520],
      [196, 0.18, 780],
      [262, 0.5, 1180],
    ];
    bass.forEach(([f, d, t]) => {
      setTimeout(() => this.beep(f, d, 0.13, 'triangle'), t);
    });
  },

  pause() {
    this.beep(523, 0.07, 0.2, 'square');
    setTimeout(() => this.beep(330, 0.12, 0.2, 'square'), 70);
  },

  unpause() {
    this.beep(330, 0.07, 0.2, 'square');
    setTimeout(() => this.beep(523, 0.12, 0.2, 'square'), 70);
  },

  failure() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const wah = (startOffset, freq, duration, bendTo, vol = 0.22) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t + startOffset);
      if (bendTo !== undefined) {
        osc.frequency.linearRampToValueAtTime(bendTo, t + startOffset + duration);
      }
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1500;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, t + startOffset);
      gain.gain.linearRampToValueAtTime(vol, t + startOffset + 0.04);
      gain.gain.setValueAtTime(vol, t + startOffset + duration - 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + startOffset + duration);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t + startOffset);
      osc.stop(t + startOffset + duration + 0.05);
    };

    wah(0,    523, 0.3, 466);
    wah(0.4,  466, 0.3, 415);
    wah(0.8,  415, 0.3, 370);
    wah(1.3,  370, 1.4, 165, 0.25);
  },

  success() {
    const notes = [
      [523, 0.13, 0],
      [659, 0.13, 130],
      [784, 0.13, 260],
      [1047, 0.3, 390],
      [988, 0.15, 750],
      [1047, 0.5, 950],
      [1319, 0.7, 1500],
    ];
    notes.forEach(([f, d, t]) => {
      setTimeout(() => this.beep(f, d, 0.27, 'triangle'), t);
    });
  },

  crash() {
    this.stopEngine();
    this.stopSkid();

    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    const snap = this.makeNoise(0.06);
    const snapGain = ctx.createGain();
    snapGain.gain.setValueAtTime(0.7, t);
    snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    snap.connect(snapGain);
    snapGain.connect(ctx.destination);
    snap.start();
    snap.stop(t + 0.08);

    const blast = this.makeNoise(1.4);
    const blastFilter = ctx.createBiquadFilter();
    blastFilter.type = 'lowpass';
    blastFilter.frequency.setValueAtTime(2400, t);
    blastFilter.frequency.exponentialRampToValueAtTime(120, t + 1.4);
    const blastGain = ctx.createGain();
    blastGain.gain.setValueAtTime(0.6, t);
    blastGain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);
    blast.connect(blastFilter);
    blastFilter.connect(blastGain);
    blastGain.connect(ctx.destination);
    blast.start();
    blast.stop(t + 1.45);

    const boom = ctx.createOscillator();
    const boomGain = ctx.createGain();
    boom.type = 'sine';
    boom.frequency.setValueAtTime(200, t);
    boom.frequency.exponentialRampToValueAtTime(28, t + 0.7);
    boomGain.gain.setValueAtTime(0.55, t);
    boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
    boom.connect(boomGain);
    boomGain.connect(ctx.destination);
    boom.start();
    boom.stop(t + 0.75);

    const subBoom = ctx.createOscillator();
    const subGain = ctx.createGain();
    subBoom.type = 'sine';
    subBoom.frequency.setValueAtTime(60, t + 0.05);
    subBoom.frequency.exponentialRampToValueAtTime(20, t + 0.9);
    subGain.gain.setValueAtTime(0, t);
    subGain.gain.linearRampToValueAtTime(0.45, t + 0.06);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
    subBoom.connect(subGain);
    subGain.connect(ctx.destination);
    subBoom.start();
    subBoom.stop(t + 0.95);

    const debris = this.makeNoise(0.4);
    const debrisFilter = ctx.createBiquadFilter();
    debrisFilter.type = 'highpass';
    debrisFilter.frequency.value = 1500;
    const debrisGain = ctx.createGain();
    debrisGain.gain.setValueAtTime(0, t);
    debrisGain.gain.linearRampToValueAtTime(0.25, t + 0.1);
    debrisGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    debris.connect(debrisFilter);
    debrisFilter.connect(debrisGain);
    debrisGain.connect(ctx.destination);
    debris.start();
    debris.stop(t + 0.45);
  },

  bump() {
    if (!this.enabled) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const noise = this.makeNoise(0.18);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1200;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + 0.2);
  },

  startEngine() {
    if (!this.enabled) return;
    if (this.engineOsc) return;
    this.ensureCtx();
    if (!this.ctx) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc.type = 'sine';
    this.engineOsc2.type = 'triangle';
    this.engineOsc.frequency.value = 70;
    this.engineOsc2.frequency.value = 140;
    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.value = 0.05;
    this.engineOsc.connect(this.engineGain);
    this.engineOsc2.connect(this.engineGain);
    this.engineGain.connect(this.ctx.destination);
    this.engineOsc.start();
    this.engineOsc2.start();
  },

  updateEngine(speedRatio) {
    if (!this.engineOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    const baseFreq = 70 + speedRatio * 110;
    const targetGain = 0.04 + speedRatio * 0.07;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, t, 0.08);
    this.engineOsc2.frequency.setTargetAtTime(baseFreq * 2, t, 0.08);
    this.engineGain.gain.setTargetAtTime(targetGain, t, 0.08);
  },

  stopEngine() {
    if (!this.engineOsc || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.engineGain.gain.cancelScheduledValues(t);
    this.engineGain.gain.setValueAtTime(this.engineGain.gain.value, t);
    this.engineGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    const osc1 = this.engineOsc;
    const osc2 = this.engineOsc2;
    setTimeout(() => {
      try { osc1.stop(); } catch (e) {}
      try { osc2.stop(); } catch (e) {}
    }, 200);
    this.engineOsc = null;
    this.engineOsc2 = null;
    this.engineGain = null;
  },

  startSkid() {
    if (!this.enabled) return;
    if (this.skidSrc) return;
    this.ensureCtx();
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;

    this.skidGain = ctx.createGain();
    this.skidGain.gain.setValueAtTime(0, t);
    this.skidGain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    this.skidGain.connect(ctx.destination);

    this.skidSrc = this.makeNoise(2);
    this.skidSrc.loop = true;
    this.skidScreechFilter = ctx.createBiquadFilter();
    this.skidScreechFilter.type = 'bandpass';
    this.skidScreechFilter.frequency.value = 3200;
    this.skidScreechFilter.Q.value = 5.5;
    const screechGain = ctx.createGain();
    screechGain.gain.value = 0.95;
    this.skidSrc.connect(this.skidScreechFilter);
    this.skidScreechFilter.connect(screechGain);
    screechGain.connect(this.skidGain);
    this.skidSrc.start();

    this.skidLFO = ctx.createOscillator();
    this.skidLFO.type = 'sine';
    this.skidLFO.frequency.value = 4.5;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 380;
    this.skidLFO.connect(lfoGain);
    lfoGain.connect(this.skidScreechFilter.frequency);
    this.skidLFO.start();

    this.skidBody = this.makeNoise(2);
    this.skidBody.loop = true;
    const bodyFilter = ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.value = 1100;
    bodyFilter.Q.value = 1.8;
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.55;
    this.skidBody.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(this.skidGain);
    this.skidBody.start();

    this.skidRumble = this.makeNoise(2);
    this.skidRumble.loop = true;
    const rumbleFilter = ctx.createBiquadFilter();
    rumbleFilter.type = 'lowpass';
    rumbleFilter.frequency.value = 220;
    const rumbleGain = ctx.createGain();
    rumbleGain.gain.value = 0.55;
    this.skidRumble.connect(rumbleFilter);
    rumbleFilter.connect(rumbleGain);
    rumbleGain.connect(this.skidGain);
    this.skidRumble.start();
  },

  stopSkid() {
    if (!this.skidSrc || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.skidGain.gain.cancelScheduledValues(t);
    this.skidGain.gain.setValueAtTime(this.skidGain.gain.value, t);
    this.skidGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
    const sources = [this.skidSrc, this.skidBody, this.skidRumble, this.skidLFO];
    setTimeout(() => {
      sources.forEach((s) => { try { s.stop(); } catch (e) {} });
    }, 200);
    this.skidSrc = null;
    this.skidBody = null;
    this.skidRumble = null;
    this.skidLFO = null;
    this.skidScreechFilter = null;
    this.skidGain = null;
  },

  makeNoise(duration) {
    const bufferSize = Math.max(1, Math.floor(this.ctx.sampleRate * duration));
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    return source;
  },
};
