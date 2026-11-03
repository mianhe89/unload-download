// 전투 엔진 (순수 로직 — Phaser 없이 Node에서 그대로 돈다, 테스트 가능).
// 속도 게이지(0→100)가 먼저 차는 쪽이 행동한다. 운은 회피 판정 하나뿐이고, 그 확률은 체형이 정한다.
// 같은 시드면 같은 전투가 된다 (재현 가능한 버그, 리플레이).
//
//   const b = createBattle({ party: ['me','selena','lu'], enemies: ['slime'], seed: 1, body: 'thin' })
//   b.next()                     → 다음 행동할 유닛 (게이지를 진행시킨다)
//   b.use(unitId, skillId, target) → 이벤트 목록 (아군 차례)
//   b.enemyTurn(unitId)          → 이벤트 목록 (적 차례: 예고 또는 실행)
//   b.result                     → 'win' | 'lose' | null
import { PARTY, MONSTERS } from '../../content/battles/units.js';
import { applyBody } from './body.js';
import { battleStats } from '../life/life.js';
import { applySkills } from '../farm/farm.js';

export const GAUGE = 100;
export const BURST = { max: 100, deal: 9, take: 6 }; // 궁극기 게이지: 맞힌 타마다 +9, 맞은 타마다 +6
export const BURN = { turns: 2, ratio: 0.06 };
const BEATS = { fire: 'wind', wind: 'earth', earth: 'fire' }; // 불 > 바람 > 땅 > 불, 빛 ↔ 어둠

export function elementMul(attack, defend) {
  if (!attack || !defend) return 1;
  if (BEATS[attack] === defend) return 1.3;
  if (BEATS[defend] === attack) return 0.8;
  if ((attack === 'light' && defend === 'dark') || (attack === 'dark' && defend === 'light')) return 1.3;
  return 1;
}

