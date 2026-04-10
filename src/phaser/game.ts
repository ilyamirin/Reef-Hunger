import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene, type UIBridge } from "./scenes/GameScene";

export class ReefHungerGame {
  private readonly game: Phaser.Game;
  private scene: GameScene | null = null;
  private suspended = false;

  public constructor(parent: HTMLElement, bridge: UIBridge) {
    this.game = new Phaser.Game({
      type: Phaser.AUTO,
      parent,
      backgroundColor: "#04172c",
      render: {
        antialias: true,
        pixelArt: false,
        roundPixels: false
      },
      scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: parent.clientWidth,
        height: parent.clientHeight
      },
      scene: [
        new BootScene(),
        new GameScene(bridge, (scene) => {
          this.scene = scene;
          this.scene.setSuspended(this.suspended);
        })
      ]
    });
  }

  public restart(): void {
    this.scene?.restartRun();
  }

  public setSuspended(suspended: boolean): void {
    this.suspended = suspended;
    this.scene?.setSuspended(suspended);
  }

  public destroy(): void {
    this.game.destroy(true);
  }
}
