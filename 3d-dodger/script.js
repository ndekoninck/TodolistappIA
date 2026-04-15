const canvas = document.getElementById("gameCanvas");
const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const distanceEl = document.getElementById("distance");
const coinsEl = document.getElementById("coins");
const speedEl = document.getElementById("speed");
const overlayEl = document.getElementById("overlay");
const overlayBodyEl = document.getElementById("overlayBody");
const toggleOverlayButton = document.getElementById("toggleOverlayButton");
const startButton = document.getElementById("startButton");
const shopButton = document.getElementById("shopButton");
const messageEl = document.getElementById("message");
const shopPanel = document.getElementById("shopPanel");
const shopCoinsEl = document.getElementById("shopCoins");
const skinSelect = document.getElementById("skinSelect");
const shopSkinPreview = document.getElementById("shopSkinPreview");
const skinDescription = document.getElementById("skinDescription");
const buySkinButton = document.getElementById("buySkinButton");
const equipSkinButton = document.getElementById("equipSkinButton");
const closeShopButton = document.getElementById("closeShopButton");
const modeSelect = document.getElementById("modeSelect");
const playerSetup = document.getElementById("playerSetup");
const ctx = canvas.getContext("2d");

const laneCount = 5;
const laneCenter = Math.floor(laneCount / 2);
const road = { x: 0, width: 0, laneWidth: 0, top: 80, bottom: 0 };

let running = false;
let score = 0;
let level = 1;
let distanceTravelled = 0;
let levelDistanceTarget = 1200;
let baseSpeedMultiplier = 1;
let obstacleSpawnTimer = 0;
let obstacleSpawnEvery = 0.8;
let boostSpawnTimer = 0;
let boostSpawnEvery = 2.8;
let boostTimeLeft = 0;
let playerLane = laneCenter;
let playerX = 0;
let lastTime = 0;
let scrollOffset = 0;

const keys = { left: false, right: false };
const keyStates = {};
const obstacles = [];
const boosts = [];
const celebrations = [];
const saveKey = "dodger-progress-v1";

const skins = [
  { id: "classic", name: "Cube Classique", price: 0, description: "Le cube d'origine.", unlockedByDefault: true },
  { id: "burger", name: "Burger", price: 60, description: "Deux buns et une garniture.", unlockedByDefault: false },
  { id: "duck", name: "Canard", price: 90, description: "Un skin canard fun.", unlockedByDefault: false },
  { id: "rocket", name: "Fusee", price: 130, description: "Ideal pour foncer vers l'arrivee.", unlockedByDefault: false },
  { id: "naruto", name: "Cube Ninja Orange", price: 170, description: "Bandana style ninja orange.", unlockedByDefault: false },
  { id: "batman", name: "Batman", price: 220, description: "Noir et jaune, style justicier.", unlockedByDefault: false },
  { id: "superman", name: "Superman", price: 230, description: "Bleu, rouge et symbole heroique.", unlockedByDefault: false },
  { id: "spiderman", name: "Spiderman", price: 230, description: "Rouge et bleu style araignee.", unlockedByDefault: false },
  { id: "wonderwoman", name: "Wonder Woman", price: 230, description: "Rouge et or, style amazone.", unlockedByDefault: false },
  { id: "gojo", name: "Gojo", price: 260, description: "Minimal sombre avec bandeau clair.", unlockedByDefault: false },
  { id: "yuji", name: "Yuji", price: 250, description: "Rose et noir, style combattant.", unlockedByDefault: false },
  { id: "gin", name: "Gin", price: 250, description: "Palette claire et bleu froid.", unlockedByDefault: false },
  { id: "kirua", name: "Kirua", price: 260, description: "Argent et violet electrique.", unlockedByDefault: false },
  { id: "armin", name: "Armin", price: 240, description: "Palette sable et marine.", unlockedByDefault: false },
  { id: "sasha", name: "Sasha", price: 240, description: "Brun chaud style eclaireur.", unlockedByDefault: false },
  { id: "pain_epice", name: "Pain d'epice", price: 210, description: "Cube biscuit sucre.", unlockedByDefault: false },
  { id: "hinata", name: "Hinata", price: 250, description: "Orange et noir, esprit volley.", unlockedByDefault: false },
  { id: "kageyama", name: "Kageyama", price: 250, description: "Bleu nuit et contrastes froids.", unlockedByDefault: false },
  { id: "isagi", name: "Isagi", price: 270, description: "Bleu electrique agressif.", unlockedByDefault: false },
  { id: "rin", name: "Rin", price: 270, description: "Turquoise glacial.", unlockedByDefault: false },
  { id: "nagi", name: "Nagi", price: 280, description: "Blanc-violet au style calme.", unlockedByDefault: false },
  { id: "reo", name: "Reo", price: 280, description: "Violet royal technique.", unlockedByDefault: false },
  { id: "bachira", name: "Bachira", price: 280, description: "Jaune vif et energie folle.", unlockedByDefault: false },
  { id: "bear", name: "Ours", price: 220, description: "Un cube ours brun.", unlockedByDefault: false },
  { id: "tiger", name: "Tigre", price: 240, description: "Rayures orange et noires.", unlockedByDefault: false },
  { id: "wolf", name: "Loup", price: 240, description: "Loup gris avec regard intense.", unlockedByDefault: false },
  { id: "cactus", name: "Cactus", price: 210, description: "Cactus vert piquant.", unlockedByDefault: false },
  { id: "violet_dragon", name: "Dragon Violet", price: 320, description: "Yeux, cornes et ailes violettes.", unlockedByDefault: false },
  { id: "clown", name: "Petit Clown", price: 230, description: "Clown colore et joyeux.", unlockedByDefault: false },
  { id: "mouse", name: "Souris", price: 220, description: "Petite souris grise.", unlockedByDefault: false }
];

const playerState = {
  coins: 0,
  unlockedSkins: ["classic"],
  equippedSkin: "classic",
  highestLevel: 1
};

let gameMode = "solo";
let multiplayerPlayers = [];
let multiplayerFinished = false;
let multiplayerRanking = [];
let multiplayerEliminationOrder = [];
let winnerAnimTime = 0;
let winnerStarTime = 0;
let overlayCollapsed = false;

