// 전체 지도 미리보기 PNG: content/world/world.js의 구역·길·기후를 팩 그림으로 그린다.
//   node tools/render-worldmap.mjs [계절] [출력 경로]     (기본: autumn, docs/world-map.png)
// 칸 하나 = 맵(구역) 하나. 길 밖은 '흐릿한 가장자리'(안개)로 덮는다.
import { join } from 'node:path';
import { readPng, writePng, blank, crop, paste } from './lib/pixels.mjs';
import { W, H, HUBS, SIDES, BIOMES, biomeAt, cells, links } from '../content/world/world.js';
import { SHEETS, OBJECTS } from '../content/art/pack.js';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets-src/ninja-adventure');
const CW = 96, CH = 64; // 칸 하나의 크기(px) = 6×4 타일

const sheet = {};
const load = (k, path) => (sheet[k] ??= readPng(join(SRC, path)));
const floorSheet = load('floor', SHEETS.floor);
const nature = load('nature', SHEETS.nature);
const house = load('house', SHEETS.house);
const towers = load('towers', 'Backgrounds/Tilesets/TilesetTowers.png');

const tile = (tx, ty) => crop(floorSheet, tx * 16, ty * 16, 16, 16);
// 바닥: [타일, 비율] — 경계 지대는 두 땅이 섞인다 (서리 = 눈 반 풀 반, 늦가을 = 풀 사이 맨흙)
const FLOORS = {
  grass: [[tile(0, 12), 0.85], [tile(1, 12), 0.15]],
  darkGrass: [[tile(11, 12), 0.85], [tile(12, 12), 0.15]],
  dryGrass: [[tile(0, 12), 0.6], [tile(11, 19), 0.25], [tile(1, 12), 0.15]],
  snow: [[tile(0, 19), 0.85], [tile(1, 19), 0.15]],
  snowGrass: [[tile(0, 19), 0.45], [tile(0, 12), 0.35], [tile(1, 19), 0.2]],
  sand: [[tile(0, 5), 0.85], [tile(1, 5), 0.15]],
  beach: [[tile(0, 5), 0.8], [tile(11, 5), 0.2]],
};
const pick = (list) => { let r = rand(); for (const [t, p] of list) { if ((r -= p) <= 0) return t; } return list[0][0]; };
// 나무: 기후마다 (자연 시트의 32×32 사각형)
const TREE = (x, y = 0, w = 32, h = 32) => crop(nature, x, y, w, h);
const TREES = {
  temperate: [TREE(256), TREE(288), TREE(96)],
  deepForest: [TREE(32), TREE(32), TREE(64)],
  lateAutumn: [TREE(64), TREE(96), TREE(256)],
  frost: [TREE(128), TREE(128), TREE(32)],
  snow: [TREE(160), TREE(192), TREE(128)],
  blackSnow: [TREE(160), TREE(64)],
  dry: [TREE(64)],
  coast: [],
};

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

const img = blank(W * CW, H * CH);
const px = (x, y) => (y * img.width + x) * 4;
function fill(x0, y0, w, h, [r, g, b], a = 1) {
  for (let y = Math.max(0, y0); y < Math.min(img.height, y0 + h); y += 1) for (let x = Math.max(0, x0); x < Math.min(img.width, x0 + w); x += 1) {
    const i = px(x, y);
    img.data[i] = img.data[i] * (1 - a) + r * a; img.data[i + 1] = img.data[i + 1] * (1 - a) + g * a; img.data[i + 2] = img.data[i + 2] * (1 - a) + b * a; img.data[i + 3] = 255;
  }
}
const scale2 = (s) => {
  const o = blank(s.width * 2, s.height * 2);
  for (let y = 0; y < o.height; y += 1) for (let x = 0; x < o.width; x += 1) s.data.copy(o.data, (y * o.width + x) * 4, ((y >> 1) * s.width + (x >> 1)) * 4, ((y >> 1) * s.width + (x >> 1)) * 4 + 4);
  return o;
};
const tint = (s, [r, g, b], a) => {
  const o = blank(s.width, s.height); s.data.copy(o.data);
  for (let i = 0; i < o.data.length; i += 4) { o.data[i] = o.data[i] * (1 - a) + r * a; o.data[i + 1] = o.data[i + 1] * (1 - a) + g * a; o.data[i + 2] = o.data[i + 2] * (1 - a) + b * a; }
  return o;
};

