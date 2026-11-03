// 까마귀(마스코트, docs/스토리.md '먼저 정한 것'): 수확제 전날 저녁 종탑 위에 처음 내려앉아(crow.arrived) 그 뒤로 늘 거기 있다.
// 이 세계에서 주인공 말고 지워진 것을 기억하는 유일한 존재. 주인공이 가까이 오면 그쪽으로 고개를 돌리고, 가끔 자리를 고쳐 앉는다.
// 우리 마을 맵에만 있다.
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { TILE } from '../../../content/maps/village.js';

const PERCH = { x: 22 * TILE + 34, y: 5 * TILE + 10 }; // 종탑 지붕 꼭대기 (belltower: at [22, 5], 64×80)
const FRAME = { down: 0, up: 1, left: 2, right: 3 };     // 팩의 걷는 몬스터 시트: 열이 방향

export class Crow {
  constructor(field) {
    this.field = field;
    this.t = 0;
    if (!field.home || !WorldMemory.run.flags['crow.arrived'] || !field.textures.exists('mon.Crow')) return;
    this.show();
  }

  show() {
    if (this.sprite) return;
    const f = this.field;
    this.sprite = f.add.sprite(PERCH.x, PERCH.y, 'mon.Crow', FRAME.down).setOrigin(0.5, 1).setDepth(PERCH.y + 200);
  }

  // 수확제 전날 저녁, 대본이 crow.arrived를 켜는 순간 날아와 앉는다
  arrive() {
    if (this.sprite || !this.field.home) return;
    this.show();
    const s = this.sprite;
    s.y -= 60; s.x += 40; s.setAlpha(0);
    this.field.tweens.add({ targets: s, x: PERCH.x, y: PERCH.y, alpha: 1, duration: 1400, ease: 'Sine.out' });
  }

  update(dt) {
    if (!this.sprite) {
      if (this.field.home && WorldMemory.run.flags['crow.arrived']) this.arrive();
      return;
    }
    this.t -= dt;
    const p = this.field.player;
    const dx = p.x - PERCH.x, dy = p.y - PERCH.y;
    const near = Math.hypot(dx, dy) < 7 * TILE;
    // 가까우면 주인공 쪽을 본다. 멀면 가끔 다른 쪽을 본다
    if (near) this.sprite.setFrame(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? FRAME.left : FRAME.right) : FRAME.down);
    else if (this.t <= 0) {
      this.t = 3 + Math.random() * 4;
      this.sprite.setFrame([FRAME.down, FRAME.left, FRAME.right][Math.floor(Math.random() * 3)]);
      this.field.tweens.add({ targets: this.sprite, y: PERCH.y - 2, duration: 120, yoyo: true });
    }
  }
}
