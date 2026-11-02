// 조명. 밤에는 맵 전체를 어둠으로 덮고, 불빛 자리만 '지워서' 실제로 밝게 뚫는다.
// 그 위에 따뜻한 색 빛을 더해 불빛 번짐을 만든다. 낮에는 은은한 햇살 색만.
// 지워진 사람이 늘수록 세상이 회색으로 바랜다(붕괴의 최소 연출).
import Phaser from 'phaser';
import { TILE } from '../../content/maps/village.js';

const TONE = {
  night: { dark: 0x070a22, alpha: 0.72 },
  dusk: { dark: 0x2a1030, alpha: 0.32 },
  dawn: { dark: 0x1a1a3a, alpha: 0.25 },
  day: null,
};

export class Lighting {
  constructor(scene, { time, lights = [], erasedCount = 0, spots, width, height }) {
    this.scene = scene;
    this.time = time;
    this.tone = TONE[time] ?? null;
    this.lights = [];
    this.t = 0;

    // 어둠: 캔버스에 매 프레임 어둠을 칠하고 빛 자리를 오려낸다(destination-out)
    // 해상도를 1/2로 낮춰 칠한다(픽셀 게임이라 빛 가장자리는 부드러워도 된다)
    if (this.tone) {
      this.scale = 2;
      if (scene.textures.exists('fx.darkness')) scene.textures.remove('fx.darkness');
      this.canvas = scene.textures.createCanvas('fx.darkness', Math.ceil(width / this.scale), Math.ceil(height / this.scale));
      this.ctx = this.canvas.getContext();
      this.dark = scene.add.image(0, 0, 'fx.darkness').setOrigin(0, 0).setScale(this.scale).setDepth(9000);
      const c = Phaser.Display.Color.IntegerToColor(this.tone.dark);
      this.fillStyle = `rgba(${c.red},${c.green},${c.blue},${this.tone.alpha})`;
    }

    for (const l of lights) {
      const s = spots[l.spot];
      if (!s) continue;
      this.addLight(s.x * TILE + TILE / 2, s.y * TILE + TILE / 2, l.radius, l.color ?? 0xffb060, l.flicker);
    }

    // 플레이어 주변의 작은 빛 (어두운 시간대)
    this.lantern = this.tone ? this.addLight(0, 0, 46, 0x9ab0ff, false, 0.5) : null;

    // 바램
    const fade = Math.min(erasedCount * 0.07, 0.3);
    if (fade > 0) scene.add.rectangle(width / 2, height / 2, width, height, 0x8a8a8a, fade).setDepth(9003).setBlendMode(Phaser.BlendModes.NORMAL);

    // 낮의 햇살
    if (time === 'day') scene.add.rectangle(width / 2, height / 2, width, height, 0xfff2c8, 0.06).setDepth(9002);
  }

  addLight(x, y, radius, color, flicker, strength = 1) {
    const glow = this.scene.add.image(x, y, 'fx.glow').setDepth(9001).setBlendMode(Phaser.BlendModes.ADD)
      .setTint(color).setAlpha(this.tone ? 0.42 * strength : 0.16 * strength).setDisplaySize(radius * 2.2, radius * 2.2);
    const light = { x, y, radius, flicker, glow, strength };
    this.lights.push(light);
    return light;
  }

  follow(x, y) {
    if (!this.lantern) return;
    this.lantern.x = x; this.lantern.y = y - 6;
    this.lantern.glow.setPosition(x, y - 6);
  }

  update(dt) {
    this.t += dt;
    if (!this.ctx) return;
    const { ctx, scale } = this;
    const w = this.canvas.width, h = this.canvas.height;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = this.fillStyle;
    ctx.fillRect(0, 0, w, h);
    ctx.globalCompositeOperation = 'destination-out';
    for (const l of this.lights) {
      const k = l.flicker ? 1 + Math.sin(this.t * 13 + l.x) * 0.04 + Math.sin(this.t * 7.3) * 0.03 : 1;
      const r = (l.radius * k) / scale, x = l.x / scale, y = l.y / scale;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(0,0,0,${0.95 * l.strength})`);
      g.addColorStop(0.55, `rgba(0,0,0,${0.6 * l.strength})`);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      if (l.flicker) l.glow.setDisplaySize(l.radius * 2.2 * k, l.radius * 2.2 * k);
    }
    this.canvas.refresh();
  }
}
