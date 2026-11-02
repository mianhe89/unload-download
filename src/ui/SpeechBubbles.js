// 인물 머리 위 말풍선. 월드 좌표를 따라다니지만 UI 씬에서 그려 글자가 선명하다.
import { FONT } from '../config/game.js';

export class SpeechBubbles {
  constructor(scene) {
    this.scene = scene;
    this.list = [];
    this.s = scene.scale.width / 960;
  }

  // target: { x, y } 를 가진 월드 객체, toScreen: 월드 → 화면 변환
  // opts.faint: 멀어서 잘 들리지 않는 말 (흐리게)
  show(target, text, color = '#ffffff', ms = 2600, opts = {}) {
    this.list.filter((b) => b.target === target && b.kind === 'say').forEach((b) => this.remove(b));
    const s = this.s;
    const t = this.scene.add.text(0, 0, text, {
      fontFamily: FONT, fontSize: `${12 * s}px`, color: '#1a1820', backgroundColor: '#f4f0e8',
      padding: { x: 6 * s, y: 3 * s }, wordWrap: { width: 220 * s, useAdvancedWrap: true },
    }).setOrigin(0.5, 1).setDepth(50);
    if (opts.faint) t.setAlpha(0.45);
    const b = { target, t, until: this.scene.time.now + ms, kind: 'say', dy: -18, rise: 0 };
    this.list.push(b);
    return b;
  }

  // 내레이션: 말풍선 없이 인물 위 허공에 떠오르는 글. 천천히 올라가며 흐려진다
  narrate(target, text, ms = 3000) {
    this.list.filter((b) => b.target === target && b.kind === 'narr').forEach((b) => this.remove(b));
    const s = this.s;
    const t = this.scene.add.text(0, 0, text, {
      fontFamily: FONT, fontSize: `${13 * s}px`, color: '#e6def4', align: 'center',
      wordWrap: { width: 300 * s, useAdvancedWrap: true },
    }).setOrigin(0.5, 1).setDepth(49).setShadow(1 * s, 1 * s, '#000000', 0, false, true).setAlpha(0);
    this.scene.tweens.add({ targets: t, alpha: 0.95, duration: 300 });
    const now = this.scene.time.now;
    const b = { target, t, until: now + ms, kind: 'narr', dy: -30, born: now, rise: 10 };
    this.list.push(b);
    return b;
  }

  remove(b) { b.t.destroy(); this.list = this.list.filter((x) => x !== b); }

  update(toScreen) {
    const now = this.scene.time.now;
    for (const b of [...this.list]) {
      if (now > b.until || !b.target.sprite?.active) { this.remove(b); continue; }
      const life = b.rise ? (now - b.born) / (b.until - b.born) : 0;
      const p = toScreen(b.target.x, b.target.y + b.dy - life * b.rise);
      b.t.setPosition(p.x, p.y);
      if (b.rise && life > 0.8) b.t.setAlpha(0.95 * (1 - life) / 0.2);
    }
  }

  clear() { [...this.list].forEach((b) => this.remove(b)); }
}
