// 생활: 먹고 움직이고 쉬는 만큼 몸·마음이 변하고, 그게 전투 능력치가 된다
import { describe, it, expect } from 'vitest';
import { freshLife, act, walk, canDo, minutesLeft, mindsetOf, battleStats, statusLines } from '../../src/life/life.js';
import { ACTIONS, LIFE_SPOTS, MINDS } from '../../content/life/life.js';
import { PARTY } from '../../content/battles/units.js';
import * as village from '../../content/maps/village.js';

const repeat = (life, id, n) => { let l = life; for (let i = 0; i < n; i += 1) l = act(l, id, i * 3.6e6); return l; };

describe('생활 → 몸', () => {
  it('먹으면 찌고, 일하면 빠진다', () => {
    const l = freshLife();
    expect(act(l, 'honeyBread').weight).toBeGreaterThan(l.weight);
    expect(act(l, 'drill').weight).toBeLessThan(l.weight);
  });

  it('한 번으로는 체형이 안 바뀌고, 쌓이면 바뀐다', () => {
    const l = freshLife();
    expect(battleStats(PARTY.me, act(l, 'honeyBread')).body).toBe('normal');
    expect(battleStats(PARTY.me, repeat(l, 'honeyBread', 140)).body).toBe('chubby');
    expect(battleStats(PARTY.me, repeat(l, 'drill', 12)).body).toBe('muscle');
  });

  it('걸으면 조금씩 빠진다', () => {
    const l = freshLife();
    const w = walk(l, 1000);
    expect(w.weight).toBeLessThan(l.weight);
    expect(w.walked).toBe(1000);
    expect(l.weight - w.weight).toBeLessThan(0.2);
  });

  it('원본 상태는 바뀌지 않는다', () => {
    const l = freshLife();
    act(l, 'drill');
    expect(l).toEqual(freshLife());
  });

  it('같은 행동은 쿨다운이 지나야 다시', () => {
    const l = act(freshLife(), 'drill', 0);
    expect(canDo(l, 'drill', 60_000)).toBe(false);
    expect(minutesLeft(l, 'drill', 60_000)).toBe(ACTIONS.drill.cooldown - 1);
    expect(canDo(l, 'drill', ACTIONS.drill.cooldown * 60_000)).toBe(true);
    expect(canDo(l, 'water', 60_000)).toBe(true);
  });

  it('지치면 공격·속도가 떨어지고, 자면 풀린다', () => {
    const tired = repeat(freshLife(), 'drill', 3);
    expect(tired.fatigue).toBeGreaterThanOrEqual(70);
    const a = battleStats(PARTY.me, tired), b = battleStats(PARTY.me, act(tired, 'sleep', 1e10));
    expect(a.spd).toBeLessThan(b.spd);
    expect(statusLines(PARTY.me, tired).some((l) => l.includes('지쳐'))).toBe(true);
  });
});

describe('생활 → 마음가짐', () => {
  it('어느 쪽으로도 크게 기울지 않으면 균형', () => expect(mindsetOf({ relaxed: 1, diligent: 2, firm: 0 })).toBe('balanced'));
  it('놀고 먹으면 여유', () => expect(battleStats(PARTY.me, repeat(freshLife(), 'honeyBread', 5)).mind).toBe('relaxed'));
  it('꾸준히 일하면 부지런함', () => expect(battleStats(PARTY.me, repeat(freshLife(), 'water', 5)).mind).toBe('diligent'));
  it('훈련하고 집밥으로 몸 관리하면 단단함으로 기운다', () => {
    let l = freshLife();
    for (let i = 0; i < 6; i += 1) { l = act(l, 'drill', i * 1e8); l = act(l, 'homeMeal', i * 1e8 + 1); }
    expect(l.mind.firm).toBeGreaterThan(l.mind.relaxed);
  });
  it('마음가짐마다 보정이 다르고, 균형은 보정 없음', () => {
    const base = battleStats(PARTY.me, freshLife());
    const firm = battleStats(PARTY.me, { ...freshLife(), mind: { relaxed: 0, diligent: 0, firm: 5 } });
    const dil = battleStats(PARTY.me, { ...freshLife(), mind: { relaxed: 0, diligent: 5, firm: 0 } });
    const rel = battleStats(PARTY.me, { ...freshLife(), mind: { relaxed: 5, diligent: 0, firm: 0 } });
    expect(firm.atk).toBeGreaterThan(base.atk);
    expect(dil.startGauge).toBe(15);
    expect(rel.resist).toBeGreaterThan(base.resist);
    expect(Object.keys(MINDS)).toEqual(['relaxed', 'diligent', 'firm', 'balanced']);
  });
});

describe('마을의 생활 자리', () => {
  it('모든 자리는 정의된 행동이고 걸어서 닿는다', () => {
    for (const s of LIFE_SPOTS) {
      expect(ACTIONS[s.action], s.action).toBeTruthy();
      const near = [[0, 0], [0, 1], [1, 0], [-1, 0], [0, -1]].some(([dx, dy]) => !village.isSolidTile(s.at[0] + dx, s.at[1] + dy));
      expect(near, s.action).toBe(true);
    }
  });
  it('생활 자리는 어느 페이즈의 사람과도 겹치지 않는다 (E가 사람에게 가지 않게) — 빵집 주인은 예외', async () => {
    const { chapters } = await import('../../content/chapters/index.js');
    for (const ch of Object.values(chapters)) for (const [pid, ph] of Object.entries(ch.phases)) {
      for (const [id, n] of Object.entries(ph.npcs ?? {})) {
        for (const l of LIFE_SPOTS) {
          if (l.needs === id) continue;
          const d = Math.hypot(n.at[0] - l.at[0], n.at[1] - l.at[1]);
          expect(d, `${pid}: ${id} ↔ ${l.action}`).toBeGreaterThan(1.5);
        }
      }
    }
  });

  it('스테이터스 창은 체중·체형·마음가짐을 모두 보여준다', () => {
    const lines = statusLines(PARTY.me, freshLife()).join('\n');
    for (const w of ['체중', '체형', '회피', '마음가짐']) expect(lines).toContain(w);
  });
});