export function renderWorldMap(season = 'autumn') {
  const all = cells();
  const adj = links();
  for (let cy = 0; cy < H; cy += 1) for (let cx = 0; cx < W; cx += 1) {
    const ox = cx * CW, oy = cy * CH;
    const bId = biomeAt(cx, cy, season);
    const b = BIOMES[bId];
    const here = all.get(`${cx},${cy}`);
    // 바다: 남쪽 끝의 길 밖
    if (bId === 'coast' && !here && cy === H - 1) { fill(ox, oy, CW, CH, [64, 128, 184]); continue; }
    const fl = FLOORS[b.floor];
    for (let ty = 0; ty < CH / 16; ty += 1) for (let tx = 0; tx < CW / 16; tx += 1) paste(img, pick(fl), ox + tx * 16, oy + ty * 16);
    if (b.dark) fill(ox, oy, CW, CH, [30, 26, 46], 0.45);

    // 길: 가운데에서 이어진 이웃 쪽으로
    if (here) {
      const col = b.floor === 'snow' ? [176, 176, 200] : b.floor === 'sand' || b.floor === 'beach' ? [210, 160, 100] : [150, 104, 64];
      const mx = ox + CW / 2, my = oy + CH / 2;
      fill(mx - 6, my - 5, 12, 10, col);
      for (const n of adj.get(`${cx},${cy}`) ?? []) {
        const [nx, ny] = n.split(',').map(Number);
        if (nx > cx) fill(mx, my - 5, CW / 2, 10, col);
        if (nx < cx) fill(ox, my - 5, CW / 2, 10, col);
        if (ny > cy) fill(mx - 6, my, 12, CH / 2, col);
        if (ny < cy) fill(mx - 6, oy, 12, CH / 2, col);
      }
    }
    // 나무: 길 밖은 빽빽하게, 길 위는 가장자리에만
    const trees = TREES[bId] ?? [];
    const n = trees.length ? (here ? 2 : 5) : 0;
    for (let i = 0; i < n; i += 1) {
      const t = trees[Math.floor(rand() * trees.length)];
      let tx = ox + Math.floor(rand() * (CW - 32)), ty = oy + Math.floor(rand() * (CH - 32));
      if (here) { tx = ox + (rand() < 0.5 ? 0 : CW - 32); ty = oy + (rand() < 0.5 ? 0 : CH - 32); }
      paste(img, t, tx, ty);
    }
    // 거점
    if (here?.kind === 'hub') {
      const h = HUBS[here.id];
      if (h.kind === 'castle') {
        const t = scale2(tint(crop(towers, 96, 32, 32, 32), [20, 16, 32], 0.55));
        paste(img, t, ox + CW / 2 - 32, oy + CH / 2 - 44);
      } else {
        const [hx, hy, hw, hh] = OBJECTS[h.kind === 'ruins' ? 'house_plain' : here.id === 'frost' ? 'house_stone' : here.id === 'forest' ? 'house_wood' : here.id === 'harbor' ? 'house_red' : 'bakery'].rect;
        let s = crop(house, hx, hy, hw, hh);
        if (h.kind === 'ruins') s = tint(s, [120, 116, 128], 0.6);
        if (b.floor === 'snow') s = tint(s, [235, 235, 245], 0.18);
        paste(img, s, ox + CW / 2 - hw / 2 - 14, oy + CH / 2 - hh + 12);
        paste(img, tint(crop(house, 64, 0, 64, 48), [0, 0, 0], h.kind === 'ruins' ? 0.5 : 0), ox + CW / 2 - 4, oy + CH / 2 - 30);
      }
    }
    // 곁가지: 작은 표시
    if (here?.kind === 'side') fill(ox + CW / 2 - 3, oy + CH / 2 - 3, 6, 6, [250, 214, 90]);
    // 흐릿한 가장자리
    if (!here) fill(ox, oy, CW, CH, [24, 28, 44], 0.5);
  }
  return img;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const season = process.argv[2] ?? 'autumn';
  const out = process.argv[3] ?? join(ROOT, 'docs/world-map.png');
  writePng(out, renderWorldMap(season));
  console.log(`전체 지도 (${season}) → ${out}`);
}
void SIDES;
