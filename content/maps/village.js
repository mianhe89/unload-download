// 마을 맵 (68×34칸, 1칸 = 16px). 동쪽 20칸은 울타리 너머 들판(밀밭·논·채소밭·농가)
// - terrain: 바닥. 'g' 풀, 'd' 흙(길·광장). 흙의 경계는 자동 타일로 이어 그린다
// - objects: 건물·나무·소품. 종류는 content/art/pack.js의 OBJECTS. at = 그림 왼쪽 위 칸
// - 충돌은 각 그림의 foot 사각형(px)으로 정한다. 맵 가장자리(안개)는 걸어서 나갈 수 없다
// 장소(spots)와 구역(zones)은 대본·이벤트가 이름으로 부른다. 좌표를 바꾸면 npm run check로 확인할 것
import { OBJECTS } from '../art/pack.js';

export const id = 'village';
export const name = '우리 마을';
export const TILE = 16;
export const W = 68;
export const H = 34;
export const FOG = 3; // 바깥 3칸은 흐릿한 가장자리

// ── 바닥 ───────────────────────────────────────────────
function buildTerrain() {
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  const dirt = (x, y, w, h) => { for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) if (g[j]?.[i] !== undefined) g[j][i] = 'd'; };
  dirt(17, 13, 14, 9);   // 수확제 광장
  dirt(5, 17, 38, 2);    // 동서 큰길
  dirt(23, 10, 2, 3);    // 종탑 앞길
  dirt(22, 10, 4, 2);    // 종탑 앞마당
  dirt(14, 15, 3, 2);    // 빵집 앞
  dirt(8, 19, 2, 7);     // 큰길 → 우물
  dirt(7, 26, 5, 3);     // 우물가
  dirt(18, 19, 2, 9);    // 큰길 → 집
  dirt(14, 27, 6, 2);    // 집 앞
  dirt(34, 15, 5, 2);    // 대장간 앞
  dirt(36, 19, 2, 8);    // 큰길 → 초소
  dirt(34, 27, 5, 2);    // 초소 앞
  dirt(34, 0, 2, 13);    // 북쪽 길 (1장부터 열린다)
  dirt(33, 12, 2, 4);    // 북쪽 길 → 대장간 앞
  // 동쪽 들판: 수확제의 곡식이 나는 땅
  dirt(43, 17, 20, 2);   // 큰길이 울타리 문을 지나 들판까지
  dirt(47, 5, 11, 8);    // 밀밭
  dirt(58, 5, 1, 13);    // 논두렁 길
  dirt(59, 5, 5, 9);     // 논
  dirt(47, 21, 9, 7);    // 채소밭
  dirt(56, 19, 2, 6);    // 큰길 → 농가
  return g.map((r) => r.join(''));
}

export const terrain = buildTerrain();

// ── 건물·나무·소품 ──────────────────────────────────────
const O = (type, x, y, extra = {}) => ({ type, at: [x, y], ...extra });

