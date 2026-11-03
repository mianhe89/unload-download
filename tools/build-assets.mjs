// 에셋 빌드: assets-src(원본, CC0) → public/assets/gen(게임이 읽는 파일)
// - 캐릭터: 바탕 스프라이트를 재채색하고 픽셀을 덧그려 우리 캐릭터로 만든다 (content/characters/*.js의 sprite)
// - 종탑: 목조 회관에 종을 그려 넣은 변형본
// - 타일·소품·파티클: 원본 시트를 그대로 복사
// 사용: npm run assets  (npm run dev / build 전에 자동으로 돈다)
import { mkdirSync, rmSync, writeFileSync, copyFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { readPng, writePng, crop, recolor, setPx, topAt, alphaAt } from './lib/pixels.mjs';
import { characters } from '../content/characters/index.js';
import { SHEETS, ANIMATED, PARTICLES, SHADOW, FOG, CHAR, MONSTER_ART } from '../content/art/pack.js';
import { bodyVariant, BODY_SKINS } from './lib/body-edit.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'assets-src/ninja-adventure');
const OUT = join(ROOT, 'public/assets/gen');

// ── 픽셀 덧그리기 ───────────────────────────────────────────
const EDITS = {
  // 머리 위에 꽃 화관: 각 프레임의 머리 윗선 바로 아래 줄에 꽃과 잎을 번갈아
  crown(img) {
    const pattern = [['f07aa0', 3], ['5aa04a', 5], ['fff2a0', 7], ['5aa04a', 9], ['f07aa0', 11], ['fff2a0', 12]];
    forEachFrame(img, (fx, fy, dir) => {
      for (const [color, x0] of pattern) {
        const x = dir === 'left' ? x0 - 1 : dir === 'right' ? x0 + 1 : x0;
        const t = topAt(img, fx, fy, x);
        if (t >= 0) setPx(img, fx + x, fy + t + 1, color);
      }
    });
  },
  // 짙은 남색 망토: 어깨 아래로 몸통 양옆에 자락이 삐져나오고(옆모습은 등 쪽만), 뒷모습은 등이 망토로 덮인다.
  // 같은 바탕을 쓰는 다른 인물과 실루엣이 갈리게 한다(레온)
  cape(img, e = {}) {
    const CAPE = e.color ?? '1e2a52', DARK = e.dark ?? '121a34', LINE = '14141c';
    forEachFrame(img, (fx, fy, dir) => {
      for (let y = 8; y <= 14; y += 1) {
        let l = -1, r = -1;
        for (let x = 0; x < 16; x += 1) if (alphaAt(img, fx + x, fy + y)) { if (l < 0) l = x; r = x; }
        if (l < 0) continue;
        const side = (x, inner) => {
          if (alphaAt(img, fx + x, fy + y)) return;
          setPx(img, fx + x, fy + y, inner ? CAPE : LINE);
        };
        const back = dir === 'up', left = dir === 'left', right = dir === 'right';
        // 옆모습은 등 쪽(오른쪽을 보면 왼쪽)으로만 자락이 나온다
        if (!right) { side(l - 1, true); side(l - 2, false); }
        if (!left) { side(r + 1, true); side(r + 2, false); }
        // 뒷모습: 등을 망토로 덮는다 (외곽선 안쪽만)
        if (back) for (let x = l + 1; x < r; x += 1) setPx(img, fx + x, fy + y, y >= 13 ? DARK : CAPE);
      }
    });
  },
  // 아래턱에서 위로 솟은 하얀 엄니 두 개(오크). 앞모습은 양쪽, 옆모습은 앞쪽 하나, 뒷모습은 없다. broken이면 오른쪽 엄니가 부러졌다
  tusks(img, e = {}) {
    const TUSK = 'f4eedc';
    forEachFrame(img, (fx, fy, dir) => {
      if (dir === 'up') return;
      const xs = dir === 'down' ? [5, 10] : dir === 'left' ? [4] : [11];
      for (const x of xs) {
        // 그 열의 얼굴 아래쪽(머리 윗선에서 9줄 아래)쯤에 2칸 엄니
        const t = topAt(img, fx, fy, x);
        if (t < 0) continue;
        const y = Math.min(fy + 15, fy + t + 9);
        const broken = e.broken && x === xs[xs.length - 1] && dir === 'down';
        setPx(img, fx + x, y, TUSK);
        if (!broken) setPx(img, fx + x, y - 1, TUSK);
      }
    });
  },
  // 무녀의 머리띠: 머리 윗선 두 줄 아래로 붉은·흰 끈이 번갈아 지나고, 뒤로 끈 두 가닥이 늘어진다(세이)
  headband(img, e = {}) {
    const RED = e.color ?? 'd23a3a', WHITE = 'f4f0e8';
    forEachFrame(img, (fx, fy, dir) => {
      for (let x = 2; x < 14; x += 1) {
        const t = topAt(img, fx, fy, x);
        if (t < 0) continue;
        if (alphaAt(img, fx + x, fy + t + 2)) setPx(img, fx + x, fy + t + 2, x % 3 ? RED : WHITE);
      }
      // 뒷모습·옆모습: 뒤로 늘어진 끈
      const tail = dir === 'up' ? [7, 8] : dir === 'left' ? [12] : dir === 'right' ? [3] : [];
      for (const x of tail) {
        const t = topAt(img, fx, fy, x);
        if (t >= 0) for (let k = 3; k <= 6; k += 1) setPx(img, fx + x, fy + t + k, RED);
      }
    });
  },
  // 모자 옆에 꽂은 붉은 깃털 (외곽선 포함)
  feather(img) {
    forEachFrame(img, (fx, fy, dir) => {
      const x = dir === 'left' ? 4 : 11;
      const s = dir === 'left' ? -1 : 1;
      const t = topAt(img, fx, fy, x);
      if (t < 0) return;
      if (t < 4) {
        // 위에 여백이 없으면 모자 위에 깃털을 눕혀 그린다
        [[0, 1], [s, 1], [s, 2], [2 * s, 2]].forEach(([dx, dy]) => setPx(img, fx + x + dx, fy + t + dy, 'e05a4a'));
        setPx(img, fx + x + 2 * s, fy + t + 1, 'f2a07a');
        return;
      }
      const feather = [[0, -1], [0, -2], [s, -3]];
      const outline = [[-s, -1], [-s, -2], [0, -3], [s, -4], [2 * s, -3], [s, -2]];
      for (const [dx, dy] of outline) if (!alphaAt(img, fx + x + dx, fy + t + dy)) setPx(img, fx + x + dx, fy + t + dy, '141b1b');
      for (const [dx, dy] of feather) setPx(img, fx + x + dx, fy + t + dy, 'e05a4a');
    });
  },
};

function forEachFrame(img, fn) {
  const dirs = Object.keys(CHAR.dirs);
  const rows = Math.floor(img.height / CHAR.frame);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < CHAR.cols; col += 1) fn(col * CHAR.frame, row * CHAR.frame, dirs[col], row);
  }
}

