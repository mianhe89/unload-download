// 액션 전투 봇 (균형 테스트용).
//   smart: 예고를 보면 그 모양 밖으로 빠지고, 탄을 피하고, 가장 가까운 적에게 붙어 벤다. 다치면 붕대·물약
//   brute: 피하지 않고 가장 가까운 적에게 붙어 때리기만 한다
//   idle:  가만히 있는다
const near = (s) => s.foes.filter((f) => f.hp > 0).reduce((a, f) => (!a || Math.hypot(f.x - s.p.x, f.y - s.p.y) < Math.hypot(a.x - s.p.x, a.y - s.p.y) ? f : a), null);

function threatened(s) {
  const p = s.p;
  for (const t of s.tells) {
    const dx = p.x - t.x, dy = p.y - t.y, d = Math.hypot(dx, dy);
    const off = Math.abs(Math.atan2(Math.sin(Math.atan2(dy, dx) - t.dir), Math.cos(Math.atan2(dy, dx) - t.dir)));
    if (t.kind === 'sweep' && d < t.range + 12 && off < (t.arc * Math.PI) / 360 + 0.4) return t;
    if (t.kind === 'lunge' && off < 0.6 && d < t.range + 16) return t;
    if ((t.kind === 'ring' || t.kind === 'shot' || t.kind === 'motes') && d < 60) return t;
  }
  return null;
}

export function smart(s) {
  const p = s.p, f = near(s);
  if (!f) return {};
  const toF = Math.atan2(f.y - p.y, f.x - p.x), d = Math.hypot(f.x - p.x, f.y - p.y);
  const input = { aim: { x: f.x, y: f.y } };
  const t = threatened(s);
  if (t) {
    const side = t.dir + Math.PI / 2 * (((p.x - t.x) * -Math.sin(t.dir) + (p.y - t.y) * Math.cos(t.dir)) >= 0 ? 1 : -1);
    input.move = { x: Math.cos(side) - Math.cos(toF) * 0.3, y: Math.sin(side) - Math.sin(toF) * 0.3 };
    if (t.left !== undefined && t.left < 0.22 && !(p.cd.r > 0)) { input.aim = { x: p.x + Math.cos(side) * 10, y: p.y + Math.sin(side) * 10 }; input.r = true; }
    return input;
  }
  const shot = s.shots.find((sh) => sh.from !== 'player' && Math.hypot(sh.x - p.x, sh.y - p.y) < 30);
  if (shot) { const away = Math.atan2(shot.vy, shot.vx) + Math.PI / 2; input.move = { x: Math.cos(away), y: Math.sin(away) }; return input; }
  if (p.hp < p.maxHp * 0.35 && s.bag.potion > 0 && !(p.quickCd > 0)) { input.quick = s.quick.indexOf('potion'); return input; }
  if (p.hp < p.maxHp * 0.5 && !p.regen && s.bag.bandage > 0) { input.quick = s.quick.indexOf('bandage'); input.move = { x: -Math.cos(toF), y: -Math.sin(toF) }; return input; }
  if (d > 22) input.move = { x: Math.cos(toF), y: Math.sin(toF) };
  input.atk = d < 30; input.q = d < 44; input.w = d < 30;
  return input;
}

export function brute(s) {
  const p = s.p, f = near(s);
  if (!f) return {};
  const d = Math.hypot(f.x - p.x, f.y - p.y);
  return { aim: { x: f.x, y: f.y }, move: d > 20 ? { x: f.x - p.x, y: f.y - p.y } : null, atk: true, q: true, w: true };
}

export const idle = () => ({});

const DT = 1 / 60;
export const runBot = (a, bot, secs = 240) => { for (let i = 0; i < secs / DT && !a.over; i += 1) a.step(DT, bot(a.state)); return a.over ?? 'timeout'; };
