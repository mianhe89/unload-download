// 마을 동물(content/animals.js): 제자리 근처를 어슬렁거리고, E로 건드리면 운다. 거듭 건드리면 관심을 잃었다가(BORED)
// 한동안 지나면 다시 반긴다. 가방의 먹을 것을 건네면 받아먹는다. 사람이 아니라서 마음(호감도)은 쌓지 않는다.
import { ANIMALS, SPECIES_INFO, BORED } from '../../../content/animals.js';
import { TILE } from '../../../content/maps/village.js';

const PATIENCE = 3;   // 이만큼 연달아 건드리면 관심을 잃는다
const RECOVER = 40;   // 초. 이만큼 지나면 다시 반긴다
const pick = (l) => l[Math.floor(Math.random() * l.length)];

export class Animals {
  constructor(field) {
    this.field = field;
    this.list = [];
    if (field.roomId) return; // 집 안엔 없다
    for (const a of ANIMALS[field.mapDef.id ?? 'village'] ?? []) {
      const x = a.at[0] * TILE + TILE / 2, y = a.at[1] * TILE + TILE / 2;
      const sprite = field.add.sprite(x, y + TILE / 2, `animal.${a.species}.0`).setOrigin(0.5, 1).setDepth(y);
      this.list.push({ ...a, voice: a.species, info: SPECIES_INFO[a.species], sprite, home: { x, y }, x, y, t: Math.random() * 2, tx: x, ty: y, pokes: 0, lastPoke: -99 });
    }
  }

  update(dt, paused) {
    const f = this.field;
    for (const a of this.list) {
      a.t -= dt;
      if (!paused && a.t <= 0) {
        a.t = 1.5 + Math.random() * 3;
        const r = (a.radius ?? 1) * TILE;
        a.tx = a.home.x + (Math.random() * 2 - 1) * r;
        a.ty = a.home.y + (Math.random() * 2 - 1) * r;
      }
      const dx = a.tx - a.x, dy = a.ty - a.y, d = Math.hypot(dx, dy);
      const moving = !paused && d > 1;
      if (moving) {
        const step = Math.min(d, 18 * dt);
        const nx = a.x + (dx / d) * step, ny = a.y + (dy / d) * step;
        if (!f.mapDef.isSolidPx(nx, ny + 4)) { a.x = nx; a.y = ny; } else { a.tx = a.x; a.ty = a.y; }
        if (Math.abs(dx) > 0.5) a.sprite.setFlipX(dx < 0);
      }
      a.sprite.setTexture(`animal.${a.species}.${moving && Math.floor(f.time.now / 220) % 2 ? 1 : 0}`);
      a.sprite.setPosition(Math.round(a.x), Math.round(a.y + TILE / 2)).setDepth(a.y);
    }
  }

  nearest(px, py, range) {
    let best = null, bd = range;
    for (const a of this.list) { const d = Math.hypot(a.x - px, a.y - py); if (d < bd) { best = a; bd = d; } }
    return best;
  }

  // 말풍선은 동물을 따라다닌다 (동물 자체가 x·y·sprite를 가진 대상)
  say(a, text) { this.field.ui.bubbles.show(a, text, '#f4f0e8', 2000); }

  poke(a) {
    const now = this.field.time.now / 1000;
    a.pokes = now - a.lastPoke < RECOVER ? a.pokes + 1 : 1;
    a.lastPoke = now;
    a.sprite.setFlipX(this.field.player.x < a.x);
    this.say(a, a.pokes > PATIENCE ? BORED : pick(a.info.sounds));
  }

  feed(a, itemId) {
    const liked = a.info.likes.includes(itemId);
    a.pokes = 0;
    this.say(a, liked ? a.info.fed.liked : a.info.fed.other);
    return liked;
  }
}
