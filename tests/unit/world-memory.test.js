import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMemory } from '../../src/core/world/WorldMemory.js';
import { ERASE_ORDER, HEROINES_FROM } from '../../content/characters/index.js';

// 다음 지워짐까지 로드한다 (네다섯 번에 한 번)
const untilErased = () => { for (let i = 0; i < 10; i += 1) { const r = WorldMemory.load(); if (r.victim) return r.victim; } return null; };
import { freshWorld } from '../helpers/world.js';

describe('지워짐 규칙 (WorldMemory)', () => {
  beforeEach(freshWorld);

  it('마을 밖 위치는 저장되고, 로드해도 남고, 새로 시작하면 지워진다', () => {
    WorldMemory.startNew();
    expect(WorldMemory.run.where).toBeNull();
    WorldMemory.setWhere({ layer: 'surface', at: [7, 9] });
    expect(WorldMemory.load().run.where).toEqual({ layer: 'surface', at: [7, 9] });
    WorldMemory.startNew();
    expect(WorldMemory.run.where).toBeNull();
  });

  it('진행이 없으면 CONTINUE할 수 없다', () => {
    expect(WorldMemory.hasRun).toBe(false);
  });

  it('네다섯 번에 한 번 지워진다: 4번째, 9번째, 13번째, 18번째 로드', () => {
    WorldMemory.startNew();
    const at = [];
    for (let i = 1; i <= 18; i += 1) if (WorldMemory.load().victim) at.push(i);
    expect(at).toEqual([4, 9, 13, 18]);
    expect(WorldMemory.world.erased.map((e) => e.atLoad)).toEqual([4, 9, 13, 18]);
  });

  it('호감도가 가장 높은 사람부터 지워진다', () => {
    WorldMemory.startNew();
    WorldMemory.addAffinity('per', 3);
    WorldMemory.addAffinity('rine', 2);
    WorldMemory.addAffinity('tom', 1);
    expect(untilErased()).toBe('per');
    expect(untilErased()).toBe('rine');
    expect(untilErased()).toBe('tom');
  });

  it('동점이면 정해진 순서대로', () => {
    WorldMemory.startNew();
    expect(untilErased()).toBe(ERASE_ORDER[0]);
    expect(untilErased()).toBe(ERASE_ORDER[1]);
  });

  it('1부에선 히로인(미아 등)은 지워지지 않는다. 2부부터는 가장 마음을 준 히로인이 먼저다', () => {
    WorldMemory.startNew();
    WorldMemory.addAffinity('mia', 99);
    expect(untilErased()).toBe(ERASE_ORDER[0]);
    expect(WorldMemory.isErased('mia')).toBe(false);
    WorldMemory.setFlag(HEROINES_FROM);
    expect(untilErased()).toBe('mia');
  });

  it('모두 지워진 뒤엔 더 지워지지 않고 로드 횟수만 오른다', () => {
    WorldMemory.startNew();
    for (let i = 0; i < ERASE_ORDER.length; i += 1) untilErased();
    expect(untilErased()).toBeNull();
    expect(WorldMemory.world.erased).toHaveLength(ERASE_ORDER.length);
  });

  it('RESET & START는 진행만 처음으로. 지워진 사람과 로드 횟수는 남는다', () => {
    WorldMemory.startNew();
    WorldMemory.setFlag('ev.hort');
    WorldMemory.checkpoint('prologue', 'night');
    untilErased();
    WorldMemory.startNew();
    expect(WorldMemory.run).toMatchObject({ chapter: 'prologue', phase: 'prep', flags: {}, affinity: {} });
    expect(WorldMemory.world.erased).toHaveLength(1);
    expect(WorldMemory.world.loads).toBe(4);
  });

  it('체크포인트·플래그·호감도가 진행에 기록된다', () => {
    WorldMemory.startNew();
    WorldMemory.checkpoint('chapter1', 'aftermath');
    WorldMemory.setFlag('x');
    WorldMemory.addAffinity('hort', 2);
    WorldMemory.addAffinity('hort', 1);
    expect(WorldMemory.run).toMatchObject({ chapter: 'chapter1', phase: 'aftermath', flags: { x: true }, affinity: { hort: 3 } });
  });
});
