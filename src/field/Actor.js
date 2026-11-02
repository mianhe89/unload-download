// 걸어 다니는 인물 하나(플레이어/NPC 공용): 스프라이트, 그림자, 방향, 걷기 애니메이션, 충돌 이동.
// 스프라이트시트(Ninja Adventure 형식): 열 = 아래·위·왼쪽·오른쪽, 줄 = 걷기 프레임. 서 있을 땐 0번 줄
import { TILE } from '../../content/maps/village.js';
import { CHAR } from '../../content/art/pack.js';

export class Actor {
  // skin: 다른 도트를 쓸 때 (주인공의 체형별 도트 me@chubby 등)
  constructor(scene, id, tx, ty, face = 'down', skin = null) {
    this.scene = scene;
    this.id = id;
    this.key = `char.${skin ?? id}`;
    if (!scene.textures.exists(this.key)) this.key = `char.${id}`;
    const x = tx * TILE + TILE / 2, y = ty * TILE + TILE / 2;
    this.shadow = scene.add.image(x, y + 1, 'fx.shadow').setDepth(-400).setAlpha(0.55);
    this.sprite = scene.add.sprite(x, y, this.key, 0);
    this.sprite.setOrigin(0.5, 0.94);
    this.radius = 5;
    this.face(face);
  }

  get x() { return this.sprite.x; }
  get y() { return this.sprite.y; }

  face(dir) {
    this.dir = dir;
    if (!this.moving) this.sprite.setFrame(CHAR.dirs[dir]);
  }

  faceToward(x, y) {
    const dx = x - this.x, dy = y - this.y;
    this.face(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
  }

  // 충돌을 고려해 (dx, dy)만큼 움직인다. blocked(x, y) → 그 점에 설 수 없으면 true
  move(dx, dy, blocked) {
    const r = this.radius;
    const canStand = (x, y) => !blocked(x - r, y - 2) && !blocked(x + r, y - 2) && !blocked(x - r, y + 1) && !blocked(x + r, y + 1);
    if (dx && canStand(this.x + dx, this.y)) this.sprite.x += dx;
    if (dy && canStand(this.x, this.y + dy)) this.sprite.y += dy;
    const moving = Boolean(dx || dy);
    if (moving) {
      const dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
      if (dir !== this.dir || !this.moving) {
        this.dir = dir;
        this.sprite.play(`${this.key}.${dir}`, true);
      }
    } else if (this.moving) {
      this.sprite.stop();
      this.moving = false;
      this.face(this.dir);
    }
    this.moving = moving;
    this.sync();
  }

  // 그림자와 깊이를 스프라이트 위치에 맞춘다 (순간이동 후에도 부른다)
  sync() {
    this.sprite.setDepth(this.y);
    this.shadow.setPosition(this.x, this.y).setAlpha(0.55 * this.sprite.alpha);
  }

  distTo(x, y) { return Math.hypot(this.x - x, this.y - y); }

  destroy() { this.sprite.destroy(); this.shadow.destroy(); }
}
