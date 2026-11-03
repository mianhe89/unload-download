// CC0 팩 기반 에셋: 빌드 결과, 재채색·덧그리기, 물체 목록, 맵, 자동 타일
import { describe, it, expect, beforeAll } from 'vitest';
import { join } from 'node:path';
import { buildAssets } from '../../tools/build-assets.mjs';
import { readPng } from '../../tools/lib/pixels.mjs';
import { characters } from '../../content/characters/index.js';
import { OBJECTS, SHEETS, DIRT, CHAR } from '../../content/art/pack.js';
import * as village from '../../content/maps/village.js';
import { dirtQuarter } from '../../src/field/autotile.js';

const ROOT = join(import.meta.dirname, '../..');
const SRC = join(ROOT, 'assets-src/ninja-adventure');
const GEN = join(ROOT, 'public/assets/gen');

let manifest;
beforeAll(() => { manifest = buildAssets({ quiet: true }); });

const diffCount = (a, b) => { let n = 0; for (let i = 0; i < a.data.length; i += 4) if (a.data[i] !== b.data[i] || a.data[i + 1] !== b.data[i + 1] || a.data[i + 2] !== b.data[i + 2]) n += 1; return n; };

describe('에셋 빌드', () => {
  it('모든 캐릭터의 스프라이트시트와 얼굴이 나온다', () => {
    expect(Object.keys(manifest.chars).filter((k) => !k.includes('@')).sort()).toEqual(Object.keys(characters).sort());
    // 주인공 체형별 도트
    expect(Object.keys(manifest.chars).filter((k) => k.startsWith('me@')).sort()).toEqual(['me@chubby', 'me@muscle', 'me@thin']);
    for (const id of Object.keys(characters)) {
      const s = readPng(join(GEN, manifest.chars[id]));
      // 열은 늘 4방향. 줄은 대부분 7줄, 몇몇 바탕(Child, OldWoman)은 2줄 — 걷기 애니메이션은 있는 줄만 쓴다
      expect(s.width).toBe(CHAR.frame * CHAR.cols);
      expect(s.height % CHAR.frame).toBe(0);
      expect(s.height / CHAR.frame).toBeGreaterThanOrEqual(2);
    }
  });

  it.each(Object.keys(characters))('%s: 바꾸려는 색이 모두 원본에 있다 (오타 방지)', (id) => {
    expect(manifest.report[id].missing).toEqual([]);
  });

  it.each(Object.keys(characters))('%s: 원본과 실제로 달라졌다 (변형됨)', (id) => {
    const base = readPng(join(SRC, 'Actor/Characters', characters[id].sprite.base, 'SpriteSheet.png'));
    const out = readPng(join(GEN, manifest.chars[id]));
    expect(diffCount(base, out)).toBeGreaterThan(30);
  });

  it('두 캐릭터가 같은 바탕을 쓰지 않는다 (실루엣 원칙) — 같이 쓰려면 실루엣을 바꾸는 덧그림이 있어야 한다', () => {
    const plain = Object.values(characters).filter((c) => !c.sprite.shareBase);
    const bases = plain.map((c) => c.sprite.base);
    expect(new Set(bases).size).toBe(bases.length);
    for (const c of Object.values(characters).filter((x) => x.sprite.shareBase)) {
      expect(characters[c.sprite.shareBase]?.sprite.base, `${c.id}가 같이 쓰는 바탕`).toBe(c.sprite.base);
      expect(c.sprite.edits?.length, `${c.id}는 실루엣을 바꾸는 덧그림이 필요하다`).toBeGreaterThan(0);
    }
  });

  it('종탑은 회관 그림에 종을 그려 넣은 변형본이다', () => {
    const tower = readPng(join(GEN, manifest.sheets['gen:belltower']));
    expect([tower.width, tower.height]).toEqual([64, 80]);
    const house = readPng(join(SRC, SHEETS.house));
    // 같은 자리 원본과 비교해 종 부분이 달라야 한다
    let changed = 0;
    for (let y = 12; y < 26; y += 1) for (let x = 25; x < 39; x += 1) {
      const a = (y * 64 + x) * 4, b = ((224 + y) * house.width + 400 + x) * 4;
      if (tower.data[a] !== house.data[b]) changed += 1;
    }
    expect(changed).toBeGreaterThan(60);
  });

  it('원본 폴더에 라이선스 기록이 있다', async () => {
    const { readFileSync } = await import('node:fs');
    expect(readFileSync(join(SRC, 'LICENSE.md'), 'utf8')).toMatch(/CC0/);
  });
});

