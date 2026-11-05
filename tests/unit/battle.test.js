// 체형(정답 체형은 없다)과 길 위의 마주침. 싸움 자체(탑뷰 액션)는 action.test.js
import { describe, it, expect } from 'vitest';
import { BODIES, bodyOf, applyBody } from '../../src/battle/body.js';
import { PARTY } from '../../content/battles/units.js';
import { FOES } from '../../content/action/foes.js';

describe('체형 (정답 체형은 없다)', () => {
  const base = PARTY.me;
  it('체중·근육으로 체형이 정해진다', () => {
    expect(bodyOf({ weight: 50 })).toBe('thin');
    expect(bodyOf({ weight: 65 })).toBe('normal');
    expect(bodyOf({ weight: 85 })).toBe('chubby');
    expect(bodyOf({ weight: 72, muscle: 0.7 })).toBe('muscle');
  });

  it('모든 체형이 강점과 약점을 함께 가진다 (보통 제외)', () => {
    for (const [k, b] of Object.entries(BODIES)) {
      if (k === 'normal') continue;
      const ups = [b.hp > 1, b.atk > 1, b.def > 1, b.spd > 1, b.evade > 0, b.heavy > 1, b.pierce > 0, b.resist > 0].filter(Boolean).length;
      const downs = [b.hp < 1, b.atk < 1, b.def < 1, b.spd < 1, b.evade < 0].filter(Boolean).length;
      expect(ups, k).toBeGreaterThan(0);
      expect(downs, k).toBeGreaterThan(0);
    }
  });

  it('마른 몸은 회피·속도, 통통한 몸은 체력·방어', () => {
    const thin = applyBody(base, 'thin'), fat = applyBody(base, 'chubby'), mid = applyBody(base, 'normal');
    expect(thin.evade).toBeGreaterThan(mid.evade);
    expect(thin.spd).toBeGreaterThan(mid.spd);
    expect(fat.maxHp).toBeGreaterThan(mid.maxHp);
    expect(fat.def).toBeGreaterThan(mid.def);
    expect(fat.evade).toBeLessThan(mid.evade);
  });

});


describe('마주침', async () => {
  const { encounterAt, beatKey } = await import('../../src/battle/encounters.js');
  const { POOLS } = await import('../../content/battles/encounters.js');
  const d = new Date(2026, 10, 3, 12);

  it('후보 무리의 몬스터는 모두 정의돼 있다', () => {
    for (const groups of Object.values(POOLS)) for (const g of groups) for (const id of g) expect(FOES[id], id).toBeTruthy();
  });

  it('같은 날 같은 칸이면 같은 무리, 마을·바다·은하엔 없다', () => {
    expect(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, d)).toEqual(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, new Date(2026, 10, 3, 20)));
    expect(encounterAt('surface:7,6', { kind: 'hub', biome: 'snow' }, d)).toBe(null);
    expect(encounterAt('surface:9,17', { kind: 'route', biome: 'sea' }, d)).toBe(null);
    expect(encounterAt('sky:1,1', { kind: 'route', biome: 'galaxy' }, d)).toBe(null);
  });

  it('이기면 그날은 다시 나오지 않는다', () => {
    let hit = null;
    for (let i = 0; i < 60 && !hit; i += 1) { const dd = new Date(2026, 0, 1 + i); if (encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, dd)) hit = dd; }
    expect(hit).not.toBe(null);
    const k = beatKey('surface:7,9', false, hit);
    expect(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, hit, (x) => x === k)).toBe(null);
  });

  it('검은 성 앞에는 늘 정리자의 그림자가 있고, 이기면 영원히 없다', () => {
    const e = encounterAt('surface:8,2', { kind: 'route', biome: 'blackSnow' }, d);
    expect(e.enemies).toEqual(['sweeper']);
    expect(e.boss).toBe(true);
    expect(encounterAt('surface:8,2', { kind: 'route', biome: 'blackSnow' }, d, (k) => k === beatKey('surface:8,2', true))).toBe(null);
  });

  it('하루 걸러 보면 길 몬스터는 셋 중 하나쯤', () => {
    let n = 0;
    for (let i = 0; i < 300; i += 1) if (encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, new Date(2026, 0, 1 + i))) n += 1;
    expect(n / 300).toBeGreaterThan(0.2);
    expect(n / 300).toBeLessThan(0.5);
  });
});

