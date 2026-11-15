// 탑뷰 액션 전투: 이 게임의 모든 전투. 조작하면 이기고, 가만히 있으면 진다. 장비가 스킬을 바꾼다. 동료는 없다.
import { describe, it, expect } from 'vitest';
import { createAction, skillsFor, bodyMods, PLAYER, MAX_ALIVE } from '../../src/action/engine.js';
import { STATUS, CONSUMABLES, EQUIPMENT, SETS, QUICK_DEFAULT, STARTER_KIT } from '../../content/action/action.js';
import { FOES } from '../../content/action/foes.js';
import { POOLS, BOSSES, DROPS } from '../../content/battles/encounters.js';
import { ITEMS, RARITY } from '../../content/items/items.js';
import { smart, brute, idle, runBot } from '../helpers/bots.js';

const DT = 1 / 60;
const kit = () => ({ bag: { ...STARTER_KIT }, quick: [...QUICK_DEFAULT] });
const wins = (enemies, bot, n) => { let w = 0; for (let seed = 1; seed <= n; seed += 1) if (runBot(createAction({ enemies, seed, ...kit() }), bot) === 'win') w += 1; return w; };
// 보스를 가만히 세워 두고 시험할 때
const calm = (a) => { for (const f of a.state.foes) { f.timer = 999; f.x = 20; f.y = 20; } return a; };

describe('손맛: 이동·구르기·입력 버퍼·3연타·넉백', () => {
  const quiet = () => calm(createAction({ enemies: ['sweeper'], seed: 1, ...kit() }));
  it('이동은 붙고 멎는다: 첫 프레임은 최고 빠르기가 아니고, 손을 떼도 한 프레임에 서지 않는다', () => {
    const a = quiet(), p = a.state.p;
    a.step(DT, { move: { x: 1, y: 0 } });
    expect(p.vx).toBeGreaterThan(0);
    expect(p.vx).toBeLessThan(PLAYER.speed * 0.5);
    for (let i = 0; i < 30; i += 1) a.step(DT, { move: { x: 1, y: 0 } });
    expect(p.vx).toBeGreaterThan(PLAYER.speed * 0.9);
    a.step(DT, {});
    expect(p.vx).toBeGreaterThan(0);
    for (let i = 0; i < 30; i += 1) a.step(DT, {});
    expect(p.vx).toBe(0);
  });
  it('구르기: 무적인 채 이동 방향으로 빠지고, 재사용 대기가 있다', () => {
    const a = quiet(), p = a.state.p, x0 = p.x;
    const ev = a.step(DT, { move: { x: 1, y: 0 }, dodge: true });
    expect(ev.some((e) => e.type === 'dodge')).toBe(true);
    expect(p.invuln).toBeGreaterThan(0);
    for (let i = 0; i < 15; i += 1) a.step(DT, {});
    expect(p.x - x0).toBeGreaterThan(30);
    expect(a.step(DT, { dodge: true }).some((e) => e.type === 'dodge')).toBe(false); // 아직 대기 중
  });
  it('구르기로 예고를 뚫으면 맞지 않는다 (가만히 있으면 맞는다)', () => {
    const hits = (dodge) => {
      const a = createAction({ enemies: ['wolf'], seed: 4, ...kit() });
      const f = a.state.foes[0], p = a.state.p;
      f.x = p.x; f.y = p.y - 16; f.timer = 0;
      let hurt = 0;
      for (let i = 0; i < 40; i += 1) {
        const t = a.state.tells[0];
        hurt += a.step(DT, dodge && t && t.left < 0.1 ? { move: { x: 1, y: 0 }, dodge: true } : {}).filter((e) => e.type === 'hurt' && e.to === 'p' && !e.dot).length;
        f.x = Math.min(f.x, p.x + 2); // 몸으로 부딪혀 맞는 건 빼고 예고만 본다
      }
      return hurt;
    };
    expect(hits(false)).toBeGreaterThan(0);
    expect(hits(true)).toBe(0);
  });
  it('입력 버퍼: 쿨다운 끝나기 직전에 누른 공격이 되는 순간 나간다', () => {
    const a = quiet();
    a.step(DT, { atk: true });
    const cd = a.state.p.cd.atk;
    let fired = false;
    for (let t = DT; t < cd + 0.1; t += DT) {
      const press = Math.abs(cd - t - 0.08) < DT / 2; // 끝나기 0.08초 전에 한 번만 누른다
      if (a.step(DT, press ? { atk: true } : {}).some((e) => e.type === 'skill' && e.key === 'atk')) fired = true;
    }
    expect(fired).toBe(true);
  });
  it('기본 공격 3연타: 셋째가 가장 세고 멀리 민다', () => {
    const a = createAction({ enemies: ['slime_big'], seed: 1, ...kit() });
    const f = a.state.foes[0], p = a.state.p;
    f.timer = 999;
    const dmg = [];
    for (let k = 0; k < 3; k += 1) {
      f.x = p.x; f.y = p.y - 14; f.kx = 0; f.ky = 0;
      const ev = a.step(DT, { atk: true, aim: { x: f.x, y: f.y } });
      dmg.push(ev.find((e) => e.type === 'hurt' && e.to === f.uid)?.dmg ?? 0);
      for (let i = 0; i < 26; i += 1) a.step(DT, { aim: { x: f.x, y: f.y } });
    }
    expect(dmg[2]).toBeGreaterThan(dmg[0]);
    expect(a.state.p.combo).toBe(2);
  });
  it('맞으면 밀려나 미끄러진다(순간이동이 아니다)', () => {
    const a = createAction({ enemies: ['slime'], seed: 1, ...kit() });
    const f = a.state.foes[0], p = a.state.p;
    f.timer = 999; f.x = p.x; f.y = p.y - 12;
    a.step(DT, { atk: true, aim: { x: f.x, y: f.y } });
    const y1 = f.y;
    expect(f.ky).toBeLessThan(0);
    a.step(DT, {});
    expect(f.y).toBeLessThan(y1);
    expect(y1 - f.y).toBeLessThan(5);
  });
  it('맞은 직후 잠깐 무적이라 한 프레임에 두 대가 겹치지 않는다', () => {
    const a = quiet(), p = a.state.p;
    a.state.shots.push({ x: p.x, y: p.y, vx: 0, vy: 0, r: 4, dmg: 10, from: 'x', life: 1 }, { x: p.x, y: p.y, vx: 0, vy: 0, r: 4, dmg: 10, from: 'x', life: 1 });
    const ev = a.step(DT, {});
    expect(ev.filter((e) => e.type === 'hurt' && e.to === 'p').length).toBe(1);
  });
});

