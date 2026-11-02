// 테스트 공용 도우미: 깨끗한 세이브, 대본 실행 문맥
import { SaveRepository } from '../../src/core/save/SaveRepository.js';
import { MemoryAdapter } from '../../src/core/storage/MemoryAdapter.js';

// 매 테스트마다 빈 메모리 저장소로 갈아끼운다
export async function freshWorld() {
  const storage = new MemoryAdapter();
  SaveRepository.useStorage(storage);
  await SaveRepository.init();
  return storage;
}

// ScriptRunner용 문맥. erased: 지워진 인물 목록
export function scriptCtx({ erased = [], loads = erased.length, flags = {} } = {}) {
  const aff = {};
  return {
    flags,
    aff,
    isErased: (id) => erased.includes(id),
    erasedCount: () => erased.length,
    loads: () => loads,
    flag: (n) => flags[n],
    setFlag: (n) => { flags[n] = true; },
    addAffinity: (id, n) => { aff[id] = (aff[id] ?? 0) + n; },
  };
}

// 대본 하나를 끝까지 돌려 보여준 노드 목록을 돌려준다
export function runAll(runner, label) {
  runner.start(label);
  const out = [];
  for (let n = runner.next(); !n.done; n = runner.next()) {
    out.push(n);
    if (n.phase || n.end) break;
  }
  return out;
}
