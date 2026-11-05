// 가게 창: 가게 주인에게 말을 걸면 열린다(src/field/systems/Shops.js). 규칙은 src/shop/shop.js, 가게 데이터는 content/shop/shops.js.
//   위: 가게 이름 띠 · 왼쪽 위 주인 얼굴과 인사말 · 오른쪽 위 내 주머니(닢)
//   가운데 왼쪽: 사기/팔기 탭(Q·E) + 물건 줄(그림·이름(등급 색)·값·남은 수/가진 수)
//   가운데 오른쪽: 고른 것의 큰 그림·설명·장비면 지금 입은 것과 비교
//   ↑↓ 고르기, Enter 사기/팔기, Esc 나가기. 열려 있는 동안 주인공은 멈춘다.
import { josa } from '../core/util/josa.js';
import { COLORS, frame, text, scaleOf, titleBand } from './kit.js';
import { WorldMemory } from '../core/world/WorldMemory.js';
import { Sound } from '../core/audio/Sound.js';
import { SHOPS, COIN } from '../../content/shop/shops.js';
import { RARITY } from '../../content/items/items.js';
import { characters } from '../../content/characters/index.js';
import { EQUIP_DEFAULT, SLOT_FITS } from '../../content/action/action.js';
import { ITEMS } from '../../content/items.js';
import { stockOf, sellableOf, buy, sell, ownedCount } from '../shop/shop.js';

const TABS = [{ id: 'buy', label: '사기' }, { id: 'sell', label: '팔기' }];
const ROWS = 7;
const KIND = { food: '먹을 것', battle: '전투에 쓰는 것', gear: '장비', material: '재료' };
const REFUSE = {
  poor: '(닢이 모자라다.)', soldout: '(오늘 것은 다 팔렸다. 내일 다시 들르자.)', full: '(가방 그 칸이 꽉 찼다.)', none: '(그건 팔지 않는다.)',
};
const plain = (str) => String(str).replace(/\[[^\]]*\]/g, '');
const hex = (c) => Number.parseInt(String(c).replace('#', ''), 16);

export class ShopPanel {
  constructor(scene) {
    this.scene = scene;
    this.s = scaleOf(scene);
    this.box = null;
    this.greetAt = {};
    const keys = scene.input.keyboard;
    const on = (k, fn) => keys.on(`keydown-${k}`, () => { if (this.open) fn(); });
    ['UP', 'W'].forEach((k) => on(k, () => this.move(-1)));
    ['DOWN', 'S'].forEach((k) => on(k, () => this.move(1)));
    ['LEFT', 'A', 'Q'].forEach((k) => on(k, () => this.setTab(0)));
    ['RIGHT', 'D', 'E'].forEach((k) => on(k, () => this.setTab(1)));
    on('ENTER', () => this.confirm());
    on('SPACE', () => this.confirm());
    on('ESC', () => this.close());
  }

  get open() { return Boolean(this.box); }

  field() {
    for (const key of ['Field', 'Area']) if (this.scene.scene.isActive(key)) return this.scene.scene.get(key);
    return null;
  }

  // ctx: { day, passes } — 오늘 날짜와 대본 조건 판정(그 가게가 오늘 무엇을 파는지)
  show(shopId, ctx = {}) {
    const shop = SHOPS[shopId];
    if (!shop || !WorldMemory.run) return;
    this.shopId = shopId;
    this.ctx = { day: 1, passes: () => true, ...ctx };
    this.tab = 0;
    this.pick = 0;
    this.top = 0;
    const i = this.greetAt[shopId] ?? 0;
    this.greetAt[shopId] = (i + 1) % shop.greet.length;
    this.say = plain(shop.greet[i]);
    this.note = null;
    this.field()?.setFrozen?.(true);
    Sound.sfx(this.scene, 'ui');
    this.render(true);
  }

  close() {
    if (!this.box) return;
    this.box.destroy();
    this.box = null;
    this.field()?.setFrozen?.(false);
    Sound.sfx(this.scene, 'cancel');
  }

  equip() { return { ...EQUIP_DEFAULT, ...(WorldMemory.run.equip ?? {}) }; }

