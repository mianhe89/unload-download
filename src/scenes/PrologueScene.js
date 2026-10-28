import Phaser from 'phaser';
import { WorldMemory } from '../systems/WorldMemory.js';
import { prologue } from '../../data/story/prologue.js';

// 비주얼노벨 파트 최소 구현: 클릭으로 대사 진행, 매 대사마다 자동 저장.
export default class PrologueScene extends Phaser.Scene {
  constructor() { super('Prologue'); }

  init(data) { this.line = data.line ?? 0; }

  create() {
    const { width, height } = this.scale;
    const s = width / 960;

    this.add.rectangle(width / 2, height - 90 * s, width - 48 * s, 140 * s, 0x16141f, 0.92)
      .setStrokeStyle(1, 0x3a3550);

    this.speaker = this.add.text(48 * s, height - 150 * s, '', {
      fontFamily: 'sans-serif', fontSize: `${16 * s}px`, color: '#c9b8ff',
    });
    this.body = this.add.text(48 * s, height - 122 * s, '', {
      fontFamily: 'sans-serif', fontSize: `${18 * s}px`, color: '#e8e4f0',
      wordWrap: { width: width - 96 * s },
    });

    this.input.on('pointerdown', () => this.next());
    this.show();
  }

  current() {
    const lines = prologue.filter((l) => !l.requires || !WorldMemory.isErased(l.requires));
    return { lines, line: lines[this.line] };
  }

  show() {
    const { line } = this.current();
    if (!line) { this.scene.start('Title'); return; }
    this.speaker.setText(line.speaker ?? '');
    this.body.setText(line.text);
    WorldMemory.save('auto', { line: this.line });
  }

  next() {
    this.line += 1;
    this.show();
  }
}
