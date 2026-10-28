// 걸어 다니는 인물 하나(플레이어/NPC 공용): 스프라이트, 방향, 걷기 애니메이션, 충돌 이동.
import { TILE } from '../../content/art/tiles.js';

const DIR_FRAME = { down: 0, up: 3, side: 6 };

export class Actor {
  constructor(scene, id, tx, ty, face = 'down') {
    this.scene = scene;
    this.id = id;
    this.key = `char.${id}`;
    this.sprite = scene.add.sprite(tx * TILE + TILE / 2, ty * TILE + TILE / 2, this.key, 0);
    this.sprite.setOrigin(0.5, 0.8);
    this.radius = 5;
    this.face(face);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  face(dir) {
    this.dir = dir;
    const sheetDir = dir === 'left' || dir === 'right' ? 'side' : dir;
    this.sprite.setFlipX(dir === 'left');
    if (!this.moving) this.sprite.setFrame(DIR_FRAME[sheetDir]);
  }

  faceToward(x, y) {
    const dx = x - this.x, dy = y - this.y;
    this.face(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }

  // 충돌을 고려해 (dx, dy)만큼 움직인다. blocked(x, y) → 그 점에 설 수 없으면 true
  move(dx, dy, blocked) {
    const r = this.radius;
    const canStand = (x, y) => !blocked(x - r, y - 2) && !blocked(x + r, y - 2) && !blocked(x - r, y + 2) && !blocked(x + r, y + 2);
    if (dx && canStand(this.x + dx, this.y)) this.sprite.x += dx;
    if (dy && canStand(this.x, this.y + dy)) this.sprite.y += dy;
    const moving = Boolean(dx || dy);
    if (moving) {
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (dir !== this.dir || !this.moving) {
        this.dir = dir;
        this.sprite.setFlipX(dir === 'left');
        this.sprite.play(`${this.key}.${dir === 'left' || dir === 'right' ? 'side' : dir}`, true);
      }
    } else if (this.moving) {
      this.sprite.stop();
      this.moving = false;
      this.face(this.dir);
    }
    this.moving = moving;
    this.sprite.setDepth(this.y);
  }

  distTo(x, y) { return Math.hypot(this.x - x, this.y - y); }

  destroy() { this.sprite.destroy(); }
}
