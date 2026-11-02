// 전체 지도 미리보기 PNG: content/world/world.js의 층·구역·길·기후를 팩 그림으로 그린다.
//   node tools/render-worldmap.mjs [계절] [출력 경로] [--all]   (기본: autumn, docs/world-map.png)
//   --all: 숨은 층(은하)까지 그린다 (기획용). 기본 지도에는 은하가 없다.
// 칸 하나 = 맵(구역) 하나. 길 밖은 '흐릿한 가장자리'(안개)로 덮는다.
import { join } from 'node:path';
import { readPng, writePng, blank, crop, paste } from './lib/pixels.mjs';
import { loadBdf, drawText, textWidth } from './lib/bdf.mjs';
import { LAYERS, HUBS, SIDES, BIOMES, PORTALS, biomeAt, cells, links, cellKey } from '../content/world/world.js';
import { SHEETS, OBJECTS } from '../content/art/pack.js';

const ROOT = join(import.meta.dirname, '..');
const SRC = join(ROOT, 'assets-src/ninja-adventure');
const CW = 96, CH = 64; // 칸 하나의 크기(px) = 6×4 타일
const TS = 'Backgrounds/Tilesets/';

const floorSheet = readPng(join(SRC, SHEETS.floor));
const nature = readPng(join(SRC, SHEETS.nature));
const house = readPng(join(SRC, SHEETS.house));
const towers = readPng(join(SRC, TS + 'TilesetTowers.png'));
const water = readPng(join(SRC, TS + 'TilesetWater.png'));
const desert = readPng(join(SRC, TS + 'TilesetDesert.png'));
const font = loadBdf(join(ROOT, 'node_modules/galmuri/dist/Galmuri11.bdf'));

let seed = 7;
const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);

// ── 픽셀 도구
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
function fill(img, x0, y0, w, h, [r, g, b], a = 1) {
  for (let y = Math.max(0, y0); y < Math.min(img.height, y0 + h); y += 1) for (let x = Math.max(0, x0); x < Math.min(img.width, x0 + w); x += 1) {
    const i = (y * img.width + x) * 4;
    img.data[i] = img.data[i] * (1 - a) + r * a; img.data[i + 1] = img.data[i + 1] * (1 - a) + g * a; img.data[i + 2] = img.data[i + 2] * (1 - a) + b * a; img.data[i + 3] = 255;
  }
}

// ── 바닥: [타일, 비율] — 경계 지대는 두 땅이 섞인다
const ft = (tx, ty) => crop(floorSheet, tx * 16, ty * 16, 16, 16);
const wt = (tx, ty) => crop(water, tx * 16, ty * 16, 16, 16);
const FLOORS = {
  grass: [[ft(0, 12), 0.85], [ft(1, 12), 0.15]],
  darkGrass: [[ft(11, 12), 0.85], [ft(12, 12), 0.15]],
  dryGrass: [[ft(0, 12), 0.6], [ft(11, 19), 0.25], [ft(1, 12), 0.15]],
  dirt: [[ft(11, 19), 0.7], [ft(0, 12), 0.15], [ft(12, 19), 0.15]],
  snow: [[ft(0, 19), 0.85], [ft(1, 19), 0.15]],
  snowGrass: [[ft(0, 19), 0.45], [ft(0, 12), 0.35], [ft(1, 19), 0.2]],
  sand: [[ft(0, 5), 0.85], [ft(1, 5), 0.15]],
  beach: [[ft(0, 5), 0.8], [ft(11, 5), 0.2]],
  water: [[wt(1, 1), 1]],
  // 용암: 모래 타일을 붉게 달군다 (팩에 용암 바닥이 따로 없다)
  lava: [[tint(ft(0, 5), [196, 48, 18], 0.6), 0.6], [tint(ft(1, 5), [255, 150, 40], 0.45), 0.25], [tint(ft(0, 5), [90, 20, 16], 0.55), 0.15]],
  cave: [[tint(ft(11, 19), [34, 26, 30], 0.35), 0.8], [tint(ft(12, 19), [34, 26, 30], 0.35), 0.2]],
  void: [[tint(wt(14, 7), [20, 10, 50], 0.55), 1]],
};
const pick = (list) => { let r = rand(); for (const [t, p] of list) { if ((r -= p) <= 0) return t; } return list[0][0]; };

