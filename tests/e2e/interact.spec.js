// 새 게임 첫 페이즈에서 사람·물건마다 다가가 E를 눌러 본다: 멈추거나 오류가 나면 안 된다
// (걸으며 듣는 대사는 멈춘 게 아니다 — 주인공은 계속 걸을 수 있다)
import { test, expect } from '@playwright/test';
import { openGame, wipe, clickMenu, waitField, skipDialog } from './game.js';
import { LIFE_SPOTS } from '../../content/life/life.js';

test('수확제 전날: 모두에게 말 걸고 살펴봐도 멈추지 않는다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await clickMenu(page, 'START');
  await waitField(page, 'prep');
  await skipDialog(page);
  const targets = await page.evaluate(() => {
    const f = window.__game.scene.getScene('Field');
    return [...Object.values(f.npcs).map((n) => ({ kind: 'npc', id: n.id, x: n.x, y: n.y }))];
  });
  for (const t of targets) {
    await page.evaluate((p) => { const f = window.__game.scene.getScene('Field'); const n = f.npcs[p.id]; if (!n) return; f.player.sprite.x = n.x; f.player.sprite.y = n.y + 14; }, t);
    await page.waitForTimeout(150);
    await page.keyboard.press('e');
    await page.waitForTimeout(300);
    await skipDialog(page);
    // 게임이 계속 돈다: 프레임이 흐르고 주인공이 움직일 수 있다
    const alive = await page.evaluate(async () => {
      const g = window.__game, f = g.scene.getScene('Field');
      const t0 = g.loop.frame; await new Promise((r) => setTimeout(r, 1000)); // 헤드리스(소프트웨어 렌더링)는 느리다: 1초에 몇 프레임이라도 흐르면 살아 있다
      return { frames: g.loop.frame - t0, frozen: Boolean(f.frozen), busy: f.cutscene.busy && !f.cutscene.walking, talking: g.scene.getScene('UI').talking };
    });
    expect(alive.frames, t.id).toBeGreaterThan(3);
    expect(alive.frozen || alive.busy || alive.talking, `${t.id}: ${JSON.stringify(alive)}`).toBe(false);
  }
  expect(errors).toEqual([]);
});

// 사람·생활 자리를 돌며 E. 멈추면(프레임이 안 흐르거나, 주인공이 얼어 있거나) 실패
async function sweep(page, label) {
  const people = await page.evaluate(() => Object.values(window.__game.scene.getScene('Field').npcs).map((n) => ({ id: n.id, x: n.x, y: n.y + 14 })));
  // 잠은 장면을 넘기므로 맨 끝에
  const life = LIFE_SPOTS.map((l) => ({ id: l.action, x: l.at[0] * 16 + 8, y: l.at[1] * 16 + 8 + 14 })).sort((a, b) => (a.id === 'sleep') - (b.id === 'sleep'));
  const spots = [...people, ...life];
  for (const t of spots) {
    await page.evaluate((p) => { const pl = window.__game.scene.getScene('Field').player; pl.sprite.x = p.x; pl.sprite.y = p.y; pl.face = 'up'; }, t);
    await page.waitForTimeout(150);
    await page.keyboard.press('e');
    await page.waitForTimeout(300);
    await skipDialog(page);
    // 가게 주인이면 가게 창이 열린다(그동안은 멈춰 있는 게 맞다) — 닫고 본다
    if (await page.evaluate(() => window.__game.scene.getScene('UI').shop?.open)) await page.keyboard.press('Escape');
    const alive = await page.evaluate(async () => {
      const g = window.__game, f = g.scene.getScene('Field');
      const t0 = g.loop.frame; await new Promise((r) => setTimeout(r, 1000)); // 헤드리스(소프트웨어 렌더링)는 느리다: 1초에 몇 프레임이라도 흐르면 살아 있다
      return { field: g.scene.isActive('Field'), frames: g.loop.frame - t0, frozen: Boolean(f.player?.frozen), busy: f.cutscene?.busy && !f.cutscene?.walking, talking: g.scene.getScene('UI').talking };
    });
    if (!alive.field) break; // 잠 등으로 장면이 넘어갔다
    expect(alive.frames, `${label}/${t.id}`).toBeGreaterThan(3);
    expect(alive.frozen || alive.busy || alive.talking, `${label}/${t.id}: ${JSON.stringify(alive)}`).toBe(false);
  }
}

test('1장: 사람·생활 자리에서 E를 눌러도 멈추지 않는다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await waitField(page, 'aftermath');
  await skipDialog(page);
  await sweep(page, 'chapter1');
  expect(errors).toEqual([]);
});
