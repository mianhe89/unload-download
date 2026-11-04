// 가려진 사람 보이기: 사람(주인공·NPC)이 나무·건물 뒤로 들어가 가려지면, 그 위에 흐린 실루엣을 겹쳐 그린다.
// 그래서 사람이 물체 뒤로 사라지지 않는다(나무 뒤로 걸어가는 입체감은 그대로).
const ALPHA = 0.55;

export class Xray {
  constructor(field, placed) {
    this.field = field;
    // 가릴 수 있는 물체: 사람보다 키가 큰 것(나무·건물). 바닥 깔개는 빼고
    this.blockers = (placed ?? []).filter((o) => o.img && o.h >= 24 && o.img.depth > -800)
      .map((o) => ({ x: o.img.x, y: o.img.y, w: o.w, h: o.h, depth: o.img.depth }));
    this.ghosts = new Map();
    this.timer = 0;
  }

  ghostOf(actor) {
    let g = this.ghosts.get(actor);
    if (!g) {
      g = this.field.add.sprite(0, 0, actor.sprite.texture.key, 0).setDepth(8800).setAlpha(ALPHA).setVisible(false);
      this.ghosts.set(actor, g);
    }
    return g;
  }

  hidden(s) {
    const b = s.getBounds();
    const cx = b.centerX, cy = b.y + b.height * 0.45; // 몸통 가운데
    return this.blockers.some((o) => o.depth > s.depth && cx > o.x + 2 && cx < o.x + o.w - 2 && cy > o.y && cy < o.y + o.h - 4);
  }

  update(dt) {
    const actors = [this.field.player, ...Object.values(this.field.npcs ?? {})].filter((a) => a?.sprite?.active);
    this.timer -= dt;
    const check = this.timer <= 0;
    if (check) this.timer = 0.1;
    for (const a of actors) {
      const g = this.ghostOf(a);
      if (check) g.hiddenNow = this.hidden(a.sprite) && a.sprite.visible && a.sprite.alpha > 0.3;
      if (!g.hiddenNow) { g.setVisible(false); continue; }
      g.setTexture(a.sprite.texture.key, a.sprite.frame.name).setOrigin(a.sprite.originX, a.sprite.originY)
        .setPosition(a.sprite.x, a.sprite.y).setScale(a.sprite.scaleX, a.sprite.scaleY).setFlipX(a.sprite.flipX).setVisible(true);
    }
    // 사라진 사람의 실루엣 정리
    for (const [a, g] of this.ghosts) if (!a.sprite?.active) { g.destroy(); this.ghosts.delete(a); }
  }
}
