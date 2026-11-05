// 전투 효과 (전투 장면 부품): 베기 궤적, 타격 불꽃, 피해 숫자, 쓰러질 때 흩어지는 조각, 나타날 때 흙먼지, 발밑 먼지, 돌진 잔상.
// 그림은 싸움터 그릇(container, 싸움터 좌표) 안에, 글자는 화면 좌표(배율과 무관하게 선명하게)로 띄운다.
import Phaser from 'phaser';
import { FONT } from '../../config/game.js';

// 땅마다 발밑 먼지 색
const DUST = { snow: 0xf4f8ff, frost: 0xe8eef8, blackSnow: 0xc8ccd8, desert: 0xe8d8a8, coast: 0xe8d8b0, volcano: 0x6a4a3a, lava: 0x8a4a2a, galaxy: 0xb8a0ff, shadow: 0x8a7aa8 };

export class BattleFx {
  // toScreen(x, y): 싸움터 좌표 → 화면 좌표
  constructor(scene, container, { biome, toScreen, s }) {
    this.scene = scene;
    this.c = container;
    this.toScreen = toScreen;
    this.s = s;
    this.dust = DUST[biome] ?? 0xd8c8a0;
    this.stepAt = 0;
  }

  add(o) { this.c.add(o); return o; }
  fade(o, ms, extra = {}) { this.scene.tweens.add({ targets: o, alpha: 0, duration: ms, ...extra, onComplete: () => o.destroy() }); }

  // ── 내 공격 ──
  // 베기(부채꼴): 옅은 면 + 밝은 칼끝 호 + 안쪽 잔호 둘. 찌르기(직선): 빛줄기. 돌진: 잔상과 먼지
  slash(e, { blade = 0xffffff, player } = {}) {
    const sc = this.scene;
    const g = this.add(sc.add.graphics());
    if (e.shape === 'arc') {
      const half = (e.arc * Math.PI) / 360, a0 = e.face - half, a1 = e.face + half;
      const accent = e.key === 'w' ? 0xff9a7a : e.key === 'atk' ? 0xffffff : 0xffd75e;
      g.fillStyle(accent, 0.18).slice(e.x, e.y, e.range, a0, a1).fillPath();
      g.fillStyle(accent, 0.22).slice(e.x, e.y, e.range, a0 + (a1 - a0) * 0.35, a1).fillPath();
      g.lineStyle(3, blade, 0.95).beginPath().arc(e.x, e.y, e.range, a0, a1).strokePath();
      g.lineStyle(1, 0xffffff, 0.6).beginPath().arc(e.x, e.y, e.range * 0.78, a0 + 0.1, a1 - 0.05).strokePath();
      g.lineStyle(1, 0xffffff, 0.35).beginPath().arc(e.x, e.y, e.range * 0.58, a0 + 0.2, a1 - 0.1).strokePath();
      this.fade(g, 170, { scaleX: 1.04, scaleY: 1.04 });
    } else if (e.shape === 'line') {
      const c = Math.cos(e.face), sn = Math.sin(e.face);
      g.lineStyle(e.width * 0.9, 0xffd75e, 0.25).lineBetween(e.x, e.y, e.x + c * e.range, e.y + sn * e.range);
      g.lineStyle(e.width * 0.4, 0xffffff, 0.95).lineBetween(e.x, e.y, e.x + c * e.range, e.y + sn * e.range);
      g.fillStyle(0xffffff, 1).fillCircle(e.x + c * e.range, e.y + sn * e.range, 2.5);
      this.fade(g, 160);
    } else if (e.shape === 'guard') {
      g.lineStyle(2, 0x9ad0ff, 0.9).strokeCircle(e.x, e.y - 2, 12);
      this.fade(g, 240, { scaleX: 1.3, scaleY: 1.3 });
    } else if (e.shape === 'dash' && player) {
      for (let i = 0; i < 5; i += 1) sc.time.delayedCall(i * 35, () => {
        if (!player.active) return;
        const ghost = this.add(sc.add.sprite(player.x, player.y, player.texture.key, player.frame.name).setOrigin(0.5, 0.75).setAlpha(0.5).setTint(0x9ad0ff));
        this.fade(ghost, 260);
      });
      this.puff(e.x, e.y + 4, 6, 1.4);
      g.destroy();
    } else g.destroy();
  }

