// 대사 처리: 지워진 이름이 깨지는 규칙, 걸으며 듣는 대사(walk) 모드
import { describe, it, expect } from 'vitest';
import { corrupt, maskNames, goneIds, lineSeconds, canHear, HEAR_TILES } from '../../src/core/script/speech.js';
import { ScriptRunner } from '../../src/core/script/ScriptRunner.js';
import { N, T, WALK } from '../../content/chapters/dsl.js';
import { characters } from '../../content/characters/index.js';
import { chapters } from '../../content/chapters/index.js';
import { scriptCtx, runAll } from '../helpers/world.js';

describe('지워진 이름', () => {
  it('깨진 글자는 길이가 같고, 같은 이름은 늘 같은 모양', () => {
    expect(corrupt('호르트')).toHaveLength(3);
    expect(corrupt('호르트')).toBe(corrupt('호르트'));
    expect(corrupt('호르트')).toMatch(/^[▒■░▓]+$/);
  });

  it('마을 사람 입에서는 깨진다', () => {
    expect(maskNames('에다? 처음 듣는 이름인데.', 'hort', ['에다'])).toBe(`${corrupt('에다')}? 처음 듣는 이름인데.`);
  });

  it('주인공과 내레이션은 이름을 온전히 말한다', () => {
    expect(maskNames('에다 못 봤어?', 'me', ['에다'])).toBe('에다 못 봤어?');
    expect(maskNames('종탑 벽에 새긴 이름. 에다.', undefined, ['에다'])).toBe('종탑 벽에 새긴 이름. 에다.');
  });

  it('지워지지 않은 이름은 그대로', () => {
    expect(maskNames('리네가 그러던데', 'mia', ['호르트'])).toBe('리네가 그러던데');
  });

  it('에다는 수확제 밤에만 이 세상에 있다', () => {
    expect(goneIds(characters, { erased: [], phase: 'festival' })).not.toContain('eda');
    expect(goneIds(characters, { erased: [], phase: 'morning' })).toContain('eda');
  });

  it('로드로 지워진 사람도 사라진 사람이다', () => {
    expect(goneIds(characters, { erased: ['tom'], phase: 'festival' })).toEqual(['tom']);
  });

  it('{lastErased}는 가장 최근에 지워진 사람의 이름', () => {
    const r = new ScriptRunner({}, scriptCtx({ erased: ['hort', 'rine'] }));
    expect(r.format('{lastErased}의 자리')).toBe('리네의 자리');
    expect(new ScriptRunner({}, scriptCtx()).format('[{lastErased}]')).toBe('[]');
  });
});

describe('걸으며 듣는 대사', () => {
  const script = { a: [WALK, N('하나'), T('mia', '둘')], b: [N('셋')] };

  it('첫 줄의 WALK로 모드가 정해지고, 기본은 block', () => {
    const r = new ScriptRunner(script, scriptCtx());
    expect(r.mode('a')).toBe('walk');
    expect(r.mode('b')).toBe('block');
  });

  it('WALK 머리 노드는 보여지지 않는다', () => {
    const r = new ScriptRunner(script, scriptCtx());
    expect(runAll(r, 'a').map((n) => n.say)).toEqual(['하나', '둘']);
  });

  it('말풍선 시간은 읽을 만큼, 상한·하한이 있다', () => {
    expect(lineSeconds('아')).toBeGreaterThanOrEqual(1.8);
    expect(lineSeconds('가'.repeat(200))).toBeLessThanOrEqual(5.5);
    expect(lineSeconds('가'.repeat(30))).toBeGreaterThan(lineSeconds('가'.repeat(5)));
  });

  it(`${HEAR_TILES}칸 안에서만 들린다`, () => {
    expect(canHear(HEAR_TILES * 16, 0)).toBe(true);
    expect(canHear(HEAR_TILES * 16 + 1, 0)).toBe(false);
  });

  it('중요한 장면은 멈춰서 본다 (대화창)', () => {
    const S = chapters.prologue.script;
    for (const l of ['festival.eda', 'festival.bells', 'morning.mia', 'morning.selena', 'morning.lu', 'night.keeper']) {
      expect(new ScriptRunner(S, scriptCtx()).mode(l)).toBe('block');
    }
    expect(new ScriptRunner(chapters.chapter1.script, scriptCtx()).mode('aftermath.tower')).toBe('block');
  });

  it('말 걸기(talk.*)는 모두 걸으며 듣는다 — 자리를 뜨면 놓친다', () => {
    for (const ch of Object.values(chapters)) {
      const r = new ScriptRunner(ch.script, scriptCtx());
      for (const l of Object.keys(ch.script).filter((k) => k.startsWith('talk.'))) expect(r.mode(l), l).toBe('walk');
    }
  });

  it('페이즈 전환·장 끝은 멈춰서 보는 장면에서만 일어난다', () => {
    for (const ch of Object.values(chapters)) {
      const r = new ScriptRunner(ch.script, scriptCtx());
      for (const [l, nodes] of Object.entries(ch.script)) {
        if (nodes.some((n) => n.phase || n.end)) expect(r.mode(l), l).toBe('block');
      }
    }
  });
});

describe('빈자리 찾기', async () => {
  const { absence, objectiveText } = await import('../../src/field/absence.js');

  it('지워진 사람이 없으면 목표는 그대로', () => {
    const a = absence([], ['hort'], {});
    expect(a.total).toBe(0);
    expect(objectiveText('종탑', a)).toBe('종탑');
  });

  it('흔적을 살펴본 만큼 센다', () => {
    const a = absence(['hort', 'rine'], ['hort', 'rine'], { 'found.hort': true });
    expect(a).toEqual({ total: 2, found: 1, all: false });
    expect(objectiveText('종탑', a)).toBe('종탑 · 빈자리 1/2');
  });

  it('흔적이 없는 사람은 세지 않는다, 다 찾으면 all', () => {
    const a = absence(['hort', 'eda'], ['hort'], { 'found.hort': true });
    expect(a).toEqual({ total: 1, found: 1, all: true });
  });
});
