const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over');
const finalScoreEl = document.getElementById('final-score');

let W, H;
let player, obstacles, particles, score, gameRunning, gameOver;
let lastTime = 0, obstacleTimer = 0;
let difficulty = 1;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

function initGame() {
  player = {
    x: W / 2,
    y: H - 100,
    w: 40,
    h: 40,
    color: '#0ff',
    speed: 0,
    targetX: W / 2
  };
  obstacles = [];
  particles = [];
  score = 0;
  gameRunning = true;
  gameOver = false;
  difficulty = 1;
  obstacleTimer = 0;
  scoreEl.textContent = '分数: 0';
  gameOverScreen.classList.add('hidden');
  startScreen.classList.add('hidden');
}

// Touch & mouse controls
let inputActive = false;
let inputX = W / 2;

function handleInput(x) {
  inputX = x;
  inputActive = true;
}

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  handleInput(e.touches[0].clientX);
});
canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  handleInput(e.touches[0].clientX);
});
canvas.addEventListener('touchend', () => inputActive = false);
canvas.addEventListener('mousemove', (e) => handleInput(e.clientX));
canvas.addEventListener('mouseup', () => inputActive = false);

document.getElementById('start-btn').addEventListener('click', initGame);
document.getElementById('restart-btn').addEventListener('click', initGame);

function spawnObstacle() {
  const size = 20 + Math.random() * 30;
  obstacles.push({
    x: Math.random() * (W - size),
    y: -size,
    w: size,
    h: size,
    speed: 2 + Math.random() * 2 + difficulty * 0.3,
    color: `hsl(${Math.random() * 60 + 340}, 80%, 60%)`
  });
}

function spawnParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 8,
      vy: (Math.random() - 0.5) * 8,
      life: 1,
      color,
      size: 2 + Math.random() * 4
    });
  }
}

function update(dt) {
  if (!gameRunning) return;

  // Player movement
  if (inputActive) {
    player.x += (inputX - player.w / 2 - player.x) * 0.15;
  }
  player.x = Math.max(0, Math.min(W - player.w, player.x));

  // Spawn obstacles
  obstacleTimer += dt;
  const spawnRate = Math.max(200, 800 - difficulty * 50);
  if (obstacleTimer > spawnRate) {
    spawnObstacle();
    obstacleTimer = 0;
  }

  // Increase difficulty
  difficulty += dt * 0.0001;

  // Update obstacles
  for (let i = obstacles.length - 1; i >= 0; i--) {
    const o = obstacles[i];
    o.y += o.speed;

    // Collision detection
    if (
      player.x < o.x + o.w &&
      player.x + player.w > o.x &&
      player.y < o.y + o.h &&
      player.y + player.h > o.y
    ) {
      gameRunning = false;
      gameOver = true;
      spawnParticles(player.x + player.w / 2, player.y + player.h / 2, '#0ff', 30);
      spawnParticles(o.x + o.w / 2, o.y + o.h / 2, o.color, 20);
      finalScoreEl.textContent = `分数: ${score}`;
      gameOverScreen.classList.remove('hidden');
      return;
    }

    // Remove off-screen obstacles
    if (o.y > H) {
      obstacles.splice(i, 1);
      score++;
      scoreEl.textContent = `分数: ${score}`;
    }
  }

  // Update particles
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.03;
    p.vy += 0.1;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function draw() {
  // Background
  ctx.fillStyle = '#1a1a2e';
  ctx.fillRect(0, 0, W, H);

  // Grid effect
  ctx.strokeStyle = 'rgba(255,255,255,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y < H; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Player
  if (gameRunning) {
    ctx.shadowBlur = 20;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.w, player.h);
    ctx.shadowBlur = 0;
  }

  // Obstacles
  for (const o of obstacles) {
    ctx.shadowBlur = 10;
    ctx.shadowColor = o.color;
    ctx.fillStyle = o.color;
    ctx.fillRect(o.x, o.y, o.w, o.h);
    ctx.shadowBlur = 0;
  }

  // Particles
  for (const p of particles) {
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x, p.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
}

function gameLoop(timestamp) {
  const dt = timestamp - lastTime;
  lastTime = timestamp;

  update(dt);
  draw();
  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
