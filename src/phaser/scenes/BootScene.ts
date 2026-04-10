import Phaser from "phaser";
import { registerGeneratedTextures } from "../view/generatedTextures";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super("boot-scene");
  }

  public create(): void {
    registerGeneratedTextures(this);
    this.scene.start("game-scene");
  }
}
