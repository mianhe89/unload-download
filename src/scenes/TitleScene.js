import Phaser from 'phaser';
import { platform } from '../platform/index.js';
import { WorldMemory } from '../systems/WorldMemory.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    const s = width / 960;
    const world = WorldMemory.state;

    this.add.text(width / 2, height * 0.34, 'UNLOAD / DOWNLOAD', {
      fontFamily: 'serif', fontSize: `${48 * s}px`, color: '#e8e4f0',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.44, `${platform.edition} edition`, {
      fontFamily: 'monospace', fontSize: `${14 * s}px`, color: '#8a84a0',
    }).setOrigin(0.5);

    // 누군가 지워진 세계에서는 타이틀도 조금 다르다
    if (world.erased.length) {
      this.add.text(width / 2, height * 0.92, '누군가 없다.', {
        fontFamily: 'serif', fontSize: `${13 * s}px`, color: '#5a5566',
      }).setOrigin(0.5).setAlpha(0.6);
    }

    const items = [{ label: '새로 시작', action: () => this.begin({ run: WorldMemory.startNew() }) }];
    if (WorldMemory.hasRun) {
      items.unshift({
        label: '이어하기',
        action: () => {
          const { run, victim } = WorldMemory.load(); // 이 순간 누군가 지워진다
          this.begin({ run, victim });
        },
      });
    }

    items.forEach((item, i) => {
      const t = this.add.text(width / 2, height * 0.62 + i * 44 * s, item.label, {
        fontFamily: 'sans-serif', fontSize: `${22 * s}px`, color: '#e8e4f0',
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      t.on('pointerover', () => t.setColor('#c9b8ff'));
      t.on('pointerout', () => t.setColor('#e8e4f0'));
      t.on('pointerdown', item.action);
    });
  }

  begin(data) {
    this.cameras.main.fadeOut(500, 0, 0, 0);
    this.time.delayedCall(550, () => this.scene.start('Story', data));
  }
}
