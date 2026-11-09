// 가방 (I): 왼쪽은 장비 칸(투구·갑옷·무기·장신구, 가운데 주인공), 오른쪽은 인벤토리 칸.
//   인벤토리: 분류 탭(Q·E 또는 누르기), 칸마다 아이템 그림·개수·등급 색 테두리, 입은 장비엔 E 표시
//   ←→↑↓(WASD) 칸 옮기기, Enter: 먹을 것은 곁에 있는 사람에게 건네기, 장비는 입기/벗기. I·Esc 닫기
// 선택창이 아니라 가방이다. 건넬지는 플레이어가 사람 곁에 가서 정한다. 열려 있는 동안 주인공은 멈춘다.
import Phaser from 'phaser';
import { josa } from '../core/util/josa.js';
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { listBag, toggleEquip, swapWeapons, toggleLook, lookSlot } from '../life/bag.js';
import { RARITY } from '../../content/items/items.js';
import { EQUIP_DEFAULT, ACTIVE_SLOTS } from '../../content/action/action.js';
import { ITEMS } from '../../content/items.js';
import { equipSkin } from '../art/equipLook.js';
import { skinOf, eat } from '../life/life.js';
import { takeItem } from '../life/bag.js';
import { COIN } from '../../content/shop/shops.js';
import { Sound } from '../core/audio/Sound.js';

const TABS = [
  { id: 'all', label: '전체' }, { id: 'food', label: '먹을 것' }, { id: 'battle', label: '전투' },
  { id: 'gear', label: '장비' }, { id: 'material', label: '재료' }, { id: 'key', label: '소중한 것' },
];
// 장비 칸: 왼쪽 줄(투구·목걸이·갑옷·장갑·신발), 오른쪽 줄(무기 1·무기 2·보조장비·배낭·망토), 아래(악세사리 1·2)
const SLOTS = [
  { id: 'head', label: '투구', col: 0, row: 0 }, { id: 'necklace', label: '목걸이', col: 0, row: 1 }, { id: 'armor', label: '갑옷', col: 0, row: 2 },
  { id: 'gloves', label: '장갑', col: 0, row: 3 }, { id: 'boots', label: '신발', col: 0, row: 4 },
  { id: 'weapon', label: '무기 1', col: 2, row: 0 }, { id: 'weapon2', label: '무기 2', col: 2, row: 1 }, { id: 'offhand', label: '보조', col: 2, row: 2 },
  { id: 'backpack', label: '배낭', col: 2, row: 3 }, { id: 'cape', label: '망토', col: 2, row: 4 }, { id: 'acc1', label: '악세 1', col: 1, row: 5, dx: -1 }, { id: 'acc2', label: '악세 2', col: 1, row: 5, dx: 1 },
];
const KIND_SLOT = { head: '투구', armor: '갑옷', cape: '망토', boots: '신발', gloves: '장갑', accessory: '악세사리', necklace: '목걸이', backpack: '배낭', offhand: '보조장비', weapon: '무기' };
const COLS = 7, ROWS = 4;
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);

