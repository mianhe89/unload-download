// 퀘스트 단계의 목적지(goal) → 작은 지도의 표시. 어디로 가야 할지 눈으로 보이게 한다.
//   step.goal: 하나 또는 목록 (목록이면 조건이 맞고 지금 맵에서 찾을 수 있는 첫 것)
//     { npc: 인물 }      그 사람이 지금 맵에 있으면 그 자리
//     { spot: 이름 }     지금 맵의 장소
//     { zone: 이름 }     지금 맵의 구역 가운데
//     { place: 거점 id } 다른 마을(content/world/world.js의 HUBS). 지금 맵 밖이면 그쪽 방향
//     + 대본 조건(minDay, unlessFlag, ifErased …)을 함께 적을 수 있다
// 결과: { x, y }(칸) | { angle }(라디안, 지도 가장자리 화살표) | null
import { HUBS } from '../../content/world/world.js';
import { QUESTS } from '../../content/quests/index.js';
import { passes } from '../core/script/ScriptRunner.js';

const list = (g) => (!g ? [] : Array.isArray(g) ? g : [g]);

// 지금 따라가는 퀘스트 단계: 진행 중인 메인 퀘스트 → 없으면 아무 진행 중인 퀘스트
export function trackedStep(quests) {
  const active = Object.entries(quests ?? {}).filter(([id, q]) => q.state === 'active' && QUESTS[id]);
  const pick = active.find(([id]) => QUESTS[id].kind === 'main') ?? active[0];
  return pick ? QUESTS[pick[0]].steps[pick[1].step] : null;
}

// map: 지금 맵, people: { 인물: [x, y] }, ctx: 대본 조건, here: 전체 지도에서 지금 칸 [x, y], hubHere: 지금 맵의 거점 id
export function resolveGoal(step, { map, people = {}, ctx, here, hubHere }) {
  for (const g of list(step?.goal)) {
    if (ctx && !passes(g, ctx)) continue;
    if (g.npc && people[g.npc]) return { x: people[g.npc][0], y: people[g.npc][1] };
    if (g.spot && map?.spots?.[g.spot]) return { x: map.spots[g.spot].x, y: map.spots[g.spot].y };
    if (g.zone && map?.zones?.[g.zone]) { const z = map.zones[g.zone]; return { x: z.x + z.w / 2, y: z.y + z.h / 2 }; }
    if (g.place) {
      if (g.place === hubHere) continue; // 이미 그 마을 안 — 다음 목적지로
      const to = HUBS[g.place]?.at;
      if (to && here && (to[0] !== here[0] || to[1] !== here[1])) return { angle: Math.atan2(to[1] - here[1], to[0] - here[0]) };
    }
  }
  return null;
}

// 지금 맵(이야기 필드)의 거점 id: 우리 마을과 집 안은 home
export function hubOfMap(mapId) {
  if (!mapId || mapId === 'village' || mapId === 'myhome') return 'home';
  return Object.keys(HUBS).find((id) => HUBS[id].field === mapId) ?? null;
}
