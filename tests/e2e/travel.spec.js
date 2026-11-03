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
  await page.waitForTimeout(250); // 새 씬이 자리 잡을 때까지
  await put(page, 'Area', p[0], p[1]);
  await holdUntil(page, { n: 'ArrowUp', s: 'ArrowDown', w: 'ArrowLeft', e: 'ArrowRight' }[dir],
    (k) => !window.__game.scene.isActive('Area') || window.__game.scene.getScene('Area').key !== k, before);
}

// 조건이 맞을 때까지 키를 누르고 있는다 (헤드리스 브라우저는 프레임이 느려 걷는 데 오래 걸린다)
// 씬이 다시 시작되는 순간 눌린 키는 새 씬이 못 볼 수 있어, 진척이 없으면 떼었다 다시 누른다
async function holdUntil(page, key, fn, arg, timeout = 20_000) {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    await page.keyboard.down(key);
    try {
      await page.waitForFunction(fn, arg, { timeout: 2500 });
      await page.keyboard.up(key);
      return;
    } catch { await page.keyboard.up(key); }
  }
  throw new Error(`시간 초과: ${key}를 눌러도 조건이 맞지 않음`);
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
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); u.setFlag('entered.chapter1.aftermath'); g.scene.stop('Title'); g.scene.start('Field', { chapter: 'chapter1', phase: 'aftermath' }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Field'));

  // 마을 북쪽 출구
  await put(page, 'Field', 34, 3);
  await holdUntil(page, 'ArrowUp', () => window.__game.scene.isActive('Area'));
  expect(await areaKey(page)).toBe('surface:7,10');

  // 북쪽으로 세 칸 → 서리 마을 앞 (7,7)
  for (const want of ['surface:7,9', 'surface:7,8', 'surface:7,7']) {
    await leaveArea(page, 'n');
    await page.waitForFunction((k) => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === k, want, { timeout: 15_000 });
  }
  const flags = await page.evaluate(() => Object.keys(window.__ud.run.flags).filter((f) => f.startsWith('visited.')));
  expect(flags.length).toBe(4);
  // 한 칸 더 → 서리 마을: 사람이 사는 마을이라 그 마을의 이야기 필드로 들어간다
  await leaveArea(page, 'n');
  await page.waitForFunction(() => window.__game.scene.isActive('Field') && window.__game.scene.getScene('Field').mapDef?.id === 'frost', null, { timeout: 15_000 });

  // 다시 길 맵(7,7)에서 남쪽으로 네 번 → 시작 마을(이야기 필드)로 복귀
  await page.evaluate(() => { const g = window.__game; g.scene.stop('Field'); g.scene.start('Area', { layer: 'surface', at: [7, 7], entry: 'n', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === 'surface:7,7', null, { timeout: 15_000 });
  for (let i = 0; i < 4; i += 1) {
    await page.waitForFunction(() => window.__game.scene.isActive('Area') && !window.__game.scene.getScene('Area').leaving, null, { timeout: 5000 });
    await leaveArea(page, 's');
  }
  await page.waitForFunction(() => window.__game.scene.isActive('Field'), null, { timeout: 5000 });
  const back = await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); return { chapter: f.chapterId, ty: Math.floor(f.player.y / 16) }; });
  expect(back.chapter).toBe('chapter1');
  expect(back.ty).toBeLessThan(8);
  expect(errors).toEqual([]);
});

