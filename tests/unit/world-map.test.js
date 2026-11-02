// 전체 지도: 층, 마을 사이 거리, 길의 연결, 기후(북쪽일수록 춥다, 불의 산은 예외), 숨은 은하
import { describe, it, expect } from 'vitest';
import { LAYERS, HUBS, ROUTES, SIDES, PORTALS, BIOMES, biomeAt, cells, links, travelSteps, cellKey } from '../../content/world/world.js';

const L = (o) => o.layer ?? 'surface';
const inside = (layer, [x, y]) => x >= 0 && y >= 0 && x < LAYERS[layer].W && y < LAYERS[layer].H;
const SEASONS = ['spring', 'summer', 'autumn', 'winter'];

describe('전체 지도: 구조', () => {
  it('모든 구역이 자기 층 안에 있다', () => {
    for (const h of Object.values(HUBS)) expect(inside(L(h), h.at)).toBe(true);
    for (const r of Object.values(ROUTES)) for (const c of r.path) expect(inside(L(r), c)).toBe(true);
    for (const s of Object.values(SIDES)) expect(inside(L(s), s.at)).toBe(true);
    for (const p of PORTALS) { expect(inside(p.a.layer, p.a.at)).toBe(true); expect(inside(p.b.layer, p.b.at)).toBe(true); }
  });

  it('길은 이웃한 칸끼리만, 양 끝은 같은 층의 거점', () => {
    const hubAt = new Set(Object.values(HUBS).map((h) => cellKey(L(h), h.at)));
    for (const [id, r] of Object.entries(ROUTES)) {
      expect(hubAt.has(cellKey(L(r), r.path[0])), id).toBe(true);
      expect(hubAt.has(cellKey(L(r), r.path.at(-1))), id).toBe(true);
      for (let i = 1; i < r.path.length; i += 1) expect(Math.abs(r.path[i][0] - r.path[i - 1][0]) + Math.abs(r.path[i][1] - r.path[i - 1][1]), `${id}[${i}]`).toBe(1);
    }
  });

  it('곁가지는 길 옆에 붙어 있고 길과 겹치지 않는다', () => {
    const routeKeys = new Set(Object.values(ROUTES).flatMap((r) => r.path.map((c) => cellKey(L(r), c))));
    for (const [id, s] of Object.entries(SIDES)) {
      expect(routeKeys.has(cellKey(L(s), s.at)), id).toBe(false);
      expect(cells().has(cellKey(L(s), s.from)), id).toBe(true);
      expect(Math.abs(s.at[0] - s.from[0]) + Math.abs(s.at[1] - s.from[1]), id).toBe(1);
    }
  });

  it('문은 실제 구역끼리 잇는다', () => {
    const c = cells();
    for (const p of PORTALS) { expect(c.has(cellKey(p.a.layer, p.a.at)), p.note).toBe(true); expect(c.has(cellKey(p.b.layer, p.b.at)), p.note).toBe(true); }
  });

  it('은하를 뺀 모든 거점이 시작 마을에서 닿는다 (지하는 계단으로)', () => {
    for (const [id, h] of Object.entries(HUBS)) {
      if (L(h) === 'sky') continue;
      expect(travelSteps('home', id), id).toBeLessThan(Infinity);
    }
  });

  it('은하는 숨은 문으로만 갈 수 있다', () => {
    expect(travelSteps('home', 'galaxy')).toBe(Infinity);
    expect(travelSteps('home', 'galaxy', { hidden: true })).toBeLessThan(Infinity);
    const hidden = PORTALS.filter((p) => p.kind === 'hidden');
    expect(hidden.every((p) => p.unlock)).toBe(true);
    expect(LAYERS.sky.hidden).toBe(true);
  });

  it.each([
    ['home', 'frost'], ['home', 'elf'], ['home', 'empty'], ['home', 'harbor'], ['frost', 'castle'],
    ['empty', 'dwarf'], ['frost', 'dwarf'], ['dwarf', 'volcano'], ['empty', 'ancient'], ['harbor', 'seaRuins'],
  ])('%s → %s: 맵 다섯 개쯤 (4~6번 이동)', (a, b) => {
    const n = travelSteps(a, b);
    expect(n).toBeGreaterThanOrEqual(4);
    expect(n).toBeLessThanOrEqual(6);
  });

  it('바다 유적은 배로만 간다', () => {
    expect(ROUTES['harbor-seaRuins'].by).toBe('boat');
    for (const c of ROUTES['harbor-seaRuins'].path.slice(1)) expect(['sea', 'coast']).toContain(biomeAt(...c));
  });

  it('검은 성은 서리 마을을 거쳐야 닿는다 (맵 열 개쯤)', () => {
    expect(travelSteps('home', 'castle')).toBe(travelSteps('home', 'frost') + travelSteps('frost', 'castle'));
    expect(travelSteps('home', 'castle')).toBeGreaterThanOrEqual(10);
  });

  it('갱도에서 용암 지대, 유적 아래 회랑까지 지하로 이어진다 (드워프 마을 ↔ 고대 유적 지하 통로)', () => {
    expect(travelSteps('mineGate', 'lavaDepths')).toBeLessThan(Infinity);
    expect(travelSteps('dwarf', 'ancient')).toBeLessThan(Infinity);
  });

  it('지도에 맞는 링크 수 (모든 칸이 어딘가와 이어짐)', () => {
    const adj = links({ hidden: true });
    for (const k of cells().keys()) expect(adj.get(k)?.size, k).toBeGreaterThan(0);
  });
});

