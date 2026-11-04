// 탑뷰 액션 전투 엔진 (순수 — 화면 없이 돌고, 같은 씨앗이면 같은 결과).
// 장면(ActionScene)은 매 프레임 입력을 넣고 step()이 돌려준 사건을 그린다.
//   input: { move:{x,y}(-1~1), aim:{x,y}(월드 좌표), atk, q, w, e, r (이번 프레임에 눌림), quick: 0~7 | null }
import { BASE_SKILLS, STATUS, CONSUMABLES, QUICK_CD, EQUIPMENT, SETS, ACTION_BOSSES, ARENA } from '../../content/action/action.js';

export const PLAYER = { radius: 6, speed: 78, maxHp: 120 };
const SKILL_KEYS = ['atk', 'q', 'w', 'e', 'r'];

const rngOf = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const len = (x, y) => Math.hypot(x, y) || 1;
const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return Math.abs(d); };

// 장비 → 실제로 쓸 스킬 (유니크·세트 효과로 모양까지 바뀐다)
export function skillsFor(equip = {}) {
  const sk = structuredClone(BASE_SKILLS);
  // 무기 2(예비)는 들고 있지 않으니 효과가 없다
  const ids = Object.entries(equip).filter(([k, v]) => v && k !== 'weapon2').map(([, v]) => v);
  const mods = ids.flatMap((id) => EQUIPMENT[id]?.mods ?? []);
  for (const set of Object.values(SETS)) {
    const n = set.pieces.filter((p) => ids.includes(p)).length;
    for (const [need, b] of Object.entries(set.bonus)) if (n >= Number(need)) mods.push(...b.mods);
  }
  for (const m of mods) {
    const s = sk[m.skill];
    const { skill, dmgMul, cdAdd, ...rest } = m;
    Object.assign(s, rest);
    if (dmgMul) s.dmg = Math.round(s.dmg * dmgMul);
    if (cdAdd) s.cd = Math.max(0.2, s.cd + cdAdd);
    if (rest.name) s.changed = true;
  }
  const atkBonus = ids.reduce((a, id) => a + (EQUIPMENT[id]?.atk ?? 0), 0);
  for (const k of SKILL_KEYS) if (sk[k].dmg) sk[k].dmg += atkBonus;
  const def = ids.reduce((a, id) => a + (EQUIPMENT[id]?.def ?? 0), 0);
  return { skills: sk, def };
}

export function createAction({ boss = 'sweeper', bossHp = 1, hp = PLAYER.maxHp, maxHp = PLAYER.maxHp, equip, bag = {}, quick = [], seed = 1 } = {}) {
  const rng = rngOf(seed);
  const B = ACTION_BOSSES[boss];
  const { skills, def } = skillsFor(equip);
  const bossMax = 400;
  const s = {
    t: 0, over: null, rng, def, skills,
    p: { x: ARENA.w / 2, y: ARENA.h - 40, hp, maxHp, face: -Math.PI / 2, cd: {}, status: {}, guard: 0, guardT: 0, dash: null, invuln: 0, regen: null, quickCd: 0, lastHit: -9, moving: false },
    b: { id: boss, def: B, x: ARENA.w / 2, y: 60, hp: Math.round(bossMax * bossHp), maxHp: bossMax, status: {}, i: 0, state: 'rest', timer: 1.2, cur: null, aim: 0, charge: null },
    shots: [],      // { x, y, vx, vy, r, dmg, from:'boss'|'player', life, status }
    tells: [],      // 화면에 그릴 예고 (그대로 노출)
    bag: { ...bag }, quick: [...quick],
  };
  return {
    state: s,
    step: (dt, input) => step(s, dt, input ?? {}),
    get over() { return s.over; },
  };
}

// ── 피해·상태 ─────────────────────────────────────────────
function addStatus(s, who, st, ev) {
  if (!st || s.rng() > (st.chance ?? 1)) return;
  const d = STATUS[st.id];
  const cur = who.status[st.id];
  if (cur && d.stacks) cur.stack = Math.min(d.stacks, cur.stack + 1);
  who.status[st.id] = { left: d.dur, stack: cur?.stack ?? 1 };
  ev.push({ type: 'status', to: who === s.p ? 'p' : 'b', id: st.id });
}

