// 문 위에 뜨는 건물 이름 명패(field/systems/Signs). 흰 종이 얇은 띠 + 짙은 글자. 월드 좌표를 따라다닌다.
import { text, scaleOf } from './kit.js';

export class SignPlate {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = scene.add.container(0, 0).setDepth(44).setVisible(false);
    this.g = scene.add.graphics();
    this.t = text(scene, 0, 0, '', { size: 11, bold: true, color: '#3a2a28' }).setOrigin(0.5, 0.5);
    this.box.add([this.g, this.t]);
    this.at = null;
  }

  show(str, wx, wy) {
    const s = this.s;
    this.t.setText(str);
    const w = this.t.width + 18 * s, h = 18 * s;
    this.g.clear();
    this.g.fillStyle(0x000000, 0.3).fillRoundedRect(-w / 2 + 1 * s, -h / 2 + 2 * s, w, h, 4 * s);
    this.g.fillStyle(0x2a2026, 1).fillRoundedRect(-w / 2 - 1 * s, -h / 2 - 1 * s, w + 2 * s, h + 2 * s, 5 * s);
    this.g.fillStyle(0xfbf8f2, 1).fillRoundedRect(-w / 2, -h / 2, w, h, 4 * s);
    this.g.fillStyle(0xd8a040, 1).fillRect(-w / 2 + 6 * s, h / 2 - 3 * s, w - 12 * s, 1 * s);
    this.at = { x: wx, y: wy };
    this.box.setVisible(true).setAlpha(0);
    this.scene.tweens.add({ targets: this.box, alpha: 1, duration: 150 });
  }

  hide() { this.at = null; this.box.setVisible(false); }

  update(toScreen) {
    if (!this.at || !toScreen) return;
    const p = toScreen(this.at.x, this.at.y);
    this.box.setPosition(Math.round(p.x), Math.round(p.y));
  }
}
