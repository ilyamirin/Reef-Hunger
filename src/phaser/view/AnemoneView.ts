import Phaser from "phaser";
import type { AttackResolution } from "../../game/simulation/types";

interface TentacleState {
  phaseOffset: number;
  restAngle: number;
  restLength: number;
  busyUntilMs: number;
  attackStartMs: number;
  target: Phaser.Math.Vector2 | null;
}

export class AnemoneView {
  private readonly body: Phaser.GameObjects.Sprite;
  private readonly graphics: Phaser.GameObjects.Graphics;
  private readonly tipSprites: Phaser.GameObjects.Image[];
  private readonly tentacles: TentacleState[];
  private readonly baseAnchors: Phaser.Math.Vector2[] = [];
  private center = new Phaser.Math.Vector2(0, 0);
  private bodyRadius = 48;
  private mouthOpenUntilMs = 0;

  public constructor(
    private readonly scene: Phaser.Scene,
    tentacleCount = 11
  ) {
    this.graphics = scene.add.graphics();
    this.graphics.setDepth(4);

    this.body = scene.add.sprite(0, 0, "anemone-body-0");
    this.body.play("anemone-body-idle");
    this.body.setDepth(5);

    this.tentacles = Array.from({ length: tentacleCount }, (_, index) => ({
      phaseOffset: index * 0.7,
      restAngle: Phaser.Math.DegToRad(
        -150 + index * (300 / Math.max(1, tentacleCount - 1))
      ),
      restLength: 64 + Math.sin(index * 1.4) * 10,
      busyUntilMs: 0,
      attackStartMs: 0,
      target: null
    }));

    this.tipSprites = this.tentacles.map(() => {
      const sprite = scene.add.image(0, 0, "tentacle-tip");
      sprite.setDepth(6);
      sprite.setScale(0.82);
      return sprite;
    });
  }

  public layout(x: number, y: number, width: number): void {
    this.center.set(x, y);
    this.bodyRadius = width * 0.42;
    this.body.setPosition(x, y);
    this.body.setDisplaySize(width, width);

    this.baseAnchors.length = 0;
    for (const tentacle of this.tentacles) {
      const anchor = new Phaser.Math.Vector2(
        x + Math.cos(tentacle.restAngle) * (this.bodyRadius * 0.72),
        y + Math.sin(tentacle.restAngle) * (this.bodyRadius * 0.42)
      );
      this.baseAnchors.push(anchor);
    }
  }

  public attack(
    target: Phaser.Math.Vector2,
    resolution: AttackResolution,
    nowMs: number
  ): void {
    const index = this.findClosestTentacle(target);
    if (index === -1) {
      return;
    }

    const tentacle = this.tentacles[index];
    tentacle.attackStartMs = nowMs;
    tentacle.busyUntilMs = nowMs + 360;
    tentacle.target = target.clone();
    this.mouthOpenUntilMs =
      resolution === "hit-edible" ? nowMs + 260 : this.mouthOpenUntilMs;
  }

  public clear(): void {
    this.graphics.clear();
    for (const tip of this.tipSprites) {
      tip.setVisible(false);
    }
  }

  public update(nowMs: number): void {
    this.graphics.clear();
    this.body.setScale(
      1 + Math.sin(nowMs * 0.0024) * 0.02,
      1 + Math.cos(nowMs * 0.0021) * 0.018
    );
    this.body.setTint(nowMs < this.mouthOpenUntilMs ? 0xffd8cb : 0xffffff);

    for (let index = 0; index < this.tentacles.length; index += 1) {
      const tentacle = this.tentacles[index];
      const anchor = this.baseAnchors[index];
      const tipSprite = this.tipSprites[index];
      if (!anchor) {
        continue;
      }

      const attackProgress =
        nowMs < tentacle.busyUntilMs
          ? Phaser.Math.Clamp(
              (nowMs - tentacle.attackStartMs) /
                (tentacle.busyUntilMs - tentacle.attackStartMs),
              0,
              1
            )
          : 0;
      const extend =
        attackProgress > 0 ? Math.sin(attackProgress * Math.PI) : 0;
      const sway = Math.sin(nowMs * 0.003 + tentacle.phaseOffset) * 10;
      const idleAngle =
        tentacle.restAngle +
        Math.sin(nowMs * 0.0024 + tentacle.phaseOffset) * 0.18;
      const idleLength = tentacle.restLength + sway;

      const tip = tentacle.target
        ? anchor.clone().lerp(tentacle.target, extend)
        : anchor.clone();

      const idleTip = new Phaser.Math.Vector2(
        anchor.x + Math.cos(idleAngle) * idleLength,
        anchor.y + Math.sin(idleAngle) * idleLength
      );

      tip.lerp(idleTip, 1 - extend);

      const controlA = new Phaser.Math.Vector2(
        anchor.x + Math.cos(idleAngle - 0.4) * idleLength * 0.34,
        anchor.y + Math.sin(idleAngle - 0.2) * idleLength * 0.24
      );
      const controlB = tentacle.target
        ? new Phaser.Math.Vector2(
            Phaser.Math.Interpolation.Linear(
              [anchor.x, tentacle.target.x],
              0.65
            ),
            Phaser.Math.Interpolation.Linear(
              [anchor.y, tentacle.target.y],
              0.65
            ) - 12
          )
        : new Phaser.Math.Vector2(
            anchor.x + Math.cos(idleAngle + 0.3) * idleLength * 0.72,
            anchor.y + Math.sin(idleAngle + 0.2) * idleLength * 0.66
          );

      const curve = new Phaser.Curves.CubicBezier(
        anchor,
        controlA,
        controlB,
        tip
      );
      const points = curve.getPoints(10);
      this.graphics.lineStyle(8, 0x45e1da, 0.22);
      this.graphics.beginPath();
      this.graphics.moveTo(points[0].x, points[0].y);
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        this.graphics.lineTo(points[pointIndex].x, points[pointIndex].y);
      }
      this.graphics.strokePath();
      this.graphics.lineStyle(4, 0xffb0c0, 0.92);
      this.graphics.beginPath();
      this.graphics.moveTo(points[0].x, points[0].y);
      for (let pointIndex = 1; pointIndex < points.length; pointIndex += 1) {
        this.graphics.lineTo(points[pointIndex].x, points[pointIndex].y);
      }
      this.graphics.strokePath();

      tipSprite.setVisible(true);
      tipSprite.setPosition(tip.x, tip.y);
      tipSprite.setScale(0.72 + extend * 0.24);
      tipSprite.setAlpha(0.7 + extend * 0.3);

      if (nowMs >= tentacle.busyUntilMs) {
        tentacle.target = null;
      }
    }
  }

  public destroy(): void {
    this.graphics.destroy();
    this.body.destroy();
    for (const sprite of this.tipSprites) {
      sprite.destroy();
    }
  }

  private findClosestTentacle(target: Phaser.Math.Vector2): number {
    let closestIndex = -1;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let index = 0; index < this.baseAnchors.length; index += 1) {
      const anchor = this.baseAnchors[index];
      const tentacle = this.tentacles[index];
      if (tentacle.busyUntilMs > this.scene.time.now) {
        continue;
      }

      const distance = Phaser.Math.Distance.Between(
        anchor.x,
        anchor.y,
        target.x,
        target.y
      );
      if (distance < bestDistance) {
        bestDistance = distance;
        closestIndex = index;
      }
    }

    return closestIndex === -1 ? 0 : closestIndex;
  }
}