// 한 타 피해: 공격 × 배수 × 방어 감쇠 × 속성 × (방어 자세면 절반)
export function hitDamage(att, def, skill) {
  const defense = def.def * (1 - (att.pierce ?? 0));
  const base = att.atk * skill.power * (100 / (100 + defense * 2));
  const heavy = skill.hits === 1 ? (att.heavy ?? 1) : 1; // 통통한 몸의 묵직한 일격은 한 방 기술에만
  const guard = def.guard ? 0.5 : 1;
  return Math.max(1, Math.round(base * heavy * elementMul(skill.element, def.element) * guard));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function makeUnit(id, side, def, index) {
  return {
    uid: side === 'party' ? id : `${id}#${index}`, id, side, name: def.name, element: def.element,
    maxHp: def.maxHp, hp: def.maxHp, atk: def.atk, def: def.def, spd: def.spd, evade: def.evade,
    heavy: def.heavy ?? 1, pierce: def.pierce ?? 0, resist: def.resist ?? 0, body: def.body ?? null, mind: def.mind ?? null, startGauge: def.startGauge ?? 0,
    boss: Boolean(def.boss), pattern: def.pattern ?? null, step: 0,
    skills: def.skills, ultimate: def.ultimate ?? null, burst: 0, status: {}, cooldowns: {}, gauge: 0, guard: false, taunt: false, telegraph: null,
    sprite: def.sprite ?? null, char: def.char ?? null,
  };
}

// life: 생활 상태(src/life/life.js)가 있으면 주인공 능력치는 거기서 (체형 + 마음가짐 + 피로). 없으면 body로
// skills: 주인공이 얻은 히든 스킬 (행동 파밍)
export function createBattle({ party = ['me', 'selena', 'lu'], enemies, seed = 1, body = 'normal', life = null, skills = [] }) {
  const rng = mulberry32(seed);
  const units = [
    ...party.map((id, i) => makeUnit(id, 'party', id === 'me' ? applySkills(life ? battleStats(PARTY[id], life) : applyBody(PARTY[id], body), skills) : PARTY[id], i)),
    ...enemies.map((id, i) => makeUnit(id, 'enemy', MONSTERS[id], i)),
  ];
  // 시작 게이지: 속도에 비례해 조금씩 앞서 출발
  for (const u of units) u.gauge = Math.min(GAUGE - 1, u.spd * 0.2 + (u.startGauge ?? 0));

  const alive = (side) => units.filter((u) => u.side === side && u.hp > 0);
  const byId = (uid) => units.find((u) => u.uid === uid);
  const skillOf = (u, sid) => u.skills.find((s) => s.id === sid);

  const battle = {
    units, turn: 0, log: [],
    get result() {
      if (!alive('enemy').length) return 'win';
      if (!alive('party').length) return 'lose';
      return null;
    },

    // 다음 행동할 유닛: 게이지가 100에 먼저 닿는 쪽 (같으면 아군 먼저, 그다음 목록 순)
    next() {
      if (this.result) return null;
      const live = units.filter((u) => u.hp > 0);
      let best = null, bestT = Infinity;
      for (const u of live) {
        const t = Math.max(0, (GAUGE - u.gauge) / u.spd);
        if (t < bestT - 1e-9) { best = u; bestT = t; }
      }
      for (const u of live) u.gauge = Math.min(GAUGE, u.gauge + u.spd * bestT);
      best.gauge = GAUGE;
      // 자기 차례가 오면 방어 자세는 풀린다
      best.guard = false; best.taunt = false;
      return best;
    },

    // 앞으로의 차례 순서 미리보기 (UI용, 상태는 바꾸지 않는다)
    preview(n = 6) {
      const sim = units.filter((u) => u.hp > 0).map((u) => ({ uid: u.uid, g: u.gauge, spd: u.spd }));
      const out = [];
      for (let k = 0; k < n && sim.length; k += 1) {
        let best = sim[0], bt = Infinity;
        for (const s of sim) { const t = (GAUGE - s.g) / s.spd; if (t < bt - 1e-9) { best = s; bt = Math.max(0, t); } }
        for (const s of sim) s.g += s.spd * bt;
        out.push(best.uid);
        best.g = 0;
      }
      return out;
    },

    usable(u) { return u.skills.filter((s) => !(u.cooldowns[s.id] > 0)); },
    canBurst(u) { return Boolean(u.ultimate) && u.burst >= BURST.max; },

    // 아군 차례
    use(uid, sid, targetUid) {
      const u = byId(uid);
      if (sid === 'ult') {
        if (!this.canBurst(u)) throw new Error(`궁극기 게이지가 차지 않음: ${uid}`);
        u.burst = 0;
        return this.perform(u, u.ultimate, targetUid);
      }
      const s = skillOf(u, sid);
      if (!u || !s || u.cooldowns[sid] > 0) throw new Error(`쓸 수 없는 스킬: ${uid}.${sid}`);
      return this.perform(u, s, targetUid);
    },

    // 적 차례: 예고(tell) 있는 기술은 한 차례 먼저 알리고 다음 차례에 쓴다
    enemyTurn(uid) {
      const u = byId(uid);
      if (u.telegraph) {
        const { skill, target } = u.telegraph;
        u.telegraph = null;
        const s = skillOf(u, skill);
        const t = s.target === 'one' ? pickTarget(target) : null;
        return this.perform(u, s, t?.uid);
      }
      const s = u.pattern ? skillOf(u, u.pattern[u.step % u.pattern.length]) : chooseSkill(u);
      if (u.pattern) u.step += 1;
      const t = s.target === 'one' ? pickTarget() : null;
      if (s.tell) {
        u.telegraph = { skill: s.id, target: t?.uid ?? null };
        const ev = [{ type: 'telegraph', from: u.uid, skill: s.id, name: s.name, tell: s.tell, target: t?.uid ?? null }];
        ev.push(...this.endTurn(u));
        this.log.push(...ev);
        return ev;
      }
      return this.perform(u, s, t?.uid);
    },

    perform(u, s, targetUid) {
      const ev = [{ type: 'skill', from: u.uid, skill: s.id, name: s.name, ultimate: s.id === 'ult', line: s.line }];
      const foes = alive(u.side === 'party' ? 'enemy' : 'party');
      const friends = alive(u.side);
      let targets;
      if (s.target === 'all') targets = foes;
      else if (s.target === 'self') targets = [u];
      else if (s.target === 'ally') targets = [friends.find((x) => x.uid === targetUid) ?? friends.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b))];
      else targets = [foes.find((x) => x.uid === targetUid) ?? foes[0]];

      for (const t of targets) {
        for (let h = 0; h < s.hits; h += 1) {
          if (t.hp <= 0) break;
          const evaded = t.side !== u.side && rng() < t.evade;
          const dmg = evaded ? 0 : hitDamage(u, t, s);
          t.hp = Math.max(0, t.hp - dmg);
          ev.push({ type: 'hit', from: u.uid, to: t.uid, dmg, evaded, mul: elementMul(s.element, t.element) });
          if (!evaded && t.side !== u.side) {
            // 궁극기 게이지: 아군만 (때린 쪽 +, 맞은 쪽 +)
            if (u.ultimate && s.id !== 'ult') u.burst = Math.min(BURST.max, u.burst + BURST.deal);
            if (t.ultimate) t.burst = Math.min(BURST.max, t.burst + BURST.take);
            // 화상: 저항만큼 버틸 확률
            if (s.status === 'burn' && t.hp > 0) {
              if (rng() < (t.resist ?? 0)) ev.push({ type: 'resist', to: t.uid, status: 'burn' });
              else { t.status.burn = BURN.turns; ev.push({ type: 'status', to: t.uid, status: 'burn' }); }
            }
          }
          if (t.hp === 0) ev.push({ type: 'ko', uid: t.uid });
        }
        const e = s.effect ?? {};
        if (t.hp > 0) {
          if (e.heal) { const n = Math.round(u.atk * e.heal); t.hp = Math.min(t.maxHp, t.hp + n); ev.push({ type: 'heal', to: t.uid, amount: n }); }
          if (e.guard) { t.guard = true; ev.push({ type: 'guard', to: t.uid }); }
          if (e.taunt) { t.taunt = true; ev.push({ type: 'taunt', to: t.uid }); }
          if (e.cancelTell && t.telegraph) { t.telegraph = null; ev.push({ type: 'cancel', to: t.uid }); }
          if (e.push) { t.gauge = Math.min(GAUGE - 1, t.gauge + e.push); ev.push({ type: 'gauge', to: t.uid, delta: e.push }); }
          if (e.slow) {
            const d = Math.round(e.slow * (1 - (t.resist ?? 0)));
            t.gauge = Math.max(0, t.gauge - d); ev.push({ type: 'gauge', to: t.uid, delta: -d });
          }
        }
      }
      if (s.effect?.guardAll) for (const f of alive(u.side)) { f.guard = true; ev.push({ type: 'guard', to: f.uid }); }
      if (s.cooldown) u.cooldowns[s.id] = s.cooldown + 1; // 이번 차례 끝에 1 줄어든다
      ev.push(...this.endTurn(u));
      this.log.push(...ev);
      return ev;
    },

    // 차례 끝: 게이지·쿨다운, 화상 피해. 생긴 이벤트를 돌려준다
    endTurn(u) {
      const ev = [];
      u.gauge = 0;
      for (const k of Object.keys(u.cooldowns)) u.cooldowns[k] = Math.max(0, u.cooldowns[k] - 1);
      if (u.status.burn > 0 && u.hp > 0) {
        const dmg = Math.max(1, Math.round(u.maxHp * BURN.ratio));
        u.hp = Math.max(0, u.hp - dmg);
        u.status.burn -= 1;
        ev.push({ type: 'burn', to: u.uid, dmg });
        if (u.hp === 0) ev.push({ type: 'ko', uid: u.uid });
      }
      this.turn += 1;
      return ev;
    },
  };

  // 적의 대상: 도발한 아군 → (예고 때 고른 대상) → 체력 비율이 가장 낮은 아군
  function pickTarget(prefer) {
    const party = alive('party');
    const taunt = party.find((p) => p.taunt);
    if (taunt) return taunt;
    const pref = party.find((p) => p.uid === prefer);
    if (pref) return pref;
    return party.reduce((a, b) => (a.hp / a.maxHp <= b.hp / b.maxHp ? a : b));
  }
  // 일반 적: 쿨이 끝난 가장 센 기술
  function chooseSkill(u) {
    const ok = u.skills.filter((s) => !(u.cooldowns[s.id] > 0));
    return ok.reduce((a, b) => (b.power * b.hits * (b.target === 'all' ? 2 : 1) > a.power * a.hits * (a.target === 'all' ? 2 : 1) ? b : a));
  }

  return battle;
}
