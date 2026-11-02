// 행동 파밍: 깊은 숲에서 나무를 베면 사라지고, 그 뒤로 엘프를 만날 수 없다
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

const goArea = (page, at) => page.evaluate((a) => {
  const g = window.__game;
  g.scene.stop('Title'); g.scene.stop('Area');
  g.scene.start('Area', { layer: 'surface', at: a, entry: 'center', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } });
}, at);

test('나무를 베면 사라지고 목재가 쌓인다. 숲을 벤 뒤로는 엘프가 없다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); });

  await goArea(page, [2, 12]);
  await page.waitForFunction(() => window.__game.scene.getScene('Area').key === 'surface:2,12' && window.__game.scene.isActive('Area'));
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').traveler?.id)).toBe('elf');

  await goArea(page, [2, 10]);
  await page.waitForFunction(() => window.__game.scene.getScene('Area').key === 'surface:2,10' && window.__game.scene.getScene('Area').farmables?.length);
  const before = await page.evaluate(() => window.__game.scene.getScene('Area').farmables.length);
  await page.evaluate(() => { const a = window.__game.scene.getScene('Area'); const o = a.farmables.find((f) => f.action === 'chop'); a.player.sprite.x = o.x; a.player.sprite.y = o.y + 8; });
  await page.waitForTimeout(300);
  await page.keyboard.down('e');
  await page.waitForFunction(() => window.__ud.run.farm.items.wood === 1, null, { timeout: 5000 });
  await page.keyboard.up('e');
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').farmables.length)).toBe(before - 1);

  // 다시 와도 그 나무는 없다
  await goArea(page, [2, 10]);
  await page.waitForFunction(() => window.__game.scene.getScene('Area').farmables?.length);
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').farmables.length)).toBe(before - 1);

  // 엘프 마을: 이제 엘프가 없다
  await goArea(page, [2, 12]);
  await page.waitForFunction(() => window.__game.scene.getScene('Area').key === 'surface:2,12' && window.__game.scene.isActive('Area'));
  await page.waitForTimeout(300);
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').traveler?.id ?? null)).toBe(null);
  expect(errors).toEqual([]);
});
