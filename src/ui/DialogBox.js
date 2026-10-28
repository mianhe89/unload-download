// 하단 대화창. 초상화 없이 이름표 + 문장만 (미연시가 아니라 RPG의 대화창).
// 한 글자씩 찍히고, 진행 키를 누르면 문장 완성 → 다음 문장.
import { FONT } from '../config/game.js';

export class DialogBox {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = (this.s = width / 960);
    const w = Math.min(720 * s, width - 40 * s), h = 96 * s;
    this.box = scene.add.container(width / 2, height - h / 2 - 18 * s).setVisible(false).setDepth(100);

    const bg = scene.add.rectangle(0, 0, w, h, 0x101018, 0.92).setStrokeStyle(2 * s, 0x4a4466);
    const inner = scene.add.rectangle(0, 0, w - 8 * s, h - 8 * s).setStrokeStyle(1 * s, 0x2a2638);
    this.nameTag = scene.add.text(-w / 2 + 14 * s, -h / 2 - 9 * s, '', {
      fontFamily: FONT, fontSize: `${13 * s}px`, color: '#ffffff', backgroundColor: '#101018', padding: { x: 6 * s, y: 2 * s },
    });
    this.text = scene.add.text(-w / 2 + 18 * s, -h / 2 + 18 * s, '', {
      fontFamily: FONT, fontSize: `${15 * s}px`, color: '#ece8f4', lineSpacing: 6 * s,
      wordWrap: { width: w - 36 * s, useAdvancedWrap: true },
    });
    this.more = scene.add.text(w / 2 - 16 * s, h / 2 - 14 * s, '▼', { fontFamily: FONT, fontSize: `${11 * s}px`, color: '#8a84a0' }).setOrigin(1, 0.5);
    scene.tweens.add({ targets: this.more, alpha: 0.15, duration: 500, yoyo: true, repeat: -1 });
    this.box.add([bg, inner, this.nameTag, this.text, this.more]);
    this.resolve = null;
  }

  get open() { return this.box.visible; }

  say(name, color, text) {
    this.box.setVisible(true);
    this.nameTag.setText(name).setColor(color).setVisible(Boolean(name));
    this.text.setColor(name ? '#ece8f4' : '#cfc9dd');
    this.full = text;
    this.shown = 0;
    this.text.setText('');
    this.more.setVisible(false);
    this.typer?.remove();
    this.typer = this.scene.time.addEvent({
      delay: 26, loop: true,
      callback: () => {
        this.shown += 1;
        this.text.setText(this.full.slice(0, this.shown));
        if (this.shown >= this.full.length) this.finishTyping();
      },
    });
    return new Promise((r) => { this.resolve = r; });
  }

  finishTyping() {
    this.typer?.remove();
    this.typer = null;
    this.text.setText(this.full);
    this.more.setVisible(true);
  }

  // 진행 입력. 처리했으면 true
  advance() {
    if (!this.open || !this.resolve) return false;
    if (this.typer) { this.finishTyping(); return true; }
    const r = this.resolve;
    this.resolve = null;
    r();
    return true;
  }

  close() { this.box.setVisible(false); this.typer?.remove(); this.typer = null; }
}
