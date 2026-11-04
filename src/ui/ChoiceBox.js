// 선택지. 이 게임에 선택창은 없다 — 단 하나의 예외가 '바깥을 향한 질문'이다(기획서). 선택지가 떴다는 것 자체가 이상한 일이 된다.
// 대화창 바로 위에 뜬다. ↑↓(W·S) 고르기, E·Space·Enter 정하기, 마우스·터치로 눌러도 된다.
import { COLORS, frame, text, scaleOf } from './kit.js';

export class ChoiceBox {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = null;
    this.pick = 0;
    this.resolve = null;
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-1)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(1)));
  }

  get open() { return Boolean(this.box); }

  choose(options) {
    this.options = options;
    this.pick = 0;
    this.render();
    return new Promise((r) => { this.resolve = r; });
  }

  move(d) { this.pick = (this.pick + d + this.options.length) % this.options.length; this.render(); }

  // 정하기 (UIScene의 진행 키가 먼저 여기로 온다)
  confirm() {
    if (!this.open) return false;
    const i = this.pick;
    this.box.destroy();
    this.box = null;
    const r = this.resolve;
    this.resolve = null;
    r?.(i);
    return true;
  }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const rowH = 30 * s, W = 420 * s, H = this.options.length * rowH + 24 * s;
    const x0 = width / 2 - W / 2, y0 = height - 150 * s - H;
    const box = (this.box = sc.add.container(0, 0).setDepth(150));
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    this.options.forEach((o, i) => {
      const on = i === this.pick;
      const y = y0 + 12 * s + i * rowH + rowH / 2;
      if (on) box.add(sc.add.rectangle(x0 + 12 * s, y, W - 24 * s, rowH - 6 * s, 0x5a4030, 0.9).setOrigin(0, 0.5));
      box.add(text(sc, x0 + 28 * s, y, `${on ? '▸ ' : '   '}${o}`, { size: 14, color: on ? COLORS.accent : COLORS.text }).setOrigin(0, 0.5)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.pick = i; this.confirm(); }));
    });
  }
}
