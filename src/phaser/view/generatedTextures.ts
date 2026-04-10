import Phaser from "phaser";
import type { EnemyKind } from "../../game/simulation/types";

const frameSize = 96;
const tipSize = 28;

const enemyColors: Record<
  EnemyKind,
  { main: number; alt: number; glow: number }
> = {
  fish: { main: 0x64f2d9, alt: 0x1aa3b2, glow: 0xbffff0 },
  crab: { main: 0xff8e73, alt: 0xd84b59, glow: 0xffd1bf },
  starfish: { main: 0xffcd72, alt: 0xff8962, glow: 0xfff0b7 },
  urchin: { main: 0x9d85ff, alt: 0x4f43cb, glow: 0xd7cbff },
  diver: { main: 0x7bc0ff, alt: 0x204a87, glow: 0xdbf4ff },
  tire: { main: 0x20242b, alt: 0x57606d, glow: 0x707b89 },
  anchor: { main: 0xafc0d0, alt: 0x5c7590, glow: 0x0d2742 },
  plate: { main: 0xf6e37a, alt: 0x181818, glow: 0xe9d35a }
};

const clearGraphics = (scene: Phaser.Scene): Phaser.GameObjects.Graphics =>
  scene.add.graphics({ x: 0, y: 0 });

const generateFrame = (
  scene: Phaser.Scene,
  key: string,
  draw: (graphics: Phaser.GameObjects.Graphics) => void,
  width = frameSize,
  height = frameSize
): void => {
  if (scene.textures.exists(key)) {
    return;
  }

  const graphics = clearGraphics(scene);
  draw(graphics);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
};

const drawFish = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.glow, 0.18);
  graphics.fillEllipse(48, 48, 70 + wobble * 2, 46 + wobble * 2);
  graphics.fillStyle(colors.main, 1);
  graphics.fillEllipse(50, 48, 46, 28 + wobble);
  graphics.fillTriangle(28, 48, 12, 34 + wobble, 12, 62 - wobble);
  graphics.fillStyle(colors.alt, 1);
  graphics.fillTriangle(49, 36, 58, 19 + wobble, 66, 36);
  graphics.fillTriangle(52, 60, 59, 48, 67, 60 + wobble);
  graphics.fillStyle(0xffffff, 0.85);
  graphics.fillCircle(62, 44, 4);
  graphics.fillStyle(0x042134, 0.95);
  graphics.fillCircle(63, 44, 2);
};

const drawCrab = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.glow, 0.16);
  graphics.fillCircle(48, 48, 34 + wobble);
  graphics.fillStyle(colors.main, 1);
  graphics.fillEllipse(48, 54, 42, 26 + wobble);
  graphics.fillStyle(colors.alt, 1);
  graphics.fillTriangle(26, 50, 12, 34 + wobble, 20, 56);
  graphics.fillTriangle(70, 50, 84, 34 + wobble, 76, 56);
  graphics.fillRect(20, 58, 8, 18);
  graphics.fillRect(32, 62, 8, 16);
  graphics.fillRect(56, 62, 8, 16);
  graphics.fillRect(68, 58, 8, 18);
  graphics.fillStyle(0xffffff, 0.85);
  graphics.fillCircle(38, 38 - wobble, 4);
  graphics.fillCircle(58, 38 + wobble, 4);
};

const drawStarfish = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.glow, 0.14);
  graphics.fillCircle(48, 48, 30 + wobble * 2);
  graphics.fillStyle(colors.main, 1);
  graphics.beginPath();
  graphics.moveTo(48, 14 + wobble);
  graphics.lineTo(58, 38);
  graphics.lineTo(82 - wobble, 40);
  graphics.lineTo(63, 54);
  graphics.lineTo(70, 80 - wobble);
  graphics.lineTo(48, 64);
  graphics.lineTo(26, 80 - wobble);
  graphics.lineTo(33, 54);
  graphics.lineTo(14 + wobble, 40);
  graphics.lineTo(38, 38);
  graphics.closePath();
  graphics.fillPath();
  graphics.fillStyle(colors.alt, 0.9);
  graphics.fillCircle(48, 48, 11 + wobble * 0.5);
};

