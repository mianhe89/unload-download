// NPC 행동: idle(제자리), wander(주변 배회), follow(플레이어 따라다니기).
// 플레이어가 가까이 오면 그쪽을 본다. 컷신에서는 walkTo로 움직인다.
import { Actor } from './Actor.js';
import { TILE } from '../../content/art/tiles.js';

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

    if (this.mode === 'follow') {
      const d = this.distTo(player.x, player.y);
      if (d > 26) this.stepToward(player.x, player.y, speed * 1.6, blocked);
      else { this.move(0, 0, blocked); if (d < 40) this.faceToward(player.x, player.y); }
      return;
    }

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

  walkTo(tx, ty) {
    return new Promise((resolve) => { this.scripted = { x: tx * TILE + TILE / 2, y: ty * TILE + TILE / 2, resolve }; });
  }
}
