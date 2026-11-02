// PNG 읽기·쓰기와 픽셀 편집 도구 (Node 전용, 에셋 빌드에서 쓴다)
import { readFileSync, writeFileSync } from 'node:fs';
import { PNG } from 'pngjs';

export function readPng(path) {
  const png = PNG.sync.read(readFileSync(path));
  return { width: png.width, height: png.height, data: png.data };
}

export function writePng(path, img) {
  const png = new PNG({ width: img.width, height: img.height });
  img.data.copy ? img.data.copy(png.data) : png.data.set(img.data);
  writeFileSync(path, PNG.sync.write(png));
}

export const blank = (width, height) => ({ width, height, data: Buffer.alloc(width * height * 4) });

export function crop(img, x, y, w, h) {
  const out = blank(w, h);
  for (let j = 0; j < h; j += 1) {
    const s = ((y + j) * img.width + x) * 4;
    img.data.copy(out.data, j * w * 4, s, s + w * 4);
  }
  return out;
}

export function paste(dst, src, ox, oy) {
  for (let j = 0; j < src.height; j += 1) {
    for (let i = 0; i < src.width; i += 1) {
      const si = (j * src.width + i) * 4;
      if (!src.data[si + 3]) continue;
      const x = ox + i, y = oy + j;
      if (x < 0 || y < 0 || x >= dst.width || y >= dst.height) continue;
      src.data.copy(dst.data, (y * dst.width + x) * 4, si, si + 4);
    }
  }
}

const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const key = (d, i) => ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]).toString(16).padStart(6, '0');

// 정확히 같은 색만 바꾼다 (픽셀 아트라 팔레트가 정확히 떨어진다). 바꾼 픽셀 수를 색별로 돌려준다
export function recolor(img, map) {
  const table = Object.fromEntries(Object.entries(map).map(([from, to]) => [from.toLowerCase(), hex(to)]));
  const hits = {};
  for (let i = 0; i < img.data.length; i += 4) {
    if (!img.data[i + 3]) continue;
    const to = table[key(img.data, i)];
    if (!to) continue;
    const k = key(img.data, i);
    hits[k] = (hits[k] ?? 0) + 1;
    img.data[i] = to[0]; img.data[i + 1] = to[1]; img.data[i + 2] = to[2];
  }
  return hits;
}

export function setPx(img, x, y, h) {
  if (x < 0 || y < 0 || x >= img.width || y >= img.height) return;
  const [r, g, b] = hex(h);
  const i = (y * img.width + x) * 4;
  img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
}

export const alphaAt = (img, x, y) => (x < 0 || y < 0 || x >= img.width || y >= img.height ? 0 : img.data[(y * img.width + x) * 4 + 3]);

// 프레임(fx, fy, 16×16) 안에서 x열의 가장 위 불투명 픽셀 y (없으면 -1)
export function topAt(img, fx, fy, x, size = 16) {
  for (let y = 0; y < size; y += 1) if (alphaAt(img, fx + x, fy + y)) return y;
  return -1;
}
