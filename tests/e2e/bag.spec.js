// 가방: I로 열고, 곁에 있는 사람에게 Enter로 꿀빵을 건넨다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog } from './game.js';

test('가방에서 꿀빵을 곁의 사람에게 건넨다 (하루 한 번)', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setBag({ items: { honeybread: 2 }, gifted: {} }); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); const n = f.npcs.farmer; f.player.sprite.x = n.x; f.player.sprite.y = n.y + 14; });
  await page.waitForTimeout(200);
  await page.keyboard.press('i');
  await page.waitForFunction(() => window.__game.scene.getScene('UI').bag.open);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(300);
  const bag = await page.evaluate(() => window.__ud.run.bag);
  expect(bag.items.honeybread).toBe(1);
  expect(bag.gifted.farmer).toBeDefined();
  expect(await page.evaluate(() => window.__game.scene.getScene('UI').bag.open)).toBe(false);
  expect(errors).toEqual([]);
});
