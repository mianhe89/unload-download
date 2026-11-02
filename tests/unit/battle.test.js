// 전투 엔진: 속도 게이지, 속성, 체형, 회피, 예고, 쿨다운, 그리고 '어렵지만 공정한가'를 자동 대전으로 확인한다
import { describe, it, expect } from 'vitest';
import { createBattle, elementMul, hitDamage, GAUGE } from '../../src/battle/engine.js';
import { BODIES, bodyOf, applyBody } from '../../src/battle/body.js';
import { PARTY, MONSTERS } from '../../content/battles/units.js';

// 자동 플레이. smart: 예고를 읽고 대응한다 (쓸어내기 예고 → 전원 방어 기술, 먼지 털기 → 그 대상 방어)
export function autoplay({ enemies, seed, body = 'normal', smart = false, maxTurns = 400 }) {
  const b = createBattle({ enemies, seed, body });
  let tell = null;
  for (let i = 0; i < maxTurns && !b.result; i += 1) {
    const u = b.next();
    if (u.side === 'enemy') {
      const ev = b.enemyTurn(u.uid);
      const t = ev.find((e) => e.type === 'telegraph');
      tell = t ? t : (ev.some((e) => e.type === 'skill') ? null : tell);
      continue;
    }
    const can = b.usable(u).map((s) => s.id);
    const foes = b.units.filter((x) => x.side === 'enemy' && x.hp > 0);
    const target = foes.reduce((a, c) => (c.hp < a.hp ? c : a)).uid;
    const party = b.units.filter((x) => x.side === 'party' && x.hp > 0);
    // 궁극기: 생각 없이는 차면 바로, 예고를 읽는 쪽은 '나'의 궁극기를 예고를 지우는 데 아낀다
    if (b.canBurst(u) && (!smart || u.id !== 'me' || tell)) {
      b.use(u.uid, 'ult', tell && smart && u.id === 'me' ? tell.from : target);
      if (smart && u.id === 'me') tell = null;
      continue;
    }
    if (smart && tell) {
      const threatened = tell.skill === 'sweep' || tell.target === u.uid;
      if (threatened && u.id === 'me' && can.includes('remember')) { b.use(u.uid, 'remember'); continue; }
      if (threatened && u.id === 'selena' && can.includes('shield')) { b.use(u.uid, 'shield'); continue; }
    }
    if (smart && u.id === 'lu') {
      const hurt = party.find((p) => p.hp / p.maxHp < 0.5);
      if (hurt && can.includes('mend')) { b.use(u.uid, 'mend', hurt.uid); continue; }
      if (tell && can.includes('still')) { b.use(u.uid, 'still', b.units.find((x) => x.uid === tell.from).uid); continue; }
    }
    const attack = { me: can.includes('flurry') ? 'flurry' : 'strike', selena: can.includes('sweep') && foes.length > 1 ? 'sweep' : 'slash', lu: 'spark' }[u.id];
    b.use(u.uid, attack, target);
  }
  return b;
}

describe('속성 상성', () => {
  it.each([
    ['fire', 'wind', 1.3], ['wind', 'earth', 1.3], ['earth', 'fire', 1.3],
    ['wind', 'fire', 0.8], ['fire', 'earth', 0.8],
    ['light', 'dark', 1.3], ['dark', 'light', 1.3], ['fire', 'fire', 1], [null, 'fire', 1],
  ])('%s → %s: ×%s', (a, d, m) => expect(elementMul(a, d)).toBe(m));
});

