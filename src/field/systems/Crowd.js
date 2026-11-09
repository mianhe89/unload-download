// 사람에 막히는 규칙: 사람은 몸이 있어 부딪히지만, 길을 막아 세우지는 않는다.
// - 서 있는 사람에 부딪히면 옆으로 비껴 돈다.
// - 같은 사람을 PASS_AFTER초 넘게 밀면 비켜 준 듯 지나갈 수 있다(좁은 문 앞·골목).
// - 길을 가는 사람(일과·컷신 이동)과 따라오는 사람은 막지 않는다. 지나가는 사람 앞에서 멈춰 서지 않게.
// - 이미 몸이 겹친 사람(걸어가다 나를 덮친 사람)은 막지 않는다. 그 안에 갇히지 않게.
// 순수 규칙이라 Phaser 없이 시험한다(tests/unit/crowd.test.js). FieldScene은 movePlayer만 부른다.

const BOX_X = 6; // 사람 몸의 반폭(px)
const BOX_Y = 4; // 사람 몸의 반높이(px, 발 기준)
export const PASS_AFTER = 0.35;
const SLIDE = 0.9; // 비껴 돌 때 걷는 속도에 대한 비율

export class Crowd {
  // people(): 지금 맵의 사람들, solidPx(x, y): 맵이 막혔는가
  constructor(opts) {
    this.opts = opts; // player는 getter일 수 있다(맵이 바뀌면 주인공을 새로 만든다)
    this.people = opts.people;
    this.solidPx = opts.solidPx;
    this.through = new Set(); // 비켜 준 사람 (몸이 떨어지면 다시 막는다)
    this.pushing = null;
    this.pushT = 0;
  }

  get player() { return this.opts.player; }

  static fromScene(scene) {
    return new Crowd({ get player() { return scene.player; }, people: () => Object.values(scene.npcs), solidPx: (x, y) => scene.map.isSolidPx(x, y) });
  }

  // 주인공 몸(Actor.move의 네 점)이 이 사람 몸에 걸치는가
  touching(n, x = this.player.x, y = this.player.y) {
    const r = this.player.radius;
    return [[x - r, y - 2], [x + r, y - 2], [x - r, y + 1], [x + r, y + 1]].some(([px, py]) => inside(n, px, py));
  }

  solid(n) {
    return n.mode !== 'follow' && !n.route?.length && !n.scripted && n.sprite?.visible !== false && !this.through.has(n);
  }

  // 점 (x, y)를 막는 사람 (없으면 null)
  personAt(x, y) {
    for (const n of this.people()) if (this.solid(n) && inside(n, x, y) && !this.touching(n)) return n;
    return null;
  }

  canStand(x, y) {
    const r = this.player.radius;
    return [[x - r, y - 2], [x + r, y - 2], [x - r, y + 1], [x + r, y + 1]].every(([px, py]) => !this.solidPx(px, py) && !this.personAt(px, py));
  }

  movePlayer(dt) {
    const p = this.player;
    const x0 = p.x, y0 = p.y;
    p.update(dt, (x, y) => this.solidPx(x, y) || this.personAt(x, y) !== null);
    for (const n of this.through) if (!this.touching(n)) this.through.delete(n);

    const vx = (p.vel?.x ?? 0) * dt, vy = (p.vel?.y ?? 0) * dt;
    const want = Math.hypot(vx, vy);
    const got = Math.hypot(p.x - x0, p.y - y0);
    const n = want > 0.01 && got < want * 0.5 ? this.blockerAhead(x0 + vx, y0 + vy) : null;
    if (!n) { this.pushing = null; this.pushT = 0; return; }

    this.pushT = this.pushing === n ? this.pushT + dt : dt;
    this.pushing = n;
    if (this.pushT >= PASS_AFTER) { this.through.add(n); this.pushing = null; this.pushT = 0; return; }
    this.slide(n, vx, vy, want * SLIDE);
  }

  blockerAhead(x, y) {
    const r = this.player.radius;
    for (const [px, py] of [[x - r, y - 2], [x + r, y - 2], [x - r, y + 1], [x + r, y + 1]]) {
      const n = this.personAt(px, py);
      if (n) return n;
    }
    return null;
  }

  // 가려던 쪽의 옆으로 한 걸음: 그 사람에게서 먼 쪽부터, 막혔으면 반대쪽
  slide(n, vx, vy, step) {
    const p = this.player;
    const horiz = Math.abs(vx) >= Math.abs(vy);
    const off = horiz ? p.y - n.y : p.x - n.x;
    const first = off === 0 ? 1 : Math.sign(off);
    for (const s of [first, -first]) {
      const nx = p.x + (horiz ? 0 : s * step), ny = p.y + (horiz ? s * step : 0);
      if (this.canStand(nx, ny)) { p.sprite.x = nx; p.sprite.y = ny; return true; }
    }
    return false;
  }
}

function inside(n, x, y) {
  return Math.abs(n.x - x) < BOX_X && Math.abs(n.y - y) < BOX_Y;
}
