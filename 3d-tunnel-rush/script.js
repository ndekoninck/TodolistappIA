const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const speedEl = document.getElementById("speed");
const startBtn = document.getElementById("startBtn");
const messageEl = document.getElementById("message");

const state = {
  running: false,
  score: 0,
  speed: 1,
  level: 1,
  lastTime: 0,
  keys: {},
  player: { x: 0, y: 0, vx: 0, vy: 0, radius: 18 },
  trail: [],
  normalShots: [],
  walls: [],
  pickups: [],
  spawnWallTimer: 0,
  spawnPickupTimer: 0,
  boss: {
    x: 0,
    y: 0,
    z: 1.22,
    phase: 0,
    type: "dragon",
    hp: 10,
    maxHp: 10,
    canBeAttacked: false,
    defeated: false,
    attackUnlockScore: 100,
    normalHitCount: 0,
    hitsForSpecial: 10,
    specialReady: false,
    specialFxTime: 0
  }
};

const bossCycle = ["dragon", "tiger", "bear"];

const tunnel = {
  radius: 220,
  depth: 900,
  nearZ: 0.14,
  farZ: 1.1
};

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function startGame() {
  state.running = true;
  state.score = 0;
  state.speed = 1;
  state.level = 1;
  state.lastTime = 0;
  state.spawnWallTimer = 0;
  state.spawnPickupTimer = 0;
  state.player.x = 0;
  state.player.y = 0;
  state.player.vx = 0;
  state.player.vy = 0;
  state.trail.length = 0;
  state.walls.length = 0;
  state.normalShots.length = 0;
  state.pickups.length = 0;
  state.boss.phase = 0;
  state.boss.type = "dragon";
  state.boss.hp = 10;
  state.boss.maxHp = 10;
  state.boss.attackUnlockScore = 100;
  state.boss.canBeAttacked = false;
  state.boss.defeated = false;
  state.boss.normalHitCount = 0;
  state.boss.specialReady = false;
  state.boss.specialFxTime = 0;
  scoreEl.textContent = "0";
  speedEl.textContent = "1.0x";
  startBtn.disabled = true;
  messageEl.textContent = "Fusee en vol... evite les boules de feu !";
}

function endGame() {
  state.running = false;
  startBtn.disabled = false;
  messageEl.textContent = `Ta fusee a ete touchee. Score final: ${Math.floor(state.score)}`;
}

function spawnWall() {
  const spread = 68 + Math.random() * 42;
  const baseX = state.boss.x;
  const baseY = state.boss.y;
  const angle = Math.random() * Math.PI * 2;
  const spawnX = baseX + Math.cos(angle) * spread;
  const spawnY = baseY + Math.sin(angle) * spread;
  state.walls.push({
    x: spawnX,
    y: spawnY,
    z: tunnel.farZ,
    size: 44 + Math.random() * 24,
    prevX: spawnX,
    prevY: spawnY,
    flicker: Math.random() * Math.PI * 2
  });
}

function spawnPickup() {
  const angle = Math.random() * Math.PI * 2;
  const r = tunnel.radius * 0.55;
  state.pickups.push({
    x: Math.cos(angle) * r,
    y: Math.sin(angle) * r,
    z: tunnel.farZ,
    size: 24
  });
}

function worldToScreen(x, y, z) {
  const k = 1 / Math.max(0.06, z);
  return {
    sx: canvas.width / 2 + x * k,
    sy: canvas.height / 2 + y * k,
    scale: k
  };
}

