// ---------- birdgame.js ----------
// Motor do "Jogo do Pássaro" (estilo Flappy Bird), usado como uma das opções
// ao clicar em "Alimentar". Tudo fica isolado dentro de um IIFE pra não
// colidir com as variáveis do jogo do gato (ex: `state`, `frame`, `draw`...).
// Uso: BirdGame.init() uma vez no boot; BirdGame.start(onFinish) pra jogar.
// onFinish recebe { coins, reason } quando as 3 vidas acabam.

const BirdGame = (function () {
  const W = 480;
  const H = 720;

  const GRAVITY = 0.45;
  const FLAP_STRENGTH = -8;
  const MAX_FALL_SPEED = 10;
  const GROUND_HEIGHT = 90;
  const TREE_GAP = 190;
  const TREE_WIDTH = 84;
  const TREE_SPACING = 260;
  const WORLD_SPEED = 3;
  const INVINCIBLE_DURATION = 90; // ~1.5s a 60fps

  let canvas, ctx, batImg;
  let running = false;
  let onFinish = null;
  let boundListeners = false;

  let frame, coinsCollected, scrollX, lives, invincibleFrames, deathReason;
  let bird, trees, coinList, clouds, particles, bats, nextBatFrame;

  function resetState() {
    bird = { x: W * 0.28, y: H * 0.4, vy: 0, radius: 22, rotation: 0, flapPhase: 0 };
    frame = 0;
    coinsCollected = 0;
    scrollX = 0;
    trees = [];
    coinList = [];
    particles = [];
    bats = [];
    nextBatFrame = 180 + Math.random() * 120;
    lives = 3;
    invincibleFrames = 0;
    deathReason = 'fall';

    let startX = W + 100;
    for (let i = 0; i < 4; i++) {
      spawnTreePair(startX + i * TREE_SPACING);
    }

    clouds = [];
    for (let i = 0; i < 5; i++) {
      clouds.push({
        x: Math.random() * W,
        y: 40 + Math.random() * 180,
        scale: 0.6 + Math.random() * 0.8,
        speed: 0.3 + Math.random() * 0.4,
      });
    }

    updateCoinsUI();
    updateLivesUI();
  }

  function spawnTreePair(x) {
    const minGapY = 120;
    const maxGapY = H - GROUND_HEIGHT - 120;
    const gapCenter = minGapY + Math.random() * (maxGapY - minGapY);
    const topHeight = gapCenter - TREE_GAP / 2;
    const bottomY = gapCenter + TREE_GAP / 2;

    trees.push({
      x,
      topHeight,
      bottomY,
      bottomHeight: H - GROUND_HEIGHT - bottomY,
      passed: false,
      sway: Math.random() * Math.PI * 2,
    });

    coinList.push({
      x: x + TREE_WIDTH / 2,
      y: gapCenter,
      collected: false,
      bob: Math.random() * Math.PI * 2,
    });
  }

  function spawnBat() {
    const y = 80 + Math.random() * (H - GROUND_HEIGHT - 160);
    bats.push({
      x: W + 60,
      y,
      speed: 3.2 + Math.random() * 1.4,
      radius: 26,
      wingPhase: Math.random() * Math.PI * 2,
      bobSpeed: 1 + Math.random() * 1.5,
      phaseOffset: Math.random() * Math.PI * 2,
      bitten: false,
    });
  }

  function updateCoinsUI() {
    const el = document.getElementById('bird-coins');
    if (el) el.textContent = String(coinsCollected);
  }

  function updateLivesUI() {
    const el = document.getElementById('bird-lives');
    if (el) el.textContent = '❤️'.repeat(Math.max(0, lives)) + '🖤'.repeat(3 - Math.max(0, lives));
  }

  // ---------- Input ----------
  function flap() {
    if (!running) return;
    bird.vy = FLAP_STRENGTH;
    bird.flapPhase = 0;
    particles.push({
      x: bird.x - 10,
      y: bird.y + 10,
      vx: -2 - Math.random(),
      vy: 1 + Math.random(),
      life: 20,
      r: 3 + Math.random() * 2,
    });
  }

  function bindInputOnce() {
    if (boundListeners) return;
    boundListeners = true;

    window.addEventListener('keydown', (e) => {
      if (!running) return;
      if (e.code === 'Space' || e.code === 'ArrowUp') {
        e.preventDefault();
        flap();
      }
    });
    canvas.addEventListener('mousedown', flap);
    canvas.addEventListener(
      'touchstart',
      (e) => {
        if (!running) return;
        e.preventDefault();
        flap();
      },
      { passive: false }
    );
  }

  function loseLife(reason) {
    if (invincibleFrames > 0 || !running) return;
    lives--;
    updateLivesUI();
    invincibleFrames = INVINCIBLE_DURATION;
    bird.vy = FLAP_STRENGTH * 0.6;
    particles.push(
      ...Array.from({ length: 8 }, () => ({
        x: bird.x,
        y: bird.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6 - 2,
        life: 24,
        r: 2 + Math.random() * 3,
      }))
    );

    if (lives <= 0) {
      endGame(reason);
    }
  }

  function endGame(reason) {
    running = false;
    deathReason = reason || 'fall';
    if (onFinish) onFinish({ coins: coinsCollected, reason: deathReason });
  }

  // ---------- Update ----------
  function update() {
    frame++;

    bird.vy += GRAVITY;
    if (bird.vy > MAX_FALL_SPEED) bird.vy = MAX_FALL_SPEED;
    bird.y += bird.vy;
    bird.rotation = Math.max(-0.5, Math.min(1.2, bird.vy / 10));
    bird.flapPhase += 0.35;

    if (bird.y + bird.radius > H - GROUND_HEIGHT) {
      bird.y = H - GROUND_HEIGHT - bird.radius;
      loseLife('fall');
    }
    if (bird.y - bird.radius < 0) {
      bird.y = bird.radius;
      bird.vy = 0;
    }

    if (invincibleFrames > 0) invincibleFrames--;

    for (const t of trees) {
      t.x -= WORLD_SPEED;
      t.sway += 0.01;
    }
    while (trees.length && trees[0].x + TREE_WIDTH < -20) {
      trees.shift();
    }
    const last = trees[trees.length - 1];
    if (last.x < W + 100 - TREE_SPACING) {
      spawnTreePair(last.x + TREE_SPACING);
    }

    for (const c of coinList) {
      c.x -= WORLD_SPEED;
      c.bob += 0.08;
    }
    while (coinList.length && coinList[0].x < -30) {
      coinList.shift();
    }

    for (const cl of clouds) {
      cl.x -= cl.speed;
      if (cl.x < -80) cl.x = W + 80;
    }

    for (const p of particles) {
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
    }
    particles = particles.filter((p) => p.life > 0);

    for (const t of trees) {
      if (bird.x + bird.radius * 0.7 > t.x && bird.x - bird.radius * 0.7 < t.x + TREE_WIDTH) {
        if (bird.y - bird.radius * 0.7 < t.topHeight || bird.y + bird.radius * 0.7 > t.bottomY) {
          loseLife('fall');
        }
      }
    }

    nextBatFrame--;
    if (nextBatFrame <= 0) {
      spawnBat();
      nextBatFrame = 260 + Math.random() * 200;
    }
    for (const b of bats) {
      b.x -= b.speed;
      b.wingPhase += 0.3;
      b.y += Math.sin(frame * 0.05 + b.phaseOffset) * b.bobSpeed;
      b.y = Math.max(60, Math.min(H - GROUND_HEIGHT - 60, b.y));
    }
    bats = bats.filter((b) => b.x > -80);

    for (const b of bats) {
      if (b.bitten) continue;
      const dx = bird.x - b.x;
      const dy = bird.y - b.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bird.radius + b.radius - 8) {
        loseLife('bat');
        b.bitten = true;
        b.x = -999;
      }
    }

    for (const c of coinList) {
      if (c.collected) continue;
      const dx = bird.x - c.x;
      const dy = bird.y - (c.y + Math.sin(c.bob) * 6);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < bird.radius + 14) {
        c.collected = true;
        coinsCollected++;
        updateCoinsUI();
        if (typeof Sound !== 'undefined') Sound.coin();
      }
    }
  }

  // ---------- Drawing ----------
  function drawBackground() {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#7ec8e3');
    grad.addColorStop(0.65, '#a8e6cf');
    grad.addColorStop(1, '#dff5e1');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (const cl of clouds) {
      drawCloud(cl.x, cl.y, cl.scale);
    }

    ctx.fillStyle = '#bfe6a8';
    ctx.beginPath();
    ctx.moveTo(0, H - GROUND_HEIGHT - 30);
    for (let x = 0; x <= W; x += 40) {
      const y = H - GROUND_HEIGHT - 30 - Math.sin((x + frame * 0.5) * 0.01) * 14;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(W, H - GROUND_HEIGHT);
    ctx.lineTo(0, H - GROUND_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  function drawCloud(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.arc(22, -8, 16, 0, Math.PI * 2);
    ctx.arc(40, 0, 20, 0, Math.PI * 2);
    ctx.arc(20, 8, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawGround() {
    const groundY = H - GROUND_HEIGHT;
    ctx.fillStyle = '#c98a4b';
    ctx.fillRect(0, groundY, W, GROUND_HEIGHT);
    ctx.fillStyle = '#5cb85c';
    ctx.fillRect(0, groundY, W, 14);

    ctx.strokeStyle = '#4a9e4a';
    ctx.lineWidth = 3;
    const offset = -(scrollX % 24);
    for (let x = offset; x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, groundY + 10);
      ctx.lineTo(x + 6, groundY - 2);
      ctx.moveTo(x + 8, groundY + 10);
      ctx.lineTo(x + 14, groundY - 4);
      ctx.stroke();
    }
    scrollX += WORLD_SPEED;
  }

  function drawTree(t) {
    const groundY = H - GROUND_HEIGHT;
    const sway = Math.sin(t.sway) * 2;
    drawSingleTree(t.x, 0, t.topHeight, true, sway);
    drawSingleTree(t.x, t.bottomY, groundY - t.bottomY, false, sway);
  }

  function drawSingleTree(x, y, height, hanging, sway) {
    if (height <= 0) return;
    const cx = x + TREE_WIDTH / 2;
    const trunkW = 26;

    ctx.save();

    const trunkGrad = ctx.createLinearGradient(x, 0, x + TREE_WIDTH, 0);
    trunkGrad.addColorStop(0, '#8a5a34');
    trunkGrad.addColorStop(0.5, '#a97542');
    trunkGrad.addColorStop(1, '#7a4c2a');
    ctx.fillStyle = trunkGrad;

    if (hanging) {
      ctx.fillRect(cx - trunkW / 2, y, trunkW, height);
      drawFoliageCluster(cx + sway, y + height, TREE_WIDTH, true);
    } else {
      ctx.fillRect(cx - trunkW / 2, y, trunkW, height);
      drawFoliageCluster(cx + sway, y, TREE_WIDTH, false);
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    for (let i = 1; i < height / 30; i++) {
      ctx.beginPath();
      ctx.moveTo(cx - trunkW / 2 + 3, y + i * 30);
      ctx.lineTo(cx + trunkW / 2 - 3, y + i * 30 + 6);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFoliageCluster(cx, edgeY, width, hanging) {
    const leafColors = ['#3f9142', '#4caf50', '#66bb6a'];
    const puffs = hanging
      ? [
          { dx: -width * 0.32, dy: -18, r: 34 },
          { dx: 0, dy: -6, r: 40 },
          { dx: width * 0.32, dy: -18, r: 34 },
          { dx: -width * 0.15, dy: -38, r: 28 },
          { dx: width * 0.15, dy: -38, r: 28 },
        ]
      : [
          { dx: -width * 0.32, dy: 18, r: 34 },
          { dx: 0, dy: 6, r: 40 },
          { dx: width * 0.32, dy: 18, r: 34 },
          { dx: -width * 0.15, dy: 38, r: 28 },
          { dx: width * 0.15, dy: 38, r: 28 },
        ];

    puffs.forEach((p, i) => {
      ctx.fillStyle = leafColors[i % leafColors.length];
      ctx.beginPath();
      ctx.arc(cx + p.dx, edgeY + p.dy, p.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.arc(cx - width * 0.1, edgeY + (hanging ? -30 : 30), 16, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCoin(c) {
    if (c.collected) return;
    const bobY = c.y + Math.sin(c.bob) * 6;
    ctx.save();
    ctx.translate(c.x, bobY);
    const squish = Math.abs(Math.cos(c.bob * 0.7));
    ctx.scale(0.5 + squish * 0.5, 1);

    const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, 14);
    grad.addColorStop(0, '#fff6c8');
    grad.addColorStop(0.5, '#ffd93d');
    grad.addColorStop(1, '#d49a00');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#b87e00';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#b87e00';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', 0, 1);

    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.fillStyle = `rgba(255,255,255,${p.life / 20})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawBat(b) {
    const wingSquash = Math.sin(b.wingPhase) * 0.18;
    const w = b.radius * 2.6;
    const h = b.radius * 1.9;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.scale(1, 1 + wingSquash);
    if (batImg.complete && batImg.naturalWidth > 0) {
      ctx.drawImage(batImg, -w / 2, -h / 2, w, h);
    } else {
      ctx.fillStyle = '#4b3b6b';
      ctx.beginPath();
      ctx.ellipse(0, 0, b.radius, b.radius * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBird() {
    ctx.save();
    ctx.translate(bird.x, bird.y);
    ctx.rotate(bird.rotation);

    if (invincibleFrames > 0 && Math.floor(invincibleFrames / 6) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const wingFlap = Math.sin(bird.flapPhase) * 14;

    ctx.fillStyle = '#f4b93c';
    ctx.beginPath();
    ctx.ellipse(-6, 4 + wingFlap * 0.3, 13, 8 + Math.abs(wingFlap) * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();

    const bodyGrad = ctx.createRadialGradient(-6, -8, 4, 0, 0, bird.radius + 4);
    bodyGrad.addColorStop(0, '#fff5b0');
    bodyGrad.addColorStop(0.5, '#ffd93d');
    bodyGrad.addColorStop(1, '#f5b800');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f5a623';
    ctx.beginPath();
    ctx.moveTo(-bird.radius + 2, -4);
    ctx.lineTo(-bird.radius - 12, -10);
    ctx.lineTo(-bird.radius - 12, 2);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = 'rgba(255,120,120,0.35)';
    ctx.beginPath();
    ctx.arc(2, 6, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(7, -6, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath();
    ctx.arc(9, -6, 3.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(10.3, -7.3, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ff8c1a';
    ctx.beginPath();
    ctx.moveTo(bird.radius - 6, -2);
    ctx.lineTo(bird.radius + 12, 2);
    ctx.lineTo(bird.radius - 6, 8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#d16d00';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.strokeStyle = '#f5a623';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-4, -bird.radius + 2);
    ctx.lineTo(-8, -bird.radius - 8);
    ctx.stroke();

    ctx.restore();
  }

  function draw() {
    drawBackground();
    for (const t of trees) drawTree(t);
    for (const c of coinList) drawCoin(c);
    for (const b of bats) drawBat(b);
    drawParticles();
    drawBird();
    drawGround();
  }

  function loop() {
    if (running) {
      update();
      draw();
      requestAnimationFrame(loop);
    } else {
      draw();
    }
  }

  return {
    init() {
      canvas = document.getElementById('bird-canvas');
      ctx = canvas.getContext('2d');
      batImg = new Image();
      batImg.src = 'bat.png';
      bindInputOnce();
    },

    start(callback) {
      onFinish = callback;
      resetState();
      running = true;
      requestAnimationFrame(loop);
    },

    stop() {
      running = false;
    },
  };
})();