const drawUrchin = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.lineStyle(4, colors.alt, 1);
  for (let spike = 0; spike < 12; spike += 1) {
    const angle = Phaser.Math.DegToRad(spike * 30 + wobble * 8);
    const startX = 48 + Math.cos(angle) * 16;
    const startY = 48 + Math.sin(angle) * 16;
    const endX = 48 + Math.cos(angle) * 34;
    const endY = 48 + Math.sin(angle) * 34;
    graphics.beginPath();
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.strokePath();
  }
  graphics.fillStyle(colors.glow, 0.14);
  graphics.fillCircle(48, 48, 28);
  graphics.fillStyle(colors.main, 1);
  graphics.fillCircle(48, 48, 20 + wobble * 0.4);
};

const drawDiver = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.glow, 0.14);
  graphics.fillRoundedRect(22, 18, 52, 56, 18);
  graphics.fillStyle(colors.alt, 1);
  graphics.fillRoundedRect(36, 20, 24, 34, 10);
  graphics.fillStyle(colors.main, 1);
  graphics.fillEllipse(48, 59, 26, 20);
  graphics.fillRect(38 - wobble, 50, 6, 20);
  graphics.fillRect(52 + wobble, 50, 6, 20);
  graphics.fillTriangle(30, 72, 12, 84, 30, 84);
  graphics.fillTriangle(66, 72, 84, 84, 66, 84);
  graphics.fillStyle(0xeefaff, 0.92);
  graphics.fillRoundedRect(38, 24, 20, 10, 5);
};

const drawTire = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.main, 1);
  graphics.fillEllipse(48, 48, 66 + wobble * 0.3, 64 + wobble * 0.3);
  graphics.fillStyle(0x0e1218, 1);
  graphics.fillEllipse(48, 48, 46, 44);
  graphics.fillStyle(0x2c3139, 1);
  graphics.fillCircle(48, 48, 16);
  graphics.fillStyle(0x101419, 1);
  graphics.fillCircle(48, 48, 7);

  graphics.lineStyle(6, colors.alt, 1);
  graphics.beginPath();
  graphics.moveTo(48, 16);
  graphics.lineTo(48, 28);
  graphics.moveTo(48, 68);
  graphics.lineTo(48, 80);
  graphics.moveTo(16, 48);
  graphics.lineTo(28, 48);
  graphics.moveTo(68, 48);
  graphics.lineTo(80, 48);
  graphics.moveTo(24, 24);
  graphics.lineTo(33, 33);
  graphics.moveTo(63, 63);
  graphics.lineTo(72, 72);
  graphics.moveTo(63, 33);
  graphics.lineTo(72, 24);
  graphics.moveTo(24, 72);
  graphics.lineTo(33, 63);
  graphics.strokePath();

  graphics.lineStyle(4, colors.glow, 1);
  graphics.beginPath();
  graphics.moveTo(36, 18);
  graphics.lineTo(40, 32);
  graphics.moveTo(60, 18);
  graphics.lineTo(56, 32);
  graphics.moveTo(75, 36);
  graphics.lineTo(61, 40);
  graphics.moveTo(75, 60);
  graphics.lineTo(61, 56);
  graphics.moveTo(36, 78);
  graphics.lineTo(40, 64);
  graphics.moveTo(60, 78);
  graphics.lineTo(56, 64);
  graphics.moveTo(21, 36);
  graphics.lineTo(35, 40);
  graphics.moveTo(21, 60);
  graphics.lineTo(35, 56);
  graphics.strokePath();
};

const drawAnchor = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.lineStyle(8, colors.main, 1);
  graphics.strokeCircle(48, 20, 12);
  graphics.beginPath();
  graphics.moveTo(48, 34);
  graphics.lineTo(48, 74);
  graphics.strokePath();
  graphics.lineStyle(12, colors.alt, 1);
  graphics.beginPath();
  graphics.moveTo(20, 56);
  graphics.lineTo(48, 84);
  graphics.lineTo(76, 56);
  graphics.strokePath();
  graphics.lineStyle(6, colors.main, 1);
  graphics.beginPath();
  graphics.moveTo(18, 56);
  graphics.lineTo(48, 84);
  graphics.lineTo(78, 56);
  graphics.strokePath();
};

