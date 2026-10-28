// 핵심 메카닉: 로드할 때마다 누군가 지워진다.
// 개인 데이터는 클라이언트에 그대로 저장한다(조작 방지하지 않음, 기획서 '조작 정책').
const KEY = 'ud.world';

const defaultState = () => ({
  loads: 0,          // 누적 로드/재시도 횟수
  erased: [],        // 지워진 존재 { id, atLoad }
  saves: {},         // 슬롯별 세이브
});

// 지워질 후보. 실제 순서는 플레이어 행동(자주 찾은 NPC 등)으로 결정하도록 확장 예정.
const ERASE_POOL = ['baker', 'guard_tom', 'flower_girl', 'old_bard', 'smith_daughter'];

function read() {
  try {
    return { ...defaultState(), ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return defaultState();
  }
}

function write(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* 저장 불가 환경 무시 */ }
}

export const WorldMemory = {
  get state() { return read(); },

  save(slot, data) {
    const s = read();
    s.saves[slot] = { data, at: Date.now() };
    write(s);
  },

  // 로드 = 세계선 이동. 대가로 한 명이 지워진다.
  load(slot) {
    const s = read();
    const save = s.saves[slot];
    if (!save) return null;
    s.loads += 1;
    const remaining = ERASE_POOL.filter((id) => !s.erased.some((e) => e.id === id));
    if (remaining.length) s.erased.push({ id: remaining[0], atLoad: s.loads });
    write(s);
    return save.data;
  },

  isErased(id) { return read().erased.some((e) => e.id === id); },

  reset() { write(defaultState()); },
};
