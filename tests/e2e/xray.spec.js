// 가려진 사람 보이기: 나무 뒤에 들어가면 흐린 실루엣이 그 위에 겹친다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, teleport } from './game.js';

test('나무 뒤에 서면 실루엣이 보인다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.setFlag('done.keeper'); u.checkpoint('chapter1', 'aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await teleport(page, 7, 7); // 큰 나무(6,6) 뒤
  await page.waitForTimeout(400);
  const ghost = await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); return f.xray.ghosts.get(f.player)?.visible ?? false; });
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/xray.png` });
  expect(ghost).toBe(true);
  expect(errors).toEqual([]);
});
