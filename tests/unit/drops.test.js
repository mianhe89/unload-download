// 전투 보상: 몬스터가 떨어뜨리는 것
import { describe, it, expect } from 'vitest';
describe('이기면 떨어뜨리는 것', async () => {
  const { rollDrops } = await import('../../src/battle/encounters.js');
  const { DROPS } = await import('../../content/battles/encounters.js');
  const { ITEMS } = await import('../../content/items/items.js');
  const { MONSTERS } = await import('../../content/battles/units.js');
  it('떨구는 건 실제 아이템, 실제 몬스터, 한 줄 설명이 있다', () => {
    for (const [id, list] of Object.entries(DROPS)) {
      expect(MONSTERS[id], id).toBeTruthy();
      for (const d of list) { expect(ITEMS[d.item], d.item).toBeTruthy(); expect(d.text.length).toBeGreaterThan(5); }
    }
  });
  it('포션은 일반 몬스터가 떨구지 않는다 (귀하다)', () => {
    for (const [id, list] of Object.entries(DROPS)) if (!['tork'].includes(id)) expect(list.some((d) => d.item === 'potion'), id).toBe(false);
  });
  it('같은 씨앗이면 같은 결과, 많이 싸우면 확률대로 나온다', () => {
    expect(rollDrops(['slime', 'slime'], 7)).toEqual(rollDrops(['slime', 'slime'], 7));
    let herbs = 0;
    for (let s = 0; s < 400; s += 1) herbs += rollDrops(['slime'], s).filter((d) => d.item === 'herb').length;
    expect(herbs / 400).toBeGreaterThan(0.25);
    expect(herbs / 400).toBeLessThan(0.45);
  });
});
