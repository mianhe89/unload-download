// 타일과 소품 픽셀 아트 (16×16). 절차적으로 그리되 시드를 고정해 매번 같은 모양이 나온다.
import { hexToRgb } from './compose.js';

export const TILE = 16;

// 맵 문자 → 타일 종류
export const TILE_KINDS = {
  g: { name: 'grass' },
  ',': { name: 'path' },
  o: { name: 'stone' },
  f: { name: 'flowers' },
  T: { name: 'tree', solid: true },
  H: { name: 'wall', solid: true },
  R: { name: 'roof', solid: true },
  D: { name: 'door', solid: true },
  B: { name: 'tower', solid: true },
  b: { name: 'towerDoor', solid: true },
  F: { name: 'fire', solid: true, floor: 'stone' },   // 큰 모닥불 그림은 field/Landmarks가 올린다
  S: { name: 'stall', solid: true },
  A: { name: 'anvil', solid: true },
  W: { name: 'well', solid: true },
  x: { name: 'fog', solid: true },
};

function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 10000) / 10000; };
}

class Canvas16 {
  constructor() { this.d = new Uint8ClampedArray(TILE * TILE * 4); }
  px(x, y, hex, a = 255) {
    if (x < 0 || y < 0 || x >= TILE || y >= TILE) return;
    const [r, g, b] = hexToRgb(hex);
    const i = (y * TILE + x) * 4;
    this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = a;
  }
  rect(x, y, w, h, hex) { for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) this.px(i, j, hex); }
  noise(base, spots, r, n) { this.rect(0, 0, TILE, TILE, base); for (let k = 0; k < n; k += 1) this.px(Math.floor(r() * 16), Math.floor(r() * 16), spots[Math.floor(r() * spots.length)]); }
}

