import "./style.css";
import type { HudSnapshot } from "./game/simulation/types";
import { ReefHungerGame } from "./phaser/game";

type GamePhase = HudSnapshot["phase"] | "boot";

const rootElement = document.documentElement;
const bodyElement = document.body;
const gameShell = document.querySelector<HTMLDivElement>("#game-shell");
const gameRoot = document.querySelector<HTMLDivElement>("#game-root");
const scoreValue = document.querySelector<HTMLSpanElement>("#score-value");
const bestValue = document.querySelector<HTMLSpanElement>("#best-value");
const streakValue = document.querySelector<HTMLSpanElement>("#streak-value");
const multiplierChip =
  document.querySelector<HTMLDivElement>("#multiplier-chip");
const multiplierValue =
  document.querySelector<HTMLSpanElement>("#multiplier-value");
const multiplierBoostValue = document.querySelector<HTMLSpanElement>(
  "#multiplier-boost-value"
);
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
  !gameShell ||
  !gameRoot ||
  !scoreValue ||
  !bestValue ||
  !streakValue ||
  !multiplierChip ||
  !multiplierValue ||
  !multiplierBoostValue ||
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
let currentPhase: GamePhase = "boot";

const shouldEnforcePortrait = (): boolean =>
  window.matchMedia("(pointer: coarse)").matches ||
  navigator.maxTouchPoints > 0;

const isMobilePortrait = (): boolean =>
  shouldEnforcePortrait() && window.innerHeight >= window.innerWidth;

const applyViewportHeight = (): void => {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  rootElement.style.setProperty(
    "--app-height",
    `${Math.round(viewportHeight)}px`
  );
};

const syncShellState = (): void => {
  const showOrientationOverlay = shouldEnforcePortrait() && !isMobilePortrait();
  const isRunning =
    hasStarted &&
    currentPhase === "running" &&
    !showOrientationOverlay &&
    document.visibilityState === "visible";

  bodyElement.classList.toggle("coarse-portrait", isMobilePortrait());
  bodyElement.classList.toggle("game-running", isRunning);
  bodyElement.dataset.gamePhase = currentPhase;
};

applyViewportHeight();

const updateHud = (snapshot: HudSnapshot): void => {
  currentPhase = snapshot.phase;
  scoreValue.textContent = String(snapshot.score);
  bestValue.textContent = String(snapshot.bestScore);
  streakValue.textContent = String(snapshot.streak);
  multiplierValue.textContent = `x${snapshot.multiplier}`;

  if (snapshot.speciesBonusRemainingMs > 0) {
    speciesChip.classList.remove("hidden");
    const bonusText = `${(snapshot.speciesBonusRemainingMs / 1000).toFixed(1)}s`;
    speciesValue.textContent = bonusText;
    multiplierBoostValue.textContent = `Boost ${bonusText}`;
    multiplierBoostValue.classList.remove("hidden");
    multiplierChip.dataset.bonusActive = "true";
  } else {
    speciesChip.classList.add("hidden");
    multiplierBoostValue.classList.add("hidden");
    multiplierChip.dataset.bonusActive = "false";
  }

  if (snapshot.phase === "lost" && hasStarted) {
    gameOverOverlay.classList.remove("hidden");
    gameOverScore.textContent = `SCORE ${snapshot.score} · BEST ${snapshot.bestScore}`;
  } else {
    gameOverOverlay.classList.add("hidden");
  }

  syncShellState();
};

const reefGame = new ReefHungerGame(gameRoot, {
  onHudUpdate: updateHud
});

const syncOverlays = (): void => {
  const showOrientationOverlay = shouldEnforcePortrait() && !isMobilePortrait();
  const shouldSuspend =
    !hasStarted ||
    showOrientationOverlay ||
    document.visibilityState !== "visible";

  orientationOverlay.classList.toggle("hidden", !showOrientationOverlay);
  startOverlay.classList.toggle("hidden", hasStarted);
  reefGame.setSuspended(shouldSuspend);
  syncShellState();
};

const syncViewport = (): void => {
  applyViewportHeight();
  reefGame.resize();
  syncOverlays();
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

gameShell.addEventListener(
  "touchmove",
  (event) => {
    if (bodyElement.classList.contains("game-running")) {
      event.preventDefault();
    }
  },
  { passive: false }
);

window.addEventListener("resize", syncViewport);
window.addEventListener("orientationchange", syncViewport);
window.visualViewport?.addEventListener("resize", syncViewport);
document.addEventListener("visibilitychange", syncOverlays);

document.body.classList.remove("booting");
syncOverlays();
