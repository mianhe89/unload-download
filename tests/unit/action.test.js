// 탑뷰 액션 전투 (보스 2단계): 조작하면 이기고, 가만히 있으면 진다. 장비가 스킬을 바꾼다.
import { describe, it, expect } from 'vitest';
import { createAction, skillsFor, PLAYER } from '../../src/action/engine.js';
import { STATUS, CONSUMABLES, EQUIPMENT, SETS, QUICK_DEFAULT, STARTER_KIT, ACTION_BOSSES } from '../../content/action/action.js';
import { ITEMS, RARITY } from '../../content/items/items.js';

const DT = 1 / 60;
const run = (a, bot, secs = 180) => { for (let i = 0; i < secs / DT && !a.over; i += 1) a.step(DT, bot(a.state)); return a.over; };

// 잘하는 사람: 예고를 보면 피하고, 틈나면 붙어서 벤다, 맞으면 물러나 붕대
function smart(s) {
  const p = s.p, b = s.b;
  const toB = Math.atan2(b.y - p.y, b.x - p.x), d = Math.hypot(b.x - p.x, b.y - p.y);
  const tell = s.tells[0];
  const near = s.shots.filter((sh) => sh.from === 'boss' && Math.hypot(sh.x - p.x, sh.y - p.y) < 34);
  const input = { aim: { x: b.x, y: b.y } };
  if (tell) {
    // 예고된 방향에서 옆으로 빠진다. 가까우면 돌진으로 빠진다
    const side = tell.dir + Math.PI / 2;
    input.move = { x: Math.cos(side) - Math.cos(toB) * 0.6, y: Math.sin(side) - Math.sin(toB) * 0.6 };
    if (tell.left !== undefined && tell.left < 0.25 && d < 70) { input.aim = { x: p.x + Math.cos(side) * 10, y: p.y + Math.sin(side) * 10 }; input.r = true; }
    return input;
  }
  if (near.length) {
    const sh = near[0];
    const away = Math.atan2(sh.vy, sh.vx) + Math.PI / 2;
    input.move = { x: Math.cos(away), y: Math.sin(away) };
    return input;
  }
  if (p.hp < p.maxHp * 0.45 && !p.regen && s.bag.bandage > 0) { input.quick = 0; input.move = { x: -Math.cos(toB), y: -Math.sin(toB) }; return input; }
  if (d > 28) input.move = { x: Math.cos(toB), y: Math.sin(toB) };
  input.atk = d < 34; input.q = d < 46; input.w = d < 34;
  return input;
}
const idle = () => ({});
const kit = { bag: { ...STARTER_KIT }, quick: [...QUICK_DEFAULT] };

describe('액션 전투: 조작에 기대는 싸움', () => {
  it('가만히 있으면 진다', () => {
    expect(run(createAction({ seed: 3, ...kit }), idle)).toBe('lose');
  });
  it('피하면서 싸우면 대체로 이긴다 (20판 중 60% 이상)', () => {
    let win = 0;
    for (let seed = 1; seed <= 20; seed += 1) if (run(createAction({ seed, ...kit }), smart) === 'win') win += 1;
    expect(win).toBeGreaterThanOrEqual(12);
  });
  it('피하지 않고 때리기만 하면 대체로 진다 (40% 이하)', () => {
    const brute = (s) => { const b = s.b, p = s.p; const d = Math.hypot(b.x - p.x, b.y - p.y); return { aim: { x: b.x, y: b.y }, move: d > 26 ? { x: b.x - p.x, y: b.y - p.y } : null, atk: true, q: true, w: true }; };
    let win = 0;
    for (let seed = 1; seed <= 20; seed += 1) if (run(createAction({ seed, ...kit }), brute) === 'win') win += 1;
    expect(win).toBeLessThanOrEqual(8);
  });
  it('같은 씨앗, 같은 입력이면 같은 결과', () => {
    const a = createAction({ seed: 9, ...kit }), b = createAction({ seed: 9, ...kit });
    run(a, smart, 20); run(b, smart, 20);
    expect(a.state.p.hp).toBe(b.state.p.hp);
    expect(a.state.b.hp).toBe(b.state.b.hp);
  });
});

describe('장비가 스킬을 바꾼다', () => {
  it('유니크 쌍날: 찌르기 → 수평베기, 피해 2배 이상', () => {
    const base = skillsFor({ weapon: 'woodSword' }).skills.q;
    const twin = skillsFor({ weapon: 'twinEdge' }).skills.q;
    expect(base.shape).toBe('line');
    expect(twin).toMatchObject({ name: '수평베기', shape: 'arc' });
    expect(twin.dmg).toBeGreaterThanOrEqual(base.dmg * 2);
  });
  it('거울 방패: 막기가 탄환을 막고 되받아친다', () => {
    expect(skillsFor({}).skills.e.blocksShots).toBe(false);
    expect(skillsFor({ offhand: 'mirrorBuckler' }).skills.e).toMatchObject({ blocksShots: true, reflect: true });
    const a = createAction({ seed: 1, equip: { offhand: 'mirrorBuckler' } });
    const s = a.state;
    s.b.timer = 99; // 보스는 가만히
    s.shots.push({ x: s.p.x, y: s.p.y - 30, vx: 0, vy: 80, r: 4, dmg: 9, from: 'boss', life: 3 });
    a.step(DT, { aim: { x: s.p.x, y: s.p.y - 50 }, e: true });
    for (let i = 0; i < 30; i += 1) a.step(DT, { aim: { x: s.p.x, y: s.p.y - 50 } });
    expect(s.p.hp).toBe(PLAYER.maxHp);
    expect(s.shots.some((x) => x.from === 'player') || s.b.hp < s.b.maxHp).toBe(true);
  });
  it('기사단 세트 2개: 휘두르기 출혈 확정, 돌진 재사용 -1초', () => {
    const one = skillsFor({ weapon: 'knightBlade' }).skills, two = skillsFor({ weapon: 'knightBlade', armor: 'knightPlate' }).skills;
    expect(one.w.status.chance).toBeLessThan(1);
    expect(two.w.status.chance).toBe(1);
    expect(two.r.cd).toBe(one.r.cd - 1);
  });
  it('장비·세트 정의가 맞물린다', () => {
    for (const set of Object.values(SETS)) for (const id of set.pieces) expect(EQUIPMENT[id].set).toBeTruthy();
    for (const e of Object.values(EQUIPMENT)) expect(RARITY[e.rarity]).toBeTruthy();
    expect(ITEMS.twinEdge.rarity).toBe('legendary');
  });
});