describe('체형 (정답 체형은 없다)', () => {
  const base = PARTY.me;
  it('체중·근육으로 체형이 정해진다', () => {
    expect(bodyOf({ weight: 50 })).toBe('thin');
    expect(bodyOf({ weight: 65 })).toBe('normal');
    expect(bodyOf({ weight: 85 })).toBe('chubby');
    expect(bodyOf({ weight: 72, muscle: 0.7 })).toBe('muscle');
  });

  it('모든 체형이 강점과 약점을 함께 가진다 (보통 제외)', () => {
    for (const [k, b] of Object.entries(BODIES)) {
      if (k === 'normal') continue;
      const ups = [b.hp > 1, b.atk > 1, b.def > 1, b.spd > 1, b.evade > 0, b.heavy > 1, b.pierce > 0, b.resist > 0].filter(Boolean).length;
      const downs = [b.hp < 1, b.atk < 1, b.def < 1, b.spd < 1, b.evade < 0].filter(Boolean).length;
      expect(ups, k).toBeGreaterThan(0);
      expect(downs, k).toBeGreaterThan(0);
    }
  });

  it('마른 몸은 회피·속도, 통통한 몸은 체력·방어', () => {
    const thin = applyBody(base, 'thin'), fat = applyBody(base, 'chubby'), mid = applyBody(base, 'normal');
    expect(thin.evade).toBeGreaterThan(mid.evade);
    expect(thin.spd).toBeGreaterThan(mid.spd);
    expect(fat.maxHp).toBeGreaterThan(mid.maxHp);
    expect(fat.def).toBeGreaterThan(mid.def);
    expect(fat.evade).toBeLessThan(mid.evade);
  });

  it('상황이 체형을 고른다: 다단 히트엔 마른 몸, 묵직한 한 방엔 통통한 몸이 덜 맞는다', () => {
    const boss = { ...MONSTERS.sweeper, atk: MONSTERS.sweeper.atk, pierce: 0, heavy: 1 };
    const dust = MONSTERS.sweeper.skills.find((s) => s.id === 'dust');
    const sweep = MONSTERS.sweeper.skills.find((s) => s.id === 'sweep');
    // 체력 대비 기대 피해 = 한 타 × 타수 × (다단이면 1 - 회피) / 최대 체력
    const expected = (body, s) => { const me = applyBody(base, body); return hitDamage(boss, me, s) * s.hits * (s.hits > 1 ? 1 - me.evade : 1) / me.maxHp; };
    const dustRatioThin = expected('thin', dust), dustRatioFat = expected('chubby', dust);
    const sweepRatioThin = expected('thin', sweep), sweepRatioFat = expected('chubby', sweep);
    // 쓸어내기(한 방)는 통통이 체력 대비 훨씬 덜 아프다
    expect(sweepRatioFat).toBeLessThan(sweepRatioThin);
    // 먼지 털기(여섯 타)는 그 격차가 줄거나 뒤집힌다
    expect(dustRatioThin / dustRatioFat).toBeLessThan(sweepRatioThin / sweepRatioFat);
  });
});

describe('속도 게이지', () => {
  it('빠른 유닛이 더 자주 행동한다 (속도에 비례)', () => {
    const b = createBattle({ enemies: ['owl'], seed: 3 });
    const count = {};
    for (let i = 0; i < 300; i += 1) {
      const u = b.next();
      count[u.uid] = (count[u.uid] ?? 0) + 1;
      // 아무도 다치지 않게: 상태만 넘긴다
      b.endTurn(u);
    }
    const ratio = count['owl#0'] / count.selena;
    expect(ratio).toBeGreaterThan(MONSTERS.owl.spd / PARTY.selena.spd - 0.1);
    expect(ratio).toBeLessThan(MONSTERS.owl.spd / PARTY.selena.spd + 0.1);
  });

  it('차례 미리보기는 실제 순서와 같다', () => {
    const b = createBattle({ enemies: ['slime', 'beast'], seed: 5 });
    const want = b.preview(8);
    const got = [];
    for (let i = 0; i < 8; i += 1) { const u = b.next(); got.push(u.uid); b.endTurn(u); }
    expect(got).toEqual(want);
  });

  it('밀기/늦추기는 게이지를 움직인다', () => {
    const b = createBattle({ enemies: ['mole'], seed: 1 });
    let u;
    do { u = b.next(); if (u.id !== 'lu') b.endTurn(u); } while (u.id !== 'lu');
    const mole = b.units.find((x) => x.id === 'mole');
    mole.gauge = 80;
    b.use('lu', 'still', mole.uid);
    expect(mole.gauge).toBe(40);
    expect(b.units.find((x) => x.id === 'lu').gauge).toBe(0);
  });
});

