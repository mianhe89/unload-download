// 수확제 전날: 사람 곁에서 E를 누르면 그 사람의 준비 돕기가 시작되고, 목표 줄에 몇 명 도왔는지 보인다
import { test, expect } from '@playwright/test';
import { openGame, wipe, clickMenu, waitField, skipDialog } from './game.js';

test('E로 호르트를 도우면 목표가 (1/3)이 되고 남은 사람 이름이 보인다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await clickMenu(page, 'START');
  await waitField(page, 'prep');
  await skipDialog(page);
  // 이벤트 반경 밖(4칸)에서 다가가지 않고, 말 거는 거리까지만 붙여 세운 뒤 E
  await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); f.director.events.filter((e) => e.trigger.near === 'hort').forEach((e) => { e.trigger = { ...e.trigger, r: 0.5 }; }); const n = f.npcs.hort; f.player.sprite.x = n.x; f.player.sprite.y = n.y + 15; });
  await page.waitForTimeout(200);
  await page.keyboard.press('e');
  await page.waitForFunction(() => window.__ud.run.flags['ev.prep.hort'], null, { timeout: 30_000 });
  await page.waitForTimeout(700);
  const obj = await page.evaluate(() => window.__game.scene.getScene('UI').hud.objective.text);
  expect(obj).toContain('(1/3)');
  expect(obj).toContain('에다');
  expect(obj).not.toContain('호르트');
  expect(errors).toEqual([]);
});