export const objects = [
  // 건물 (owner: 지워지면 바뀌는 집의 주인, residents: 그 집에 사는 사람 — 하루 일과의 home이 이 집 문으로 들어간다)
  O('belltower', 22, 3, { name: '종탑' }),
  O('bakery', 14, 12, { owner: 'hort', name: '호르트네 빵집', nameGone: '빈 가게', residents: ['hort'] }),
  O('house_stone', 35, 12, { name: '에다의 대장간', nameGone: '빈 대장간', residents: ['eda'] }),
  O('forge', 38, 11),
  O('house_tall', 34, 23, { owner: 'selena', name: '기사단 초소', residents: ['tom', 'selena', 'leon'] }),
  O('house_orange', 14, 24, { name: '우리 집', residents: ['me'] }),
  O('house_plain', 12, 4, { name: '페르의 하숙방', nameGone: '빈 하숙방', residents: ['per'] }),
  O('house_red', 29, 4, { name: '리네의 꽃집', nameGone: '빈 꽃가게', residents: ['rine'] }),
  O('house_wood', 27, 24, { name: '미아네 집', residents: ['mia'] }),
  O('shop', 4, 11, { name: '잡화점' }),
  // 가게 앞 진열 (팩 TilesetHouse): 빵집 앞 빵 상자, 꽃집 앞 화분
  O('crate_bread', 13, 16), O('crate_loaves', 17, 16),
  O('plant_pot', 28, 8),

  // 광장과 생활 소품
  O('cart', 10, 13),
  O('barrel', 17, 13), O('barrel', 13, 15), O('pot', 31, 16),
  O('crate', 40, 16), O('crate', 41, 16),
  O('bench', 26, 22),
  O('well', 8, 27),
  O('clothesline', 21, 24),
  O('haystack', 9, 22), O('haystack', 10, 22), O('scarecrow', 12, 22),

  // 꽃밭 (리네)
  O('sunflower', 26, 11), O('flower_red', 27, 10), O('sunflower', 29, 11), O('flower_red', 30, 10), O('sunflower', 31, 11),

  // 동쪽 들판: 울타리(문은 큰길 자리), 다 벤 밀밭의 건초 더미와 허수아비, 채소밭 상자, 농가
  O('house_wood', 57, 21, { name: '오토네 농가', residents: ['farmer'] }),
  O('haystack', 53, 6), O('haystack', 55, 6), O('haystack', 54, 9), O('haystack', 56, 10), O('haystack', 53, 11),
  O('scarecrow', 49, 12), O('cart', 52, 13),
  O('crate_radish', 47, 28), O('basket_greens', 49, 28), O('crate_radish', 56, 26),

  // 마을 안 나무
  O('tree_big', 6, 6), O('tree_big', 39, 6), O('tree_big_autumn', 4, 21),
  O('tree_round', 33, 19), O('tree_round2', 20, 8), O('tree_round', 9, 8),
  O('tree_big_autumn', 40, 20), O('tree_round2', 24, 27), O('tree_big', 30, 27),
  O('bush', 12, 16), O('bush2', 31, 13), O('bush', 33, 16), O('bush2', 21, 22), O('stump', 41, 24),
];

// 마을을 두르는 숲
const ring = [];
for (let x = 2; x < W - 4; x += 4) {
  if (x !== 34) ring.push(O(x % 8 ? 'tree_grove' : 'tree_grove2', x, 2)); // 34: 북쪽 길 자리
  ring.push(O(x % 8 ? 'tree_grove2' : 'tree_pines', x, H - 6));
}
for (let y = 5; y < H - 6; y += 3) {
  ring.push(O(y % 2 ? 'tree_pines' : 'tree_grove', 0, y));
  ring.push(O(y % 2 ? 'tree_grove' : 'tree_pines', W - 4, y));
}
objects.push(...ring);
// 밭 가장자리의 낮은 나무 난간 (큰길 쪽). 드나드는 틈을 하나씩 둔다
for (let x = 47; x < 64; x += 1) if (x !== 49 && x !== 58) objects.push(O('fence_h', x, 15));   // 밀밭·논 아래
for (let x = 47; x < 56; x += 1) if (x !== 51) objects.push(O('fence_h', x, 20));               // 채소밭 위

// 밭 바닥 (그림은 field/MapRenderer가 흙 위에 얹는다. 밟고 지나갈 수 있다)
//   wheat: 아직 안 벤 밀 · stubble: 벤 자리의 그루터기 · paddy: 물 뺀 논(그루터기 + 두렁) · veg: 배추·무 고랑
export const crops = [
  { kind: 'wheat', x: 47, y: 5, w: 4, h: 8 },     // 수확제 다음 날 마저 벨 마지막 이랑
  { kind: 'stubble', x: 51, y: 5, w: 7, h: 8 },
  { kind: 'paddy', x: 59, y: 5, w: 5, h: 9 },
  { kind: 'veg', x: 47, y: 21, w: 9, h: 7 },
];

// 움직이는 장식 (지나갈 수 있음)
// 줄등: 광장 둘레의 깃대 사이와 모닥불 쪽으로 (축제 날에만, field/systems/Garlands)
export const garlands = [[18, 13, 22, 13], [22, 13, 26, 13], [26, 13, 30, 13], [18, 13, 24, 17], [30, 13, 24, 17], [18, 21, 30, 21]];

