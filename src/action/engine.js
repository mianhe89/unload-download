// 탑뷰 액션 전투 엔진 (순수 — 화면 없이 돌고, 같은 씨앗이면 같은 결과).
// 모든 전투가 이 엔진이다: 길 위의 무리, 마을 습격, 시험·결투, 보스. 동료는 없다 — 주인공 혼자 싸운다.
// 장면(ActionScene)은 매 프레임 입력을 넣고 step()이 돌려준 사건을 그린다.
//   input: { move:{x,y}(-1~1), aim:{x,y}(월드 좌표), atk, q, w, e, r (이번 프레임에 눌림), quick: 0~7 | null }
//   적은 content/action/foes.js. 한 번에 maxAlive마리까지 나오고, 쓰러지면 남은 무리가 가장자리에서 들어온다.
import { BASE_SKILLS, STATUS, CONSUMABLES, QUICK_CD, EQUIPMENT, SETS, ARENA } from '../../content/action/action.js';
import { FOES } from '../../content/action/foes.js';

export const PLAYER = { radius: 6, speed: 78, maxHp: 120 };
const SKILL_KEYS = ['atk', 'q', 'w', 'e', 'r'];
export const MAX_ALIVE = 6;

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

// 주인공의 몸(생활 상태)이 전투에 주는 것: src/life/life.js의 battleStats를 액션에 옮긴다
//   체력 배수, 피해 배수, 이동 배수, 돌진 재사용 배수(마른 몸일수록 짧다), 상태이상 저항
export function bodyMods(st) {
  if (!st) return { hpMul: 1, atkMul: 1, speedMul: 1, dashMul: 1, resist: 0 };
  return {
    hpMul: st.maxHp / 120, atkMul: (st.atk / 22) * (st.heavy ?? 1) ** 0.5, speedMul: st.spd / 100,
    dashMul: clamp(1 - (st.evade - 0.05) * 1.5, 0.6, 1.2), resist: st.resist ?? 0,
  };
}

// 적 하나 (번호는 전투마다 1부터: 같은 씨앗이면 같은 전투)
function makeFoe(s, id, x, y) {
  const d = FOES[id];
  if (!d) throw new Error(`없는 적: ${id}`);
  const n = (s.seq += 1);
  return { uid: `${id}#${n}`, id, def: d, x, y, hp: d.hp, maxHp: d.hp, status: {}, i: 0, state: 'rest', timer: 0.8 + (n % 5) * 0.25, cur: null, aim: 0, charge: null, bump: -9, strafe: n % 2 ? 1 : -1 };
}

// enemies: 적 id 목록(순서대로 나온다). hp/maxHp: 주인공 체력. mods: bodyMods(...)
export function createAction({ enemies = ['sweeper'], hp, maxHp, equip, bag = {}, quick = [], seed = 1, mods, maxAlive = MAX_ALIVE } = {}) {
  const rng = rngOf(seed);
  const m = mods ?? bodyMods(null);
  const { skills, def } = skillsFor(equip);
  for (const k of SKILL_KEYS) if (skills[k].dmg) skills[k].dmg = Math.max(1, Math.round(skills[k].dmg * m.atkMul));
  skills.r.cd = Math.max(1, +(skills.r.cd * m.dashMul).toFixed(2));
  const top = Math.round(PLAYER.maxHp * m.hpMul);
  const s = {
    t: 0, over: null, rng, def, skills, mods: m, maxAlive,
    p: { x: ARENA.w / 2, y: ARENA.h - 40, hp: Math.min(hp ?? top, maxHp ?? top), maxHp: maxHp ?? top, face: -Math.PI / 2, cd: {}, status: {}, guard: 0, guardT: 0, dash: null, invuln: 0, regen: null, quickCd: 0, lastHit: -9, moving: false },
    foes: [], queue: [...enemies], total: enemies.length, killed: 0, spawnT: 0, seq: 0,
    shots: [],      // { x, y, vx, vy, r, dmg, from: foe uid | 'player', life, status }
    tells: [],      // 화면에 그릴 예고
    bag: { ...bag }, quick: [...quick],
  };
  // 처음 나오는 무리: 위쪽 절반에 흩어 선다 (보스는 가운데 위)
  const first = s.queue.splice(0, maxAlive);
  first.forEach((id, i) => {
    const boss = FOES[id]?.boss;
    const x = boss ? ARENA.w / 2 : 40 + ((i + 0.5) / first.length) * (ARENA.w - 80) + (rng() - 0.5) * 20;
    const y = boss ? 60 : 36 + rng() * (ARENA.h * 0.38);
    s.foes.push(makeFoe(s, id, x, y));
  });
  return {
    state: s,
    step: (dt, input) => step(s, dt, input ?? {}),
    get over() { return s.over; },
  };
}