// ── 나무·바위: 기후마다
const NT = (x, y = 0, w = 32, h = 32) => crop(nature, x, y, w, h);
const PALM = crop(desert, 160, 64, 48, 48);
const ROCK = NT(272, 160, 64, 48);
const DECOR = {
  temperate: [NT(256), NT(288), NT(96)],
  deepForest: [NT(32), NT(32), NT(64), NT(0, 32, 64, 48)],
  lateAutumn: [NT(64), NT(96), NT(256)],
  dry: [NT(64)],
  desert: [PALM, NT(64)],
  frost: [NT(128), NT(128), NT(32)],
  snow: [NT(160), NT(192), NT(128)],
  blackSnow: [NT(160), NT(64)],
  volcano: [NT(64), tint(ROCK, [40, 20, 20], 0.4)],
  coast: [PALM],
  cave: [tint(ROCK, [30, 24, 30], 0.5)],
  deepCave: [tint(ROCK, [30, 24, 30], 0.6)],
  lava: [tint(ROCK, [60, 10, 10], 0.5)],
  ancientHall: [tint(crop(desert, 0, 96, 32, 32), [30, 24, 40], 0.5)],
};

// ── 거점 그림
const H_ = (name) => crop(house, ...OBJECTS[name].rect);
const ICON = {
  home: () => [H_('bakery'), H_('house_plain')],
  frost: () => [tint(H_('house_stone'), [235, 235, 245], 0.2), tint(H_('house_plain'), [235, 235, 245], 0.25)],
  harbor: () => [H_('house_red'), H_('house_plain')],
  elf: () => [crop(desert, 0, 0, 48, 80)],
  dwarf: () => [tint(H_('house_stone'), [60, 50, 60], 0.35), crop(towers, 0, 32, 32, 32)],
  empty: () => [tint(H_('house_plain'), [120, 116, 128], 0.6), tint(H_('house_wood'), [120, 116, 128], 0.6)],
  ancient: () => [scale2(crop(desert, 0, 96, 32, 32))],
  volcano: () => [ROCK],
  seaRuins: () => [tint(scale2(crop(desert, 0, 96, 32, 32)), [60, 120, 170], 0.45)],
  castle: () => [scale2(tint(crop(towers, 96, 32, 32, 32), [20, 16, 32], 0.55))],
  mineGate: () => [crop(towers, 0, 32, 32, 32)],
  lavaDepths: () => [tint(ROCK, [120, 30, 10], 0.35)],
  undercroft: () => [tint(scale2(crop(desert, 0, 96, 32, 32)), [30, 24, 40], 0.4)],
  skyShore: () => [],
  galaxy: () => [],
};

function star(img, x, y, big) {
  fill(img, x, y, 1, 1, [255, 255, 255]);
  if (big) { fill(img, x - 2, y, 5, 1, [200, 210, 255]); fill(img, x, y - 2, 1, 5, [200, 210, 255]); fill(img, x, y, 1, 1, [255, 255, 255]); }
}

