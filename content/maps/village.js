// 마을 맵 (48×34칸, 1칸 = 16px)
// - terrain: 바닥. 'g' 풀, 'd' 흙(길·광장). 흙의 경계는 자동 타일로 이어 그린다
// - objects: 건물·나무·소품. 종류는 content/art/pack.js의 OBJECTS. at = 그림 왼쪽 위 칸
// - 충돌은 각 그림의 foot 사각형(px)으로 정한다. 맵 가장자리(안개)는 걸어서 나갈 수 없다
// 장소(spots)와 구역(zones)은 대본·이벤트가 이름으로 부른다. 좌표를 바꾸면 npm run check로 확인할 것
import { OBJECTS } from '../art/pack.js';

export const TILE = 16;
export const W = 48;
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
  return g.map((r) => r.join(''));
}

export const terrain = buildTerrain();

// ── 건물·나무·소품 ──────────────────────────────────────
const O = (type, x, y, extra = {}) => ({ type, at: [x, y], ...extra });

export const objects = [
  // 건물 (owner: 지워지면 바뀌는 집의 주인)
  O('belltower', 22, 5),
  O('bakery', 14, 12, { owner: 'hort' }),
  O('house_stone', 35, 12, { name: '에다의 대장간' }),
  O('forge', 38, 11),
  O('house_tall', 34, 23, { owner: 'tom', name: '기사단 초소' }),
  O('house_orange', 14, 24, { name: '우리 집' }),
  O('house_plain', 12, 4),
  O('house_red', 29, 4),
  O('house_wood', 27, 24),
  O('shop', 4, 11),

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

  // 마을 안 나무
  O('tree_big', 6, 6), O('tree_big', 39, 6), O('tree_big_autumn', 4, 21),
  O('tree_round', 33, 19), O('tree_round2', 20, 8), O('tree_round', 9, 8),
  O('tree_big_autumn', 40, 20), O('tree_round2', 24, 27), O('tree_big', 30, 27),
  O('bush', 12, 16), O('bush2', 31, 13), O('bush', 33, 16), O('bush2', 21, 22), O('stump', 41, 24),
];

// 마을을 두르는 숲
const ring = [];
for (let x = 2; x < W - 4; x += 4) {
  ring.push(O(x % 8 ? 'tree_grove' : 'tree_grove2', x, 2));
  ring.push(O(x % 8 ? 'tree_grove2' : 'tree_pines', x, H - 6));
}
for (let y = 5; y < H - 6; y += 3) {
  ring.push(O(y % 2 ? 'tree_pines' : 'tree_grove', 0, y));
  ring.push(O(y % 2 ? 'tree_grove' : 'tree_pines', W - 4, y));
}
objects.push(...ring);

// 움직이는 장식 (지나갈 수 있음)
export const animated = [
  { type: 'flag_red', at: [18, 13] }, { type: 'flag_yellow', at: [22, 13] },
  { type: 'flag_blue', at: [26, 13] }, { type: 'flag_red', at: [30, 13] },
];

// ── 충돌 ───────────────────────────────────────────────
export const solids = objects
  .filter((o) => OBJECTS[o.type]?.foot)
  .map((o) => {
    const [fx, fy, fw, fh] = OBJECTS[o.type].foot;
    return { x: o.at[0] * TILE + fx, y: o.at[1] * TILE + fy, w: fw, h: fh, type: o.type };
  });

const EDGE = FOG + 1;
export function isSolidPx(px, py) {
  if (px < EDGE * TILE || py < EDGE * TILE || px >= (W - EDGE) * TILE || py >= (H - EDGE) * TILE) return true;
  return solids.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
}

// 칸 단위 판정(검증용): 칸 가운데가 막혀 있으면 막힌 칸
export const isSolidTile = (tx, ty) => isSolidPx(tx * TILE + TILE / 2, ty * TILE + TILE / 2);

// ── 이름 붙은 장소 (칸 좌표) ─────────────────────────────
export const spots = {
  plaza: { x: 24, y: 20 },
  fire: { x: 24, y: 17 },
  bakeryStall: { x: 16, y: 16 },
  flowerBed: { x: 28, y: 12 },
  smithyDoor: { x: 36, y: 15 },
  anvil: { x: 39, y: 16 },
  towerDoor: { x: 23.5, y: 10 },
  post: { x: 36, y: 27 },
  well: { x: 10, y: 28 },
  playerHome: { x: 16, y: 28 },
};

// 이벤트 구역 (칸 좌표 사각형)
export const zones = {
  smithy: { x: 34, y: 15, w: 5, h: 3 },
  tower: { x: 22, y: 10, w: 4, h: 2 },
  post: { x: 34, y: 27, w: 5, h: 3 },
  well: { x: 6, y: 25, w: 6, h: 5 },
};

// 모닥불 (2×2칸, 막힘). 그림은 field/Landmarks가 올린다
export const bonfire = { x: 23, y: 16, w: 2, h: 2 };
solids.push({ x: bonfire.x * TILE + 2, y: bonfire.y * TILE + 8, w: bonfire.w * TILE - 4, h: bonfire.h * TILE - 8, type: 'bonfire' });