function hurtPlayer(s, dmg, ev, opts = {}) {
  const p = s.p;
  if (p.invuln > 0 || s.over) return false;
  // 막기: 앞쪽에서 온 공격만. 막 시작했을 때(패링)는 완전히 막고 상대를 기절시킨다
  if (p.guard > 0 && opts.dir !== undefined && angDiff(opts.dir, p.face) < (s.skills.e.arc * Math.PI / 360)) {
    if (opts.shot && !s.skills.e.blocksShots) { /* 탄환은 못 막는다 */ } else {
      const parry = s.skills.e.dur - p.guard < s.skills.e.parry;
      ev.push({ type: parry ? 'parry' : 'block', x: p.x, y: p.y });
      if (parry && !opts.shot) addStatus(s, s.b, { id: 'stun' }, ev);
      if (parry || opts.shot) return 'blocked';
      dmg *= 1 - s.skills.e.reduce;
    }
  }
  let m = (1 - s.def);
  if (p.status.vuln) m *= STATUS.vuln.vuln;
  if (p.status.freeze) { m *= STATUS.freeze.shatter; delete p.status.freeze; }
  const d = Math.max(1, Math.round(dmg * m));
  p.hp = Math.max(0, p.hp - d);
  p.lastHit = s.t;
  if (p.regen && !opts.dot) { p.regen = null; ev.push({ type: 'regenCut' }); }
  ev.push({ type: 'hurt', to: 'p', dmg: d, x: p.x, y: p.y, dot: Boolean(opts.dot) });
  if (opts.status && !opts.dot) addStatus(s, p, opts.status, ev);
  if (p.hp <= 0) { s.over = 'lose'; ev.push({ type: 'lose' }); }
  return true;
}

function hurtBoss(s, dmg, ev, opts = {}) {
  const b = s.b;
  if (s.over) return;
  let m = 1;
  if (s.p.status.weak && !opts.dot) m *= STATUS.weak.weak;
  if (b.status.vuln) m *= STATUS.vuln.vuln;
  if (b.status.freeze) { m *= STATUS.freeze.shatter; delete b.status.freeze; }
  const d = Math.max(1, Math.round(dmg * m));
  b.hp = Math.max(0, b.hp - d);
  ev.push({ type: 'hurt', to: 'b', dmg: d, x: b.x, y: b.y, dot: Boolean(opts.dot), skill: opts.skill });
  if (opts.status) addStatus(s, b, opts.status, ev);
  if (b.hp <= 0) { s.over = 'win'; ev.push({ type: 'win' }); }
}

function tickStatus(s, who, dt, ev, isP) {
  for (const [id, st] of Object.entries(who.status)) {
    const d = STATUS[id];
    st.left -= dt;
    if (d.dps) {
      let per = d.dps * who.maxHp * (st.stack ?? 1) * dt;
      if (d.moving && isP && who.moving) per *= d.moving;
      st.acc = (st.acc ?? 0) + per;
      if (st.acc >= 1) { const n = Math.floor(st.acc); st.acc -= n; if (isP) hurtPlayer(s, n, ev, { dot: true }); else hurtBoss(s, n, ev, { dot: true }); }
    }
    if (st.left <= 0) { delete who.status[id]; ev.push({ type: 'statusEnd', to: isP ? 'p' : 'b', id }); }
  }
}

const canAct = (who) => !who.status.stun && !who.status.freeze;

// ── 플레이어 스킬 ─────────────────────────────────────────
function inShape(sk, ox, oy, face, tx, ty, tr) {
  const dx = tx - ox, dy = ty - oy, d = Math.hypot(dx, dy);
  if (sk.shape === 'arc') return d - tr <= sk.range && angDiff(Math.atan2(dy, dx), face) <= (sk.arc * Math.PI) / 360 + Math.atan2(tr, Math.max(d, 1));
  if (sk.shape === 'line') {
    const ax = Math.cos(face), ay = Math.sin(face);
    const along = dx * ax + dy * ay, side = Math.abs(-dx * ay + dy * ax);
    return along >= -tr && along <= sk.range + tr && side <= sk.width / 2 + tr;
  }
  return false;
}

function useSkill(s, key, ev) {
  const p = s.p, sk = s.skills[key];
  if ((p.cd[key] ?? 0) > 0 || !canAct(p) || p.dash) return;
  p.cd[key] = sk.cd;
  ev.push({ type: 'skill', key, name: sk.name, shape: sk.shape, x: p.x, y: p.y, face: p.face, range: sk.range, arc: sk.arc, width: sk.width });
  if (sk.shape === 'guard') { p.guard = sk.dur; return; }
  if (sk.shape === 'dash') {
    p.dash = { left: sk.dur, vx: Math.cos(p.face) * sk.dist / sk.dur, vy: Math.sin(p.face) * sk.dist / sk.dur, hit: false };
    if (sk.invuln) p.invuln = sk.dur + 0.05;
    return;
  }
  const b = s.b;
  if (inShape(sk, p.x, p.y, p.face, b.x, b.y, b.def.radius)) hurtBoss(s, sk.dmg, ev, { status: sk.status, skill: key });
}

