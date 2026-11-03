// 2장: 안개 길의 보스, 길 맵 → 옆 마을, 옆 마을의 사람들, 마을 위 전투(견습 시험)
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField } from './game.js';

const SHOTS = process.env.SHOTS;
const start = (page, fn, arg) => page.evaluate(fn, arg);

test('안개 길에 길 잃은 기사가 서 있고, 옆 마을 칸으로 가면 옆 마을 필드로 들어간다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, () => {
    const g = window.__game, u = window.__ud;
    u.startNew(); u.checkpoint('chapter2', 'fogroad'); u.setFlag('ch2.started');
    g.scene.stop('Title');
    g.scene.start('Area', { layer: 'surface', at: [5, 10], entry: 'e', back: { chapter: 'chapter2', phase: 'fogroad', time: 'day' } });
  });
  await page.waitForFunction(() => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').player);
  const enc = await page.evaluate(() => window.__game.scene.getScene('Area').encounter);
  expect(enc?.enemies).toEqual(['lostknight']);
  expect(enc?.party).toEqual(['me', 'lu']);

  // 보스를 이긴 셈 치고, 옆 마을 칸으로
  await start(page, () => {
    window.__ud.setFlag('ch2.knight_beaten');
    const a = window.__game.scene.getScene('Area');
    a.scene.restart({ layer: 'surface', at: [5, 9], entry: 'e', back: { chapter: 'chapter2', phase: 'fogroad', time: 'day' } });
  });
  await page.waitForTimeout(800);
  await start(page, () => window.__game.scene.getScene('Area').go({ dir: 'w', to: 'surface:4,9', at: [4, 9] }));
  await waitField(page, 'neighbor');
  const s = await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); return { map: f.mapDef.id, npcs: Object.keys(f.npcs) }; });
  expect(s.map).toBe('neighbor');
  if (SHOTS) await page.screenshot({ path: `${SHOTS}/neighbor.png` });
  expect(errors).toEqual([]);
});

test('길 잃은 기사·레온 전투가 인물 도트로 그려진다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  for (const [enemies, party] of [[['lostknight'], ['me', 'lu']], [['leon'], ['me']], [['tork', 'orc'], ['me', 'selena', 'lu']]]) {
    await start(page, ([en, pa]) => {
      const g = window.__game, u = window.__ud;
      u.startNew(); g.scene.stop('Title'); g.scene.stop('Battle');
      g.scene.start('Battle', { enemies: en, party: pa, seed: 1, from: { layer: 'surface', at: [7, 9], key: 'surface:7,9', back: { chapter: 'chapter2', phase: 'fogroad', time: 'day' } } });
    }, [enemies, party]);
    await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible, null, { timeout: 15_000 });
    if (SHOTS) await page.screenshot({ path: `${SHOTS}/battle-${enemies[0]}.png` });
  }
  expect(errors).toEqual([]);
});
