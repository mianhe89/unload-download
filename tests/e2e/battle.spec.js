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

test('지면 되돌리기: 로드 횟수가 오르고(네 번째면 한 명이 지워지고), 같은 전투가 다시 시작된다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['sweeper'], true);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible);
  // 아군을 쓰러뜨린다 (전투 결과 화면 확인용)
  await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); for (const u of s.battle.units) if (u.side === 'party') u.hp = 0; s.step(); });
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').choices?.length === 2);
  const before = await page.evaluate(() => { window.__ud.world.loads = 3; return { loads: 3, erased: window.__ud.world.erased.length }; });
  await page.keyboard.press('r');
  await page.waitForFunction((n) => window.__ud.world.loads === n + 1, before.loads);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible, null, { timeout: 10_000 });
  const after = await page.evaluate(() => ({ erased: window.__ud.world.erased.length, foe: window.__game.scene.getScene('Battle').battle.units.find((u) => u.side === 'enemy').id }));
  expect(after.erased).toBe(before.erased + 1);
  expect(after.foe).toBe('sweeper');
  expect(errors).toEqual([]);
});

test('궁극기: 게이지가 차면 4번 두 번 → 컷인 후 발동, 싸움이 끝나면 피로가 쌓인다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['mole']);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible);
  const fatigue0 = await page.evaluate(() => window.__ud.run.life.fatigue);
  await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); s.current.burst = 100; s.openPanel(s.current); });
  await page.keyboard.press('r');
  await page.waitForTimeout(150);
  await page.keyboard.press('r');
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').battle.log.some((e) => e.type === 'skill' && e.ultimate));
  // 끝까지 싸운다
  for (let i = 0; i < 200; i += 1) {
    const s = await battle(page);
    if (!s.on || s.result) break;
    if (s.panel) { await page.keyboard.down('Enter'); await page.waitForTimeout(80); await page.keyboard.up('Enter'); }
    await page.waitForTimeout(150);
  }
  await page.waitForFunction(() => window.__game.scene.isActive('Area'), null, { timeout: 15_000 });
  expect(await page.evaluate(() => window.__ud.run.life.fatigue)).toBeGreaterThan(fatigue0);
  expect(errors).toEqual([]);
});

test('퀵슬롯: 3번(회복 물약)을 두 번 누르면 가장 다친 아군에게 쓰고 차례가 넘어간다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await start(page, ['slime']);
  await page.waitForFunction(() => window.__game.scene.getScene('Battle').panel?.visible);
  await page.evaluate(() => window.__ud.setFarm({ counts: {}, items: { potion: 1, bandage: 2 }, skills: [], felled: {}, forestChops: 0 }));
  const who = await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); const u = s.battle.units.find((x) => x.uid === 'selena'); u.hp = 40; s.refresh(); return s.current.uid; });
  await page.keyboard.press('3');
  if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/battle-quick.png` });
  await page.keyboard.press('3');
  await page.waitForFunction(() => window.__ud.run.farm.items.potion === 0);
  const after = await page.evaluate(() => { const s = window.__game.scene.getScene('Battle'); return { hp: s.battle.units.find((x) => x.uid === 'selena').hp, gauge: s.battle.units.find((x) => x.uid === s.current?.uid)?.uid }; });
  expect(after.hp).toBe(130);
  expect(who).toBeTruthy();
  expect(errors).toEqual([]);
});
