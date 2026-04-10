import Phaser from "phaser";
import { GameEngine } from "../../game/simulation/GameEngine";
import { loadBestScore, saveBestScore } from "../../game/simulation/storage";
import type {
  AttackEvent,
  EnemyState,
  GridCell,
  HudSnapshot,
  MovementDelta,
  SimulationEvent
} from "../../game/simulation/types";
import { AnemoneView } from "../view/AnemoneView";

interface LayoutState {
  cellSize: number;
  gridX: number;
  gridY: number;
  anemoneX: number;
  anemoneY: number;
  anemoneSize: number;
}

export interface UIBridge {
  onHudUpdate(snapshot: HudSnapshot): void;
}

type EnemyActor = {
  state: EnemyState;
  sprite: Phaser.GameObjects.Sprite;
};

export class GameScene extends Phaser.Scene {
  private readonly engine = new GameEngine(undefined, loadBestScore());
  private readonly enemyActors = new Map<string, EnemyActor>();
  private readonly bubbleSprites: Phaser.GameObjects.Arc[] = [];
  private readonly attackFlashes: Phaser.GameObjects.Arc[] = [];
  private readonly layoutState: LayoutState = {
    cellSize: 40,
    gridX: 0,
    gridY: 0,
    anemoneX: 0,
    anemoneY: 0,
    anemoneSize: 120
  };

  private background!: Phaser.GameObjects.Graphics;
  private gridGraphics!: Phaser.GameObjects.Graphics;
  private accentGraphics!: Phaser.GameObjects.Graphics;
  private anemone!: AnemoneView;
  private suspended = false;
  private lastHudKey = "";

  public constructor(
    private readonly uiBridge: UIBridge,
    private readonly onReady: (scene: GameScene) => void
  ) {
    super("game-scene");
  }

