// 시간대 조명. 밤에는 어둡게 덮고 불빛 주변만 밝힌다.
// 지워진 사람이 늘수록 세상이 회색으로 바랜다(붕괴의 최소 연출).
import Phaser from 'phaser';
import { TILE } from '../../content/art/tiles.js';

export class Lighting {
  constructor(scene, { time, lights = [], erasedCount = 0, spots, width, height }) {
    this.scene = scene;
    this.glows = [];
    const night = time === 'night';

    // 밤의 어둠 (월드 전체를 덮는 사각형)
    if (night) {
      scene.add.rectangle(width / 2, height / 2, width, height, 0x0a0c24, 0.55).setDepth(9000);
    }

    // 불빛: 어둠 위에 더하기 합성
    for (const l of lights) {
      const s = spots[l.spot];
      if (!s) continue;
      const g = scene.add.image(s.x * TILE + TILE / 2, s.y * TILE, 'fx.glow')
        .setDepth(9001).setBlendMode(Phaser.BlendModes.ADD).setTint(0xffb060).setAlpha(night ? 0.55 : 0.2);
      g.setDisplaySize(l.radius * 2, l.radius * 2);
      if (l.flicker) scene.tweens.add({ targets: g, alpha: { from: g.alpha, to: g.alpha * 0.75 }, duration: 180, yoyo: true, repeat: -1, ease: 'Stepped' });
      this.glows.push(g);
    }

    // 바램
    const fade = Math.min(erasedCount * 0.07, 0.3);
    if (fade > 0) scene.add.rectangle(width / 2, height / 2, width, height, 0x8a8a8a, fade).setDepth(9002);

    // 플레이어 주변의 작은 빛 (밤)
    this.lantern = night
      ? scene.add.image(0, 0, 'fx.glow').setDepth(9001).setBlendMode(Phaser.BlendModes.ADD).setTint(0x9ab0ff).setAlpha(0.18).setDisplaySize(70, 70)
      : null;
  }

  follow(x, y) { this.lantern?.setPosition(x, y - 6); }
}
