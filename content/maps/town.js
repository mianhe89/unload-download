// 거점 마을 맵을 짧은 설명으로 짓는 도우미. 만든 맵은 content/maps/village.js와 같은 꼴이다
// (id W H FOG theme terrain objects solids exits openExits entry isSolidPx isSolidTile spots zones).
//   makeTown({ id, name, W, H, theme?, dirt: [[x, y, w, h]…], objects: [O(...)…],
//              ring: { types: [나무…], gaps: { n|s|w|e: [from, to] } },   // 마을을 두르는 숲, 출구 자리는 비운다
//              objectTint?: 건물·나무를 곱하기로 덮는 색 (빛바랜 마을), fogColor?: 가장자리 색 'r,g,b' (집 안은 어둡게),
//              life?/props?/lights?: 건물 안(room)의 생활 자리·소품·불빛,
//              exits: [{ dir, from, to2, to: '층:x,y', at: [x, y] }], entry: { dir: [tx, ty] }, spots, zones })
import { OBJECTS } from '../art/pack.js';

export const TILE = 16;
export const O = (type, x, y, extra = {}) => ({ type, at: [x, y], ...extra });

export function makeTown(spec) {
  const { W, H, FOG = 3 } = spec;
  const g = Array.from({ length: H }, () => Array(W).fill('g'));
  for (const [x, y, w, h] of spec.dirt ?? []) for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) if (g[j]?.[i] !== undefined) g[j][i] = 'd';
  const terrain = g.map((r) => r.join(''));

  const objects = [...(spec.objects ?? [])];
  if (spec.ring) {
    const { types, gaps = {} } = spec.ring;
    const pick = (i) => types[i % types.length];
    const open = (side, a) => gaps[side] && a + 3 >= gaps[side][0] && a <= gaps[side][1];
    let i = 0;
    for (let x = 0; x < W - 3; x += 4) {
      if (!open('n', x)) objects.push(O(pick(i++), x, 0));
      if (!open('s', x)) objects.push(O(pick(i++), x, H - 4));
    }
    for (let y = 3; y < H - 4; y += 3) {
      if (!open('w', y)) objects.push(O(pick(i++), 0, y));
      if (!open('e', y)) objects.push(O(pick(i++), W - 4, y));
    }
  }

  const solids = objects.filter((o) => OBJECTS[o.type]?.foot).map((o) => {
    const [fx, fy, fw, fh] = OBJECTS[o.type].foot;
    return { x: o.at[0] * TILE + fx, y: o.at[1] * TILE + fy, w: fw, h: fh, type: o.type };
  });
  const exits = spec.exits ?? [];
  const EDGE = FOG + 1;
  const inGap = (tx, ty) => exits.some((e) => (e.dir === 'n' && ty < EDGE && tx >= e.from && tx < e.to2) || (e.dir === 's' && ty >= H - EDGE && tx >= e.from && tx < e.to2)
    || (e.dir === 'w' && tx < EDGE && ty >= e.from && ty < e.to2) || (e.dir === 'e' && tx >= W - EDGE && ty >= e.from && ty < e.to2));
  const isSolidPx = (px, py) => {
    if (px < 0 || py < 0 || px >= W * TILE || py >= H * TILE) return true;
    if ((px < EDGE * TILE || py < EDGE * TILE || px >= (W - EDGE) * TILE || py >= (H - EDGE) * TILE) && !inGap(Math.floor(px / TILE), Math.floor(py / TILE))) return true;
    return solids.some((s) => px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
  };

  return {
    id: spec.id, name: spec.name, TILE, W, H, FOG, theme: spec.theme, objectTint: spec.objectTint, fogColor: spec.fogColor,
    life: spec.life, props: spec.props, lights: spec.lights,
    terrain, objects, animated: spec.animated ?? [], solids, exits,
    openExits: exits.map((e) => e.dir),
    entry: (dir) => spec.entry?.[dir],
    isSolidPx,
    isSolidTile: (tx, ty) => isSolidPx(tx * TILE + TILE / 2, ty * TILE + TILE / 2),
    spots: spec.spots ?? {}, zones: spec.zones ?? {}, bonfire: null,
  };
}
