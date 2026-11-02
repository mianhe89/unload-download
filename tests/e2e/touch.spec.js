// 휴대폰: 터치 기기에선 조이스틱과 E·C 버튼이 나오고, 조이스틱으로 걷는다
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

test.use({ hasTouch: true, isMobile: true, viewport: { width: 844, height: 390 } });

test('조이스틱을 오른쪽으로 끌면 오른쪽으로 걷고, C 버튼으로 상태 창', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Field') && window.__game.scene.getScene('UI').touch);
  const x0 = await page.evaluate(() => window.__game.scene.getScene('Field').player.x);
  const r = await page.evaluate(() => {
    const c = window.__game.canvas.getBoundingClientRect(); const k = c.width / window.__game.scale.width;
    const j = window.__game.scene.getScene('UI').touch.stick;
    return { x: c.left + j.x * k, y: c.top + j.y * k, k, w: window.__game.scale.width, h: window.__game.scale.height, left: c.left, top: c.top };
  });
  await page.mouse.move(r.x, r.y);
  await page.mouse.down();
  await page.mouse.move(r.x + 40, r.y, { steps: 5 });
  await page.waitForFunction((x) => window.__game.scene.getScene('Field').player.x > x + 20, x0, { timeout: 10_000 });
  await page.mouse.up();

  // C 버튼 (오른쪽 아래에서 두 번째)
  const s = r.w / 960;
  await page.mouse.click(r.left + (r.w - 160 * s) * r.k, r.top + (r.h - 80 * s) * r.k);
  await page.waitForFunction(() => window.__game.scene.getScene('UI').status.open);
  expect(errors).toEqual([]);
});