const skinVisuals = {
  batman: { base: "#101010", accent: "#f7d046", label: "BAT" },
  superman: { base: "#1d4ed8", accent: "#ef4444", label: "SUP" },
  spiderman: { base: "#dc2626", accent: "#2563eb", label: "SPD" },
  wonderwoman: { base: "#b91c1c", accent: "#f59e0b", label: "WW" },
  gojo: { base: "#0f172a", accent: "#bfdbfe", label: "GOJ" },
  yuji: { base: "#111827", accent: "#fb7185", label: "YUJ" },
  gin: { base: "#e5e7eb", accent: "#60a5fa", label: "GIN" },
  kirua: { base: "#d1d5db", accent: "#a855f7", label: "KIR" },
  armin: { base: "#a16207", accent: "#1e3a8a", label: "ARM" },
  sasha: { base: "#78350f", accent: "#f59e0b", label: "SAS" },
  pain_epice: { base: "#92400e", accent: "#f5f5f4", label: "PIE" },
  hinata: { base: "#f97316", accent: "#111827", label: "HIN" },
  kageyama: { base: "#1e40af", accent: "#dbeafe", label: "KAG" },
  isagi: { base: "#1d4ed8", accent: "#22d3ee", label: "ISA" },
  rin: { base: "#0f766e", accent: "#67e8f9", label: "RIN" },
  nagi: { base: "#d4d4d8", accent: "#8b5cf6", label: "NAG" },
  reo: { base: "#6d28d9", accent: "#c4b5fd", label: "REO" },
  bachira: { base: "#facc15", accent: "#111827", label: "BAC" }
};

window.addEventListener("error", (event) => {
  showFatalError(event.error?.message || event.message || "Erreur JavaScript inconnue.");
});

function showFatalError(rawError) {
  messageEl.textContent = `Erreur: ${String(rawError || "inconnue")}`;
  messageEl.style.color = "#ff8e8e";
  startButton.disabled = true;
}

function setOverlayCollapsed(collapsed) {
  overlayCollapsed = collapsed;
  overlayEl.classList.toggle("collapsed", collapsed);
  overlayBodyEl.setAttribute("aria-hidden", collapsed ? "true" : "false");
  toggleOverlayButton.textContent = collapsed ? "Afficher menu" : "Replier";
  toggleOverlayButton.setAttribute("aria-expanded", collapsed ? "false" : "true");
}

function saveProgress() {
  const data = {
    coins: playerState.coins,
    unlockedSkins: playerState.unlockedSkins,
    equippedSkin: playerState.equippedSkin,
    highestLevel: playerState.highestLevel
  };
  localStorage.setItem(saveKey, JSON.stringify(data));
}

function loadProgress() {
  const raw = localStorage.getItem(saveKey);
  if (!raw) {
    saveProgress();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    playerState.coins = Number(parsed.coins) || 0;
    const unlocked = Array.isArray(parsed.unlockedSkins) ? parsed.unlockedSkins : ["classic"];
    playerState.unlockedSkins = unlocked.includes("classic") ? unlocked : ["classic", ...unlocked];
    playerState.equippedSkin = typeof parsed.equippedSkin === "string" ? parsed.equippedSkin : "classic";
    if (!playerState.unlockedSkins.includes(playerState.equippedSkin)) {
      playerState.equippedSkin = "classic";
    }
    playerState.highestLevel = Math.max(1, Number(parsed.highestLevel) || 1);
  } catch (_error) {
    saveProgress();
  }
}

function levelTargetFor(levelValue) {
  return 1200 + (levelValue - 1) * 500;
}

function configureLevel(levelValue) {
  levelDistanceTarget = levelTargetFor(levelValue);
  baseSpeedMultiplier = 1 + (levelValue - 1) * 0.22;
  obstacleSpawnEvery = Math.max(0.36, 0.82 - levelValue * 0.05);
  boostSpawnEvery = Math.max(1.4, 3.0 - levelValue * 0.2);
}

function setupShop() {
  for (const skin of skins) {
    const option = document.createElement("option");
    option.value = skin.id;
    option.textContent = `${skin.name} (${skin.price} coins)`;
    skinSelect.appendChild(option);
  }
  skinSelect.value = playerState.equippedSkin;
  refreshShopUi();
}

function getPlayerCountFromMode() {
  if (gameMode === "2p") return 2;
  if (gameMode === "3p") return 3;
  if (gameMode === "4p") return 4;
  return 1;
}

function getMultiplayerControls(index) {
  const maps = [
    { left: "KeyA", right: "KeyD", label: "A / D" },
    { left: "KeyJ", right: "KeyL", label: "J / L" },
    { left: "ArrowLeft", right: "ArrowRight", label: "← / →" },
    { left: "KeyF", right: "KeyH", label: "F / H" }
  ];
  return maps[index] || maps[0];
}

function populatePlayerSetup() {
  const count = getPlayerCountFromMode();
  playerSetup.innerHTML = "";
  if (count <= 1) {
    return;
  }

  for (let i = 0; i < count; i += 1) {
    const row = document.createElement("div");
    row.className = "player-config";
    const label = document.createElement("label");
    label.textContent = `J${i + 1}`;
    const select = document.createElement("select");
    select.id = `playerSkin${i + 1}`;
    for (const skin of skins) {
      const option = document.createElement("option");
      option.value = skin.id;
      option.textContent = skin.name;
      select.appendChild(option);
    }
    if (i === 0) {
      select.value = playerState.equippedSkin;
    }
    const previewCell = document.createElement("div");
    previewCell.className = "player-preview-cell";
    previewCell.style.gridColumn = "1 / -1";
    const previewCanvas = document.createElement("canvas");
    previewCanvas.className = "player-skin-preview";
    previewCanvas.width = 96;
    previewCanvas.height = 96;
    previewCanvas.id = `playerPreview${i + 1}`;
    previewCell.appendChild(previewCanvas);
    select.addEventListener("change", () => {
      renderSkinPreviewToCanvas(previewCanvas, select.value);
    });
    row.appendChild(label);
    row.appendChild(select);
    row.appendChild(previewCell);
    const controls = document.createElement("small");
    controls.textContent = `Touches J${i + 1}: ${getMultiplayerControls(i).label}`;
    controls.style.opacity = "0.85";
    controls.style.gridColumn = "1 / -1";
    row.appendChild(controls);
    playerSetup.appendChild(row);
    renderSkinPreviewToCanvas(previewCanvas, select.value);
  }
}

function getSkinById(skinId) {
  return skins.find((entry) => entry.id === skinId) || skins[0];
}