// 종탑: 회관 지붕 가운데에 종루(어두운 창 + 금색 종)를 그린다
function buildBellTower() {
  const house = readPng(join(SRC, SHEETS.house));
  const img = crop(house, 400, 224, 64, 80);
  const cx = 32, top = 14;
  // 종루 창 (외곽선 + 어두운 안쪽)
  for (let y = top - 1; y <= top + 11; y += 1) for (let x = cx - 7; x <= cx + 6; x += 1) setPx(img, x, y, '141b1b');
  for (let y = top; y <= top + 10; y += 1) for (let x = cx - 6; x <= cx + 5; x += 1) setPx(img, x, y, '2b212a');
  // 아치 모서리
  [[cx - 6, top], [cx + 5, top]].forEach(([x, y]) => setPx(img, x, y, '141b1b'));
  // 종: 위가 좁고 아래가 넓은 금색 종 + 추
  const bell = [
    [0, -2, 2], [1, -3, 3], [2, -3, 3], [3, -4, 4], [4, -4, 4], [5, -4, 4], [6, -5, 5],
  ];
  for (const [dy, x0, x1] of bell) for (let x = x0; x < x1; x += 1) setPx(img, cx + x, top + 2 + dy, x < 0 ? 'e8b84a' : 'c8902a');
  for (let x = -5; x < 5; x += 1) setPx(img, cx + x, top + 8, '8a5a1e');
  setPx(img, cx - 1, top + 9, 'c8902a'); setPx(img, cx, top + 9, 'c8902a');
  setPx(img, cx - 2, top + 3, 'fff2a0'); // 반짝임
  // 종을 거는 들보
  for (let x = -6; x <= 5; x += 1) setPx(img, cx + x, top + 1, '5a3a24');
  return img;
}

