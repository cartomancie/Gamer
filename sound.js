// ---------- sound.js ----------
// Pequenos efeitos sonoros gerados por osciladores, sem precisar de arquivos .mp3.

const Sound = {
  ctx: null,

  _ensureCtx(){
    if(!this.ctx){
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if(AudioCtx) this.ctx = new AudioCtx();
    }
    if(this.ctx && this.ctx.state === 'suspended'){
      this.ctx.resume();
    }
    return this.ctx;
  },

  _beep({freq = 440, duration = 0.12, type = 'sine', volume = 0.18, glide = 0}){
    const ctx = this._ensureCtx();
    if(!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    if(glide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + glide), ctx.currentTime + duration);
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration + 0.02);
  },

  catch(){
    this._beep({freq: 620, duration: 0.1, type: 'triangle', glide: 260, volume: 0.16});
  },

  catchFish(){
    this._beep({freq: 720, duration: 0.12, type: 'sine', glide: 320, volume: 0.16});
    setTimeout(() => this._beep({freq: 900, duration: 0.1, type: 'triangle', glide: 200, volume: 0.12}), 60);
  },

  miss(){
    this._beep({freq: 220, duration: 0.18, type: 'sawtooth', glide: -100, volume: 0.12});
  },

  pet(){
    this._beep({freq: 500, duration: 0.08, type: 'sine', glide: 120, volume: 0.12});
  },

  feedComplete(){
    this._ensureCtx();
    [523, 659, 784].forEach((f, i) => {
      setTimeout(() => this._beep({freq: f, duration: 0.16, type: 'triangle', volume: 0.15}), i * 90);
    });
  },

  sad(){
    this._beep({freq: 300, duration: 0.3, type: 'sine', glide: -140, volume: 0.1});
  },

  click(){
    this._beep({freq: 380, duration: 0.06, type: 'square', volume: 0.08});
  },

  buy(){
    this._ensureCtx();
    [440, 660].forEach((f, i) => {
      setTimeout(() => this._beep({freq: f, duration: 0.12, type: 'triangle', volume: 0.14}), i * 80);
    });
  },

  coin(){
    this._beep({freq: 880, duration: 0.09, type: 'square', glide: 240, volume: 0.12});
  },

  sleep(){
    this._beep({freq: 260, duration: 0.4, type: 'sine', glide: -80, volume: 0.1});
  },

  wake(){
    this._beep({freq: 500, duration: 0.18, type: 'sine', glide: 140, volume: 0.14});
  },

  sparkle(){
    this._beep({freq: 1000, duration: 0.15, type: 'sine', glide: 400, volume: 0.1});
  }
};
