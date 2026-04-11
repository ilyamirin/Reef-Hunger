import { GAME_CONFIG } from "./config";
import type {
  AttackEvent,
  ComboState,
  EnemyKind,
  EnemyState,
  GameConfig,
  GridCell,
  HudSnapshot,
  MovementDelta,
  PaceState,
  RestartEvent,
  RunState,
  SimulationEvent,
  TickEvent
} from "./types";

const lerp = (start: number, end: number, progress: number): number =>
  start + (end - start) * progress;

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

const moveTowards = (
  current: number,
  target: number,
  maxDelta: number
): number => {
  if (Math.abs(target - current) <= maxDelta) {
    return target;
  }

  return current + Math.sign(target - current) * maxDelta;
};

const comboMultiplierForStreak = (
  config: GameConfig,
  streak: number
): number => {
  let multiplier = 1;
  for (const threshold of config.combo.thresholds) {
    if (streak >= threshold.streak) {
      multiplier = threshold.multiplier;
    }
  }
  return multiplier;
};

const emptyComboState = (): ComboState => ({
  streak: 0,
  multiplier: 1,
  speciesPairKind: null,
  speciesBonusUntilMs: null,
  lastKillKind: null
});

const createInitialPaceState = (config: GameConfig): PaceState => ({
  pressure: 0,
  dominance: 0,
  adaptiveTickMs: config.tick.startMs,
  targetTickMs: config.tick.startMs,
  extraSpawnChance: 0,
  waveElapsedMs: 0,
  lastMissAtMs: null,
  lastHitAtMs: null
});

const createInitialState = (
  config: GameConfig,
  bestScore: number
): RunState => ({
  phase: "running",
  score: 0,
  bestScore,
  tickMs: config.tick.startMs,
  elapsedMs: 0,
  enemies: [],
  combo: emptyComboState(),
  tickCount: 0,
  pace: createInitialPaceState(config)
});

const withExpiredBonusPruned = (state: RunState): RunState => {
  if (
    state.combo.speciesBonusUntilMs !== null &&
    state.combo.speciesBonusUntilMs <= state.elapsedMs
  ) {
    return {
      ...state,
      combo: {
        ...state.combo,
        speciesPairKind: null,
        speciesBonusUntilMs: null
      }
    };
  }

  return state;
};

const baseTickMsForElapsed = (
  config: GameConfig,
  elapsedMs: number
): number => {
  const progress = clamp(elapsedMs / config.tick.rampDurationMs, 0, 1);
  return Math.round(lerp(config.tick.startMs, config.tick.endMs, progress));
};

const recentSignal = (
  nowMs: number,
  atMs: number | null,
  windowMs: number
): number => {
  if (atMs === null) {
    return 0;
  }

  return clamp(1 - (nowMs - atMs) / windowMs, 0, 1);
};

const updateAdaptivePace = (config: GameConfig, state: RunState): RunState => {
  const totalCells = config.grid.cols * config.grid.rows;
  const edibleEnemies = state.enemies.filter((enemy) => enemy.edible);
  const fillRatio = state.enemies.length / totalCells;
  const maxRow = edibleEnemies.reduce(
    (highest, enemy) => Math.max(highest, enemy.cell.row),
    -1
  );
  const maxRowRatio = maxRow < 0 ? 0 : maxRow / (config.grid.rows - 1);
  const dangerZoneRatio =
    edibleEnemies.length === 0
      ? 0
      : edibleEnemies.filter((enemy) => enemy.cell.row >= config.grid.rows - 3)
          .length / edibleEnemies.length;
  const streakRatio = clamp(state.combo.streak / 12, 0, 1);
  const missPenalty = recentSignal(
    state.elapsedMs,
    state.pace.lastMissAtMs,
    5_000
  );
  const hitMomentum = recentSignal(
    state.elapsedMs,
    state.pace.lastHitAtMs,
    2_600
  );
  const panicRatio =
    maxRow < config.grid.rows - 4
      ? 0
      : clamp((maxRow - (config.grid.rows - 4)) / 2, 0, 1);
  const graceRatio = clamp(
    1 - state.elapsedMs / config.pace.earlyGraceDurationMs,
    0,
    1
  );

  const pressure = clamp(
    maxRowRatio * 0.42 +
      fillRatio * 0.24 +
      dangerZoneRatio * 0.22 +
      missPenalty * 0.22 -
      streakRatio * 0.15,
    0,
    1
  );

  const dominance = clamp(
    streakRatio * 0.42 +
      (1 - fillRatio) * 0.24 +
      (1 - maxRowRatio) * 0.16 +
      hitMomentum * 0.16 -
      missPenalty * 0.22,
    0,
    1
  );

  const baseTickMs = baseTickMsForElapsed(config, state.elapsedMs);
  const targetTickMs = clamp(
    Math.round(
      baseTickMs +
        graceRatio * config.pace.earlyGraceTickBonusMs +
        pressure * config.pace.pressureSlowdownMs +
        panicRatio * config.pace.panicSlowdownMs -
        dominance * config.pace.dominanceSpeedupMs
    ),
    config.pace.minTickMs,
    config.pace.maxTickMs
  );

  const adaptiveTickMs = Math.round(
    moveTowards(
      state.pace.adaptiveTickMs,
      targetTickMs,
      config.pace.tickAdjustmentPerUpdateMs
    )
  );

  const extraSpawnChance = clamp(
    dominance * config.pace.spawnBoostChance -
      pressure * config.pace.spawnPenaltyChance -
      graceRatio * config.pace.graceSpawnSuppression -
      panicRatio * (config.pace.spawnPenaltyChance * 0.5),
    -config.pace.spawnPenaltyChance,
    config.pace.spawnBoostChance
  );

  const waveElapsedMs = clamp(
    state.elapsedMs +
      dominance * config.pace.waveAdvanceMs -
      pressure * config.pace.waveDelayMs -
      graceRatio * config.pace.waveDelayMs,
    0,
    state.elapsedMs + config.pace.waveAdvanceMs
  );

  return {
    ...state,
    tickMs: adaptiveTickMs,
    pace: {
      ...state.pace,
      pressure,
      dominance,
      adaptiveTickMs,
      targetTickMs,
      extraSpawnChance,
      waveElapsedMs
    }
  };
};

