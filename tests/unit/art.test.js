import { describe, it, expect } from 'vitest';
import { propPixels, PROP_NAMES, TILE } from '../../content/art/props.js';
import { titleSetup } from '../../src/scenes/title/titleSetup.js';

const opaque = (px) => { let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i]) n += 1; return n; };

describe('대본용 소품', () => {
  it.each(PROP_NAMES)('%s: 그려져 있고 16×16', (k) => {
    const px = propPixels(k);
    expect(px.length).toBe(TILE * TILE * 4);
    expect(opaque(px)).toBeGreaterThan(0);
  });

  it('팩처럼 어두운 외곽선을 두른다', () => {
    const px = propPixels('bread');
    let dark = 0;
    for (let i = 0; i < px.length; i += 4) if (px[i + 3] && px[i] === 20 && px[i + 1] === 27 && px[i + 2] === 27) dark += 1;
    expect(dark).toBeGreaterThan(10);
  });
});

describe('타이틀 장면 설정', () => {
  const night = new Date(2026, 9, 28, 22);
  const fresh = { started: false, erased: [], loads: 0 };

  it('같은 날·같은 상태면 같은 장면', () => {
    expect(titleSetup(fresh, night)).toEqual(titleSetup(fresh, new Date(2026, 9, 28, 23)));
  });

  it('실제 시각이 빛을 정한다', () => {
    expect(titleSetup(fresh, night).tod).toBe('night');
    expect(titleSetup(fresh, new Date(2026, 9, 28, 13)).tod).toBe('day');
  });

  it('날짜에 따라 날씨나 카메라 자리가 달라진다 (한 달 안에 여러 가지가 나온다)', () => {
    const seen = new Set();
    for (let d = 1; d <= 30; d += 1) {
      const s = titleSetup(fresh, new Date(2026, 3, d, 12));
      seen.add(`${s.weather}/${s.view.x}`);
    }
    expect(seen.size).toBeGreaterThan(2);
  });

  it('겨울엔 비 대신 눈', () => {
    for (let d = 1; d <= 31; d += 1) expect(titleSetup(fresh, new Date(2027, 0, d, 12)).weather).not.toBe('rain');
  });

  it('지워진 사람은 서 있지 않고 흔적만 남는다', () => {
    const s = titleSetup({ started: true, chapter: 'prologue', phase: 'morning', erased: ['hort'], loads: 1 }, night);
    expect(s.people.map((p) => p.id)).not.toContain('hort');
    expect(s.remnants.map((r) => r.id)).toContain('hort');
  });

  it('처음엔 모닥불이 타오르고 미아가 곁에 있다', () => {
    const s = titleSetup(fresh, night);
    expect(s.bonfire).toBe('lit');
    expect(s.figures.map((f) => f.id)).toEqual(['me', 'mia']);
    expect(s.keeper).toBe(false);
  });

  it('1장부터는 혼자, 모닥불은 꺼지고, 종탑 앞에 정리자가 있다', () => {
    const s = titleSetup({ started: true, chapter: 'chapter1', phase: 'aftermath', erased: ['hort'], loads: 1 }, night);
    expect(s.figures.map((f) => f.id)).toEqual(['me']);
    expect(s.bonfire).toBe('out');
    expect(s.keeper).toBe(true);
  });

  it('로드할수록 화면이 더 자주 튄다 (상한 있음)', () => {
    const g = (loads) => titleSetup({ ...fresh, loads }, night).glitch;
    expect(g(0)).toBe(0);
    expect(g(3)).toBeGreaterThan(g(1));
    expect(g(100)).toBeLessThanOrEqual(0.3);
  });
});
