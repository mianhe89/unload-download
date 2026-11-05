// 다른 마을에 들르기: 길 맵에서 거점 칸(HUBS[id].field가 있는 곳)에 들어서면 그 마을의 이야기 필드로.
// 지금 장(back.chapter)에 그 맵의 visit 페이즈가 있고 조건(when)이 맞을 때만 들어간다. 없으면 길 맵의 빈 거점 그대로다
// (예: 2장 전의 옆 마을은 안개 너머라 이름도 없는 집 몇 채로 보인다).
import { HUBS, cellKey } from '../../content/world/world.js';
import { chapters } from '../../content/chapters/index.js';
import { passes } from '../core/script/ScriptRunner.js';
import { elfVillageGone } from '../farm/farm.js';

// 거점마다 따로 있는 문턱: 엘프 마을은 깊은 숲을 지나치게 베면 보이지 않는다(그 칸은 그루터기만 남은 길 맵)
// 숲을 지나치게 벤 사람에게는 숲 속 마을들이 길을 열어 주지 않는다 (엘프 마을, 그 너머의 아스테라)
const GATES = { elf: (run) => !elfVillageGone(run?.farm), magic: (run) => !elfVillageGone(run?.farm) };

// 칸 키 → 이야기 필드가 있는 거점 id (고향 제외)
export function fieldHubAt(key) {
  return Object.keys(HUBS).find((id) => id !== 'home' && HUBS[id].field && cellKey(HUBS[id].layer ?? 'surface', HUBS[id].at) === key) ?? null;
}

// 그 거점에서 지금 장이 쓰는 visit 페이즈 id
export function visitPhase(hubId, chapterId, ctx, run) {
  if (GATES[hubId] && !GATES[hubId](run)) return null;
  const map = HUBS[hubId]?.field;
  const ch = chapters[chapterId];
  if (!map || !ch) return null;
  const hit = Object.entries(ch.phases).find(([, ph]) => ph.map === map && ph.visit && (!ph.when || passes(ph.when, ctx)));
  return hit?.[0] ?? null;
}
