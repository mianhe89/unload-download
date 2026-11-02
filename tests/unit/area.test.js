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

describe('길 맵의 살펴볼 거리와 층 사이 문', async () => {
  const { signAt, signText, ringBell, fillText } = await import('../../src/world/features.js');
  const { PORTALS, HUBS } = await import('../../content/world/world.js');
  const { corrupt } = await import('../../src/core/script/speech.js');
  const walkable = [...cells().values()].filter((c) => c.layer !== 'sky' && c.by !== 'boat' && c.id !== 'home' && biomeAt(...c.at, 'autumn', c.layer) !== 'sea');

  it.each(walkable.filter((c) => c.kind !== 'hub').map((c) => [`${c.layer}:${c.at}`, c]))('%s: 살펴볼 거리가 하나 있고 걸어서 닿는다', (_, c) => {
    const a = buildArea(c.layer, c.at);
    expect(a.features.length, '거리 없음').toBeGreaterThan(0);
    const r = reach(a, a.entry(a.exits[0]?.dir ?? 'portal'));
    for (const f of a.features) {
      const [, , pw, ph] = OBJECTS[f.type].rect;
      const near = [];
      for (let x = f.at[0] - 1; x <= f.at[0] + Math.ceil(pw / 16); x += 1) for (const y of [f.at[1] + Math.ceil(ph / 16), f.at[1] + Math.ceil(ph / 16) - 1]) near.push(`${x},${y}`);
      expect(near.some((k) => r.has(k)), `${f.kind} ${f.type}`).toBe(true);
    }
  });

  it('지하 칸들도 출구끼리 이어진다', () => {
    for (const c of [...cells().values()].filter((x) => x.layer === 'under')) {
      const a = buildArea('under', c.at);
      const start = a.entry(a.exits[0]?.dir ?? 'portal');
      const r = reach(a, start);
      for (const e of a.exits) expect(r.has(a.entry(e.dir).join(',')), `${c.at} ${e.dir}`).toBe(true);
    }
  });

  it('계단은 양쪽 층에 있고 서로를 가리킨다', () => {
    for (const p of PORTALS.filter((x) => x.kind !== 'hidden')) {
      const a = buildArea(p.a.layer, p.a.at).features.find((f) => f.kind === 'portal');
      const b = buildArea(p.b.layer, p.b.at).features.find((f) => f.kind === 'portal');
      expect(a.to).toEqual(p.b);
      expect(b.to).toEqual(p.a);
      expect(a.down).toBe(true);
      expect(b.down).toBe(false);
    }
  });

  it('종 걸린 절벽에는 종이 있고, 은하로 이어진다', () => {
    const bell = buildArea('surface', [9, 2]).features.find((f) => f.kind === 'bell');
    expect(bell.to.layer).toBe('sky');
    // 은하 쪽에는 종이 아니라 돌아가는 계단
    const back = buildArea('sky', [0, 1]).features;
    expect(back.some((f) => f.kind === 'bell')).toBe(false);
    expect(back.find((f) => f.kind === 'portal').to).toEqual({ layer: 'surface', at: [9, 2] });
  });

  it('종: 밤에, 빈자리를 다 찾은 사람이, 열세 번 쳐야 열린다', () => {
    expect(ringBell(12, { hour: 23, foundAll: true }).opens).toBe(true);
    expect(ringBell(11, { hour: 23, foundAll: true }).opens).toBe(false);
    expect(ringBell(12, { hour: 13, foundAll: true }).opens).toBe(false);
    expect(ringBell(12, { hour: 2, foundAll: true }).opens).toBe(true);
    expect(ringBell(12, { hour: 23, foundAll: false }).opens).toBe(false);
  });

  it('이정표: 거점 옆 칸에 서고, 가 보지 않은 마을 이름은 깨져 있다', () => {
    const s = signAt('surface', [7, 10]);
    expect(s).toEqual({ route: 'home-frost', here: 'home', there: 'frost' });
    const text = signText(s, (k) => k === 'surface:7,11');
    expect(text).toContain('수확제 마을');
    expect(text).toContain(corrupt('서리 마을'));
    expect(signText(s, () => true)).toContain('서리 마을');
    expect(signAt('surface', [7, 8])).toBe(null);
    expect(HUBS.frost.name).toBe('서리 마을');
  });

  it('글 속 {loads}는 로드 횟수로', () => {
    expect(fillText('숫자: {loads}.', { loads: 4 })).toBe('숫자: 4.');
  });
});
