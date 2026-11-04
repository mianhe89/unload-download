// 필드 위에 겹쳐 도는 UI 씬. 카메라 배율과 무관하게 글자를 원래 크기로 그린다.
import Phaser from 'phaser';
import { DialogBox } from '../../ui/DialogBox.js';
import { CgLayer } from '../../ui/CgLayer.js';
import { SpeechBubbles } from '../../ui/SpeechBubbles.js';
import { Hud } from '../../ui/Hud.js';
import { Sound } from '../../core/audio/Sound.js';
import { StatusPanel } from '../../ui/StatusPanel.js';
import { BagPanel } from '../../ui/BagPanel.js';
import { ChoiceBox } from '../../ui/ChoiceBox.js';
import { PauseMenu } from '../../ui/PauseMenu.js';
import { Minimap } from '../../ui/Minimap.js';
import { SignPlate } from '../../ui/SignPlate.js';
import { NameTags } from '../../ui/NameTags.js';
import { NotebookPanel } from '../../ui/NotebookPanel.js';
import { COLORS, text, scaleOf, frame } from '../../ui/kit.js';
import { TouchControls } from '../../ui/TouchControls.js';
import { Touch, wantsTouch } from '../../ui/touch.js';

export default class UIScene extends Phaser.Scene {
  constructor() { super('UI'); }

  create() {
    // ESC: 다른 창(가방·수첩·상태·선택지)이 열려 있거나 대화 중이면 그쪽이 닫히고, 아니면 메뉴(PauseMenu).
    // 이 판단을 가장 먼저 등록해서, 창들이 스스로 닫히기 전의 상태를 본다
    this.input.keyboard.on('keydown-ESC', () => {
      if (this.pause?.open) { this.pause.back(); return; }
      if (this.bag?.open || this.notebook?.open || this.status?.open || this.dialog?.open || this.choice?.open) return;
      if (!['Field', 'Area'].some((k) => this.scene.isActive(k))) return;
      this.pause.show();
    });
    this.dialog = new DialogBox(this);
    this.cg = new CgLayer(this);
    this.bubbles = new SpeechBubbles(this);
    this.hud = new Hud(this);
    this.status = new StatusPanel(this);
    this.input.keyboard.on('keydown-C', () => this.status.toggle());
    this.input.keyboard.on('keydown-TAB', (e) => { e.preventDefault?.(); this.status.toggle(); });
    this.notebook = new NotebookPanel(this);
    this.input.keyboard.on('keydown-J', () => this.notebook.toggle());
    this.bag = new BagPanel(this);
    this.choice = new ChoiceBox(this);
    this.pause = new PauseMenu(this);
    this.minimap = new Minimap(this);
    this.sign = new SignPlate(this);
    this.names = new NameTags(this);
    this.input.keyboard.on('keydown-I', () => this.bag.toggle());
    this.toasts = [];
    // 휴대폰: 조이스틱과 E·C 버튼. E는 대화가 떠 있으면 넘기고, 아니면 살펴보기
    if (wantsTouch(this.game)) {
      this.touch = new TouchControls(this, {
        onAct: () => { if (this.choice.confirm()) return; if (this.dialog.advance()) return; this.events.emit('skip'); Touch.actQueued = true; },
        onStatus: () => this.status.toggle(),
        onNotebook: () => this.notebook.toggle(),
      });
      this.hud.hideKeys(); // 키보드 안내 대신 버튼이 있다
    }
    this.toScreen = (x, y) => ({ x, y });

    // 대화창이 떠 있으면 다음 문장, 아니면 걷는 대사(말풍선)를 넘긴다
    const advance = () => { if (this.choice.confirm()) { Sound.sfx(this, 'ui', { volume: 0.2 }); return; } if (this.dialog.advance()) Sound.sfx(this, 'ui', { volume: 0.12 }); else this.events.emit('skip'); };
    // 화면 탭: 대화 넘기기. 터치 조작이 있으면 대화창이 떠 있을 때만 (조이스틱을 만져도 대사가 넘어가지 않게)
    this.input.on('pointerdown', (_p, over) => {
      if (this.touch) { if (!over.length && this.dialog.open) advance(); return; }
      advance();
    });
    ['E', 'SPACE', 'ENTER'].forEach((k) => this.input.keyboard.on(`keydown-${k}`, advance));
  }

  update(_, deltaMs) { this.bubbles.update(this.toScreen); this.touch?.update(); this.minimap.update(deltaMs / 1000); this.sign.update(this.toScreen); this.names.update(this.toScreen); }

  say(name, color, text, face, expr) { return this.dialog.say(name, color, text, face, expr); }
  closeDialog() { this.dialog.close(); }

  // 위쪽 가운데에 잠깐 뜨는 알림(퀘스트 시작·완료, 단서). 금테 창 띠로, 여러 개가 겹치면 아래로 쌓인다
  toast(msg) {
    const s = scaleOf(this);
    const y = 76 * s + this.toasts.length * 40 * s;
    const label = text(this, 0, 0, msg, { size: 13, color: COLORS.text }).setOrigin(0.5);
    const w = label.width + 48 * s, h = 32 * s;
    const g = this.add.graphics();
    frame(g, -w / 2, -h / 2, w, h, s, { corners: 'diamond', radius: 5, sheen: false });
    g.fillStyle(COLORS.goldLight, 1).fillRect(-w / 2 + 14 * s, -1.5 * s, 5 * s, 3 * s).fillRect(w / 2 - 19 * s, -1.5 * s, 5 * s, 3 * s);
    const t = this.add.container(this.scale.width / 2, y, [g, label]).setDepth(95).setAlpha(0);
    this.toasts.push(t);
    this.tweens.add({ targets: t, alpha: 1, y: y + 6 * s, duration: 250, hold: 2400, yoyo: true,
      onComplete: () => { t.destroy(); this.toasts = this.toasts.filter((o) => o !== t); } });
  }
  get talking() { return this.dialog.open; }
}
