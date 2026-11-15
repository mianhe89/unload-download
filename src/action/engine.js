// 탑뷰 액션 전투 엔진 (순수 — 화면 없이 돌고, 같은 씨앗이면 같은 결과).
// 모든 전투가 이 엔진이다: 길 위의 무리, 마을 습격, 시험·결투, 보스. 동료는 없다 — 주인공 혼자 싸운다.
// 장면(ActionScene)은 매 프레임 입력을 넣고 step()이 돌려준 사건을 그린다.
//   input: { move:{x,y}(-1~1), aim:{x,y}(월드 좌표), atk, q, w, e, r, dodge (이번 프레임에 눌림), quick: 0~7 | null }
//   손맛(content/action/action.js의 FEEL·DODGE·COMBO·KNOCK): 붙고 멎는 이동, 구르기(무적), 입력 버퍼, 3연타, 넉백, 맞은 뒤 무적.
//   난이도(DIFFICULTY): 적의 체력·피해·빠르기·쉬는 틈·예고, 예고 앞쪽 동안 주인공을 따라 겨눈다
//   적은 content/action/foes.js. 한 번에 maxAlive마리까지 나오고, 쓰러지면 남은 무리가 가장자리에서 들어온다.
import { BASE_SKILLS, STATUS, CONSUMABLES, QUICK_CD, EQUIPMENT, SETS, ARENA, FEEL, DODGE, COMBO, KNOCK, DIFFICULTY } from '../../content/action/action.js';
import { FOES } from '../../content/action/foes.js';
import { RELICS } from '../../content/action/relics.js';

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

// 유물 → 합친 효과 (겹치면 더한다). 없으면 모두 0이라 싸움이 그대로다
export function relicFx(relics = {}) {
  const R = { dmg: 0, speed: 0, hp: 0, atkCd: 0, dodgeCd: 0, reach: 0, knock: 0, wave: 0, waveCount: 0, waveSeek: 0, wavePierce: 0, waveSize: 0, onHit: [], freeze: 0, leech: 0, chain: 0, killBlast: 0, killHeal: 0, dodgeRing: 0, dodgeCharge: 0, thorns: 0, thirdWave: 0, calm: 0, rage: 0, echo: 0 };
  for (const [id, n] of Object.entries(relics ?? {})) {
    const fx = RELICS[id]?.fx;
    if (!fx || !(n > 0)) continue;
    for (const [k, v] of Object.entries(fx)) { if (k === 'onHit') for (let i = 0; i < n; i += 1) R.onHit.push(v); else R[k] += v * n; }
  }
  R.atkCd = Math.min(R.atkCd, 0.6); R.dodgeCd = Math.min(R.dodgeCd, 0.6); R.chain = Math.min(R.chain, 0.8);
  return R;
}

// 적 하나 (번호는 전투마다 1부터: 같은 씨앗이면 같은 전투)
function makeFoe(s, id, x, y) {
  const d = FOES[id];
  if (!d) throw new Error(`없는 적: ${id}`);
  const n = (s.seq += 1);
  const hp = Math.round(d.hp * DIFFICULTY.hp);
  return { uid: `${id}#${n}`, id, def: d, x, y, hp, maxHp: hp, status: {}, i: 0, state: 'rest', timer: 0.8 + (n % 5) * 0.25, cur: null, aim: 0, charge: null, bump: -9, strafe: n % 2 ? 1 : -1, kx: 0, ky: 0, flinch: 0 };
}