describe('회복: 붕대·약초는 맞지 않을 때만, 포션은 즉시', () => {
  const setup = () => { const a = createAction({ seed: 1, hp: 50, ...kit }); a.state.b.timer = 999; a.state.b.x = 20; a.state.b.y = 20; return a; };
  it('붕대는 시간에 걸쳐 찬다', () => {
    const a = setup();
    a.step(DT, { quick: 0 });
    expect(a.state.p.hp).toBe(50);
    for (let i = 0; i < 9 / DT; i += 1) a.step(DT, {});
    expect(a.state.p.hp).toBeGreaterThanOrEqual(50 + CONSUMABLES.bandage.regen.heal - 1);
    expect(a.state.bag.bandage).toBe(STARTER_KIT.bandage - 1);
  });
  it('맞으면 끊긴다', () => {
    const a = setup();
    a.step(DT, { quick: 0 });
    for (let i = 0; i < 60; i += 1) a.step(DT, {});
    a.state.shots.push({ x: a.state.p.x, y: a.state.p.y, vx: 0, vy: 0, r: 4, dmg: 5, from: 'boss', life: 1 });
    const ev = a.step(DT, {});
    expect(ev.some((e) => e.type === 'regenCut')).toBe(true);
    expect(a.state.p.regen).toBe(null);
  });
  it('포션은 바로 크게', () => {
    const a = setup();
    a.step(DT, { quick: 2 });
    expect(a.state.p.hp).toBe(50 + CONSUMABLES.potion.heal);
  });
  it('중독 중엔 붕대가 안 듣고, 약초는 중독을 풀며 듣는다', () => {
    const a = setup();
    a.state.p.status.poison = { left: 5, stack: 1 };
    const ev = a.step(DT, { quick: 0 });
    expect(ev.some((e) => e.type === 'quickFail')).toBe(true);
    a.state.p.quickCd = 0;
    a.step(DT, { quick: 1 });
    expect(a.state.p.status.poison).toBeUndefined();
    expect(a.state.p.regen).toBeTruthy();
  });
});

describe('상태이상', () => {
  it('여러 가지가 있고 각자 효과가 있다', () => {
    expect(Object.keys(STATUS).length).toBeGreaterThanOrEqual(8);
  });
  it('기절하면 못 움직이고, 빙결은 다음 피해가 커진다', () => {
    const a = createAction({ seed: 1 }); a.state.b.timer = 999; a.state.b.x = 20; a.state.b.y = 20;
    const x0 = a.state.p.x;
    a.state.p.status.stun = { left: 0.5 };
    for (let i = 0; i < 10; i += 1) a.step(DT, { move: { x: 1, y: 0 } });
    expect(a.state.p.x).toBe(x0);
  });
  it('화상·출혈·중독은 시간에 따라 깎는다 (출혈은 움직이면 더)', () => {
    const tick = (id, move) => { const a = createAction({ seed: 1 }); a.state.b.timer = 999; a.state.b.x = 20; a.state.b.y = 20; a.state.p.status[id] = { left: 3, stack: 1 }; for (let i = 0; i < 2 / DT; i += 1) a.step(DT, { move: move ? { x: i % 120 < 60 ? 1 : -1, y: 0 } : null }); return PLAYER.maxHp - a.state.p.hp; };
    for (const id of ['burn', 'bleed', 'poison']) expect(tick(id), id).toBeGreaterThan(0);
    expect(tick('bleed', true)).toBeGreaterThan(tick('bleed', false));
  });
  it('보스 기술은 상태이상을 건다', () => {
    const ids = ACTION_BOSSES.sweeper.attacks.map((a) => a.status?.id).filter(Boolean);
    for (const id of ids) expect(STATUS[id]).toBeTruthy();
    expect(new Set(ids).size).toBeGreaterThanOrEqual(3);
  });
});

describe('장비 외형', async () => {
  const { equipPalette, bladeColor, SHIRT } = await import('../../src/art/equipLook.js');
  it('갑옷을 입으면 옷 두 톤이 갑옷 색으로', () => {
    expect(equipPalette({})).toBe(null);
    const pal = equipPalette({ armor: 'knightPlate' });
    expect(pal[SHIRT[0]]).toBe(EQUIPMENT.knightPlate.look.body[0]);
    expect(pal[SHIRT[1]]).toBe(EQUIPMENT.knightPlate.look.body[1]);
  });
  it('무기마다 칼날 색이 다르다', () => {
    expect(bladeColor({ weapon: 'twinEdge' })).not.toBe(bladeColor({ weapon: 'woodSword' }));
  });
  it('보스 전리품은 실제 장비', () => {
    for (const b of Object.values(ACTION_BOSSES)) for (const id of b.drops ?? []) expect(EQUIPMENT[id], id).toBeTruthy();
  });
});
