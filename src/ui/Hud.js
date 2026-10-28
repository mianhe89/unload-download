// 화면 가장자리 정보: 장소, 목표(있을 때만), 조작 안내, 상호작용 표시.
import { FONT } from '../config/game.js';

export class Hud {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = (this.s = width / 960);
    const style = (size, color) => ({ fontFamily: FONT, fontSize: `${size * s}px`, color });

    this.place = scene.add.text(18 * s, 14 * s, '', style(13, '#e8e4f0')).setDepth(40).setShadow(1, 1, '#000', 0);
    this.objective = scene.add.text(18 * s, 34 * s, '', style(11, '#bdb6cf')).setDepth(40).setShadow(1, 1, '#000', 0);
    this.controls = scene.add.text(width - 16 * s, 14 * s, 'WASD 이동 · E 살펴보기', style(11, '#bdb6cf'))
      .setOrigin(1, 0).setDepth(40).setShadow(1, 1, '#000', 0);
    this.prompt = scene.add.text(0, 0, 'E', {
      ...style(11, '#101018'), backgroundColor: '#f4f0e8', padding: { x: 4 * s, y: 1 * s },
    }).setOrigin(0.5, 1).setDepth(45).setVisible(false);
    scene.tweens.add({ targets: this.prompt, y: '-=2', duration: 400, yoyo: true, repeat: -1 });
  }

  setPlace(text) { this.place.setText(text ?? ''); }
  setObjective(text) { this.objective.setText(text ? `› ${text}` : ''); }
  hideControls() { this.scene.tweens.add({ targets: this.controls, alpha: 0, duration: 800 }); }

  showPrompt(p) {
    if (!p) { this.prompt.setVisible(false); return; }
    this.prompt.setVisible(true);
    this.prompt.x = p.x;
    if (!this.promptY || Math.abs(this.promptY - p.y) > 4) this.prompt.y = p.y;
    this.promptY = p.y;
  }

  setVisible(v) { [this.place, this.objective, this.controls].forEach((o) => o.setVisible(v)); if (!v) this.prompt.setVisible(false); }
}
