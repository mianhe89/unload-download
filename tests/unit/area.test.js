// 길 맵 생성: 출구가 지도의 이웃과 맞는지, 출구끼리 걸어서 이어지는지, 같은 칸은 늘 같은 모양인지
import { describe, it, expect } from 'vitest';
import { buildArea, exitsOf, OPPOSITE, W, H } from '../../src/world/buildArea.js';
import { cells, links, cellKey, biomeAt } from '../../content/world/world.js';
import { OBJECTS, THEMES } from '../../content/art/pack.js';

const surfaceLand = [...cells().values()].filter((c) => c.layer === 'surface' && c.by !== 'boat' && c.id !== 'home' && biomeAt(...c.at) !== 'sea');

// 칸 단위 BFS: from 칸에서 갈 수 있는 칸 집합
function reach(area, [sx, sy]) {
  const seen = new Set([`${sx},${sy}`]);
  const q = [[sx, sy]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = `${nx},${ny}`;
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(k) || area.isSolidTile(nx, ny)) continue;
      seen.add(k); q.push([nx, ny]);
    }
  }
  return seen;
}

describe('길 맵 생성', () => {
  it.each(surfaceLand.map((c) => [c.at.join(','), c]))('%s: 출구끼리, 출구와 빈터가 걸어서 이어진다', (_, c) => {
    const a = buildArea('surface', c.at);
    expect(a.exits.length).toBeGreaterThan(0);
    const start = a.entry(a.exits[0].dir);
    const r = reach(a, start);
    for (const e of a.exits) {
      const [x, y] = a.entry(e.dir);
      expect(r.has(`${x},${y}`), `${e.dir} 입구`).toBe(true);
      // 입구에서 맵 끝(출구 칸)까지도 걸어간다
      const edge = { n: [x, 0], s: [x, H - 1], w: [0, y], e: [W - 1, y] }[e.dir];
      expect(r.has(edge.join(',')), `${e.dir} 출구 끝`).toBe(true);
    }
    expect(r.has(`${a.spots.center.x},${a.spots.center.y}`)).toBe(true);
  });

  it('출구는 지도의 이웃과 정확히 맞고, 반대편 칸에도 마주 보는 출구가 있다', () => {
    for (const c of surfaceLand) {
      const ex = exitsOf('surface', c.at);
      for (const e of ex) {
        const back = exitsOf('surface', e.at).find((x) => x.to === cellKey('surface', c.at));
        expect(back?.dir, `${c.at} → ${e.at}`).toBe(OPPOSITE[e.dir]);
      }
      const adj = links().get(cellKey('surface', c.at));
      expect(ex.length).toBeLessThanOrEqual(adj.size);
    }
  });

  it('출구 밖 가장자리는 막혀 있다', () => {
    const a = buildArea('surface', [7, 9]); // 남북으로만 이어진 길
    expect(a.exits.map((e) => e.dir).sort()).toEqual(['n', 's']);
    for (let y = 0; y < H; y += 1) { expect(a.isSolidTile(0, y)).toBe(true); expect(a.isSolidTile(W - 1, y)).toBe(true); }
  });

  it('출구를 밟으면 알아챈다', () => {
    const a = buildArea('surface', [7, 9]);
    const [x] = a.entry('n');
    expect(a.exitAt(x * 16 + 8, 4)?.dir).toBe('n');
    expect(a.exitAt(x * 16 + 8, 200)).toBe(null);
  });

  it('같은 칸은 늘 같은 모양, 다른 칸은 다른 모양', () => {
    expect(buildArea('surface', [7, 9]).terrain).toEqual(buildArea('surface', [7, 9]).terrain);
    expect(buildArea('surface', [7, 9]).objects).not.toEqual(buildArea('surface', [7, 8]).objects);
  });

  it('기후가 바닥과 나무를 정한다: 북쪽 길은 눈, 사막은 모래', () => {
    expect(buildArea('surface', [7, 5]).theme).toBe('snow');
    expect(buildArea('surface', [7, 5]).objects.some((o) => o.type.includes('snow'))).toBe(true);
    expect(buildArea('surface', [14, 12]).theme).toBe('sand');
    expect(buildArea('surface', [7, 10]).theme).toBe('grass');
  });

  it('쓰는 물체와 테마는 모두 정의돼 있다', () => {
    for (const c of surfaceLand) {
      const a = buildArea('surface', c.at);
      expect(THEMES[a.theme], c.at.join(',')).toBeTruthy();
      for (const o of a.objects) expect(OBJECTS[o.type], o.type).toBeTruthy();
    }
  });

  it('거점 칸에는 집이 선다', () => {
    const a = buildArea('surface', [7, 6]); // 서리 마을
    expect(a.name).toBe('서리 마을');
    expect(a.objects.some((o) => o.type.startsWith('house'))).toBe(true);
  });
});