// enemies: 적 id 목록(순서대로 나온다). hp/maxHp: 주인공 체력. mods: bodyMods(...)
export function createAction({ enemies = ['sweeper'], hp, maxHp, equip, bag = {}, quick = [], seed = 1, mods, maxAlive = MAX_ALIVE, relics = {} } = {}) {
  const rng = rngOf(seed);
  const m = mods ?? bodyMods(null);
  const { skills, def } = skillsFor(equip);
  for (const k of SKILL_KEYS) if (skills[k].dmg) skills[k].dmg = Math.max(1, Math.round(skills[k].dmg * m.atkMul));
  skills.r.cd = Math.max(1, +(skills.r.cd * m.dashMul).toFixed(2));
  const R = relicFx(relics);
  skills.atk.cd = +(skills.atk.cd * (1 - R.atkCd)).toFixed(3);
  const top = Math.max(20, Math.round(PLAYER.maxHp * m.hpMul) + R.hp);
  const s = {
    t: 0, over: null, rng, def, skills, mods: m, maxAlive, R,
    p: { x: ARENA.w / 2, y: ARENA.h - 40, vx: 0, vy: 0, hp: Math.min(hp ?? top, maxHp ?? top), maxHp: maxHp ?? top, face: -Math.PI / 2, cd: {}, status: {}, guard: 0, guardT: 0, dash: null, invuln: 0, hurtT: 0, regen: null, quickCd: 0, lastHit: -9, moving: false, buf: {}, recover: 0, combo: 0, lastAtk: -9, dodgeCd: 0, charged: false, calmAt: 0, echo: null, leechCap: 6, leechAcc: 0 },
    dodgeCd: +(DODGE.cd * m.dashMul * (1 - R.dodgeCd)).toFixed(2),
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
  if ((p.invuln > 0 && !opts.dot) || s.over) return false;
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
  if (!opts.dot) { p.invuln = Math.max(p.invuln, FEEL.hurtInvuln); p.hurtT = FEEL.hurtInvuln; }
  if (p.regen && !opts.dot) { p.regen = null; ev.push({ type: 'regenCut' }); }
  ev.push({ type: 'hurt', to: 'p', dmg: d, x: p.x, y: p.y, dot: Boolean(opts.dot), dir: opts.dir });
  if (opts.status && !opts.dot) addStatus(s, p, opts.status, ev, true);
  if (p.hp <= 0) { s.over = 'lose'; ev.push({ type: 'lose' }); }
  // 가시 껍질: 맞으면 둘레로 가시가 튄다
  if (!opts.dot && s.R.thorns > 0 && !s.over) spray(s, p.x, p.y, s.R.thorns, Math.round(6 * pMul(s)), { speed: 130, life: 0.6, r: 3, kind: 'thorn', off: s.t });
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
  // 유물: 내가 직접 준 피해(칼·칼바람·번개·터짐·가시)에 붙는 것
  if (opts.p && !opts.dot) onPlayerHit(s, f, d, ev, opts);
  // 맞으면 밀려나고(덩치가 클수록 덜), 작은 적은 잠깐 멈칫한다. 보스와 돌진 중인 적은 버틴다
  if (!opts.dot && !f.def.boss && !f.charge) {
    const a = Math.atan2(f.y - s.p.y, f.x - s.p.x);
    const k = (opts.knock ?? 60) * Math.min(1, 7 / f.def.radius);
    f.kx += Math.cos(a) * k; f.ky += Math.sin(a) * k;
    if (f.def.radius < 9) f.flinch = Math.max(f.flinch, KNOCK.flinch);
  }
  if (f.hp <= 0) {
    s.killed += 1;
    f.charge = null;
    s.tells = s.tells.filter((t) => t.uid !== f.uid);
    ev.push({ type: 'kill', uid: f.uid, id: f.id, x: f.x, y: f.y });
    onKill(s, f, ev, opts);
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

// ── 유물 ─────────────────────────────────────────────────
// 내 피해 배수: 숫돌·유리 칼날 등(dmg) + 성난 탈(체력 30% 아래)
function pMul(s) { const p = s.p; return (1 + s.R.dmg) * (p.hp / p.maxHp < 0.3 ? 1 + s.R.rage : 1); }

// 칼바람·가시: 내 탄. n갈래를 부채꼴(spread) 또는 둥글게(spread 없이 ring)
function spray(s, x, y, n, dmg, { dir = 0, spread = null, speed = 170, life = 0.9, r = 4, kind = 'wave', off = 0 } = {}) {
  const R = s.R;
  for (let k = 0; k < n; k += 1) {
    const a = spread === null ? (k / n) * Math.PI * 2 + off : dir + (k - (n - 1) / 2) * spread;
    s.shots.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed, r: r * (1 + R.waveSize), dmg, from: 'player', life, kind, pierce: R.wavePierce, hits: new Set(), seek: R.waveSeek > 0, speed });
  }
}

function onPlayerHit(s, f, d, ev, opts) {
  const R = s.R, p = s.p;
  for (const h of R.onHit) addStatus(s, f, { id: h.status, chance: h.chance }, ev, false);
  if (R.freeze > 0 && f.hp > 0) addStatus(s, f, { id: 'freeze', chance: R.freeze }, ev, false);
  if (R.leech > 0 && p.leechCap > 0) {
    const gain = Math.min(d * R.leech, p.leechCap);
    p.leechCap -= gain; p.leechAcc += gain;
    if (p.leechAcc >= 1) { const n = Math.floor(p.leechAcc); p.leechAcc -= n; const b = p.hp; p.hp = Math.min(p.maxHp, p.hp + n); if (p.hp > b) ev.push({ type: 'regen', amount: p.hp - b, leech: true }); }
  }
  if (R.chain > 0 && !opts.chained && s.rng() < R.chain) {
    const o = alive(s).filter((x) => x !== f).sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y))[0];
    if (o && Math.hypot(o.x - f.x, o.y - f.y) < 80) {
      ev.push({ type: 'chain', x1: f.x, y1: f.y, x2: o.x, y2: o.y });
      hurtFoe(s, o, Math.max(1, Math.round(d * 0.6)), ev, { p: true, chained: true, skill: 'chain', knock: 30 });
    }
  }
}