  public create(): void {
    this.background = this.add.graphics();
    this.background.setDepth(0);

    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(1);

    this.accentGraphics = this.add.graphics();
    this.accentGraphics.setDepth(2);

    this.anemone = new AnemoneView(this);

    this.createAmbientBubbles();
    this.layoutScene(this.scale.width, this.scale.height);
    this.syncEnemies(true);
    this.bindInput();
    this.scale.on("resize", this.handleResize, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off("resize", this.handleResize, this);
      this.anemone.destroy();
    });
    this.onReady(this);
    this.pushHudUpdate(true);
  }

  public update(_: number, delta: number): void {
    if (!this.suspended) {
      const events = this.engine.step(delta);
      if (events.length > 0) {
        this.consumeEvents(events);
      }
    }

    this.updateAmbient(delta);
    this.anemone.update(this.time.now);
    this.pushHudUpdate();
  }

  public setSuspended(suspended: boolean): void {
    this.suspended = suspended;
  }

  public restartRun(): void {
    this.consumeEvents([this.engine.restart()]);
  }

  private bindInput(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.suspended) {
        return;
      }

      const cell = this.cellFromPointer(pointer);
      if (!cell) {
        return;
      }

      const event = this.engine.tapCell(cell);
      if (event) {
        this.consumeEvents([event]);
      }
    });
  }

  private consumeEvents(events: SimulationEvent[]): void {
    for (const event of events) {
      switch (event.type) {
        case "restart":
          this.clearActors();
          this.syncEnemies(true);
          this.flashGrid();
          break;
        case "tick":
          this.applyTick(event.moved, event.spawned, event.despawnedIds);
          if (event.lost) {
            this.emitBestScoreIfNeeded();
          }
          break;
        case "attack":
          this.applyAttack(event);
          break;
      }
    }

    this.pushHudUpdate(true);
  }

  private applyTick(
    moved: MovementDelta[],
    spawned: EnemyState[],
    despawnedIds: string[]
  ): void {
    for (const movement of moved) {
      const actor = this.enemyActors.get(movement.id);
      if (!actor) {
        continue;
      }

      actor.state = {
        ...actor.state,
        cell: movement.to
      };

      const target = this.worldFromCell(movement.to);
      this.tweens.add({
        targets: actor.sprite,
        x: target.x,
        y: target.y,
        duration: Math.max(220, this.engine.getState().tickMs * 0.68),
        ease: "Sine.out"
      });
    }

    for (const id of despawnedIds) {
      const actor = this.enemyActors.get(id);
      if (!actor) {
        continue;
      }

      this.enemyActors.delete(id);
      this.tweens.add({
        targets: actor.sprite,
        alpha: 0,
        y: actor.sprite.y + this.layoutState.cellSize * 0.45,
        duration: 160,
        ease: "Sine.in",
        onComplete: () => actor.sprite.destroy()
      });
    }

    for (const enemy of spawned) {
      this.createEnemyActor(enemy, true);
    }
  }

  private applyAttack(event: AttackEvent): void {
    const targetPoint = this.worldFromCell(event.cell);
    this.anemone.attack(targetPoint, event.resolution, this.time.now);
    this.spawnAttackFlash(targetPoint, event.resolution === "miss");

    if (event.removedId) {
      const actor = this.enemyActors.get(event.removedId);
      if (actor) {
        actor.state =
          this.engine
            .getState()
            .enemies.find((enemy) => enemy.id === actor.state.id) ??
          actor.state;
        this.enemyActors.delete(event.removedId);
        this.tweens.add({
          targets: actor.sprite,
          scale: event.resolution === "hit-edible" ? 0.18 : 0.08,
          alpha: 0,
          angle: actor.sprite.angle + 28,
          duration: 180,
          ease: "Back.in",
          onComplete: () => actor.sprite.destroy()
        });
      }
      this.emitBestScoreIfNeeded();
    } else if (event.resolution === "miss") {
      this.cameras.main.shake(70, 0.004);
    }
  }

  private syncEnemies(force = false): void {
    for (const enemy of this.engine.getState().enemies) {
      if (!this.enemyActors.has(enemy.id)) {
        this.createEnemyActor(enemy, !force);
      } else if (force) {
        const actor = this.enemyActors.get(enemy.id);
        if (actor) {
          actor.state = enemy;
          const world = this.worldFromCell(enemy.cell);
          actor.sprite.setPosition(world.x, world.y);
        }
      }
    }
  }

  private createEnemyActor(enemy: EnemyState, animateIn: boolean): void {
    const world = this.worldFromCell(enemy.cell);
    const sprite = this.add.sprite(world.x, world.y, `${enemy.kind}-idle-0`);
    sprite.play(`${enemy.kind}-idle`);
    sprite.setDepth(3);
    sprite.setDisplaySize(
      this.layoutState.cellSize * 0.84,
      this.layoutState.cellSize * 0.84
    );
    sprite.setRotation((enemy.cell.col - 2.5) * 0.02);

    if (animateIn) {
      sprite.setAlpha(0);
      sprite.setScale(0.74);
      sprite.y -= this.layoutState.cellSize * 0.2;
      this.tweens.add({
        targets: sprite,
        alpha: 1,
        scale: 1,
        y: world.y,
        duration: 190,
        ease: "Back.out"
      });
    }

    this.enemyActors.set(enemy.id, {
      state: enemy,
      sprite
    });
  }

  private pushHudUpdate(force = false): void {
    const snapshot = this.engine.getHudSnapshot();
    const key = `${snapshot.score}:${snapshot.bestScore}:${snapshot.streak}:${snapshot.multiplier}:${Math.ceil(
      snapshot.speciesBonusRemainingMs / 100
    )}:${snapshot.phase}`;

    if (!force && key === this.lastHudKey) {
      return;
    }

    this.lastHudKey = key;
    this.uiBridge.onHudUpdate(snapshot);
  }

  private emitBestScoreIfNeeded(): void {
    const state = this.engine.getState();
    saveBestScore(state.bestScore);
  }

  private worldFromCell(cell: GridCell): Phaser.Math.Vector2 {
    const x =
      this.layoutState.gridX + this.layoutState.cellSize * (cell.col + 0.5);
    const y =
      this.layoutState.gridY + this.layoutState.cellSize * (cell.row + 0.5);
    return new Phaser.Math.Vector2(x, y);
  }

  private cellFromPointer(pointer: Phaser.Input.Pointer): GridCell | null {
    const col = Math.floor(
      (pointer.x - this.layoutState.gridX) / this.layoutState.cellSize
    );
    const row = Math.floor(
      (pointer.y - this.layoutState.gridY) / this.layoutState.cellSize
    );

    if (col < 0 || row < 0 || col >= 6 || row >= 8) {
      return null;
    }

    return { col, row };
  }

  private layoutScene(width: number, height: number): void {
    const safeTop = Math.max(74, height * 0.12);
    const safeBottom = Math.max(170, height * 0.24);
    const sidePadding = Math.max(18, width * 0.05);
    const cellSize = Math.floor(
      Math.min(
        (width - sidePadding * 2) / 6,
        (height - safeTop - safeBottom) / 8
      )
    );
    const gridWidth = cellSize * 6;
    const gridHeight = cellSize * 8;

    this.layoutState.cellSize = cellSize;
    this.layoutState.gridX = Math.floor((width - gridWidth) / 2);
    this.layoutState.gridY = Math.floor(safeTop);
    this.layoutState.anemoneX = width / 2;
    this.layoutState.anemoneY =
      this.layoutState.gridY + gridHeight + cellSize * 0.9;
    this.layoutState.anemoneSize = Math.max(112, cellSize * 2.25);

    this.drawBackground(width, height);
    this.drawGrid(gridWidth, gridHeight);
    this.anemone.layout(
      this.layoutState.anemoneX,
      this.layoutState.anemoneY,
      this.layoutState.anemoneSize
    );

    for (const actor of this.enemyActors.values()) {
      const position = this.worldFromCell(actor.state.cell);
      actor.sprite.setPosition(position.x, position.y);
      actor.sprite.setDisplaySize(cellSize * 0.84, cellSize * 0.84);
    }
  }

  private drawBackground(width: number, height: number): void {
    this.background.clear();
    this.background.fillGradientStyle(
      0x072544,
      0x072544,
      0x02111f,
      0x02111f,
      1
    );
    this.background.fillRect(0, 0, width, height);
    this.background.fillStyle(0x0d5f80, 0.15);
    this.background.fillCircle(width * 0.22, height * 0.2, width * 0.28);
    this.background.fillStyle(0x65ffd9, 0.08);
    this.background.fillCircle(width * 0.76, height * 0.32, width * 0.18);
    this.background.fillStyle(0x0c3752, 0.4);
    this.background.fillEllipse(
      width / 2,
      height * 0.94,
      width * 0.9,
      height * 0.16
    );
  }

  private drawGrid(gridWidth: number, gridHeight: number): void {
    this.gridGraphics.clear();
    this.gridGraphics.lineStyle(1, 0x86ddff, 0.08);
    this.gridGraphics.strokeRoundedRect(
      this.layoutState.gridX - 6,
      this.layoutState.gridY - 6,
      gridWidth + 12,
      gridHeight + 12,
      18
    );

    for (let col = 0; col <= 6; col += 1) {
      const x = this.layoutState.gridX + col * this.layoutState.cellSize;
      this.gridGraphics.lineBetween(
        x,
        this.layoutState.gridY,
        x,
        this.layoutState.gridY + gridHeight
      );
    }

    for (let row = 0; row <= 8; row += 1) {
      const y = this.layoutState.gridY + row * this.layoutState.cellSize;
      this.gridGraphics.lineBetween(
        this.layoutState.gridX,
        y,
        this.layoutState.gridX + gridWidth,
        y
      );
    }

    this.accentGraphics.clear();
    this.accentGraphics.fillStyle(0x7af6d9, 0.12);
    this.accentGraphics.fillRoundedRect(
      this.layoutState.gridX,
      this.layoutState.gridY + gridHeight - this.layoutState.cellSize,
      gridWidth,
      this.layoutState.cellSize,
      12
    );
  }

  private createAmbientBubbles(): void {
    for (let index = 0; index < 12; index += 1) {
      const bubble = this.add.circle(
        Phaser.Math.Between(20, Math.max(20, this.scale.width - 20)),
        Phaser.Math.Between(0, Math.max(20, this.scale.height)),
        Phaser.Math.Between(2, 7),
        0xb4f7ff,
        Phaser.Math.FloatBetween(0.08, 0.26)
      );
      bubble.setDepth(0.5);
      this.bubbleSprites.push(bubble);
    }
  }

  private updateAmbient(delta: number): void {
    const speed = delta * 0.02;
    for (const bubble of this.bubbleSprites) {
      bubble.y -= speed * (0.5 + bubble.radius * 0.2);
      bubble.x +=
        Math.sin((this.time.now + bubble.radius * 100) * 0.0012) * 0.18;

      if (bubble.y < -20) {
        bubble.y = this.scale.height + Phaser.Math.Between(10, 40);
        bubble.x = Phaser.Math.Between(20, Math.max(20, this.scale.width - 20));
      }
    }
  }

  private spawnAttackFlash(target: Phaser.Math.Vector2, miss: boolean): void {
    const flash = this.add.circle(
      target.x,
      target.y,
      this.layoutState.cellSize * 0.18,
      miss ? 0xff9ca6 : 0x9dfff0,
      0.72
    );
    flash.setDepth(6);
    this.attackFlashes.push(flash);
    this.tweens.add({
      targets: flash,
      scale: 3.2,
      alpha: 0,
      duration: 160,
      ease: "Sine.out",
      onComplete: () => {
        Phaser.Utils.Array.Remove(this.attackFlashes, flash);
        flash.destroy();
      }
    });
  }

  private flashGrid(): void {
    this.cameras.main.flash(180, 88, 214, 198, false);
  }

  private clearActors(): void {
    for (const actor of this.enemyActors.values()) {
      actor.sprite.destroy();
    }
    this.enemyActors.clear();
  }

  private handleResize(gameSize: Phaser.Structs.Size): void {
    this.layoutScene(gameSize.width, gameSize.height);
  }
}