function useQuick(s, slot, ev) {
  const p = s.p, id = s.quick[slot];
  if (!id || !(s.bag[id] > 0) || p.quickCd > 0) return;
  const c = CONSUMABLES[id];
  if (c.regen && (p.status.poison && STATUS.poison.noRegen) && !(c.cures ?? []).includes('poison')) { ev.push({ type: 'quickFail', id, why: '중독 중에는 회복이 안 된다' }); return; }
  s.bag[id] -= 1;
  p.quickCd = QUICK_CD;
  for (const st of c.cures ?? []) if (p.status[st]) { delete p.status[st]; ev.push({ type: 'statusEnd', to: 'p', id: st }); }
  if (c.heal) { const before = p.hp; p.hp = Math.min(p.maxHp, p.hp + c.heal); ev.push({ type: 'heal', amount: p.hp - before, x: p.x, y: p.y }); }
  if (c.regen) p.regen = { left: c.regen.over, rate: c.regen.heal / c.regen.over, acc: 0 };
  ev.push({ type: 'quick', id, left: s.bag[id] });
}

// ── 보스 ──────────────────────────────────────────────────
function bossThink(s, dt, ev) {
  const b = s.b, p = s.p, B = b.def;
  if (!canAct(b)) { b.charge = null; return; }
  const enraged = b.hp / b.maxHp < B.enrageAt;
  const toP = Math.atan2(p.y - b.y, p.x - b.x);
  // 돌진 중
  if (b.charge) {
    const c = b.charge;
    const step = Math.min(c.left, (c.speed) * dt);
    b.x = clamp(b.x + Math.cos(c.dir) * step, B.radius, ARENA.w - B.radius);
    b.y = clamp(b.y + Math.sin(c.dir) * step, B.radius, ARENA.h - B.radius);
    c.left -= step;
    if (!c.hit && Math.hypot(p.x - b.x, p.y - b.y) < B.radius + PLAYER.radius + c.width / 4) {
      c.hit = true;
      hurtPlayer(s, c.dmg, ev, { dir: c.dir + Math.PI, status: c.status });
    }
    if (c.left <= 0) b.charge = null;
    return;
  }
  b.timer -= dt;
  if (b.state === 'rest') {
    // 쉬는 동안 천천히 다가온다
    const d = Math.hypot(p.x - b.x, p.y - b.y);
    if (d > 40) { b.x += Math.cos(toP) * B.speed * dt; b.y += Math.sin(toP) * B.speed * dt; }
    if (b.timer <= 0) {
      const a = B.attacks[b.i % B.attacks.length];
      b.i += 1;
      b.cur = a; b.state = 'tell'; b.timer = a.tell * (enraged ? 0.7 : 1); b.aim = toP;
      const tell = { id: a.id, name: a.name, x: b.x, y: b.y, dir: toP, range: a.range ?? a.dist, arc: a.arc, width: a.width, total: b.timer };
      s.tells = [tell];
      ev.push({ type: 'tell', ...tell });
    }
    return;
  }
  if (b.state === 'tell') {
    if (s.tells[0]) s.tells[0].left = b.timer;
    if (b.timer > 0) return;
    const a = b.cur;
    s.tells = [];
    ev.push({ type: 'bossAttack', id: a.id, name: a.name, x: b.x, y: b.y, dir: b.aim });
    if (a.id === 'sweep') {
      if (inShape({ shape: 'arc', range: a.range, arc: a.arc }, b.x, b.y, b.aim, p.x, p.y, PLAYER.radius)) hurtPlayer(s, a.dmg, ev, { dir: b.aim + Math.PI });
    } else if (a.id === 'ring') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = (k / a.count) * Math.PI * 2 + b.aim;
        s.shots.push({ x: b.x, y: b.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 4, dmg: a.dmg, from: 'boss', life: 5, status: a.status });
      }
    } else if (a.id === 'charge') {
      b.charge = { dir: b.aim, left: a.dist, speed: a.dist / 0.35, width: a.width, dmg: a.dmg, status: a.status, hit: false };
    } else if (a.id === 'motes') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = b.aim + (k - (a.count - 1) / 2) * 0.6;
        s.shots.push({ x: b.x, y: b.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 5, dmg: a.dmg, from: 'boss', life: a.life, home: 1.6, speed: a.speed, status: a.status });
      }
    }
    b.state = 'rest';
    b.timer = B.rest * (enraged ? 0.7 : 1);
  }
}