function movePlayer(dt) {
  const inputX = (state.keys.ArrowRight || state.keys.KeyD ? 1 : 0) - (state.keys.ArrowLeft || state.keys.KeyQ ? 1 : 0);
  const inputY = (state.keys.ArrowDown || state.keys.KeyS ? 1 : 0) - (state.keys.ArrowUp || state.keys.KeyZ ? 1 : 0);
  const targetVx = inputX * 260;
  const targetVy = inputY * 260;
  const smooth = Math.min(1, dt * 10);
  state.player.vx += (targetVx - state.player.vx) * smooth;
  state.player.vy += (targetVy - state.player.vy) * smooth;
  state.player.x += state.player.vx * dt;
  state.player.y += state.player.vy * dt;

  const dist = Math.hypot(state.player.x, state.player.y);
  const maxDist = tunnel.radius * 0.72;
  if (dist > maxDist) {
    const ratio = maxDist / dist;
    state.player.x *= ratio;
    state.player.y *= ratio;
  }

  if (state.running) {
    state.trail.push({
      x: state.player.x,
      y: state.player.y,
      life: 0.65
    });
  }
}

function update(dt) {
  if (!state.running) {
    return;
  }

  movePlayer(dt);
  state.boss.phase += dt;
  state.boss.x = Math.sin(state.boss.phase * 0.9) * 110;
  state.boss.y = Math.cos(state.boss.phase * 1.1) * 85;
  const targetBossZ = state.boss.canBeAttacked ? 0.72 : 1.22;
  state.boss.z += (targetBossZ - state.boss.z) * Math.min(1, dt * 4);
  state.speed = Math.min(3.6, 1 + state.score / 450 + (state.level - 1) * 0.22);
  const zSpeed = dt * 0.9 * state.speed;
  const gemSpeed = zSpeed * 0.55;

  state.spawnWallTimer += dt;
  state.spawnPickupTimer += dt;

  if (state.spawnWallTimer > Math.max(0.2, 0.82 - state.speed * 0.14)) {
    state.spawnWallTimer = 0;
    spawnWall();
  }
  if (state.spawnPickupTimer > 1.1) {
    state.spawnPickupTimer = 0;
    spawnPickup();
  }

  for (let i = state.walls.length - 1; i >= 0; i -= 1) {
    const wall = state.walls[i];
    wall.prevX = wall.x;
    wall.prevY = wall.y;
    wall.flicker += dt * 14;
    wall.x += Math.sin(wall.flicker) * dt * 22;
    wall.y += Math.cos(wall.flicker * 0.9) * dt * 22;
    wall.z -= zSpeed;
    if (wall.z <= tunnel.nearZ) {
      const hit = Math.hypot(state.player.x - wall.x, state.player.y - wall.y) < (state.player.radius + wall.size * 0.4);
      if (hit) {
        endGame();
        return;
      }
      state.walls.splice(i, 1);
      state.score += 7;
    }
  }

  for (let i = state.pickups.length - 1; i >= 0; i -= 1) {
    const p = state.pickups[i];
    // Gems move slower than fireballs to make them catchable.
    p.z -= gemSpeed;
    if (p.z <= tunnel.nearZ) {
      const take = Math.hypot(state.player.x - p.x, state.player.y - p.y) < (state.player.radius + p.size * 0.45);
      if (take) {
        state.score += 90;
        if (!state.boss.canBeAttacked) {
          messageEl.textContent = `Gem capturee ! +90 points (${Math.floor(state.score)}/${state.boss.attackUnlockScore})`;
        }
      }
      state.pickups.splice(i, 1);
    }
  }

  for (let i = state.trail.length - 1; i >= 0; i -= 1) {
    state.trail[i].life -= dt;
    if (state.trail[i].life <= 0) {
      state.trail.splice(i, 1);
    }
  }

  for (let i = state.normalShots.length - 1; i >= 0; i -= 1) {
    const shot = state.normalShots[i];
    shot.x += shot.vx * dt;
    shot.y += shot.vy * dt;
    shot.z += shot.vz * dt;
    shot.life -= dt;
    shot.jitter += dt * 30;

    if (shot.life <= 0) {
      state.normalShots.splice(i, 1);
      continue;
    }

    const bossDist = Math.hypot(shot.x - state.boss.x, shot.y - state.boss.y);
    if (shot.z >= state.boss.z - 0.02 && bossDist < 26) {
      state.normalShots.splice(i, 1);
      applyBossDamage(1, false);
    }
  }

  if (state.boss.specialFxTime > 0) {
    state.boss.specialFxTime = Math.max(0, state.boss.specialFxTime - dt);
  }

  if (!state.boss.canBeAttacked && state.score >= state.boss.attackUnlockScore) {
    state.boss.canBeAttacked = true;
    messageEl.textContent = "Boss vulnerable ! Appuie sur F pour attaquer.";
  }

  scoreEl.textContent = String(Math.floor(state.score));
  speedEl.textContent = `${state.speed.toFixed(1)}x`;
}

