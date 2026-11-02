import { describe, it, expect } from 'vitest';
import { dailySeed, rng, timeOfDay, season, moonPhase } from '../../src/core/util/daily.js';

const at = (h, m = 0) => new Date(2026, 9, 28, h, m);

describe('날짜·시각 유틸', () => {
  it.each([
    [4, 59, 'night'], [5, 0, 'dawn'], [7, 59, 'dawn'], [8, 0, 'day'],
    [16, 59, 'day'], [17, 0, 'dusk'], [19, 59, 'dusk'], [20, 0, 'night'], [0, 0, 'night'],
  ])('%i시 %i분 → %s', (h, m, want) => {
    expect(timeOfDay(at(h, m))).toBe(want);
  });

  it.each([[0, 'winter'], [2, 'spring'], [5, 'summer'], [8, 'autumn'], [11, 'winter']])('%i월(0부터) → %s', (mon, want) => {
    expect(season(new Date(2026, mon, 15))).toBe(want);
  });

  it('시드는 하루 동안 같고 다음 날 바뀐다', () => {
    expect(dailySeed(at(1))).toBe(dailySeed(at(23)));
    expect(dailySeed(new Date(2026, 9, 29))).not.toBe(dailySeed(at(12)));
  });

  it('난수는 같은 시드면 같은 순서', () => {
    const a = rng(42), b = rng(42);
    const seqA = [a(), a(), a()], seqB = [b(), b(), b()];
    expect(seqA).toEqual(seqB);
    seqA.forEach((v) => { expect(v).toBeGreaterThanOrEqual(0); expect(v).toBeLessThan(1); });
  });

  it('달 위상: 알려진 보름(2024-01-25)은 0.5 근처, 삭(2024-01-11)은 0 근처', () => {
    expect(moonPhase(new Date(Date.UTC(2024, 0, 25, 18)))).toBeCloseTo(0.5, 1);
    const nm = moonPhase(new Date(Date.UTC(2024, 0, 11, 12)));
    expect(Math.min(nm, 1 - nm)).toBeLessThan(0.05);
  });
});
