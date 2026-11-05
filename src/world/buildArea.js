// 길 맵 생성 (순수 함수 — 테스트 가능). 전체 지도의 칸 하나를 걸어 다닐 수 있는 맵으로 만든다.
// - 크기는 마을과 같다(48×34). 바깥 3칸은 흐릿한 가장자리, 이웃 칸으로 이어진 쪽에만 출구가 뚫린다
// - 출구에서 가운데 빈터까지 흙길(눈길·모랫길)이 나고, 나머지는 기후에 맞는 숲·바위로 채운다
// - 같은 칸은 늘 같은 모양 (칸 좌표로 시드)
// 결과는 content/maps/village.js와 같은 모양(terrain, objects, isSolidPx …)이라 같은 렌더러·필드 부품을 쓴다.
import { OBJECTS } from '../../content/art/pack.js';
import { HUBS, SIDES, BIOMES, PORTALS, biomeAt, cells, links, cellKey } from '../../content/world/world.js';
import { FLAVOR, SIDE_OBJECT, SEA_RUINS } from '../../content/world/features.js';
import { signAt } from './features.js';

export const TILE = 16;
export const W = 48;
export const H = 34;
export const FOG = 3;
const EDGE = FOG + 1;
const GAP = 3; // 출구 너비(칸)

// 바닥 → 테마 (content/art/pack.js THEMES)
export const THEME_OF = { grass: 'grass', darkGrass: 'village', dryGrass: 'grass', snow: 'snow', snowGrass: 'snow', sand: 'sand', beach: 'sand', dirt: 'earth', lava: 'lava', cave: 'cave', water: 'sea', void: 'void' };

// 기후별 나무·바위 (큰 것, 작은 것)
export const FLORA = {
  temperate: { big: ['tree_grove', 'tree_grove2', 'tree_grove_green'], small: ['tree_round', 'tree_round2', 'bush', 'bush2'] },
  deepForest: { big: ['tree_pines', 'tree_pines', 'tree_grove'], small: ['tree_pine', 'tree_pine', 'stump'] },
  lateAutumn: { big: ['tree_grove', 'dead_grove'], small: ['tree_dead', 'tree_round', 'stump', 'bush'] },
  frost: { big: ['pines_snow', 'tree_pines', 'tree_grove_snow'], small: ['tree_snow', 'tree_pine', 'tree_snow2'] },
  snow: { big: ['pines_snow', 'pines_snow2', 'tree_grove_snow'], small: ['tree_snow', 'tree_snow2', 'tree_snow_round'] },
  blackSnow: { big: ['pines_snow2', 'dead_grove'], small: ['tree_snow2', 'tree_dead'] },
  dry: { big: ['rocks_brown', 'dead_grove'], small: ['tree_dead', 'stump'] },
  desert: { big: ['rocks_brown'], small: ['tree_dead'] },
  coast: { big: ['tree_grove_green', 'rocks_grey'], small: ['tree_round', 'bush'] },
  volcano: { big: ['rocks_brown', 'dead_grove'], small: ['tree_dead'] },
  cave: { big: ['rocks_brown', 'rocks_grey'], small: ['stump'] },
  deepCave: { big: ['rocks_grey', 'rocks_brown'], small: [] },
  lava: { big: ['rocks_brown'], small: [] },
  ancientHall: { big: ['rocks_grey'], small: ['runestone', 'runestone2'] },
  galaxy: { big: [], small: [] },
  sea: { big: [], small: ['sea_rock'] },
};
const DIRS = { n: [0, -1], s: [0, 1], w: [-1, 0], e: [1, 0] };
export const OPPOSITE = { n: 's', s: 'n', e: 'w', w: 'e' };

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s = (Math.imul(s, 1103515245) + 12345) >>> 0; return (s >>> 8) / 16777216; };
}

