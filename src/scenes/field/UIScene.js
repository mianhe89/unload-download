// 필드 위에 겹쳐 도는 UI 씬. 카메라 배율과 무관하게 글자를 원래 크기로 그린다.
import Phaser from 'phaser';
import { DialogBox } from '../../ui/DialogBox.js';
import { SpeechBubbles } from '../../ui/SpeechBubbles.js';
import { Hud } from '../../ui/Hud.js';
import { StatusPanel } from '../../ui/StatusPanel.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.dialog = new DialogBox(this);
    this.bubbles = new SpeechBubbles(this);
    this.hud = new Hud(this);
    this.status = new StatusPanel(this);
    this.input.keyboard.on('keydown-C', () => this.status.toggle());
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); this.status.toggle(); });
    this.toScreen = (x, y) => ({ x, y });

    // 대화창이 떠 있으면 다음 문장, 아니면 걷는 대사(말풍선)를 넘긴다
    const advance = () => { if (!this.dialog.advance()) this.events.emit('skip'); };
    this.input.on('pointerdown', advance);
    ['E', 'SPACE', 'ENTER'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, advance));
  }

  update() { this.bubbles.update(this.toScreen); }

  say(name, color, text, face) { return this.dialog.say(name, color, text, face); }
  closeDialog() { this.dialog.close(); }
  get talking() { return this.dialog.open; }
}
