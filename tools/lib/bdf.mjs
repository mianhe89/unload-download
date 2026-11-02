// BDF 비트맵 글꼴 읽기 (Galmuri11, OFL). 노드 도구에서 PNG에 글자를 찍을 때 쓴다.
import { readFileSync } from 'node:fs';

export function loadBdf(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const glyphs = new Map();
  let ascent = 14;
  for (let i = 0; i < lines.length; i += 1) {
    const l = lines[i];
    if (l.startsWith('FONT_ASCENT')) ascent = Number(l.split(' ')[1]);
    if (!l.startsWith('ENCODING')) continue;
    const code = Number(l.split(' ')[1]);
    let dw = 0, bbx = [0, 0, 0, 0], j = i + 1;
    for (; !lines[j].startsWith('BITMAP'); j += 1) {
      if (lines[j].startsWith('DWIDTH')) dw = Number(lines[j].split(' ')[1]);
      if (lines[j].startsWith('BBX')) bbx = lines[j].split(' ').slice(1).map(Number);
    }
    const rows = [];
    for (j += 1; !lines[j].startsWith('ENDCHAR'); j += 1) rows.push(parseInt(lines[j], 16));
    const bytes = Math.ceil(bbx[0] / 8) || 1;
    glyphs.set(code, { dw, w: bbx[0], h: bbx[1], ox: bbx[2], oy: bbx[3], rows, bits: bytes * 8 });
    i = j;
  }
  return { glyphs, ascent };
}

export const textWidth = (font, s) => [...s].reduce((w, ch) => w + (font.glyphs.get(ch.codePointAt(0))?.dw ?? 6), 0);

// img: { width, height, data }. (x, y) = 글줄 위쪽 왼쪽. outline: 테두리 색(가독성)
export function drawText(img, font, s, x, y, color, outline) {
  const put = (px, py, [r, g, b]) => {
    if (px < 0 || py < 0 || px >= img.width || py >= img.height) return;
    const i = (py * img.width + px) * 4;
    img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = 255;
  };
  const pass = (col, dx, dy) => {
    let cx = x;
    for (const ch of s) {
      const g = font.glyphs.get(ch.codePointAt(0));
      if (!g) { cx += 6; continue; }
      const top = y + font.ascent - g.oy - g.h;
      g.rows.forEach((row, ry) => {
        for (let bx = 0; bx < g.w; bx += 1) if (row & (1 << (g.bits - 1 - bx))) put(cx + g.ox + bx + dx, top + ry + dy, col);
      });
      cx += g.dw;
    }
  };
  if (outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) pass(outline, dx, dy);
  pass(color, 0, 0);
}
