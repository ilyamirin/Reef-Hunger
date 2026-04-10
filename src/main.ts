import "./style.css";
import type { HudSnapshot } from "./game/simulation/types";
import { ReefHungerGame } from "./phaser/game";

const gameRoot = document.querySelector<HTMLDivElement>("#game-root");
const scoreValue = document.querySelector<HTMLSpanElement>("#score-value");
const bestValue = document.querySelector<HTMLSpanElement>("#best-value");
const streakValue = document.querySelector<HTMLSpanElement>("#streak-value");
const multiplierValue =
  document.querySelector<HTMLSpanElement>("#multiplier-value");
const speciesChip = document.querySelector<HTMLDivElement>("#species-chip");
const speciesValue = document.querySelector<HTMLSpanElement>("#species-value");
const gameOverOverlay =
  document.querySelector<HTMLDivElement>("#game-over-overlay");
const gameOverScore =
  document.querySelector<HTMLParagraphElement>("#game-over-score");
const orientationOverlay = document.querySelector<HTMLDivElement>(
  "#orientation-overlay"
);
const startOverlay = document.querySelector<HTMLDivElement>("#start-overlay");
const startButton = document.querySelector<HTMLButtonElement>("#start-button");
const restartButton =
  document.querySelector<HTMLButtonElement>("#restart-button");
const overlayRestartButton = document.querySelector<HTMLButtonElement>(
  "#overlay-restart-button"
);

if (
  !gameRoot ||
  !scoreValue ||
  !bestValue ||
  !streakValue ||
  !multiplierValue ||
  !speciesChip ||
  !speciesValue ||
  !gameOverOverlay ||
  !gameOverScore ||
  !orientationOverlay ||
  !startOverlay ||
  !startButton ||
  !restartButton ||
  !overlayRestartButton
) {
  throw new Error("HUD elements are missing from index.html");
}

let hasStarted = false;

const shouldEnforcePortrait = (): boolean =>
  window.matchMedia("(pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;

const updateHud = (snapshot: HudSnapshot): void => {
  scoreValue.textContent = String(snapshot.score);
  bestValue.textContent = String(snapshot.bestScore);
  streakValue.textContent = String(snapshot.streak);
  multiplierValue.textContent = `x${snapshot.multiplier}`;

  if (snapshot.speciesBonusRemainingMs > 0) {
    speciesChip.classList.remove("hidden");
    speciesValue.textContent = `${(snapshot.speciesBonusRemainingMs / 1000).toFixed(1)}s`;
  } else {
    speciesChip.classList.add("hidden");
  }

  if (snapshot.phase === "lost" && hasStarted) {
    gameOverOverlay.classList.remove("hidden");
    gameOverScore.textContent = `Score ${snapshot.score} • Best ${snapshot.bestScore}`;
  } else {
    gameOverOverlay.classList.add("hidden");
  }
};

const reefGame = new ReefHungerGame(gameRoot, {
  onHudUpdate: updateHud
});

const syncOverlays = (): void => {
  const isPortrait = window.innerHeight >= window.innerWidth;
  const showOrientationOverlay = shouldEnforcePortrait() && !isPortrait;
  const shouldSuspend =
    !hasStarted ||
    showOrientationOverlay ||
    document.visibilityState !== "visible";

  orientationOverlay.classList.toggle("hidden", !showOrientationOverlay);
  startOverlay.classList.toggle("hidden", hasStarted);
  reefGame.setSuspended(shouldSuspend);
};

const startRun = (): void => {
  hasStarted = true;
  reefGame.startRun();
  startOverlay.classList.add("hidden");
  gameOverOverlay.classList.add("hidden");
  syncOverlays();
};

restartButton.addEventListener("click", () => {
  hasStarted = true;
  reefGame.restart();
  gameOverOverlay.classList.add("hidden");
  syncOverlays();
});

overlayRestartButton.addEventListener("click", () => {
  hasStarted = true;
  reefGame.restart();
  gameOverOverlay.classList.add("hidden");
  syncOverlays();
});

startButton.addEventListener("click", () => {
  startRun();
});

window.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);

window.addEventListener("resize", syncOverlays);
window.addEventListener("orientationchange", syncOverlays);
document.addEventListener("visibilitychange", syncOverlays);

document.body.classList.remove("booting");
syncOverlays();
