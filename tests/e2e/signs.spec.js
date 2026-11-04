// 건물 이름 명패: 문 앞에 가면 이름이 뜬다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, teleport } from './game.js';

test('빵집 문 앞에 가면 「호르트네 빵집」이 뜬다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await teleport(page, 16, 16);
  await page.waitForTimeout(600);
  const sign = await page.evaluate(() => { const s = window.__game.scene.getScene('UI').sign; return { on: s.box.visible, text: s.t.text }; });
  expect(sign).toEqual({ on: true, text: '호르트네 빵집' });
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/bakery.png` });
  expect(errors).toEqual([]);
});