  // 맞힌 자리의 불꽃: 바깥으로 튀는 짧은 선 몇 개 + 하얀 점
  spark(x, y, from, big = false) {
    const sc = this.scene;
    const g = this.add(sc.add.graphics());
    const n = big ? 7 : 5, len = big ? 9 : 6;
    for (let i = 0; i < n; i += 1) {
      const a = from + Math.PI + (Math.random() - 0.5) * 2.2;
      const l = len * (0.5 + Math.random() * 0.7);
      g.lineStyle(1, i % 2 ? 0xffe8a0 : 0xffffff, 1).lineBetween(x + Math.cos(a) * 2, y + Math.sin(a) * 2, x + Math.cos(a) * l, y + Math.sin(a) * l);
    }
    g.fillStyle(0xffffff, 1).fillCircle(x, y, big ? 3 : 2);
    this.fade(g, 160, { scaleX: 1.3, scaleY: 1.3 });
    if (big) {
      const ring = this.add(sc.add.circle(x, y, 4).setStrokeStyle(1.5, 0xffe8a0, 1));
      sc.tweens.add({ targets: ring, radius: 14, alpha: 0, duration: 220, onComplete: () => ring.destroy() });
    }
  }

  // 맞으면 그 그림이 하얗게 번쩍 (tint는 원래 색)
  flash(spr, tint) {
    if (!spr?.setTint) return;
    spr.setTint(0xffffff).setTintMode?.(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => {
      if (!spr.active) return;
      spr.clearTint?.(); spr.setTintMode?.(Phaser.TintModes.MULTIPLY);
      if (tint) spr.setTint(tint);
    });
  }

  // 맞으면 살짝 눌렸다 돌아온다
  squash(spr) {
    if (!spr?.active) return;
    const sx = spr.scaleX, sy = spr.scaleY;
    this.scene.tweens.add({ targets: spr, scaleX: sx * 1.18, scaleY: sy * 0.82, duration: 50, yoyo: true, onComplete: () => spr.active && spr.setScale(sx, sy) });
  }