// 축제 깃발(festive): 축제 날에만 걸린다 (수확제 전날·수확제·첫눈 축제)
export const animated = [
  { type: 'flag_red', at: [18, 13], festive: true }, { type: 'flag_yellow', at: [22, 13], festive: true },
  { type: 'flag_blue', at: [26, 13], festive: true }, { type: 'flag_red', at: [30, 13], festive: true },
];

// ── 충돌 ───────────────────────────────────────────────
export const solids = objects
  .filter((o) => OBJECTS[o.type]?.foot)
  .map((o) => {
    const [fx, fy, fw, fh] = OBJECTS[o.type].foot;
    return { x: o.at[0] * TILE + fx, y: o.at[1] * TILE + fy, w: fw, h: fh, type: o.type };
  });

// 마을 밖으로 나가는 출구. 장(페이즈)이 exits로 열어줄 때만 지나갈 수 있다 (그 전엔 안개)
// to: 전체 지도의 칸 (content/world/world.js), [from, to2): 출구 칸 범위
export const exits = [
  { dir: 'n', from: 33, to2: 36, to: 'surface:7,10', at: [7, 10] },
];
export const entry = (dir) => ({ n: [34, FOG + 1] })[dir];

// 건물 문: 문 앞 칸에서 위로 몸을 들이밀면 그 방(content/maps)으로 들어간다
export const doors = [{ at: [16, 27], room: 'myhome' }];

const EDGE = FOG + 1;
const inGap = (tx, ty, open) => exits.some((e) => open.includes(e.dir) && e.dir === 'n' && ty < EDGE && tx >= e.from && tx < e.to2);
export function isSolidPx(px, py, open = []) {
  if (px < 0 || py < 0 || px >= W * TILE || py >= H * TILE) return true;
  if ((px < EDGE * TILE || py < EDGE * TILE || px >= (W - EDGE) * TILE || py >= (H - EDGE) * TILE) && !inGap(Math.floor(px / TILE), Math.floor(py / TILE), open)) return true;
  return solids.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
}

// 칸 단위 판정(검증용): 칸 가운데가 막혀 있으면 막힌 칸
export const isSolidTile = (tx, ty) => isSolidPx(tx * TILE + TILE / 2, ty * TILE + TILE / 2);

// ── 이름 붙은 장소 (칸 좌표) ─────────────────────────────
export const spots = {
  plaza: { x: 24, y: 20 },
  fire: { x: 24, y: 17 },
  bakeryStall: { x: 16, y: 16 },
  fireside: { x: 21, y: 19 },  // 모닥불 곁 (페르가 노래하는 자리)
  flowerBed: { x: 28, y: 12 },
  smithyDoor: { x: 36, y: 15 },
  anvil: { x: 39, y: 16 },
  towerDoor: { x: 23.5, y: 10 },
  post: { x: 36, y: 27 },
  well: { x: 10, y: 28 },
  playerHome: { x: 16, y: 28 },
  wheatField: { x: 50, y: 9 },
  paddy: { x: 58, y: 9 },
  vegPatch: { x: 51, y: 19 },
  farmGate: { x: 45, y: 17 },
};

// 이벤트 구역 (칸 좌표 사각형)
export const zones = {
  smithy: { x: 34, y: 15, w: 5, h: 3 },
  tower: { x: 22, y: 10, w: 4, h: 2 },
  post: { x: 34, y: 27, w: 5, h: 3 },
  well: { x: 6, y: 25, w: 6, h: 5 },
  fields: { x: 46, y: 4, w: 18, h: 25 },
};

// 모닥불 (2×2칸, 막힘). 그림은 field/Landmarks가 올린다
export const bonfire = { x: 23, y: 16, w: 2, h: 2 };
solids.push({ x: bonfire.x * TILE + 2, y: bonfire.y * TILE + 8, w: bonfire.w * TILE - 4, h: bonfire.h * TILE - 8, type: 'bonfire' });