function refreshShopUi() {
  const selectedSkin = getSkinById(skinSelect.value);
  const owned = playerState.unlockedSkins.includes(selectedSkin.id);
  const equipped = playerState.equippedSkin === selectedSkin.id;
  shopCoinsEl.textContent = `Coins: ${playerState.coins}`;
  skinDescription.textContent = `${selectedSkin.description} Prix: ${selectedSkin.price} coins.`;
  buySkinButton.disabled = owned || selectedSkin.price > playerState.coins;
  equipSkinButton.disabled = !owned || equipped;
  renderSkinPreviewToCanvas(shopSkinPreview, selectedSkin.id);
  updateHud();
}

function renderSkinPreviewToCanvas(canvasEl, skinId) {
  if (!canvasEl) {
    return;
  }
  const pctx = canvasEl.getContext("2d");
  const w = canvasEl.width;
  const h = canvasEl.height;
  pctx.fillStyle = "#0d152c";
  pctx.fillRect(0, 0, w, h);
  pctx.strokeStyle = "rgba(255,255,255,0.18)";
  pctx.strokeRect(0.5, 0.5, w - 1, h - 1);

  const x = w * 0.22;
  const y = h * 0.22;
  const size = w * 0.56;
  drawSkinPreviewById(pctx, skinId, x, y, size);
}

function drawSkinPreviewById(previewCtx, skinId, x, y, size) {
  if (skinId === "bear") {
    drawBearSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "tiger") {
    drawTigerSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "wolf") {
    drawWolfSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "cactus") {
    drawCactusSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "violet_dragon") {
    drawDragonSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "clown") {
    drawClownSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "mouse") {
    drawMouseSkinWithContext(previewCtx, x, y, size);
    return;
  }
  if (skinId === "burger") {
    previewCtx.fillStyle = "#db8b43";
    previewCtx.fillRect(x, y, size, size * 0.23);
    previewCtx.fillStyle = "#ffd36d";
    previewCtx.fillRect(x, y + size * 0.23, size, size * 0.16);
    previewCtx.fillStyle = "#6f3c22";
    previewCtx.fillRect(x, y + size * 0.39, size, size * 0.2);
    previewCtx.fillStyle = "#4caf50";
    previewCtx.fillRect(x, y + size * 0.59, size, size * 0.14);
    previewCtx.fillStyle = "#db8b43";
    previewCtx.fillRect(x, y + size * 0.73, size, size * 0.27);
    return;
  }
  if (skinId === "duck") {
    previewCtx.fillStyle = "#ffe35f";
    previewCtx.fillRect(x, y + size * 0.1, size * 0.72, size * 0.7);
    previewCtx.fillStyle = "#ffab3f";
    previewCtx.fillRect(x + size * 0.66, y + size * 0.35, size * 0.34, size * 0.22);
    previewCtx.fillStyle = "#ffe35f";
    previewCtx.fillRect(x + size * 0.42, y, size * 0.34, size * 0.34);
    previewCtx.fillStyle = "#1e1e1e";
    previewCtx.fillRect(x + size * 0.55, y + size * 0.13, size * 0.06, size * 0.06);
    return;
  }
  if (skinId === "rocket") {
    previewCtx.fillStyle = "#c7d1de";
    previewCtx.fillRect(x + size * 0.24, y + size * 0.12, size * 0.52, size * 0.72);
    previewCtx.fillStyle = "#f14b4b";
    previewCtx.beginPath();
    previewCtx.moveTo(x + size * 0.24, y + size * 0.12);
    previewCtx.lineTo(x + size * 0.5, y - size * 0.08);
    previewCtx.lineTo(x + size * 0.76, y + size * 0.12);
    previewCtx.closePath();
    previewCtx.fill();
    previewCtx.fillStyle = "#5aa5ff";
    previewCtx.fillRect(x + size * 0.4, y + size * 0.34, size * 0.2, size * 0.16);
    previewCtx.fillStyle = "#ff9f2f";
    previewCtx.fillRect(x + size * 0.39, y + size * 0.84, size * 0.22, size * 0.16);
    return;
  }
  if (skinId === "naruto") {
    previewCtx.fillStyle = "#f28b2f";
    previewCtx.fillRect(x, y + size * 0.12, size, size * 0.88);
    previewCtx.fillStyle = "#1f3c82";
    previewCtx.fillRect(x, y, size, size * 0.2);
    previewCtx.fillStyle = "#d0d5de";
    previewCtx.fillRect(x + size * 0.3, y + size * 0.04, size * 0.4, size * 0.12);
    previewCtx.fillStyle = "#0f172a";
    previewCtx.fillRect(x + size * 0.45, y + size * 0.08, size * 0.1, size * 0.04);
    return;
  }
  if (skinVisuals[skinId]) {
    const skin = skinVisuals[skinId];
    previewCtx.fillStyle = skin.base;
    previewCtx.fillRect(x, y, size, size);
    previewCtx.fillStyle = skin.accent;
    previewCtx.fillRect(x, y, size, size * 0.24);
    previewCtx.fillRect(x, y + size * 0.76, size, size * 0.24);
    previewCtx.strokeStyle = "rgba(255,255,255,0.7)";
    previewCtx.lineWidth = 2;
    previewCtx.strokeRect(x + 1, y + 1, size - 2, size - 2);
    previewCtx.fillStyle = skin.accent;
    previewCtx.font = `bold ${Math.max(8, size * 0.24)}px Arial`;
    previewCtx.textAlign = "center";
    previewCtx.textBaseline = "middle";
    previewCtx.fillText(skin.label, x + size / 2, y + size / 2);
    return;
  }
  previewCtx.fillStyle = "#4ee3ff";
  previewCtx.fillRect(x, y, size, size);
}

function openShop() {
  if (gameMode !== "solo") {
    messageEl.textContent = "La boutique est reservee au mode solo.";
    return;
  }
  if (running) {
    messageEl.textContent = "La boutique est disponible hors partie.";
    return;
  }
  shopPanel.classList.remove("hidden");
  shopPanel.setAttribute("aria-hidden", "false");
  refreshShopUi();
}

function closeShop() {
  shopPanel.classList.add("hidden");
  shopPanel.setAttribute("aria-hidden", "true");
}

