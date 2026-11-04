// 호르트·리네가 지워진 세계의 수확제 전날: 남은 사람을 E로 도우면 미아가 부른다 (막히던 버그)
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, advanceUntil } from './game.js';

test('호르트·리네가 없어도 수확제 전날을 넘긴다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.world.erased.push({ id: 'hort', atLoad: 0 }, { id: 'rine', atLoad: 0 }); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'prologue', phase: 'prep' }); });
  await waitField(page, 'prep');
  await advanceUntil(page, () => !window.__game.scene.getScene('Field').cutscene.busy, null, 30_000, '도입 끝');
  const obj = await page.evaluate(() => window.__game.scene.getScene('UI').hud.objective.text);
  expect(obj).not.toContain('호르트');
  for (const who of ['tom', 'per', 'selena']) {
    await page.evaluate((id) => { const f = window.__game.scene.getScene('Field'); f.director.events.filter((e) => [e.trigger.near, e.trigger.dwell].includes(id)).forEach((e) => { e.trigger = { ...e.trigger, r: 0.3 }; }); const n = f.npcs[id]; f.player.sprite.x = n.x; f.player.sprite.y = n.y + 15; }, who);
    await page.waitForTimeout(200);
    await page.keyboard.down('e'); await page.waitForTimeout(120); await page.keyboard.up('e');
    await advanceUntil(page, (id) => window.__ud.run.flags[`ev.prep.${id}`], who, 40_000, `${who} 돕기`);
    await advanceUntil(page, () => !window.__game.scene.getScene('Field').cutscene.busy, null, 30_000, '장면 끝');
  }
  await advanceUntil(page, () => window.__ud.run.flags['prep.ready'], null, 20_000, '미아가 부른다');
  expect(errors).toEqual([]);
});