// ── 빌드 ─────────────────────────────────────────────────
export function buildAssets({ quiet = false } = {}) {
  const log = (...a) => { if (!quiet) console.log(...a); };
  if (existsSync(OUT)) rmSync(OUT, { recursive: true });
  for (const d of ['char', 'face', 'sheets', 'anim', 'fx', 'mon']) mkdirSync(join(OUT, d), { recursive: true });

  const manifest = { chars: {}, faces: {}, sheets: {}, anim: {}, fx: {}, mon: {}, report: {} };

  for (const [id, c] of Object.entries(characters)) {
    const s = c.sprite;
    if (!s) continue;
    const base = join(SRC, 'Actor/Characters', s.base);
    const sheet = readPng(join(base, 'SpriteSheet.png'));
    const face = readPng(join(base, 'Faceset.png'));
    const hits = recolor(sheet, s.recolor ?? {});
    recolor(face, s.recolor ?? {});
    for (const e of s.edits ?? []) {
      if (!EDITS[e.type]) throw new Error(`${id}: 알 수 없는 편집 ${e.type}`);
      EDITS[e.type](sheet, e);
    }
    // 바꾸려던 색이 원본에 없으면 오타일 가능성이 높다
    const missing = Object.keys(s.recolor ?? {}).filter((k) => !hits[k.toLowerCase()]);
    manifest.report[id] = { base: s.base, recolored: hits, missing };
    writePng(join(OUT, 'char', `${id}.png`), sheet);
    writePng(join(OUT, 'face', `${id}.png`), face);
    manifest.chars[id] = `char/${id}.png`;
    manifest.faces[id] = `face/${id}.png`;
    // 주인공은 체형별 도트도 만든다 (me@thin, me@muscle, me@chubby)
    if (id === 'me') for (const b of BODY_SKINS) {
      writePng(join(OUT, 'char', `me@${b}.png`), bodyVariant(sheet, b));
      manifest.chars[`me@${b}`] = `char/me@${b}.png`;
    }
  }

  for (const [key, rel] of Object.entries(SHEETS)) {
    copyFileSync(join(SRC, rel), join(OUT, 'sheets', `${key}.png`));
    manifest.sheets[key] = `sheets/${key}.png`;
  }
  writePng(join(OUT, 'sheets', 'belltower.png'), buildBellTower());
  manifest.sheets['gen:belltower'] = 'sheets/belltower.png';

  for (const [key, m] of Object.entries(MONSTER_ART)) {
    if (m.recolor) { const img = readPng(join(SRC, m.src)); recolor(img, m.recolor); writePng(join(OUT, 'mon', `${key}.png`), img); }
    else copyFileSync(join(SRC, m.src), join(OUT, 'mon', `${key}.png`));
    manifest.mon[key] = `mon/${key}.png`;
  }
  for (const [key, a] of Object.entries(ANIMATED)) {
    copyFileSync(join(SRC, a.src), join(OUT, 'anim', `${key}.png`));
    manifest.anim[key] = `anim/${key}.png`;
  }
  for (const [key, p] of Object.entries(PARTICLES)) {
    copyFileSync(join(SRC, p.src), join(OUT, 'fx', `${key}.png`));
    manifest.fx[key] = `fx/${key}.png`;
  }
  copyFileSync(join(SRC, SHADOW), join(OUT, 'fx', 'shadow.png'));
  manifest.fx.shadow = 'fx/shadow.png';
  copyFileSync(join(SRC, FOG), join(OUT, 'fx', 'fog.png'));
  manifest.fx.fog = 'fx/fog.png';

  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const warn = Object.entries(manifest.report).filter(([, r]) => r.missing.length);
  for (const [id, r] of warn) log(`경고: ${id}(${r.base})에 없는 색을 바꾸려 함: ${r.missing.join(', ')}`);
  log(`에셋 빌드 완료 → public/assets/gen (캐릭터 ${Object.keys(manifest.chars).length}명)`);
  return manifest;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) buildAssets();
