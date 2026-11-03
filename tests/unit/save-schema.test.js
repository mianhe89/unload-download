import { describe, it, expect } from 'vitest';
import { VERSION, freshSave, freshRun, migrate } from '../../src/core/save/SaveSchema.js';

describe('세이브 스키마', () => {
  it('새 세이브는 현재 버전이고 진행이 없다', () => {
    const s = freshSave();
    expect(s.version).toBe(VERSION);
    expect(s.world).toEqual({ loads: 0, erased: [] });
    expect(s.run).toBeNull();
    expect(s.meta.playerId).toBeNull();
  });

  it('새 진행은 프롤로그 수확제 전날에서 시작한다', () => {
    expect(freshRun()).toMatchObject({ chapter: 'prologue', phase: 'prep', flags: {}, affinity: {} });
  });

  it('세이브가 없으면 새 세이브', () => {
    expect(migrate(null)).toMatchObject({ version: VERSION, run: null });
  });

  it('v1(비주얼노벨 시절) 세이브를 이관한다: 지워짐·로드·호감도는 남고 진행 위치는 처음으로', () => {
    const v1 = {
      loads: 3,
      erased: [{ id: 'hort', atLoad: 1 }, { id: 'per', atLoad: 2 }],
      run: { label: 'ask', index: 4, affinity: { rine: 2 }, flags: { old: true } },
    };
    const s = migrate(v1);
    expect(s.version).toBe(VERSION);
    expect(s.world.loads).toBe(3);
    expect(s.world.erased.map((e) => e.id)).toEqual(['hort', 'per']);
    expect(s.run).toMatchObject({ chapter: 'prologue', phase: 'prep', affinity: { rine: 2 } });
    expect(s.run.flags).toEqual({});
  });

  it('v1에 진행이 없었으면 이관 후에도 없다', () => {
    expect(migrate({ loads: 1, erased: [], run: null }).run).toBeNull();
  });

  it('v2 세이브: 진행은 그대로, 마을 밖 위치(where)는 비어 있다(마을 안)', () => {
    const v2 = { version: 2, world: { loads: 2, erased: [] }, run: { chapter: 'chapter1', phase: 'aftermath', flags: { a: true }, affinity: {}, startedAt: 1 }, meta: {} };
    const s = migrate(v2);
    expect(s.version).toBe(VERSION);
    expect(s.run).toMatchObject({ chapter: 'chapter1', phase: 'aftermath', flags: { a: true }, where: null });
    expect(s.run.life.weight).toBeGreaterThan(0); // v4: 생활 상태도 채워진다
    expect(s.run.farm.skills).toEqual([]); // v5: 행동 파밍
    expect(s.run.quests).toEqual({}); // v6: 퀘스트와 단서 수첩
    expect(s.run.clues).toEqual([]);
    expect(migrate({ ...v2, run: null }).run).toBeNull();
  });

  it('v5 세이브: 진행·플래그는 그대로, 퀘스트와 단서 수첩은 빈 채로 붙는다', () => {
    const v5 = { version: 5, world: { loads: 1, erased: [] }, run: { chapter: 'prologue', phase: 'morning', flags: { 'smithy.seen': true }, affinity: {}, farm: { counts: {}, items: {}, skills: [] } }, meta: {} };
    const s = migrate(v5);
    expect(s.version).toBe(VERSION);
    expect(s.run).toMatchObject({ phase: 'morning', flags: { 'smithy.seen': true }, quests: {}, clues: [] });
  });

  it('현재 버전 세이브는 그대로 둔다', () => {
    const s = freshSave();
    s.world.loads = 7;
    expect(migrate(s)).toBe(s);
  });

  it('알 수 없는 버전에서 이관 경로가 없으면 새 세이브로 (게임이 멈추지 않게)', () => {
    expect(migrate({ version: -5 })).toMatchObject({ version: VERSION, run: null });
  });
});
