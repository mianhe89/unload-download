// 길 맵 살펴볼 거리의 규칙 (순수 함수 — 테스트 가능)
import { HUBS, ROUTES, cellKey } from '../../content/world/world.js';
import { BELL, TIDE } from '../../content/world/features.js';
import { corrupt } from '../core/script/speech.js';

const L = (o) => o.layer ?? 'surface';

// 거점 바로 옆 칸이면 이정표: { route, here: 이 칸 쪽 거점, there: 반대편 거점 }
export function signAt(layer, [x, y]) {
  for (const [id, r] of Object.entries(ROUTES)) {
    if (L(r) !== layer || r.by === 'boat') continue;
    const p = r.path;
    const ends = [[1, 0, p.length - 1], [p.length - 2, p.length - 1, 0]];
    for (const [i, near, far] of ends) {
      if (p[i][0] === x && p[i][1] === y) {
        const hubAt = (c) => Object.keys(HUBS).find((h) => L(HUBS[h]) === layer && HUBS[h].at[0] === c[0] && HUBS[h].at[1] === c[1]);
        return { route: id, here: hubAt(p[near]), there: hubAt(p[far]) };
      }
    }
  }
  return null;
}

// 이정표 글: 가 본 적 없는 마을 이름은 깨져 있다. visited(칸 키) → boolean
export function signText(sign, visited) {
  const name = (id) => {
    const h = HUBS[id];
    return visited(cellKey(L(h), h.at)) ? h.name : corrupt(h.name);
  };
  return `이정표. 한쪽은 ${name(sign.here)}, 다른 쪽은 ${name(sign.there)}.`;
}

export const fillText = (text, { loads }) => text.replaceAll('{loads}', String(loads));

// 종을 칠 때: 몇 번째인지와 문이 열리는지
export function ringBell(rings, { hour, foundAll }) {
  const n = rings + 1;
  const night = hour >= BELL.nightFrom || hour < BELL.nightTo;
  return { rings: n, opens: n >= BELL.rings && night && foundAll, night };
}

// 썰물인가: 실제 시각 기준, 12시간 25분 주기 중 3.1시간
export function lowTide(date = new Date()) {
  const h = (date.getTime() / 3.6e6) % TIDE.period;
  return h < TIDE.lowFor;
}