describe('물체 목록과 맵', () => {
  it.each(Object.entries(OBJECTS).filter(([, d]) => !d.sheet.startsWith('gen:')))('%s: 사각형이 시트 안에 있다', (name, def) => {
    const sheet = readPng(join(SRC, SHEETS[def.sheet]));
    const [x, y, w, h] = def.rect;
    expect(x + w).toBeLessThanOrEqual(sheet.width);
    expect(y + h).toBeLessThanOrEqual(sheet.height);
    if (def.foot) {
      const [fx, fy, fw, fh] = def.foot;
      expect(fx + fw).toBeLessThanOrEqual(w);
      expect(fy + fh).toBeLessThanOrEqual(h);
    }
  });

  it('바닥 크기가 맵 크기와 같고 흙/풀만 쓴다', () => {
    expect(village.terrain).toHaveLength(village.H);
    for (const row of village.terrain) expect(row).toMatch(new RegExp(`^[gd]{${village.W}}$`));
  });

  it('맵 가장자리(안개)는 걸어서 나갈 수 없다', () => {
    expect(village.isSolidTile(1, 15)).toBe(true);
    expect(village.isSolidTile(24, 1)).toBe(true);
    expect(village.isSolidTile(village.W - 2, 15)).toBe(true);
  });

  it('나무는 줄기만 막는다 (수관 아래로 지나갈 수 있음)', () => {
    const t = village.objects.find((o) => o.type === 'tree_big');
    const [, , w] = OBJECTS.tree_big.rect;
    const canopyX = t.at[0] * 16 + w / 2, canopyY = t.at[1] * 16 + 8;
    expect(village.isSolidPx(canopyX, canopyY)).toBe(false);
    const [fx, fy] = OBJECTS.tree_big.foot;
    expect(village.isSolidPx(t.at[0] * 16 + fx + 2, t.at[1] * 16 + fy + 2)).toBe(true);
  });

  it('모닥불은 막혀 있다', () => {
    expect(village.isSolidTile(village.bonfire.x, village.bonfire.y + 1)).toBe(true);
  });
});

describe('흙길 자동 타일', () => {
  const grid = (rows) => (x, y) => rows[y]?.[x] === 'd';

  it('흙 한가운데는 가운데 조각', () => {
    const isDirt = grid(['ddd', 'ddd', 'ddd']);
    for (const qx of [0, 1]) for (const qy of [0, 1]) expect(dirtQuarter(isDirt, 1, 1, qx, qy).kind).toBe('center');
  });

  it('외딴 흙 한 칸은 네 귀퉁이 모두 바깥 모서리', () => {
    const isDirt = grid(['...', '.d.', '...']);
    expect(dirtQuarter(isDirt, 1, 1, 0, 0)).toEqual({ kind: 'outer', key: 'tl' });
    expect(dirtQuarter(isDirt, 1, 1, 1, 1)).toEqual({ kind: 'outer', key: 'br' });
  });

  it('가로로 긴 길의 위쪽 사분면은 위 가장자리', () => {
    const isDirt = grid(['...', 'ddd', '...']);
    expect(dirtQuarter(isDirt, 1, 1, 0, 0)).toEqual({ kind: 'edge', key: 'top' });
    expect(dirtQuarter(isDirt, 1, 1, 1, 1)).toEqual({ kind: 'edge', key: 'bottom' });
  });

  it('세로 길의 왼쪽 사분면은 왼쪽 가장자리', () => {
    const isDirt = grid(['.d.', '.d.', '.d.']);
    expect(dirtQuarter(isDirt, 1, 1, 0, 0)).toEqual({ kind: 'edge', key: 'left' });
    expect(dirtQuarter(isDirt, 1, 1, 1, 0)).toEqual({ kind: 'edge', key: 'right' });
  });

  it('ㄱ자로 꺾이는 안쪽은 안쪽 모서리', () => {
    const isDirt = grid(['dd.', 'ddd', 'ddd']);
    // (1,1)의 오른쪽 위: 오른쪽·위는 흙인데 대각선(2,0)이 풀
    expect(dirtQuarter(isDirt, 1, 1, 1, 0)).toEqual({ kind: 'inner', key: 'tr' });
  });

  it('고른 조각이 모두 실제 타일 좌표로 이어진다', () => {
    for (const kind of ['outer', 'edge', 'inner']) for (const v of Object.values(DIRT[kind])) expect(v).toHaveLength(2);
    expect(DIRT.center.length).toBeGreaterThan(0);
  });
});