function onKill(s, f, ev, opts) {
  const R = s.R, p = s.p;
  if (R.killHeal > 0 && !s.over) { const b = p.hp; p.hp = Math.min(p.maxHp, p.hp + R.killHeal); if (p.hp > b) ev.push({ type: 'regen', amount: p.hp - b, soul: true }); }
  // 터지는 씨앗: 쓰러진 자리가 터진다. 터져서 쓰러진 적도 또 터진다(세 번까지)
  if (R.killBlast > 0 && (opts.blast ?? 0) < 3) {
    const r = 34, dmg = Math.max(1, Math.round(f.maxHp * R.killBlast));
    ev.push({ type: 'blast', x: f.x, y: f.y, r });
    for (const o of alive(s)) if (o !== f && Math.hypot(o.x - f.x, o.y - f.y) < r + o.def.radius) hurtFoe(s, o, dmg, ev, { p: true, chained: true, blast: (opts.blast ?? 0) + 1, skill: 'blast', knock: 140 });
  }
}

// 칼로 치는 판정 (스킬·메아리 공통)
function strike(s, key, sk, mul, knock, ev, combo = 0) {
  const p = s.p;
  for (const f of alive(s)) if (inShape(sk, p.x, p.y, p.face, f.x, f.y, f.def.radius)) hurtFoe(s, f, Math.max(1, Math.round(sk.dmg * mul)), ev, { status: sk.status, skill: key, knock, combo, p: true });
}

