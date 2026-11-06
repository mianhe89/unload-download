import { describe, it, expect } from 'vitest';
import { PlayLog } from '../../src/core/playtest/PlayLog.js';
import { summarize } from '../../src/core/playtest/summary.js';

const mem = () => { const m = new Map(); return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) }; };

describe('플레이테스트 기록', () => {
  it('?playtest로 켜야만 쓰고, 한 번 켜면 이 브라우저에 기억된다', () => {
    const storage = mem();
    PlayLog.init({ search: '', storage, now: 1 });
    PlayLog.log('talk', { npc: 'mia' });
    expect(PlayLog.enabled).toBe(false);
    expect(storage.getItem('ud.playlog')).toBe(null);

    PlayLog.init({ search: '?playtest', storage, now: 2 });
    PlayLog.log('talk', { npc: 'mia' }, 3);
    PlayLog.init({ search: '', storage, now: 4 }); // 다음 날 주소 없이 열어도 켜져 있다
    expect(PlayLog.enabled).toBe(true);
    expect(PlayLog.rows.map((r) => r.k)).toEqual(['open', 'talk', 'open']);

    PlayLog.init({ search: '?playtest=0', storage, now: 5 });
    expect(PlayLog.enabled).toBe(false);
  });

  it('요약: 페이즈별 시간, 반응 없는 구간, 멈춰 선 곳, 되돌린 싸움, 지워짐', () => {
    const s = 's1', t = (sec) => 1000 * sec;
    const rows = [
      { t: t(0), s, k: 'phase', ch: 'prologue', ph: 'prep' },
      { t: t(5), s, k: 'scene', label: 'prep.intro' },
      { t: t(30), s, k: 'scene.end', label: 'prep.intro' },
      { t: t(40), s, k: 'trace', ph: 'prep', x: 1, y: 1, walk: 0 },
      { t: t(50), s, k: 'trace', ph: 'prep', x: 1, y: 1, walk: 0 },
      { t: t(60), s, k: 'trace', ph: 'prep', x: 1, y: 1, walk: 0 },
      { t: t(70), s, k: 'trace', ph: 'prep', x: 2, y: 1, walk: 3 },
      { t: t(130), s, k: 'talk', npc: 'eda' }, // 장면이 끝나고 100초 동안 아무 일 없음
      { t: t(140), s, k: 'battle', foes: ['wolf'] },
      { t: t(150), s, k: 'battle.end', result: 'lose' },
      { t: t(151), s, k: 'battle.retry' },
      { t: t(152), s, k: 'load', loads: 4, victim: 'hort' },
      { t: t(170), s, k: 'battle.end', result: 'win' },
      { t: t(180), s, k: 'phase', ch: 'prologue', ph: 'festival' },
      { t: t(240), s, k: 'quit' },
    ];
    const r = summarize(rows);
    expect(r.phaseTime).toEqual({ 'prologue.prep': 180, 'prologue.festival': 60 });
    expect(r.quiet[0]).toMatchObject({ where: 'prologue.prep', secs: 100, next: 'eda' });
    expect(r.still[0]).toMatchObject({ secs: 30, tile: [1, 1] });
    expect(r.battles[0]).toMatchObject({ result: 'win', retries: 1 });
    expect(r.erased[0]).toMatchObject({ victim: 'hort', loads: 4 });
    expect(r.sessions[0]).toMatchObject({ minutes: 4, loads: 1, victims: ['hort'], quit: true, quitIn: 'festival' });
  });
});