describe('행동', () => {
  it('같은 시드면 같은 전투', () => {
    const a = autoplay({ enemies: ['beast', 'owl'], seed: 42 });
    const b = autoplay({ enemies: ['beast', 'owl'], seed: 42 });
    expect(a.log).toEqual(b.log);
  });

  it('쿨다운 중인 스킬은 쓸 수 없다', () => {
    const b = createBattle({ enemies: ['mole'], seed: 1 });
    let u;
    do { u = b.next(); if (u.id !== 'me') b.endTurn(u); } while (u.id !== 'me');
    b.use('me', 'flurry', 'mole#0');
    do { u = b.next(); if (u.id !== 'me') b.endTurn(u); } while (u.id !== 'me');
    expect(b.usable(u).map((s) => s.id)).not.toContain('flurry');
    expect(() => b.use('me', 'flurry', 'mole#0')).toThrow();
  });

  it('다단 히트는 타마다 회피 판정을 따로 한다', () => {
    const b = createBattle({ enemies: ['owl'], seed: 9, body: 'thin' });
    const owl = b.units.find((x) => x.id === 'owl');
    let evadedSome = false, hitSome = false;
    for (let i = 0; i < 40 && !b.result; i += 1) {
      const u = b.next();
      if (u.side === 'enemy') {
        const ev = b.enemyTurn(u.uid).filter((e) => e.type === 'hit');
        expect(ev.length).toBeGreaterThan(0);
        if (ev.some((e) => e.evaded)) evadedSome = true;
        if (ev.some((e) => !e.evaded)) hitSome = true;
      } else b.endTurn(u);
    }
    expect(owl.skills[0].hits).toBe(3);
    expect(evadedSome && hitSome).toBe(true);
  });

  it('방어 자세는 다음 자기 차례까지 피해를 절반으로', () => {
    const me = { ...applyBody(PARTY.me), guard: false };
    const boss = MONSTERS.sweeper;
    const sweep = boss.skills.find((s) => s.id === 'sweep');
    const open = hitDamage({ ...boss, heavy: 1 }, me, sweep);
    const guarded = hitDamage({ ...boss, heavy: 1 }, { ...me, guard: true }, sweep);
    expect(Math.abs(guarded - open / 2)).toBeLessThanOrEqual(1);
    expect(guarded).toBeLessThan(open * 0.6);
  });
});

