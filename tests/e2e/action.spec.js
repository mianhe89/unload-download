// 보스전 2단계: 턴제에서 보스 체력이 반 아래로 떨어지면 탑뷰 액션으로 넘어가고, 이기면 길 맵으로 돌아간다
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

test('보스 1단계 → 2단계 탑뷰 → 클릭으로 마무리 → 길 맵', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => {
    const g = window.__game, u = window.__ud;
    u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace');
    g.scene.stop('Title');
    g.scene.start('Battle', { enemies: ['sweeper'], seed: 1, boss: true, from: { layer: 'surface', at: [8, 2], key: 'surface:8,2', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } } });
  });
  await page.waitForFunction(() => window.__game.scene.isActive('Battle') && window.__game.scene.getScene('Battle').battle);
  await page.evaluate(() => { const bs = window.__game.scene.getScene('Battle'); const boss = bs.battle.units.find((x) => x.boss); boss.hp = Math.round(boss.maxHp * 0.4); bs.step(); });
  await page.waitForFunction(() => window.__game.scene.isActive('Action') && !window.__game.scene.getScene('Action').paused, null, { timeout: 15000 });
  // 기본 소모품을 받았다
  const bag = await page.evaluate(() => window.__ud.run.farm.items);
  expect(bag.bandage).toBeGreaterThan(0);
  // 보스를 거의 쓰러뜨려 두고, 보스 쪽으로 클릭해서 마무리
  await page.evaluate(() => { const s = window.__game.scene.getScene('Action').engine.state; s.b.hp = 1; s.b.timer = 99; s.p.x = s.b.x; s.p.y = s.b.y + 26; });
  const at = await page.evaluate(() => { const a = window.__game.scene.getScene('Action'); const b = a.engine.state.b; const r = a.game.canvas.getBoundingClientRect(); const k = r.width / a.scale.width; return { x: r.left + (a.ox + b.x * a.Z) * k, y: r.top + (a.oy + b.y * a.Z) * k }; });
  for (let i = 0; i < 6; i += 1) { await page.mouse.click(at.x, at.y); await page.waitForTimeout(120); }
  await page.waitForFunction(() => window.__game.scene.getScene('Action').engine.over === 'win', null, { timeout: 5000 });
  await page.waitForFunction(() => window.__game.scene.isActive('Area'), null, { timeout: 10000 });
  expect(await page.evaluate(() => window.__ud.run.flags['beat.surface:8,2'] ?? Object.keys(window.__ud.run.flags).some((k) => k.startsWith('beat.')))).toBeTruthy();
  expect(errors).toEqual([]);
});
