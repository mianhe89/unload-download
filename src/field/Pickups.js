// 바닥에 떨어진 물건(빵, 화관, 불씨 등). 플레이어가 밟으면 줍는다.
// 묶음(group) 단위로 '다 주웠는가'를 이벤트가 확인한다. 시간이 지나면 사라지는 것도 있다.
import { TILE } from '../../content/art/tiles.js';

export class Pickups {
  constructor(scene) {
    this.scene = scene;
    this.items = [];          // { group, sprite }
    this.groups = new Map();  // group → { total, picked, expire }
  }

  spawn({ group, prop, items, expire }, onExpire) {
    const g = { total: items.length, picked: 0, expired: false };
    this.groups.set(group, g);
    for (const [tx, ty] of items) {
      const s = this.scene.add.image(tx * TILE + TILE / 2, ty * TILE + TILE / 2, `prop.${prop}`).setDepth(ty * TILE);
      this.scene.tweens.add({ targets: s, y: s.y - 2, duration: 600, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.items.push({ group, sprite: s });
    }
    if (expire) {
      this.scene.time.delayedCall(expire.seconds * 1000, () => {
        if (g.picked >= g.total) return;
        g.expired = true;
        this.items.filter((i) => i.group === group).forEach((i) => i.sprite.destroy());
        this.items = this.items.filter((i) => i.group !== group);
        onExpire?.(expire.run);
      });
    }
  }

  // 플레이어와 겹친 물건을 줍는다. 주운 묶음 이름들을 돌려준다
  collect(player) {
    const got = [];
    this.items = this.items.filter((i) => {
      if (Math.hypot(i.sprite.x - player.x, i.sprite.y - player.y) > 10) return true;
      i.sprite.destroy();
      this.groups.get(i.group).picked += 1;
      got.push(i.group);
      return false;
    });
    return got;
  }

  allPicked(group) {
    const g = this.groups.get(group);
    return Boolean(g && !g.expired && g.picked >= g.total);
  }
}