function buySelectedSkin() {
  const selectedSkin = getSkinById(skinSelect.value);
  if (playerState.unlockedSkins.includes(selectedSkin.id)) {
    return;
  }
  if (playerState.coins < selectedSkin.price) {
    messageEl.textContent = "Pas assez de coins pour ce skin.";
    return;
  }
  playerState.coins -= selectedSkin.price;
  playerState.unlockedSkins.push(selectedSkin.id);
  saveProgress();
  refreshShopUi();
  messageEl.textContent = `${selectedSkin.name} achete.`;
}

function equipSelectedSkin() {
  const selectedSkin = getSkinById(skinSelect.value);
  if (!playerState.unlockedSkins.includes(selectedSkin.id)) {
    return;
  }
  playerState.equippedSkin = selectedSkin.id;
  saveProgress();
  refreshShopUi();
  messageEl.textContent = `${selectedSkin.name} equipe.`;
}

function updateHud() {
  scoreEl.textContent = String(score);
  levelEl.textContent = String(level);
  distanceEl.textContent = `${Math.floor(distanceTravelled)} / ${Math.floor(levelDistanceTarget)}`;
  coinsEl.textContent = String(playerState.coins);
  const boostFactor = boostTimeLeft > 0 ? 1.55 : 1;
  speedEl.textContent = `${(baseSpeedMultiplier * boostFactor).toFixed(1)}x`;
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  road.width = Math.min(640, canvas.width * 0.88);
  road.x = (canvas.width - road.width) / 2;
  road.laneWidth = road.width / laneCount;
  road.bottom = canvas.height - 40;
  playerX = laneToX(playerLane);
}

function laneToX(lane) {
  return road.x + road.laneWidth * lane + road.laneWidth / 2;
}

function startGame() {
  closeShop();
  if (gameMode !== "solo") {
    startMultiplayerGame();
    return;
  }
  running = true;
  score = 0;
  level = playerState.highestLevel;
  distanceTravelled = 0;
  configureLevel(level);
  obstacleSpawnTimer = 0;
  boostSpawnTimer = 0;
  boostTimeLeft = 0;
  playerLane = laneCenter;
  playerX = laneToX(playerLane);
  obstacles.length = 0;
  boosts.length = 0;
  messageEl.textContent = `Niveau ${level}. Esquive les blocs rouges et prends les boosts violets.`;
  messageEl.style.color = "";
  updateHud();
  startButton.disabled = true;
}

function startMultiplayerGame() {
  const count = getPlayerCountFromMode();
  multiplayerPlayers = [];
  multiplayerFinished = false;
  multiplayerRanking = [];
  multiplayerEliminationOrder = [];
  celebrations.length = 0;
  winnerAnimTime = 0;
  winnerStarTime = 0;
  running = true;
  startButton.disabled = true;
  messageEl.textContent = `Mode ${count} joueurs: gagnant = dernier touche par un obstacle.`;

  for (let i = 0; i < count; i += 1) {
    const selector = document.getElementById(`playerSkin${i + 1}`);
    const skinId = selector ? selector.value : playerState.equippedSkin;
    multiplayerPlayers.push({
      id: i + 1,
      skinId,
      alive: true,
      lane: laneCenter,
      xLerp: laneCenter,
      obstacles: [],
      boosts: [],
      obstacleSpawnTimer: 0,
      obstacleSpawnEvery: 0.8,
      boostSpawnTimer: 0,
      boostSpawnEvery: 2.6,
      boostTimeLeft: 0,
      survival: 0,
      score: 0
    });
  }
}

function endGame() {
  running = false;
  startButton.disabled = false;
  messageEl.textContent = `Perdu au niveau ${level}. Score final: ${score}`;
  saveProgress();
}

function finishMultiplayer() {
  multiplayerFinished = true;
  running = false;
  startButton.disabled = false;
  const touchedLastFirst = [...multiplayerEliminationOrder].reverse();
  if (touchedLastFirst.length < multiplayerPlayers.length) {
    const missing = multiplayerPlayers.filter(
      (player) => !touchedLastFirst.some((ranked) => ranked.id === player.id)
    );
    touchedLastFirst.push(...missing);
  }
  const ordered = touchedLastFirst;
  multiplayerRanking = ordered;
  winnerAnimTime = 0;
  winnerStarTime = 1.2;
  spawnLevelCelebration();
  messageEl.textContent = `Victoire J${ordered[0].id} (dernier touche) ! Classement affiche.`;
}

function spawnObstacle() {
  obstacles.push({
    lane: Math.floor(Math.random() * laneCount),
    z: 1.0
  });
}

function spawnBoost() {
  boosts.push({
    lane: Math.floor(Math.random() * laneCount),
    z: 1.0
  });
}

function spawnLevelCelebration() {
  for (let i = 0; i < 48; i += 1) {
    celebrations.push({
      x: Math.random() * canvas.width,
      y: canvas.height * 0.2 + Math.random() * (canvas.height * 0.45),
      vx: -120 + Math.random() * 240,
      vy: -180 - Math.random() * 220,
      gravity: 280 + Math.random() * 170,
      life: 1.2 + Math.random() * 0.8,
      maxLife: 1.2 + Math.random() * 0.8,
      size: 3 + Math.random() * 5,
      color: ["#ffd54a", "#ff7dc9", "#6ef2ff", "#9d78ff", "#ffffff"][Math.floor(Math.random() * 5)],
      star: Math.random() > 0.5
    });
  }
}

function advanceToNextLevel() {
  const levelCompleted = level;
  const rewardCoins = 28 + levelCompleted * 12;
  playerState.coins += rewardCoins;
  level += 1;
  if (level > playerState.highestLevel) {
    playerState.highestLevel = level;
  }
  distanceTravelled = 0;
  configureLevel(level);
  obstacles.length = 0;
  boosts.length = 0;
  boostTimeLeft = 0;
  spawnLevelCelebration();
  messageEl.textContent = `Ligne d'arrivee! +${rewardCoins} coins. Niveau ${level} commence.`;
  saveProgress();
  updateHud();
}

