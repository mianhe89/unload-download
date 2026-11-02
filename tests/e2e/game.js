// E2E 공용 조작: 게임 내부 상태 읽기, 순간이동, 대화 넘기기.
// 게임은 개발·테스트용으로 window.__game(Phaser), window.__ud(WorldMemory)를 연다.

export async function openGame(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console: ${m.text()}`); });
  await page.goto('/');
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
  return errors;
}

export async function wipe(page) {
  await page.evaluate(() => window.__ud.wipeAll());
  await page.reload();
  await page.waitForFunction(() => window.__game?.scene.isActive('Title'));
}

export const state = (page) => page.evaluate(() => {
  const f = window.__game.scene.getScene('Field');
  const ui = window.__game.scene.getScene('UI');
  const fieldOn = window.__game.scene.isActive('Field');
  return {
    title: window.__game.scene.isActive('Title'),
    field: fieldOn,
    phase: fieldOn ? f.phaseId : null,
    chapter: fieldOn ? f.chapterId : null,
    busy: fieldOn ? f.cutscene.busy : false,
    talking: ui?.sys.isActive() ? ui.talking : false,
    flags: Object.keys(window.__ud.run?.flags ?? {}),
    affinity: window.__ud.run?.affinity ?? {},
    erased: window.__ud.world.erased.map((e) => e.id),
    loads: window.__ud.world.loads,
    npcs: fieldOn ? Object.keys(f.npcs) : [],
  };
});

// 타이틀 메뉴 클릭: label = 'START' | 'RESET & START' | 'CONTINUE'
export async function clickMenu(page, label) {
  const p = await page.evaluate((l) => {
    const t = window.__game.scene.getScene('Title').children.list.find((c) => c.text === l);
    if (!t) return null;
    const b = t.getBounds();
    const canvas = window.__game.canvas.getBoundingClientRect();
    const k = canvas.width / window.__game.scale.width;
    return { x: canvas.left + (b.x + b.width / 2) * k, y: canvas.top + (b.y + b.height / 2) * k };
  }, label);
  if (!p) throw new Error(`메뉴 없음: ${label}`);
  await page.mouse.click(p.x, p.y);
}

export async function waitField(page, phase, timeout = 60_000) {
  await advanceUntil(page, (ph) => {
    const g = window.__game;
    return g.scene.isActive('Field') && (!ph || g.scene.getScene('Field').phaseId === ph);
  }, phase, timeout, `필드 페이즈 ${phase ?? ''}`);
}

// 조건이 참이 될 때까지, 대화가 떠 있으면 넘기면서 기다린다
export async function advanceUntil(page, fn, arg, timeout = 30_000, what = '조건') {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await page.evaluate(fn, arg)) return;
    if ((await state(page)).talking) await page.keyboard.press('Space');
    await page.waitForTimeout(80);
  }
  throw new Error(`시간 초과: ${what}`);
}

// 컷신·대화가 끝날 때까지 넘긴다
export async function skipDialog(page, limit = 200) {
  for (let i = 0; i < limit; i += 1) {
    const s = await state(page);
    if (!s.busy && !s.talking) return;
    await page.keyboard.press('Space');
    await page.waitForTimeout(60);
  }
  throw new Error('대화가 끝나지 않음');
}

// 플레이어를 타일 좌표로 옮긴다
export async function teleport(page, tx, ty) {
  await page.evaluate(([x, y]) => {
    const pl = window.__game.scene.getScene('Field').player;
    pl.sprite.x = x * 16 + 8;
    pl.sprite.y = y * 16 + 8;
    pl.idleTime = 0;
  }, [tx, ty]);
  await page.waitForTimeout(200);
}

// 플래그가 켜질 때까지 (대화 도중에 켜질 수 있으니 넘기면서)
export async function waitFlag(page, flag, timeout = 30_000) {
  await advanceUntil(page, (f) => Boolean(window.__ud.run?.flags?.[f]), flag, timeout, `플래그 ${flag}`);
}

export async function waitBusy(page, timeout = 30_000) {
  await page.waitForFunction(() => {
    const g = window.__game;
    return g.scene.isActive('Field') && g.scene.getScene('Field').cutscene.busy;
  }, null, { timeout });
}
