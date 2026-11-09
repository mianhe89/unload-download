import { describe, it, expect } from 'vitest';
import { Crowd, PASS_AFTER } from '../../src/field/systems/Crowd.js';

// Actor.move와 같은 규칙으로 움직이는 가짜 주인공 (오른쪽으로 걷는다)
function walker(x, y, vx = 72, vy = 0) {
  const p = { sprite: { x, y }, radius: 5, vel: { x: vx, y: vy } };
  Object.defineProperty(p, 'x', { get: () => p.sprite.x });
  Object.defineProperty(p, 'y', { get: () => p.sprite.y });
  p.update = (dt, blocked) => {
    const r = p.radius, ok = (x, y) => !blocked(x - r, y - 2) && !blocked(x + r, y - 2) && !blocked(x - r, y + 1) && !blocked(x + r, y + 1);
    const dx = p.vel.x * dt, dy = p.vel.y * dt;
    if (dx && ok(p.x + dx, p.y)) p.sprite.x += dx;
    if (dy && ok(p.x, p.y + dy)) p.sprite.y += dy;
  };
  return p;
}
const npc = (x, y, extra = {}) => ({ x, y, mode: 'idle', sprite: { visible: true }, ...extra });
const run = (crowd, secs) => { for (let t = 0; t < secs; t += 1 / 60) crowd.movePlayer(1 / 60); };

describe('사람에 막히기', () => {
  it('서 있는 사람에 부딪히면 옆으로 비껴 돌아 지나간다', () => {
    const p = walker(100, 100), n = npc(120, 101);
    const c = new Crowd({ player: p, people: () => [n], solidPx: () => false });
    run(c, 0.3);
    expect(p.y).toBeLessThan(100); // 그 사람에게서 먼 쪽(위)으로 비낀다 — 밀어서 지나간 게 아니다
    run(c, 0.7);
    expect(p.x).toBeGreaterThan(140);
  });

  it('좁은 골목(위아래가 벽)에 선 사람도 잠깐 밀면 비켜 준다', () => {
    const p = walker(100, 100), n = npc(120, 100);
    const wall = (x, y) => y < 96 || y > 103;
    const c = new Crowd({ player: p, people: () => [n], solidPx: wall });
    run(c, 0.2);
    expect(p.x).toBeLessThan(110); // 처음엔 막힌다
    run(c, PASS_AFTER + 0.6);
    expect(p.x).toBeGreaterThan(130);
  });

  it('걸어가던 사람이 나를 덮쳐도 갇히지 않는다', () => {
    const p = walker(100, 100, 0, 72), n = npc(100, 101);
    const c = new Crowd({ player: p, people: () => [n], solidPx: () => false });
    run(c, 0.3);
    expect(p.y).toBeGreaterThan(115);
  });

  it('길을 가는 사람과 따라오는 사람은 막지 않는다', () => {
    const p = walker(100, 100), a = npc(115, 100, { route: [[1, 1]] }), b = npc(130, 100, { mode: 'follow' });
    const c = new Crowd({ player: p, people: () => [a, b], solidPx: () => false });
    run(c, 0.6);
    expect(p.y).toBe(100);
    expect(p.x).toBeGreaterThan(140);
  });
});
