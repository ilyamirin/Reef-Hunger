import Phaser from "phaser";
import { AUDIO_DEFINITIONS } from "../audio/AudioController";
import { registerGeneratedTextures } from "../view/generatedTextures";

export class BootScene extends Phaser.Scene {
  public constructor() {
    super("boot-scene");
  }

  public preload(): void {
    for (const [cue, definition] of Object.entries(AUDIO_DEFINITIONS)) {
      this.load.audio(cue, `audio/${definition.file}`);
    }
  }

  public create(): void {
    registerGeneratedTextures(this);
    this.scene.start("game-scene");
  }
}
