// 생활: 우물에서 물을 길으면 몸이 변하고, C로 스테이터스 창을 본다
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

test('우물에서 E → 체중·근육이 변하고, 스테이터스 창에 보인다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Field'));
  const before = await page.evaluate(() => ({ ...window.__ud.run.life }));

  await page.evaluate(() => { const pl = window.__game.scene.getScene('Field').player; pl.sprite.x = 8 * 16 + 8; pl.sprite.y = 26 * 16 + 14; });
  await page.waitForTimeout(400);
  await page.keyboard.down('e');
  await page.waitForFunction((w) => window.__ud.run.life.muscle > w, before.muscle, { timeout: 5000 });
  await page.keyboard.up('e');
  const after = await page.evaluate(() => window.__ud.run.life);
  expect(after.weight).toBeLessThan(before.weight);
  expect(after.mind.diligent).toBeGreaterThan(before.mind.diligent);

  await page.waitForTimeout(600);
  await page.keyboard.press('c');
  await page.waitForFunction(() => window.__game.scene.getScene('UI').status.open);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/status.png` });
  const text = await page.evaluate(() => window.__game.scene.getScene('UI').status.body.text);
  expect(text).toContain('체중');
  expect(text).toContain('마음가짐');
  expect(errors).toEqual([]);
});
