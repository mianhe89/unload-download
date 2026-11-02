// 공기 중에 떠다니는 것들: 모닥불 불티, 밤의 반딧불, 낮의 떨어지는 잎, 굴뚝 연기.
// 화면이 '살아 있게' 만드는 연출이고, 게임 규칙에는 영향을 주지 않는다.
import Phaser from 'phaser';
import { TILE } from '../../content/maps/village.js';

export class Ambient {
  // bonfire: 'lit'(타오름) | 'embers'(사그라든 연기) | 'out'(꺼진 재)
  constructor(scene, { time, bonfire = 'out', map, erasedCount = 0 }) {
    this.scene = scene;
    const W = map.W * TILE, H = map.H * TILE;
    const night = time === 'night';
    const edge = (map.FOG + 1) * TILE;

    // 모닥불: 장작(항상) + 상태에 따라 불꽃·불티·연기
    const b = map.bonfire;
    if (b) {
      const cx = (b.x + b.w / 2) * TILE, cy = (b.y + b.h / 2) * TILE + 4;
      scene.add.ellipse(cx, cy + 3, 26, 9, bonfire === 'lit' ? 0x2a1a10 : 0x3a3a3a, 0.5).setDepth(cy - 8);
      const log = bonfire === 'out' ? 0x3a302a : 0x5a3e2a;
      for (let i = 0; i < 5; i += 1) scene.add.rectangle(cx - 9 + i * 4.5, cy + 2 - (i % 2) * 2, 11, 3, log).setAngle(i % 2 ? 25 : -25).setDepth(cy - 6);
    }
    if (b && bonfire === 'embers') {
      const cx = (b.x + b.w / 2) * TILE, cy = (b.y + b.h / 2) * TILE + 4;
      scene.add.particles(cx, cy - 4, 'fx.glow', {
        lifespan: 3200, speedY: { min: -10, max: -5 }, speedX: { min: -2, max: 5 }, scale: { start: 0.04, end: 0.2 },
        alpha: { start: 0.22, end: 0 }, tint: 0x8a8a92, frequency: 420,
      }).setDepth(cy + 2);
      scene.add.particles(cx, cy, 'fx.dot', {
        lifespan: 700, speedY: { min: -8, max: -3 }, scale: { start: 0.4, end: 0 }, tint: 0xff8a3a, alpha: { start: 0.8, end: 0 }, frequency: 600, x: { min: -6, max: 6 },
      }).setDepth(cy + 1);
    }
    if (b && bonfire === 'lit') {
      const cx = (b.x + b.w / 2) * TILE, cy = (b.y + b.h / 2) * TILE + 4;
      scene.add.particles(cx, cy, 'fx.fire', {
        frame: [0, 1, 2, 3, 4, 5, 6, 7], lifespan: { min: 380, max: 640 }, speedY: { min: -26, max: -14 }, speedX: { min: -5, max: 5 },
        scale: { start: 1.15, end: 0.3 }, alpha: { start: 1, end: 0 }, frequency: 45, quantity: 1, x: { min: -6, max: 6 },
        blendMode: Phaser.BlendModes.ADD,
      }).setDepth(cy + 1);
      scene.add.particles(cx, cy - 6, 'fx.dot', {
        lifespan: { min: 900, max: 1600 }, speedY: { min: -36, max: -18 }, speedX: { min: -10, max: 10 }, scale: { start: 0.5, end: 0 },
        tint: [0xffd860, 0xff9a3a], alpha: { start: 1, end: 0 }, frequency: 140, blendMode: Phaser.BlendModes.ADD,
      }).setDepth(9004);
      scene.add.particles(cx, cy - 14, 'fx.glow', {
        lifespan: 2600, speedY: { min: -12, max: -6 }, speedX: { min: -3, max: 6 }, scale: { start: 0.05, end: 0.22 },
        alpha: { start: 0.18, end: 0 }, tint: 0x6a6a72, frequency: 260,
      }).setDepth(cy + 2);
    }

    const zone = new Phaser.Geom.Rectangle(edge, edge, W - edge * 2, H - edge * 2);

    if (night) {
      // 반딧불: 천천히 깜빡이며 떠다닌다. 세계가 바랠수록 줄어든다
      scene.add.particles(0, 0, 'fx.dot', {
        emitZone: { type: 'random', source: zone }, lifespan: { min: 3000, max: 6000 }, speed: { min: 3, max: 10 },
        scale: { start: 0.5, end: 0.2 }, alpha: { values: [0, 0.9, 0.2, 0.9, 0] }, tint: 0xd8ff8a,
        frequency: 220 + erasedCount * 200, blendMode: Phaser.BlendModes.ADD,
      }).setDepth(9004);
    } else {
      // 떨어지는 잎
      scene.add.particles(0, 0, 'fx.leaf', {
        frame: [0, 1, 2, 3, 4, 5], emitZone: { type: 'random', source: new Phaser.Geom.Rectangle(edge, edge, W - edge * 2, 10) },
        lifespan: 9000, speedY: { min: 10, max: 18 }, speedX: { min: -8, max: 14 }, rotate: { min: 0, max: 360 },
        alpha: { start: 0.9, end: 0 }, frequency: 900,
      }).setDepth(9004);
    }
  }
}
