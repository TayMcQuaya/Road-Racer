const Input = {
  keys: new Set(),
  pressed: new Set(),

  init() {
    window.addEventListener('keydown', (e) => {
      if (!this.keys.has(e.code)) {
        this.pressed.add(e.code);
      }
      this.keys.add(e.code);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.code);
    });
    window.addEventListener('blur', () => {
      this.keys.clear();
    });
  },

  isDown(...codes) {
    return codes.some((c) => this.keys.has(c));
  },

  justPressed(...codes) {
    return codes.some((c) => this.pressed.has(c));
  },

  endFrame() {
    this.pressed.clear();
  },
};
