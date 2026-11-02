import { describe, it, expect } from 'vitest';
import { EventDirector } from '../../src/field/EventDirector.js';

const TILE = 16;
// 가짜 세계: 플레이어와 인물 위치(타일), 구역, 줍기, 플래그를 직접 조작한다
function fakeWorld(over = {}) {
  const w = {
    time: 0,
    player: { x: 0, y: 0, idleTime: 0 },
    people: {},
    zone: null,
    picked: {},
    flags: {},
    flagTimes: {},
    when: () => true,
    ...over,
  };
  return {
    w,
    view: () => ({
      time: w.time,
      player: w.player,
      pos: (n) => (w.people[n] ? { x: w.people[n][0] * TILE, y: w.people[n][1] * TILE } : null),
      inZone: (z) => w.zone === z,
      pickedAll: (g) => Boolean(w.picked[g]),
      flag: (n) => w.flags[n],
      flagTime: (n) => w.flagTimes[n],
      passes: (when) => w.when(when),
    }),
    at: (tx, ty) => { w.player.x = tx * TILE; w.player.y = ty * TILE; },
  };
}
const ids = (r) => r.runs.map((x) => x.id);

describe('이벤트 계기', () => {
  it('near: 반경 안에 들어가면', () => {
    const d = new EventDirector([{ id: 'e', trigger: { near: 'hort', r: 2 }, run: 'x' }]);
    const f = fakeWorld({ people: { hort: [10, 10] } });
    f.at(0, 0);
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.at(11, 11);
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('near: 그 사람이 없으면(지워짐) 일어나지 않는다', () => {
    const d = new EventDirector([{ id: 'e', trigger: { near: 'hort', r: 99 }, run: 'x' }]);
    expect(ids(d.update(0.1, fakeWorld().view()))).toEqual([]);
  });

  it('zone: 구역에 들어서면', () => {
    const d = new EventDirector([{ id: 'e', trigger: { zone: 'smithy' }, run: 'x' }]);
    const f = fakeWorld();
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.zone = 'smithy';
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('timer: n초가 지나면', () => {
    const d = new EventDirector([{ id: 'e', trigger: { timer: 45 }, run: 'x' }]);
    const f = fakeWorld({ time: 44.9 });
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.time = 45;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('afterFlag: 플래그가 켜지고 delay초 뒤', () => {
    const d = new EventDirector([{ id: 'e', trigger: { afterFlag: 'eda.met', delay: 18 }, run: 'x' }]);
    const f = fakeWorld({ time: 100 });
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.flagTimes['eda.met'] = 90;
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.time = 108;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('count: 플래그 n개 이상', () => {
    const d = new EventDirector([{ id: 'e', trigger: { count: ['a', 'b', 'c'], n: 2 }, run: 'x' }]);
    const f = fakeWorld({ flags: { a: true } });
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.flags.c = true;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('pickedAll + near: 다 주운 뒤 그 사람에게 가야', () => {
    const d = new EventDirector([{ id: 'e', trigger: { pickedAll: 'bread', near: 'hort', r: 2 }, run: 'x' }]);
    const f = fakeWorld({ people: { hort: [10, 10] } });
    f.at(30, 30);
    f.w.picked.bread = true;
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.at(10, 11);
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('idle: 그 곁에서 가만히 n초', () => {
    const d = new EventDirector([{ id: 'e', trigger: { idle: 8, near: 'mia', r: 2 }, run: 'x' }]);
    const f = fakeWorld({ people: { mia: [5, 5] } });
    f.at(5, 6);
    f.w.player.idleTime = 7.9;
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.player.idleTime = 8;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('dwell: 곁에 누적 n초 머물면, 도중에 말풍선', () => {
    const ticks = [{ at: 2, bubble: { who: 'per', text: '♪1' } }, { at: 6, bubble: { who: 'per', text: '♪2' } }];
    const d = new EventDirector([{ id: 'e', trigger: { dwell: 'per', r: 3, seconds: 10, ticks }, run: 'x' }]);
    const f = fakeWorld({ people: { per: [5, 5] } });
    f.at(5, 6);
    const bubbles = [];
    let fired = false;
    for (let t = 0; t < 12 && !fired; t += 0.5) {
      if (t === 4) f.at(40, 40); // 잠깐 자리를 비워도 누적은 유지
      if (t === 5) f.at(5, 6);
      const r = d.update(0.5, f.view());
      bubbles.push(...r.bubbles.map((b) => b.text));
      fired = r.runs.length > 0;
    }
    expect(fired).toBe(true);
    expect(bubbles).toEqual(['♪1', '♪2']);
  });

  it('minTime: 그 전에는 조건이 맞아도 안 일어난다', () => {
    const d = new EventDirector([{ id: 'e', trigger: { idle: 1, near: 'mia', r: 2, minTime: 25 }, run: 'x' }]);
    const f = fakeWorld({ people: { mia: [0, 0] }, time: 10 });
    f.w.player.idleTime = 99;
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    f.w.time = 25;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });
});

describe('이벤트 실행 규칙', () => {
  it('한 번 실행된 이벤트는 다시 안 일어난다', () => {
    const d = new EventDirector([{ id: 'e', trigger: { timer: 0 }, run: 'x' }]);
    const f = fakeWorld();
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
  });

  it('done.<id> 플래그가 있으면(이어하기) 다시 안 일어난다', () => {
    const d = new EventDirector([{ id: 'e', trigger: { timer: 0 }, run: 'x' }]);
    expect(ids(d.update(0.1, fakeWorld({ flags: { 'done.e': true } }).view()))).toEqual([]);
  });

  it('when 조건이 거짓이면 기다린다', () => {
    let ok = false;
    const d = new EventDirector([{ id: 'e', when: { ifFlag: 'z' }, trigger: { timer: 0 }, run: 'x' }]);
    const f = fakeWorld({ when: () => ok });
    expect(ids(d.update(0.1, f.view()))).toEqual([]);
    ok = true;
    expect(ids(d.update(0.1, f.view()))).toEqual(['e']);
  });

  it('한 프레임에 컷신은 하나만', () => {
    const d = new EventDirector([
      { id: 'a', trigger: { timer: 0 }, run: 'x' },
      { id: 'b', trigger: { timer: 0 }, run: 'y' },
    ]);
    const f = fakeWorld();
    expect(ids(d.update(0.1, f.view()))).toEqual(['a']);
    expect(ids(d.update(0.1, f.view()))).toEqual(['b']);
  });

  it('컷신 중(busy)에는 아무것도 안 일어난다', () => {
    const d = new EventDirector([{ id: 'e', trigger: { timer: 0 }, run: 'x' }]);
    expect(ids(d.update(0.1, fakeWorld().view(), true))).toEqual([]);
  });
});
