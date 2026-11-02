// 전체 세계 지도. 칸 하나 = 맵(구역) 하나 (지금의 마을 맵 크기, 48×34 타일 정도).
// 마을과 마을 사이는 맵 다섯 개쯤 걸어서 이동한다 (포켓몬의 도로처럼, 구역마다 작은 사건·지형지물이 하나씩).
// 북쪽으로 갈수록 춥다. 맨 위는 해가 들지 않는 겨울 — 페르의 노래 속 '북쪽 끝 검은 성'.
//
// 이야기상 처음엔 마을 밖이 '흐릿한 가장자리'다(루: "옆 마을 이름은?"). 장이 진행될 때마다
// 길이 하나씩 '불러와진다'. 마을 이름도 직접 가보기 전까지는 아무도 말하지 못한다(name은 작업용 가칭).

export const W = 11;
export const H = 15;

// 거점(마을·성). at: [x, y], y가 작을수록 북쪽
export const HUBS = {
  home:   { at: [5, 10], name: '수확제 마을', kind: 'village', note: '시작 마을. 프롤로그·1장' },
  frost:  { at: [4, 5],  name: '서리 마을',   kind: 'village', note: '눈 덮인 산기슭. 겨울이 끝나지 않는 곳' },
  forest: { at: [1, 11], name: '숲속 마을',   kind: 'village', note: '깊은 숲. 나무를 너무 베면 엘프를 만날 수 없다' },
  ruins:  { at: [9, 9],  name: '빈 마을',     kind: 'ruins',   note: '사람이 전부 지워진 마을. 집과 이름만 남았다' },
  harbor: { at: [6, 14], name: '항구',         kind: 'village', note: '바다 너머는 지도에 없다' },
  castle: { at: [5, 1],  name: '검은 성',     kind: 'castle',  note: '해가 들지 않는 북쪽 끝. 이야기 속 이야기의 마왕' },
};

// 길: 거점 사이를 잇는 구역들 (양 끝 거점 포함, 이웃한 칸끼리만 이어진다)
export const ROUTES = {
  'home-frost':    [[5, 10], [5, 9], [5, 8], [4, 8], [4, 7], [4, 6], [4, 5]],
  'home-forest':   [[5, 10], [4, 10], [3, 10], [2, 10], [2, 11], [1, 11]],
  'home-ruins':    [[5, 10], [6, 10], [7, 10], [7, 9], [8, 9], [9, 9]],
  'home-harbor':   [[5, 10], [5, 11], [5, 12], [6, 12], [6, 13], [6, 14]],
  'frost-castle':  [[4, 5], [4, 4], [5, 4], [5, 3], [5, 2], [5, 1]],
  // 숲에서 서리 마을로 바로 가는 옛길 (얼어붙은 숲, 지름길이지만 춥다)
  'forest-frost':  [[1, 11], [1, 10], [1, 9], [1, 8], [2, 8], [2, 7], [2, 6], [3, 6], [3, 5], [4, 5]],
};

// 길 밖의 막다른 구역 (곁가지). 숨은 이벤트·재료·숨은 스킬 자리
export const SIDES = {
  elfGlade:   { at: [0, 9],  from: [1, 9],  note: '엘프의 빈터 (숲을 지나치게 베면 사라진다)' },
  lake:       { at: [3, 8],  from: [4, 8],  note: '얼기 시작한 호수' },
  watchtower: { at: [8, 10], from: [7, 10], note: '버려진 망루' },
  shipwreck:  { at: [7, 13], from: [6, 13], note: '난파선' },
  bellCliff:  { at: [6, 3],  from: [5, 3],  note: '종이 걸린 절벽. 성 쪽에서 종소리가 들린다' },
};

// ── 기후 ────────────────────────────────────────
// 위도(y)가 기본, 경도(x)로 숲·건조지가 갈리고, 실제 계절이 눈 경계를 조금 밀고 당긴다.
export const BIOMES = {
  blackSnow:  { name: '해 없는 설원', temp: 0, falling: 'snow', floor: 'snow', dark: true },
  snow:       { name: '설원',         temp: 1, falling: 'snow', floor: 'snow' },
  frost:      { name: '서리 숲',      temp: 2, falling: 'snow', floor: 'snowGrass' },
  lateAutumn: { name: '늦가을 들판',  temp: 3, falling: 'leaf', floor: 'dryGrass' },
  deepForest: { name: '깊은 숲',      temp: 4, falling: 'leaf', floor: 'darkGrass' },
  dry:        { name: '마른 땅',      temp: 4, falling: null,   floor: 'sand' },
  temperate:  { name: '들판',         temp: 4, falling: null,   floor: 'grass' },
  coast:      { name: '바닷가',       temp: 5, falling: null,   floor: 'beach' },
};

// 계절이 눈 경계를 미는 정도(칸): 겨울엔 남쪽으로 내려오고, 여름엔 북쪽으로 물러난다
const SEASON_SHIFT = { winter: 2, autumn: 1, spring: 0, summer: -1 };

export function biomeAt(x, y, season = 'autumn') {
  if (y <= 1) return 'blackSnow';                   // 성 주변은 계절과 상관없이
  const yy = y - (SEASON_SHIFT[season] ?? 0);       // 겨울엔 '더 북쪽처럼'
  if (yy <= 4) return 'snow';
  if (yy <= 6) return 'frost';
  if (y >= 13) return 'coast';
  if (yy <= 7) return 'lateAutumn';
  if (x <= 2) return 'deepForest';
  if (x >= 8) return 'dry';
  return 'temperate';
}

// ── 그래프 도우미 (테스트·지도 그리기·나중의 맵 이동에 쓴다) ──
const key = ([x, y]) => `${x},${y}`;

export function cells() {
  const m = new Map();
  for (const [id, h] of Object.entries(HUBS)) m.set(key(h.at), { kind: 'hub', id, at: h.at });
  for (const [id, path] of Object.entries(ROUTES)) for (const c of path) if (!m.has(key(c))) m.set(key(c), { kind: 'route', id, at: c });
  for (const [id, s] of Object.entries(SIDES)) m.set(key(s.at), { kind: 'side', id, at: s.at });
  return m;
}

// 이웃 구역 (길로 이어진 것만)
export function links() {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(key(a))) adj.set(key(a), new Set());
    if (!adj.has(key(b))) adj.set(key(b), new Set());
    adj.get(key(a)).add(key(b)); adj.get(key(b)).add(key(a));
  };
  for (const path of Object.values(ROUTES)) for (let i = 1; i < path.length; i += 1) add(path[i - 1], path[i]);
  for (const s of Object.values(SIDES)) add(s.from, s.at);
  return adj;
}

// 거점 a에서 b까지 걸어서 지나는 맵 이동 횟수 (최단)
export function travelSteps(a, b) {
  const adj = links();
  const start = key(HUBS[a].at), goal = key(HUBS[b].at);
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (c === goal) return dist.get(c);
    for (const n of adj.get(c) ?? []) if (!dist.has(n)) { dist.set(n, dist.get(c) + 1); q.push(n); }
  }
  return Infinity;
}
