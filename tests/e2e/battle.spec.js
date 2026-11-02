// 사이드뷰 전투: 이기면 길 맵으로, 지면 되돌리기(= 로드, 누군가 지워진다)
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

const start = (page, enemies, boss = false) => page.evaluate(([en, b]) => {
  const g = window.__game, u = window.__ud;
  u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace');
  g.scene.stop('Title');
  g.scene.start('Battle', { enemies: en, seed: 3, boss: b, from: { layer: 'surface', at: [7, 9], key: 'surface:7,9', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } } });
}, [enemies, boss]);

const battle = (page) => page.evaluate(() => {
  const s = window.__game.scene.getScene('Battle');
  return { on: window.__game.scene.isActive('Battle'), panel: s.panel?.visible, result: s.battle?.result };
});

test('슬라임: 1번 스킬로 계속 치면 이기고, 길 맵으로 돌아가며 그날은 다시 안 나온다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['slime']);
  await page.waitForFunction(() => window.__game.scene.isActive('Battle'));
  for (let i = 0; i < 200; i += 1) {
    const s = await battle(page);
    if (!s.on || s.result) break;
    if (s.panel) { await page.keyboard.down('Enter'); await page.waitForTimeout(80); await page.keyboard.up('Enter'); }
    await page.waitForTimeout(150);
  }
  expect((await battle(page)).result ?? 'win').toBe('win');
  await page.waitForFunction(() => window.__game.scene.isActive('Area'), null, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').key)).toBe('surface:7,9');
  const beat = await page.evaluate(() => Object.keys(window.__ud.run.flags).filter((f) => f.startsWith('beat.surface:7,9')));
  expect(beat.length).toBe(1);
  expect(errors).toEqual([]);
});

test('지면 되돌리기: 로드 횟수가 오르고 한 명이 지워지고, 같은 전투가 다시 시작된다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['sweeper'], true);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible);
  // 아군을 쓰러뜨린다 (전투 결과 화면 확인용)
  await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); for (const u of s.battle.units) if (u.side === 'party') u.hp = 0; s.step(); });
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').choices?.length === 2);
  const before = await page.evaluate(() => ({ loads: window.__ud.world.loads, erased: window.__ud.world.erased.length }));
  await page.keyboard.press('r');
  await page.waitForFunction((n) => window.__ud.world.loads === n + 1, before.loads);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible, null, { timeout: 10_000 });
  const after = await page.evaluate(() => ({ erased: window.__ud.world.erased.length, foe: window.__game.scene.getScene('Battle').battle.units.find((u) => u.side === 'enemy').id }));
  expect(after.erased).toBe(before.erased + 1);
  expect(after.foe).toBe('sweeper');
  expect(errors).toEqual([]);
});