  // ── 쓰러짐·나타남 ──
  // 쓰러지면: 하얗게 부푼 실루엣이 흩어지고, 그 색의 조각이 튀고, 땅에 먼지
  burst(x, y, color = 0xffffff, size = 1) {
    const sc = this.scene;
    const n = Math.round(8 * size);
    for (let i = 0; i < n; i += 1) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.4;
      const d = (10 + Math.random() * 10) * size;
      const bit = this.add(sc.add.rectangle(x, y - 4, 2, 2, i % 3 ? color : 0xffffff, 1));
      sc.tweens.add({ targets: bit, x: x + Math.cos(a) * d, y: y - 4 + Math.sin(a) * d * 0.7 - 4, alpha: 0, angle: 180, duration: 420 + Math.random() * 200, ease: 'Cubic.out', onComplete: () => bit.destroy() });
    }
    const ring = this.add(sc.add.ellipse(x, y + 2, 6 * size, 3 * size, 0xffffff, 0).setStrokeStyle(1.5, 0xffffff, 0.8));
    sc.tweens.add({ targets: ring, scaleX: 3.2, scaleY: 3.2, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
    this.puff(x, y + 2, Math.round(5 * size), size);
  }

  vanish(spr, shadow) {
    if (!spr?.active) return;
    this.flash(spr);
    this.scene.tweens.add({ targets: spr, scaleX: spr.scaleX * 1.25, scaleY: spr.scaleY * 0.6, alpha: 0, duration: 240, ease: 'Cubic.in', onComplete: () => spr.destroy() });
    if (shadow) this.scene.tweens.add({ targets: shadow, alpha: 0, duration: 240, onComplete: () => shadow.destroy() });
  }

  // 나타날 때: 흙먼지가 일고 그림이 아래에서 솟는다
  appear(spr, x, y) {
    this.puff(x, y + 3, 6, 1.2);
    if (!spr) return;
    const ty = spr.y;
    spr.setAlpha(0).setY(ty + 4);
    this.scene.tweens.add({ targets: spr, alpha: 1, y: ty, duration: 320, ease: 'Back.out' });
  }

  // 흙먼지 덩이
  puff(x, y, n = 3, size = 1) {
    const sc = this.scene;
    for (let i = 0; i < n; i += 1) {
      const p = this.add(sc.add.circle(x + (Math.random() - 0.5) * 6 * size, y, (1.5 + Math.random() * 1.5) * size, this.dust, 0.55));
      sc.tweens.add({ targets: p, x: p.x + (Math.random() - 0.5) * 10 * size, y: y - 2 - Math.random() * 5 * size, scale: 1.8, alpha: 0, duration: 380 + Math.random() * 200, onComplete: () => p.destroy() });
    }
  }

  // 걸을 때 발밑 먼지 (조금씩)
  step(x, y, dt) {
    this.stepAt -= dt;
    if (this.stepAt > 0) return;
    this.stepAt = 0.16;
    this.puff(x, y + 4, 1, 0.8);
  }

  // 회복: 초록 빛 알갱이가 위로
  heal(x, y) {
    const sc = this.scene;
    for (let i = 0; i < 6; i += 1) {
      const p = this.add(sc.add.circle(x + (Math.random() - 0.5) * 12, y + Math.random() * 4, 1, 0x9affb0, 0.9));
      sc.tweens.add({ targets: p, y: p.y - 14 - Math.random() * 8, alpha: 0, delay: i * 40, duration: 600, onComplete: () => p.destroy() });
    }
  }

  // ── 글자 ──
  // 피해 숫자: 굵은 외곽선. 큰 타격은 노랗고 크게, 내가 맞으면 붉게
  num(x, y, n, { color = '#ffffff', big = false, mine = false } = {}) {
    const p = this.toScreen(x + (Math.random() - 0.5) * 6, y);
    const size = (big ? 17 : mine ? 14 : 12) * this.s;
    const t = this.scene.add.text(p.x, p.y, String(n), { fontFamily: FONT, fontStyle: 'bold', fontSize: `${size}px`, color })
      .setOrigin(0.5).setStroke('#1a1018', 4 * this.s).setDepth(40).setScale(big ? 1.6 : 0.6);
    this.scene.tweens.add({ targets: t, scale: 1, duration: big ? 160 : 120, ease: 'Back.out' });
    this.scene.tweens.add({ targets: t, y: t.y - (big ? 30 : 22) * this.s, x: t.x + (Math.random() - 0.5) * 10 * this.s, alpha: 0, delay: big ? 450 : 320, duration: 500, ease: 'Cubic.in', onComplete: () => t.destroy() });
  }

  text(x, y, str, color, k = 1) {
    const p = this.toScreen(x, y);
    const t = this.scene.add.text(p.x, p.y, str, { fontFamily: FONT, fontStyle: 'bold', fontSize: `${12 * this.s * k}px`, color })
      .setOrigin(0.5).setStroke('#1a1018', 3.5 * this.s).setDepth(40).setScale(0.6);
    this.scene.tweens.add({ targets: t, scale: 1, duration: 120, ease: 'Back.out' });
    this.scene.tweens.add({ targets: t, y: t.y - 24 * this.s, alpha: 0, delay: 380, duration: 500, onComplete: () => t.destroy() });
  }
}
