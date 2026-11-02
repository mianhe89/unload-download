// 스테이터스 창 (C 또는 Tab): 체중·체형·마음가짐과 그 전투 보정. 숨기는 수치는 없다(유토피아 판정 제외).
import { FONT } from '../config/game.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { statusLines, freshLife } from '../life/life.js';
import { PARTY } from '../../content/battles/units.js';

export class StatusPanel {
  constructor(scene) {
    this.scene = scene;
    const { width, height } = scene.scale;
    const s = width / 960;
    this.box = scene.add.container(width / 2, height / 2).setDepth(200).setVisible(false);
    const bg = scene.add.rectangle(0, 0, 640 * s, 220 * s, 0x101018, 0.94).setStrokeStyle(2 * s, 0x4a4466);
    this.title = scene.add.text(-300 * s, -96 * s, '나', { fontFamily: FONT, fontSize: `${15 * s}px`, color: '#ffd27a' });
    this.body = scene.add.text(-300 * s, -66 * s, '', { fontFamily: FONT, fontSize: `${13 * s}px`, color: '#ece8f4', lineSpacing: 10 * s, wordWrap: { width: 600 * s } });
    this.foot = scene.add.text(300 * s, 92 * s, 'C 닫기', { fontFamily: FONT, fontSize: `${11 * s}px`, color: '#8a84a0' }).setOrigin(1, 1);
    this.box.add([bg, this.title, this.body, this.foot]);
  }

  get open() { return this.box.visible; }

  toggle() {
    if (!WorldMemory.run) return;
    if (this.open) { this.box.setVisible(false); return; }
    this.body.setText(statusLines(PARTY.me, WorldMemory.run.life ?? freshLife()).join('\n'));
    this.box.setVisible(true);
  }
}
