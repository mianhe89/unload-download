import Phaser from 'phaser';
import { platform } from '../platform/index.js';
import { WorldMemory } from '../systems/WorldMemory.js';

export default class TitleScene extends Phaser.Scene {
  constructor() { super('Title'); }

  create() {
    const { width, height } = this.scale;
    const s = width / 960;

    this.add.text(width / 2, height * 0.38, 'UNLOAD / DOWNLOAD', {
      fontFamily: 'serif', fontSize: `${48 * s}px`, color: '#e8e4f0',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.48, `${platform.edition} edition`, {
      fontFamily: 'monospace', fontSize: `${14 * s}px`, color: '#8a84a0',
    }).setOrigin(0.5);

    const hasSave = Boolean(WorldMemory.state.saves.auto);
    const label = hasSave ? '이어하기' : '시작하기';
    const start = this.add.text(width / 2, height * 0.66, label, {
      fontFamily: 'sans-serif', fontSize: `${22 * s}px`, color: '#e8e4f0',
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    start.on('pointerdown', () => {
      // 이어하기 = 로드. 이 순간 세계 어딘가에서 누군가 사라진다.
      const data = hasSave ? WorldMemory.load('auto') : null;
      this.scene.start('Prologue', { line: data?.line ?? 0 });
    });
  }
}
