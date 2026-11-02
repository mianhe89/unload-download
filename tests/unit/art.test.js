import { describe, it, expect } from 'vitest';
import { characters } from '../../content/characters/index.js';
import { composeSheet, composeFrame, FRAME } from '../../content/art/compose.js';
import { tilePixels, propPixels, TILE_NAMES, PROP_NAMES, TILE } from '../../content/art/tiles.js';
import { drawTitle, TITLE_W, TITLE_H } from '../../src/scenes/title/TitleIllustration.js';

const opaque = (px) => { let n = 0; for (let i = 3; i < px.length; i += 4) if (px[i]) n += 1; return n; };
const same = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);

describe('캐릭터 픽셀', () => {
  it.each(Object.keys(characters))('%s: 9프레임 시트가 그려진다', (id) => {
    const s = composeSheet(characters[id].art);
    expect(s.width).toBe(FRAME * 9);
    expect(s.height).toBe(FRAME);
    expect(opaque(s.data)).toBeGreaterThan(9 * 60);
  });

  it('모든 캐릭터의 정면 모습이 서로 다르다 (실루엣 원칙)', () => {
    const fronts = Object.entries(characters).map(([id, c]) => [id, composeFrame(c.art, 'down', 0)]);
    for (let i = 0; i < fronts.length; i += 1) {
      for (let j = i + 1; j < fronts.length; j += 1) {
        expect(same(fronts[i][1], fronts[j][1]), `${fronts[i][0]} = ${fronts[j][0]}`).toBe(false);
      }
    }
  });

  it('걷기 프레임은 서 있는 프레임과 다르다', () => {
    const art = characters.me.art;
    expect(same(composeFrame(art, 'down', 0), composeFrame(art, 'down', 1))).toBe(false);
  });
});

describe('타일·소품', () => {
  it.each(TILE_NAMES)('타일 %s는 꽉 찬 16×16', (k) => {
    expect(opaque(tilePixels(k, 3))).toBe(TILE * TILE);
  });

  it.each(PROP_NAMES)('소품 %s는 뭔가 그려져 있다', (k) => {
    expect(opaque(propPixels(k))).toBeGreaterThan(0);
  });

  it('같은 시드면 같은 타일', () => {
    expect(same(tilePixels('grass', 7), tilePixels('grass', 7))).toBe(true);
  });
});

describe('타이틀 일러스트', () => {
  const base = { date: new Date(2026, 9, 28, 22), started: true, chapter: 'prologue', phase: 'festival' };

  it('같은 날·같은 상태면 똑같이 그려진다', () => {
    expect(same(drawTitle(base).raster.d, drawTitle(base).raster.d)).toBe(true);
  });

  it('크기가 맞다', () => {
    const { raster } = drawTitle(base);
    expect(raster.w).toBe(TITLE_W);
    expect(raster.h).toBe(TITLE_H);
  });

  it('다른 날이면 다르게 그려진다', () => {
    const other = drawTitle({ ...base, date: new Date(2026, 9, 29, 22) });
    expect(same(drawTitle(base).raster.d, other.raster.d)).toBe(false);
  });

  it('시각이 하늘을 정한다', () => {
    expect(drawTitle({ ...base, date: new Date(2026, 9, 28, 13) }).tod).toBe('day');
    expect(drawTitle(base).tod).toBe('night');
  });

  it('누군가 지워지면 그림이 바뀐다', () => {
    const erased = drawTitle({ ...base, erased: ['hort'] });
    expect(same(drawTitle(base).raster.d, erased.raster.d)).toBe(false);
  });

  it('1장부터는 종탑 위에 그림자가 생긴다 (진행에 따라 바뀜)', () => {
    const ch1 = drawTitle({ ...base, chapter: 'chapter1', phase: 'aftermath' });
    expect(same(drawTitle(base).raster.d, ch1.raster.d)).toBe(false);
  });
});
