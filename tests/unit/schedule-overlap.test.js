// 하루 일과에서 두 사람이 같은 시각에 같은 칸에 서지 않는다(초소 앞에 셀레나·톰·레온이 한 칸에 겹쳐 서 있던 버그).
// 어슬렁거리는(wander) 사람은 제자리에 붙어 있지 않으니 뺀다. 조건(when)이 다른 일과는 서로 겹칠 수 있어 같은 조건끼리만 본다.
import { describe, it, expect } from 'vitest';
import { characters } from '../../content/characters/index.js';
import { MAPS } from '../../content/maps/index.js';

const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };

describe('하루 일과의 자리', () => {
  it('같은 맵에서 같은 시각에 두 사람이 한 칸에 붙박여 서지 않는다', () => {
    const clash = [];
    for (let t = 0; t < 24 * 60; t += 15) {
      const taken = {};
      for (const c of Object.values(characters)) {
        if (!c.schedule) continue;
        const map = MAPS[c.home ?? 'village'];
        let cur = null;
        for (const e of c.schedule) if (mins(e.from) <= t) cur = e;
        if (!cur || cur.home || cur.mode === 'wander') continue;
        const at = Array.isArray(cur.at) ? cur.at : map.spots[cur.at] && [map.spots[cur.at].x, map.spots[cur.at].y];
        if (!at) continue;
        const key = `${map.id ?? "village"}:${at}`;
        if (taken[key] && taken[key] !== c.id) clash.push(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')} ${key} ${taken[key]}·${c.id}`);
        else taken[key] = c.id;
      }
    }
    expect([...new Set(clash.map((s) => s.split(' ').slice(1).join(' ')))]).toEqual([]);
  });
});
