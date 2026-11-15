// 유물: 지니면 싸움이 바뀐다. 겹치고, 서로 섞인다(칼바람 + 불씨 이빨 = 불타는 칼바람).
import { describe, it, expect } from 'vitest';
import { createAction, relicFx, PLAYER } from '../../src/action/engine.js';
import { RELICS, RELIC_ICONS } from '../../content/action/relics.js';
import { STARTER_KIT, QUICK_DEFAULT } from '../../content/action/action.js';
import { ITEMS } from '../../content/items.js';
import { pickRelic } from '../../src/battle/encounters.js';
import { listBag } from '../../src/life/bag.js';
import { migrate } from '../../src/core/save/SaveSchema.js';
import { buy } from '../../src/shop/shop.js';
import { smart, runBot } from '../helpers/bots.js';
import { POOLS } from '../../content/battles/encounters.js';

const DT = 1 / 60;
const kit = () => ({ bag: { ...STARTER_KIT }, quick: [...QUICK_DEFAULT] });
// 적을 세워 두고(공격하지 않게) 주인공 앞에 둔다
const setup = (relics, enemies = ['slime_big']) => {
  const a = createAction({ enemies, seed: 1, relics, ...kit() });
  const p = a.state.p;
  a.state.foes.forEach((f, i) => { f.timer = 999; f.x = p.x + (i - (enemies.length - 1) / 2) * 20; f.y = p.y - 40; });
  return a;
};
const run = (a, n, input = () => ({})) => { const ev = []; for (let i = 0; i < n; i += 1) ev.push(...a.step(DT, input(i))); return ev; };
const up = (a) => ({ x: a.state.p.x, y: a.state.p.y - 100 });

