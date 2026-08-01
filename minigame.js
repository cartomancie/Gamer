// ---------- minigame.js ----------
// Minigame simples em canvas: comidinhas (e peixinhos bônus) caem do topo e o
// jogador precisa tocar/clicar nelas antes que cheguem ao chão. Sem dependências externas.

const Minigame = {
  canvas: null,
  ctx: null,
  foodImg: null,
  fishImg: null,
  running: false,

  items: [],
  particles: [],

  timeLeft: 30,
  lives: 3,
  caught: 0,
  fishCaught: 0,
  spawnTimer: 0,
  spawnInterval: 900,
  difficultyTimer: 0,

  onFinish: null,

  init(){
    this.canvas = document.getElementById('mg-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.foodImg = new Image();
    this.foodImg.src = 'assets/food.png';
    this.fishImg = new Image();
    this.fishImg.src = 'assets/fish.png';

    this.canvas.addEventListener('pointerdown', (e) => this._handleTap(e));
    window.addEventListener('resize', () => this._resizeCanvas());
  },

  _resizeCanvas(){
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.width = rect.width;
    this.height = rect.height;
  },

  start(onFinish){
    this._resizeCanvas();
    this.items = [];
    this.particles = [];
    this.timeLeft = 30;
    this.lives = 3;
    this.caught = 0;
    this.fishCaught = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 900;
    this.difficultyTimer = 0;
    this.onFinish = onFinish;
    this.running = true;

    document.getElementById('mg-time').textContent = this.timeLeft;
    document.getElementById('mg-caught').textContent = this.caught;
    const fishEl = document.getElementById('mg-fish');
    if(fishEl) fishEl.textContent = this.fishCaught;
    this._renderLives();

    this._lastTs = performance.now();
    requestAnimationFrame((ts) => this._loop(ts));
  },

  stop(){
    this.running = false;
  },

  _renderLives(){
    document.getElementById('mg-lives').textContent = '❤️'.repeat(Math.max(0, this.lives)) + '🖤'.repeat(3 - Math.max(0, this.lives));
  },

  _handleTap(e){
    if(!this.running) return;
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    for(let i = this.items.length - 1; i >= 0; i--){
      const it = this.items[i];
      const dx = x - it.x;
      const dy = y - it.y;
      if(Math.sqrt(dx * dx + dy * dy) < it.r + 10){
        this._catchItem(i);
        return;
      }
    }
  },

  _catchItem(index){
    const it = this.items[index];
    this.items.splice(index, 1);

    if(it.type === 'fish'){
      this.fishCaught++;
      const fishEl = document.getElementById('mg-fish');
      if(fishEl) fishEl.textContent = this.fishCaught;
      Sound.catchFish();
      this._spawnBurst(it.x, it.y, ['#7EC8E3', '#BEE9FF', '#FFF', '#4FAE86']);
    }else{
      this.caught++;
      document.getElementById('mg-caught').textContent = this.caught;
      Sound.catch();
      this._spawnBurst(it.x, it.y, ['#F6CE55', '#F28C77', '#7FD8B0', '#FFF']);
    }
  },

  _spawnBurst(x, y, colors){
    for(let i = 0; i < 10; i++){
      const angle = Utils.rand(0, Math.PI * 2);
      const speed = Utils.rand(60, 180);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        color: Utils.choice(colors || ['#F6CE55', '#F28C77', '#7FD8B0', '#FFF']),
        size: Utils.rand(3, 6)
      });
    }
  },

  _spawnItem(){
    const isFish = Math.random() < 0.16;
    const r = isFish ? Utils.rand(16, 20) : Utils.rand(22, 30);
    this.items.push({
      type: isFish ? 'fish' : 'food',
      x: Utils.rand(r, this.width - r),
      y: -r,
      r,
      vy: Utils.rand(70, 110) + (30 - this.timeLeft) * 2,
      rot: Utils.rand(0, Math.PI * 2),
      vrot: Utils.rand(-1.5, 1.5)
    });
  },

  _loop(ts){
    if(!this.running) return;
    const dt = Math.min(0.05, (ts - this._lastTs) / 1000);
    this._lastTs = ts;

    this._update(dt);
    this._draw();

    if(this.timeLeft > 0 && this.lives > 0){
      requestAnimationFrame((t) => this._loop(t));
    }else{
      this.running = false;
      if(this.onFinish) this.onFinish({caught: this.caught, fishCaught: this.fishCaught, timeUp: this.timeLeft <= 0});
    }
  },

  _update(dt){
    this.timeLeft -= dt;
    document.getElementById('mg-time').textContent = Utils.formatSeconds(this.timeLeft);

    this.spawnTimer += dt * 1000;
    this.difficultyTimer += dt * 1000;
    if(this.difficultyTimer > 4000){
      this.difficultyTimer = 0;
      this.spawnInterval = Math.max(420, this.spawnInterval - 60);
    }
    if(this.spawnTimer > this.spawnInterval){
      this.spawnTimer = 0;
      this._spawnItem();
    }

    for(let i = this.items.length - 1; i >= 0; i--){
      const it = this.items[i];
      it.y += it.vy * dt;
      it.rot += it.vrot * dt;
      if(it.y - it.r > this.height){
        this.items.splice(i, 1);
        if(it.type !== 'fish'){
          this.lives--;
          this._renderLives();
          Sound.miss();
        }
      }
    }

    for(let i = this.particles.length - 1; i >= 0; i--){
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 260 * dt;
      p.life -= dt * 1.6;
      if(p.life <= 0) this.particles.splice(i, 1);
    }
  },

  _draw(){
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // linha de "chão" indicando perigo
    ctx.save();
    ctx.strokeStyle = 'rgba(217,105,79,.35)';
    ctx.setLineDash([8, 8]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.height - 6);
    ctx.lineTo(this.width, this.height - 6);
    ctx.stroke();
    ctx.restore();

    this.items.forEach(it => {
      ctx.save();
      ctx.translate(it.x, it.y);
      ctx.rotate(it.type === 'fish' ? 0 : it.rot);
      if(it.type === 'fish'){
        const img = this.fishImg;
        if(img.complete && img.naturalWidth){
          const w = it.r * 1.8;
          const h = w * (img.naturalHeight / img.naturalWidth);
          ctx.drawImage(img, -w / 2, -h * 0.32, w, h);
        }else{
          ctx.fillStyle = '#7EC8E3';
          ctx.beginPath();
          ctx.arc(0, 0, it.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }else{
        const size = it.r * 2;
        if(this.foodImg.complete && this.foodImg.naturalWidth){
          ctx.drawImage(this.foodImg, -size / 2, -size / 2 * 0.55, size, size * 0.55);
        }else{
          ctx.fillStyle = '#F6CE55';
          ctx.beginPath();
          ctx.arc(0, 0, it.r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    });

    this.particles.forEach(p => {
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });
  }
};