function update(dt) {
  if (gameMode !== "solo") {
    updateMultiplayer(dt);
    return;
  }
  if (running) {
    if (keys.left) {
      playerLane = Math.max(0, playerLane - 1);
      keys.left = false;
    }
    if (keys.right) {
      playerLane = Math.min(laneCount - 1, playerLane + 1);
      keys.right = false;
    }

    const targetX = laneToX(playerLane);
    playerX += (targetX - playerX) * 0.18;

    obstacleSpawnTimer += dt;
    if (obstacleSpawnTimer >= obstacleSpawnEvery) {
      obstacleSpawnTimer = 0;
      spawnObstacle();
    }

    boostSpawnTimer += dt;
    if (boostSpawnTimer >= boostSpawnEvery) {
      boostSpawnTimer = 0;
      spawnBoost();
    }

    if (boostTimeLeft > 0) {
      boostTimeLeft = Math.max(0, boostTimeLeft - dt);
    }

    const playerBoostFactor = boostTimeLeft > 0 ? 1.55 : 1;
    const obstacleSlowFactor = boostTimeLeft > 0 ? 0.56 : 1;
    const playerSpeed = 0.95 * baseSpeedMultiplier * playerBoostFactor;
    const obstacleSpeed = 0.95 * baseSpeedMultiplier * obstacleSlowFactor;
    scrollOffset += dt * 250 * playerSpeed;
    distanceTravelled += dt * 140 * playerSpeed;

    for (let i = obstacles.length - 1; i >= 0; i -= 1) {
      obstacles[i].z -= dt * obstacleSpeed;
      if (obstacles[i].z <= 0.02) {
        if (obstacles[i].lane === playerLane) {
          endGame();
          break;
        }
        obstacles.splice(i, 1);
        score += 1;
      }
    }

    for (let i = boosts.length - 1; i >= 0; i -= 1) {
      boosts[i].z -= dt * obstacleSpeed;
      if (boosts[i].z <= 0.02) {
        if (boosts[i].lane === playerLane) {
          boostTimeLeft = Math.max(boostTimeLeft, 2.8);
          messageEl.textContent = "Boost actif: obstacles ralentis !";
        }
        boosts.splice(i, 1);
      }
    }

    if (distanceTravelled >= levelDistanceTarget) {
      advanceToNextLevel();
    }

    updateHud();
  }
}

function updateMultiplayer(dt) {
  if (running) {
    for (let i = 0; i < multiplayerPlayers.length; i += 1) {
      const player = multiplayerPlayers[i];
      if (!player.alive) {
        continue;
      }
      const controls = getMultiplayerControls(i);
      if (keyStates[controls.left]) {
        player.lane = Math.max(0, player.lane - 1);
        keyStates[controls.left] = false;
      }
      if (keyStates[controls.right]) {
        player.lane = Math.min(laneCount - 1, player.lane + 1);
        keyStates[controls.right] = false;
      }
      player.xLerp += (player.lane - player.xLerp) * 0.2;
      player.obstacleSpawnTimer += dt;
      player.boostSpawnTimer += dt;
      player.survival += dt;

      if (player.obstacleSpawnTimer >= player.obstacleSpawnEvery) {
        player.obstacleSpawnTimer = 0;
        player.obstacles.push({ lane: Math.floor(Math.random() * laneCount), z: 1.0 });
      }
      if (player.boostSpawnTimer >= player.boostSpawnEvery) {
        player.boostSpawnTimer = 0;
        player.boosts.push({ lane: Math.floor(Math.random() * laneCount), z: 1.0 });
      }

      if (player.boostTimeLeft > 0) {
        player.boostTimeLeft = Math.max(0, player.boostTimeLeft - dt);
      }

      const obstacleSpeed = 0.9 * (player.boostTimeLeft > 0 ? 0.58 : 1);
      for (let k = player.obstacles.length - 1; k >= 0; k -= 1) {
        const obs = player.obstacles[k];
        obs.z -= dt * obstacleSpeed;
        if (obs.z <= 0.02) {
          if (obs.lane === player.lane) {
            player.alive = false;
            player.touchedAt = player.survival;
            multiplayerEliminationOrder.push(player);
            break;
          }
          player.obstacles.splice(k, 1);
          player.score += 1;
        }
      }

      for (let k = player.boosts.length - 1; k >= 0; k -= 1) {
        const boost = player.boosts[k];
        boost.z -= dt * obstacleSpeed;
        if (boost.z <= 0.02) {
          if (boost.lane === player.lane) {
            player.boostTimeLeft = Math.max(player.boostTimeLeft, 2.6);
          }
          player.boosts.splice(k, 1);
        }
      }
    }

    const aliveCount = multiplayerPlayers.filter((p) => p.alive).length;
    if (aliveCount === 0 && multiplayerPlayers.length > 1) {
      finishMultiplayer();
    }
  }

  if (multiplayerFinished) {
    winnerAnimTime += dt;
    winnerStarTime = Math.max(0, winnerStarTime - dt);
  }
}

