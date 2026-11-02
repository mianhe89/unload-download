// 대본용 작은 소품(빵, 화관, 반지, 류트 등). 코드로 그리고, Ninja Adventure 팩과 어울리게 외곽선을 두른다.
// 건물·나무 같은 큰 그림은 content/art/pack.js(CC0 팩)를 쓴다.

export const TILE = 16;

const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

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
}

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

function render(fn, seed) {
  const c = new Canvas16();
  fn(c, rng(seed));
  return c.d;
}

// 소품은 Ninja Adventure 팩과 어울리게 어두운 외곽선을 두른다
export const propPixels = (kind) => outline(render(PROPS[kind], 7), [20, 27, 27]);

function outline(d, [r, g, b]) {
  const out = new Uint8ClampedArray(d);
  const a = (x, y) => (x < 0 || y < 0 || x >= TILE || y >= TILE ? 0 : d[(y * TILE + x) * 4 + 3]);
  for (let y = 0; y < TILE; y += 1) for (let x = 0; x < TILE; x += 1) {
    if (a(x, y)) continue;
    if (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1)) {
      const i = (y * TILE + x) * 4;
      out[i] = r; out[i + 1] = g; out[i + 2] = b; out[i + 3] = 255;
    }
  }
  return out;
}
export const PROP_NAMES = Object.keys(PROPS);