describe('유물', () => {
  it('스무 가지가 넘고, 모두 이름·설명·그림·나오는 곳이 있다', () => {
    expect(Object.keys(RELICS).length).toBeGreaterThanOrEqual(20);
    for (const [id, r] of Object.entries(RELICS)) {
      expect(r.name && r.desc && r.where.length, id).toBeTruthy();
      expect(RELIC_ICONS[id].rows.length, id).toBe(16);
      expect(ITEMS[id].kind, id).toBe('relic');
      for (const k of Object.keys(r.fx)) expect(k in relicFx({}), `${id}.${k}`).toBe(true);
    }
  });
  it('없으면 싸움이 그대로다 (같은 씨앗 같은 결과)', () => {
    const a = createAction({ enemies: ['sweeper'], seed: 5, ...kit() }), b = createAction({ enemies: ['sweeper'], seed: 5, relics: {}, ...kit() });
    for (let i = 0; i < 600; i += 1) { a.step(DT, smart(a.state)); b.step(DT, smart(b.state)); }
    expect(a.state.p.hp).toBe(b.state.p.hp);
  });
  it('겹치면 더해진다: 숫돌 둘이면 피해 +30%', () => {
    expect(relicFx({ whetstone: 2 }).dmg).toBeCloseTo(0.3);
    const hit = (relics) => { const a = setup(relics); a.state.foes[0].y = a.state.p.y - 14; return run(a, 1, () => ({ atk: true, aim: up(a) })).find((e) => e.type === 'hurt' && e.to !== 'p').dmg; };
    expect(hit({ whetstone: 2 })).toBeGreaterThan(hit({}));
  });
  it('유리 칼날: 세지지만 최대 체력이 준다 / 쇠 심장: 체력이 는다', () => {
    expect(createAction({ enemies: ['slime'], relics: { glassBlade: 1 } }).state.p.maxHp).toBe(PLAYER.maxHp - 35);
    expect(createAction({ enemies: ['slime'], relics: { ironHeart: 1 } }).state.p.maxHp).toBe(PLAYER.maxHp + 25);
  });
  it('칼바람: 기본 공격마다 앞으로 날아가 멀리 있는 적을 벤다. 두 갈래 바람이면 둘', () => {
    const a = setup({ bladeWave: 1 });
    const ev = run(a, 40, (i) => (i === 0 ? { atk: true, aim: up(a) } : { aim: up(a) }));
    expect(ev.some((e) => e.type === 'hurt' && e.skill === 'wave')).toBe(true);
    const b = setup({ bladeWave: 1, twinWind: 1 });
    b.step(DT, { atk: true, aim: up(b) });
    expect(b.state.shots.filter((x) => x.kind === 'wave').length).toBe(2);
  });
  it('섞인다: 칼바람 + 불씨 이빨 → 칼바람에 맞은 적이 탄다', () => {
    let burned = 0;
    for (let seed = 1; seed <= 12; seed += 1) {
      const a = createAction({ enemies: ['slime_big'], seed, relics: { bladeWave: 1, emberTooth: 2 }, ...kit() });
      const f = a.state.foes[0], p = a.state.p;
      f.timer = 999; f.x = p.x; f.y = p.y - 50;
      const ev = run(a, 40, (i) => (i === 0 ? { atk: true, aim: { x: p.x, y: p.y - 100 } } : {}));
      if (ev.some((e) => e.type === 'status' && e.id === 'burn' && e.to === f.uid)) burned += 1;
    }
    expect(burned).toBeGreaterThan(0);
  });
  it('쫓는 눈: 옆으로 쏜 칼바람이 적 쪽으로 휜다', () => {
    const a = setup({ bladeWave: 1, seekingEye: 1 });
    const f = a.state.foes[0], p = a.state.p;
    f.x = p.x + 50; f.y = p.y - 50;
    const ev = run(a, 60, (i) => (i === 0 ? { atk: true, aim: { x: p.x, y: p.y - 100 } } : {}));
    expect(ev.some((e) => e.type === 'hurt' && e.skill === 'wave')).toBe(true);
  });
  it('꿰뚫는 바늘: 칼바람이 줄 선 적을 여럿 벤다', () => {
    const a = createAction({ enemies: ['slime_big', 'slime_big', 'slime_big'], seed: 1, relics: { bladeWave: 1, needle: 1 }, ...kit() });
    const p = a.state.p;
    a.state.foes.forEach((f, i) => { f.timer = 999; f.x = p.x; f.y = p.y - 40 - i * 22; });
    const ev = run(a, 60, (i) => (i === 0 ? { atk: true, aim: { x: p.x, y: p.y - 200 } } : {}));
    expect(new Set(ev.filter((e) => e.type === 'hurt' && e.skill === 'wave').map((e) => e.to)).size).toBeGreaterThanOrEqual(2);
  });
  it('터지는 씨앗: 쓰러진 적이 터져 곁의 적이 다치고, 이어서 터진다', () => {
    const a = createAction({ enemies: ['slime', 'slime', 'slime'], seed: 1, relics: { bombSeed: 3 }, ...kit() });
    const p = a.state.p;
    a.state.foes.forEach((f, i) => { f.timer = 999; f.x = p.x + (i - 1) * 14; f.y = p.y - 16; f.hp = 1; });
    const ev = run(a, 2, (i) => (i === 0 ? { atk: true, aim: { x: p.x + 40, y: p.y - 16 } } : {}));
    expect(ev.filter((e) => e.type === 'blast').length).toBeGreaterThanOrEqual(1);
    expect(a.state.foes.every((f) => f.hp <= 0)).toBe(true);
  });
  it('넋 촛불: 쓰러뜨리면 체력이 찬다 / 거머리 반지: 준 피해만큼 조금씩', () => {
    const a = setup({ soulCandle: 1 }, ['slime']);
    a.state.p.hp = 50; a.state.foes[0].hp = 1; a.state.foes[0].y = a.state.p.y - 14;
    run(a, 1, () => ({ atk: true, aim: up(a) }));
    expect(a.state.p.hp).toBe(52);
    const b = setup({ leechRing: 3 });
    b.state.p.hp = 50; b.state.foes[0].y = b.state.p.y - 14;
    run(b, 200, () => ({ atk: true, aim: up(b) }));
    expect(b.state.p.hp).toBeGreaterThan(50);
  });
  it('번개 못: 맞히면 가끔 곁의 다른 적에게 튄다', () => {
    let chained = 0;
    for (let seed = 1; seed <= 10; seed += 1) {
      const a = createAction({ enemies: ['slime_big', 'slime_big'], seed, relics: { stormNail: 2 }, ...kit() });
      const p = a.state.p;
      a.state.foes.forEach((f, i) => { f.timer = 999; f.x = p.x + i * 40; f.y = p.y - 14; });
      if (run(a, 1, () => ({ atk: true, aim: { x: p.x, y: p.y - 30 } })).some((e) => e.type === 'chain')) chained += 1;
    }
    expect(chained).toBeGreaterThan(0);
  });
  it('그림자 걸음: 구르면 칼바람 고리 / 가시 껍질: 맞으면 가시', () => {
    const a = setup({ shadowStep: 1 });
    run(a, 1, () => ({ dodge: true, move: { x: 1, y: 0 } }));
    expect(a.state.shots.filter((x) => x.from === 'player').length).toBe(6);
    const b = setup({ thornCoat: 1 });
    b.state.shots.push({ x: b.state.p.x, y: b.state.p.y, vx: 0, vy: 0, r: 4, dmg: 5, from: 'x', life: 1 });
    b.step(DT, {});
    expect(b.state.shots.filter((x) => x.kind === 'thorn').length).toBe(8);
  });
  it('잠복의 깃: 구른 뒤 첫 공격이 세다 / 메아리 종: 찌르기가 한 번 더', () => {
    const hit = (dodge) => {
      const a = setup({ ambush: 1 });
      a.state.foes[0].y = a.state.p.y - 14;
      if (dodge) run(a, 40, (i) => (i === 0 ? { dodge: true, move: { x: 0, y: 1 } } : {}));
      a.state.foes[0].x = a.state.p.x; a.state.foes[0].y = a.state.p.y - 14;
      return run(a, 1, () => ({ atk: true, aim: up(a) })).find((e) => e.type === 'hurt' && e.to !== 'p')?.dmg ?? 0;
    };
    expect(hit(true)).toBeGreaterThan(hit(false));
    const b = setup({ echoBell: 1 });
    b.state.foes[0].y = b.state.p.y - 20;
    const ev = run(b, 30, (i) => (i === 0 ? { q: true, aim: up(b) } : { aim: up(b) }));
    expect(ev.filter((e) => e.type === 'hurt' && e.skill === 'q').length).toBe(2);
  });
  it('쌓으면 강해진다: 유물을 잔뜩 든 봇이 맨손보다 깊은 굴의 무리를 더 잘 이긴다', () => {
    const many = { bladeWave: 1, twinWind: 1, seekingEye: 1, emberTooth: 1, stormNail: 1, whetstone: 2, ironHeart: 1, leechRing: 1 };
    const wins = (relics) => { let w = 0; for (let seed = 1; seed <= 6; seed += 1) if (runBot(createAction({ enemies: POOLS.deepCave[0], seed, relics, ...kit() }), smart) === 'win') w += 1; return w; };
    expect(wins(many)).toBeGreaterThan(wins({}));
  });
});