function setupNextBossLevel() {
  state.level += 1;
  state.boss.type = bossCycle[(state.level - 1) % bossCycle.length];
  state.boss.maxHp = Math.min(28, 10 + (state.level - 1) * 4);
  state.boss.hp = state.boss.maxHp;
  state.boss.canBeAttacked = false;
  state.boss.defeated = false;
  state.boss.normalHitCount = 0;
  state.boss.specialReady = false;
  state.boss.specialFxTime = 0;
  state.boss.attackUnlockScore += 2500 + state.level * 400;
  state.walls.length = 0;
  state.pickups.length = 0;
  messageEl.textContent = `Niveau ${state.level} ! Nouveau boss (${state.boss.type}). Debloque son attaque a ${state.boss.attackUnlockScore} points.`;
}

function registerBossNormalHit() {
  if (!state.running || !state.boss.canBeAttacked || state.boss.defeated) {
    return;
  }
  const startZ = tunnel.nearZ + 0.03;
  const dz = Math.max(0.001, state.boss.z - startZ);
  state.normalShots.push({
    x: state.player.x,
    y: state.player.y,
    z: startZ,
    vx: (state.boss.x - state.player.x) / dz * 0.78,
    vy: (state.boss.y - state.player.y) / dz * 0.78,
    vz: 0.78,
    life: 2.2,
    jitter: Math.random() * Math.PI * 2
  });
  messageEl.textContent = "Tir electrique lance !";
}

function registerBossSpecialHit() {
  if (!state.running || !state.boss.canBeAttacked || state.boss.defeated || !state.boss.specialReady) {
    return;
  }
  applyBossDamage(10, true);
  messageEl.textContent = "ATTAQUE SPECIALE !";
}

function applyBossDamage(damage, isSpecial) {
  state.boss.hp -= damage;
  state.score += isSpecial ? 220 : 35;
  if (isSpecial) {
    state.boss.normalHitCount = 0;
    state.boss.specialReady = false;
    state.boss.specialFxTime = 0.45;
  } else {
    state.boss.normalHitCount += 1;
    if (state.boss.normalHitCount >= state.boss.hitsForSpecial) {
      state.boss.specialReady = true;
    }
  }

  if (state.boss.hp <= 0) {
    state.boss.defeated = true;
    state.score += isSpecial ? 600 : 400;
    setupNextBossLevel();
    return;
  }
  messageEl.textContent = `Boss HP: ${state.boss.hp}/${state.boss.maxHp}`;
}

