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
import { EMOTES, emoteFile } from '../content/art/emotes.js';
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
// 침대 (16×28): 팩(이 리포에 든 부분)에 침대가 없어 팩 색과 외곽선에 맞춰 찍는다. 나무 머리판·베개·이불·발판
function buildFurniture() {
  const img = { width: 16, height: 28, data: Buffer.alloc(16 * 28 * 4) };
  const rows = [
    '..dddddddddddd..', '.dwwwwwwwwwwwwd.', '.dwWWWWWWWWWWwd.', '.dwwwwwwwwwwwwd.',
    '.dsppppppppppsd.', '.dspPPPPPPPPpsd.', '.dspPPPPPPPPpsd.', '.dsppppppppppsd.', '.dssssssssssssd.',
    '.dSSSSSSSSSSSSd.', '.dbbbbbbbbbbbbd.', '.dbBBbbbbbbBBbd.', '.dbbbbbbbbbbbbd.', '.dbbbbBBBBbbbbd.',
    '.dbbbbbbbbbbbbd.', '.dbBBbbbbbbBBbd.', '.dbbbbbbbbbbbbd.', '.dbbbbBBBBbbbbd.', '.dbbbbbbbbbbbbd.',
    '.dbbbbbbbbbbbbd.', '.dBbbbbbbbbbbBd.', '.dBBBBBBBBBBBBd.', '.dwwwwwwwwwwwwd.', '.dwWWWWWWWWWWwd.',
    '.dwwwwwwwwwwwwd.', '..dddddddddddd..', '..dd........dd..', '................',
  ];
  const pal = { d: '141b1b', w: 'b8683a', W: 'd88a4e', s: 'f4ecdc', S: 'd8ccb4', p: 'fbf6ec', P: 'e8dfcc', b: '5a78b0', B: '43609a' };
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (pal[ch]) setPx(img, x, y, pal[ch]); }));
  return img;
}

