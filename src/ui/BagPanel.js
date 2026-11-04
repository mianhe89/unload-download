// 가방 (I): 먹을 것·재료·소중한 것. ↑↓ 고르기, Enter 곁에 있는 사람에게 건네기, I·Esc 닫기.
// 선택창이 아니라 가방이다. 건넬지는 플레이어가 사람 곁에 가서 정한다. 열려 있는 동안 주인공은 멈춘다.
import Phaser from 'phaser';
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { listBag, toggleEquip } from '../life/bag.js';
import { RARITY } from '../../content/items/items.js';
import { EQUIP_DEFAULT } from '../../content/action/action.js';
import { equipSkin } from '../art/equipLook.js';
import { skinOf } from '../life/life.js';

const KIND = { food: '먹을 것', battle: '전투에 쓰는 것', gear: '장비', material: '재료', key: '소중한 것' };
const SLOT = { weapon: '무기', armor: '갑옷', trinket: '장신구' };

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
    return listBag(run.bag, { farmItems: run.farm?.items ?? {}, flags: run.flags, gear: run.gear ?? {}, equip: { ...EQUIP_DEFAULT, ...(run.equip ?? {}) } });
  }

  move(d) { this.pick = Phaser.Math.Clamp(this.pick + d, 0, Math.max(0, this.list().length - 1)); this.render(); }

  // 고른 먹을 것을 곁에 있는 사람에게. 건넸으면 창을 닫는다
  give() {
    const it = this.list()[this.pick];
    if (it?.def.kind === 'gear') { this.wear(it.id); return; }
    if (!it || it.def.kind !== 'food') return;
    const f = this.field();
    if (!f?.giveItem) return;
    this.close();
    f.giveItem(it.id);
  }

  // 장비: Enter로 입기 / 다시 Enter로 벗기. 주인공 도트가 바로 바뀐다
  wear(id) {
    const equip = toggleEquip(WorldMemory.run.equip, id, EQUIP_DEFAULT);
    WorldMemory.setEquip(equip);
    const f = this.field();
    if (f?.player?.setSkin) f.player.setSkin(equipSkin(f, skinOf(WorldMemory.run.life), equip));
    this.render();
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
        const tail = it.def.kind === 'key' ? '' : it.def.kind === 'gear' ? (it.worn ? '  (입음)' : '') : `  ×${it.count}`;
        const t = text(sc, left + 8 * s, y, `${on ? '▸ ' : '  '}${it.def.name}${tail}`, { size: 12, bold: on, color: RARITY[it.def.rarity ?? 'common']?.glow ?? COLORS.text })
          .setInteractive({ useHandCursor: true }).on('pointerdown', () => { if (this.pick === i) this.give(); else { this.pick = i; this.render(); } });
        box.add(t);
        y += 22 * s;
      });
      // 오른쪽: 설명
      const rx = x0 + 250 * s, it = list[this.pick];
      box.add(sc.add.rectangle(rx - 16 * s, y0 + 40 * s, 1 * s, H - 80 * s, COLORS.inner).setOrigin(0.5, 0));
      const r = RARITY[it.def.rarity ?? 'common'];
      box.add(text(sc, rx, y0 + 44 * s, it.def.name, { size: 14, bold: true, color: r.glow }));
      box.add(text(sc, x0 + W - 36 * s, y0 + 47 * s, it.def.kind === 'gear' ? `${r.name} · ${SLOT[it.def.slot]}` : r.name, { size: 10, color: r.glow }).setOrigin(1, 0));
      box.add(text(sc, rx, y0 + 72 * s, it.def.desc, { size: 12, color: COLORS.text, lineSpacing: 6 * s, wordWrap: { width: x0 + W - 36 * s - rx, useAdvancedWrap: true } }));
      if (it.def.kind === 'food') box.add(text(sc, rx, y0 + H - 54 * s, '곁에 있는 사람에게 건넬 수 있다', { size: 10, color: COLORS.sub }));
      if (it.def.kind === 'gear') box.add(text(sc, rx, y0 + H - 54 * s, it.worn ? 'Enter로 벗는다' : 'Enter로 입는다 (보스 2단계의 스킬이 바뀐다)', { size: 10, color: COLORS.sub }));
      if (it.def.kind === 'battle') box.add(text(sc, rx, y0 + H - 54 * s, '보스 2단계에서 1~8로 쓴다', { size: 10, color: COLORS.sub }));
    }
    box.add(text(sc, x0 + W - 24 * s, y0 + H - 18 * s, '↑↓ 고르기   Enter 건네기·입기   I 닫기', { size: 10, color: COLORS.dim }).setOrigin(1, 0.5));
  }
}