const currentWave = (config: GameConfig, elapsedMs: number) =>
  [...config.spawnWaves]
    .sort((left, right) => left.fromMs - right.fromMs)
    .filter((wave) => elapsedMs >= wave.fromMs)
    .at(-1) ?? config.spawnWaves[0];

const chooseWeightedKind = (
  config: GameConfig,
  elapsedMs: number,
  rng: () => number
): EnemyKind => {
  const wave = currentWave(config, elapsedMs);
  const entries = Object.entries(wave.weights).filter(
    ([, weight]) => weight > 0
  ) as Array<[EnemyKind, number]>;
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  const roll = rng() * total;
  let cursor = 0;

  for (const [kind, weight] of entries) {
    cursor += weight;
    if (roll <= cursor) {
      return kind;
    }
  }

  return entries[entries.length - 1][0];
};

const enemyId = (kind: EnemyKind, tickCount: number, roll: number): string =>
  `${kind}-${tickCount}-${Math.round(roll * 1_000_000)}`;

const lateralShiftForEnemy = (
  enemy: EnemyState,
  tickCount: number,
  rng: () => number
): number => {
  switch (enemy.stepPattern) {
    case "drift":
      return rng() < 0.13 ? (rng() < 0.5 ? -1 : 1) : 0;
    case "scuttle":
      return rng() < 0.7 ? enemy.driftDir : 0;
    case "chaos": {
      const roll = rng();
      if (roll < 0.22) {
        return -1;
      }
      if (roll > 0.78) {
        return 1;
      }
      return 0;
    }
    case "pulse":
      if (tickCount % 2 === 1) {
        return 0;
      }
      return rng() < 0.1 ? enemy.driftDir : 0;
    case "zigzag":
      return tickCount % 2 === 0 ? enemy.driftDir : -enemy.driftDir;
    case "bounce":
      return 0;
    default:
      return 0;
  }
};

const shouldAdvanceDown = (enemy: EnemyState, tickCount: number): boolean =>
  !(enemy.stepPattern === "pulse" && tickCount % 2 === 1);

const cellKey = ({ col, row }: GridCell): string => `${col}:${row}`;

const buildOccupiedSet = (enemies: EnemyState[]): Set<string> =>
  new Set(enemies.map((enemy) => cellKey(enemy.cell)));

const spawnEnemies = (
  config: GameConfig,
  state: RunState,
  rng: () => number
): { nextState: RunState; spawned: EnemyState[] } => {
  const topOccupied = new Set(
    state.enemies
      .filter((enemy) => enemy.cell.row === 0)
      .map((enemy) => enemy.cell.col)
  );
  const availableColumns = Array.from(
    { length: config.grid.cols },
    (_, index) => index
  ).filter((col) => !topOccupied.has(col));

  if (availableColumns.length === 0) {
    return { nextState: state, spawned: [] };
  }

  const effectiveWave = currentWave(config, state.pace.waveElapsedMs);
  const extraSpawnChance = clamp(
    effectiveWave.extraSpawnChance + state.pace.extraSpawnChance,
    config.pace.minExtraSpawnChance,
    config.pace.maxExtraSpawnChance
  );
  const spawnCount = Math.min(
    availableColumns.length,
    1 + (rng() < extraSpawnChance ? 1 : 0)
  );

  const spawned: EnemyState[] = [];
  const freeColumns = [...availableColumns];

  for (let index = 0; index < spawnCount; index += 1) {
    const columnIndex = Math.floor(rng() * freeColumns.length);
    const col = freeColumns.splice(columnIndex, 1)[0];
    const kind = chooseWeightedKind(config, state.pace.waveElapsedMs, rng);
    const archetype = config.enemies[kind];

    spawned.push({
      id: enemyId(kind, state.tickCount, rng()),
      kind,
      cell: { col, row: 0 },
      stepPattern: archetype.stepPattern,
      scoreValue: archetype.scoreValue,
      edible: archetype.edible,
      spawnedAtTick: state.tickCount,
      driftDir: rng() < 0.5 ? -1 : 1
    });
  }

  return {
    nextState: {
      ...state,
      enemies: [...state.enemies, ...spawned]
    },
    spawned
  };
};

