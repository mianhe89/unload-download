// 가게: 그레타에게 말을 걸면 가게 창이 열리고, 사면 주머니가 줄고 가방에 들어간다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, advanceUntil, teleport } from './game.js';

test('그레타네 잡화점에서 붕대를 산다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await advanceUntil(page, () => { const f = window.__game.scene.getScene('Field'); return !f.cutscene.busy && f.npcs.greta; }, null, 60_000, '그레타');
  const at = await page.evaluate(() => { const n = window.__game.scene.getScene('Field').npcs.greta; return [Math.floor(n.x / 16), Math.floor(n.y / 16)]; });
  await teleport(page, at[0], at[1] + 1);
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__game.scene.getScene('UI').shop.open, null, { timeout: 10_000 });
  const purse0 = await page.evaluate(() => window.__ud.run.shop.purse);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/shop.png` });
  await page.keyboard.press('Enter');
  expect(await page.evaluate(() => window.__ud.run.shop.purse)).toBeLessThan(purse0);
  expect(await page.evaluate(() => window.__ud.run.farm.items.bandage)).toBe(1);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/shop2.png` });
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => window.__game.scene.getScene('UI').shop.open)).toBe(false);
  expect(errors).toEqual([]);
});
