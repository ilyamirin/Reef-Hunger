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
  urchin: { main: 0xd97a97, alt: 0xf7c7da, glow: 0x8a3d61 },
  spermwhale: { main: 0x73c3f6, alt: 0x4c98d3, glow: 0xedf9ff },
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
  const baseY = 56;
  const coreRadius = 22;
  const innerRadius = 16;
  const outerRing = 30 + wobble * 0.4;
  const spikeLengths = [12, 15, 13, 17, 11, 16, 12, 14, 18, 13, 15, 12, 16, 11];

  graphics.lineStyle(4, colors.glow, 0.92);
  for (let spike = 0; spike < spikeLengths.length; spike += 1) {
    const angle = Phaser.Math.DegToRad(198 + spike * 11 + wobble * 2);
    const startX = 48 + Math.cos(angle) * innerRadius;
    const startY = baseY + Math.sin(angle) * (innerRadius - 1);
    const endX = 48 + Math.cos(angle) * (outerRing + spikeLengths[spike]);
    const endY = baseY + Math.sin(angle) * (outerRing + spikeLengths[spike]);
    graphics.beginPath();
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.strokePath();
  }

  graphics.lineStyle(3, colors.alt, 0.98);
  for (let spike = 0; spike < 16; spike += 1) {
    const angle = Phaser.Math.DegToRad(208 + spike * 8 + wobble * 1.5);
    const startX = 48 + Math.cos(angle) * 12;
    const startY = baseY - 1 + Math.sin(angle) * 10;
    const endX = 48 + Math.cos(angle) * 27;
    const endY = baseY - 4 + Math.sin(angle) * 24;
    graphics.beginPath();
    graphics.moveTo(startX, startY);
    graphics.lineTo(endX, endY);
    graphics.strokePath();
  }

  graphics.fillStyle(0x6d2341, 1);
  graphics.fillEllipse(48, 58, 46, 26);
  graphics.fillStyle(colors.main, 1);
  graphics.fillEllipse(48, 54, coreRadius * 2.3, coreRadius * 1.55);
  graphics.fillStyle(0xe9a7be, 1);
  graphics.fillEllipse(48, 50, 27, 13);
  graphics.fillStyle(0xf7dce6, 0.9);
  graphics.fillEllipse(42, 47, 12, 7);
};

const drawSpermWhale = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number }
): void => {
  const bob = wobble * 0.6;

  graphics.fillStyle(colors.main, 1);
  graphics.beginPath();
  graphics.moveTo(18, 58);
  graphics.lineTo(28, 35 + bob);
  graphics.lineTo(46, 22);
  graphics.lineTo(73, 18);
  graphics.lineTo(88, 24);
  graphics.lineTo(92, 37);
  graphics.lineTo(90, 53);
  graphics.lineTo(82, 68);
  graphics.lineTo(70, 80);
  graphics.lineTo(51, 89);
  graphics.lineTo(30, 91);
  graphics.lineTo(16, 82);
  graphics.lineTo(11, 70);
  graphics.closePath();
  graphics.fillPath();

  graphics.fillStyle(colors.glow, 1);
  graphics.beginPath();
  graphics.moveTo(38, 42);
  graphics.lineTo(49, 32);
  graphics.lineTo(66, 27);
  graphics.lineTo(83, 29);
  graphics.lineTo(87, 40);
  graphics.lineTo(84, 54);
  graphics.lineTo(66, 55);
  graphics.lineTo(49, 52);
  graphics.closePath();
  graphics.fillPath();

  graphics.fillStyle(colors.glow, 0.98);
  graphics.fillEllipse(60, 74, 70, 30);

  graphics.fillStyle(colors.alt, 1);
  graphics.beginPath();
  graphics.moveTo(76, 67);
  graphics.lineTo(92, 56);
  graphics.lineTo(89, 78);
  graphics.closePath();
  graphics.fillPath();

  graphics.beginPath();
  graphics.moveTo(44, 84);
  graphics.lineTo(30, 95);
  graphics.lineTo(34, 79);
  graphics.closePath();
  graphics.fillPath();

  graphics.beginPath();
  graphics.moveTo(64, 84);
  graphics.lineTo(80, 97);
  graphics.lineTo(73, 79);
  graphics.closePath();
  graphics.fillPath();

  graphics.beginPath();
  graphics.moveTo(19, 74);
  graphics.lineTo(4, 86);
  graphics.lineTo(8, 67);
  graphics.closePath();
  graphics.fillPath();

  graphics.fillStyle(0xf8fdff, 1);
  graphics.fillCircle(34, 48, 8);
  graphics.fillStyle(0x06111d, 1);
  graphics.fillCircle(37, 50, 3.5);

  graphics.lineStyle(4, 0x334b64, 1);
  graphics.beginPath();
  graphics.moveTo(33, 67);
  graphics.lineTo(48, 71 + bob);
  graphics.lineTo(61, 70);
  graphics.lineTo(73, 66);
  graphics.strokePath();

  graphics.lineStyle(4, 0x334b64, 1);
  graphics.beginPath();
  graphics.moveTo(30, 40);
  graphics.lineTo(39, 34);
  graphics.lineTo(50, 35);
  graphics.strokePath();

  graphics.lineStyle(5, 0xbdebff, 0.95);
  graphics.beginPath();
  graphics.moveTo(28, 26);
  graphics.lineTo(34, 16);
  graphics.lineTo(47, 11);
  graphics.moveTo(40, 23);
  graphics.lineTo(46, 16);
  graphics.lineTo(58, 11);
  graphics.strokePath();
};

