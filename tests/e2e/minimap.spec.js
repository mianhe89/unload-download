// 작은 지도: 마을에서 늘 보이고, 할 일이 남은 사람은 노란 점, +/-로 넓게·좁게
import { test, expect } from '@playwright/test';
import { openGame, wipe, clickMenu, waitField, skipDialog } from './game.js';

test('작은 지도가 보이고 확대·축소된다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await clickMenu(page, 'START');
  await waitField(page, 'prep');
  await skipDialog(page);
  await page.waitForTimeout(500);
  const m = () => page.evaluate(() => { const mm = window.__game.scene.getScene('UI').minimap; return { visible: mm.box.visible, level: mm.level, key: mm.mapKey }; });
  const a = await m();
  expect(a.visible).toBe(true);
  expect(a.key).toBe('village');
  await page.keyboard.press('Minus');
  expect((await m()).level).toBe(a.level + 1);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/minimap.png` });
  expect(errors).toEqual([]);
});

test('M: 전체 지도가 열리고 닫힌다 (열린 동안 주인공은 멈춘다)', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await page.keyboard.press('m');
  await page.waitForFunction(() => window.__game.scene.getScene('UI').worldmap.open);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/worldmap.png` });
  expect(await page.evaluate(() => window.__game.scene.getScene('Field').frozen ?? true)).toBeTruthy();
  await page.keyboard.press('m');
  await page.waitForFunction(() => !window.__game.scene.getScene('UI').worldmap.open);
  expect(errors).toEqual([]);
});
