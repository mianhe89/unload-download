// 마을 습격: 오크와 부딪히면 그 자리의 싸움(탑뷰 액션)으로 넘어가고, 이기면 마을로 돌아와 그 오크들이 달아난다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog, advanceUntil, winAction } from './game.js';

const raid = (page) => page.evaluate(() => {
  const g = window.__game;
  const r = g.scene.getScene('Field').raids;
  return {
    field: g.scene.isActive('Field'), sleeping: g.scene.isSleeping('Field'), battle: g.scene.isActive('Action'),
    id: r.raid?.id ?? null, busy: r.busy, states: r.band.map((b) => b.state),
  };
});

test('정찰대: 오크와 부딪히면 전투, 이기면 마을로 돌아와 그 오크는 달아난다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page);
  await skipDialog(page);

  await page.evaluate(() => { window.__ud.raid('scouts'); }); // 경고 장면이 끝나길 기다리지 않는다(아래에서 넘긴다)
  // 경고 장면을 넘기고 첫 오크가 걷기 시작할 때까지
  await advanceUntil(page, () => window.__game.scene.getScene('Field').raids.band[0]?.state === 'march', null, 20_000, '오크 등장');

  // 첫 오크 곁으로 순간이동 → 부딪힌다
  await page.evaluate(() => {
    const f = window.__game.scene.getScene('Field');
    const o = f.raids.band[0].npc;
    f.player.sprite.x = o.x; f.player.sprite.y = o.y + 6;
  });
  await page.waitForFunction(() => window.__game.scene.isActive('Action'), null, { timeout: 10_000 });
  expect((await raid(page)).sleeping).toBe(true);
  await winAction(page);
  await page.waitForFunction(() => window.__game.scene.isActive('Field') && !window.__game.scene.isActive('Action'), null, { timeout: 15_000 });
  const after = await raid(page);
  expect(after.id).toBe('scouts');
  expect(['flee', 'gone']).toContain(after.states[0]);
  expect(await page.evaluate(() => window.__game.scene.isVisible('UI'))).toBe(true);
  expect(errors).toEqual([]);
});

test('서리 마을: 해 질 녘 오크와 부딪히면 혼자 싸운다 (곁의 오크도 같이 덤빈다)', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'frost'); u.setFlag('visited.frost'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'frost', entry: 's', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await waitField(page, 'frost');
  await skipDialog(page);
  await page.evaluate(() => { window.__ud.raid('frost'); });
  await advanceUntil(page, () => window.__game.scene.getScene('Field').raids.band[0]?.state === 'march', null, 20_000, '오크 등장');
  await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); const o = f.raids.band[0].npc; f.player.sprite.x = o.x; f.player.sprite.y = o.y + 6; });
  await page.waitForFunction(() => window.__game.scene.isActive('Action'), null, { timeout: 10_000 });
  const foes = await page.evaluate(() => window.__game.scene.getScene('Action').engine.state.foes.map((f) => f.id));
  expect(foes.every((id) => id === 'orc')).toBe(true);
  expect(errors).toEqual([]);
});
