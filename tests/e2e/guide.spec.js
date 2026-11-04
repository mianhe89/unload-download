// 길 안내: 목적지 별(작은 지도), 머리 위 이름
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, teleport } from './game.js';

test('1장: 작은 지도에 대장간 목적지가 찍히고, 가까운 사람 머리 위에 이름이 뜬다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.setFlag('done.keeper'); u.checkpoint('chapter1', 'aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await page.waitForTimeout(600);
  const info = await page.evaluate(() => window.__game.scene.getScene('Field').minimapInfo());
  expect(info.goal).toBeTruthy();
  await teleport(page, 22, 20);
  await page.waitForTimeout(400);
  const names = await page.evaluate(() => window.__game.scene.getScene('UI').names.pool.filter((t) => t.visible).map((t) => t.text));
  expect(names.length).toBeGreaterThan(0);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/guide.png` });
  expect(errors).toEqual([]);
});
