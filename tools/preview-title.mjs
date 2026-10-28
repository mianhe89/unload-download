// 타이틀 일러스트 미리보기: 여러 날짜·시각·진행 상태를 한 장에 모은다
// 사용: node tools/preview-title.mjs [출력경로]
import { writeFileSync } from 'node:fs';
import { png, upscale } from './png.mjs';
import { drawTitle, TITLE_W, TITLE_H } from '../src/scenes/title/TitleIllustration.js';

const out = process.argv[2] ?? 'title-preview.png';
const cases = [
  { label: '처음 실행 · 밤', date: new Date(2026, 9, 28, 22), started: false },
  { label: '축제 중 · 노을', date: new Date(2026, 9, 29, 18), started: true, phase: 'festival', chapter: 'prologue' },
  { label: '1명 지워짐 · 낮', date: new Date(2026, 10, 2, 13), started: true, chapter: 'prologue', phase: 'morning', erased: ['hort'], loads: 1 },
  { label: '1장 · 3명 지워짐 · 밤 · 겨울', date: new Date(2027, 0, 14, 23), started: true, chapter: 'chapter1', phase: 'aftermath', erased: ['hort', 'rine', 'per'], loads: 4 },
];
const W = TITLE_W * 2 + 6, H = TITLE_H * 2 + 6;
const img = new Uint8ClampedArray(W * H * 4).fill(30);
cases.forEach((c, i) => {
  const { raster, weather, tod, season } = drawTitle(c);
  const ox = (i % 2) * (TITLE_W + 6), oy = Math.floor(i / 2) * (TITLE_H + 6);
  for (let y = 0; y < TITLE_H; y += 1) for (let x = 0; x < TITLE_W; x += 1) {
    const si = (y * TITLE_W + x) * 4, di = ((oy + y) * W + ox + x) * 4;
    img[di] = raster.d[si]; img[di + 1] = raster.d[si + 1]; img[di + 2] = raster.d[si + 2]; img[di + 3] = 255;
  }
  console.log(`${i + 1}. ${c.label} → ${tod}/${season}/${weather}`);
});
const { raw, width, height } = upscale(img, W, H, 2);
writeFileSync(out, png(width, height, raw));
console.log(out);