describe('기후', () => {
  const B = (x, y, s, l) => BIOMES[biomeAt(x, y, s, l)];

  it.each(SEASONS)('%s: 북쪽으로 갈수록 기온이 내려가거나 같다 (불의 산 둘레 제외)', (s) => {
    for (let x = 0; x < LAYERS.surface.W; x += 1) for (let y = 1; y < LAYERS.surface.H; y += 1) {
      const n = B(x, y - 1, s), here = B(x, y, s);
      if (n.hot || here.hot) continue;
      expect(n.temp, `${x},${y}`).toBeLessThanOrEqual(here.temp);
    }
  });

  it('검은 성 일대는 계절과 상관없이 해 없는 겨울, 불의 산은 늘 뜨겁다', () => {
    for (const s of SEASONS) {
      expect(biomeAt(...HUBS.castle.at, s)).toBe('blackSnow');
      expect(biomeAt(...HUBS.volcano.at, s)).toBe('volcano');
    }
  });

  it('서리 마을·드워프 마을은 눈 속, 시작 마을은 눈에 덮이지 않는다', () => {
    for (const s of SEASONS) {
      expect(['snow', 'frost']).toContain(biomeAt(...HUBS.frost.at, s));
      expect(['snow', 'frost']).toContain(biomeAt(...HUBS.dwarf.at, s));
      expect(B(...HUBS.home.at, s).temp).toBeGreaterThan(2);
    }
  });

  it('실제 겨울엔 눈 경계가 남쪽으로 내려온다', () => {
    const snowRows = (s) => Array.from({ length: LAYERS.surface.H }, (_, y) => y).filter((y) => B(5, y, s).temp <= 2).length;
    expect(snowRows('winter')).toBeGreaterThan(snowRows('summer'));
  });

  it.each([
    ['elf', 'deepForest'], ['ancient', 'desert'], ['harbor', 'coast'], ['seaRuins', 'sea'],
    ['lavaDepths', 'lava'], ['mineGate', 'cave'], ['undercroft', 'ancientHall'], ['galaxy', 'galaxy'],
  ])('%s의 땅은 %s', (id, biome) => {
    const h = HUBS[id];
    expect(biomeAt(...h.at, 'autumn', L(h))).toBe(biome);
  });
});