function drawTunnel() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.fillStyle = "#060a14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < 18; i += 1) {
    const t = i / 17;
    const z = tunnel.nearZ + (tunnel.farZ - tunnel.nearZ) * t;
    const scale = 1 / z;
    const r = tunnel.radius * scale;
    ctx.strokeStyle = `rgba(110, 145, 255, ${0.16 + (1 - t) * 0.4})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawBoss() {
  const boss = worldToScreen(state.boss.x, state.boss.y, state.boss.z);
  const s = 74 * boss.scale;
  const pulse = 1 + Math.sin(state.boss.phase * 3.2) * 0.08;
  const bodyW = s * 1.9 * pulse;
  const bodyH = s * 1.3 * pulse;
  const shadowW = bodyW * 0.95;
  const shadowH = bodyH * 0.26;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(boss.sx, boss.sy + bodyH * 0.72, shadowW, shadowH, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.boss.type === "dragon") {
    drawDragonBoss(boss.sx, boss.sy, bodyW, bodyH);
  } else if (state.boss.type === "tiger") {
    drawTigerBoss(boss.sx, boss.sy, bodyW, bodyH);
  } else {
    drawBearBoss(boss.sx, boss.sy, bodyW, bodyH);
  }

  // Boss life / objective
  const barW = 220;
  const barH = 12;
  const bx = canvas.width / 2 - barW / 2;
  const by = 20;
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fillRect(bx, by, barW, barH);
  const ratio = state.boss.hp / state.boss.maxHp;
  ctx.fillStyle = "#b56cff";
  ctx.fillRect(bx, by, barW * Math.max(0, ratio), barH);
  ctx.strokeStyle = "#ffffff";
  ctx.strokeRect(bx, by, barW, barH);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  if (state.boss.canBeAttacked) {
    ctx.fillText("Boss vulnerable ! F = attaque | Espace = attaque speciale", bx, by + 30);
  } else {
    ctx.fillText(`Debloque l'attaque du boss a ${state.boss.attackUnlockScore} points`, bx, by + 30);
  }
}

function drawAttackHud() {
  if (!state.boss.canBeAttacked) {
    return;
  }

  const baseY = canvas.height - 42;
  const baseX = 20;

  // Normal attack orb (green)
  ctx.fillStyle = "#1b2a1d";
  ctx.fillRect(baseX - 8, baseY - 26, 220, 44);
  ctx.beginPath();
  ctx.arc(baseX + 18, baseY - 4, 12, 0, Math.PI * 2);
  ctx.fillStyle = "#45e06d";
  ctx.fill();
  ctx.fillStyle = "#d4ffe1";
  ctx.font = "bold 14px Arial";
  ctx.fillText(
    `F attaque (${state.boss.normalHitCount}/${state.boss.hitsForSpecial})`,
    baseX + 40,
    baseY
  );

  // Special attack star
  const sx = baseX + 300;
  const sy = baseY - 2;
  ctx.fillStyle = state.boss.specialReady ? "#fff0a6" : "rgba(255,255,255,0.2)";
  ctx.beginPath();
  for (let i = 0; i < 10; i += 1) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? 14 : 6;
    const px = sx + Math.cos(a) * rr;
    const py = sy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = state.boss.specialReady ? "#fff7d1" : "rgba(255,255,255,0.45)";
  ctx.fillText(state.boss.specialReady ? "ESPACE: SPECIAL x10" : "Special en charge...", sx + 24, baseY);
}