test('드워프 마을의 계단으로 지하에 내려갔다가 올라온다, 이정표를 읽는다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); g.scene.stop('Title'); g.scene.start('Area', { layer: 'surface', at: [11, 5], entry: 's', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === 'surface:11,5');

  // 계단 바로 아래에서 위로 걷는다 → 지하 갱도 입구
  const stairs = async () => page.evaluate(() => window.__game.scene.getScene('Area').features.find((f) => f.kind === 'portal').at);
  let [sx, sy] = await stairs();
  await put(page, 'Area', sx, sy + 2);
  await holdUntil(page, 'ArrowUp', () => window.__game.scene.getScene('Area').key === 'under:4,0');
  expect(await page.evaluate(() => window.__game.scene.getScene('UI').hud.place.text)).toBe('갱도 입구');

  // 올라가는 계단 → 다시 드워프 마을
  await page.waitForFunction(() => !window.__game.scene.getScene('Area').leaving);
  [sx, sy] = await stairs();
  await put(page, 'Area', sx, sy + 2);
  await holdUntil(page, 'ArrowUp', () => window.__game.scene.getScene('Area').key === 'surface:11,5');

  // 이정표: 시작 마을 옆 칸에서 E
  await page.evaluate(() => { const g = window.__game; g.scene.getScene('Area').scene.restart({ layer: 'surface', at: [7, 10], entry: 's', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await page.waitForFunction(() => window.__game.scene.getScene('Area').key === 'surface:7,10' && window.__game.scene.getScene('Area').features?.length);
  await page.evaluate(() => { const a = window.__game.scene.getScene('Area'); const f = a.features.find((x) => x.kind === 'sign'); a.player.sprite.x = f.x; a.player.sprite.y = f.y + 10; });
  await page.waitForTimeout(300);
  await holdUntil(page, 'e', () => window.__game.scene.getScene('UI').talking);
  const text = await page.evaluate(() => window.__game.scene.getScene('UI').dialog.full);
  expect(text).toContain('수확제 마을');
  expect(text).not.toContain('서리 마을'); // 아직 안 가 봐서 이름이 깨져 있다
  expect(errors).toEqual([]);
});

test('항구에서 배를 타고 바다로 나갔다가 돌아온다', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); g.scene.stop('Title'); g.scene.start('Area', { layer: 'surface', at: [8, 15], entry: 'boat', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === 'surface:8,15');

  // 선착장 끝에서 E → 바다
  await page.evaluate(() => { const a = window.__game.scene.getScene('Area'); const f = a.features.find((x) => x.kind === 'boat'); a.player.sprite.x = f.x; a.player.sprite.y = f.y - 26; });
  await page.waitForTimeout(300);
  await holdUntil(page, 'e', () => window.__game.scene.getScene('Area').key === 'surface:8,16');
  expect(await page.evaluate(() => window.__game.scene.getScene('Area').area.sea)).toBe(true);
  expect(await page.evaluate(() => Boolean(window.__game.scene.getScene('Area').boat))).toBe(true);

  // 북쪽으로 노 저어 → 항구 (항구는 사람이 사는 마을이라 이야기 필드로 들어간다)
  await page.waitForFunction(() => !window.__game.scene.getScene('Area').leaving);
  await leaveArea(page, 'n');
  await page.waitForFunction(() => window.__game.scene.isActive('Field') && window.__game.scene.getScene('Field').mapDef?.id === 'harbor', null, { timeout: 15_000 });
  expect(errors).toEqual([]);
});

test('길 맵에서 멈췄으면 이어하기는 그 칸에서 (로드 대가는 그대로)', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  await page.evaluate(() => { const g = window.__game, u = window.__ud; u.startNew(); u.checkpoint('chapter1', 'aftermath'); u.setFlag('dev.peace'); g.scene.stop('Title'); g.scene.start('Area', { layer: 'surface', at: [7, 8], entry: 'center', back: { chapter: 'chapter1', phase: 'aftermath', time: 'day' } }); });
  await page.waitForFunction(() => window.__game.scene.isActive('Area'));
  expect(await page.evaluate(() => window.__ud.run.where)).toEqual({ layer: 'surface', at: [7, 8] });

  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
  const before = await page.evaluate(() => window.__ud.world.loads);
  await page.evaluate(() => window.__game.scene.getScene('Title').continue());
  await page.waitForFunction(() => window.__game.scene.isActive('Area') && window.__game.scene.getScene('Area').key === 'surface:7,8', null, { timeout: 10_000 });
  expect(await page.evaluate(() => window.__ud.world.loads)).toBe(before + 1);
  expect(errors).toEqual([]);
});
