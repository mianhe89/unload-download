// 타이틀. 게임 이름은 보여주지 않는다 — 처음 실행하면 무슨 게임인지 알게 된다.
// 화면 대부분은 날마다, 진행에 따라 바뀌는 마을 일러스트. 메뉴는 아래 작게.
//   CONTINUE       → 로드. 이 순간 누군가 지워진다
//   RESET & START  → 진행을 처음부터. 지워진 사람은 돌아오지 않는다(두 번 눌러 확인)
import Phaser from 'phaser';
import { FONT } from '../../config/game.js';
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { drawTitle, TITLE_W, TITLE_H } from './TitleIllustration.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    const s = width / 960;
    const world = WorldMemory.world;
    const run = WorldMemory.run;

    // 일러스트
    const { raster } = drawTitle({
      date: new Date(),
      erased: world.erased.map((e) => e.id),
      loads: world.loads,
      chapter: run?.chapter,
      phase: run?.phase,
      started: Boolean(run),
    });
    if (this.textures.exists('title.art')) this.textures.remove('title.art');
    const tex = this.textures.createCanvas('title.art', TITLE_W, TITLE_H);
    const img = tex.getContext().createImageData(TITLE_W, TITLE_H);
    img.data.set(raster.d);
    tex.getContext().putImageData(img, 0, 0);
    tex.refresh();
    this.add.image(width / 2, height / 2, 'title.art').setDisplaySize(width, height);

    // 오늘 날짜 (매일 바뀐다는 작은 신호)
    const d = new Date();
    this.add.text(width - 16 * s, 14 * s, `${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`, {
      fontFamily: FONT, fontSize: `${11 * s}px`, color: '#ffffff',
    }).setOrigin(1, 0).setAlpha(0.6);

    const items = [];
    if (WorldMemory.hasRun) items.push({ label: 'CONTINUE', action: () => this.continue() });
    items.push({ label: WorldMemory.hasRun ? 'RESET & START' : 'START', action: (t) => this.reset(t) });

    items.forEach((item, i) => {
      const t = this.add.text(width - 40 * s, height - (items.length - i) * 30 * s - 22 * s, item.label, {
        fontFamily: FONT, fontSize: `${16 * s}px`, color: '#f4f0e8', letterSpacing: 2,
      }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true }).setShadow(2, 2, '#000', 0);
      t.on('pointerover', () => t.setColor('#c9b8ff'));
      t.on('pointerout', () => t.setColor('#f4f0e8'));
      t.on('pointerdown', () => item.action(t));
      t.base = item.label;
    });

    this.cameras.main.fadeIn(800, 0, 0, 0);
  }

  continue() {
    const { run } = WorldMemory.load(); // 이 순간 누군가 지워진다
    this.go(run.chapter, run.phase);
  }

  reset(t) {
    if (WorldMemory.hasRun && !this.confirming) {
      this.confirming = true;
      t.setText('PRESS AGAIN TO RESET');
      this.time.delayedCall(2500, () => { this.confirming = false; t.setText(t.base); });
      return;
    }
    const run = WorldMemory.startNew();
    this.go(run.chapter, run.phase);
  }

  go(chapter, phase) {
    this.input.enabled = false;
    this.cameras.main.fadeOut(600, 0, 0, 0);
    this.time.delayedCall(650, () => this.scene.start('Field', { chapter, phase }));
  }
}
