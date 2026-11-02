// 세이브 데이터의 형태와 버전 이관.
// 필드를 바꿀 땐 VERSION을 올리고 MIGRATIONS에 이전 버전 → 새 버전 변환을 추가한다.
// 나중에 DB로 옮길 때 이 구조가 그대로 테이블/문서 스키마의 기준이 된다.
import { freshLife } from '../../life/life.js';
//
// save = {
//   version,
//   world: {               // 세계의 기억. RESET & START로도 지워지지 않는다
//     loads,               //   누적 로드(세계선 이동) 횟수
//     erased: [{ id, atLoad, at }],
//   },
//   run: null | {          // 현재 진행. RESET & START로 처음부터
//     chapter, phase,      //   어느 장의 어느 페이즈인가 (이어하기는 페이즈 시작점부터)
//     where: null | { layer, at },  // 마을 밖 길 맵에 있으면 그 칸 (이어하기는 그 칸에서)
//     life: { weight, muscle, fatigue, mind, walked, last },  // 생활 → 체형·마음가짐 (src/life/life.js)
//     flags: {},           //   이벤트 진행 표시
//     affinity: {},        //   인물별 호감도 (지워지는 순서를 정한다)
//     startedAt,
//   },
//   meta: { createdAt, updatedAt, playerId },  // 서버 연동 시 계정과 묶을 자리
// }

export const VERSION = 4;

export const freshSave = () => ({
  version: VERSION,
  world: { loads: 0, erased: [] },
  run: null,
  meta: { createdAt: Date.now(), updatedAt: Date.now(), playerId: null },
});

export const freshRun = () => ({
  chapter: 'prologue',
  phase: 'festival',
  where: null,
  life: freshLife(),
  flags: {},
  affinity: {},
  startedAt: Date.now(),
});

const MIGRATIONS = {
  // v1: { loads, erased:[{id, atLoad}], run:{ label, index, affinity, flags } } (비주얼노벨 시절)
  1: (s) => ({
    version: 2,
    world: { loads: s.loads ?? 0, erased: (s.erased ?? []).map((e) => ({ ...e, at: null })) },
    run: s.run ? { ...freshRun(), affinity: s.run.affinity ?? {} } : null,
    meta: { createdAt: Date.now(), updatedAt: Date.now(), playerId: null },
  }),
  // v2 → v3: 마을 밖 위치(where) 추가. 기존 진행은 마을 안에 있던 것으로
  2: (s) => ({ ...s, version: 3, run: s.run ? { ...s.run, where: null } : null }),
  // v3 → v4: 생활(몸·마음) 추가. 기존 진행은 보통 체형에서 시작
  3: (s) => ({ ...s, version: 4, run: s.run ? { ...s.run, life: freshLife() } : null }),
};

export function migrate(raw) {
  if (!raw) return freshSave();
  let s = raw;
  let v = s.version ?? 1;
  while (v < VERSION) {
    const step = MIGRATIONS[v];
    if (!step) return freshSave();
    s = step(s);
    v = s.version;
  }
  return s;
}
