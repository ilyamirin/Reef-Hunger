import Phaser from "phaser";

export type AudioCue =
  | "startRun"
  | "restart"
  | "hitEdible"
  | "hitJunk"
  | "miss"
  | "comboUp"
  | "comboBreak"
  | "speciesBonus"
  | "danger"
  | "gameOver"
  | "ambientUnderwater";

type AudioDefinition = {
  file: string;
  volume: number;
  loop?: boolean;
  detuneRange?: number;
};

type AdjustableSound =
  | Phaser.Sound.WebAudioSound
  | Phaser.Sound.HTML5AudioSound;

export const AUDIO_DEFINITIONS: Record<AudioCue, AudioDefinition> = {
  startRun: {
    file: "start-run.mp3",
    volume: 0.36
  },
  restart: {
    file: "restart.mp3",
    volume: 0.32
  },
  hitEdible: {
    file: "hit-edible.mp3",
    volume: 0.38,
    detuneRange: 80
  },
  hitJunk: {
    file: "hit-junk.mp3",
    volume: 0.34,
    detuneRange: 45
  },
  miss: {
    file: "miss.mp3",
    volume: 0.28
  },
  comboUp: {
    file: "combo-up.mp3",
    volume: 0.34
  },
  comboBreak: {
    file: "combo-break.mp3",
    volume: 0.32
  },
  speciesBonus: {
    file: "species-bonus.mp3",
    volume: 0.48
  },
  danger: {
    file: "danger.mp3",
    volume: 0.42
  },
  gameOver: {
    file: "game-over.mp3",
    volume: 0.48
  },
  ambientUnderwater: {
    file: "ambient-underwater.mp3",
    volume: 0.14,
    loop: true
  }
};

const dangerCooldownMs = 1_200;

export class AudioController {
  private unlocked = false;
  private ambientSound: AdjustableSound | null = null;
  private ambientPaused = false;
  private dangerCooldownUntil = 0;

  public constructor(private readonly scene: Phaser.Scene) {}

  public unlock(): void {
    this.unlocked = true;
  }

  public play(cue: AudioCue): void {
    if (!this.unlocked || cue === "ambientUnderwater") {
      return;
    }

    if (cue === "danger" && this.scene.time.now < this.dangerCooldownUntil) {
      return;
    }

    if (cue === "danger") {
      this.dangerCooldownUntil = this.scene.time.now + dangerCooldownMs;
    }

    const definition = AUDIO_DEFINITIONS[cue];
    const detune = definition.detuneRange
      ? Phaser.Math.Between(-definition.detuneRange, definition.detuneRange)
      : 0;

    this.scene.sound.play(cue, {
      volume: definition.volume,
      detune
    });
  }

  public startAmbient(): void {
    if (!this.unlocked) {
      return;
    }

    if (!this.ambientSound) {
      const definition = AUDIO_DEFINITIONS.ambientUnderwater;
      this.ambientSound = this.scene.sound.add("ambientUnderwater", {
        loop: true,
        volume: definition.volume
      }) as AdjustableSound;
    }

    if (this.ambientPaused) {
      this.ambientSound.resume();
      this.ambientPaused = false;
      return;
    }

    if (!this.ambientSound.isPlaying) {
      this.ambientSound.play();
    }
  }

  public stopAmbient(fadeMs = 260): void {
    if (!this.ambientSound) {
      return;
    }

    const sound = this.ambientSound;
    const baseVolume = AUDIO_DEFINITIONS.ambientUnderwater.volume;

    if (fadeMs <= 0 || !sound.isPlaying) {
      sound.stop();
      sound.setVolume(baseVolume);
      this.ambientPaused = false;
      return;
    }

    const fader = { volume: sound.volume };
    this.scene.tweens.add({
      targets: fader,
      volume: 0,
      duration: fadeMs,
      ease: "Sine.out",
      onUpdate: () => sound.setVolume(fader.volume),
      onComplete: () => {
        sound.stop();
        sound.setVolume(baseVolume);
        this.ambientPaused = false;
      }
    });
  }

  public setSuspended(suspended: boolean): void {
    if (!this.ambientSound || !this.unlocked) {
      return;
    }

    if (suspended && this.ambientSound.isPlaying) {
      this.ambientSound.pause();
      this.ambientPaused = true;
      return;
    }

    if (!suspended && this.ambientPaused) {
      this.ambientSound.resume();
      this.ambientPaused = false;
    }
  }

  public handleRunRestart(): void {
    this.unlock();
    this.play("restart");
    this.startAmbient();
  }

  public handleGameOver(): void {
    this.play("gameOver");
    this.stopAmbient();
  }

  public destroy(): void {
    this.ambientSound?.destroy();
    this.ambientSound = null;
  }
}
