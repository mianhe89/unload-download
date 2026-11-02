// 전체 지도: 마을 사이 거리, 길의 연결, 북쪽일수록 추운 기후
import { describe, it, expect } from 'vitest';
import { W, H, HUBS, ROUTES, SIDES, BIOMES, biomeAt, cells, links, travelSteps } from '../../content/world/world.js';

const inside = ([x, y]) => x >= 0 && y >= 0 && x < W && y < H;

describe('전체 지도', () => {
  it('모든 구역이 지도 안에 있고 겹치지 않는다', () => {
    for (const h of Object.values(HUBS)) expect(inside(h.at)).toBe(true);
    for (const p of Object.values(ROUTES)) for (const c of p) expect(inside(c)).toBe(true);
    const sideKeys = Object.values(SIDES).map((s) => s.at.join(','));
    const routeKeys = new Set(Object.values(ROUTES).flat().map((c) => c.join(',')));
    for (const k of sideKeys) expect(routeKeys.has(k), k).toBe(false);
  });

  it('길은 이웃한 칸끼리만 이어지고, 양 끝이 거점이다', () => {
    const hubAt = new Set(Object.values(HUBS).map((h) => h.at.join(',')));
    for (const [id, p] of Object.entries(ROUTES)) {
      expect(hubAt.has(p[0].join(',')), id).toBe(true);
      expect(hubAt.has(p.at(-1).join(',')), id).toBe(true);
      for (let i = 1; i < p.length; i += 1) expect(Math.abs(p[i][0] - p[i - 1][0]) + Math.abs(p[i][1] - p[i - 1][1]), `${id}[${i}]`).toBe(1);
    }
  });

  it('곁가지는 길에 붙어 있다', () => {
    const c = cells();
    for (const [id, s] of Object.entries(SIDES)) {
      expect(c.get(s.from.join(','))?.kind, id).not.toBe(undefined);
      expect(Math.abs(s.at[0] - s.from[0]) + Math.abs(s.at[1] - s.from[1])).toBe(1);
    }
  });

  it('모든 거점이 시작 마을에서 걸어서 닿는다', () => {
    for (const id of Object.keys(HUBS)) expect(travelSteps('home', id), id).toBeLessThan(Infinity);
    expect(links().size).toBe(cells().size);
  });

  it.each([
    ['home', 'frost'], ['home', 'forest'], ['home', 'ruins'], ['home', 'harbor'], ['frost', 'castle'],
  ])('%s → %s: 맵 다섯 개쯤 (4~6번 이동)', (a, b) => {
    const n = travelSteps(a, b);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it('검은 성은 시작 마을에서 가장 멀다', () => {
    const far = Math.max(...Object.keys(HUBS).map((id) => travelSteps('home', id)));
    expect(travelSteps('home', 'castle')).toBe(far);
  });
});

describe('기후: 북쪽일수록 춥다', () => {
  const temp = (x, y, s) => BIOMES[biomeAt(x, y, s)].temp;

  it.each(['spring', 'summer', 'autumn', 'winter'])('%s: 어느 열이든 북쪽으로 갈수록 기온이 내려가거나 같다 (바닷가 제외)', (s) => {
    for (let x = 0; x < W; x += 1) for (let y = 1; y < 13; y += 1) expect(temp(x, y - 1, s), `${x},${y}`).toBeLessThanOrEqual(temp(x, y, s));
  });

  it('검은 성 일대는 계절과 상관없이 해 없는 겨울', () => {
    for (const s of ['spring', 'summer', 'autumn', 'winter']) expect(biomeAt(...HUBS.castle.at, s)).toBe('blackSnow');
  });

  it('서리 마을은 늘 눈이나 서리, 시작 마을은 눈에 덮이지 않는다', () => {
    for (const s of ['spring', 'summer', 'autumn', 'winter']) {
      expect(['snow', 'frost']).toContain(biomeAt(...HUBS.frost.at, s));
      expect(['snow', 'frost', 'blackSnow']).not.toContain(biomeAt(...HUBS.home.at, s));
    }
  });

  it('실제 겨울엔 눈 경계가 남쪽으로 내려온다', () => {
    const snowRows = (s) => Array.from({ length: H }, (_, y) => y).filter((y) => BIOMES[biomeAt(5, y, s)].temp <= 2).length;
    expect(snowRows('winter')).toBeGreaterThan(snowRows('summer'));
  });

  it('서쪽은 숲, 동쪽은 마른 땅, 남쪽 끝은 바닷가', () => {
    expect(biomeAt(...HUBS.forest.at)).toBe('deepForest');
    expect(biomeAt(...HUBS.ruins.at)).toBe('dry');
    expect(biomeAt(...HUBS.harbor.at)).toBe('coast');
  });
});
