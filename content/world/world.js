// 전체 세계 지도. 칸 하나 = 맵(구역) 하나 (지금의 마을 맵 크기, 48×34 타일 정도).
// 마을과 마을 사이는 맵 다섯 개쯤 걸어서 이동한다 (포켓몬의 도로처럼, 구역마다 작은 사건·지형지물이 하나씩).
//
// 층(layer)
//   surface  지상. 북쪽으로 갈수록 춥고 맨 위는 해가 들지 않는 겨울(검은 성). 남쪽 끝은 바다
//   under    지하. 드워프 마을의 갱도와 고대 유적의 계단으로 내려간다. 깊은 곳은 용암
//   sky      은하 (히든). 지도에 없고 걸어서는 못 간다. 정해진 순간에만 열린다
//
// 이야기상 처음엔 마을 밖이 '흐릿한 가장자리'다(루: "옆 마을 이름은?"). 장이 진행될 때마다
// 길이 하나씩 '불러와진다'. 마을 이름도 직접 가보기 전까지는 아무도 말하지 못한다(name은 작업용 가칭).

export const LAYERS = {
  surface: { name: '지상', W: 15, H: 20 },
  under: { name: '지하', W: 9, H: 7 },
  sky: { name: '은하', W: 5, H: 3, hidden: true },
};
// 예전 코드 호환: 지상 크기
export const W = LAYERS.surface.W;
export const H = LAYERS.surface.H;

// 거점: 마을·성·유적. at: [x, y] (y가 작을수록 북쪽), layer 기본 surface
export const HUBS = {
  home:      { at: [7, 11], name: '수확제 마을', kind: 'village', note: '시작 마을. 프롤로그·1장' },
  frost:     { at: [7, 6],  name: '서리 마을',   kind: 'village', note: '겨울이 끝나지 않는 산기슭', field: 'frost' },
  mill:      { at: [9, 8],  name: '물레방아 마을', kind: 'village', note: '소집 가는 길의 첫 마을. 지친 사람들이 빗자루 든 그림자를 섬긴다', field: 'mill' },
  lordtown:  { at: [13, 7], name: '영주의 성 아랫마을', kind: 'village', note: '우리 영지의 영주가 사는 성. 초상화 자리가 비어 있다', field: 'lordtown' },
  ledger:    { at: [14, 4], name: '기록하는 마을', kind: 'village', note: '잊지 않으려고 모두가 매일 서로의 이름을 적는 마을', field: 'ledger' },
  icecastle: { at: [5, 4],  name: '얼음성',     kind: 'village', note: '성째로 얼어붙은 성. 그 안에서는 아무것도 늙지도, 사라지지도 않는다', field: 'icecastle' },
  neighbor:  { at: [4, 9],  name: '옆 마을',     kind: 'village', note: '같은 영주의 땅. 무녀가 가이아의 사당을 지킨다', field: 'neighbor' },
  castle:    { at: [8, 1],  name: '검은 성',     kind: 'castle',  note: '해가 들지 않는 북쪽 끝. 이야기 속 이야기의 마왕' },
  elf:       { at: [2, 12], name: '엘프 마을',   kind: 'elf',     note: '깊은 숲 속. 숲을 지나치게 베면 마을이 보이지 않게 된다', field: 'elf' },
  dwarf:     { at: [11, 5], name: '드워프 마을', kind: 'dwarf',   note: '산을 파고 사는 마을. 갱도가 지하로 이어진다', field: 'dwarf' },
  empty:     { at: [11, 10], name: '빈 마을',    kind: 'empty',   note: '사람이 전부 지워진 마을. 집과 이름만 남았다', field: 'ruin' },
  ancient:   { at: [14, 13], name: '고대 유적',  kind: 'ancient', note: '사막에 묻힌 석상들. 이 세계보다 오래된 글자가 새겨져 있다' },
  volcano:   { at: [13, 2],  name: '불의 산',    kind: 'volcano', note: '북쪽인데도 땅이 뜨겁다. 드워프의 대장간 불씨가 여기서 온다' },
  harbor:    { at: [8, 15],  name: '항구',        kind: 'village', note: '배를 타면 바다로 나갈 수 있다', field: 'harbor' },
  seaRuins:  { at: [10, 18], name: '바다 유적',  kind: 'seaRuins', note: '물에 잠긴 고대 도시. 썰물 때만 지붕이 보인다' },
  mineGate:  { layer: 'under', at: [4, 0], name: '갱도 입구',     kind: 'mine',  note: '드워프 마을 바로 아래' },
  lavaDepths:{ layer: 'under', at: [2, 5], name: '용암 지대',     kind: 'lava',  note: '지하 가장 깊은 곳. 땅속 불의 강' },
  undercroft:{ layer: 'under', at: [8, 6], name: '유적 아래 회랑', kind: 'ancient', note: '고대 유적의 지하. 갱도와 이어진다' },
  skyShore:  { layer: 'sky', at: [0, 1], name: '별의 물가',       kind: 'galaxyGate', note: '절벽에서 발을 디디면 닿는 곳. 발밑이 보라색 물이다' },
  galaxy:    { layer: 'sky', at: [3, 1], name: '은하',            kind: 'galaxy', note: '세계 바깥. 별 사이로 화면 밖이 비친다' },
};

