// 가방 (I): 먹을 것·재료·소중한 것. ↑↓ 고르기, Enter 곁에 있는 사람에게 건네기, I·Esc 닫기.
// 선택창이 아니라 가방이다. 건넬지는 플레이어가 사람 곁에 가서 정한다. 열려 있는 동안 주인공은 멈춘다.
import Phaser from 'phaser';
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { listBag } from '../life/bag.js';

const KIND = { food: '먹을 것', material: '재료', key: '소중한 것' };

export class BagPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.pick = 0;
    this.box = null;
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-1)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(1)));
    on('ENTER', () => this.give());
    on('ESC', () => this.close());
  }

  get open() { return Boolean(this.box); }
  toggle() { if (this.open) this.close(); else if (WorldMemory.run) this.show(); }

  field() {
    for (const key of ['Field', 'Area']) if (this.scene.scene.isActive(key)) return this.scene.scene.get(key);
    return null;
  }
  freeze(v) { this.field()?.setFrozen?.(v); }
  show() { this.freeze(true); this.render(); }
  close() { this.box?.destroy(); this.box = null; this.freeze(false); }

  list() {
    const run = WorldMemory.run;
    return listBag(run.bag, { farmItems: run.farm?.items ?? {}, flags: run.flags });
  }

  move(d) { this.pick = Phaser.Math.Clamp(this.pick + d, 0, Math.max(0, this.list().length - 1)); this.render(); }

  // 고른 먹을 것을 곁에 있는 사람에게. 건넸으면 창을 닫는다
  give() {
    const it = this.list()[this.pick];
    if (!it || it.def.kind !== 'food') return;
    const f = this.field();
    if (!f?.giveItem) return;
    this.close();
    f.giveItem(it.id);
  }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const W = 560 * s, H = 340 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(200));
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, '가방', s));
    const list = this.list();
    const left = x0 + 36 * s;
    if (!list.length) {
      box.add(text(sc, left, y0 + 50 * s, '가방이 비어 있다.', { size: 13, color: COLORS.dim }));
    } else {
      this.pick = Math.min(this.pick, list.length - 1);
      let y = y0 + 44 * s, lastKind = null;
      list.forEach((it, i) => {
        if (it.def.kind !== lastKind) { box.add(text(sc, left, y, KIND[it.def.kind], { size: 10, color: COLORS.dim })); y += 18 * s; lastKind = it.def.kind; }
        const on = i === this.pick;
        const t = text(sc, left + 8 * s, y, `${on ? '▸ ' : '  '}${it.def.name}${it.def.kind === 'key' ? '' : `  ×${it.count}`}`, { size: 12, bold: on, color: on ? COLORS.accent : COLORS.text })
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (this.pick === i) this.give(); else { this.pick = i; this.render(); } });
        box.add(t);
        y += 22 * s;
      });
      // 오른쪽: 설명
      const rx = x0 + 250 * s, it = list[this.pick];
      box.add(sc.add.rectangle(rx - 16 * s, y0 + 40 * s, 1 * s, H - 80 * s, COLORS.inner).setOrigin(0.5, 0));
      box.add(text(sc, rx, y0 + 44 * s, it.def.name, { size: 14, bold: true, color: COLORS.accent }));
      box.add(text(sc, rx, y0 + 72 * s, it.def.desc, { size: 12, color: COLORS.text, lineSpacing: 6 * s, wordWrap: { width: x0 + W - 36 * s - rx, useAdvancedWrap: true } }));
      if (it.def.kind === 'food') box.add(text(sc, rx, y0 + H - 54 * s, '곁에 있는 사람에게 Enter로 건넨다', { size: 10, color: COLORS.sub }));
    }
    box.add(text(sc, x0 + W - 24 * s, y0 + H - 18 * s, '↑↓ 고르기   Enter 건네기   I 닫기', { size: 10, color: COLORS.dim }).setOrigin(1, 0.5));
  }
}
