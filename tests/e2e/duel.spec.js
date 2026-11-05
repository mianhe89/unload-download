// 레온의 결투: 드워프 마을 광장 가운데로 걸어 나가면 결투(탑뷰 액션)가 시작된다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, advanceUntil, teleport } from './game.js';

test('광장 가운데로 나가면 레온과 결투가 열린다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter4', 'dwarf4'); ['ch4.departed', 'ch4.sei_joined', 'ch4.keeper_day', 'rank.regent', 'ch4.ledger_done'].forEach((f) => u.setFlag(f)); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter4', phase: 'dwarf4', entry: 's', back: { chapter: 'chapter4', phase: 'muster', time: 'day' } }); });
  await waitField(page, 'dwarf4');
  await advanceUntil(page, () => window.__ud.run.flags['duel.offered'], null, 60_000, '결투 제안');
  await advanceUntil(page, () => !window.__game.scene.getScene('Field').cutscene.busy, null, 30_000, '장면 끝');
  await teleport(page, 19, 14);
  await advanceUntil(page, () => window.__game.scene.isActive('Action'), null, 30_000, '결투');
  const foes = await page.evaluate(() => window.__game.scene.getScene('Action').engine.state.foes.map((f) => f.id));
  expect(foes).toEqual(['leon_duel']);
  expect(errors).toEqual([]);
});