  list() {
    const run = WorldMemory.run;
    if (this.tab === 0) return stockOf(this.shopId, { state: run.shop, day: this.ctx.day, passes: this.ctx.passes });
    return sellableOf(this.shopId, run, this.equip());
  }

  setTab(i) {
    if (i === this.tab) return;
    if (i === 1 && !SHOPS[this.shopId].buys?.length) { this.note = { text: '(이 가게는 물건을 사들이지 않는다.)', bad: true }; this.render(); return; }
    this.tab = i; this.pick = 0; this.top = 0; this.note = null;
    Sound.sfx(this.scene, 'ui', { volume: 0.2 });
    this.render();
  }

  move(d) {
    const n = this.list().length;
    if (!n) return;
    this.pick = Math.max(0, Math.min(n - 1, this.pick + d));
    if (this.pick < this.top) this.top = this.pick;
    if (this.pick >= this.top + ROWS) this.top = this.pick - ROWS + 1;
    this.render();
  }

  confirm() {
    const it = this.list()[this.pick];
    if (!it) return;
    const run = WorldMemory.run;
    const r = this.tab === 0 ? buy(run, this.shopId, it.item, this.ctx.day, this.ctx.passes) : sell(run, this.shopId, it.item, this.equip());
    if (!r.ok) {
      this.note = { text: REFUSE[r.reason] ?? REFUSE.none, bad: true };
      Sound.sfx(this.scene, 'cancel');
      this.render();
      this.shake();
      return;
    }
    const c = r.changes;
    WorldMemory.setShop(c.shop);
    if (c.bag) WorldMemory.setBag(c.bag);
    if (c.farm) WorldMemory.setFarm(c.farm);
    if (c.gear) WorldMemory.setGear(c.gear);
    Sound.sfx(this.scene, 'pickup');
    this.note = this.tab === 0 ? { text: `${josa(it.def.name, '을/를')} 샀다.  −${it.price}${COIN}` } : { text: `${josa(it.def.name, '을/를')} 팔았다.  +${it.price}${COIN}` };
    if (this.tab === 1) this.pick = Math.min(this.pick, Math.max(0, this.list().length - 1));
    this.render();
    this.pulsePurse(this.tab === 0 ? -1 : 1);
  }

  shake() {
    if (!this.noteText) return;
    this.scene.tweens.add({ targets: this.noteText, x: this.noteText.x + 4 * this.s, duration: 40, yoyo: true, repeat: 3 });
  }

  pulsePurse(dir) {
    if (!this.purseText) return;
    this.purseText.setColor(dir > 0 ? '#9af0a0' : '#ffd27a');
    this.scene.tweens.add({ targets: this.purseText, scale: { from: 1.25, to: 1 }, duration: 260, ease: 'Back.out' });
  }

  // 동전 그림 (금색 동그라미에 구멍)
  coin(g, x, y, r) {
    g.fillStyle(0x7a4e1a, 1).fillCircle(x, y + r * 0.18, r);
    g.fillStyle(0xf0c050, 1).fillCircle(x, y, r);
    g.fillStyle(0xfff0a0, 1).fillCircle(x - r * 0.3, y - r * 0.3, r * 0.3);
    g.fillStyle(0x7a4e1a, 1).fillRect(x - r * 0.25, y - r * 0.25, r * 0.5, r * 0.5);
  }

  icon(box, id, x, y, size) {
    const sc = this.scene;
    if (sc.textures.exists(`icon.${id}`)) box.add(sc.add.image(x, y, `icon.${id}`).setScale(size / 16));
  }

  // 장비 비교: 그 장비가 들어갈 칸에 지금 입은 것과
  compare(def) {
    if (def.kind !== 'gear') return null;
    const eq = this.equip();
    const slot = (SLOT_FITS[def.slot] ?? [def.slot])[0];
    const cur = ITEMS[eq[slot]];
    const dAtk = (def.atk ?? 0) - (cur?.atk ?? 0);
    const dDef = Math.round(((def.def ?? 0) - (cur?.def ?? 0)) * 100);
    const parts = [];
    if (def.atk || cur?.atk) parts.push([`공격 ${dAtk >= 0 ? '+' : ''}${dAtk}`, dAtk]);
    if (def.def || cur?.def) parts.push([`받는 피해 ${dDef > 0 ? '-' : '+'}${Math.abs(dDef)}%`, dDef]);
    return { against: cur?.name ?? '맨몸', parts };
  }

