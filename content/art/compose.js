// 캐릭터 정의(팔레트 + 레이어) → RGBA 스프라이트시트
// 브라우저(Phaser 텍스처)와 Node(미리보기 PNG) 양쪽에서 같은 코드로 쓴다.
import { O, SKIN, BASE } from './body.js';
import { LAYERS } from './layers.js';

export const FRAME = 16;
// 시트 프레임 순서: down 0~2, up 0~2, side 0~2 (side는 오른쪽, 왼쪽은 뒤집는다)
export const DIRS = ['down', 'up', 'side'];

export const hexToRgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

export function composeFrame(art, dir, f) {
  const pal = { o: O, O, e: O, ...SKIN, ...art.pal };
  const grid = BASE[dir](f).map((r) => r.split(''));
  for (const name of art.layers) {
    const layer = LAYERS[name]?.[dir];
    if (!layer) throw new Error(`레이어 없음: ${name}/${dir}`);
    layer.forEach((row, y) => [...row].forEach((ch, x) => { if (ch !== '.') grid[y][x] = ch; }));
  }
  const px = new Uint8ClampedArray(FRAME * FRAME * 4);
  grid.forEach((row, y) => row.forEach((ch, x) => {
    if (ch === '.' || !pal[ch]) return;
    const [r, g, b] = hexToRgb(pal[ch]);
    const i = (y * FRAME + x) * 4;
    px[i] = r; px[i + 1] = g; px[i + 2] = b; px[i + 3] = 255;
  }));
  return px;
}

export function composeSheet(art) {
  const W = FRAME * 9, H = FRAME;
  const data = new Uint8ClampedArray(W * H * 4);
  DIRS.forEach((dir, d) => [0, 1, 2].forEach((f) => {
    blit(data, W, composeFrame(art, dir, f), FRAME, FRAME, (d * 3 + f) * FRAME, 0);
  }));
  return { width: W, height: H, data };
}

export function blit(dst, dw, src, sw, sh, ox, oy) {
  for (let y = 0; y < sh; y += 1) {
    for (let x = 0; x < sw; x += 1) {
      const si = (y * sw + x) * 4;
      if (!src[si + 3]) continue;
      const di = ((oy + y) * dw + ox + x) * 4;
      dst[di] = src[si]; dst[di + 1] = src[si + 1]; dst[di + 2] = src[si + 2]; dst[di + 3] = src[si + 3];
    }
  }
}