const advanceTick = (
  config: GameConfig,
  state: RunState,
  rng: () => number
): { nextState: RunState; event: TickEvent } => {
  const pruned = withExpiredBonusPruned(state);
  const occupied = buildOccupiedSet(pruned.enemies);
  const moved: MovementDelta[] = [];

  const nextEnemies = [...pruned.enemies]
    .sort((left, right) => {
      if (left.cell.row !== right.cell.row) {
        return right.cell.row - left.cell.row;
      }
      return left.cell.col - right.cell.col;
    })
    .map((enemy) => {
      occupied.delete(cellKey(enemy.cell));

      const lateralShift = lateralShiftForEnemy(enemy, pruned.tickCount, rng);
      const advanceDown = shouldAdvanceDown(enemy, pruned.tickCount);

      let nextCell = enemy.cell;

      if (advanceDown) {
        const desiredCol = clamp(
          enemy.cell.col + lateralShift,
          0,
          config.grid.cols - 1
        );
        const desiredCell = { col: desiredCol, row: enemy.cell.row + 1 };
        const straightDownCell = {
          col: enemy.cell.col,
          row: enemy.cell.row + 1
        };

        if (
          desiredCell.row < config.grid.rows &&
          !occupied.has(cellKey(desiredCell))
        ) {
          nextCell = desiredCell;
        } else if (
          straightDownCell.row < config.grid.rows &&
          !occupied.has(cellKey(straightDownCell))
        ) {
          nextCell = straightDownCell;
        }
      }

      occupied.add(cellKey(nextCell));

      if (nextCell.col !== enemy.cell.col || nextCell.row !== enemy.cell.row) {
        moved.push({
          id: enemy.id,
          from: enemy.cell,
          to: nextCell
        });
      }

      return {
        ...enemy,
        cell: nextCell,
        driftDir:
          enemy.stepPattern === "scuttle" && lateralShift !== 0
            ? (lateralShift as -1 | 1)
            : enemy.driftDir
      };
    });

  const nextElapsedMs = pruned.elapsedMs + pruned.tickMs;
  const despawned = nextEnemies.filter(
    (enemy) => !enemy.edible && enemy.cell.row >= config.grid.rows - 1
  );
  const survivingEnemies = nextEnemies.filter(
    (enemy) => enemy.edible || enemy.cell.row < config.grid.rows - 1
  );
  const lost = survivingEnemies.some(
    (enemy) => enemy.edible && enemy.cell.row >= config.grid.rows - 1
  );

  const movedState = updateAdaptivePace(config, {
    ...pruned,
    enemies: survivingEnemies,
    elapsedMs: nextElapsedMs,
    tickCount: pruned.tickCount + 1,
    phase: lost ? "lost" : pruned.phase
  });

  const { nextState, spawned } = lost
    ? { nextState: movedState, spawned: [] }
    : spawnEnemies(config, movedState, rng);
  const pacedNextState = lost
    ? nextState
    : updateAdaptivePace(config, nextState);

  return {
    nextState: pacedNextState,
    event: {
      type: "tick",
      moved,
      spawned,
      despawnedIds: despawned.map((enemy) => enemy.id),
      lost
    }
  };
};

const resetComboState = (combo: ComboState): ComboState => ({
  ...combo,
  streak: 0,
  multiplier: 1,
  speciesPairKind: null,
  speciesBonusUntilMs: null,
  lastKillKind: null
});