function drawRoad() {
  ctx.fillStyle = "#101933";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "#1b2845";
  ctx.fillRect(road.x, road.top, road.width, road.bottom - road.top);

  ctx.strokeStyle = "#8bb2ff";
  ctx.lineWidth = 2;
  for (let i = 1; i < laneCount; i += 1) {
    const x = road.x + i * road.laneWidth;
    ctx.setLineDash([16, 12]);
    ctx.lineDashOffset = -scrollOffset;
    ctx.beginPath();
    ctx.moveTo(x, road.top);
    ctx.lineTo(x, road.bottom);
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawPlayer() {
  const y = road.bottom - 56;
  const size = 36;
  const x = playerX - size / 2;
  drawSkinById(playerState.equippedSkin, x, y, size, boostTimeLeft > 0);
}

function drawSkinById(skinId, x, y, size, boosted = false) {
  if (skinId === "bear") {
    drawBearSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "tiger") {
    drawTigerSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "wolf") {
    drawWolfSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "cactus") {
    drawCactusSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "violet_dragon") {
    drawDragonSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "clown") {
    drawClownSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "mouse") {
    drawMouseSkinWithContext(ctx, x, y, size);
    return;
  }
  if (skinId === "burger") {
    drawBurgerSkin(x, y, size);
    return;
  }
  if (skinId === "duck") {
    drawDuckSkin(x, y, size);
    return;
  }
  if (skinId === "rocket") {
    drawRocketSkin(x, y, size);
    return;
  }
  if (skinId === "naruto") {
    drawNarutoSkin(x, y, size);
    return;
  }
  if (skinVisuals[skinId]) {
    drawTaggedSkin(x, y, size, skinVisuals[skinId]);
    return;
  }

  ctx.fillStyle = boosted ? "#7dffb6" : "#4ee3ff";
  ctx.fillRect(x, y, size, size);
}

function drawBearSkinWithContext(c, x, y, size) {
  c.fillStyle = "#7a4b2f";
  c.fillRect(x, y + size * 0.12, size, size * 0.88);
  c.fillRect(x - size * 0.12, y + size * 0.02, size * 0.24, size * 0.24);
  c.fillRect(x + size * 0.88, y + size * 0.02, size * 0.24, size * 0.24);
  c.fillStyle = "#2b1a12";
  c.fillRect(x + size * 0.3, y + size * 0.42, size * 0.1, size * 0.1);
  c.fillRect(x + size * 0.6, y + size * 0.42, size * 0.1, size * 0.1);
}

function drawTigerSkinWithContext(c, x, y, size) {
  c.fillStyle = "#f59e0b";
  c.fillRect(x, y, size, size);
  c.fillStyle = "#111827";
  for (let i = 0; i < 5; i += 1) {
    c.fillRect(x + i * size * 0.22, y, size * 0.08, size);
  }
  c.fillStyle = "#ffffff";
  c.fillRect(x + size * 0.35, y + size * 0.56, size * 0.3, size * 0.2);
}

function drawWolfSkinWithContext(c, x, y, size) {
  c.fillStyle = "#8a94a6";
  c.fillRect(x, y + size * 0.12, size, size * 0.88);
  c.fillStyle = "#cbd5e1";
  c.fillRect(x + size * 0.2, y + size * 0.2, size * 0.6, size * 0.34);
  c.fillStyle = "#1f2937";
  c.fillRect(x + size * 0.28, y + size * 0.32, size * 0.1, size * 0.1);
  c.fillRect(x + size * 0.62, y + size * 0.32, size * 0.1, size * 0.1);
  c.fillRect(x + size * 0.44, y + size * 0.52, size * 0.12, size * 0.16);
}

function drawCactusSkinWithContext(c, x, y, size) {
  c.fillStyle = "#2ea043";
  c.fillRect(x + size * 0.18, y, size * 0.64, size);
  c.fillRect(x - size * 0.04, y + size * 0.3, size * 0.22, size * 0.3);
  c.fillRect(x + size * 0.82, y + size * 0.28, size * 0.22, size * 0.3);
  c.fillStyle = "#b6f2c2";
  c.fillRect(x + size * 0.4, y + size * 0.22, size * 0.05, size * 0.5);
  c.fillRect(x + size * 0.54, y + size * 0.15, size * 0.05, size * 0.6);
}

function drawDragonSkinWithContext(c, x, y, size) {
  c.fillStyle = "#6d28d9";
  c.fillRect(x + size * 0.08, y + size * 0.12, size * 0.84, size * 0.88);
  c.fillStyle = "#8b5cf6";
  c.fillRect(x - size * 0.16, y + size * 0.26, size * 0.24, size * 0.28);
  c.fillRect(x + size * 0.92, y + size * 0.26, size * 0.24, size * 0.28);
  c.beginPath();
  c.moveTo(x + size * 0.24, y + size * 0.12);
  c.lineTo(x + size * 0.34, y - size * 0.08);
  c.lineTo(x + size * 0.44, y + size * 0.12);
  c.fill();
  c.beginPath();
  c.moveTo(x + size * 0.56, y + size * 0.12);
  c.lineTo(x + size * 0.66, y - size * 0.08);
  c.lineTo(x + size * 0.76, y + size * 0.12);
  c.fill();
  c.fillStyle = "#f5d0fe";
  c.fillRect(x + size * 0.3, y + size * 0.38, size * 0.12, size * 0.12);
  c.fillRect(x + size * 0.58, y + size * 0.38, size * 0.12, size * 0.12);
}

function drawClownSkinWithContext(c, x, y, size) {
  c.fillStyle = "#ffffff";
  c.fillRect(x, y + size * 0.12, size, size * 0.88);
  c.fillStyle = "#ef4444";
  c.fillRect(x, y, size, size * 0.16);
  c.fillStyle = "#2563eb";
  c.fillRect(x + size * 0.16, y + size * 0.42, size * 0.68, size * 0.14);
  c.fillStyle = "#f59e0b";
  c.fillRect(x + size * 0.42, y + size * 0.58, size * 0.16, size * 0.16);
}

function drawMouseSkinWithContext(c, x, y, size) {
  c.fillStyle = "#9ca3af";
  c.fillRect(x, y + size * 0.12, size, size * 0.88);
  c.fillRect(x - size * 0.12, y + size * 0.02, size * 0.24, size * 0.24);
  c.fillRect(x + size * 0.88, y + size * 0.02, size * 0.24, size * 0.24);
  c.fillStyle = "#111827";
  c.fillRect(x + size * 0.3, y + size * 0.4, size * 0.1, size * 0.1);
  c.fillRect(x + size * 0.6, y + size * 0.4, size * 0.1, size * 0.1);
  c.fillStyle = "#fda4af";
  c.fillRect(x + size * 0.44, y + size * 0.56, size * 0.12, size * 0.12);
}

function drawTaggedSkin(x, y, size, skin) {
  ctx.fillStyle = skin.base;
  ctx.fillRect(x, y, size, size);
  ctx.fillStyle = skin.accent;
  ctx.fillRect(x, y, size, size * 0.24);
  ctx.fillRect(x, y + size * 0.76, size, size * 0.24);
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, size - 2, size - 2);
  ctx.fillStyle = skin.accent;
  ctx.font = `bold ${Math.max(8, size * 0.24)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(skin.label, x + size / 2, y + size / 2);
}

function drawBurgerSkin(x, y, size) {
  ctx.fillStyle = "#db8b43";
  ctx.fillRect(x, y, size, size * 0.23);
  ctx.fillStyle = "#ffd36d";
  ctx.fillRect(x, y + size * 0.23, size, size * 0.16);
  ctx.fillStyle = "#6f3c22";
  ctx.fillRect(x, y + size * 0.39, size, size * 0.2);
  ctx.fillStyle = "#4caf50";
  ctx.fillRect(x, y + size * 0.59, size, size * 0.14);
  ctx.fillStyle = "#db8b43";
  ctx.fillRect(x, y + size * 0.73, size, size * 0.27);
}

function drawDuckSkin(x, y, size) {
  ctx.fillStyle = "#ffe35f";
  ctx.fillRect(x, y + size * 0.1, size * 0.72, size * 0.7);
  ctx.fillStyle = "#ffab3f";
  ctx.fillRect(x + size * 0.66, y + size * 0.35, size * 0.34, size * 0.22);
  ctx.fillStyle = "#ffe35f";
  ctx.fillRect(x + size * 0.42, y, size * 0.34, size * 0.34);
  ctx.fillStyle = "#1e1e1e";
  ctx.fillRect(x + size * 0.55, y + size * 0.13, size * 0.06, size * 0.06);
}

function drawRocketSkin(x, y, size) {
  ctx.fillStyle = "#c7d1de";
  ctx.fillRect(x + size * 0.24, y + size * 0.12, size * 0.52, size * 0.72);
  ctx.fillStyle = "#f14b4b";
  ctx.beginPath();
  ctx.moveTo(x + size * 0.24, y + size * 0.12);
  ctx.lineTo(x + size * 0.5, y - size * 0.08);
  ctx.lineTo(x + size * 0.76, y + size * 0.12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#5aa5ff";
  ctx.fillRect(x + size * 0.4, y + size * 0.34, size * 0.2, size * 0.16);
  ctx.fillStyle = "#ff9f2f";
  ctx.fillRect(x + size * 0.39, y + size * 0.84, size * 0.22, size * 0.16);
}

function drawNarutoSkin(x, y, size) {
  ctx.fillStyle = "#f28b2f";
  ctx.fillRect(x, y + size * 0.12, size, size * 0.88);
  ctx.fillStyle = "#1f3c82";
  ctx.fillRect(x, y, size, size * 0.2);
  ctx.fillStyle = "#d0d5de";
  ctx.fillRect(x + size * 0.3, y + size * 0.04, size * 0.4, size * 0.12);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(x + size * 0.45, y + size * 0.08, size * 0.1, size * 0.04);
}

function drawObstacle(obs) {
  const perspective = 1 - obs.z;
  const y = road.top + perspective * (road.bottom - road.top - 80);
  const size = 18 + perspective * 54;
  const x = laneToX(obs.lane);
  ctx.fillStyle = "#ff6767";
  ctx.fillRect(x - size / 2, y, size, size);
}

function drawBoost(boost) {
  const perspective = 1 - boost.z;
  const y = road.top + perspective * (road.bottom - road.top - 80);
  const size = 16 + perspective * 44;
  const radius = size / 2;
  const x = laneToX(boost.lane);
  const centerY = y + radius;

  // Orb violet (boost)
  const grad = ctx.createRadialGradient(
    x - radius * 0.25,
    centerY - radius * 0.25,
    radius * 0.2,
    x,
    centerY,
    radius
  );
  grad.addColorStop(0, "#cda6ff");
  grad.addColorStop(0.5, "#9a5dff");
  grad.addColorStop(1, "#5a2bb8");

  ctx.beginPath();
  ctx.arc(x, centerY, radius, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Glow contour
  ctx.lineWidth = Math.max(2, radius * 0.12);
  ctx.strokeStyle = "rgba(198, 144, 255, 0.85)";
  ctx.stroke();

  // Lightning symbol
  ctx.fillStyle = "#fff7b2";
  ctx.font = `bold ${Math.max(12, radius * 1.1)}px Arial`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⚡", x, centerY + radius * 0.02);
}

function drawFinishLineHint() {
  if (!running) {
    return;
  }

  
  const progress = Math.min(distanceTravelled / levelDistanceTarget, 1);
  const barWidth = Math.min(420, canvas.width * 0.55);
  const x = (canvas.width - barWidth) / 2;
  const y = 20;

  ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
  ctx.fillRect(x, y, barWidth, 12);
  ctx.fillStyle = "#ffe28f";
  ctx.fillRect(x, y, barWidth * progress, 12);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, barWidth, 12);
}

function updateCelebrations(dt) {
  for (let i = celebrations.length - 1; i >= 0; i -= 1) {
    const part = celebrations[i];
    part.life -= dt;
    part.vy += part.gravity * dt;
    part.x += part.vx * dt;
    part.y += part.vy * dt;
    if (part.life <= 0) {
      celebrations.splice(i, 1);
    }
  }
}

function drawCelebrations() {
  for (const part of celebrations) {
    const alpha = Math.max(0, part.life / part.maxLife);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = part.color;
    if (part.star) {
      const s = part.size;
      ctx.beginPath();
      ctx.moveTo(part.x, part.y - s);
      ctx.lineTo(part.x + s * 0.35, part.y - s * 0.35);
      ctx.lineTo(part.x + s, part.y);
      ctx.lineTo(part.x + s * 0.35, part.y + s * 0.35);
      ctx.lineTo(part.x, part.y + s);
      ctx.lineTo(part.x - s * 0.35, part.y + s * 0.35);
      ctx.lineTo(part.x - s, part.y);
      ctx.lineTo(part.x - s * 0.35, part.y - s * 0.35);
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillRect(part.x, part.y, part.size, part.size * 1.4);
    }
  }
  ctx.globalAlpha = 1;
}

function getSplitRects(count) {
  if (count === 2) {
    return [
      { x: 0, y: 0, w: canvas.width / 2, h: canvas.height },
      { x: canvas.width / 2, y: 0, w: canvas.width / 2, h: canvas.height }
    ];
  }
  if (count === 3) {
    return [
      { x: 0, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
      { x: canvas.width / 2, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
      { x: 0, y: canvas.height / 2, w: canvas.width, h: canvas.height / 2 }
    ];
  }
  return [
    { x: 0, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
    { x: canvas.width / 2, y: 0, w: canvas.width / 2, h: canvas.height / 2 },
    { x: 0, y: canvas.height / 2, w: canvas.width / 2, h: canvas.height / 2 },
    { x: canvas.width / 2, y: canvas.height / 2, w: canvas.width / 2, h: canvas.height / 2 }
  ];
}

function drawMultiplayerViewport(player, rect) {
  const viewRoad = {
    x: rect.x + rect.w * 0.13,
    y: rect.y + 46,
    width: rect.w * 0.74,
    bottom: rect.y + rect.h - 18
  };
  const laneWidth = viewRoad.width / laneCount;
  const laneToX = (laneFloat) => viewRoad.x + laneWidth * laneFloat + laneWidth / 2;
  ctx.fillStyle = "#0f162c";
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
  ctx.fillStyle = "#1b2845";
  ctx.fillRect(viewRoad.x, viewRoad.y, viewRoad.width, viewRoad.bottom - viewRoad.y);
  ctx.strokeStyle = "rgba(255,255,255,0.2)";
  ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);

  ctx.strokeStyle = "#8bb2ff";
  ctx.lineWidth = 1.3;
  for (let i = 1; i < laneCount; i += 1) {
    const x = viewRoad.x + i * laneWidth;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.moveTo(x, viewRoad.y);
    ctx.lineTo(x, viewRoad.bottom);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  for (const obs of player.obstacles) {
    const p = 1 - obs.z;
    const size = 12 + p * 38;
    const y = viewRoad.y + p * (viewRoad.bottom - viewRoad.y - 56);
    const x = laneToX(obs.lane);
    ctx.fillStyle = "#ff6767";
    ctx.fillRect(x - size / 2, y, size, size);
  }
  for (const boost of player.boosts) {
    const p = 1 - boost.z;
    const size = 10 + p * 30;
    const y = viewRoad.y + p * (viewRoad.bottom - viewRoad.y - 56);
    const x = laneToX(boost.lane);
    ctx.beginPath();
    ctx.arc(x, y + size / 2, size / 2, 0, Math.PI * 2);
    ctx.fillStyle = "#8b5cf6";
    ctx.fill();
    ctx.fillStyle = "#fff2a8";
    ctx.font = `bold ${Math.max(10, size * 0.7)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", x, y + size / 2);
  }

  const playerSize = Math.max(24, rect.w * 0.1);
  const px = laneToX(player.xLerp) - playerSize / 2;
  const py = viewRoad.bottom - playerSize - 8;
  drawSkinById(player.skinId, px, py, playerSize, player.boostTimeLeft > 0);
  if (!player.alive) {
    ctx.fillStyle = "rgba(0,0,0,0.45)";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = "#ff9e9e";
    ctx.font = "bold 22px Arial";
    ctx.textAlign = "center";
    ctx.fillText("K.O.", rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 14px Arial";
  ctx.textAlign = "left";
  ctx.fillText(`J${player.id}  Score:${player.score}`, rect.x + 8, rect.y + 18);
}

function drawWinnerScreen() {
  if (!multiplayerFinished || multiplayerRanking.length === 0) {
    return;
  }
  const winner = multiplayerRanking[0];
  ctx.fillStyle = "rgba(7,11,25,0.72)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cx = canvas.width / 2;
  const cy = canvas.height * 0.36;
  const pulse = 1 + Math.sin(winnerAnimTime * 7) * 0.12;
  if (winnerStarTime > 0) {
    const r = 40 + (1.2 - winnerStarTime) * 180;
    ctx.globalAlpha = Math.min(1, winnerStarTime * 1.5);
    ctx.fillStyle = "#ffe58a";
    ctx.beginPath();
    for (let i = 0; i < 10; i += 1) {
      const a = (Math.PI / 5) * i;
      const rr = i % 2 === 0 ? r : r * 0.45;
      const x = cx + Math.cos(a - Math.PI / 2) * rr;
      const y = cy + Math.sin(a - Math.PI / 2) * rr;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  const winnerSize = 130 * pulse;
  drawSkinById(winner.skinId, cx - winnerSize / 2, cy - winnerSize / 2, winnerSize, false);
  ctx.fillStyle = "#f5d24b";
  ctx.font = "bold 44px Arial";
  ctx.textAlign = "center";
  ctx.fillText("👑", cx, cy - winnerSize * 0.7);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px Arial";
  ctx.fillText(`J${winner.id} gagne !`, cx, cy + winnerSize * 0.75);

  const baseY = canvas.height * 0.74;
  const spacing = Math.min(140, canvas.width / Math.max(2, multiplayerRanking.length));
  const startX = cx - ((multiplayerRanking.length - 1) * spacing) / 2;
  for (let i = 0; i < multiplayerRanking.length; i += 1) {
    const p = multiplayerRanking[i];
    const size = i === 0 ? 64 : 48;
    const x = startX + i * spacing - size / 2;
    drawSkinById(p.skinId, x, baseY - size / 2, size, false);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 18px Arial";
    ctx.fillText(`#${i + 1} J${p.id}`, x + size / 2, baseY + 46);
  }
}

function render() {
  if (gameMode !== "solo") {
    ctx.fillStyle = "#0a1022";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    const rects = getSplitRects(multiplayerPlayers.length || getPlayerCountFromMode());
    for (let i = 0; i < multiplayerPlayers.length; i += 1) {
      drawMultiplayerViewport(multiplayerPlayers[i], rects[i]);
    }
    drawCelebrations();
    drawWinnerScreen();
    return;
  }
  drawRoad();
  for (const obs of obstacles) {
    drawObstacle(obs);
  }
  for (const boost of boosts) {
    drawBoost(boost);
  }
  drawPlayer();
  drawFinishLineHint();
  drawCelebrations();
}

function frame(timestamp) {
  if (!lastTime) {
    lastTime = timestamp;
  }
  const dt = Math.min((timestamp - lastTime) / 1000, 0.033);
  lastTime = timestamp;
  update(dt);
  updateCelebrations(dt);
  render();
  requestAnimationFrame(frame);
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("keydown", (event) => {
  keyStates[event.code] = true;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = true;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = true;
  }
});
window.addEventListener("keyup", (event) => {
  keyStates[event.code] = false;
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    keys.left = false;
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    keys.right = false;
  }
});
startButton.addEventListener("click", startGame);
shopButton.addEventListener("click", openShop);
toggleOverlayButton.addEventListener("click", () => {
  setOverlayCollapsed(!overlayCollapsed);
});
closeShopButton.addEventListener("click", closeShop);
buySkinButton.addEventListener("click", buySelectedSkin);
equipSkinButton.addEventListener("click", equipSelectedSkin);
skinSelect.addEventListener("change", refreshShopUi);
modeSelect.addEventListener("change", () => {
  gameMode = modeSelect.value;
  populatePlayerSetup();
  messageEl.textContent = gameMode === "solo"
    ? "Mode solo actif."
    : `Mode ${getPlayerCountFromMode()} joueurs actif. Configurez les skins puis demarrez.`;
});

loadProgress();
setupShop();
gameMode = modeSelect.value;
populatePlayerSetup();
setOverlayCollapsed(false);
level = playerState.highestLevel;
configureLevel(level);
updateHud();
resizeCanvas();
render();
requestAnimationFrame(frame);