// ── 주인공 ───────────────────────────────────────────────
function useSkill(s, key, ev) {
  const p = s.p;
  let sk = s.skills[key];
  if ((p.cd[key] ?? 0) > 0 || !canAct(p) || p.dash) return false;
  if (p.recover > 0 && key !== 'e' && key !== 'r') return false; // 앞 동작이 끝나야 다음 (막기·돌진은 끊고 들어간다)
  p.cd[key] = sk.cd;
  // 기본 공격 3연타: 이어서 베면 셋째가 넓고 세다
  let hit = { knock: key === 'q' ? 110 : 70, mul: 1 }, combo = 0;
  if (key === 'atk') {
    combo = s.t - p.lastAtk <= COMBO.window + sk.cd ? (p.combo + 1) % COMBO.hits.length : 0;
    p.combo = combo; p.lastAtk = s.t;
    const c = COMBO.hits[combo];
    sk = { ...sk, arc: c.arc ?? sk.arc, range: c.range ?? sk.range };
    hit = { knock: c.knock, mul: c.dmgMul };
  }
  p.recover = FEEL.recover[key] ?? 0;
  ev.push({ type: 'skill', key, name: sk.name, shape: sk.shape, x: p.x, y: p.y, face: p.face, range: sk.range, arc: sk.arc, width: sk.width, combo });
  if (sk.shape === 'guard') { p.guard = sk.dur; return true; }
  if (sk.shape === 'dash') {
    p.dash = { left: sk.dur, vx: Math.cos(p.face) * sk.dist / sk.dur, vy: Math.sin(p.face) * sk.dist / sk.dur, hit: new Set() };
    if (sk.invuln) p.invuln = Math.max(p.invuln, sk.dur + 0.05);
    p.recover = 0;
    return true;
  }
  // 베는 쪽으로 반걸음 (무게)
  p.vx += Math.cos(p.face) * 40; p.vy += Math.sin(p.face) * 40;
  // 유물: 범위·넉백·피해 배수, 구른 뒤 첫 공격, 고요한 심장
  const R = s.R;
  if (R.reach) sk = { ...sk, range: sk.range * (1 + R.reach) };
  let mul = hit.mul * pMul(s);
  if (p.charged && R.dodgeCharge) { mul *= 1 + R.dodgeCharge; p.charged = false; ev.push({ type: 'charged' }); }
  if (R.calm && s.t - Math.max(p.lastHit, p.calmAt) >= 4) { mul *= 1 + R.calm; p.calmAt = s.t; ev.push({ type: 'calm' }); }
  const knock = hit.knock * (1 + R.knock);
  // 범위 안의 적은 모두 맞는다
  strike(s, key, sk, mul, knock, ev, combo);
  // 칼바람: 기본 공격마다 앞으로 / 3연타 셋째는 부채꼴로
  if (key === 'atk' && R.wave > 0) spray(s, p.x + Math.cos(p.face) * 6, p.y + Math.sin(p.face) * 6, 1 + R.waveCount, Math.max(1, Math.round(s.skills.atk.dmg * R.wave * mul)), { dir: p.face, spread: 0.22 });
  if (key === 'atk' && combo === 2 && R.thirdWave > 0) spray(s, p.x, p.y, R.thirdWave, Math.max(1, Math.round(s.skills.atk.dmg * 0.7 * mul)), { dir: p.face, spread: 0.4 });
  // 메아리 종: 찌르기·휘두르기가 조금 뒤 한 번 더
  if ((key === 'q' || key === 'w') && R.echo > 0) p.echo = { at: s.t + 0.3, key, sk, mul: mul * R.echo, knock };
  return true;
}

