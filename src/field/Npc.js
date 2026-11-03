// NPC 행동: idle(제자리), wander(주변 배회), follow(플레이어 따라다니기 — 발자취를 밟아 온다), route(일과 따라 걷기).
// 플레이어가 가까이 오면 그쪽을 본다. 컷신에서는 walkTo로 움직인다.
import { Actor } from './Actor.js';
import { TILE } from '../../content/art/props.js';

export class Npc extends Actor {
  constructor(scene, id, cfg) {
    super(scene, id, cfg.at[0], cfg.at[1], cfg.face ?? 'down');
    this.mode = cfg.mode ?? 'idle';
    this.home = { x: this.x, y: this.y };
    this.radius = 5;
    this.wanderRadius = (cfg.radius ?? 2) * TILE;
    this.target = null;
    this.wait = Math.random() * 2;
    this.scripted = null; // 컷신 이동 중이면 { x, y, resolve }
  }

  update(dt, ctx) {
    const { player, blocked, paused } = ctx;
    const speed = 40 * dt;

    if (this.scripted) {
      const done = this.stepToward(this.scripted.x, this.scripted.y, 55 * dt, () => false);
      if (done) { const r = this.scripted.resolve; this.scripted = null; this.move(0, 0, blocked); r(); }
      return;
    }
    if (paused) { this.move(0, 0, blocked); return; }

    // 일과 이동: 길찾기로 받은 경로를 따라 걷는다 (systems/Schedules)
    if (this.route?.length) {
      const [tx, ty] = this.route[0];
      if (this.stepToward(tx * TILE + TILE / 2, ty * TILE + TILE / 2, 40 * dt, () => false)) {
        this.route.shift();
        if (!this.route.length) { this.home = { x: this.x, y: this.y }; const cb = this.onArrive; this.onArrive = null; cb?.(); }
      }
      return;
    }

    if (this.mode === 'follow') { this.follow(dt, player, blocked); return; }

    if (this.distTo(player.x, player.y) < 30) {
      this.move(0, 0, blocked);
      this.faceToward(player.x, player.y);
      return;
    }

    if (this.mode === 'wander') {
      if (!this.target) {
        this.wait -= dt;
        if (this.wait <= 0) {
          const a = Math.random() * Math.PI * 2, r = Math.random() * this.wanderRadius;
          this.target = { x: this.home.x + Math.cos(a) * r, y: this.home.y + Math.sin(a) * r };
        }
        this.move(0, 0, blocked);
      } else if (this.stepToward(this.target.x, this.target.y, speed, blocked)) {
        this.target = null;
        this.wait = 1.5 + Math.random() * 3;
      }
      return;
    }
    this.move(0, 0, blocked);
  }

  // 목표 방향으로 한 걸음. 도착(또는 막힘)하면 true
  stepToward(x, y, step, blocked) {
    const dx = x - this.x, dy = y - this.y;
    const d = Math.hypot(dx, dy);
    if (d < 2) { this.move(0, 0, blocked); return true; }
    const bx = this.x, by = this.y;
    this.move((dx / d) * Math.min(step, d), (dy / d) * Math.min(step, d), blocked);
    if (this.x === bx && this.y === by) { this.move(0, 0, blocked); return true; }
    return false;
  }

  // 동행: 플레이어가 지나간 자리(발자취)를 차례로 밟아 따라온다. 플레이어가 실제로 걸은 길이라 집·나무 모퉁이에 걸리지 않는다.
  // 그래도 한참 제자리걸음이거나 화면 밖까지 멀어지면, 플레이어 바로 뒤 발자취로 살짝 사라졌다 나타난다
  follow(dt, player, blocked) {
    const trail = (this.trail ??= []);
    const last = trail[trail.length - 1];
    if (!last || Math.hypot(player.x - last.x, player.y - last.y) > 6) {
      trail.push({ x: player.x, y: player.y });
      if (trail.length > 80) trail.shift();
    }
    const d = this.distTo(player.x, player.y);
    if (d <= 24) {
      // 따라잡았다: 지난 발자취는 버린다(빙 돌아온 길을 다시 걷지 않게)
      trail.length = 0;
      this.stuck = 0;
      this.move(0, 0, blocked);
      if (d < 40) this.faceToward(player.x, player.y);
      return;
    }
    if (d > 12 * TILE || (this.stuck ?? 0) > 0.8) { this.catchUp(player, blocked); return; }

    // 멀수록 조금 빨리 걷는다(플레이어가 뛰어도 놓치지 않게)
    const step = 40 * dt * Math.min(3.2, Math.max(1.6, d / 24));
    const next = trail[0] ?? player;
    const bx = this.x, by = this.y;
    const blockedHere = this.stepToward(next.x, next.y, step, blocked);
    if (trail.length && (blockedHere || Math.hypot(next.x - this.x, next.y - this.y) < 3)) trail.shift();
    this.stuck = Math.hypot(this.x - bx, this.y - by) < step * 0.3 ? (this.stuck ?? 0) + dt : 0;
  }

  // 플레이어 바로 뒤로 옮겨 온다(사라졌다 나타나기). 발자취가 넉넉하면 몇 걸음 뒤, 아니면 등 뒤·옆의 빈자리
  catchUp(player, blocked) {
    const trail = this.trail ?? [];
    const r = this.radius;
    const free = (x, y) => !blocked(x - r, y - 2) && !blocked(x + r, y - 2) && !blocked(x - r, y + 1) && !blocked(x + r, y + 1);
    const back = { up: [0, 1], down: [0, -1], left: [1, 0], right: [-1, 0] }[player.dir] ?? [0, 1];
    const around = [back, [back[1], back[0]], [-back[1], -back[0]], [-back[0], -back[1]]].map(([dx, dy]) => ({ x: player.x + dx * 18, y: player.y + dy * 18 }));
    const spot = [trail.length >= 4 ? trail[trail.length - 4] : null, ...around].find((p) => p && free(p.x, p.y)) ?? { x: player.x, y: player.y };
    this.sprite.setPosition(spot.x, spot.y);
    this.trail = [];
    this.stuck = 0;
    this.sprite.setAlpha(0);
    this.scene.tweens.add({ targets: this.sprite, alpha: 1, duration: 220 });
    this.sync();
  }

  walkTo(tx, ty) {
    return new Promise((resolve) => { this.scripted = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, resolve }; });
  }
}