// 칸의 출구: 같은 층 이웃. 바닷길은 배를 탔을 때만(boat), 층 사이 문은 출구가 아니라 계단
export function exitsOf(layer, [x, y], { boat = false } = {}) {
  const adj = links().get(cellKey(layer, [x, y])) ?? new Set();
  const all = cells();
  const out = [];
  for (const [dir, [dx, dy]] of Object.entries(DIRS)) {
    const to = cellKey(layer, [x + dx, y + dy]);
    if (!adj.has(to)) continue;
    const here = all.get(cellKey(layer, [x, y])), there = all.get(to);
    const byBoat = here?.by === 'boat' || there?.by === 'boat';
    if (byBoat !== boat && !(boat && there?.kind === 'hub')) continue;
    out.push({ dir, to, at: [x + dx, y + dy] });
  }
  return out;
}

// opts.lowTide: 썰물인가 (바다 유적의 섬이 드러난다)
// opts.felled: 이 칸에서 베어 낸 나무 자리 ['x,y', …] — 영영 사라진다
// opts.elfGone: 깊은 숲을 너무 베어 엘프 마을이 보이지 않는다
export function buildArea(layer, at, { season = 'autumn', lowTide = false, felled = [], elfGone = false } = {}) {
  const key = cellKey(layer, at);
  const cell = cells().get(key);
  if (!cell) throw new Error(`지도에 없는 칸: ${key}`);
  const biome = biomeAt(at[0], at[1], season, layer);
  const theme = THEME_OF[BIOMES[biome].floor] ?? 'grass';
  const r = rng(at[0] * 7349 + at[1] * 3571 + layer.length * 101);

  // ── 출구: 각 변의 가운데쯤, 칸마다 조금씩 어긋나게
  const sea = biome === 'sea';
  const exits = exitsOf(layer, at, { boat: sea }).map((e) => {
    const horizontal = e.dir === 'n' || e.dir === 's';
    const mid = horizontal ? Math.floor(W / 2) - 2 + Math.floor(r() * 4) : Math.floor(H / 2) - 2 + Math.floor(r() * 4);
    return { ...e, from: mid, to2: mid + GAP }; // [from, to2) 칸 범위
  });

  // ── 바닥: 출구 → 가운데 빈터까지 2칸 너비 길
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  const dirt = (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) if (g[y]?.[x] !== undefined) g[y][x] = 'd'; };
  const cx = Math.floor(W / 2) - 1, cy = Math.floor(H / 2) - 1;
  if (!sea) dirt(cx - 3, cy - 2, 8, 5); // 빈터 (바다엔 길이 없다)
  if (sea && cell.id === 'seaRuins' && lowTide) dirt(cx - 6, cy - 3, 14, 7); // 썰물: 지붕이 섬처럼 드러난다
  for (const e of sea ? [] : exits) {
    const m = e.from + 1; // 출구 가운데 칸
    // 꺾이는 지점을 칸마다 다르게
    const span = (a1, b1) => [Math.min(a1, b1), Math.abs(a1 - b1) + 1];
    if (e.dir === 'n' || e.dir === 's') {
      const edgeY = e.dir === 'n' ? 0 : H - 1;
      const bend = e.dir === 'n' ? 6 + Math.floor(r() * 5) : H - 7 - Math.floor(r() * 5);
      { const [y0, h] = span(edgeY, bend); dirt(m, y0, 2, h); }        // 가장자리 → 꺾임
      { const [x0, w] = span(m, cx); dirt(x0, bend, w + 1, 2); }       // 옆으로
      { const [y0, h] = span(bend, cy); dirt(cx, y0, 2, h); }          // 빈터로
    } else {
      const edgeX = e.dir === 'w' ? 0 : W - 1;
      const bend = e.dir === 'w' ? 8 + Math.floor(r() * 5) : W - 9 - Math.floor(r() * 5);
      { const [x0, w] = span(edgeX, bend); dirt(x0, m, w, 2); }
      { const [y0, h] = span(m, cy); dirt(bend, y0, 2, h + 1); }
      { const [x0, w] = span(bend, cx); dirt(x0, cy, w, 2); }
    }
  }
  // 남쪽이 바다인 바닷가: 아래쪽 띠가 물('w', 걸을 수 없음). 항구는 선착장 길이 물가까지
  const shore = !sea && biome === 'coast' && biomeAt(at[0], at[1] + 1, season, layer) === 'sea' ? H - 10 : null;
  if (shore) {
    if (cell.id === 'harbor') dirt(cx, cy + 2, 2, shore - cy - 2);
    for (let y = shore; y < H; y += 1) for (let x = 0; x < W; x += 1) g[y][x] = 'w';
  }
  const terrain = g.map((row) => row.join(''));
  const isPath = (x, y) => g[y]?.[x] === 'd';

  // ── 물체
  const objects = [];
  const occupied = new Set();
  const flora = FLORA[biome] ?? FLORA.temperate;
  // 칸 사각형이 길(과 그 둘레 1칸)이나 다른 물체와 겹치면 못 놓는다
  const fits = (x0, y0, w, h, margin = 1) => {
    for (let y = y0 - margin; y < y0 + h + margin; y += 1) for (let x = x0 - margin; x < x0 + w + margin; x += 1) {
      if (isPath(x, y)) return false;
    }
    for (let y = y0; y < y0 + h; y += 1) for (let x = x0; x < x0 + w; x += 1) if (occupied.has(`${x},${y}`) || g[y]?.[x] === 'w') return false;
    return true;
  };
  const place = (type, x, y, extra = {}) => {
    const [, , pw, ph] = OBJECTS[type].rect;
    const tw = Math.ceil(pw / TILE), th = Math.ceil(ph / TILE);
    for (let j = y; j < y + th; j += 1) for (let i = x; i < x + tw; i += 1) occupied.add(`${i},${j}`);
    objects.push({ type, at: [x, y], ...extra });
  };
  const tryPlace = (type, x, y, margin) => {
    const [, , pw, ph] = OBJECTS[type].rect;
    const tw = Math.ceil(pw / TILE), th = Math.ceil(ph / TILE);
    if (x < 0 || y < 0 || x + tw > W || y + th > H) return false;
    if (!fits(x, y, tw, th, margin)) return false;
    place(type, x, y);
    return true;
  };

  // 거점: 가운데 빈터 둘레에 집 몇 채 (아직 이야기가 없는 마을의 자리)
  if (cell.id === 'elf' && elfGone) {
    // 엘프 마을이 있던 자리: 그루터기만
    for (const [x, y] of [[cx - 7, cy - 4], [cx - 5, cy + 3], [cx + 5, cy - 4], [cx + 7, cy + 3], [cx + 1, cy - 6]]) tryPlace('stump', x, y, 0);
  } else if (cell.kind === 'hub' && cell.id !== 'home' && layer === 'surface') {
    const houses = { frost: ['house_stone', 'house_plain'], elf: ['house_wood', 'house_wood'], dwarf: ['house_stone', 'forge'], empty: ['house_plain', 'house_wood', 'house_red'], harbor: ['house_red', 'house_plain'], castle: ['house_tall'] }[cell.id] ?? ['house_plain'];
    const slots = [[cx - 9, cy - 6], [cx + 5, cy - 6], [cx - 9, cy + 3], [cx + 5, cy + 3]];
    houses.forEach((t, i) => tryPlace(t, ...slots[i], 0));
  }
  // ── 살펴볼 거리 (content/world/features.js). 빈터 둘레의 빈자리에 놓는다
  const features = [];
  const spotFor = (type) => {
    const [, , pw, ph] = OBJECTS[type].rect;
    const tw = Math.ceil(pw / TILE), th = Math.ceil(ph / TILE);
    const cands = [[cx + 3, cy - 2 - th], [cx - 2 - tw, cy - 2 - th], [cx + 3, cy + 3], [cx - 2 - tw, cy + 3], [cx + 6, cy - 1], [cx - 4 - tw, cy - 1]];
    for (const [x, y] of cands) if (tryPlace(type, x, y, 0)) return [x, y];
    return null;
  };
  const addFeature = (kind, type, extra) => {
    const at2 = spotFor(type);
    if (at2) features.push({ kind, type, at: at2, ...extra });
  };
  // 층 사이 문: 빈터 안에 계단 (밟고 지나간다)
  for (const p of PORTALS) {
    const ends = [[p.a, p.b], [p.b, p.a]];
    for (const [me, other] of ends) {
      if (me.layer !== layer || me.at[0] !== at[0] || me.at[1] !== at[1]) continue;
      if (p.kind === 'hidden' && layer === 'surface') { addFeature('bell', SIDE_OBJECT.bellCliff, { to: other, text: SIDES.bellCliff?.note }); continue; }
      const down = layer === 'surface';
      const type = down ? (biome === 'desert' ? 'stairs_down' : 'stairs_down_stone') : (biome === 'ancientHall' ? 'stairs_up' : 'stairs_up_stone');
      const sx = cx + 2, sy = cy - 1;
      objects.push({ type, at: [sx, sy] });
      features.push({ kind: 'portal', type, at: [sx, sy], to: other, down });
    }
  }
  // 항구: 배를 대 놓았다 (E로 탄다). 바다 유적: 썰물이면 지붕, 밀물이면 물 아래 그림자
  if (cell.id === 'harbor' && layer === 'surface') {
    const bx = cx, by = shore ?? cy + 4; // 선착장 끝, 물 위
    objects.push({ type: 'boat', at: [bx, by] });
    features.push({ kind: 'boat', type: 'boat', at: [bx, by], to: { layer, at: [at[0], at[1] + 1] } });
  }
  if (cell.id === 'seaRuins') {
    if (lowTide) {
      // 섬 위에 바로 놓는다 (섬은 '길' 땅이라 빈자리 찾기가 피한다)
      for (const [t, x, y] of [['runestone2', cx - 4, cy - 2], ['runestone2', cx + 5, cy - 2], ['runestone2', cx - 4, cy + 2], ['runestone2', cx + 5, cy + 2]]) place(t, x, y);
      place('runestone', cx, cy - 2);
      features.push({ kind: 'side', type: 'runestone', at: [cx, cy - 2], text: SEA_RUINS.low });
    }
    else addFeature('flavor', 'sea_rock', { text: SEA_RUINS.high });
  }
  if (cell.kind === 'side' && cell.id !== 'bellCliff') addFeature('side', SIDE_OBJECT[cell.id] ?? 'runestone', { text: SIDES[cell.id].note });
  const sign = cell.kind === 'route' ? signAt(layer, at) : null;
  if (sign) addFeature('sign', 'signpost', { sign });
  else if (cell.kind === 'route' && FLAVOR[biome]?.length) {
    const [type, text] = FLAVOR[biome][Math.floor(r() * FLAVOR[biome].length)];
    addFeature('flavor', type, { text });
  }

  // 가장자리 숲(출구 자리는 비움) → 안쪽에 듬성듬성
  if (flora.big.length) for (let x = 0; x < W - 3; x += 4) { tryPlace(flora.big[Math.floor(r() * flora.big.length)], x, 0, 0); tryPlace(flora.big[Math.floor(r() * flora.big.length)], x, H - 4, 0); }
  if (flora.big.length) for (let y = 3; y < H - 4; y += 3) { tryPlace(flora.big[Math.floor(r() * flora.big.length)], 0, y, 0); tryPlace(flora.big[Math.floor(r() * flora.big.length)], W - 4, y, 0); }
  const density = { sea: 0.06, deepForest: 0.55, frost: 0.45, snow: 0.4, temperate: 0.35, lateAutumn: 0.3, blackSnow: 0.3, coast: 0.2, dry: 0.18, desert: 0.12, volcano: 0.15 }[biome] ?? 0.3;
  for (let y = EDGE; y < H - EDGE - 1; y += 2) for (let x = EDGE; x < W - EDGE - 1; x += 2) {
    if (r() > density) continue;
    const list = r() < 0.3 || !flora.small.length ? flora.big : flora.small;
    if (!list.length) continue;
    tryPlace(list[Math.floor(r() * list.length)], x + Math.floor(r() * 2), y + Math.floor(r() * 2), 1);
  }

  // 베어 낸 나무는 영영 없다
  if (felled.length) {
    const gone = new Set(felled);
    for (let i = objects.length - 1; i >= 0; i -= 1) if (gone.has(objects[i].at.join(','))) objects.splice(i, 1);
  }

  // ── 충돌
  const solids = objects.filter((o) => OBJECTS[o.type]?.foot).map((o) => {
    const [fx, fy, fw, fh] = OBJECTS[o.type].foot;
    return { x: o.at[0] * TILE + fx, y: o.at[1] * TILE + fy, w: fw, h: fh, type: o.type };
  });
  const inGap = (tx, ty) => exits.some((e) => {
    if (e.dir === 'n') return ty < EDGE && tx >= e.from && tx < e.to2;
    if (e.dir === 's') return ty >= H - EDGE && tx >= e.from && tx < e.to2;
    if (e.dir === 'w') return tx < EDGE && ty >= e.from && ty < e.to2;
    return tx >= W - EDGE && ty >= e.from && ty < e.to2;
  });
  function isSolidPx(px, py) {
    if (px < 0 || py < 0 || px >= W * TILE || py >= H * TILE) return true;
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    if ((tx < EDGE || ty < EDGE || tx >= W - EDGE || ty >= H - EDGE) && !inGap(tx, ty)) return true;
    if (terrain[ty][tx] === 'w') return true; // 뭍의 물가는 걸어 들어갈 수 없다
    return solids.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
  }
  const isSolidTile = (tx, ty) => isSolidPx(tx * TILE + TILE / 2, ty * TILE + TILE / 2);

  // 출구를 밟았는가 (맵 끝 두 칸)
  function exitAt(px, py) {
    const tx = Math.floor(px / TILE), ty = Math.floor(py / TILE);
    return exits.find((e) => (e.dir === 'n' && ty <= 1) || (e.dir === 's' && ty >= H - 2) || (e.dir === 'w' && tx <= 1) || (e.dir === 'e' && tx >= W - 2)) ?? null;
  }
  // 그 출구로 들어왔을 때 서는 자리 (칸 좌표)
  function entry(dir) {
    if (dir === 'boat') {
      const b = features.find((f) => f.kind === 'boat');
      if (b) return [b.at[0] + 1, b.at[1] - 2];
    }
    if (dir === 'portal') {
      const p = features.find((f) => f.kind === 'portal' || f.kind === 'bell');
      if (p) return p.kind === 'bell' ? [p.at[0] + 1, p.at[1] + 6] : [p.at[0], p.at[1] + 2];
    }
    const e = exits.find((x) => x.dir === dir);
    if (!e) return [cx, cy];
    const m = e.from + 1;
    return { n: [m, EDGE], s: [m, H - EDGE - 1], w: [EDGE, m], e: [W - EDGE - 1, m] }[dir];
  }

  const hub = cell.kind === 'hub' ? HUBS[cell.id] : null;
  const side = cell.kind === 'side' ? SIDES[cell.id] : null;
  return {
    key, layer, at, biome, theme, kind: cell.kind, id: cell.id, sea,
    name: cell.id === 'elf' && elfGone ? BIOMES[biome].name : hub?.name ?? side?.name ?? BIOMES[biome].name,
    note: cell.id === 'elf' && elfGone ? '여기에 무언가 있었던 것 같다. 그루터기만 가득하다.' : hub?.note ?? side?.note ?? null,
    TILE, W, H, FOG, terrain, objects, animated: [], solids, exits, features,
    isSolidPx, isSolidTile, exitAt, entry,
    spots: { center: { x: cx + 1, y: cy + 1 } }, zones: {}, bonfire: null,
  };
}
