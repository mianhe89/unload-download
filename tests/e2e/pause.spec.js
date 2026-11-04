// ESC 메뉴: 옵션(소리) / 처음으로 가기(두 번 눌러 확인 → 타이틀)
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog } from './game.js';

test('ESC 메뉴에서 소리를 끄고, 처음으로 돌아간다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.setFlag('done.keeper'); u.checkpoint('chapter1', 'aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  const pause = () => page.evaluate(() => { const p = window.__game.scene.getScene('UI').pause; return { open: p.open, page: p.page }; });
  await page.keyboard.press('Escape');
  expect(await pause()).toEqual({ open: true, page: 'main' });
  await page.keyboard.press('Enter');            // 옵션
  expect((await pause()).page).toBe('options');
  await page.keyboard.press('Enter');            // 소리 켜기/끄기
  await page.keyboard.press('Escape');           // 옵션 → 메인
  expect((await pause()).page).toBe('main');
  await page.keyboard.press('s');                // 처음으로 가기
  await page.keyboard.press('Enter');
  await page.keyboard.press('Enter');            // 한 번 더
  await page.waitForFunction(() => window.__game.scene.isActive('Title'), null, { timeout: 10_000 });
  expect(errors).toEqual([]);
});