const draw = {
  grass(c, r) { c.noise('#5e8c4a', ['#4e7a3e', '#6e9c58', '#557f43'], r, 26); },
  path(c, r) { c.noise('#b39466', ['#a38458', '#c2a474', '#9a7c50'], r, 22); },
  stone(c, r) {
    c.rect(0, 0, 16, 16, '#8f8a86');
    for (let y = 0; y < 16; y += 4) for (let x = (y / 4) % 2 ? 2 : 0; x < 16; x += 8) { c.rect(x, y, 1, 4, '#6f6a68'); }
    for (let y = 3; y < 16; y += 4) c.rect(0, y, 16, 1, '#76716e');
    for (let k = 0; k < 8; k += 1) c.px(Math.floor(r() * 16), Math.floor(r() * 16), '#a19c98');
  },
  flowers(c, r) { draw.grass(c, r); for (let k = 0; k < 6; k += 1) { const x = 1 + Math.floor(r() * 14), y = 1 + Math.floor(r() * 14); c.px(x, y, ['#f07aa0', '#f6e070', '#ffffff'][k % 3]); c.px(x, y + 1, '#3f6a32'); } },
  tree(c, r) {
    draw.grass(c, r);
    c.rect(6, 11, 4, 5, '#5a3e2a'); c.rect(7, 11, 1, 5, '#6e4e36');
    const leaf = ['#2f5a34', '#3a6e3e', '#285030'];
    for (let y = 0; y < 12; y += 1) for (let x = 0; x < 16; x += 1) {
      const dx = x - 7.5, dy = y - 5.5; if (dx * dx / 56 + dy * dy / 36 <= 1) c.px(x, y, leaf[Math.floor(r() * 3)]);
    }
    c.rect(4, 2, 2, 1, '#4f8a50'); c.rect(9, 3, 2, 1, '#4f8a50');
  },
  wallPlain(c) { c.rect(0, 0, 16, 16, '#c9b49a'); for (let y = 0; y < 16; y += 5) c.rect(0, y, 16, 1, '#a8937a'); for (let y = 0; y < 16; y += 10) c.rect(y % 20 ? 4 : 11, y, 1, 5, '#a8937a'); },
  wall(c) { draw.wallPlain(c); c.rect(5, 6, 6, 5, '#3a4a6a'); c.rect(5, 6, 6, 1, '#2a2a3a'); c.rect(7, 6, 1, 5, '#2a2a3a'); c.rect(4, 11, 8, 1, '#8a7a62'); },
  roof(c) { c.rect(0, 0, 16, 16, '#9a4a3a'); for (let y = 1; y < 16; y += 3) c.rect(0, y, 16, 1, '#7a3a2e'); for (let y = 0; y < 16; y += 3) for (let x = (y % 2) * 3; x < 16; x += 6) c.px(x, y, '#b45a46'); },
  door(c) { draw.wall(c); c.rect(4, 4, 8, 12, '#5a3a24'); c.rect(4, 4, 8, 1, '#3a2418'); c.px(10, 10, '#e8c860'); },
  tower(c) { c.rect(0, 0, 16, 16, '#6a6672'); for (let y = 0; y < 16; y += 4) { c.rect(0, y, 16, 1, '#57535e'); for (let x = (y / 4) % 2 ? 4 : 0; x < 16; x += 8) c.rect(x, y, 1, 4, '#57535e'); } },
  towerDoor(c) { draw.tower(c); c.rect(4, 3, 8, 13, '#2a2430'); c.rect(5, 2, 6, 1, '#2a2430'); },
  fire(c, r) {
    draw.stone(c, r);
    c.rect(2, 11, 12, 3, '#5a3e2a'); c.rect(3, 10, 10, 1, '#6e4e36');
    const fl = ['#ffd860', '#ff9a3a', '#e8582e'];
    for (let y = 2; y < 11; y += 1) for (let x = 3; x < 13; x += 1) { const w = (11 - y) * 0.5; if (Math.abs(x - 7.5) < w && r() > 0.25) c.px(x, y, fl[Math.min(2, Math.floor((11 - y) / 3.2))]); }
  },
  stall(c) { c.rect(0, 6, 16, 10, '#8a5a3a'); c.rect(0, 6, 16, 2, '#6a4228'); c.rect(1, 3, 14, 3, '#e8e0d0'); c.rect(1, 3, 14, 1, '#c84a3a'); for (let x = 2; x < 14; x += 4) { c.rect(x, 4, 2, 2, '#e8b060'); } },
  anvil(c, r) { draw.path(c, r); c.rect(3, 6, 10, 3, '#4a4a52'); c.rect(1, 6, 3, 2, '#4a4a52'); c.rect(6, 9, 4, 4, '#3a3a42'); c.rect(4, 13, 8, 2, '#3a3a42'); c.rect(3, 6, 10, 1, '#6a6a74'); },
  well(c, r) { draw.grass(c, r); c.rect(2, 4, 12, 10, '#7a7680'); c.rect(4, 6, 8, 6, '#2a3a5a'); c.rect(5, 7, 3, 1, '#4a6a9a'); c.rect(2, 4, 12, 1, '#9a96a0'); c.rect(1, 1, 2, 8, '#5a3e2a'); c.rect(13, 1, 2, 8, '#5a3e2a'); c.rect(1, 0, 14, 2, '#7a3a2e'); },
  fog(c) { c.rect(0, 0, 16, 16, '#c8ccd6'); },
};