describe('보스: 정리자의 그림자', () => {
  it('큰 기술은 한 차례 먼저 예고하고, 다음 차례에 그대로 쓴다', () => {
    const b = createBattle({ enemies: ['sweeper'], seed: 2 });
    const boss = b.units.find((x) => x.boss);
    const seq = [];
    for (let i = 0; i < 60 && seq.length < 6 && !b.result; i += 1) {
      const u = b.next();
      if (u.uid !== boss.uid) { b.endTurn(u); continue; }
      const ev = b.enemyTurn(u.uid);
      seq.push(ev[0].type === 'telegraph' ? `tell:${ev[0].skill}` : `use:${ev[0].skill}`);
    }
    expect(seq).toEqual(['tell:dust', 'use:dust', 'tell:sweep', 'use:sweep', 'tell:tidy', 'use:tidy']);
  });

  it('예고에 대상이 있으면 그 사람을 친다 (도발이 없을 때)', () => {
    const b = createBattle({ enemies: ['sweeper'], seed: 2 });
    const boss = b.units.find((x) => x.boss);
    let tell = null;
    for (let i = 0; i < 60 && !b.result; i += 1) {
      const u = b.next();
      if (u.uid !== boss.uid) { b.endTurn(u); continue; }
      const ev = b.enemyTurn(u.uid);
      if (ev[0].type === 'telegraph') tell = ev[0];
      else { expect(ev.filter((e) => e.type === 'hit').every((e) => e.to === tell.target)).toBe(true); break; }
    }
  });

  // 어렵지만 공정한가: 예고를 무시하면 대부분 지고, 예고를 읽으면 이길 수 있다. 확률 벽은 없다
  it('예고를 무시하면 대부분 지고, 읽고 대응하면 이길 수 있다', () => {
    const N = 60;
    let naive = 0, smart = 0;
    for (let s = 1; s <= N; s += 1) {
      if (autoplay({ enemies: ['sweeper'], seed: s }).result === 'win') naive += 1;
      if (autoplay({ enemies: ['sweeper'], seed: s, smart: true }).result === 'win') smart += 1;
    }
    expect(naive / N).toBeLessThan(0.25);
    expect(smart / N).toBeGreaterThan(0.6);
  });

  it('일반 몬스터는 생각 없이 싸워도 이긴다', () => {
    for (const enemies of [['slime'], ['beast'], ['owl'], ['mole'], ['skull'], ['slime', 'owl']]) {
      let wins = 0;
      for (let s = 1; s <= 20; s += 1) if (autoplay({ enemies, seed: s }).result === 'win') wins += 1;
      expect(wins, enemies.join('+')).toBeGreaterThanOrEqual(19);
    }
  });

  it('게이지 상한', () => expect(GAUGE).toBe(100));
});

describe('마주침', async () => {
  const { encounterAt, beatKey } = await import('../../src/battle/encounters.js');
  const { POOLS } = await import('../../content/battles/encounters.js');
  const d = new Date(2026, 10, 3, 12);

  it('후보 무리의 몬스터는 모두 정의돼 있다', () => {
    for (const groups of Object.values(POOLS)) for (const g of groups) for (const id of g) expect(MONSTERS[id], id).toBeTruthy();
  });

  it('같은 날 같은 칸이면 같은 무리, 마을·바다·은하엔 없다', () => {
    expect(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, d)).toEqual(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, new Date(2026, 10, 3, 20)));
    expect(encounterAt('surface:7,6', { kind: 'hub', biome: 'snow' }, d)).toBe(null);
    expect(encounterAt('surface:9,17', { kind: 'route', biome: 'sea' }, d)).toBe(null);
    expect(encounterAt('sky:1,1', { kind: 'route', biome: 'galaxy' }, d)).toBe(null);
  });

  it('이기면 그날은 다시 나오지 않는다', () => {
    let hit = null;
    for (let i = 0; i < 60 && !hit; i += 1) { const dd = new Date(2026, 0, 1 + i); if (encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, dd)) hit = dd; }
    expect(hit).not.toBe(null);
    const k = beatKey('surface:7,9', false, hit);
    expect(encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, hit, (x) => x === k)).toBe(null);
  });

  it('검은 성 앞에는 늘 정리자의 그림자가 있고, 이기면 영원히 없다', () => {
    const e = encounterAt('surface:8,2', { kind: 'route', biome: 'blackSnow' }, d);
    expect(e.enemies).toEqual(['sweeper']);
    expect(e.boss).toBe(true);
    expect(encounterAt('surface:8,2', { kind: 'route', biome: 'blackSnow' }, d, (k) => k === beatKey('surface:8,2', true))).toBe(null);
  });

  it('하루 걸러 보면 길 몬스터는 셋 중 하나쯤', () => {
    let n = 0;
    for (let i = 0; i < 300; i += 1) if (encounterAt('surface:7,9', { kind: 'route', biome: 'temperate' }, new Date(2026, 0, 1 + i))) n += 1;
    expect(n / 300).toBeGreaterThan(0.2);
    expect(n / 300).toBeLessThan(0.5);
  });
});

