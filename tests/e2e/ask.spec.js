// 바깥을 향한 질문: 이 게임에서 유일하게 선택지가 뜬다. 고른 답이 세이브에 남는다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog } from './game.js';

test('물레방아 마을의 정리자: 선택지에서 고른 답이 플래그로 남는다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter4', 'mill'); ['ch4.departed', 'ch4.sei_joined', 'mill.alma'].forEach((f) => u.setFlag(f)); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter4', phase: 'mill', entry: 'w', back: { chapter: 'chapter4', phase: 'muster', time: 'day' } }); });
  await waitField(page, 'mill');
  await skipDialog(page);
  await page.evaluate(() => { window.__game.scene.getScene('Field').cutscene.play('mill.keeper'); }); // 장면이 끝나길 기다리지 않는다
  for (let i = 0; i < 60 && !(await page.evaluate(() => window.__game.scene.getScene('UI').choice.open)); i += 1) { await page.keyboard.press('Space'); await page.waitForTimeout(150); }
  expect(await page.evaluate(() => window.__game.scene.getScene('UI').choice.open)).toBe(true);
  await page.keyboard.press('s');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(200);
  const flags = await page.evaluate(() => Object.keys(window.__ud.run.flags).filter((f) => f.startsWith('ask.')));
  expect(flags).toEqual(expect.arrayContaining(['ask.keeper.count', 'ask.keeper.count.1']));
  expect(errors).toEqual([]);
});