export class BagPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.tab = 0;
    this.pick = 0;
    this.box = null;
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['LEFT', 'A'].forEach((k) => on(k, () => this.move(-1)));
    ['RIGHT', 'D'].forEach((k) => on(k, () => this.move(1)));
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-COLS)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(COLS)));
    on('Q', () => this.setTab(this.tab - 1));
    on('E', () => this.setTab(this.tab + 1));
    on('ENTER', () => this.use());
    on('X', () => this.swap());
    on('V', () => this.dress());
    on('U', () => this.eatPicked());
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

  equip() { return { ...EQUIP_DEFAULT, ...(WorldMemory.run.equip ?? {}) }; }

  list() {
    const run = WorldMemory.run;
    const all = listBag(run.bag, { farmItems: run.farm?.items ?? {}, flags: run.flags, gear: run.gear ?? {}, equip: this.equip() });
    const t = TABS[this.tab].id;
    return t === 'all' ? all : all.filter((it) => it.def.kind === t);
  }

  setTab(i) { this.tab = (i + TABS.length) % TABS.length; this.pick = 0; this.render(); }
  move(d) { const n = this.list().length; if (!n) return; this.pick = Math.max(0, Math.min(n - 1, this.pick + d)); this.render(); }

  // Enter: 먹을 것은 곁에 있는 사람에게, 장비는 입기/벗기
  use() {
    const it = this.list()[this.pick];
    if (!it) return;
    if (it.def.kind === 'gear') { this.wear(it.id); return; }
    if (it.def.kind !== 'food') return;
    const f = this.field();
    if (!f?.giveItem) return;
    this.close();
    f.giveItem(it.id);
  }

  // U: 먹을 것을 직접 먹는다 (몸에 붙는다)
  eatPicked() {
    const it = this.list()[this.pick];
    if (!it || it.def.kind !== 'food') return;
    const run = WorldMemory.run;
    WorldMemory.setBag(takeItem(run.bag, it.id));
    const life = eat(run.life, it.def.kcal ?? 100);
    WorldMemory.setLife(life);
    Sound.sfx(this.scene, 'heal', { volume: 0.25 });
    const f = this.field();
    this.close();
    if (f?.player) this.scene.bubbles?.narrate(f.player, `${josa(it.def.name, '을/를')} 먹었다.  (${life.weight.toFixed(1)}kg)`, 2200);
  }

  // 무기 1·2 바꿔 들기
  swap() { this.setEquip(swapWeapons(WorldMemory.run.equip, EQUIP_DEFAULT)); }

  wear(id) { this.setEquip(toggleEquip(WorldMemory.run.equip, id, EQUIP_DEFAULT)); }

  // V: 의장 — 고른 갑옷·투구를 겉모습으로만 입는다 (성능은 입은 장비대로)
  dress() {
    const it = this.list()[this.pick];
    if (!it || it.def.kind !== 'gear') return;
    WorldMemory.setLook(toggleLook(WorldMemory.run.look, it.id));
    this.setEquip(WorldMemory.run.equip ?? EQUIP_DEFAULT);
  }

  setEquip(equip) {
    WorldMemory.setEquip(equip);
    const f = this.field();
    if (f?.player?.setSkin) f.player.setSkin(equipSkin(f, skinOf(WorldMemory.run.life), equip));
    this.render();
  }

  // 아이템 한 칸: 등급 색 테두리, 그림, 개수, 입었으면 E
  cell(box, x, y, size, it, on) {
    const sc = this.scene, s = this.s;
    const g = sc.add.graphics();
    const r = it ? RARITY[it.def.rarity ?? 'common'] : null;
    g.fillStyle(0x1a1418, 0.85).fillRoundedRect(x, y, size, size, 4 * s);
    g.lineStyle((on ? 2.5 : 1.5) * s, on ? COLORS.gold : r ? hex(r.glow) : COLORS.inner, on ? 1 : r ? 0.75 : 0.6).strokeRoundedRect(x, y, size, size, 4 * s);
    box.add(g);
    if (!it) return g;
    if (sc.textures.exists(`icon.${it.id}`)) box.add(sc.add.image(x + size / 2, y + size / 2, `icon.${it.id}`).setScale((size * 0.72) / 16));
    if (it.def.kind !== 'key' && it.def.kind !== 'gear' && it.count > 1) box.add(text(sc, x + size - 3 * s, y + size - 2 * s, `${it.count}`, { size: 9, bold: true, color: '#fbf8f2' }).setOrigin(1, 1).setStroke('#1a1418', 3 * s));
    if (it.worn) box.add(text(sc, x + 3 * s, y + 2 * s, 'E', { size: 8, bold: true, color: COLORS.accent }).setStroke('#1a1418', 3 * s));
    if (WorldMemory.run?.look?.[lookSlot(it.id)] === it.id) box.add(text(sc, x + size - 3 * s, y + 2 * s, 'V', { size: 8, bold: true, color: '#9ad0ff' }).setOrigin(1, 0).setStroke('#1a1418', 3 * s));
    return g;
  }

  render() {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const { width, height } = sc.scale;
    const W = 760 * s, H = 430 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(200));
    box.add(sc.add.rectangle(0, 0, width, height, 0x000000, 0.35).setOrigin(0, 0).setInteractive());
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond', sheen: false });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, '가방', s));
    // 주머니
    const coinX = x0 + 34 * s, coinY = y0 + H - 22 * s;
    g.fillStyle(0x7a4e1a, 1).fillCircle(coinX, coinY + 1.5 * s, 7 * s);
    g.fillStyle(0xf0c050, 1).fillCircle(coinX, coinY, 7 * s);
    g.fillStyle(0x7a4e1a, 1).fillRect(coinX - 2 * s, coinY - 2 * s, 4 * s, 4 * s);
    box.add(text(sc, coinX + 12 * s, coinY, `${WorldMemory.run.shop?.purse ?? 0}${COIN}`, { size: 12, bold: true, color: COLORS.accent }).setOrigin(0, 0.5));

    // ── 왼쪽: 장비 칸 ─────────────────────────────
    const lx = x0 + 24 * s, lw = 270 * s;
    g.fillStyle(0x000000, 0.18).fillRoundedRect(lx, y0 + 34 * s, lw, H - 70 * s, 6 * s);
    box.add(text(sc, lx + 12 * s, y0 + 44 * s, '장비', { size: 12, bold: true, color: COLORS.accent }));
    const eq = this.equip();
    const SZ = 40 * s, colX = [lx + 34 * s, lx + lw / 2, lx + lw - 34 * s], rowY = (r) => y0 + 86 * s + r * 50 * s;
    // 가운데 주인공(현재 체형·장비의 도트)
    const f = this.field();
    const skin = f?.player?.sprite?.texture?.key ?? 'char.me';
    if (sc.textures.exists(skin)) box.add(sc.add.image(colX[1], rowY(2) + 4 * s, skin, 0).setScale(6 * s));
    for (const sl of SLOTS) {
      const sx = colX[sl.col] + (sl.dx ?? 0) * 34 * s, sy = rowY(sl.row);
      const id = eq[sl.id];
      const it = id && ITEMS[id] ? { id, def: ITEMS[id], count: 1 } : null;
      const cg = this.cell(box, sx - SZ / 2, sy - SZ / 2, SZ, it, false);
      if (!it) box.add(text(sc, sx, sy, sl.label, { size: 8, color: COLORS.dim }).setOrigin(0.5, 0.5));
      else cg.setInteractive(new Phaser.Geom.Rectangle(sx - SZ / 2, sy - SZ / 2, SZ, SZ), Phaser.Geom.Rectangle.Contains).on('pointerdown', () => this.wear(id)); // 누르면 벗는다
    }
    // 무기 1 ⇄ 무기 2
    const sw = text(sc, colX[2] - SZ / 2 - 12 * s, (rowY(0) + rowY(1)) / 2, '⇄', { size: 13, bold: true, color: eq.weapon2 ? COLORS.accent : COLORS.dim }).setOrigin(0.5, 0.5)
      .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.swap());
    box.add(sw);
    // 장비가 주는 것 (무기 2는 예비라 빼고)
    const atk = ACTIVE_SLOTS.reduce((a, k) => a + (ITEMS[eq[k]]?.atk ?? 0), 0);
    const def = ACTIVE_SLOTS.reduce((a, k) => a + (ITEMS[eq[k]]?.def ?? 0), 0);
    box.add(text(sc, colX[1], y0 + H - 50 * s, def ? `공격 +${atk}   받는 피해 -${Math.round(def * 100)}%` : `공격 +${atk}`, { size: 10, color: COLORS.sub }).setOrigin(0.5, 0.5));

    // ── 오른쪽: 인벤토리 ─────────────────────────────
    const rx = lx + lw + 20 * s, rw = x0 + W - 24 * s - rx;
    TABS.forEach((t, i) => {
      const on = i === this.tab;
      const tx = rx + i * 70 * s, ty = y0 + 44 * s;
      const label = text(sc, tx, ty, t.label, { size: 11, bold: on, color: on ? COLORS.accent : COLORS.dim })
        .setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setTab(i));
      box.add(label);
      if (on) box.add(sc.add.rectangle(tx, ty + 16 * s, label.width, 2 * s, COLORS.gold).setOrigin(0, 0.5));
    });
    const list = this.list();
    this.pick = Math.min(this.pick, Math.max(0, list.length - 1));
    const CS = Math.min(52 * s, (rw - (COLS - 1) * 6 * s) / COLS), gy = y0 + 70 * s;
    for (let i = 0; i < COLS * ROWS; i += 1) {
      const x = rx + (i % COLS) * (CS + 6 * s), y = gy + Math.floor(i / COLS) * (CS + 6 * s);
      const it = list[i];
      const cg = this.cell(box, x, y, CS, it, it && i === this.pick);
      if (it) cg.setInteractive(new Phaser.Geom.Rectangle(x, y, CS, CS), Phaser.Geom.Rectangle.Contains)
        .on('pointerdown', () => { if (this.pick === i) this.use(); else { this.pick = i; this.render(); } });
    }
    // 고른 것의 설명
    const dy = gy + ROWS * (CS + 6 * s) + 8 * s;
    g.fillStyle(0x000000, 0.18).fillRoundedRect(rx, dy, rw, y0 + H - 34 * s - dy, 6 * s);
    const it = list[this.pick];
    if (!it) box.add(text(sc, rx + 12 * s, dy + 14 * s, '비어 있다.', { size: 12, color: COLORS.dim }));
    else {
      const r = RARITY[it.def.rarity ?? 'common'];
      box.add(text(sc, rx + 12 * s, dy + 12 * s, it.def.name, { size: 13, bold: true, color: r.glow }));
      const kind = { food: '먹을 것', battle: '전투에 쓰는 것', gear: `장비 · ${KIND_SLOT[it.def.slot] ?? ''}`, material: '재료', key: '소중한 것' }[it.def.kind];
      box.add(text(sc, rx + rw - 12 * s, dy + 14 * s, `${r.name} · ${kind}`, { size: 10, color: r.glow }).setOrigin(1, 0));
      box.add(text(sc, rx + 12 * s, dy + 34 * s, it.def.desc ?? '', { size: 11, color: COLORS.text, lineSpacing: 4 * s, wordWrap: { width: rw - 24 * s, useAdvancedWrap: true } }));
      const slot = it.def.kind === 'gear' ? lookSlot(it.id) : null;
      const dressed = Boolean(slot) && WorldMemory.run?.look?.[slot] === it.id;
      const canDress = Boolean(slot);
      const gearHint = `${it.worn ? '입고 있다' : '입을 수 있다'}${canDress ? (dressed ? ' · 의장으로 보인다 (V 벗기)' : ' · V 의장으로') : ''}`;
      const hint = { food: 'Enter 곁의 사람에게 건네기 · U 먹기', gear: gearHint, battle: '보스와 맞설 때 꺼내 쓴다' }[it.def.kind];
      if (hint) box.add(text(sc, rx + rw - 12 * s, y0 + H - 46 * s, hint, { size: 10, color: COLORS.sub }).setOrigin(1, 0.5));
    }
    box.add(text(sc, x0 + W - 24 * s, y0 + H - 16 * s, 'Q·E 탭   방향키 고르기   Enter 건네기·입기   U 먹기   V 의장   X 무기 바꿔 들기   I 닫기', { size: 10, color: COLORS.dim }).setOrigin(1, 0.5));
  }
}
