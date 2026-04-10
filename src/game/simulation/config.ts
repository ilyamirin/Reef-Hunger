import type { EnemyKind, GameConfig } from "./types";

const weightTable = (
  entries: Array<[EnemyKind, number]>
): Record<EnemyKind, number> => ({
  fish: 0,
  crab: 0,
  starfish: 0,
  urchin: 0,
  diver: 0,
  sock: 0,
  anchor: 0,
  plate: 0,
  ...Object.fromEntries(entries)
});

export const GAME_CONFIG: GameConfig = {
  grid: {
    cols: 6,
    rows: 8
  },
  tick: {
    startMs: 1_250,
    endMs: 760,
    rampDurationMs: 90_000
  },
  pace: {
    minTickMs: 620,
    maxTickMs: 1_320,
    earlyGraceDurationMs: 12_000,
    earlyGraceTickBonusMs: 160,
    pressureSlowdownMs: 220,
    dominanceSpeedupMs: 180,
    panicSlowdownMs: 140,
    tickAdjustmentPerUpdateMs: 55,
    spawnBoostChance: 0.22,
    spawnPenaltyChance: 0.18,
    graceSpawnSuppression: 0.1,
    minExtraSpawnChance: 0.02,
    maxExtraSpawnChance: 0.48,
    waveAdvanceMs: 16_000,
    waveDelayMs: 12_000
  },
  combo: {
    thresholds: [
      { streak: 0, multiplier: 1 },
      { streak: 4, multiplier: 2 },
      { streak: 8, multiplier: 3 },
      { streak: 12, multiplier: 4 }
    ],
    speciesBonusDurationMs: 4_000,
    speciesBonusMultiplier: 2
  },
  spawnWaves: [
    {
      fromMs: 0,
      weights: weightTable([
        ["fish", 6],
        ["crab", 2]
      ]),
      extraSpawnChance: 0.08
    },
    {
      fromMs: 15_000,
      weights: weightTable([
        ["fish", 6],
        ["crab", 3],
        ["starfish", 2],
        ["sock", 1]
      ]),
      extraSpawnChance: 0.14
    },
    {
      fromMs: 30_000,
      weights: weightTable([
        ["fish", 5],
        ["crab", 3],
        ["starfish", 3],
        ["urchin", 1],
        ["sock", 1],
        ["plate", 1]
      ]),
      extraSpawnChance: 0.2
    },
    {
      fromMs: 50_000,
      weights: weightTable([
        ["fish", 4],
        ["crab", 3],
        ["starfish", 3],
        ["urchin", 2],
        ["diver", 1],
        ["sock", 1],
        ["plate", 1],
        ["anchor", 1]
      ]),
      extraSpawnChance: 0.26
    }
  ],
  enemies: {
    fish: {
      kind: "fish",
      stepPattern: "drift",
      scoreValue: 100,
      edible: true
    },
    crab: {
      kind: "crab",
      stepPattern: "scuttle",
      scoreValue: 125,
      edible: true
    },
    starfish: {
      kind: "starfish",
      stepPattern: "chaos",
      scoreValue: 150,
      edible: true
    },
    urchin: {
      kind: "urchin",
      stepPattern: "pulse",
      scoreValue: 190,
      edible: true
    },
    diver: {
      kind: "diver",
      stepPattern: "zigzag",
      scoreValue: 260,
      edible: true
    },
    sock: {
      kind: "sock",
      stepPattern: "chaos",
      scoreValue: -90,
      edible: false
    },
    anchor: {
      kind: "anchor",
      stepPattern: "pulse",
      scoreValue: -140,
      edible: false
    },
    plate: {
      kind: "plate",
      stepPattern: "drift",
      scoreValue: -110,
      edible: false
    }
  }
};
