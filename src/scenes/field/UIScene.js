// 필드 위에 겹쳐 도는 UI 씬. 카메라 배율과 무관하게 글자를 원래 크기로 그린다.
import Phaser from 'phaser';
import { DialogBox } from '../../ui/DialogBox.js';
import { SpeechBubbles } from '../../ui/SpeechBubbles.js';
import { Hud } from '../../ui/Hud.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.dialog = new DialogBox(this);
    this.bubbles = new SpeechBubbles(this);
    this.hud = new Hud(this);
    this.toScreen = (x, y) => ({ x, y });

    const advance = () => this.dialog.advance();
    this.input.on('pointerdown', advance);
    ['E', 'SPACE', 'ENTER'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, advance));
  }

  update() { this.bubbles.update(this.toScreen); }

  say(name, color, text) { return this.dialog.say(name, color, text); }
  closeDialog() { this.dialog.close(); }
  get talking() { return this.dialog.open; }
}