function drawSpecialExplosion() {
  if (state.boss.specialFxTime <= 0) {
    return;
  }
  const t = state.boss.specialFxTime / 0.45;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = (1 - t) * 240;
  ctx.globalAlpha = Math.max(0, t * 0.9);
  ctx.fillStyle = "#ffe78c";
  ctx.beginPath();
  for (let i = 0; i < 12; i += 1) {
    const a = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawDragonBoss(x, y, bodyW, bodyH) {
  ctx.fillStyle = "#4e0f6f";
  ctx.beginPath();
  ctx.moveTo(x - bodyW * 0.42, y);
  ctx.lineTo(x - bodyW * 1.15, y - bodyH * 0.6);
  ctx.lineTo(x - bodyW * 1.0, y + bodyH * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + bodyW * 0.42, y);
  ctx.lineTo(x + bodyW * 1.15, y - bodyH * 0.6);
  ctx.lineTo(x + bodyW * 1.0, y + bodyH * 0.4);
  ctx.closePath();
  ctx.fill();

  const bossGrad = ctx.createRadialGradient(x, y - bodyH * 0.2, bodyW * 0.2, x, y, bodyW);
  bossGrad.addColorStop(0, "#d2a8ff");
  bossGrad.addColorStop(1, "#3f0f62");
  ctx.fillStyle = bossGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW * 0.52, bodyH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#e5d4ff";
  ctx.beginPath();
  ctx.moveTo(x - bodyW * 0.18, y - bodyH * 0.32);
  ctx.lineTo(x - bodyW * 0.1, y - bodyH * 0.82);
  ctx.lineTo(x - bodyW * 0.02, y - bodyH * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + bodyW * 0.18, y - bodyH * 0.32);
  ctx.lineTo(x + bodyW * 0.1, y - bodyH * 0.82);
  ctx.lineTo(x + bodyW * 0.02, y - bodyH * 0.28);
  ctx.closePath();
  ctx.fill();
  drawBossEyes(x, y, bodyW, bodyH, "#ffd8f4");
}

function drawTigerBoss(x, y, bodyW, bodyH) {
  const tigerGrad = ctx.createRadialGradient(x, y - bodyH * 0.3, bodyW * 0.2, x, y, bodyW);
  tigerGrad.addColorStop(0, "#ffd197");
  tigerGrad.addColorStop(1, "#b45309");
  ctx.fillStyle = tigerGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW * 0.52, bodyH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#7c2d12";
  for (let i = -2; i <= 2; i += 1) {
    ctx.fillRect(x + i * bodyW * 0.13, y - bodyH * 0.35, bodyW * 0.045, bodyH * 0.72);
  }
  ctx.fillStyle = "#f59e0b";
  ctx.beginPath();
  ctx.moveTo(x - bodyW * 0.35, y - bodyH * 0.36);
  ctx.lineTo(x - bodyW * 0.2, y - bodyH * 0.72);
  ctx.lineTo(x - bodyW * 0.08, y - bodyH * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + bodyW * 0.35, y - bodyH * 0.36);
  ctx.lineTo(x + bodyW * 0.2, y - bodyH * 0.72);
  ctx.lineTo(x + bodyW * 0.08, y - bodyH * 0.32);
  ctx.closePath();
  ctx.fill();
  drawBossEyes(x, y, bodyW, bodyH, "#fff0c5");
}

function drawBearBoss(x, y, bodyW, bodyH) {
  const bearGrad = ctx.createRadialGradient(x, y - bodyH * 0.3, bodyW * 0.2, x, y, bodyW);
  bearGrad.addColorStop(0, "#d1b295");
  bearGrad.addColorStop(1, "#5b3b2b");
  ctx.fillStyle = bearGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, bodyW * 0.52, bodyH * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#7d5238";
  ctx.beginPath();
  ctx.arc(x - bodyW * 0.32, y - bodyH * 0.36, bodyW * 0.13, 0, Math.PI * 2);
  ctx.arc(x + bodyW * 0.32, y - bodyH * 0.36, bodyW * 0.13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#c59a73";
  ctx.beginPath();
  ctx.ellipse(x, y + bodyH * 0.12, bodyW * 0.22, bodyH * 0.18, 0, 0, Math.PI * 2);
  ctx.fill();
  drawBossEyes(x, y, bodyW, bodyH, "#fff8dc");
}

function drawBossEyes(x, y, bodyW, bodyH, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x - bodyW * 0.18, y - bodyH * 0.05, bodyW * 0.06, 0, Math.PI * 2);
  ctx.arc(x + bodyW * 0.18, y - bodyH * 0.05, bodyW * 0.06, 0, Math.PI * 2);
  ctx.fill();
}

function drawPlayer() {
  const p = worldToScreen(state.player.x, state.player.y, tunnel.nearZ + 0.02);
  const r = state.player.radius / (tunnel.nearZ + 0.02);
  const bank = Math.max(-0.45, Math.min(0.45, state.player.vx * 0.0032));
  const pitchScale = 1 + Math.max(-0.18, Math.min(0.18, -state.player.vy * 0.0018));

  ctx.save();
  ctx.translate(p.sx, p.sy);
  ctx.rotate(bank);
  ctx.scale(1, pitchScale);

  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 6;

  // Rocket body with metallic shine
  const bodyGrad = ctx.createLinearGradient(0, -r * 1.2, 0, r * 0.9);
  bodyGrad.addColorStop(0, "#f4f8ff");
  bodyGrad.addColorStop(0.45, "#d5dee8");
  bodyGrad.addColorStop(1, "#8794a8");
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(0, -r * 1.2);
  ctx.lineTo(r * 0.72, r * 0.86);
  ctx.lineTo(-r * 0.72, r * 0.86);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.fillStyle = "rgba(255,255,255,0.42)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.12, -r * 0.45, r * 0.18, r * 0.38, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Cockpit
  ctx.fillStyle = "#67c8ff";
  ctx.beginPath();
  ctx.arc(0, -r * 0.2, r * 0.26, 0, Math.PI * 2);
  ctx.fill();

  // Side wings
  ctx.fillStyle = "#f24c4c";
  ctx.beginPath();
  ctx.moveTo(-r * 0.4, r * 0.34);
  ctx.lineTo(-r * 0.95, r * 0.85);
  ctx.lineTo(-r * 0.4, r * 0.74);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(r * 0.4, r * 0.34);
  ctx.lineTo(r * 0.95, r * 0.85);
  ctx.lineTo(r * 0.4, r * 0.74);
  ctx.closePath();
  ctx.fill();

  // Thruster flame
  const flamePulse = 0.8 + Math.random() * 0.35;
  ctx.fillStyle = "#ff8a2b";
  ctx.beginPath();
  ctx.moveTo(0, r * (1.15 + flamePulse * 0.18));
  ctx.lineTo(r * 0.24, r * 0.72);
  ctx.lineTo(-r * 0.24, r * 0.72);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawTrail() {
  for (let i = 0; i < state.trail.length; i += 1) {
    const t = state.trail[i];
    const p = worldToScreen(t.x, t.y, tunnel.nearZ + 0.045);
    const alpha = Math.max(0, t.life / 0.65);
    const radius = 6 + alpha * 8;
    const grad = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, radius);
    grad.addColorStop(0, `rgba(255, 226, 120, ${alpha * 0.7})`);
    grad.addColorStop(1, "rgba(255, 96, 40, 0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNormalShots() {
  for (const shot of state.normalShots) {
    const p = worldToScreen(shot.x, shot.y, shot.z);
    const size = Math.max(3, 12 * p.scale);
    const glow = ctx.createRadialGradient(p.sx, p.sy, 0, p.sx, p.sy, size * 1.8);
    glow.addColorStop(0, "rgba(190, 255, 210, 0.95)");
    glow.addColorStop(0.5, "rgba(84, 238, 125, 0.85)");
    glow.addColorStop(1, "rgba(18, 143, 52, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, size * 1.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4df27c";
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, size * 0.58, 0, Math.PI * 2);
    ctx.fill();

    // Electric arcs
    ctx.strokeStyle = "rgba(198, 255, 210, 0.9)";
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i += 1) {
      const a = shot.jitter + i * 2.1;
      ctx.beginPath();
      ctx.moveTo(p.sx + Math.cos(a) * size * 0.15, p.sy + Math.sin(a) * size * 0.15);
      ctx.lineTo(p.sx + Math.cos(a + 0.6) * size * 0.85, p.sy + Math.sin(a + 0.6) * size * 0.85);
      ctx.stroke();
    }
  }
}

function drawWalls() {
  const sorted = [...state.walls].sort((a, b) => b.z - a.z);
  for (const wall of sorted) {
    const p = worldToScreen(wall.x, wall.y, wall.z);
    const s = wall.size * p.scale;
    const prev = worldToScreen(wall.prevX, wall.prevY, Math.min(tunnel.farZ, wall.z + 0.1));

    // Fire trail (stretched glow opposite to movement)
    const dx = p.sx - prev.sx;
    const dy = p.sy - prev.sy;
    const trailLen = Math.max(18, Math.hypot(dx, dy) * 2.2 + s * 0.8);
    const angle = Math.atan2(dy, dx) + Math.PI;
    ctx.save();
    ctx.translate(p.sx, p.sy);
    ctx.rotate(angle);
    const trailGrad = ctx.createLinearGradient(0, 0, trailLen, 0);
    trailGrad.addColorStop(0, "rgba(255, 180, 70, 0.65)");
    trailGrad.addColorStop(0.45, "rgba(255, 90, 30, 0.4)");
    trailGrad.addColorStop(1, "rgba(120, 20, 10, 0)");
    ctx.fillStyle = trailGrad;
    ctx.beginPath();
    ctx.ellipse(trailLen * 0.45, 0, trailLen * 0.55, s * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Outer plasma
    const flickerScale = 0.9 + Math.sin(wall.flicker * 1.9) * 0.08;
    const outerGrad = ctx.createRadialGradient(p.sx - s * 0.2, p.sy - s * 0.2, s * 0.06, p.sx, p.sy, s * 0.72);
    outerGrad.addColorStop(0, "rgba(255, 245, 180, 0.95)");
    outerGrad.addColorStop(0.25, "rgba(255, 165, 60, 0.95)");
    outerGrad.addColorStop(0.55, "rgba(255, 80, 30, 0.92)");
    outerGrad.addColorStop(1, "rgba(110, 18, 12, 0)");
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(p.sx, p.sy, s * 0.62 * flickerScale, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = "#fff4bf";
    ctx.beginPath();
    ctx.arc(p.sx - s * 0.08, p.sy - s * 0.08, s * 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPickups() {
  const sorted = [...state.pickups].sort((a, b) => b.z - a.z);
  for (const gem of sorted) {
    const p = worldToScreen(gem.x, gem.y, gem.z);
    const s = gem.size * p.scale;
    ctx.shadowColor = "rgba(110, 170, 255, 0.8)";
    ctx.shadowBlur = 14;
    const gemGrad = ctx.createRadialGradient(p.sx - s * 0.12, p.sy - s * 0.2, s * 0.1, p.sx, p.sy, s * 0.82);
    gemGrad.addColorStop(0, "#e6f3ff");
    gemGrad.addColorStop(0.35, "#8bc5ff");
    gemGrad.addColorStop(1, "#3e4dd8");
    ctx.fillStyle = gemGrad;
    ctx.beginPath();
    ctx.moveTo(p.sx, p.sy - s / 2);
    ctx.lineTo(p.sx + s / 2, p.sy);
    ctx.lineTo(p.sx, p.sy + s / 2);
    ctx.lineTo(p.sx - s / 2, p.sy);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.beginPath();
    ctx.ellipse(p.sx - s * 0.1, p.sy - s * 0.15, s * 0.12, s * 0.18, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function render() {
  drawTunnel();
  drawBoss();
  drawWalls();
  drawPickups();
  drawTrail();
  drawNormalShots();
  drawPlayer();
  drawSpecialExplosion();
  drawAttackHud();
}

function loop(ts) {
  if (!state.lastTime) {
    state.lastTime = ts;
  }
  const dt = Math.min(0.033, (ts - state.lastTime) / 1000);
  state.lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener("keydown", (e) => {
  state.keys[e.code] = true;
  if (e.code === "KeyF") {
    registerBossNormalHit();
  }
  if (e.code === "Space") {
    registerBossSpecialHit();
  }
});

window.addEventListener("keyup", (e) => {
  state.keys[e.code] = false;
});

window.addEventListener("resize", resize);
startBtn.addEventListener("click", startGame);

resize();
render();
requestAnimationFrame(loop);
