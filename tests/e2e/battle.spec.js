// 싸움(탑뷰 액션): 길 위의 무리와 부딪히면 그 자리에서 싸우고, 이기면 길 맵으로. 지면 되돌리기(로드)나 물러나기.
import { test, expect } from '@playwright/test';
import { openGame, wipe, winAction } from './game.js';

const start = (page, enemies, boss = false) => page.evaluate(([en, b]) => {
  const g = window.__game, u = window.__ud;
  u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace');
  g.scene.stop('Title');
  g.scene.start('Action', { enemies: en, seed: 3, boss: b, from: { layer: 'surface', at: [7, 9], key: 'surface:7,9', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' }, biome: 'temperate' } });
}, [enemies, boss]);

test('무리와 싸워 이기면 길 맵으로 돌아가고, 그날은 다시 안 나오며 피로가 쌓인다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['slime', 'slime', 'slime', 'slime_big', 'wolf', 'wolf', 'wolf_alpha', 'slime_poison', 'owl']);
  await page.waitForFunction(() => window.__game.scene.getScene('Action')?.engine?.state.foes.length === 6);
  const fatigue0 = await page.evaluate(() => window.__ud.run.life.fatigue);
  if (process.env.SHOTS) { await page.waitForTimeout(2200); await page.screenshot({ path: `${process.env.SHOTS}/action.png` }); }
  await winAction(page);
  await page.waitForFunction(() => window.__game.scene.isActive('Area'), null, { timeout: 15_000 });
  const beat = await page.evaluate(() => Object.keys(window.__ud.run.flags).filter((f) => f.startsWith('beat.surface:7,9')));
  expect(beat.length).toBe(1);
  expect(await page.evaluate(() => window.__ud.run.life.fatigue)).toBeGreaterThan(fatigue0);
  expect(errors).toEqual([]);
});

test('지면 되돌리기: 로드 횟수가 오르고(네 번째면 한 명이 지워지고), 같은 싸움이 다시 시작된다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['sweeper'], true);
  await page.waitForFunction(() => window.__game.scene.getScene('Action')?.engine && !window.__game.scene.getScene('Action').paused);
  await page.evaluate(() => { const a = window.__game.scene.getScene('Action'); a.engine.state.p.hp = 1; a.engine.state.p.invuln = 0; a.engine.state.shots.push({ x: a.engine.state.p.x, y: a.engine.state.p.y, vx: 0, vy: 0, r: 6, dmg: 50, from: 'x', life: 1 }); });
  await page.waitForFunction(() => window.__game.scene.getScene('Action').choices?.length === 2, null, { timeout: 10_000 });
  const before = await page.evaluate(() => { window.__ud.world.loads = 3; return { erased: window.__ud.world.erased.length }; });
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.__ud.world.loads === 4);
  await page.waitForFunction(() => { const a = window.__game.scene.getScene('Action'); return a?.engine && !a.engine.over && !a.leaving; }, null, { timeout: 10_000 });
  const after = await page.evaluate(() => ({ erased: window.__ud.world.erased.length, foe: window.__game.scene.getScene('Action').engine.state.foes[0].id }));
  expect(after.erased).toBe(before.erased + 1);
  expect(after.foe).toBe('sweeper');
  expect(errors).toEqual([]);
});

test('정리자의 그림자를 처음 이기면 장비를 얻는다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['sweeper'], true);
  await winAction(page);
  await page.waitForFunction(() => window.__ud.run.flags['loot.sweeper']);
  expect(await page.evaluate(() => window.__ud.run.gear?.twinEdge)).toBe(1);
  expect(errors).toEqual([]);
});

test('퀵슬롯: 3번은 회복 물약, 바로 찬다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['mole']);
  await page.waitForFunction(() => { const a = window.__game.scene.getScene('Action'); return a?.engine && !a.paused; });
  await page.evaluate(() => { const s = window.__game.scene.getScene('Action').engine.state; s.p.hp = 30; for (const f of s.foes) { f.timer = 99; f.x = 20; f.y = 20; } });
  await page.keyboard.press('3');
  await page.waitForFunction(() => window.__game.scene.getScene('Action').engine.state.p.hp > 30);
  expect(errors).toEqual([]);
});
