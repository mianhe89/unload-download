// 행동 파밍 규칙 (순수 함수 — 테스트 가능)
import { HIDDEN_SKILLS, YIELD, ELF_FOREST_LIMIT, FARM_TARGETS } from '../../content/farm/farm.js';

export const freshFarm = () => ({ counts: {}, items: {}, skills: [], felled: {}, forestChops: 0 });

export const actionFor = (objectType) => Object.entries(FARM_TARGETS).find(([, list]) => list.includes(objectType))?.[0] ?? null;

// 행동 한 번: 횟수·아이템을 올리고, 열린 히든 스킬이 있으면 알려준다. rng는 0~1
// where: { key: 칸, at: 'x,y' (베어낸 자리), forest: 깊은 숲인가 }
export function doFarm(farm, action, rng = Math.random, where = null) {
  const n = structuredClone(farm);
  n.counts[action] = (n.counts[action] ?? 0) + 1;
  const item = YIELD[action];
  if (item) n.items[item] = (n.items[item] ?? 0) + 1;
  if (action === 'chop' && where) {
    (n.felled[where.key] ??= []).push(where.at);
    if (where.forest) n.forestChops += 1;
  }
  const unlocked = tryUnlock(n, action, rng);
  return { farm: n, unlocked };
}

// 횟수로만 정해지는 행동(잠·걷기)은 횟수를 직접 넘긴다
export function countAction(farm, action, amount = 1, rng = Math.random) {
  const n = structuredClone(farm);
  n.counts[action] = (n.counts[action] ?? 0) + amount;
  return { farm: n, unlocked: tryUnlock(n, action, rng) };
}

function tryUnlock(n, action, rng) {
  for (const [id, s] of Object.entries(HIDDEN_SKILLS)) {
    if (s.from !== action || n.skills.includes(id)) continue;
    if ((n.counts[action] ?? 0) >= s.min && rng() < s.p) { n.skills.push(id); return id; }
  }
  return null;
}

// 히든 스킬 → 주인공 능력치 보정
export function applySkills(stats, skills = []) {
  const s = { ...stats };
  for (const id of skills) {
    const e = HIDDEN_SKILLS[id]?.effect ?? {};
    if (e.atk) s.atk = Math.round(s.atk * e.atk);
    if (e.def) s.def = Math.round(s.def * e.def);
    if (e.spd) s.spd += e.spd;
    if (e.heavy) s.heavy = (s.heavy ?? 1) * e.heavy;
  }
  return s;
}

// 엘프 마을: 깊은 숲을 너무 베면 보이지 않는다 / 한 그루도 안 벤 사람만 엘프를 만난다
export const elfVillageGone = (farm) => (farm?.forestChops ?? 0) >= ELF_FOREST_LIMIT;
export const meetsElf = (farm) => (farm?.forestChops ?? 0) === 0;
