import { describe, it, expect } from 'vitest';
import { freshBag, addItem, takeItem, listBag, giftResult, markGifted, MAX_STACK } from '../../src/life/bag.js';
import { ITEMS } from '../../content/items.js';
import { characters } from '../../content/characters/index.js';

describe('가방', () => {
  it('넣고 꺼낸다. 한 칸에 최대 MAX_STACK', () => {
    let b = addItem(freshBag(), 'honeybread', 20);
    expect(b.items.honeybread).toBe(MAX_STACK);
    b = takeItem(addItem(freshBag(), 'chestnut'), 'chestnut');
    expect(b.items.chestnut).toBeUndefined();
    expect(takeItem(freshBag(), 'chestnut')).toBeNull();
  });

  it('목록: 재료는 파밍에서, 소중한 것은 플래그로. 먹을 것 → 재료 → 소중한 것', () => {
    const l = listBag(addItem(freshBag(), 'honeybread'), { farmItems: { wood: 3 }, flags: { 'has.ring': true } });
    expect(l.map((x) => x.id)).toEqual(['honeybread', 'wood', 'ring']);
  });

  it('선물: 좋아하는 사람은 더 반갑다. 같은 사람에게는 하루 한 번', () => {
    const mia = giftResult(freshBag(), 'honeybread', 'mia', 5);
    const hort = giftResult(freshBag(), 'honeybread', 'hort', 5);
    expect(mia.aff).toBeGreaterThan(hort.aff);
    const again = giftResult(markGifted(freshBag(), 'mia', 5), 'honeybread', 'mia', 5);
    expect(again.again).toBe(true);
    expect(giftResult(markGifted(freshBag(), 'mia', 5), 'honeybread', 'mia', 6).ok).toBe(true);
    expect(giftResult(freshBag(), 'ring', 'mia', 5).ok).toBe(false); // 소중한 것은 건네지 않는다
  });

  it('반가움·말에 적힌 인물은 모두 있다', () => {
    for (const def of Object.values(ITEMS)) for (const id of [...Object.keys(def.likes ?? {}), ...Object.keys(def.lines ?? {})]) expect(characters[id], id).toBeTruthy();
  });
});