const applyAttack = (
  config: GameConfig,
  state: RunState,
  cell: GridCell
): { nextState: RunState; event: AttackEvent } => {
  const pruned = withExpiredBonusPruned(state);
  const target = pruned.enemies.find(
    (enemy) => enemy.cell.col === cell.col && enemy.cell.row === cell.row
  );

  if (!target) {
    const comboBroken =
      pruned.combo.streak > 0 ||
      pruned.combo.speciesBonusUntilMs !== null ||
      pruned.combo.lastKillKind !== null;
    const missedState = updateAdaptivePace(config, {
      ...pruned,
      combo: resetComboState(pruned.combo),
      pace: {
        ...pruned.pace,
        lastMissAtMs: pruned.elapsedMs
      }
    });

    return {
      nextState: missedState,
      event: {
        type: "attack",
        resolution: "miss",
        cell,
        pointsGained: 0,
        speciesBonusTriggered: false,
        comboBroken,
        multiplierIncreased: false,
        nextMultiplier: 1
      }
    };
  }

  const streak = pruned.combo.streak + 1;
  const multiplier = comboMultiplierForStreak(config, streak);
  const activeSpeciesBonus =
    pruned.combo.speciesBonusUntilMs !== null &&
    pruned.combo.speciesBonusUntilMs > pruned.elapsedMs;
  const pointsGained =
    target.scoreValue *
    (target.edible ? multiplier : 1) *
    (target.edible && activeSpeciesBonus
      ? config.combo.speciesBonusMultiplier
      : 1);

  const speciesPairTriggered = pruned.combo.lastKillKind === target.kind;
  const multiplierIncreased =
    target.edible && multiplier > pruned.combo.multiplier;
  const comboBroken = !target.edible && pruned.combo.streak > 0;
  const nextCombo: ComboState = target.edible
    ? {
        streak,
        multiplier,
        lastKillKind: target.kind,
        speciesPairKind: speciesPairTriggered
          ? target.kind
          : pruned.combo.speciesPairKind,
        speciesBonusUntilMs: speciesPairTriggered
          ? pruned.elapsedMs + config.combo.speciesBonusDurationMs
          : pruned.combo.speciesBonusUntilMs
      }
    : resetComboState(pruned.combo);

  const score = Math.max(0, pruned.score + pointsGained);
  const bestScore = Math.max(pruned.bestScore, score);
  const hitState = updateAdaptivePace(config, {
    ...pruned,
    score,
    bestScore,
    enemies: pruned.enemies.filter((enemy) => enemy.id !== target.id),
    combo: nextCombo,
    pace: {
      ...pruned.pace,
      lastHitAtMs: target.edible ? pruned.elapsedMs : pruned.pace.lastHitAtMs,
      lastMissAtMs: target.edible ? pruned.pace.lastMissAtMs : pruned.elapsedMs
    }
  });

  return {
    nextState: hitState,
    event: {
      type: "attack",
      resolution: target.edible ? "hit-edible" : "hit-hostile",
      cell,
      removedId: target.id,
      removedKind: target.kind,
      pointsGained,
      speciesBonusTriggered: speciesPairTriggered,
      comboBroken,
      multiplierIncreased,
      nextMultiplier: nextCombo.multiplier
    }
  };
};

export class GameEngine {
  private state: RunState;
  private accumulatorMs = 0;

  public constructor(
    private readonly config: GameConfig = GAME_CONFIG,
    bestScore = 0,
    private readonly rng: () => number = Math.random
  ) {
    this.state = createInitialState(this.config, bestScore);
  }

  public getState(): RunState {
    this.state = withExpiredBonusPruned(this.state);
    return this.state;
  }

  public getHudSnapshot(): HudSnapshot {
    const state = this.getState();
    const speciesBonusRemainingMs =
      state.combo.speciesBonusUntilMs === null
        ? 0
        : Math.max(0, state.combo.speciesBonusUntilMs - state.elapsedMs);

    return {
      score: state.score,
      bestScore: state.bestScore,
      streak: state.combo.streak,
      multiplier:
        state.combo.multiplier *
        (speciesBonusRemainingMs > 0
          ? this.config.combo.speciesBonusMultiplier
          : 1),
      speciesBonusRemainingMs,
      phase: state.phase
    };
  }

  public step(deltaMs: number): SimulationEvent[] {
    if (this.state.phase !== "running") {
      return [];
    }

    this.accumulatorMs += deltaMs;
    const events: SimulationEvent[] = [];

    while (
      this.accumulatorMs >= this.state.tickMs &&
      this.state.phase === "running"
    ) {
      this.accumulatorMs -= this.state.tickMs;
      const { nextState, event } = advanceTick(
        this.config,
        this.state,
        this.rng
      );
      this.state = nextState;
      events.push(event);
    }

    if (events.length === 0) {
      this.state = withExpiredBonusPruned(this.state);
    }

    return events;
  }

  public tapCell(cell: GridCell): AttackEvent | null {
    if (this.state.phase !== "running") {
      return null;
    }

    const { nextState, event } = applyAttack(this.config, this.state, cell);
    this.state = nextState;
    return event;
  }

  public restart(): RestartEvent {
    this.accumulatorMs = 0;
    this.state = createInitialState(this.config, this.state.bestScore);
    return { type: "restart" };
  }
}
