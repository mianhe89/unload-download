// 전투 보상(몬스터가 떨어뜨리는 것), 지워진 사람의 흔적 자리
import { describe, it, expect } from 'vitest';
describe('이기면 떨어뜨리는 것', async () => {
  const { rollDrops } = await import('../../src/battle/encounters.js');
  const { DROPS } = await import('../../content/battles/encounters.js');
  const { ITEMS } = await import('../../content/items/items.js');
  const { FOES: MONSTERS } = await import('../../content/action/foes.js');
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

describe('일과로 사는 사람이 지워지면 일터에 흔적이 남는다', async () => {
  const { workSpot } = await import('../../src/field/systems/Schedules.js');
  const village = await import('../../content/maps/village.js');
  it('호르트의 흔적은 빵집 좌판 자리', () => {
    const at = workSpot('hort', village);
    const s = village.spots.bakeryStall;
    expect(at).toEqual([Math.round(s.x), Math.round(s.y)]);
  });
  it('지워질 수 있는 사람은 모두 흔적 자리가 있다', async () => {
    const { characters } = await import('../../content/characters/index.js');
    for (const id of ['hort', 'tom', 'rine', 'per']) if (characters[id].schedule) expect(workSpot(id, village), id).toBeTruthy();
  });
});

describe('장비를 떨구는 곳', async () => {
  const { rollDrops } = await import('../../src/battle/encounters.js');
  const { ITEMS } = await import('../../content/items/items.js');
  it('길 잃은 기사는 투구, 토르크는 불씨 부적을 처음 이길 때 꼭 떨군다', () => {
    expect(rollDrops(['lostknight'], 1).map((d) => d.item)).toContain('oldHelm');
    expect(rollDrops(['tork'], 1).map((d) => d.item)).toContain('emberCharm');
    expect(ITEMS.oldHelm.kind).toBe('gear');
  });
  it('이미 가진 장비는 다시 떨구지 않는다', () => {
    expect(rollDrops(['lostknight'], 1, (id) => id === 'oldHelm')).toEqual([]);
  });
  it('오크 셋을 한꺼번에 이겨도 장갑은 한 켤레만', () => {
    for (let s = 0; s < 200; s += 1) expect(rollDrops(['orc', 'orc', 'orc'], s).filter((d) => d.item === 'orcGloves').length).toBeLessThanOrEqual(1);
  });
});
