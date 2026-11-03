import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMemory } from '../../src/core/world/WorldMemory.js';
import { ERASE_ORDER } from '../../content/characters/index.js';
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

  it('로드하면 로드 횟수가 오르고 한 명이 지워진다', () => {
    WorldMemory.startNew();
    const { victim } = WorldMemory.load();
    expect(WorldMemory.world.loads).toBe(1);
    expect(WorldMemory.isErased(victim)).toBe(true);
    expect(WorldMemory.world.erased).toHaveLength(1);
    expect(WorldMemory.world.erased[0]).toMatchObject({ id: victim, atLoad: 1 });
  });

  it('호감도가 가장 높은 사람부터 지워진다', () => {
    WorldMemory.startNew();
    WorldMemory.addAffinity('per', 3);
    WorldMemory.addAffinity('rine', 2);
    WorldMemory.addAffinity('tom', 1);
    expect(WorldMemory.load().victim).toBe('per');
    expect(WorldMemory.load().victim).toBe('rine');
    expect(WorldMemory.load().victim).toBe('tom');
  });

  it('동점이면 정해진 순서대로', () => {
    WorldMemory.startNew();
    expect(WorldMemory.load().victim).toBe(ERASE_ORDER[0]);
    expect(WorldMemory.load().victim).toBe(ERASE_ORDER[1]);
  });

  it('지워질 수 없는 인물(미아 등)의 호감도는 순서에 영향을 주지 않는다', () => {
    WorldMemory.startNew();
    WorldMemory.addAffinity('mia', 99);
    expect(WorldMemory.load().victim).toBe(ERASE_ORDER[0]);
    expect(WorldMemory.isErased('mia')).toBe(false);
  });

  it('모두 지워진 뒤엔 더 지워지지 않고 로드 횟수만 오른다', () => {
    WorldMemory.startNew();
    for (let i = 0; i < ERASE_ORDER.length; i += 1) WorldMemory.load();
    const { victim } = WorldMemory.load();
    expect(victim).toBeNull();
    expect(WorldMemory.world.erased).toHaveLength(ERASE_ORDER.length);
    expect(WorldMemory.world.loads).toBe(ERASE_ORDER.length + 1);
  });

  it('RESET & START는 진행만 처음으로. 지워진 사람과 로드 횟수는 남는다', () => {
    WorldMemory.startNew();
    WorldMemory.setFlag('ev.hort');
    WorldMemory.checkpoint('prologue', 'night');
    WorldMemory.load();
    WorldMemory.startNew();
    expect(WorldMemory.run).toMatchObject({ chapter: 'prologue', phase: 'prep', flags: {}, affinity: {} });
    expect(WorldMemory.world.erased).toHaveLength(1);
    expect(WorldMemory.world.loads).toBe(1);
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
