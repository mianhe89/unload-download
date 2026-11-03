// 거점 마을들: 들르는 페이즈가 오류 없이 열리고 사람이 산다
import { test, expect } from '@playwright/test';
import { openGame, wipe, waitField, skipDialog } from './game.js';

for (const [phase, entry, people] of [['ruin', 'w', 0], ['frost', 's', 3], ['harbor', 'n', 2], ['dwarf', 's', 2]]) {
  test(`${phase}: 열리고, 사람 ${people}명`, async ({ page }) => {
    const errors = await openGame(page);
    await wipe(page);
    await page.evaluate(([ph, en]) => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', ph); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: ph, entry: en, back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); }, [phase, entry]);
    await waitField(page, phase);
    await skipDialog(page);
    const n = await page.evaluate(() => Object.keys(window.__game.scene.getScene('Field').npcs).length);
    expect(n).toBeGreaterThanOrEqual(people);
    if (process.env.SHOTS) await page.screenshot({ path: `${process.env.SHOTS}/town-${phase}.png` });
    expect(errors).toEqual([]);
  });
}
