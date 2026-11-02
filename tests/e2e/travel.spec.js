// 마을 밖으로: 1장부터 북쪽 길이 열린다. 길 맵을 지나 서리 마을 쪽으로 갔다가 다시 돌아온다.
import { test, expect } from '@playwright/test';
import { openGame, wipe } from './game.js';

const areaKey = (page) => page.evaluate(() => (window.__game.scene.isActive('Area') ? window.__game.scene.getScene('Area').key : null));
const fieldOn = (page) => page.evaluate(() => window.__game.scene.isActive('Field'));

// 지금 씬의 플레이어를 칸 좌표로
async function put(page, scene, tx, ty) {
  await page.evaluate(([s, x, y]) => {
    const pl = window.__game.scene.getScene(s).player;
    pl.sprite.x = x * 16 + 8; pl.sprite.y = y * 16 + 8;
  }, [scene, tx, ty]);
}

// 지금 길 맵의 한 출구 끝으로 걸어 나간다
async function leaveArea(page, dir) {
  const p = await page.evaluate((d) => {
    const a = window.__game.scene.getScene('Area').area;
    const [x, y] = a.entry(d);
    return { n: [x, 3], s: [x, a.H - 4], w: [3, y], e: [a.W - 4, y] }[d];
  }, dir);
  const before = await page.evaluate(() => window.__game.scene.getScene('Area').key);
  await put(page, 'Area', p[0], p[1]);
  await holdUntil(page, { n: 'ArrowUp', s: 'ArrowDown', w: 'ArrowLeft', e: 'ArrowRight' }[dir],
    (k) => !window.__game.scene.isActive('Area') || window.__game.scene.getScene('Area').key !== k, before);
}

// 조건이 맞을 때까지 키를 누르고 있는다 (헤드리스 브라우저는 프레임이 느려 걷는 데 오래 걸린다)
async function holdUntil(page, key, fn, arg, timeout = 15_000) {
  await page.keyboard.down(key);
  try { await page.waitForFunction(fn, arg, { timeout }); } finally { await page.keyboard.up(key); }
}

test('프롤로그엔 마을 밖이 막혀 있다', async ({ page }) => {
  await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.setFlag('entered.prologue.morning'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'prologue', phase: 'morning' }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Field'));
  await put(page, 'Field', 34, 5);
  await page.keyboard.down('ArrowUp'); await page.waitForTimeout(3000); await page.keyboard.up('ArrowUp');
  expect(await fieldOn(page)).toBe(true);
  const y = await page.evaluate(() => window.__game.scene.getScene('Field').player.y);
  expect(y).toBeGreaterThanOrEqual(4 * 16);
});

test('1장: 북쪽 길로 나가 서리 마을까지 갔다가 돌아온다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Field'));

  // 마을 북쪽 출구
  await put(page, 'Field', 34, 3);
  await holdUntil(page, 'ArrowUp', () => window.__game.scene.isActive('Area'));
  expect(await areaKey(page)).toBe('surface:7,10');

  // 북쪽으로 네 칸 → 서리 마을 (7,6)
  for (const want of ['surface:7,9', 'surface:7,8', 'surface:7,7', 'surface:7,6']) {
    await leaveArea(page, 'n');
    await page.waitForFunction((k) => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === k, want, { timeout: 5000 });
  }
  const place = await page.evaluate(() => window.__game.scene.getScene('UI').hud.place.text);
  expect(place).toBe('서리 마을');
  const flags = await page.evaluate(() => Object.keys(window.__ud.run.flags).filter((f) => f.startsWith('visited.')));
  expect(flags.length).toBe(5);

  // 남쪽으로 다섯 번 → 시작 마을(이야기 필드)로 복귀
  for (let i = 0; i < 5; i += 1) {
    await page.waitForFunction(() => window.__game.scene.isActive('Area') && !window.__game.scene.getScene('Area').leaving, null, { timeout: 5000 });
    await leaveArea(page, 's');
  }
  await page.waitForFunction(() => window.__game.scene.isActive('Field'), null, { timeout: 5000 });
  const back = await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); return { chapter: f.chapterId, ty: Math.floor(f.player.y / 16) }; });
  expect(back.chapter).toBe('chapter1');
  expect(back.ty).toBeLessThan(8);
  expect(errors).toEqual([]);
});
