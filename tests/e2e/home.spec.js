// 우리 집: 문 앞에서 위로 걸어 들어가고, 짚 침대에서 E로 피로를 풀고, 문으로 나온다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, teleport } from './game.js';

test('집에 들어가 낮잠으로 피로를 풀고 나온다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); u.setLife({ ...u.run.life, fatigue: 80, last: {} }); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await teleport(page, 16, 27);
  await page.keyboard.down('w'); await page.waitForTimeout(500); await page.keyboard.up('w');
  await page.waitForFunction(() => window.__game.scene.getScene('Field').roomId === 'myhome', null, { timeout: 10_000 });
  await page.waitForTimeout(500);
  await teleport(page, 3, 3);
  await page.keyboard.down('e'); await page.waitForTimeout(120); await page.keyboard.up('e');
  await page.waitForTimeout(500);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/room.png` });
  expect(await page.evaluate(() => window.__ud.run.life.fatigue)).toBeLessThan(80);
  await teleport(page, 7, 9);
  await page.keyboard.down('s'); await page.waitForTimeout(700); await page.keyboard.up('s');
  await page.waitForFunction(() => { const f = window.__game.scene.getScene('Field'); return f.roomId === null && f.player?.sprite?.active; }, null, { timeout: 10_000 });
  expect(errors).toEqual([]);
});
