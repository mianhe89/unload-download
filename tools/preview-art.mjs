// 캐릭터·타일 미리보기 PNG를 만든다 (브라우저 없이 아트 확인용)
// 사용: node tools/preview-art.mjs [출력경로] [배율]
import { writeFileSync } from 'node:fs';
import { png, upscale } from './png.mjs';
import { characters } from '../content/characters/index.js';
import { composeSheet, blit, FRAME } from '../content/art/compose.js';
import { tilePixels, propPixels, TILE_NAMES, PROP_NAMES, TILE } from '../content/art/tiles.js';

const out = process.argv[2] ?? 'art-preview.png';
const scale = Number(process.argv[3] ?? 6);

const ids = Object.keys(characters);
const W = Math.max(FRAME * 9, TILE * Math.max(TILE_NAMES.length, PROP_NAMES.length)) + 8;
const H = ids.length * (FRAME + 2) + (TILE + 4) * 2 + 4;
const img = new Uint8ClampedArray(W * H * 4);
for (let i = 0; i < img.length; i += 4) { img[i] = 40; img[i + 1] = 38; img[i + 2] = 48; img[i + 3] = 255; }

ids.forEach((id, row) => {
  const sheet = composeSheet(characters[id].art);
  blit(img, W, sheet.data, sheet.width, sheet.height, 4, 2 + row * (FRAME + 2));
});
let y = ids.length * (FRAME + 2) + 4;
TILE_NAMES.forEach((k, i) => blit(img, W, tilePixels(k, 3), TILE, TILE, 4 + i * TILE, y));
y += TILE + 4;
PROP_NAMES.forEach((k, i) => blit(img, W, propPixels(k), TILE, TILE, 4 + i * TILE, y));

// 확대
const { raw, width, height } = upscale(img, W, H, scale);
writeFileSync(out, png(width, height, raw));
console.log(`${out} (${width}x${height}) — 행 순서: ${ids.join(', ')}`);