describe('유물을 얻고 지니기', () => {
  it('고르기는 같은 씨앗이면 같고, 확률을 넘으면 없다. 보스는 보스용에서', () => {
    expect(pickRelic({ seed: 3 })).toBe(pickRelic({ seed: 3 }));
    expect(pickRelic({ seed: 3, chance: 0 })).toBe(null);
    for (let i = 1; i < 30; i += 1) expect(RELICS[pickRelic({ seed: i, boss: true })].where).toContain('boss');
  });
  it('가방의 유물 탭에 수만큼 보인다', () => {
    const l = listBag({ items: {} }, { relics: { whetstone: 2 } });
    expect(l.find((x) => x.id === 'whetstone')).toMatchObject({ count: 2 });
  });
  it('가게에서 사면 유물에 들어간다', () => {
    const run = { shop: { purse: 999, sold: {} }, relics: {} };
    const r = buy(run, 'potions', 'bladeWave', 1);
    expect(r.ok).toBe(true);
    expect(r.changes.relics.bladeWave).toBe(1);
  });
  it('세이브 v13 → v14: 유물 칸이 생긴다', () => {
    const s = migrate({ version: 13, world: { loads: 0, erased: [] }, run: { flags: {} }, meta: {} });
    expect(s.run.relics).toEqual({});
  });
});