// 구르기: 이동 방향(없으면 보는 쪽)으로 무적인 채 굴러 빠진다. 공격은 못 하고, 끝나면 앞 동작의 무게도 풀린다
function useDodge(s, input, ev) {
  const p = s.p;
  if (p.dodgeCd > 0 || p.dash || p.status.stun || p.status.freeze) return false;
  const mx = input.move?.x ?? 0, my = input.move?.y ?? 0;
  const a = Math.hypot(mx, my) > 0.1 ? Math.atan2(my, mx) : p.face;
  p.dash = { left: DODGE.dur, vx: Math.cos(a) * DODGE.dist / DODGE.dur, vy: Math.sin(a) * DODGE.dist / DODGE.dur, hit: new Set(), dodge: true };
  p.invuln = Math.max(p.invuln, DODGE.invuln);
  p.dodgeCd = s.dodgeCd;
  p.recover = 0; p.guard = 0;
  ev.push({ type: 'dodge', x: p.x, y: p.y, dir: a });
  if (s.R.dodgeCharge > 0) p.charged = true;
  if (s.R.dodgeRing > 0) spray(s, p.x, p.y, s.R.dodgeRing, Math.max(1, Math.round(s.skills.atk.dmg * 0.5 * pMul(s))), { speed: 140, life: 0.5, off: s.t });
  return true;
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
  if (f.state === 'rest' && f.flinch > 0) return; // 맞고 멈칫 (예고는 끊지 않는다)
  if (f.state === 'rest') {
    const slow = f.status.slow ? STATUS.slow.slow : 1;
    // 원거리는 거리를 지키며 옆으로 돈다, 근거리는 다가온다
    if (D.keep) {
      const sp = D.speed * DIFFICULTY.speed * slow;
      if (d > D.keep + 12) moveFoe(f, toP, sp, dt);
      else if (d < D.keep - 12) moveFoe(f, toP + Math.PI, sp, dt);
      else moveFoe(f, toP + (Math.PI / 2) * f.strafe, sp * 0.6, dt);
    } else if (d > (D.boss ? 40 : D.radius + PLAYER.radius + 6)) moveFoe(f, toP, D.speed * DIFFICULTY.speed * slow, dt);
    if (f.timer <= 0) {
      const a = nextAttack(f, d);
      if (!a) { f.timer = 0.2; return; }
      f.i += 1;
      f.cur = a; f.state = 'tell'; f.timer = a.tell * DIFFICULTY.tell * (enraged ? 0.7 : 1); f.aim = toP;
      const tell = { uid: f.uid, id: a.id, kind: a.kind, name: a.name, x: f.x, y: f.y, dir: toP, range: a.range ?? a.dist, arc: a.arc, width: a.width, total: f.timer, left: f.timer };
      s.tells = s.tells.filter((t) => t.uid !== f.uid).concat(tell);
      ev.push({ type: 'tell', boss: Boolean(D.boss), ...tell });
    }
    return;
  }
  if (f.state === 'tell') {
    const t = s.tells.find((x) => x.uid === f.uid);
    // 예고 앞쪽 동안은 주인공을 따라 겨눈다(돌 수 있는 빠르기에 한계). 둥근 탄은 방향이 없다
    if (t && f.cur.kind !== 'ring' && f.timer > t.total * (1 - DIFFICULTY.track)) {
      let dd = toP - f.aim; while (dd > Math.PI) dd -= 2 * Math.PI; while (dd < -Math.PI) dd += 2 * Math.PI;
      f.aim += clamp(dd, -DIFFICULTY.turn * dt, DIFFICULTY.turn * dt);
    }
    if (t) { t.left = f.timer; t.x = f.x; t.y = f.y; t.dir = f.aim; }
    if (f.timer > 0) return;
    const a = f.cur;
    s.tells = s.tells.filter((x) => x.uid !== f.uid);
    ev.push({ type: 'foeAttack', uid: f.uid, id: a.id, kind: a.kind, name: a.name, x: f.x, y: f.y, dir: f.aim, boss: Boolean(D.boss), range: a.range, arc: a.arc });
    const dmg = Math.round(a.dmg * DIFFICULTY.dmg);
    if (a.kind === 'sweep') {
      if (inShape({ shape: 'arc', range: a.range, arc: a.arc }, f.x, f.y, f.aim, p.x, p.y, PLAYER.radius)) hurtPlayer(s, dmg, ev, { dir: f.aim + Math.PI, status: a.status, src: f.uid });
    } else if (a.kind === 'lunge') {
      f.charge = { dir: f.aim, left: a.dist, speed: a.dist / 0.3, width: a.width, dmg, status: a.status, hit: false };
    } else if (a.kind === 'shot') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = f.aim + (k - (a.count - 1) / 2) * (a.spread ?? 0);
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 3, dmg, from: f.uid, life: 3, status: a.status });
      }
    } else if (a.kind === 'ring') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = (k / a.count) * Math.PI * 2 + f.aim;
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 4, dmg, from: f.uid, life: 5, status: a.status });
      }
    } else if (a.kind === 'motes') {
      for (let k = 0; k < a.count; k += 1) {
        const ang = f.aim + (k - (a.count - 1) / 2) * 0.6;
        s.shots.push({ x: f.x, y: f.y, vx: Math.cos(ang) * a.speed, vy: Math.sin(ang) * a.speed, r: 5, dmg, from: f.uid, life: a.life, home: 1.6, speed: a.speed, status: a.status });
      }
    }
    f.state = 'rest';
    f.timer = D.rest * DIFFICULTY.rest * (enraged ? 0.7 : 1) * (0.85 + s.rng() * 0.3);
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
  p.hurtT = Math.max(0, p.hurtT - dt);
  p.recover = Math.max(0, p.recover - dt);
  p.dodgeCd = Math.max(0, p.dodgeCd - dt);
  p.leechCap = Math.min(6, p.leechCap + 6 * dt);
  if (p.echo && s.t >= p.echo.at) { const e = p.echo; p.echo = null; ev.push({ type: 'skill', key: e.key, name: e.sk.name, shape: e.sk.shape, x: p.x, y: p.y, face: p.face, range: e.sk.range, arc: e.sk.arc, width: e.sk.width, echo: true }); strike(s, e.key, e.sk, e.mul, e.knock, ev); }
  if (p.guard > 0) p.guard = Math.max(0, p.guard - dt);

  // 조준: 마우스 쪽을 본다
  if (input.aim && !p.dash) p.face = Math.atan2(input.aim.y - p.y, input.aim.x - p.x);

  // 이동 / 돌진·구르기
  if (input.dodge) p.buf.dodge = s.t + FEEL.buffer;
  if (p.buf.dodge >= s.t && useDodge(s, input, ev)) delete p.buf.dodge;
  if (p.dash) {
    const d = p.dash;
    p.x = clamp(p.x + d.vx * dt, PLAYER.radius, ARENA.w - PLAYER.radius);
    p.y = clamp(p.y + d.vy * dt, PLAYER.radius, ARENA.h - PLAYER.radius);
    if (!d.dodge) for (const f of alive(s)) if (!d.hit.has(f.uid) && Math.hypot(p.x - f.x, p.y - f.y) < f.def.radius + PLAYER.radius + 4) { d.hit.add(f.uid); hurtFoe(s, f, Math.round(s.skills.r.dmg * pMul(s)), ev, { skill: 'r', knock: 120 * (1 + s.R.knock), p: true }); }
    d.left -= dt;
    // 구르기·돌진이 끝나면 그 빠르기의 일부를 남겨 미끄러지듯 선다
    if (d.left <= 0) { p.dash = null; p.vx = d.vx * 0.25; p.vy = d.vy * 0.25; }
    p.moving = true;
  } else {
    const can = canAct(p);
    const mx = can ? input.move?.x ?? 0 : 0, my = can ? input.move?.y ?? 0 : 0;
    const m = Math.min(1, Math.hypot(mx, my));
    let tx = 0, ty = 0;
    if (m > 0.05) {
      const sp = PLAYER.speed * s.mods.speedMul * (1 + s.R.speed) * (p.status.slow ? STATUS.slow.slow : 1) * (p.guard > 0 ? 0.45 : 1) * (p.recover > 0 ? FEEL.recoverMul : 1);
      const l = len(mx, my);
      tx = (mx / l) * m * sp; ty = (my / l) * m * sp;
    }
    // 붙고 멎는 이동: 바라는 빠르기로 빠르게 다가간다(지수 감쇠 — 프레임 빠르기와 무관)
    const rate = m > 0.05 ? FEEL.accel : FEEL.decel;
    const kk = 1 - Math.exp(-rate * dt);
    p.vx += (tx - p.vx) * kk; p.vy += (ty - p.vy) * kk;
    if (Math.hypot(p.vx, p.vy) < 1) { p.vx = 0; p.vy = 0; }
    p.x = clamp(p.x + p.vx * dt, PLAYER.radius, ARENA.w - PLAYER.radius);
    p.y = clamp(p.y + p.vy * dt, PLAYER.radius, ARENA.h - PLAYER.radius);
    p.moving = Math.hypot(p.vx, p.vy) > 12;
  }
  // 적의 몸에 부딪히면 밀려난다 (+ 약한 피해). 적끼리도 겹치지 않게 민다
  const live = alive(s);
  for (const f of live) {
    const fd = Math.hypot(p.x - f.x, p.y - f.y), minD = f.def.radius + PLAYER.radius;
    if (fd < minD) {
      const nx = (p.x - f.x) / (fd || 1), ny = (p.y - f.y) / (fd || 1);
      p.x = clamp(f.x + nx * minD, PLAYER.radius, ARENA.w - PLAYER.radius);
      p.y = clamp(f.y + ny * minD, PLAYER.radius, ARENA.h - PLAYER.radius);
      if (!p.dash && s.t - f.bump > 0.8) { f.bump = s.t; hurtPlayer(s, Math.round(f.def.contact * DIFFICULTY.contact), ev, { dir: Math.atan2(-ny, -nx), src: f.uid }); }
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
  // 누른 공격·스킬은 잠깐 기억했다가(입력 버퍼) 되는 순간 쓴다 — 구르기 끝·쿨다운 끝에 맞춰 누르지 않아도 된다
  for (const k of SKILL_KEYS) if (input[k]) p.buf[k] = s.t + FEEL.buffer;
  if (canAct(p)) {
    for (const k of SKILL_KEYS) if (p.buf[k] >= s.t && useSkill(s, k, ev)) delete p.buf[k];
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

  // 넉백: 밀려나는 빠르기가 줄어들며 미끄러진다. 멈칫이 풀린다
  const kd = Math.exp(-KNOCK.decay * dt);
  for (const f of alive(s)) {
    if (f.kx || f.ky) {
      f.x = clamp(f.x + f.kx * dt, f.def.radius, ARENA.w - f.def.radius);
      f.y = clamp(f.y + f.ky * dt, f.def.radius, ARENA.h - f.def.radius);
      f.kx *= kd; f.ky *= kd;
      if (Math.hypot(f.kx, f.ky) < 2) { f.kx = 0; f.ky = 0; }
    }
    f.flinch = Math.max(0, f.flinch - dt);
  }
  for (const f of alive(s)) foeThink(s, f, dt, ev);
  reinforce(s, dt, ev);

  // 탄
  for (const sh of s.shots) {
    if (sh.seek && sh.from === 'player') { // 쫓는 눈: 가까운 적 쪽으로 튼다
      const t = alive(s).filter((x) => !sh.hits?.has(x.uid)).sort((a, b) => Math.hypot(a.x - sh.x, a.y - sh.y) - Math.hypot(b.x - sh.x, b.y - sh.y))[0];
      if (t) {
        const want = Math.atan2(t.y - sh.y, t.x - sh.x), cur = Math.atan2(sh.vy, sh.vx);
        let d = want - cur; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
        const turn = clamp(d, -7 * dt, 7 * dt);
        sh.vx = Math.cos(cur + turn) * sh.speed; sh.vy = Math.sin(cur + turn) * sh.speed;
      }
    }
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
      if (r === 'blocked' && s.skills.e.reflect) { sh.vx *= -1.4; sh.vy *= -1.4; sh.from = 'player'; sh.home = 0; sh.life = 2; sh.reflect = true; ev.push({ type: 'reflect', x: sh.x, y: sh.y }); continue; }
      if (r) sh.life = 0;
    } else if (sh.from === 'player') {
      const f = alive(s).find((x) => !sh.hits?.has(x.uid) && Math.hypot(x.x - sh.x, x.y - sh.y) < x.def.radius + sh.r);
      if (f) {
        if (sh.reflect) { hurtFoe(s, f, sh.dmg * 2, ev, { skill: 'reflect', p: true }); sh.life = 0; continue; }
        sh.hits.add(f.uid);
        hurtFoe(s, f, sh.dmg, ev, { skill: sh.kind ?? 'wave', p: true, knock: 50 * (1 + s.R.knock) });
        if (sh.pierce > 0) sh.pierce -= 1; else sh.life = 0;
      }
    }
  }
  s.shots = s.shots.filter((x) => x.life > 0);

  tickStatus(s, p, dt, ev, true);
  for (const f of alive(s)) tickStatus(s, f, dt, ev, false);
  return ev;
}