  render(pop = false) {
    this.box?.destroy();
    const sc = this.scene, s = this.s;
    const shop = SHOPS[this.shopId];
    const run = WorldMemory.run;
    const { width, height } = sc.scale;
    const W = 720 * s, H = 440 * s, x0 = width / 2 - W / 2, y0 = height / 2 - H / 2;
    const box = (this.box = sc.add.container(0, 0).setDepth(200));
    box.add(sc.add.rectangle(0, 0, width, height, 0x000000, 0.4).setOrigin(0, 0).setInteractive());
    const g = sc.add.graphics();
    frame(g, x0, y0, W, H, s, { corners: 'diamond' });
    box.add(g);
    box.add(titleBand(sc, g, width / 2, y0, shop.name, s));

    // ── 주인과 인사말 ──
    const keeper = characters[shop.keeper];
    const fx = x0 + 26 * s, fy = y0 + 26 * s, FS = 56 * s;
    g.fillStyle(0xf8ecd2, 1).fillRoundedRect(fx, fy, FS, FS, 8 * s);
    g.lineStyle(2 * s, hex(keeper?.color ?? '#e8b860'), 1).strokeRoundedRect(fx, fy, FS, FS, 8 * s);
    const faceKey = sc.textures.exists(`face.${shop.keeper}`) ? `face.${shop.keeper}` : sc.textures.exists(`char.${shop.keeper}`) ? `char.${shop.keeper}` : null;
    if (faceKey) {
      const img = sc.add.image(fx + FS / 2, fy + FS / 2 + (faceKey.startsWith('char') ? 4 * s : 0), faceKey, 0);
      img.setScale((FS * (faceKey.startsWith('char') ? 1.1 : 0.86)) / Math.max(img.width, img.height));
      box.add(img);
    }
    // 말풍선 (흰 종이, 왼쪽으로 꼬리)
    const bx = fx + FS + 14 * s, bw = W - (bx - x0) - 170 * s, bh = 46 * s, by = fy + (FS - bh) / 2;
    g.fillStyle(0xfbf8f2, 1).fillRoundedRect(bx, by, bw, bh, 10 * s);
    g.fillTriangle(bx + 1 * s, by + bh / 2 - 6 * s, bx + 1 * s, by + bh / 2 + 6 * s, bx - 8 * s, by + bh / 2);
    box.add(text(sc, bx + 12 * s, by + 6 * s, keeper?.name ?? '', { size: 10, bold: true, color: keeper?.color ?? '#8a5a2a' }).setStroke('#fbf8f2', 2 * s));
    box.add(text(sc, bx + 12 * s, by + 21 * s, this.say, { size: 11, color: '#3a2418', wordWrap: { width: bw - 24 * s, useAdvancedWrap: true } }));

    // ── 주머니 ──
    const px = x0 + W - 28 * s, py = fy + FS / 2;
    g.fillStyle(0x000000, 0.25).fillRoundedRect(px - 132 * s, py - 18 * s, 132 * s, 36 * s, 8 * s);
    this.coin(g, px - 112 * s, py, 9 * s);
    box.add(text(sc, px - 96 * s, py - 1 * s, '주머니', { size: 10, color: COLORS.dim }).setOrigin(0, 0.5));
    this.purseText = text(sc, px - 10 * s, py, `${run.shop?.purse ?? 0}${COIN}`, { size: 16, bold: true, color: COLORS.accent }).setOrigin(1, 0.5).setStroke('#1a1418', 3 * s);
    box.add(this.purseText);

    // ── 탭 ──
    const lx = x0 + 24 * s, lw = 400 * s, ty = fy + FS + 18 * s;
    TABS.forEach((t, i) => {
      const on = i === this.tab, off = i === 1 && !shop.buys?.length;
      const tx = lx + i * 96 * s, tw = 90 * s;
      g.fillStyle(on ? COLORS.gold : 0x000000, on ? 1 : 0.25).fillRoundedRect(tx, ty, tw, 24 * s, { tl: 8 * s, tr: 8 * s, bl: 0, br: 0 });
      const label = text(sc, tx + tw / 2, ty + 12 * s, t.label, { size: 12, bold: true, color: on ? COLORS.plateText : off ? '#6a5a4a' : COLORS.dim }).setOrigin(0.5);
      label.setInteractive({ useHandCursor: true }).on('pointerdown', () => this.setTab(i));
      box.add(label);
    });
    const ly = ty + 24 * s, RH = 34 * s, lh = ROWS * RH + 8 * s;
    g.fillStyle(0x000000, 0.22).fillRect(lx, ly, lw, lh);
    g.lineStyle(1 * s, COLORS.gold, 0.8).lineBetween(lx, ly, lx + lw, ly);
    // 줄 머리
    const list = this.list();
    this.pick = Math.min(this.pick, Math.max(0, list.length - 1));
    if (!list.length) box.add(text(sc, lx + lw / 2, ly + lh / 2, this.tab === 0 ? '오늘 파는 것이 없다.' : '팔 만한 것이 없다.', { size: 12, color: COLORS.dim }).setOrigin(0.5));
    for (let k = 0; k < ROWS; k += 1) {
      const i = this.top + k, it = list[i];
      if (!it) break;
      const on = i === this.pick;
      const ry = ly + 4 * s + k * RH;
      const r = RARITY[it.def.rarity ?? 'common'];
      const row = sc.add.graphics();
      if (on) {
        row.fillStyle(COLORS.gold, 0.18).fillRoundedRect(lx + 4 * s, ry, lw - 8 * s, RH - 2 * s, 6 * s);
        row.lineStyle(1.5 * s, COLORS.gold, 1).strokeRoundedRect(lx + 4 * s, ry, lw - 8 * s, RH - 2 * s, 6 * s);
        row.fillStyle(COLORS.goldLight, 1).fillTriangle(lx - 2 * s, ry + RH / 2 - 6 * s, lx - 2 * s, ry + RH / 2 + 4 * s, lx + 4 * s, ry + RH / 2 - 1 * s);
      } else if (k % 2) row.fillStyle(0xffffff, 0.03).fillRect(lx + 4 * s, ry, lw - 8 * s, RH - 2 * s);
      // 칸 그림
      row.fillStyle(0x1a1418, 0.9).fillRoundedRect(lx + 10 * s, ry + 3 * s, 26 * s, 26 * s, 4 * s);
      row.lineStyle(1.5 * s, hex(r.glow), 0.8).strokeRoundedRect(lx + 10 * s, ry + 3 * s, 26 * s, 26 * s, 4 * s);
      box.add(row);
      this.icon(box, it.item, lx + 23 * s, ry + 16 * s, 22 * s);
      const soldOut = this.tab === 0 && it.left <= 0;
      const poor = this.tab === 0 && (run.shop?.purse ?? 0) < it.price;
      box.add(text(sc, lx + 46 * s, ry + 16 * s, it.def.name, { size: 12, bold: on, color: soldOut ? '#6a5a4a' : r.glow }).setOrigin(0, 0.5));
      const sub = this.tab === 0 ? (it.left === Infinity ? '' : soldOut ? '다 팔림' : `오늘 ${it.left}개`) : `가진 것 ${it.count}`;
      if (sub) box.add(text(sc, lx + 230 * s, ry + 16 * s, sub, { size: 9, color: soldOut ? '#c87a6a' : COLORS.dim }).setOrigin(0, 0.5));
      this.coin(row, lx + lw - 62 * s, ry + 16 * s, 5 * s);
      box.add(text(sc, lx + lw - 14 * s, ry + 16 * s, `${it.price}`, { size: 13, bold: true, color: soldOut || poor ? '#a86a5a' : this.tab === 1 ? '#9af0a0' : COLORS.accent }).setOrigin(1, 0.5));
      const hit = sc.add.zone(lx + lw / 2, ry + RH / 2, lw, RH).setInteractive({ useHandCursor: true })
        .on('pointerdown', () => { if (this.pick === i) this.confirm(); else { this.pick = i; this.render(); } });
      box.add(hit);
    }
    // 스크롤 표시
    if (list.length > ROWS) {
      const th = lh * (ROWS / list.length), tyy = ly + (lh - th) * (this.top / (list.length - ROWS));
      g.fillStyle(COLORS.gold, 0.7).fillRoundedRect(lx + lw - 3 * s, tyy, 3 * s, th, 1.5 * s);
    }

    // ── 고른 것 ──
    const dx = lx + lw + 16 * s, dw = x0 + W - 24 * s - dx, dy = ty, dh = ly + lh - ty;
    g.fillStyle(0x000000, 0.22).fillRoundedRect(dx, dy, dw, dh, 8 * s);
    const it = list[this.pick];
    if (it) {
      const r = RARITY[it.def.rarity ?? 'common'];
      // 큰 그림 + 등급 빛
      const cx = dx + dw / 2, cy = dy + 52 * s;
      const glow = sc.add.graphics();
      glow.fillStyle(hex(r.glow), 0.12).fillCircle(cx, cy, 38 * s);
      glow.fillStyle(hex(r.glow), 0.12).fillCircle(cx, cy, 26 * s);
      box.add(glow);
      this.icon(box, it.item, cx, cy, 52 * s);
      if (pop) sc.tweens.add({ targets: glow, alpha: { from: 0, to: 1 }, duration: 300 });
      box.add(text(sc, cx, dy + 100 * s, it.def.name, { size: 14, bold: true, color: r.glow }).setOrigin(0.5));
      const kind = it.def.kind === 'gear' ? `장비 · ${KIND_SLOT_NAME[it.def.slot] ?? ''}` : KIND[it.def.kind] ?? '';
      box.add(text(sc, cx, dy + 120 * s, `${r.name} · ${kind}`, { size: 10, color: r.glow }).setOrigin(0.5).setAlpha(0.85));
      box.add(text(sc, dx + 14 * s, dy + 140 * s, it.def.desc ?? '', { size: 10.5, color: COLORS.text, lineSpacing: 4 * s, wordWrap: { width: dw - 28 * s, useAdvancedWrap: true } }));
      const cmp = this.compare(it.def);
      const by2 = dy + dh - 46 * s;
      if (cmp) {
        box.add(text(sc, dx + 14 * s, by2, `지금 ${cmp.against}보다`, { size: 9.5, color: COLORS.dim }));
        cmp.parts.forEach(([label, d], k) => box.add(text(sc, dx + 14 * s + k * 110 * s, by2 + 15 * s, label, { size: 11, bold: true, color: d > 0 ? '#9af0a0' : d < 0 ? '#ff9a8a' : COLORS.sub })));
      } else if (it.def.kcal) {
        box.add(text(sc, dx + 14 * s, by2 + 8 * s, `${it.def.kcal} kcal · 곁의 사람에게 건네거나 직접 먹는다`, { size: 9.5, color: COLORS.dim }));
      }
      const owned = ownedCount(run, it.item);
      if (this.tab === 0 && owned) box.add(text(sc, dx + dw - 14 * s, dy + 12 * s, `가진 것 ${owned}`, { size: 9.5, color: COLORS.dim }).setOrigin(1, 0));
    }

    // ── 알림과 안내 ──
    const ny = y0 + H - 34 * s;
    this.noteText = this.note ? text(sc, lx, ny, this.note.text, { size: 11, color: this.note.bad ? '#ff9a8a' : '#9af0a0' }).setOrigin(0, 0.5) : null;
    if (this.noteText) box.add(this.noteText);
    box.add(text(sc, x0 + W - 24 * s, ny, `Q·E 사기/팔기   ↑↓ 고르기   Enter ${this.tab === 0 ? '사기' : '팔기'}   Esc 나가기`, { size: 10, color: COLORS.dim }).setOrigin(1, 0.5));

    if (pop) {
      box.setAlpha(0);
      sc.tweens.add({ targets: box, alpha: 1, duration: 140 });
    }
  }
}

const KIND_SLOT_NAME = { head: '투구', armor: '갑옷', boots: '신발', gloves: '장갑', accessory: '악세사리', necklace: '목걸이', backpack: '배낭', offhand: '보조장비', weapon: '무기' };
