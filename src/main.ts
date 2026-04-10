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
  !restartButton ||
  !overlayRestartButton
) {
  throw new Error("HUD elements are missing from index.html");
}

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

  if (snapshot.phase === "lost") {
    gameOverOverlay.classList.remove("hidden");
    gameOverScore.textContent = `Score ${snapshot.score} • Best ${snapshot.bestScore}`;
  } else {
    gameOverOverlay.classList.add("hidden");
  }
};

const reefGame = new ReefHungerGame(gameRoot, {
  onHudUpdate: updateHud
});

const refreshOrientation = (): void => {
  const isPortrait = window.innerHeight >= window.innerWidth;
  orientationOverlay.classList.toggle("hidden", isPortrait);
  reefGame.setSuspended(!isPortrait || document.visibilityState !== "visible");
};

restartButton.addEventListener("click", () => {
  reefGame.restart();
});

overlayRestartButton.addEventListener("click", () => {
  reefGame.restart();
});

window.addEventListener(
  "touchmove",
  (event) => {
    event.preventDefault();
  },
  { passive: false }
);

window.addEventListener("resize", refreshOrientation);
window.addEventListener("orientationchange", refreshOrientation);
document.addEventListener("visibilitychange", refreshOrientation);

refreshOrientation();