const drawTire = (
  graphics: Phaser.GameObjects.Graphics,
  wobble: number,
  colors: { main: number; alt: number; glow: number },
  frame: number
): void => {
  const centerX = 48;
  const centerY = 48;
  const rotation = Phaser.Math.DegToRad(frame * 18);

  graphics.lineStyle(13, colors.main, 1);
  graphics.strokeEllipse(
    centerX,
    centerY,
    58 + wobble * 0.3,
    56 + wobble * 0.3
  );
  graphics.lineStyle(7, 0x2d323a, 1);
  graphics.strokeEllipse(centerX, centerY, 50, 48);
  graphics.lineStyle(4, 0x76808d, 0.85);
  graphics.strokeEllipse(centerX, centerY, 60, 58);

  graphics.lineStyle(5, colors.alt, 1);
  for (let index = 0; index < 8; index += 1) {
    const angle = rotation + Phaser.Math.DegToRad(index * 45);
    const innerX = centerX + Math.cos(angle) * 21;
    const innerY = centerY + Math.sin(angle) * 20;
    const outerX = centerX + Math.cos(angle) * 31;
    const outerY = centerY + Math.sin(angle) * 30;
    graphics.beginPath();
    graphics.moveTo(innerX, innerY);
    graphics.lineTo(outerX, outerY);
    graphics.strokePath();
  }

  graphics.lineStyle(6, colors.glow, 1);
  for (let index = 0; index < 10; index += 1) {
    const angle = rotation + Phaser.Math.DegToRad(index * 36);
    const midX = centerX + Math.cos(angle) * 24;
    const midY = centerY + Math.sin(angle) * 23;
    const tipX = centerX + Math.cos(angle) * 35;
    const tipY = centerY + Math.sin(angle) * 34;
    graphics.beginPath();
    graphics.moveTo(midX, midY);
    graphics.lineTo(tipX, tipY);
    graphics.strokePath();
  }

  graphics.lineStyle(3, 0x434a54, 0.95);
  graphics.strokeEllipse(centerX, centerY, 42, 40);
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
  graphics.fillStyle(colors.alt, 1);

  const drawGlyph = (glyph: string, x: number, y: number, scale = 1): void => {
    const unit = 2 * scale;
    const thick = Math.max(2, 2 * scale);
    const h = unit * 6;

    const rect = (rx: number, ry: number, rw: number, rh: number): void => {
      graphics.fillRect(x + rx * unit, y + ry * unit, rw * unit, rh * unit);
    };

    switch (glyph) {
      case "4":
        rect(0, 2, 1, 2);
        rect(3, 0, 1, 6);
        rect(0, 3, 4, 1);
        break;
      case "F":
        rect(0, 0, 1, 6);
        rect(0, 0, 4, 1);
        rect(0, 3, 3, 1);
        break;
      case "J":
        rect(0, 0, 4, 1);
        rect(3, 0, 1, 5);
        rect(0, 5, 4, 1);
        rect(0, 4, 1, 1);
        break;
      case "-":
        rect(0, 3, 3, 1);
        break;
      case "2":
        rect(0, 0, 4, 1);
        rect(3, 1, 1, 2);
        rect(0, 3, 4, 1);
        rect(0, 4, 1, 1);
        rect(0, 5, 4, 1);
        break;
      case "0":
        rect(0, 0, 4, 1);
        rect(0, 5, 4, 1);
        rect(0, 1, 1, 4);
        rect(3, 1, 1, 4);
        break;
      case "8":
        rect(0, 0, 4, 1);
        rect(0, 3, 4, 1);
        rect(0, 5, 4, 1);
        rect(0, 1, 1, 4);
        rect(3, 1, 1, 4);
        break;
      default:
        graphics.fillRect(x, y, thick, h);
    }
  };

  const chars = ["4", "F", "J", "-", "2", "0", "8"];
  let cursor = 20;
  for (const glyph of chars) {
    drawGlyph(glyph, cursor, 41, glyph === "-" ? 0.8 : 1);
    cursor += glyph === "-" ? 8 : 10;
  }

  graphics.fillStyle(0x8b7718, 1);
  graphics.fillRect(20, 57, 18, 3);
  graphics.fillRect(42, 57, 14, 3);
  graphics.fillRect(60, 57, 14 + wobble * 0.2, 3);
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
          case "spermwhale":
            drawSpermWhale(graphics, wobble, colors);
            break;
          case "tire":
            drawTire(graphics, wobble, colors, frame);
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