// 종탑 (48×112): 팩에 종탑이 없어 팩의 색·외곽선으로 찍는다. 아래부터 돌 기단과 아치 문, 벽돌 탑신과 좁은 창,
// 꼭대기의 아치 종루(금빛 종이 걸려 있다), 뾰족한 주황 지붕과 꼭대기 장식
function buildBellTower() {
  const W = 48, H = 112;
  const img = { width: W, height: H, data: Buffer.alloc(W * H * 4) };
  const P = { o: '141b1b', s1: 'd8c8a8', s2: 'b8a888', s3: '968670', s4: '74665a', w1: '8a5a34', w2: '6a4226', d: '2a2026',
    r1: 'f08a46', r2: 'd06a2e', r3: 'a84e22', g1: 'f8d870', g2: 'd8a040', g3: 'a87428', b: '5a3a24' };
  const px = (x, y, c) => { if (x >= 0 && y >= 0 && x < W && y < H) setPx(img, x, y, P[c] ?? c); };
  const rect = (x, y, w, h, c) => { for (let j = y; j < y + h; j += 1) for (let i = x; i < x + w; i += 1) px(i, j, c); };
  // 기단 (넓은 돌, y 96~111)
  rect(2, 96, 44, 16, 's2');
  for (let y = 98; y < 111; y += 4) for (let x = 3 + ((y / 4) % 2) * 4; x < 45; x += 8) rect(x, y, Math.min(6, 46 - x), 3, 's1');
  rect(2, 110, 44, 2, 's3');
  // 아치 문 (가운데, 12×14)
  rect(18, 98, 12, 14, 'w2'); rect(19, 99, 10, 13, 'w1');
  rect(20, 97, 8, 1, 'w2'); px(23, 104, 'g2'); px(24, 104, 'g2');
  for (let y = 99; y < 112; y += 1) px(24, y, 'w2');
  // 탑신 (벽돌, y 50~95, 폭 36)
  rect(6, 50, 36, 46, 's2');
  for (let y = 50; y < 96; y += 3) for (let x = 6 + ((y / 3) % 2) * 3; x < 42; x += 6) { rect(x, y, Math.min(5, 42 - x), 2, (x + y) % 4 ? 's1' : 's2'); }
  rect(6, 50, 3, 46, 's3'); rect(39, 50, 3, 46, 's4');
  // 좁은 창 두 개
  rect(22, 60, 4, 9, 'd'); rect(22, 76, 4, 9, 'd'); px(23, 60, 's3'); px(24, 76, 's3');
  // 띠돌 (종루 아래)
  rect(4, 46, 40, 4, 's1'); rect(4, 49, 40, 1, 's3');
  // 종루 (y 24~45): 양옆 돌기둥, 가운데 아치 구멍, 금빛 종
  rect(6, 24, 36, 22, 's2');
  rect(6, 24, 6, 22, 's1'); rect(36, 24, 6, 22, 's3');
  rect(13, 28, 22, 18, 'd');                 // 아치 안쪽 어둠
  rect(15, 26, 18, 2, 'd'); rect(17, 25, 14, 1, 'd');
  rect(13, 29, 22, 1, 'b');                  // 종을 거는 들보
  // 종: 위는 좁고 아래로 넓게
  const bell = [[0, 22, 26], [1, 21, 27], [2, 20, 28], [3, 20, 28], [4, 19, 29], [5, 19, 29], [6, 18, 30], [7, 18, 30], [8, 17, 31], [9, 17, 31]];
  for (const [dy, x0, x1] of bell) for (let x = x0; x < x1; x += 1) px(x, 31 + dy, x < 22 ? 'g1' : x < 27 ? 'g2' : 'g3');
  rect(17, 41, 14, 1, 'g3'); px(23, 42, 'g3'); px(24, 42, 'g3'); px(20, 33, 'ffffff');
  // 처마
  rect(2, 22, 44, 3, 'b'); rect(2, 24, 44, 1, '3a2618');
  // 지붕 (뾰족, y 4~21)
  for (let y = 4; y < 22; y += 1) {
    const half = Math.round(((y - 4) / 17) * 23) + 1;
    for (let x = 24 - half; x < 24 + half; x += 1) px(x, y, x < 24 - half / 3 ? 'r1' : x < 24 + half / 3 ? 'r2' : 'r3');
    if (y % 3 === 0) for (let x = 24 - half + 1; x < 24 + half - 1; x += 2) px(x, y, 'r3');
  }
  // 꼭대기 장식 (까마귀가 앉는 자리)
  rect(23, 0, 2, 5, 'b'); rect(21, 1, 6, 1, 'b');
  // 외곽선: 불투명한 칸 둘레를 어둡게
  const a = (x, y) => x >= 0 && y >= 0 && x < W && y < H && img.data[(y * W + x) * 4 + 3] > 0;
  const edge = [];
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) if (!a(x, y) && (a(x - 1, y) || a(x + 1, y) || a(x, y - 1) || a(x, y + 1))) edge.push([x, y]);
  // 그림 안쪽 가장자리를 외곽선으로 (그림 크기 안에서)
  for (let y = 0; y < H; y += 1) for (let x = 0; x < W; x += 1) if (a(x, y) && (!a(x - 1, y) || !a(x + 1, y) || !a(x, y - 1) || !a(x, y + 1))) px(x, y, 'o');
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
  writePng(join(OUT, 'sheets', 'furniture.png'), buildFurniture());
  manifest.sheets['gen:furniture'] = 'sheets/furniture.png';

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
  // 감정 말풍선 (content/art/emotes.js)
  mkdirSync(join(OUT, 'emote'), { recursive: true });
  manifest.emotes = {};
  for (const name of Object.keys(EMOTES)) {
    copyFileSync(join(SRC, emoteFile(name)), join(OUT, 'emote', `${name}.png`));
    manifest.emotes[name] = `emote/${name}.png`;
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
