// 인물 머리 위 말풍선. 월드 좌표를 따라다니지만 UI 씬에서 그려 글자가 선명하다.
import { FONT } from '../config/game.js';

export class SpeechBubbles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.s = scene.scale.width / 960;
  }

  // target: { x, y } 를 가진 월드 객체, toScreen: 월드 → 화면 변환
  show(target, text, color = '#ffffff', ms = 2600) {
    this.list.filter((b) => b.target === target).forEach((b) => this.remove(b));
    const s = this.s;
    const t = this.scene.add.text(0, 0, text, {
      fontFamily: FONT, fontSize: `${12 * s}px`, color: '#1a1820', backgroundColor: '#f4f0e8',
      padding: { x: 6 * s, y: 3 * s }, wordWrap: { width: 220 * s, useAdvancedWrap: true },
    }).setOrigin(0.5, 1).setDepth(50);
    t.setStroke(color, 0);
    const b = { target, t, until: this.scene.time.now + ms };
    this.list.push(b);
    return b;
  }

  remove(b) { b.t.destroy(); this.list = this.list.filter((x) => x !== b); }

  update(toScreen) {
    const now = this.scene.time.now;
    for (const b of [...this.list]) {
      if (now > b.until || !b.target.sprite?.active) { this.remove(b); continue; }
      const p = toScreen(b.target.x, b.target.y - 18);
      b.t.setPosition(p.x, p.y);
    }
  }

  clear() { [...this.list].forEach((b) => this.remove(b)); }
}