// 소품(줍는 물건, 흔적)
export const PROPS = {
  bread(c) { c.rect(4, 7, 8, 5, '#c8843a'); c.rect(5, 6, 6, 1, '#d89a50'); c.rect(5, 8, 2, 1, '#e8b870'); c.rect(4, 11, 8, 1, '#9a6028'); },
  burntBread(c) { c.rect(4, 7, 8, 5, '#4a3020'); c.rect(5, 6, 6, 1, '#5a3a28'); c.rect(4, 11, 8, 1, '#2a1a10'); },
  crown(c) { for (let x = 3; x < 13; x += 1) c.px(x, 9, '#5aa04a'); [[3, 8], [6, 7], [9, 7], [12, 8]].forEach(([x, y]) => { c.px(x, y, '#f07aa0'); c.px(x + 1, y, '#f6e070'); }); },
  ironCrown(c) { PROPS.crown(c); c.rect(7, 6, 2, 2, '#a8b0b8'); },
  spark(c) { c.px(7, 7, '#ffd860'); c.px(8, 7, '#ff9a3a'); c.px(7, 8, '#ff9a3a'); c.px(8, 8, '#e8582e'); c.px(6, 6, '#ffd86080'); },
  lute(c) { c.rect(5, 8, 6, 5, '#a8743a'); c.rect(7, 9, 2, 2, '#3a2418'); c.rect(7, 3, 2, 5, '#6a4228'); c.rect(6, 2, 4, 1, '#4a2e1a'); },
  basket(c) { c.rect(3, 8, 10, 5, '#a8844a'); c.rect(3, 8, 10, 1, '#c8a46a'); for (let x = 4; x < 13; x += 2) c.px(x, 10, '#8a6a38'); },
  ring(c) { c.rect(6, 6, 4, 1, '#a8b0b8'); c.rect(5, 7, 1, 3, '#a8b0b8'); c.rect(10, 7, 1, 3, '#a8b0b8'); c.rect(6, 10, 4, 1, '#78808a'); },
  emptyStall(c) { c.rect(0, 6, 16, 10, '#5a4a3a'); c.rect(0, 6, 16, 2, '#4a3a2e'); },
};

// 2×2칸짜리 큰 모닥불 (32×32, 깜빡이는 프레임 3장)
export function bonfirePixels(frame) {
  const S = 32, d = new Uint8ClampedArray(S * S * 4);
  const px = (x, y, hex) => { if (x < 0 || y < 0 || x >= S || y >= S) return; const [r, g, b] = hexToRgb(hex); const i = (y * S + x) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
  const r = rng(101 + frame * 17);
  // 돌 테두리
  for (let a = 0; a < 18; a += 1) { const t = (a / 18) * Math.PI * 2; const x = Math.round(16 + Math.cos(t) * 12), y = Math.round(24 + Math.sin(t) * 5); px(x, y, '#7a7470'); px(x + 1, y, '#5a5652'); }
  // 장작
  for (let x = 8; x < 24; x += 1) { px(x, 22 + (x % 3 === 0 ? 1 : 0), '#5a3e2a'); px(x, 23, '#4a3020'); }
  for (let k = 0; k < 10; k += 1) { px(10 + k, 21 - (k >> 2), '#6e4e36'); px(22 - k, 21 - (k >> 2), '#6e4e36'); }
  // 불꽃
  const fl = ['#fff2a0', '#ffd860', '#ff9a3a', '#e8582e'];
  for (let y = 2; y < 22; y += 1) for (let x = 6; x < 26; x += 1) {
    const h = 22 - y, w = h * 0.42 * (0.8 + r() * 0.4);
    const dx = Math.abs(x - 16 + Math.sin(y * 0.6 + frame) * 1.2);
    if (dx < w && r() > 0.15 + y * 0.01) px(x, y, fl[Math.min(3, Math.floor(dx / Math.max(w, 1) * 2 + (22 - h) / 12))]);
  }
  for (let k = 0; k < 4; k += 1) px(8 + Math.floor(r() * 16), Math.floor(r() * 8), '#ffd860');
  return d;
}

function render(fn, seed) {
  const c = new Canvas16();
  fn(c, rng(seed));
  return c.d;
}

export const tilePixels = (kind, seed = 1) => render(draw[kind], seed);
export const propPixels = (kind) => render(PROPS[kind], 7);
export const TILE_NAMES = Object.keys(draw);
export const PROP_NAMES = Object.keys(PROPS);
