// 조명. 밤에는 맵 전체를 어둠으로 덮고, 불빛 자리만 '지워서' 실제로 밝게 뚫는다.
// 그 위에 따뜻한 색 빛을 더해 불빛 번짐을 만든다. 낮에는 은은한 햇살 색만.
// 지워진 사람이 늘수록 세상이 회색으로 바랜다(붕괴의 최소 연출).
// 시계가 도는 페이즈(clock)에서는 setClock(밤의 깊이 0~1)으로 낮 → 노을 → 밤이 이어진다.
import Phaser from 'phaser';
import { TILE } from '../../content/maps/village.js';

const TONE = {
  night: { dark: 0x070a22, alpha: 0.72 },
  dusk: { dark: 0x2a1030, alpha: 0.32 },
  dawn: { dark: 0x1a1a3a, alpha: 0.25 },
  day: null,
};

export class Lighting {
  constructor(scene, { time, lights = [], erasedCount = 0, spots, width, height, clock = false }) {
    this.scene = scene;
    this.time = time;
    this.clock = clock;
    // 시계가 돌면 어둠 층을 늘 만들어 두고 진하기만 바꾼다
    this.tone = clock ? { ...TONE.night } : TONE[time] ?? null;
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
    if (time === 'day' || clock) this.sun = scene.add.rectangle(width / 2, height / 2, width, height, 0xfff2c8, 0.06).setDepth(9002);
    if (clock) this.setClock(0);
  }

  // 밤의 깊이 n(0 한낮 ~ 1 한밤)에 맞춰 어둠·빛·햇살을 바꾼다. 노을 무렵엔 붉은 보라빛을 섞는다
  setClock(n) {
    if (!this.clock || n === this.night) return;
    this.night = n;
    const dusk = Math.sin(Math.min(1, n * 1.6) * Math.PI) * (n < 0.6 ? 1 : 0);
    const lerp = (a, b, t) => a + (b - a) * t;
    const r = Math.round(lerp(lerp(0x07, 0x2a, dusk), 0x07, n)), g = Math.round(lerp(lerp(0x0a, 0x10, dusk), 0x0a, n)), b = Math.round(lerp(lerp(0x22, 0x30, dusk), 0x22, n));
    const alpha = Math.max(n * TONE.night.alpha, dusk * TONE.dusk.alpha);
    this.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
    this.darkAlpha = alpha;
    for (const l of this.lights) l.glow.setAlpha(lerp(0.16, 0.42, n) * l.strength);
    this.lantern?.glow.setAlpha(0.5 * 0.42 * n);
    this.sun?.setAlpha(0.06 * (1 - n));
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
    if (this.clock && this.darkAlpha < 0.01) { if (this.dark.visible) { this.dark.setVisible(false); } return; }
    if (this.clock && !this.dark.visible) this.dark.setVisible(true);
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
