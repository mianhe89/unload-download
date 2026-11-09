// 말 걸기와 퀘스트: 말을 건 순간 다른 단계(플래그 단계)가 마침 넘어가도, 그 말 걸기를 삼키지 않는다
// (실제로 겪은 버그: 에다 심부름 단계가 넘어가는 프레임에 호르트에게 E → 호르트의 준비 돕기가 일어나지 않았다)
import { describe, it, expect, beforeEach } from 'vitest';
import { WorldMemory } from '../../src/core/world/WorldMemory.js';
import { Quests } from '../../src/field/systems/Quests.js';
import { freshWorld } from '../helpers/world.js';

const field = () => ({ ctx: () => ({ flags: WorldMemory.run.flags, erased: [], loads: 0 }), ui: {}, world: () => ({ inZone: () => false }), cutscene: { play() {} }, sayOnce: () => Promise.resolve() });

describe('Quests.onTalk', () => {
  beforeEach(async () => { await freshWorld(); WorldMemory.startNew(); });

  it('플래그 단계가 같이 넘어가도 대화 단계가 아니면 false — 말 걸기는 그 사람의 이벤트로 간다', () => {
    const q = new Quests(field());
    WorldMemory.setQuest('q.prologue', { state: 'active', step: 1 });
    WorldMemory.setFlag('ev.prep.eda');
    expect(q.onTalk('hort')).toBe(false);
    expect(WorldMemory.quest('q.prologue').step).toBe(2); // 단계는 그대로 넘어간다
  });
});
