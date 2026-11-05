// 가게: 값·열린 시간·사기·팔기 (src/shop/shop.js), 가게 데이터의 짝 (content/shop/shops.js)
import { describe, it, expect } from 'vitest';
import { SHOPS, PRICES, START_PURSE } from '../../content/shop/shops.js';
import { ITEMS } from '../../content/items.js';
import { characters } from '../../content/characters/index.js';
import { MAPS } from '../../content/maps/index.js';
import { freshRun } from '../../src/core/save/SaveSchema.js';
import { isOpen, stockOf, buy, sell, sellableOf, sellPriceOf, earn } from '../../src/shop/shop.js';

describe('가게 데이터', () => {
  it('주인·맵·물건·값이 다 있다', () => {
    for (const [id, s] of Object.entries(SHOPS)) {
      expect(characters[s.keeper], `${id} 주인`).toBeTruthy();
      expect(MAPS[s.map], `${id} 맵`).toBeTruthy();
      expect(s.greet.length, `${id} 인사`).toBeGreaterThan(0);
      for (const e of s.stock) { expect(ITEMS[e.item], `${id}: ${e.item}`).toBeTruthy(); expect(PRICES[e.item], `${id}: ${e.item} 값`).toBeGreaterThan(0); }
    }
  });
  it('소중한 것에는 값이 없다', () => {
    for (const [id, def] of Object.entries(ITEMS)) if (def.kind === 'key') expect(PRICES[id], id).toBeUndefined();
  });
  it('주인은 맵마다 한 가게만 맡는다', () => {
    const seen = new Set();
    for (const s of Object.values(SHOPS)) { const k = `${s.map}.${s.keeper}`; expect(seen.has(k), k).toBe(false); seen.add(k); }
  });
});

describe('사고팔기', () => {
  const run = () => ({ ...freshRun(), gear: {}, equip: {} });
  it('열린 시간: 시계가 없으면 늘 연다', () => {
    expect(isOpen(SHOPS.general, null)).toBe(true);
    expect(isOpen(SHOPS.general, 8 * 60)).toBe(true);
    expect(isOpen(SHOPS.general, 22 * 60)).toBe(false);
  });
  it('처음 주머니는 START_PURSE닢, 사면 줄고 가방에 들어간다', () => {
    const r = run();
    expect(r.shop.purse).toBe(START_PURSE);
    const out = buy(r, 'general', 'bandage', 1);
    expect(out.ok).toBe(true);
    expect(out.changes.shop.purse).toBe(START_PURSE - PRICES.bandage);
    expect(out.changes.farm.items.bandage).toBe(1);
  });
  it('닢이 모자라면 못 산다', () => {
    const r = { ...run(), shop: { purse: 1, sold: {} } };
    expect(buy(r, 'general', 'bandage', 1)).toMatchObject({ ok: false, reason: 'poor' });
  });
  it('하루에 정해진 수만 판다. 다음 날엔 다시 있다', () => {
    let r = { ...run(), shop: { purse: 999, sold: {} } };
    const a = buy(r, 'general', 'leatherBoots', 3);
    r = { ...r, ...a.changes };
    expect(r.gear.leatherBoots).toBe(1);
    expect(buy(r, 'general', 'leatherBoots', 3)).toMatchObject({ ok: false, reason: 'soldout' });
    expect(buy(r, 'general', 'leatherBoots', 4).ok).toBe(true);
  });
  it('조건이 붙은 물건은 조건이 맞을 때만', () => {
    const r = run();
    expect(stockOf('general', { state: r.shop, passes: () => false }).some((e) => e.item === 'leatherVest')).toBe(false);
    expect(stockOf('general', { state: r.shop, passes: () => true }).some((e) => e.item === 'leatherVest')).toBe(true);
  });
  it('팔면 반값을 받는다. 입은 장비는 팔 수 없다', () => {
    const r = { ...run(), farm: { ...freshRun().farm, items: { wood: 2 } }, gear: { ironSword: 1 } };
    const out = sell(r, 'general', 'wood');
    expect(out.ok).toBe(true);
    expect(out.changes.shop.purse).toBe(START_PURSE + sellPriceOf('wood'));
    expect(out.changes.farm.items.wood).toBe(1);
    expect(sellableOf('forge', r, { weapon: 'ironSword' }).some((e) => e.item === 'ironSword')).toBe(false);
    expect(sellableOf('forge', r, {}).some((e) => e.item === 'ironSword')).toBe(true);
  });
  it('사들이지 않는 종류는 팔 수 없다', () => {
    const r = { ...run(), farm: { ...freshRun().farm, items: { wood: 2 } } };
    expect(sell(r, 'fruit', 'wood').ok).toBe(false);
  });
  it('싸움의 대가는 주머니에 더한다', () => {
    expect(earn({ purse: 5, sold: {} }, 10).purse).toBe(15);
  });
});