const drawPlate = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  graphics.fillStyle(colors.main, 1);
  graphics.fillRoundedRect(14, 24, 68, 44, 10);
  graphics.lineStyle(3, colors.glow, 1);
  graphics.strokeRoundedRect(14, 24, 68, 44, 10);
  graphics.fillStyle(0x8b7718, 1);
  graphics.fillCircle(24, 34, 2.5);
  graphics.fillCircle(72, 34, 2.5);
  graphics.fillStyle(0x3c320a, 1);
  graphics.fillRect(28, 36, 8, 4);
  graphics.fillRect(40, 36, 8, 4);
  graphics.fillRect(52, 36, 8, 4);
  graphics.fillRect(64, 36, 8, 4);
  graphics.fillStyle(colors.alt, 1);
  graphics.fillRect(30, 50, 10, 5);
  graphics.fillRect(44, 50, 12, 5);
  graphics.fillRect(60, 50, 10 + wobble * 0.3, 5);
};

const drawAnemoneBody = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number
): void => {
  graphics.fillStyle(0x3ef0d7, 0.16);
  graphics.fillEllipse(60, 62, 106 + wobble * 6, 82 + wobble * 4);
  graphics.fillStyle(0x32d6d8, 1);
  graphics.fillEllipse(60, 62, 80 + wobble * 4, 54 + wobble * 2);
  graphics.fillStyle(0xff98aa, 0.92);
  graphics.fillEllipse(60, 58, 52, 28 + wobble);
  graphics.fillStyle(0x14748f, 0.9);
  graphics.fillEllipse(60, 90, 26, 44);
  graphics.fillStyle(0xffffff, 0.22);
  graphics.fillEllipse(48, 50, 18, 12);
};

const drawTentacleTip = (graphics: Phaser.GameObjects.Graphics): void => {
  graphics.fillStyle(0xffc6d2, 1);
  graphics.fillCircle(14, 14, 10);
  graphics.fillStyle(0xffffff, 0.36);
  graphics.fillCircle(11, 11, 4);
};

const registerEnemyAnimations = (
  scene: Phaser.Scene,
  kind: EnemyKind
): void => {
  const key = `${kind}-idle`;
  if (scene.anims.exists(key)) {
    return;
  }

  scene.anims.create({
    key,
    frames: Array.from({ length: 4 }, (_, index) => ({
      key: `${kind}-idle-${index}`
    })),
    frameRate: 6,
    repeat: -1
  });
};

export const registerGeneratedTextures = (scene: Phaser.Scene): void => {
  for (const [kind, colors] of Object.entries(enemyColors) as Array<
    [EnemyKind, { main: number; alt: number; glow: number }]
  >) {
    for (let frame = 0; frame < 4; frame += 1) {
      const wobble = Math.sin((frame / 4) * Math.PI * 2) * 4;
      generateFrame(scene, `${kind}-idle-${frame}`, (graphics) => {
        switch (kind) {
          case "fish":
            drawFish(graphics, wobble, colors);
            break;
          case "crab":
            drawCrab(graphics, wobble, colors);
            break;
          case "starfish":
            drawStarfish(graphics, wobble, colors);
            break;
          case "urchin":
            drawUrchin(graphics, wobble, colors);
            break;
          case "diver":
            drawDiver(graphics, wobble, colors);
            break;
          case "tire":
            drawTire(graphics, wobble, colors);
            break;
          case "anchor":
            drawAnchor(graphics, wobble, colors);
            break;
          case "plate":
            drawPlate(graphics, wobble, colors);
            break;
        }
      });
    }
    registerEnemyAnimations(scene, kind);
  }

  for (let frame = 0; frame < 6; frame += 1) {
    const wobble = Math.sin((frame / 6) * Math.PI * 2) * 3;
    generateFrame(
      scene,
      `anemone-body-${frame}`,
      (graphics) => drawAnemoneBody(graphics, wobble),
      120,
      120
    );
  }

  if (!scene.anims.exists("anemone-body-idle")) {
    scene.anims.create({
      key: "anemone-body-idle",
      frames: Array.from({ length: 6 }, (_, index) => ({
        key: `anemone-body-${index}`
      })),
      frameRate: 7,
      repeat: -1
    });
  }

  generateFrame(scene, "tentacle-tip", drawTentacleTip, tipSize, tipSize);
};
