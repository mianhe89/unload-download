// 가방 규칙(순수): 넣기·꺼내기, 보이는 목록, 선물 결과. 가방 자체는 세이브 run.bag { items: { id: n }, gifted: { 인물: 날짜 } }.
// 재료(목재·돌)는 행동 파밍(run.farm.items)에 있는 걸 그대로 보여 준다.
import { ITEMS, GIFT_LINES, GIFT_AGAIN } from '../../content/items.js';

export const MAX_STACK = 9;
export const freshBag = () => ({ items: {}, gifted: {} });

export function addItem(bag, id, n = 1) {
  const b = structuredClone(bag ?? freshBag());
  b.items[id] = Math.min(MAX_STACK, (b.items[id] ?? 0) + n);
  return b;
}

export function takeItem(bag, id) {
  const b = structuredClone(bag ?? freshBag());
  if (!b.items[id]) return null;
  b.items[id] -= 1;
  if (!b.items[id]) delete b.items[id];
  return b;
}

// 가방에 보이는 목록: [{ id, def, count }] — 먹을 것, 재료, 소중한 것 순
export function listBag(bag, { farmItems = {}, flags = {} } = {}) {
  const out = [];
  for (const [id, def] of Object.entries(ITEMS)) {
    const count = def.kind === 'key' ? (flags[def.has] ? 1 : 0) : def.farm ? farmItems[id] ?? 0 : bag?.items?.[id] ?? 0;
    if (count > 0) out.push({ id, def, count });
  }
  const order = { food: 0, material: 1, key: 2 };
  return out.sort((a, b) => order[a.def.kind] - order[b.def.kind]);
}

// 선물: 그 사람이 오늘 이미 받았으면 again. 아니면 반가움(liking)과 말(line), 호감도 변화(aff)
export function giftResult(bag, id, who, day) {
  const def = ITEMS[id];
  if (!def || def.kind !== 'food') return { ok: false };
  if (bag?.gifted?.[who] === day) return { ok: false, again: true, line: GIFT_AGAIN };
  const liking = def.likes?.[who] ?? def.base ?? 0;
  const line = def.lines?.[who] ?? GIFT_LINES[liking];
  return { ok: true, liking, line, aff: [0, 1, 2, 4][liking + 1] ?? 1 };
}

export function markGifted(bag, who, day) {
  const b = structuredClone(bag ?? freshBag());
  b.gifted[who] = day;
  return b;
}
