// 마을 동물: 마당에 있고, 건드리면 운다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, teleport } from './game.js';

test('마을의 고양이·개·닭·돼지·소가 있고, 소를 건드리면 운다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  const species = await page.evaluate(() => window.__game.scene.getScene('Field').animals.list.map((a) => a.species));
  expect(species).toEqual(expect.arrayContaining(['cat', 'dog', 'chicken', 'pig', 'cow']));
  await teleport(page, 7, 22);
  await page.waitForTimeout(600);
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/farmyard.png` });
  await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); const c = f.animals.list.find((a) => a.id === 'cow'); f.player.sprite.x = c.x; f.player.sprite.y = c.y + 10; c.home = { x: c.x, y: c.y }; c.radius = 0; for (const o of Object.values(f.npcs)) if (Math.hypot(o.x - c.x, o.y - c.y) < 64) o.sprite.x += 160; });
  // 지나가던 마을 사람이 곁에 서면 E가 그 사람에게 간다(사람이 먼저) — 소가 가장 가까울 때 누른다
  await page.waitForFunction(() => window.__game.scene.getScene('Field').nearestInteractable()?.animal?.id === 'cow');
  await page.keyboard.down('e'); await page.waitForTimeout(120); await page.keyboard.up('e');
  await page.waitForTimeout(300);
  const said = await page.evaluate(() => window.__game.scene.getScene('UI').bubbles.list.length);
  expect(said).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});