function renderLayer(layer, season) {
  const { W, H } = LAYERS[layer];
  const img = blank(W * CW, H * CH);
  const all = cells();
  const adj = links({ hidden: true });
  const labels = [];
  for (let cy = 0; cy < H; cy += 1) for (let cx = 0; cx < W; cx += 1) {
    const ox = cx * CW, oy = cy * CH;
    const bId = biomeAt(cx, cy, season, layer);
    const b = BIOMES[bId];
    const here = all.get(cellKey(layer, [cx, cy]));
    // 바닥
    if (layer === 'under' && !here) { fill(img, ox, oy, CW, CH, [38, 30, 34]); for (let i = 0; i < 4; i += 1) paste(img, tint(ROCK, [30, 24, 30], 0.55), ox + Math.floor(rand() * (CW - 64)), oy + Math.floor(rand() * (CH - 48))); continue; }
    if (layer === 'sky' && !here) { fill(img, ox, oy, CW, CH, [8, 6, 22]); for (let i = 0; i < 14; i += 1) star(img, ox + Math.floor(rand() * CW), oy + Math.floor(rand() * CH), rand() < 0.12); continue; }
    for (let ty = 0; ty < CH / 16; ty += 1) for (let tx = 0; tx < CW / 16; tx += 1) paste(img, pick(FLOORS[b.floor]), ox + tx * 16, oy + ty * 16);
    if (bId === 'blackSnow') fill(img, ox, oy, CW, CH, [30, 26, 46], 0.45);
    if (layer === 'sky') for (let i = 0; i < 10; i += 1) star(img, ox + Math.floor(rand() * CW), oy + Math.floor(rand() * CH), rand() < 0.2);

    // 길: 가운데에서 이어진 이웃 쪽으로 (바닷길은 점선)
    if (here) {
      const boat = here.by === 'boat' || (b.floor === 'water');
      const col = boat ? [235, 245, 255] : layer === 'sky' ? [200, 180, 255] : b.floor === 'snow' ? [176, 176, 200] : b.floor === 'lava' ? [70, 40, 40] : ['sand', 'beach'].includes(b.floor) ? [210, 160, 100] : layer === 'under' ? [110, 90, 80] : [150, 104, 64];
      const mx = ox + CW / 2, my = oy + CH / 2;
      const seg = (x, y, w, h) => {
        if (!boat) { fill(img, x, y, w, h, col); return; }
        // 점선 (배 항로)
        const horiz = w > h;
        for (let t = 0; t < (horiz ? w : h); t += 8) horiz ? fill(img, x + t, y + 3, 4, 3, col) : fill(img, x + 4, y + t, 3, 4, col);
      };
      seg(mx - 6, my - 5, 12, 10);
      for (const n of adj.get(cellKey(layer, [cx, cy])) ?? []) {
        const [nl, rest] = n.split(':');
        if (nl !== layer) continue;
        const [nx, ny] = rest.split(',').map(Number);
        if (nx > cx) seg(mx, my - 5, CW / 2, 10);
        if (nx < cx) seg(ox, my - 5, CW / 2, 10);
        if (ny > cy) seg(mx - 6, my, 12, CH / 2);
        if (ny < cy) seg(mx - 6, oy, 12, CH / 2);
      }
    }
    // 장식: 길 밖은 빽빽하게, 길 위는 가장자리에만
    const deco = DECOR[bId] ?? [];
    const n = deco.length ? (here ? 2 : 5) : 0;
    for (let i = 0; i < n; i += 1) {
      const t = deco[Math.floor(rand() * deco.length)];
      let tx = ox + Math.floor(rand() * Math.max(1, CW - t.width)), ty = oy + Math.floor(rand() * Math.max(1, CH - t.height));
      if (here) { tx = ox + (rand() < 0.5 ? 0 : CW - t.width); ty = oy + (rand() < 0.5 ? 0 : CH - t.height); }
      paste(img, t, tx, ty);
    }
    // 거점
    if (here?.kind === 'hub') {
      const icons = ICON[here.id]?.() ?? [];
      let x = ox + CW / 2 - icons.reduce((w, s) => w + s.width, 0) / 2;
      for (const s of icons) { paste(img, s, Math.round(x), oy + CH / 2 + 14 - s.height); x += s.width - 6; }
      if (here.id === 'galaxy' || here.id === 'skyShore') for (let i = 0; i < 6; i += 1) star(img, ox + 20 + Math.floor(rand() * 56), oy + 10 + Math.floor(rand() * 40), true);
      labels.push({ text: HUBS[here.id].name, x: ox + CW / 2, y: oy + CH - 15, hub: true });
    }
    if (here?.kind === 'side') {
      fill(img, ox + CW / 2 - 3, oy + CH / 2 - 3, 6, 6, [250, 214, 90]);
      labels.push({ text: SIDES[here.id].name, x: ox + CW / 2, y: oy + CH / 2 + 6, hub: false });
    }
    // 흐릿한 가장자리 (지상만)
    if (!here && layer === 'surface' && bId !== 'sea') fill(img, ox, oy, CW, CH, [24, 28, 44], 0.5);
    if (!here && bId === 'sea') fill(img, ox, oy, CW, CH, [20, 40, 80], 0.25);
  }
  // 층을 잇는 문: 작은 계단 표시
  for (const p of PORTALS) for (const end of [p.a, p.b]) {
    if (end.layer !== layer) continue;
    const [x, y] = end.at;
    const col = p.kind === 'hidden' ? [200, 150, 255] : [255, 255, 255];
    for (let i = 0; i < 3; i += 1) fill(img, x * CW + CW - 18 + i * 3, y * CH + 6 + i * 4, 12 - i * 3, 3, col);
  }
  // 지명
  for (const l of labels) {
    const w = textWidth(font, l.text);
    drawText(img, font, l.text, Math.round(l.x - w / 2), l.y, l.hub ? [255, 255, 255] : [255, 236, 170], [20, 18, 28]);
  }
  return img;
}

function title(img, text, x, y) { drawText(img, font, text, x, y, [255, 255, 255], [20, 18, 28]); }

export function renderWorldMap(season = 'autumn', { all = false } = {}) {
  const surface = renderLayer('surface', season);
  const under = renderLayer('under', season);
  const sky = all ? renderLayer('sky', season) : null;
  const GAP = 28;
  const width = surface.width;
  const height = surface.height + GAP + under.height + 8;
  const img = blank(width, height);
  fill(img, 0, 0, width, height, [16, 14, 22]);
  paste(img, surface, 0, 0);
  title(img, `지상 (${{ spring: '봄', summer: '여름', autumn: '가을', winter: '겨울' }[season]})`, 8, 6);
  const oy = surface.height + GAP;
  title(img, '지하 — 드워프 마을·고대 유적의 계단으로', 8, oy - 20);
  paste(img, under, 0, oy);
  if (sky) {
    const sx = under.width + 32;
    title(img, '은하 (히든) — 종 걸린 절벽에서만', sx, oy - 20);
    paste(img, sky, sx, oy);
  }
  return img;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
  const season = args[0] ?? 'autumn';
  const out = args[1] ?? join(ROOT, 'docs/world-map.png');
  writePng(out, renderWorldMap(season, { all: process.argv.includes('--all') }));
  console.log(`전체 지도 (${season}) → ${out}`);
}
