// 프롤로그 전체를 실제 게임으로 플레이한다.
// 행동 이벤트로 진행 → 프롤로그 끝 → CONTINUE → 가장 아낀 사람이 지워졌는지 확인
import { test, expect } from '@playwright/test';
import { openGame, wipe, state, clickMenu, waitField, skipDialog, teleport, waitFlag, waitBusy, advanceUntil } from './game.js';

// 수확제 전날(prep): 준비 셋을 마친 셈 치고 미아에게 가면 저녁 → 수확제의 밤
// (전날 하루 자체는 interact.spec이 사람마다 말을 걸며 돈다)
async function passPrep(page) {
  await waitField(page, 'prep');
  await skipDialog(page);
  await page.evaluate(() => window.__ud.setFlag('prep.ready'));
  await page.evaluate(() => { const f = window.__game.scene.getScene('Field'); const m = f.npcs.mia; f.player.sprite.x = m.x; f.player.sprite.y = m.y + 14; });
  await waitField(page, 'festival', 90_000);
  await skipDialog(page);
}

test('타이틀: 게임 이름 없이 일러스트와 START만', async ({ page }) => {
  const errors = await openGame(page);
  await wipe(page);
  const texts = await page.evaluate(() => window.__game.scene.getScene('Title').children.list.filter((c) => c.type === 'Text').map((c) => c.text));
  expect(texts).toContain('START');
  expect(texts).not.toContain('CONTINUE');
  expect(texts.join(' ')).not.toMatch(/UNLOAD|DOWNLOAD/);
  expect(errors).toEqual([]);
});

test('프롤로그 완주 → CONTINUE하면 가장 아낀 마을 사람이 지워진다', async ({ page }) => {
  test.setTimeout(600_000); // 걸으며 듣는 대사가 많아 헤드리스(CI)에서 5분을 넘긴다
  const errors = await openGame(page);
  await wipe(page);

  // ── 수확제의 밤
  await clickMenu(page, 'START');
  await passPrep(page);

  // 호르트: 근처에 가면 빵이 엎어지고, 다 주워서 돌려주면 이벤트 (+2)
  await teleport(page, 17, 17);
  await waitFlag(page, 'bread.spilled');
  await skipDialog(page);
  for (const [x, y] of [[13, 18], [19, 19], [11, 17]]) await teleport(page, x, y);
  await teleport(page, 16, 17);
  await waitFlag(page, 'ev.hort');
  await skipDialog(page);

  // 페르: 곁에 오래 머물면 노래가 끝까지 (+2)
  await teleport(page, 21, 20);
  await waitFlag(page, 'ev.per', 90_000);
  await skipDialog(page);

  // 호르트를 한 번 더 아끼게 만든다: 지워질 사람을 결정적으로
  await page.evaluate(() => window.__ud.addAffinity('hort', 5));

  // 에다 등장(이벤트 2개 이상) → 종소리 → 아침
  await waitFlag(page, 'eda.met', 90_000);
  await skipDialog(page);
  await waitField(page, 'morning', 150_000);
  await skipDialog(page);

  // ── 다음 날 아침
  await teleport(page, 36, 16);           // 대장간
  await waitFlag(page, 'smithy.seen');
  await skipDialog(page);
  await teleport(page, 26, 20);           // 미아
  await waitFlag(page, 'mia.talked');
  await skipDialog(page);
  await teleport(page, 36, 28);           // 초소의 셀레나
  await waitFlag(page, 'selena.done');
  await skipDialog(page);
  expect((await state(page)).npcs).toContain('lu');
  await teleport(page, 11, 28);           // 우물가의 루 → 밤
  await waitBusy(page);
  await skipDialog(page);

  // ── 그날 밤
  await waitField(page, 'night');
  await skipDialog(page);
  await teleport(page, 23, 10);           // 종탑
  await waitBusy(page);
  await skipDialog(page);

  // ── 타이틀로 돌아옴
  await advanceUntil(page, () => window.__game.scene.isActive('Title'), null, 60_000, '타이틀로 복귀');
  const before = await state(page);
  expect(before.erased).toEqual([]);
  expect(before.affinity.hort).toBeGreaterThan(before.affinity.per ?? 0);

  // ── CONTINUE: 이 순간 누군가 지워진다
  await clickMenu(page, 'CONTINUE');
  await waitField(page, 'aftermath');
  const after = await state(page);
  expect(after.chapter).toBe('chapter1');
  expect(after.erased).toEqual(['hort']);
  expect(after.loads).toBe(1);
  expect(after.npcs).not.toContain('hort');   // 지워진 사람은 필드에 없다

  // 빈자리에 흔적이 남는다
  const remnants = await page.evaluate(() => window.__game.scene.getScene('Field').props.map((p) => p.sprite.frame.name));
  expect(remnants).toContain('crate'); // 호르트가 서 있던 자리의 빈 상자

  await skipDialog(page);
  expect(errors).toEqual([]);
});

test('RESET & START는 진행만 처음으로, 지워진 사람은 돌아오지 않는다', async ({ page }) => {
  await openGame(page);
  await wipe(page);
  await clickMenu(page, 'START');
  await passPrep(page);

  // 타이틀로 돌아가서 CONTINUE → 한 명 지워짐
  await page.evaluate(() => { const g = window.__game; g.scene.stop('UI'); g.scene.stop('Field'); g.scene.start('Title'); });
  await page.waitForFunction(() => window.__game.scene.isActive('Title'));
  await clickMenu(page, 'CONTINUE');
  await waitField(page);
  const erased = (await state(page)).erased;
  expect(erased).toHaveLength(1);

  // RESET & START (두 번 눌러 확인)
  await page.evaluate(() => { const g = window.__game; g.scene.stop('UI'); g.scene.stop('Field'); g.scene.start('Title'); });
  await page.waitForFunction(() => window.__game.scene.isActive('Title'));
  await clickMenu(page, 'RESET & START');
  await clickMenu(page, 'PRESS AGAIN TO RESET');
  await waitField(page, 'prep');
  const s = await state(page);
  expect(s.erased).toEqual(erased);
  expect(s.npcs).not.toContain(erased[0]);
});
