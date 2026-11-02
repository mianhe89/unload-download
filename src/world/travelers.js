// 떠돌이 규칙 (순수 함수 — 테스트 가능)
import { TRAVELERS, SPIRIT_HINT } from '../../content/world/travelers.js';
import { SIDES, cells, links, cellKey } from '../../content/world/world.js';

const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
const dayOf = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

// 이 칸에 오늘 누가 있는가. 거점(마을)에는 없다. 바다엔 없다
export function travelerAt(key, { kind, biome }, date = new Date()) {
  if (kind === 'hub' || biome === 'sea') return null;
  let roll = hash(`${key}|${dayOf(date)}`);
  for (const [id, t] of Object.entries(TRAVELERS)) {
    if (t.biomes && !t.biomes.includes(biome)) continue;
    if (roll < t.chance) return id;
    roll -= t.chance;
    if (roll < 0) return null;
  }
  return null;
}

// 정신체의 힌트: 같은 층에서 걸어서 가장 가까운, 아직 안 간 곁가지 구역
export function spiritHint(layer, at, visited) {
  const adj = links();
  const start = cellKey(layer, at);
  const sides = new Set(Object.values(SIDES).filter((s) => (s.layer ?? 'surface') === layer).map((s) => cellKey(layer, s.at)));
  const dist = new Map([[start, 0]]);
  const q = [start];
  while (q.length) {
    const c = q.shift();
    if (c !== start && sides.has(c) && !visited(c)) {
      const [, xy] = c.split(':');
      const [tx, ty] = xy.split(',').map(Number);
      const dx = tx - at[0], dy = ty - at[1];
      const dir = Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? '동쪽' : '서쪽') : (dy > 0 ? '남쪽' : '북쪽');
      return { to: c, n: dist.get(c), text: SPIRIT_HINT.found.replace('{dir}', dir).replace('{n}', String(dist.get(c))) };
    }
    for (const n of adj.get(c) ?? []) if (!dist.has(n) && n.startsWith(`${layer}:`)) { dist.set(n, dist.get(c) + 1); q.push(n); }
  }
  return { to: null, n: 0, text: SPIRIT_HINT.none };
}

// 말할 줄 고르기 (조건 있는 줄은 조건이 맞을 때만)
export function travelerLines(id, { erasedAny }) {
  return TRAVELERS[id].lines.filter((l) => typeof l === 'string' || !l.ifErasedAny || erasedAny).map((l) => (typeof l === 'string' ? l : l.text));
}

void cells;
