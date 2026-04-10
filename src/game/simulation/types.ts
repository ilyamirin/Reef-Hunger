export type EnemyKind =
  | "fish"
  | "crab"
  | "starfish"
  | "urchin"
  | "diver"
  | "tire"
  | "anchor"
  | "plate";

export type StepPattern = "drift" | "scuttle" | "chaos" | "pulse" | "zigzag";

export interface GridCell {
  col: number;
  row: number;
}

export interface EnemyState {
  id: string;
  kind: EnemyKind;
  cell: GridCell;
  stepPattern: StepPattern;
  scoreValue: number;
  edible: boolean;
  spawnedAtTick: number;
  driftDir: -1 | 1;
}

export interface ComboState {
  streak: number;
  multiplier: number;
  speciesPairKind: EnemyKind | null;
  speciesBonusUntilMs: number | null;
  lastKillKind: EnemyKind | null;
}

export interface PaceState {
  pressure: number;
  dominance: number;
  adaptiveTickMs: number;
  targetTickMs: number;
  extraSpawnChance: number;
  waveElapsedMs: number;
  lastMissAtMs: number | null;
  lastHitAtMs: number | null;
}

export interface RunState {
  phase: "running" | "lost";
  score: number;
  bestScore: number;
  tickMs: number;
  elapsedMs: number;
  enemies: EnemyState[];
  combo: ComboState;
  tickCount: number;
  pace: PaceState;
}

export type PlayerAction =
  | { type: "tap-cell"; cell: GridCell }
  | { type: "restart-run" };

export type AttackResolution = "hit-edible" | "hit-hostile" | "miss" | "lose";

export interface EnemyArchetype {
  kind: EnemyKind;
  stepPattern: StepPattern;
  scoreValue: number;
  edible: boolean;
}

export interface SpawnWave {
  fromMs: number;
  weights: Record<EnemyKind, number>;
  extraSpawnChance: number;
}

export interface GameConfig {
  grid: {
    cols: number;
    rows: number;
  };
  tick: {
    startMs: number;
    endMs: number;
    rampDurationMs: number;
  };
  pace: {
    minTickMs: number;
    maxTickMs: number;
    earlyGraceDurationMs: number;
    earlyGraceTickBonusMs: number;
    pressureSlowdownMs: number;
    dominanceSpeedupMs: number;
    panicSlowdownMs: number;
    tickAdjustmentPerUpdateMs: number;
    spawnBoostChance: number;
    spawnPenaltyChance: number;
    graceSpawnSuppression: number;
    minExtraSpawnChance: number;
    maxExtraSpawnChance: number;
    waveAdvanceMs: number;
    waveDelayMs: number;
  };
  combo: {
    thresholds: Array<{ streak: number; multiplier: number }>;
    speciesBonusDurationMs: number;
    speciesBonusMultiplier: number;
  };
  spawnWaves: SpawnWave[];
  enemies: Record<EnemyKind, EnemyArchetype>;
}

export interface MovementDelta {
  id: string;
  from: GridCell;
  to: GridCell;
}

export interface TickEvent {
  type: "tick";
  moved: MovementDelta[];
  spawned: EnemyState[];
  despawnedIds: string[];
  lost: boolean;
}

export interface AttackEvent {
  type: "attack";
  resolution: AttackResolution;
  cell: GridCell;
  removedId?: string;
  removedKind?: EnemyKind;
  pointsGained: number;
  speciesBonusTriggered: boolean;
}

export interface RestartEvent {
  type: "restart";
}

export type SimulationEvent = TickEvent | AttackEvent | RestartEvent;

export interface HudSnapshot {
  score: number;
  bestScore: number;
  streak: number;
  multiplier: number;
  speciesBonusRemainingMs: number;
  phase: RunState["phase"];
}
