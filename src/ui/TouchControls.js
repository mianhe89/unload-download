// 휴대폰용 조작: 왼쪽 아래 가상 조이스틱(phaser4-rex-plugins), 오른쪽 아래 E(살펴보기·넘기기)·C(상태)·J(수첩) 버튼.
import VirtualJoyStick from 'phaser4-rex-plugins/plugins/virtualjoystick.js';
import { FONT } from '../config/game.js';
import { Touch } from './touch.js';

export class TouchControls {
  // onAct: E 버튼 (대화 넘기기 또는 살펴보기), onStatus: C 버튼, onNotebook: J 버튼
  constructor(scene, { onAct, onStatus, onNotebook }) {
    const { width, height } = scene.scale;
    const s = width / 960;
    const r = 56 * s;
    const base = scene.add.circle(0, 0, r, 0xffffff, 0.12).setStrokeStyle(2 * s, 0xffffff, 0.35).setDepth(150);
    const thumb = scene.add.circle(0, 0, r * 0.45, 0xffffff, 0.35).setDepth(151);
    this.stick = new VirtualJoyStick(scene, { x: 96 * s, y: height - 96 * s, radius: r, base, thumb, dir: '8dir', forceMin: 6 * s });
    this.r = r;

    const button = (x, label, fn) => {
      const c = scene.add.circle(x, height - 80 * s, 34 * s, 0xffffff, 0.16).setStrokeStyle(2 * s, 0xffffff, 0.4).setDepth(150).setInteractive();
      scene.add.text(x, height - 80 * s, label, { fontFamily: FONT, fontSize: `${18 * s}px`, color: '#ffffff' }).setOrigin(0.5).setDepth(151);
      c.on('pointerdown', () => { c.setFillStyle(0xffffff, 0.35); fn(); });
      c.on('pointerup', () => c.setFillStyle(0xffffff, 0.16));
      c.on('pointerout', () => c.setFillStyle(0xffffff, 0.16));
    };
    button(width - 72 * s, 'E', onAct);
    button(width - 160 * s, 'C', onStatus);
    if (onNotebook) button(width - 248 * s, 'J', onNotebook);
    scene.input.addPointer(2); // 조이스틱 + 버튼 동시에
  }

  update() {
    const f = Math.min(1, this.stick.force / this.r);
    const a = (this.stick.angle * Math.PI) / 180;
    Touch.x = f > 0.1 ? Math.cos(a) * f : 0;
    Touch.y = f > 0.1 ? Math.sin(a) * f : 0;
  }
}