const alive = (s) => s.foes.filter((f) => f.hp > 0);
const byUid = (s, uid) => s.foes.find((f) => f.uid === uid);

// ── 피해·상태 ─────────────────────────────────────────────
function addStatus(s, who, st, ev, isP) {
  if (!st || s.rng() > (st.chance ?? 1)) return;
  if (isP && s.rng() < s.mods.resist) { ev.push({ type: 'resist', x: who.x, y: who.y }); return; }
  const d = STATUS[st.id];
  const cur = who.status[st.id];
  if (cur && d.stacks) cur.stack = Math.min(d.stacks, cur.stack + 1);
  who.status[st.id] = { left: d.dur, stack: cur?.stack ?? 1 };
  ev.push({ type: 'status', to: isP ? 'p' : who.uid, id: st.id });
}

function hurtPlayer(s, dmg, ev, opts = {}) {
  const p = s.p;
  if (p.invuln > 0 || s.over) return false;
  // 막기: 앞쪽에서 온 공격만. 막 시작했을 때(완벽한 막기)는 완전히 막고 상대를 기절시킨다
  if (p.guard > 0 && opts.dir !== undefined && angDiff(opts.dir, p.face) < (s.skills.e.arc * Math.PI / 360)) {
    if (opts.shot && !s.skills.e.blocksShots) { /* 탄환은 못 막는다 */ } else {
      const parry = s.skills.e.dur - p.guard < s.skills.e.parry;
      ev.push({ type: parry ? 'parry' : 'block', x: p.x, y: p.y });
      const src = opts.src && byUid(s, opts.src);
      if (parry && !opts.shot && src) addStatus(s, src, { id: 'stun' }, ev, false);
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
  if (opts.status && !opts.dot) addStatus(s, p, opts.status, ev, true);
  if (p.hp <= 0) { s.over = 'lose'; ev.push({ type: 'lose' }); }
  return true;
}

function hurtFoe(s, f, dmg, ev, opts = {}) {
  if (s.over || f.hp <= 0) return;
  let m = 1;
  if (s.p.status.weak && !opts.dot) m *= STATUS.weak.weak;
  if (f.status.vuln) m *= STATUS.vuln.vuln;
  if (f.status.freeze) { m *= STATUS.freeze.shatter; delete f.status.freeze; }
  const d = Math.max(1, Math.round(dmg * m));
  f.hp = Math.max(0, f.hp - d);
  ev.push({ type: 'hurt', to: f.uid, dmg: d, x: f.x, y: f.y, dot: Boolean(opts.dot), skill: opts.skill });
  if (opts.status) addStatus(s, f, opts.status, ev, false);
  // 맞으면 살짝 밀려난다 (보스는 버틴다)
  if (!opts.dot && !f.def.boss && !f.charge) {
    const a = Math.atan2(f.y - s.p.y, f.x - s.p.x);
    f.x = clamp(f.x + Math.cos(a) * 4, f.def.radius, ARENA.w - f.def.radius);
    f.y = clamp(f.y + Math.sin(a) * 4, f.def.radius, ARENA.h - f.def.radius);
  }
  if (f.hp <= 0) {
    s.killed += 1;
    f.charge = null;
    s.tells = s.tells.filter((t) => t.uid !== f.uid);
    ev.push({ type: 'kill', uid: f.uid, id: f.id, x: f.x, y: f.y });
    // 갈라지는 적: 그 자리에서 작은 것들이 나온다
    for (const [k, id] of (f.def.split ?? []).entries()) {
      const c = makeFoe(s, id, clamp(f.x + (k ? 10 : -10), 8, ARENA.w - 8), f.y);
      c.timer = 0.9;
      s.foes.push(c);
      s.total += 1;
      ev.push({ type: 'spawn', uid: c.uid, id, x: c.x, y: c.y });
    }
    if (!alive(s).length && !s.queue.length) { s.over = 'win'; ev.push({ type: 'win' }); }
  }
}

function tickStatus(s, who, dt, ev, isP) {
  for (const [id, st] of Object.entries(who.status)) {
    const d = STATUS[id];
    st.left -= dt;
    if (d.dps) {
      let per = d.dps * who.maxHp * (st.stack ?? 1) * dt;
      if (d.moving && isP && who.moving) per *= d.moving;
      st.acc = (st.acc ?? 0) + per;
      if (st.acc >= 1) { const n = Math.floor(st.acc); st.acc -= n; if (isP) hurtPlayer(s, n, ev, { dot: true }); else hurtFoe(s, who, n, ev, { dot: true }); }
    }
    if (st.left <= 0) { delete who.status[id]; ev.push({ type: 'statusEnd', to: isP ? 'p' : who.uid, id }); }
  }
}

const canAct = (who) => !who.status.stun && !who.status.freeze;

// ── 모양 판정 ─────────────────────────────────────────────
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

// ── 주인공 ───────────────────────────────────────────────
function useSkill(s, key, ev) {
  const p = s.p, sk = s.skills[key];
  if ((p.cd[key] ?? 0) > 0 || !canAct(p) || p.dash) return;
  p.cd[key] = sk.cd;
  ev.push({ type: 'skill', key, name: sk.name, shape: sk.shape, x: p.x, y: p.y, face: p.face, range: sk.range, arc: sk.arc, width: sk.width });
  if (sk.shape === 'guard') { p.guard = sk.dur; return; }
  if (sk.shape === 'dash') {
    p.dash = { left: sk.dur, vx: Math.cos(p.face) * sk.dist / sk.dur, vy: Math.sin(p.face) * sk.dist / sk.dur, hit: new Set() };
    if (sk.invuln) p.invuln = sk.dur + 0.05;
    return;
  }
  // 범위 안의 적은 모두 맞는다
  for (const f of alive(s)) if (inShape(sk, p.x, p.y, p.face, f.x, f.y, f.def.radius)) hurtFoe(s, f, sk.dmg, ev, { status: sk.status, skill: key });
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

// ── 적 ───────────────────────────────────────────────────
function moveFoe(f, ang, sp, dt) {
  const r = f.def.radius;
  f.x = clamp(f.x + Math.cos(ang) * sp * dt, r, ARENA.w - r);
  f.y = clamp(f.y + Math.sin(ang) * sp * dt, r, ARENA.h - r);
}

// 다음에 쓸 공격: 보스는 정해진 순서대로, 나머지는 닿는 것 중 순서가 먼저인 것
function nextAttack(f, d) {
  const A = f.def.attacks;
  if (f.def.boss) return A[f.i % A.length];
  for (let k = 0; k < A.length; k += 1) {
    const a = A[(f.i + k) % A.length];
    if (!a.reach || d <= a.reach) { f.i += k; return a; }
  }
  return null;
}

function foeThink(s, f, dt, ev) {
  const p = s.p, D = f.def;
  if (!canAct(f)) { f.charge = null; return; }
  const enraged = D.enrageAt && f.hp / f.maxHp < D.enrageAt;
  const toP = Math.atan2(p.y - f.y, p.x - f.x);
  const d = Math.hypot(p.x - f.x, p.y - f.y);
  // 돌진 중
  if (f.charge) {
    const c = f.charge;
    const st = Math.min(c.left, c.speed * dt);
    moveFoe(f, c.dir, st / dt, dt);
    c.left -= st;
    if (!c.hit && Math.hypot(p.x - f.x, p.y - f.y) < D.radius + PLAYER.radius + c.width / 4) {
      c.hit = true;
      hurtPlayer(s, c.dmg, ev, { dir: c.dir + Math.PI, status: c.status, src: f.uid });
    }
    if (c.left <= 0) f.charge = null;
    return;
  }
  f.timer -= dt;
  if (f.state === 'rest') {
    const slow = f.status.slow ? STATUS.slow.slow : 1;
    // 원거리는 거리를 지키며 옆으로 돈다, 근거리는 다가온다
    if (D.keep) {
      if (d > D.keep + 12) moveFoe(f, toP, D.speed * slow, dt);
      else if (d < D.keep - 12) moveFoe(f, toP + Math.PI, D.speed * slow, dt);
      else moveFoe(f, toP + (Math.PI / 2) * f.strafe, D.speed * 0.6 * slow, dt);
    } else if (d > (D.boss ? 40 : D.radius + PLAYER.radius + 6)) moveFoe(f, toP, D.speed * slow, dt);
    if (f.timer <= 0) {
      const a = nextAttack(f, d);
      if (!a) { f.timer = 0.2; return; }
      f.i += 1;
      f.cur = a; f.state = 'tell'; f.timer = a.tell * (enraged ? 0.7 : 1); f.aim = toP;
      const tell = { uid: f.uid, id: a.id, kind: a.kind, name: a.name, x: f.x, y: f.y, dir: toP, range: a.range ?? a.dist, arc: a.arc, width: a.width, total: f.timer, left: f.timer };
      s.tells = s.tells.filter((t) => t.uid !== f.uid).concat(tell);
      ev.push({ type: 'tell', boss: Boolean(D.boss), ...tell });
    }
    return;
  }
  if (f.state === 'tell') {
    const t = s.tells.find((x) => x.uid === f.uid);
    if (t) { t.left = f.timer; t.x = f.x; t.y = f.y; }
    if (f.timer > 0) return;
    const a = f.cur;
    s.tells = s.tells.filter((x) => x.uid !== f.uid);
    ev.push({ type: 'foeAttack', uid: f.uid, id: a.id, kind: a.kind, name: a.name, x: f.x, y: f.y, dir: f.aim, boss: Boolean(D.boss) });
    if (a.kind === 'sweep') {
      if (inShape({ shape: 'arc', range: a.range, arc: a.arc }, f.x, f.y, f.aim, p.x, p.y, PLAYER.radius)) hurtPlayer(s, a.dmg, ev, { dir: f.aim + Math.PI, status: a.status, src: f.uid });
    } else if (a.kind === 'lunge') {
      f.charge = { dir: f.aim, left: a.dist, speed: a.dist / 0.3, width: a.width, dmg: a.dmg, status: a.status, hit: false };
    } else if (a.kind === 'shot') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = f.aim + (k - (a.count - 1) / 2) * (a.spread ?? 0);
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 3, dmg: a.dmg, from: f.uid, life: 3, status: a.status });
      }
    } else if (a.kind === 'ring') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = (k / a.count) * Math.PI * 2 + f.aim;
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 4, dmg: a.dmg, from: f.uid, life: 5, status: a.status });
      }
    } else if (a.kind === 'motes') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = f.aim + (k - (a.count - 1) / 2) * 0.6;
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 5, dmg: a.dmg, from: f.uid, life: a.life, home: 1.6, speed: a.speed, status: a.status });
      }
    }
    f.state = 'rest';
    f.timer = D.rest * (enraged ? 0.7 : 1) * (0.85 + s.rng() * 0.3);
  }
}

