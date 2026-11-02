// 필드 위에 겹쳐 도는 UI 씬. 카메라 배율과 무관하게 글자를 원래 크기로 그린다.
import Phaser from 'phaser';
import { DialogBox } from '../../ui/DialogBox.js';
import { SpeechBubbles } from '../../ui/SpeechBubbles.js';
import { Hud } from '../../ui/Hud.js';
import { Sound } from '../../core/audio/Sound.js';
import { StatusPanel } from '../../ui/StatusPanel.js';
import { TouchControls } from '../../ui/TouchControls.js';
import { Touch, wantsTouch } from '../../ui/touch.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    this.dialog = new DialogBox(this);
    this.bubbles = new SpeechBubbles(this);
    this.hud = new Hud(this);
    this.status = new StatusPanel(this);
    this.input.keyboard.on('keydown-C', () => this.status.toggle());
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); this.status.toggle(); });
    // 휴대폰: 조이스틱과 E·C 버튼. E는 대화가 떠 있으면 넘기고, 아니면 살펴보기
    if (wantsTouch(this.game)) {
      this.touch = new TouchControls(this, {
        onAct: () => { if (this.dialog.advance()) return; this.events.emit('skip'); Touch.actQueued = true; },
        onStatus: () => this.status.toggle(),
      });
      this.hud.controls.setText('M 소리'); // 키보드 안내 대신
    }
    this.toScreen = (x, y) => ({ x, y });

    // 대화창이 떠 있으면 다음 문장, 아니면 걷는 대사(말풍선)를 넘긴다
    const advance = () => { if (this.dialog.advance()) Sound.sfx(this, 'ui', { volume: 0.12 }); else this.events.emit('skip'); };
    // 화면 탭: 대화 넘기기. 터치 조작이 있으면 대화창이 떠 있을 때만 (조이스틱을 만져도 대사가 넘어가지 않게)
    this.input.on('pointerdown', (_p, over) => {
      if (this.touch) { if (!over.length && this.dialog.open) advance(); return; }
      advance();
    });
    ['E', 'SPACE', 'ENTER'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, advance));
  }

  update() { this.bubbles.update(this.toScreen); this.touch?.update(); }

  say(name, color, text, face) { return this.dialog.say(name, color, text, face); }
  closeDialog() { this.dialog.close(); }
  get talking() { return this.dialog.open; }
}
