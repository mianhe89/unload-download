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
  // 타이틀이 막 시작됐으면 입력이 아직 안 받힐 수 있다
  await page.waitForFunction(() => { const t = window.__game.scene.getScene('Title'); return window.__game.scene.isActive('Title') && t.sys.settings.status === 5 && t.input.enabled; });
  await page.waitForTimeout(200);
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
  // 씬이 다시 시작되는 중이면 phaseId만 먼저 바뀐다 — 실제로 돌고 있고(RUNNING=5) 플레이어가 생긴 뒤까지 기다린다
  await advanceUntil(page, (ph) => {
    const g = window.__game;
    const f = g.scene.getScene('Field');
    return g.scene.isActive('Field') && f.sys.settings.status === 5 && f.player?.sprite?.active && (!ph || f.phaseId === ph);
  }, phase, timeout, `필드 페이즈 ${phase ?? ''}`);
  await page.waitForTimeout(250); // 들어오자마자 시작되는 컷신(onEnter)이 걸릴 틈
}

// 조건이 참이 될 때까지, 대화가 떠 있으면 넘기면서 기다린다
export async function advanceUntil(page, fn, arg, timeout = 30_000, what = '조건') {
  const until = Date.now() + timeout;
  while (Date.now() < until) {
    if (await page.evaluate(fn, arg)) return;
    // 대화창이든 걸으며 듣는 말풍선이든 넘긴다
    const s = await state(page);
    if (s.talking || s.busy) await page.keyboard.press('Space');
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

// 액션 전투를 끝낸다: 적을 모두 체력 1로 주인공 앞에 모으고, 그쪽을 클릭해 벤다
export async function winAction(page) {
  await page.waitForFunction(() => window.__game.scene.isActive('Action') && !window.__game.scene.getScene('Action').paused, null, { timeout: 15_000 });
  for (let round = 0; round < 40; round += 1) {
    const left = await page.evaluate(() => {
      const a = window.__game.scene.getScene('Action');
      if (!a?.engine || a.engine.over) return 0;
      const s = a.engine.state;
      s.queue.length = 0;
      for (const f of s.foes) if (f.hp > 0) { f.hp = 1; f.timer = 99; f.state = 'rest'; f.charge = null; f.x = s.p.x; f.y = s.p.y - 14; }
      return s.foes.filter((f) => f.hp > 0).length;
    });
    if (!left) break;
    const at = await page.evaluate(() => { const a = window.__game.scene.getScene('Action'); const p = a.engine.state.p; const r = a.game.canvas.getBoundingClientRect(); const k = r.width / a.scale.width; return { x: r.left + (a.ox + p.x * a.Z) * k, y: r.top + (a.oy + (p.y - 14) * a.Z) * k }; });
    await page.mouse.click(at.x, at.y);
    await page.waitForTimeout(450);
  }
  await page.waitForFunction(() => !window.__game.scene.isActive('Action') || window.__game.scene.getScene('Action').engine.over === 'win', null, { timeout: 10_000 });
}
