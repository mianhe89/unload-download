import { describe, it, expect } from 'vitest';
import { ScriptRunner, passes } from '../../src/core/script/ScriptRunner.js';
import { N, T } from '../../content/chapters/dsl.js';
import { scriptCtx, runAll } from '../helpers/world.js';

const says = (nodes) => nodes.filter((n) => n.say).map((n) => n.say);

describe('대본 조건 (passes)', () => {
  const ctx = scriptCtx({ erased: ['hort'], loads: 2, flags: { a: true } });
  it.each([
    [{ ifErased: 'hort' }, true],
    [{ ifErased: 'tom' }, false],
    [{ ifErased: ['hort', 'tom'] }, false],
    [{ unlessErased: 'hort' }, false],
    [{ unlessErased: ['tom', 'per'] }, true],
    [{ ifErasedAny: true }, true],
    [{ minLoads: 2 }, true],
    [{ minLoads: 3 }, false],
    [{ maxLoads: 1 }, false],
    [{ ifFlag: 'a' }, true],
    [{ ifFlag: 'b' }, false],
    [{ unlessFlag: 'a' }, false],
    [{}, true],
  ])('%o → %s', (node, want) => {
    expect(passes(node, ctx)).toBe(want);
  });

  it('아무도 지워지지 않았으면 ifErasedAny는 거짓', () => {
    expect(passes({ ifErasedAny: true }, scriptCtx())).toBe(false);
  });
});

describe('대본 실행기', () => {
  it('조건에 맞는 대사만 보여준다', () => {
    const script = { a: [N('하나'), T('hort', '빵', { unlessErased: 'hort' }), N('빈 좌판', { ifErased: 'hort' }), N('끝')] };
    expect(says(runAll(new ScriptRunner(script, scriptCtx()), 'a'))).toEqual(['하나', '빵', '끝']);
    expect(says(runAll(new ScriptRunner(script, scriptCtx({ erased: ['hort'] })), 'a'))).toEqual(['하나', '빈 좌판', '끝']);
  });

  it('goto로 다른 라벨로 넘어간다', () => {
    const script = { a: [N('A'), { goto: 'b' }, N('안 보임')], b: [N('B')] };
    expect(says(runAll(new ScriptRunner(script, scriptCtx()), 'a'))).toEqual(['A', 'B']);
  });

  it('aff와 flag가 한 노드에 같이 있어도 둘 다 처리한다 (회귀: 플래그 누락으로 에다가 안 나오던 버그)', () => {
    const ctx = scriptCtx();
    runAll(new ScriptRunner({ a: [{ aff: { hort: 2 }, flag: 'ev.hort' }] }, ctx), 'a');
    expect(ctx.aff.hort).toBe(2);
    expect(ctx.flags['ev.hort']).toBe(true);
  });

  it('flag만 있는 노드는 화면에 보이지 않고 처리된다', () => {
    const ctx = scriptCtx();
    const shown = runAll(new ScriptRunner({ a: [{ flag: 'x' }, N('다음')] }, ctx), 'a');
    expect(shown).toHaveLength(1);
    expect(ctx.flags.x).toBe(true);
  });

  it('phase/end 노드에서 멈춘다', () => {
    const shown = runAll(new ScriptRunner({ a: [N('가자'), { phase: 'morning' }, N('안 보임')] }, scriptCtx()), 'a');
    expect(shown.at(-1)).toEqual({ phase: 'morning' });
  });

  it('{bells}는 13 + 로드 횟수, {loads}는 로드 횟수', () => {
    const r = new ScriptRunner({}, scriptCtx({ loads: 3 }));
    expect(r.format('…{bells}. ({loads})')).toBe('…16. (3)');
  });

  it('없는 라벨은 바로 에러 (오타를 조용히 넘기지 않음)', () => {
    expect(() => new ScriptRunner({}, scriptCtx()).start('없음')).toThrow(/없음/);
    const r = new ScriptRunner({ a: [{ goto: '없음' }] }, scriptCtx());
    r.start('a');
    expect(() => r.next()).toThrow(/없음/);
  });

  it('무한 goto는 멈춘다', () => {
    const r = new ScriptRunner({ a: [{ goto: 'b' }], b: [{ goto: 'a' }] }, scriptCtx());
    r.start('a');
    expect(() => r.next()).toThrow(/무한/);
  });
});