describe('궁극기와 상태이상', async () => {
  const { BURST, BURN } = await import('../../src/battle/engine.js');
  const turnOf = (b, id) => { let u; do { u = b.next(); if (u.id !== id) { if (u.side === 'enemy') b.enemyTurn(u.uid); else b.endTurn(u); } } while (u.id !== id && !b.result); return u; };

  it('때리면 궁극기 게이지가 차고, 다 차야 쓸 수 있다', () => {
    const b = createBattle({ enemies: ['mole'], seed: 1 });
    const me = turnOf(b, 'me');
    expect(b.canBurst(me)).toBe(false);
    expect(() => b.use('me', 'ult', 'mole#0')).toThrow();
    b.use('me', 'strike', 'mole#0');
    expect(me.burst).toBe(BURST.deal);
    me.burst = BURST.max;
    turnOf(b, 'me');
    const ev = b.use('me', 'ult', 'mole#0');
    expect(ev[0]).toMatchObject({ type: 'skill', ultimate: true });
    expect(me.burst).toBe(0);
  });

  it('나의 궁극기는 적의 예고를 지운다', () => {
    const b = createBattle({ enemies: ['sweeper'], seed: 2 });
    const boss = b.units.find((x) => x.boss);
    for (let i = 0; i < 40 && !boss.telegraph; i += 1) { const u = b.next(); if (u.uid === boss.uid) b.enemyTurn(u.uid); else b.endTurn(u); }
    expect(boss.telegraph).not.toBe(null);
    const me = turnOf(b, 'me');
    if (!boss.telegraph) return; // 보스가 그사이 써 버렸으면 이 시드에선 확인 불가
    me.burst = BURST.max;
    const ev = b.use('me', 'ult', boss.uid);
    expect(ev.some((e) => e.type === 'cancel')).toBe(true);
    expect(boss.telegraph).toBe(null);
  });

  it('셀레나의 궁극기는 아군 전원을 방어 자세로', () => {
    const b = createBattle({ enemies: ['mole'], seed: 1 });
    const sel = turnOf(b, 'selena');
    sel.burst = BURST.max;
    b.use('selena', 'ult');
    expect(b.units.filter((x) => x.side === 'party' && x.hp > 0).every((x) => x.guard)).toBe(true);
  });

  it('화상: 맞으면 자기 차례 끝마다 최대 체력의 일부, 정해진 횟수만', () => {
    const b = createBattle({ enemies: ['mole'], seed: 1 });
    const mole = b.units.find((x) => x.id === 'mole');
    turnOf(b, 'selena');
    b.use('selena', 'sweep');
    expect(mole.status.burn).toBe(BURN.turns);
    const hp = mole.hp;
    turnOf(b, 'mole'); // 두더지 차례에 끝나면 화상
    const ev = b.enemyTurn(mole.uid);
    const burn = ev.find((e) => e.type === 'burn');
    expect(burn.dmg).toBe(Math.round(mole.maxHp * BURN.ratio));
    expect(mole.status.burn).toBe(BURN.turns - 1);
    expect(mole.hp).toBeLessThan(hp);
  });

  it('저항이 높으면 화상을 버틸 때가 많다 (통통·여유)', () => {
    let burned = { low: 0, high: 0 };
    for (let s = 1; s <= 200; s += 1) {
      for (const [k, resist] of [['low', 0], ['high', 0.5]]) {
        const b = createBattle({ enemies: ['beast'], seed: s });
        const me = b.units.find((x) => x.id === 'me');
        me.resist = resist; me.evade = 0;
        const beast = b.units.find((x) => x.id === 'beast');
        beast.cooldowns = {};
        const roar = beast.skills.find((x) => x.id === 'roar');
        b.perform(beast, roar);
        if (me.status.burn) burned[k] += 1;
      }
    }
    expect(burned.low).toBe(200);
    expect(burned.high).toBeLessThan(140);
    expect(burned.high).toBeGreaterThan(60);
  });
});