// ── 한 프레임 ─────────────────────────────────────────────
export function step(s, dt, input) {
  const ev = [];
  if (s.over) return ev;
  s.t += dt;
  const p = s.p, b = s.b;
  for (const k of SKILL_KEYS) if (p.cd[k] > 0) p.cd[k] = Math.max(0, p.cd[k] - dt);
  p.quickCd = Math.max(0, p.quickCd - dt);
  p.invuln = Math.max(0, p.invuln - dt);
  if (p.guard > 0) p.guard = Math.max(0, p.guard - dt);

  // 조준: 마우스 쪽을 본다
  if (input.aim && !p.dash) p.face = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);

  // 이동 / 돌진
  if (p.dash) {
    const d = p.dash;
    p.x = clamp(p.x + d.vx * dt, PLAYER.radius, ARENA.w - PLAYER.radius);
    p.y = clamp(p.y + d.vy * dt, PLAYER.radius, ARENA.h - PLAYER.radius);
    if (!d.hit && Math.hypot(p.x - b.x, p.y - b.y) < b.def.radius + PLAYER.radius + 4) { d.hit = true; hurtBoss(s, s.skills.r.dmg, ev, { skill: 'r' }); }
    d.left -= dt;
    if (d.left <= 0) p.dash = null;
    p.moving = true;
  } else if (canAct(p) || p.status.stun) {
    const mx = input.move?.x ?? 0, my = input.move?.y ?? 0;
    const m = Math.min(1, Math.hypot(mx, my));
    p.moving = m > 0.05 && !p.status.stun && !p.status.freeze;
    if (p.moving) {
      let sp = PLAYER.speed * (p.status.slow ? STATUS.slow.slow : 1) * (p.guard > 0 ? 0.45 : 1);
      const l = len(mx, my);
      p.x = clamp(p.x + (mx / l) * m * sp * dt, PLAYER.radius, ARENA.w - PLAYER.radius);
      p.y = clamp(p.y + (my / l) * m * sp * dt, PLAYER.radius, ARENA.h - PLAYER.radius);
    }
  }
  // 보스 몸에 부딪히면 밀려난다 (+ 약한 피해)
  const bd = Math.hypot(p.x - b.x, p.y - b.y), minD = b.def.radius + PLAYER.radius;
  if (bd < minD) {
    const nx = (p.x - b.x) / (bd || 1), ny = (p.y - b.y) / (bd || 1);
    p.x = clamp(b.x + nx * minD, PLAYER.radius, ARENA.w - PLAYER.radius);
    p.y = clamp(b.y + ny * minD, PLAYER.radius, ARENA.h - PLAYER.radius);
    if (!p.dash && s.t - (p.bump ?? -9) > 0.8) { p.bump = s.t; hurtPlayer(s, b.def.contact, ev, { dir: Math.atan2(-ny, -nx) }); }
  }

  // 행동
  if (canAct(p)) {
    for (const k of SKILL_KEYS) if (input[k]) useSkill(s, k, ev);
    if (input.quick !== undefined && input.quick !== null) useQuick(s, input.quick, ev);
  }

  // 회복 (붕대·약초)
  if (p.regen) {
    if (p.status.poison) { p.regen = null; ev.push({ type: 'regenCut' }); } else {
      const r = p.regen;
      const amt = r.rate * Math.min(dt, r.left);
      r.left -= dt; r.acc += amt;
      if (r.acc >= 1) { const n = Math.floor(r.acc); r.acc -= n; p.hp = Math.min(p.maxHp, p.hp + n); ev.push({ type: 'regen', amount: n }); }
      if (r.left <= 0) p.regen = null;
    }
  }

  bossThink(s, dt, ev);

  // 탄환
  for (const sh of s.shots) {
    if (sh.home) { // 쫓아오는 먼지: 조금씩 방향을 튼다
      const want = Math.atan2(p.y - sh.y, p.x - sh.x), cur = Math.atan2(sh.vy, sh.vx);
      let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const turn = clamp(d, -sh.home * dt, sh.home * dt);
      sh.vx = Math.cos(cur + turn) * sh.speed; sh.vy = Math.sin(cur + turn) * sh.speed;
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
    if (sh.x < -10 || sh.y < -10 || sh.x > ARENA.w + 10 || sh.y > ARENA.h + 10) sh.life = 0;
    if (sh.life <= 0) continue;
    if (sh.from === 'boss' && Math.hypot(p.x - sh.x, p.y - sh.y) < PLAYER.radius + sh.r) {
      const r = hurtPlayer(s, sh.dmg, ev, { dir: Math.atan2(-sh.vy, -sh.vx), shot: true, status: sh.status });
      if (r === 'blocked' && s.skills.e.reflect) { sh.vx *= -1.4; sh.vy *= -1.4; sh.from = 'player'; sh.home = 0; sh.life = 2; ev.push({ type: 'reflect', x: sh.x, y: sh.y }); continue; }
      if (r) sh.life = 0;
    } else if (sh.from === 'player' && Math.hypot(b.x - sh.x, b.y - sh.y) < b.def.radius + sh.r) {
      hurtBoss(s, sh.dmg * 2, ev, { skill: 'reflect' }); sh.life = 0;
    }
  }
  s.shots = s.shots.filter((x) => x.life > 0);

  tickStatus(s, p, dt, ev, true);
  tickStatus(s, b, dt, ev, false);
  return ev;
}
