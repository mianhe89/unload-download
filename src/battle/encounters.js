// 마주침 규칙 (순수 함수 — 테스트 가능)
import { ENCOUNTER_CHANCE, POOLS, BOSSES, DROPS } from '../../content/battles/encounters.js';
import { dropBase } from '../../content/action/foes.js';
import { RELICS } from '../../content/action/relics.js';

const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
export const dayOf = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

// 이 칸에 오늘 있는 무리: { enemies, boss, seed, party?, flag? } | null. beaten(키) → 오늘 이미 이겼는가
// ok(when) → 보스의 등장 조건(대본 조건 문법)이 맞는가. 안 맞으면 그 칸은 보통 길이다
export function encounterAt(key, { kind, biome }, date = new Date(), beaten = () => false, ok = () => true) {
  const boss = BOSSES[key];
  if (boss && (!boss.when || ok(boss.when))) {
    return beaten(`boss.${key}`) ? null : { enemies: boss.enemies, boss: true, note: boss.note, flag: boss.flag, seed: Math.floor(hash(key) * 1e9) };
  }
  if (kind === 'hub' || biome === 'sea' || biome === 'galaxy') return null;
  const day = dayOf(date);
  if (beaten(`${key}.${day}`)) return null;
  const roll = hash(`mon|${key}|${day}`);
  const pool = POOLS[biome];
  if (!pool || roll >= ENCOUNTER_CHANCE) return null;
  return { enemies: pool[Math.floor((roll / ENCOUNTER_CHANCE) * pool.length)], boss: false, seed: Math.floor(roll * 1e9) };
}

// 이겼을 때 남기는 표시 (보스는 영구, 일반은 그날만)
export const beatKey = (key, boss, date = new Date()) => (boss ? `boss.${key}` : `${key}.${dayOf(date)}`);

// 이긴 뒤 떨어진 것 (같은 씨앗이면 같은 결과): [{ item, n, text }]
// owned(item) → 이미 가진 once 아이템이면 true (다시 떨구지 않는다)
export function rollDrops(enemies, seed = 1, owned = () => false) {
  const out = [];
  enemies.forEach((id, i) => {
    // 그 갈래만의 전리품(DROPS[id]) + 바탕 무리의 것(DROPS[base])
    const table = [...(dropBase(id) !== id ? DROPS[id] ?? [] : []), ...(DROPS[dropBase(id)] ?? [])];
    for (const d of table) {
      if (d.once && (owned(d.item) || out.some((o) => o.item === d.item))) continue;
      if (hash(`drop|${seed}|${i}|${d.item}`) < d.p) out.push({ item: d.item, n: d.n ?? 1, text: d.text });
    }
  });
  return out;
}

// 유물 고르기 (같은 씨앗이면 같은 것): chance를 넘기면 null. 흔할수록 잘 나온다(일반 5 · 고급 3 · 희귀 2 · 영웅 1)
//   boss: 보스가 주는 유물 중에서
const RELIC_WEIGHT = { common: 5, uncommon: 3, rare: 2, epic: 1, legendary: 0.5 };
export function pickRelic({ seed = 1, chance = 1, boss = false } = {}) {
  if (hash(`relic|${seed}`) >= chance) return null;
  const pool = Object.entries(RELICS).filter(([, r]) => r.where.includes(boss ? 'boss' : 'drop'));
  const total = pool.reduce((a, [, r]) => a + (RELIC_WEIGHT[r.rarity] ?? 1), 0);
  let x = hash(`relic.pick|${seed}`) * total;
  for (const [id, r] of pool) { x -= RELIC_WEIGHT[r.rarity] ?? 1; if (x < 0) return id; }
  return pool.at(-1)[0];
}
