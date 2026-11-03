// 다른 마을에 들르기: 길 맵에서 거점 칸(HUBS[id].field가 있는 곳)에 들어서면 그 마을의 이야기 필드로.
// 지금 장(back.chapter)에 그 맵의 visit 페이즈가 있고 조건(when)이 맞을 때만 들어간다. 없으면 길 맵의 빈 거점 그대로다
// (예: 2장 전의 옆 마을은 안개 너머라 이름도 없는 집 몇 채로 보인다).
import { HUBS, cellKey } from '../../content/world/world.js';
import { chapters } from '../../content/chapters/index.js';
import { passes } from '../core/script/ScriptRunner.js';

// 칸 키 → 이야기 필드가 있는 거점 id (고향 제외)
export function fieldHubAt(key) {
  return Object.keys(HUBS).find((id) => id !== 'home' && HUBS[id].field && cellKey(HUBS[id].layer ?? 'surface', HUBS[id].at) === key) ?? null;
}

// 그 거점에서 지금 장이 쓰는 visit 페이즈 id
export function visitPhase(hubId, chapterId, ctx) {
  const map = HUBS[hubId]?.field;
  const ch = chapters[chapterId];
  if (!map || !ch) return null;
  const hit = Object.entries(ch.phases).find(([, ph]) => ph.map === map && ph.visit && (!ph.when || passes(ph.when, ctx)));
  return hit?.[0] ?? null;
}