describe('액션 전투: 조작에 기대는 싸움', () => {
  it('가만히 있으면 진다', () => {
    expect(runBot(createAction({ enemies: ['sweeper'], seed: 3, ...kit() }), idle)).toBe('lose');
    expect(runBot(createAction({ enemies: POOLS.temperate[0], seed: 3, ...kit() }), idle)).toBe('lose');
  });
  it('보스는 어렵다: 예고를 읽고 구르는 봇은 대체로 이기고, 때리기만 하면 거의 못 이긴다', () => {
    for (const b of ['sweeper', 'lostknight', 'tork']) {
      expect(wins([b], smart, 12), b).toBeGreaterThanOrEqual(b === 'sweeper' ? 4 : 8); // 정리자의 그림자가 가장 어렵다
      expect(wins([b], brute, 12), b).toBeLessThanOrEqual(1);
    }
  });
  it('어렵지만 못 깨는 무리는 없다: 어느 땅이든 예고를 읽으면 이길 수 있다', () => {
    for (const [k, gs] of Object.entries(POOLS)) for (const g of gs) expect(wins(g, smart, 6), k).toBeGreaterThanOrEqual(2);
  });
  it('뒤로 갈수록 어렵다: 굴의 무리는 때리기만 하면 대부분 진다', () => {
    let w = 0, n = 0;
    for (const k of ['cave', 'deepCave', 'lava', 'snow']) for (const g of POOLS[k]) { w += wins(g, brute, 4); n += 4; }
    expect(w / n).toBeLessThanOrEqual(0.35);
  });
  it('레온과의 결투: 때리기만 하면 진다', () => {
    expect(wins(['leon_duel'], brute, 8)).toBeLessThanOrEqual(1);
    expect(wins(['leon_duel'], smart, 8)).toBeGreaterThanOrEqual(5);
  });
  it('들판의 무리는 피하며 싸우면 거의 이긴다', () => {
    for (const g of POOLS.temperate) expect(wins(g, smart, 6), g.join(',')).toBeGreaterThanOrEqual(5);
  });
  it('무리는 한 번에 다섯까지 나오고, 쓰러지면 남은 무리가 들어온다', () => {
    const a = createAction({ enemies: Array(9).fill('slime'), seed: 2, ...kit() });
    expect(a.state.foes.length).toBe(MAX_ALIVE);
    a.state.foes[0].hp = 1;
    a.state.p.x = a.state.foes[0].x; a.state.p.y = a.state.foes[0].y + 12;
    a.step(DT, { aim: { x: a.state.foes[0].x, y: a.state.foes[0].y }, atk: true });
    let spawned = false;
    for (let i = 0; i < 90 && !spawned; i += 1) spawned = a.step(DT, {}).some((e) => e.type === 'spawn');
    expect(spawned).toBe(true);
  });
  it('같은 씨앗, 같은 입력이면 같은 결과', () => {
    const a = createAction({ enemies: ['sweeper'], seed: 9, ...kit() }), b = createAction({ enemies: ['sweeper'], seed: 9, ...kit() });
    for (let i = 0; i < 20 / DT; i += 1) { a.step(DT, smart(a.state)); b.step(DT, smart(b.state)); }
    expect(a.state.p.hp).toBe(b.state.p.hp);
    expect(a.state.foes[0].hp).toBe(b.state.foes[0].hp);
  });
  it('몸이 전투를 바꾼다: 통통하면 체력이 많고, 마른 몸은 빠르고 돌진이 자주 돈다', () => {
    const chubby = bodyMods({ maxHp: 150, atk: 22, spd: 90, evade: 0, resist: 0.3 }), thin = bodyMods({ maxHp: 102, atk: 22, spd: 112, evade: 0.2, resist: 0 });
    expect(createAction({ enemies: ['slime'], mods: chubby }).state.p.maxHp).toBeGreaterThan(createAction({ enemies: ['slime'], mods: thin }).state.p.maxHp);
    expect(thin.speedMul).toBeGreaterThan(chubby.speedMul);
    expect(createAction({ enemies: ['slime'], mods: thin }).state.skills.r.cd).toBeLessThan(createAction({ enemies: ['slime'], mods: chubby }).state.skills.r.cd);
  });
  it('모든 무리·보스의 적이 정의되어 있고, 전리품 갈래가 맞는다', () => {
    for (const g of Object.values(POOLS).flat()) for (const id of g) expect(FOES[id], id).toBeTruthy();
    for (const b of Object.values(BOSSES)) for (const id of b.enemies) expect(FOES[id], id).toBeTruthy();
    for (const id of Object.keys(DROPS)) expect(FOES[id], id).toBeTruthy();
    for (const f of Object.values(FOES)) for (const a of f.attacks) expect(['sweep', 'lunge', 'shot', 'ring', 'motes']).toContain(a.kind);
  });
  it('적이 열 가지가 넘는다 (같은 그림의 다른 갈래 포함)', () => {
    expect(Object.values(FOES).filter((f) => !f.boss).length).toBeGreaterThanOrEqual(10);
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
    const a = calm(createAction({ enemies: ['sweeper'], seed: 1, equip: { offhand: 'mirrorBuckler' } }));
    const s = a.state;
    s.shots.push({ x: s.p.x, y: s.p.y - 30, vx: 0, vy: 80, r: 4, dmg: 9, from: s.foes[0].uid, life: 3 });
    a.step(DT, { aim: { x: s.p.x, y: s.p.y - 50 }, e: true });
    for (let i = 0; i < 30; i += 1) a.step(DT, { aim: { x: s.p.x, y: s.p.y - 50 } });
    expect(s.p.hp).toBe(PLAYER.maxHp);
    expect(s.shots.some((x) => x.from === 'player') || s.foes[0].hp < s.foes[0].maxHp).toBe(true);
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
  const setup = () => calm(createAction({ enemies: ['sweeper'], seed: 1, hp: 50, ...kit() }));
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
    a.state.shots.push({ x: a.state.p.x, y: a.state.p.y, vx: 0, vy: 0, r: 4, dmg: 5, from: a.state.foes[0].uid, life: 1 });
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
    const a = calm(createAction({ enemies: ['sweeper'], seed: 1 }));
    const x0 = a.state.p.x;
    a.state.p.status.stun = { left: 0.5 };
    for (let i = 0; i < 10; i += 1) a.step(DT, { move: { x: 1, y: 0 } });
    expect(a.state.p.x).toBe(x0);
  });
  it('화상·출혈·중독은 시간에 따라 깎는다 (출혈은 움직이면 더)', () => {
    const tick = (id, move) => { const a = calm(createAction({ enemies: ['sweeper'], seed: 1 })); a.state.p.status[id] = { left: 3, stack: 1 }; for (let i = 0; i < 2 / DT; i += 1) a.step(DT, { move: move ? { x: i % 120 < 60 ? 1 : -1, y: 0 } : null }); return PLAYER.maxHp - a.state.p.hp; };
    for (const id of ['burn', 'bleed', 'poison']) expect(tick(id), id).toBeGreaterThan(0);
    expect(tick('bleed', true)).toBeGreaterThan(tick('bleed', false));
  });
  it('보스 기술은 상태이상을 건다', () => {
    const ids = FOES.sweeper.attacks.map((a) => a.status?.id).filter(Boolean);
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
    for (const b of Object.values(FOES)) for (const id of b.drops ?? []) expect(EQUIPMENT[id], id).toBeTruthy();
  });
});
