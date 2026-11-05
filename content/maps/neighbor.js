// 옆 마을 (40×30칸). 우리 마을과 같은 영주의 땅이지만, 2장 전까지는 안개 너머라 이름조차 떠오르지 않던 곳.
// 무녀 세이가 호라의 사당을 지키고, 회장(옛 왕국의 시종)이 마을을 이끈다(docs/스토리.md '2장 · 안개 너머').
// 동쪽 길이 서리 마을 가는 길(전체 지도 surface:5,9)로 이어진다. 형식은 content/maps/village.js와 같다.
import { OBJECTS } from '../art/pack.js';

export const id = 'neighbor';
export const name = '옆 마을';
export const TILE = 16;
export const W = 40;
export const H = 30;
export const FOG = 3;

function buildTerrain() {
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  const dirt = (x, y, w, h) => { for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) if (g[j]?.[i] !== undefined) g[j][i] = 'd'; };
  dirt(13, 12, 13, 7);   // 광장
  dirt(25, 14, 15, 2);   // 동쪽 길 (마을 밖으로)
  dirt(18, 7, 3, 5);     // 사당 앞길
  dirt(16, 6, 7, 2);     // 사당 앞마당
  dirt(8, 14, 5, 2);     // 광장 → 회장 댁
  dirt(8, 19, 2, 4);     // 광장 → 아랫집들
  dirt(8, 22, 8, 2);
  dirt(27, 9, 2, 5);     // 광장 → 세이의 집
  return g.map((r) => r.join(''));
}

export const terrain = buildTerrain();

const O = (type, x, y, extra = {}) => ({ type, at: [x, y], ...extra });

export const objects = [
  // 사당: 붉은 지붕 집에 룬돌 두 개. 호라께 맡겨 둔 것들을 모시는 곳
  O('house_red', 17, 3, { name: '호라의 사당', residents: ['mirei'] }),
  O('runestone', 15, 6), O('runestone2', 22, 6),
  O('house_tall', 4, 10, { name: '회장 댁', residents: ['elder'] }),
  O('house_wood', 26, 6, { name: '세이의 집', residents: ['sei'] }),
  O('house_plain', 5, 23, { name: '물레방앗간 집' }),
  O('house_orange', 12, 23, { name: '빨래터 집' }),
  O('house_stone', 30, 20, { name: '빌마네 집', residents: ['wilma', 'tilo', 'egon'] }),

  // 광장 살림
  O('well', 20, 16),
  O('bench', 14, 18),
  O('cart', 23, 11), O('barrel', 13, 12), O('crate', 25, 12),
  O('haystack', 30, 17), O('haystack', 31, 17),
  O('signpost', 35, 13),

  // 마을 안 나무 (늦가을)
  O('tree_big_autumn', 9, 5), O('tree_big_autumn', 30, 3), O('tree_round', 24, 20),
  O('tree_round2', 11, 17), O('bush', 20, 22), O('bush2', 33, 10), O('stump', 26, 24),
];

// 마을을 두르는 숲. 동쪽 길(y 13~16) 자리는 비운다
const ring = [];
for (let x = 0; x < W - 3; x += 4) {
  ring.push(O(x % 8 ? 'tree_grove' : 'tree_pines', x, 0));
  ring.push(O(x % 8 ? 'tree_grove2' : 'tree_pines', x, H - 4));
}
for (let y = 3; y < H - 4; y += 3) {
  ring.push(O(y % 2 ? 'tree_pines' : 'tree_grove', 0, y));
  if (y < 11 || y > 16) ring.push(O(y % 2 ? 'tree_grove' : 'tree_pines', W - 4, y));
}
objects.push(...ring);

export const animated = [];

export const solids = objects
  .filter((o) => OBJECTS[o.type]?.foot)
  .map((o) => {
    const [fx, fy, fw, fh] = OBJECTS[o.type].foot;
    return { x: o.at[0] * TILE + fx, y: o.at[1] * TILE + fy, w: fw, h: fh, type: o.type };
  });

// 동쪽 길: 늘 열려 있다(여기 닿았다면 이미 안개를 지나온 것이다)
export const exits = [
  { dir: 'e', from: 14, to2: 16, to: 'surface:5,9', at: [5, 9] },
];
export const openExits = ['e'];
export const entry = (dir) => ({ e: [W - FOG - 2, 14] })[dir];

const EDGE = FOG + 1;
const inGap = (tx, ty, open) => exits.some((e) => open.includes(e.dir) && e.dir === 'e' && tx >= W - EDGE && ty >= e.from && ty < e.to2);
export function isSolidPx(px, py, open = []) {
  if (px < 0 || py < 0 || px >= W * TILE || py >= H * TILE) return true;
  if ((px < EDGE * TILE || py < EDGE * TILE || px >= (W - EDGE) * TILE || py >= (H - EDGE) * TILE) && !inGap(Math.floor(px / TILE), Math.floor(py / TILE), open)) return true;
  return solids.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
}
export const isSolidTile = (tx, ty) => isSolidPx(tx * TILE + TILE / 2, ty * TILE + TILE / 2);

export const spots = {
  plaza: { x: 19, y: 15 },
  shrine: { x: 19, y: 8 },       // 사당 앞
  shrineAltar: { x: 19, y: 7 },
  elderDoor: { x: 6, y: 15 },
  seiDoor: { x: 28, y: 10 },
  well: { x: 20, y: 18 },
  gate: { x: 34, y: 15 },        // 동쪽 어귀
};

export const zones = {
  shrine: { x: 15, y: 6, w: 9, h: 3 },
  gate: { x: 32, y: 13, w: 5, h: 4 },
};

export const bonfire = null;
