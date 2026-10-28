// 핵심 메카닉: 로드할 때마다 누군가 지워진다.
// 지워지는 건 무작위가 아니다. 플레이어가 가장 마음을 준 사람부터 사라진다.
// 지워짐은 '새로 시작'으로도 되돌아오지 않는다. 세계는 기억한다.
// 개인 데이터는 클라이언트에 그대로 저장한다(기획서 '조작 정책').
import { ERASE_ORDER } from '../../data/story/characters.js';

const KEY = 'ud.world';

const fresh = () => ({
  loads: 0,        // 누적 로드 횟수 (세계선 이동 횟수)
  erased: [],      // { id, atLoad }
  run: null,       // 현재 진행: { label, index, affinity, flags }
});

const newRun = () => ({ label: 'start', index: 0, affinity: {}, flags: {} });

function read() {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY) || '{}') }; }
  catch { return fresh(); }
}
function write(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* 저장 불가 환경 무시 */ }
}

export const WorldMemory = {
  get state() { return read(); },
  get hasRun() { return Boolean(read().run); },

  // 새로 시작: 진행은 처음부터, 지워진 사람은 돌아오지 않는다.
  startNew() {
    const s = read();
    s.run = newRun();
    write(s);
    return s.run;
  },

  saveRun(run) {
    const s = read();
    s.run = run;
    write(s);
  },

  // 이어하기 = 로드 = 세계선 이동. 대가로 한 명이 지워진다.
  load() {
    const s = read();
    if (!s.run) return null;
    s.loads += 1;
    const victim = pickVictim(s);
    if (victim) s.erased.push({ id: victim, atLoad: s.loads });
    write(s);
    return { run: s.run, victim };
  },

  isErased(id) { return read().erased.some((e) => e.id === id); },

  reset() { write(fresh()); },
};

function pickVictim(s) {
  const alive = ERASE_ORDER.filter((id) => !s.erased.some((e) => e.id === id));
  if (!alive.length) return null;
  const aff = s.run?.affinity ?? {};
  // 가장 아낀 사람부터. 동점이면 기본 순서.
  return alive.reduce((best, id) => ((aff[id] ?? 0) > (aff[best] ?? 0) ? id : best), alive[0]);
}

// 개발용: 브라우저 콘솔에서 __ud.reset() 으로 세계 초기화
if (typeof window !== 'undefined') window.__ud = WorldMemory;