// 남은 무리가 가장자리에서 들어온다 (주인공에게서 먼 쪽)
function reinforce(s, dt, ev) {
  if (!s.queue.length || alive(s).length >= s.maxAlive) { s.spawnT = 0; return; }
  s.spawnT += dt;
  if (s.spawnT < 0.9) return;
  s.spawnT = 0;
  const id = s.queue.shift();
  const edges = [[s.rng() * ARENA.w, 12], [12, s.rng() * ARENA.h], [ARENA.w - 12, s.rng() * ARENA.h], [s.rng() * ARENA.w, ARENA.h - 12]];
  const far = edges.sort((a, b) => Math.hypot(b[0] - s.p.x, b[1] - s.p.y) - Math.hypot(a[0] - s.p.x, a[1] - s.p.y))[s.rng() < 0.6 ? 0 : 1];
  const f = makeFoe(s, id, far[0], far[1]);
  f.timer = 1.0;
  s.foes.push(f);
  ev.push({ type: 'spawn', uid: f.uid, id, x: f.x, y: f.y });
}

// ── 한 프레임 ─────────────────────────────────────────────
export function step(s, dt, input) {
  const ev = [];
  if (s.over) return ev;
  s.t += dt;
  const p = s.p;
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
    for (const f of alive(s)) if (!d.hit.has(f.uid) && Math.hypot(p.x - f.x, p.y - f.y) < f.def.radius + PLAYER.radius + 4) { d.hit.add(f.uid); hurtFoe(s, f, s.skills.r.dmg, ev, { skill: 'r' }); }
    d.left -= dt;
    if (d.left <= 0) p.dash = null;
    p.moving = true;
  } else if (canAct(p) || p.status.stun) {
    const mx = input.move?.x ?? 0, my = input.move?.y ?? 0;
    const m = Math.min(1, Math.hypot(mx, my));
    p.moving = m > 0.05 && !p.status.stun && !p.status.freeze;
    if (p.moving) {
      const sp = PLAYER.speed * s.mods.speedMul * (p.status.slow ? STATUS.slow.slow : 1) * (p.guard > 0 ? 0.45 : 1);
      const l = len(mx, my);
      p.x = clamp(p.x + (mx / l) * m * sp * dt, PLAYER.radius, ARENA.w - PLAYER.radius);
      p.y = clamp(p.y + (my / l) * m * sp * dt, PLAYER.radius, ARENA.h - PLAYER.radius);
    }
  }
  // 적의 몸에 부딪히면 밀려난다 (+ 약한 피해). 적끼리도 겹치지 않게 민다
  const live = alive(s);
  for (const f of live) {
    const fd = Math.hypot(p.x - f.x, p.y - f.y), minD = f.def.radius + PLAYER.radius;
    if (fd < minD) {
      const nx = (p.x - f.x) / (fd || 1), ny = (p.y - f.y) / (fd || 1);
      p.x = clamp(f.x + nx * minD, PLAYER.radius, ARENA.w - PLAYER.radius);
      p.y = clamp(f.y + ny * minD, PLAYER.radius, ARENA.h - PLAYER.radius);
      if (!p.dash && s.t - f.bump > 0.8) { f.bump = s.t; hurtPlayer(s, f.def.contact, ev, { dir: Math.atan2(-ny, -nx), src: f.uid }); }
    }
  }
  for (let i = 0; i < live.length; i += 1) for (let j = i + 1; j < live.length; j += 1) {
    const a = live[i], b = live[j];
    const dd = Math.hypot(a.x - b.x, a.y - b.y), minD = a.def.radius + b.def.radius;
    if (dd < minD && dd > 0) {
      const push = (minD - dd) / 2, nx = (a.x - b.x) / dd, ny = (a.y - b.y) / dd;
      if (!a.charge) { a.x += nx * push; a.y += ny * push; }
      if (!b.charge) { b.x -= nx * push; b.y -= ny * push; }
    }
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

  for (const f of alive(s)) foeThink(s, f, dt, ev);
  reinforce(s, dt, ev);

  // 탄
  for (const sh of s.shots) {
    if (sh.home) { // 쫓아오는 탄: 조금씩 방향을 튼다
      const want = Math.atan2(p.y - sh.y, p.x - sh.x), cur = Math.atan2(sh.vy, sh.vx);
      let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
      const turn = clamp(d, -sh.home * dt, sh.home * dt);
      sh.vx = Math.cos(cur + turn) * sh.speed; sh.vy = Math.sin(cur + turn) * sh.speed;
    }
    sh.x += sh.vx * dt; sh.y += sh.vy * dt; sh.life -= dt;
    if (sh.x < -10 || sh.y < -10 || sh.x > ARENA.w + 10 || sh.y > ARENA.h + 10) sh.life = 0;
    if (sh.life <= 0) continue;
    if (sh.from !== 'player' && Math.hypot(p.x - sh.x, p.y - sh.y) < PLAYER.radius + sh.r) {
      const r = hurtPlayer(s, sh.dmg, ev, { dir: Math.atan2(-sh.vy, -sh.vx), shot: true, status: sh.status });
      if (r === 'blocked' && s.skills.e.reflect) { sh.vx *= -1.4; sh.vy *= -1.4; sh.from = 'player'; sh.home = 0; sh.life = 2; ev.push({ type: 'reflect', x: sh.x, y: sh.y }); continue; }
      if (r) sh.life = 0;
    } else if (sh.from === 'player') {
      const f = alive(s).find((x) => Math.hypot(x.x - sh.x, x.y - sh.y) < x.def.radius + sh.r);
      if (f) { hurtFoe(s, f, sh.dmg * 2, ev, { skill: 'reflect' }); sh.life = 0; }
    }
  }
  s.shots = s.shots.filter((x) => x.life > 0);

  tickStatus(s, p, dt, ev, true);
  for (const f of alive(s)) tickStatus(s, f, dt, ev, false);
  return ev;
}
