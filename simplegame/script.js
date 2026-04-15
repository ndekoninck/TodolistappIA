const scoreEl = document.getElementById("score");
const timeEl = document.getElementById("time");
const startButton = document.getElementById("startButton");
const target = document.getElementById("target");
const board = document.getElementById("board");
const message = document.getElementById("message");

let score = 0;
let timeLeft = 20;
let timerId = null;
let gameRunning = false;

function moveTarget() {
  const boardRect = board.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const maxX = boardRect.width - targetRect.width;
  const maxY = boardRect.height - targetRect.height;
  const x = Math.random() * maxX;
  const y = Math.random() * maxY;
  target.style.left = `${x}px`;
  target.style.top = `${y}px`;
}

function endGame() {
  gameRunning = false;
  clearInterval(timerId);
  timerId = null;
  message.textContent = `Partie terminée ! Score final : ${score}`;
  startButton.disabled = false;
}

function startGame() {
  score = 0;
  timeLeft = 20;
  gameRunning = true;
  scoreEl.textContent = String(score);
  timeEl.textContent = String(timeLeft);
  message.textContent = "Vise vite la cible !";
  startButton.disabled = true;
  moveTarget();

  timerId = setInterval(() => {
    timeLeft -= 1;
    timeEl.textContent = String(timeLeft);
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

target.addEventListener("click", () => {
  if (!gameRunning) {
    return;
  }
  score += 1;
  scoreEl.textContent = String(score);
  moveTarget();
});

startButton.addEventListener("click", startGame);

target.style.left = "20px";
target.style.top = "20px";
