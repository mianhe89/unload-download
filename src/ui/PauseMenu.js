// ESC 메뉴: 옵션 / 처음으로 가기. 열려 있는 동안 필드는 멈춘다.
// 다른 창(가방·수첩·상태)이 열려 있거나 대화 중이면 ESC는 그쪽이 쓴다 — UIScene이 가장 먼저 이 판단을 한다.
//   옵션: 소리 켜기/끄기, 전체 화면
//   플레이 기록 저장: ?playtest로 켠 브라우저에서만 보인다(core/playtest/PlayLog.js)
//   처음으로 가기: 진행을 저장하고 타이틀로 (한 번 더 눌러 확인). 타이틀에서 CONTINUE는 로드다 — 네다섯 번에 한 번 누군가 지워진다
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { Sound } from '../core/audio/Sound.js';
import { PlayLog } from '../core/playtest/PlayLog.js';

export class PauseMenu {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = null;
    this.page = 'main';
    this.pick = 0;
    this.confirm = false;
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-1)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(1)));
    ['ENTER', 'SPACE', 'E'].forEach((k) => on(k, () => this.choose()));
  }

  get open() { return Boolean(this.box); }

  field() {
    for (const key of ['Field', 'Area']) if (this.scene.scene.isActive(key)) return this.scene.scene.get(key);
    return null;
  }

  toggle() { if (this.open) this.close(); else this.show(); }
  show() { this.page = 'main'; this.pick = 0; this.confirm = false; this.field()?.setFrozen?.(true); this.render(); }
  close() { this.box?.destroy(); this.box = null; this.field()?.setFrozen?.(false); }
  back() { if (this.page !== 'main') { this.page = 'main'; this.pick = 0; this.render(); } else this.close(); }

  items() {
    if (this.page === 'options') {
      const full = this.scene.scale.isFullscreen;
      return [
        { label: `소리  ${Sound.muted ? '꺼짐' : '켜짐'}`, act: () => { Sound.toggleMute(); this.render(); } },
        { label: `전체 화면  ${full ? '켜짐' : '꺼짐'}`, act: () => { if (full) this.scene.scale.stopFullscreen(); else this.scene.scale.startFullscreen(); this.scene.time.delayedCall(150, () => this.render()); } },
        { label: '돌아가기', act: () => this.back() },
      ];
    }
    return [
      { label: '옵션', act: () => { this.page = 'options'; this.pick = 0; this.render(); } },
      // 플레이테스트 기록이 켜진 브라우저에서만: 기록을 파일로 내려받는다
      ...(PlayLog.enabled ? [{ label: '플레이 기록 저장', act: () => PlayLog.download() }] : []),
      { label: this.confirm ? '한 번 더 누르면 처음으로' : '처음으로 가기', act: () => this.toTitle() },
    ];
  }

  move(d) { const n = this.items().length; this.pick = (this.pick + d + n) % n; this.confirm = false; this.render(); }
  choose() { this.items()[this.pick]?.act(); }

  // 진행은 이미 저장되어 있다(시계는 저장하고 나간다). 장면을 정리하고 타이틀로
  toTitle() {
    if (!this.confirm) { this.confirm = true; this.render(); return; }
    const f = this.field();
    f?.clock?.save?.();
    this.close();
    const sm = this.scene.scene;
    for (const key of ['Field', 'Area', 'Action']) if (sm.isActive(key) || sm.isSleeping(key)) sm.stop(key);
    sm.start('Title');
    sm.stop('UI');
  }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const items = this.items();
    const W = 300 * s, H = (70 + items.length * 34) * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(220));
    box.add(sc.add.rectangle(0, 0, width, height, 0x000000, 0.35).setOrigin(0, 0).setInteractive());
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, this.page === 'options' ? '옵션' : '메뉴', s));
    items.forEach((it, i) => {
      const on = i === this.pick;
      const y = y0 + 44 * s + i * 34 * s;
      if (on) box.add(sc.add.rectangle(x0 + 20 * s, y, W - 40 * s, 28 * s, 0x5a4030, 0.9).setOrigin(0, 0.5));
      box.add(text(sc, width / 2, y, it.label, { size: 14, bold: on, color: on ? COLORS.accent : COLORS.text }).setOrigin(0.5, 0.5)
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => { this.pick = i; this.choose(); }));
    });
    box.add(text(sc, x0 + W - 18 * s, y0 + H - 14 * s, 'ESC 닫기', { size: 9, color: COLORS.dim }).setOrigin(1, 0.5));
  }
}