// 길: 거점 사이를 잇는 구역들 (양 끝 거점 포함, 이웃한 칸끼리만). layer 기본 surface
// by: 'boat' 배로만 가는 바닷길
export const ROUTES = {
  'home-frost':     { path: [[7, 11], [7, 10], [7, 9], [7, 8], [7, 7], [7, 6]] },
  // 옆 마을: 서리 마을 가는 길에서 서쪽으로 갈라진다. 2장 전까지는 안개 너머다
  // 2부 소집 길: 우리 마을 → 물레방아 마을 → 영주의 성
  'home-mill':      { path: [[7, 11], [7, 10], [7, 9], [7, 8], [8, 8], [9, 8]] },
  'mill-lordtown':  { path: [[9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [13, 7]] },
  'lordtown-ledger': { path: [[13, 7], [13, 6], [14, 6], [14, 5], [14, 4]] },
  'ledger-dwarf':   { path: [[14, 4], [13, 4], [12, 4], [11, 4], [11, 5]] },
  'frost-icecastle': { path: [[7, 6], [7, 5], [6, 5], [6, 4], [5, 4]] },
  'home-neighbor':  { path: [[7, 11], [7, 10], [6, 10], [5, 10], [5, 9], [4, 9]] },
  'frost-castle':   { path: [[7, 6], [7, 5], [8, 5], [8, 4], [8, 3], [8, 2], [8, 1]] },
  'home-elf':       { path: [[7, 11], [6, 11], [5, 11], [4, 11], [4, 12], [3, 12], [2, 12]] },
  'home-empty':     { path: [[7, 11], [8, 11], [9, 11], [9, 10], [10, 10], [11, 10]] },
  'empty-ancient':  { path: [[11, 10], [12, 10], [12, 11], [13, 11], [13, 12], [14, 12], [14, 13]] },
  'empty-dwarf':    { path: [[11, 10], [11, 9], [11, 8], [11, 7], [11, 6], [11, 5]] },
  'frost-dwarf':    { path: [[7, 6], [8, 6], [9, 6], [10, 6], [10, 5], [11, 5]] },
  'dwarf-volcano':  { path: [[11, 5], [12, 5], [12, 4], [12, 3], [13, 3], [13, 2]] },
  'home-harbor':    { path: [[7, 11], [7, 12], [7, 13], [8, 13], [8, 14], [8, 15]] },
  'harbor-seaRuins': { by: 'boat', path: [[8, 15], [8, 16], [9, 16], [9, 17], [10, 17], [10, 18]] },
  // 엘프 마을에서 서리 마을로 바로 가는 옛길 (얼어붙은 숲, 길고 춥다)
  'elf-frost':      { path: [[2, 12], [2, 11], [2, 10], [2, 9], [3, 9], [3, 8], [4, 8], [4, 7], [5, 7], [5, 6], [6, 6], [7, 6]] },
  // 지하
  'mine-lava':      { layer: 'under', path: [[4, 0], [4, 1], [4, 2], [3, 2], [3, 3], [3, 4], [2, 4], [2, 5]] },
  'mine-undercroft': { layer: 'under', path: [[4, 0], [4, 1], [4, 2], [5, 2], [6, 2], [6, 3], [7, 3], [7, 4], [8, 4], [8, 5], [8, 6]] },
  // 은하
  'shore-galaxy':   { layer: 'sky', path: [[0, 1], [1, 1], [2, 1], [3, 1]] },
};

// 길 밖의 막다른 구역 (곁가지). 숨은 이벤트·재료·숨은 스킬 자리
export const SIDES = {
  worldTree:  { at: [1, 12], from: [2, 12], name: '세계수', note: '엘프 마을 뒤. 나무를 베어 얻는 숨은 스킬의 끝' },
  lake:       { at: [5, 8],  from: [4, 8],  name: '얼어붙은 호수', note: '얼음 아래로 무언가 지나간다' },
  watchtower: { at: [10, 11], from: [9, 11], name: '버려진 망루', note: '빈 마을 쪽을 지켜보던 자리' },
  shipwreck:  { at: [9, 15], from: [8, 15], name: '난파선', note: '바다 유적에서 떠밀려 온 배' },
  bellCliff:  { at: [9, 2],  from: [8, 2],  name: '종 걸린 절벽', note: '성 쪽에서 종소리가 들린다. 은하로 가는 문' },
  oasis:      { at: [13, 13], from: [13, 12], name: '오아시스', note: '유적 앞의 마지막 물' },
  deepSea:    { at: [11, 17], from: [10, 17], name: '깊은 바다', note: '바닥이 보이지 않는다' },
  forge:      { layer: 'under', at: [5, 0], from: [4, 0], name: '땅속 대장간', note: '드워프의 대장간. 용암의 열로 쇠를 녹인다' },
  starfall:   { layer: 'sky', at: [3, 0], from: [3, 1], name: '별이 떨어지는 곳', note: '떨어진 별 하나가 누군가의 이름처럼 빛난다' },
};

// 층과 층을 잇는 문
//   stairs: 걸어서 오르내린다, hidden: 조건이 맞을 때만 열린다 (unlock은 기획 메모)
export const PORTALS = [
  { a: { layer: 'surface', at: [11, 5] }, b: { layer: 'under', at: [4, 0] }, kind: 'stairs', note: '드워프 마을 ↔ 갱도 입구' },
  { a: { layer: 'surface', at: [14, 13] }, b: { layer: 'under', at: [8, 6] }, kind: 'stairs', note: '고대 유적 ↔ 유적 아래 회랑' },
  {
    a: { layer: 'surface', at: [9, 2] }, b: { layer: 'sky', at: [0, 1] }, kind: 'hidden',
    note: '종 걸린 절벽 ↔ 은하',
    unlock: '실제로 맑은 밤, 종 걸린 절벽에서 종을 열세 번 친다. 지워진 사람을 모두 기억하고 있어야 한다(빈자리 전부 찾음)',
  },
];

// ── 기후 ────────────────────────────────────────
// 지상은 위도(y)가 기본이다. 서쪽은 숲, 동쪽은 사막, 남쪽 끝은 바다.
// 불의 산 둘레만은 북쪽이어도 뜨겁다(예외). 실제 계절이 눈 경계를 조금 밀고 당긴다.
export const BIOMES = {
  blackSnow:  { name: '해 없는 설원', temp: 0, falling: 'snow', floor: 'snow', dark: true },
  snow:       { name: '설원',         temp: 1, falling: 'snow', floor: 'snow' },
  frost:      { name: '서리 숲',      temp: 2, falling: 'snow', floor: 'snowGrass' },
  lateAutumn: { name: '늦가을 들판',  temp: 3, falling: 'leaf', floor: 'dryGrass' },
  deepForest: { name: '깊은 숲',      temp: 4, falling: 'leaf', floor: 'darkGrass' },
  dry:        { name: '마른 땅',      temp: 4, falling: null,   floor: 'dirt' },
  desert:     { name: '사막',         temp: 5, falling: null,   floor: 'sand' },
  temperate:  { name: '들판',         temp: 4, falling: null,   floor: 'grass' },
  coast:      { name: '바닷가',       temp: 5, falling: null,   floor: 'beach' },
  sea:        { name: '바다',         temp: 5, falling: 'rain', floor: 'water' },
  volcano:    { name: '불의 산',      temp: 9, falling: 'ember', floor: 'lava', hot: true },
  // 지하
  cave:       { name: '갱도',         temp: 3, falling: null, floor: 'cave', dark: true },
  deepCave:   { name: '깊은 동굴',    temp: 4, falling: null, floor: 'cave', dark: true },
  lava:       { name: '용암 지대',    temp: 9, falling: 'ember', floor: 'lava', hot: true, dark: true },
  ancientHall:{ name: '고대 회랑',    temp: 3, falling: null, floor: 'sand', dark: true },
  // 은하
  galaxy:     { name: '은하',         temp: 0, falling: 'star', floor: 'void' },
};

// 계절이 눈 경계를 미는 정도(칸): 가을·겨울엔 남쪽으로 내려온다 (서리 마을은 여름에도 서리)
const SEASON_SHIFT = { winter: 2, autumn: 1, spring: 0, summer: 0 };
const VOLCANO = HUBS.volcano.at;

export function biomeAt(x, y, season = 'autumn', layer = 'surface') {
  if (layer === 'sky') return 'galaxy';
  if (layer === 'under') {
    if (Math.hypot(x - HUBS.lavaDepths.at[0], y - HUBS.lavaDepths.at[1]) <= 2) return 'lava';
    if (x >= 7) return 'ancientHall';
    return y <= 2 ? 'cave' : 'deepCave';
  }
  if (Math.hypot(x - VOLCANO[0], y - VOLCANO[1]) <= 2) return 'volcano';
  if (y <= 1) return 'blackSnow';                   // 성 주변은 계절과 상관없이
  if (y >= 16) return 'sea';
  const yy = y - (SEASON_SHIFT[season] ?? 0);       // 겨울엔 '더 북쪽처럼'
  if (yy <= 4) return 'snow';
  if (yy <= 6) return 'frost';
  if (y >= 14) return 'coast';
  if (yy <= 7) return 'lateAutumn';
  if (x <= 3) return 'deepForest';
  if (x >= 12) return 'desert';
  if (x >= 10) return 'dry';
  return 'temperate';
}

// ── 그래프 도우미 (테스트·지도 그리기·나중의 맵 이동에 쓴다) ──
// 칸 키: 'layer:x,y'
export const cellKey = (layer, [x, y]) => `${layer}:${x},${y}`;
const L = (o) => o.layer ?? 'surface';

export function cells() {
  const m = new Map();
  for (const [id, h] of Object.entries(HUBS)) m.set(cellKey(L(h), h.at), { kind: 'hub', id, layer: L(h), at: h.at });
  for (const [id, r] of Object.entries(ROUTES)) for (const c of r.path) {
    const k = cellKey(L(r), c);
    if (!m.has(k)) m.set(k, { kind: 'route', id, layer: L(r), at: c, by: r.by });
  }
  for (const [id, s] of Object.entries(SIDES)) m.set(cellKey(L(s), s.at), { kind: 'side', id, layer: L(s), at: s.at });
  return m;
}

// 이웃 구역. opts.hidden: 숨은 문까지 포함할지
export function links({ hidden = false } = {}) {
  const adj = new Map();
  const add = (a, b) => {
    if (!adj.has(a)) adj.set(a, new Set());
    if (!adj.has(b)) adj.set(b, new Set());
    adj.get(a).add(b); adj.get(b).add(a);
  };
  for (const r of Object.values(ROUTES)) for (let i = 1; i < r.path.length; i += 1) add(cellKey(L(r), r.path[i - 1]), cellKey(L(r), r.path[i]));
  for (const s of Object.values(SIDES)) add(cellKey(L(s), s.from), cellKey(L(s), s.at));
  for (const p of PORTALS) if (hidden || p.kind !== 'hidden') add(cellKey(p.a.layer, p.a.at), cellKey(p.b.layer, p.b.at));
  return adj;
}

// 거점 a에서 b까지 지나는 맵 이동 횟수 (최단). 층 사이 문도 한 번의 이동
export function travelSteps(a, b, opts) {
  const adj = links(opts);
  const start = cellKey(L(HUBS[a]), HUBS[a].at), goal = cellKey(L(HUBS[b]), HUBS[b].at);
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (c === goal) return dist.get(c);
    for (const n of adj.get(c) ?? []) if (!dist.has(n)) { dist.set(n, dist.get(c) + 1); q.push(n); }
  }
  return Infinity;
}
