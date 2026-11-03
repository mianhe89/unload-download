// 마주침 규칙 (순수 함수 — 테스트 가능)
import { ENCOUNTER_CHANCE, POOLS, BOSSES } from '../../content/battles/encounters.js';

const hash = (s) => { let h = 2166136261; for (const ch of s) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
export const dayOf = (date) => `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;

// 이 칸에 오늘 있는 무리: { enemies, boss, seed, party?, flag? } | null. beaten(키) → 오늘 이미 이겼는가
// ok(when) → 보스의 등장 조건(대본 조건 문법)이 맞는가. 안 맞으면 그 칸은 보통 길이다
export function encounterAt(key, { kind, biome }, date = new Date(), beaten = () => false, ok = () => true) {
  const boss = BOSSES[key];
  if (boss && (!boss.when || ok(boss.when))) {
    return beaten(`boss.${key}`) ? null : { enemies: boss.enemies, boss: true, note: boss.note, party: boss.party, flag: boss.flag, seed: Math.floor(hash(key) * 1e9) };
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
