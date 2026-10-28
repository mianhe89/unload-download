// 작은 픽셀 래스터(RGBA 버퍼). 브라우저/Node 공용이라 Node에서 그대로 미리보기 PNG를 뽑을 수 있다.
export class Raster {
  constructor(w, h) {
    this.w = w; this.h = h;
    this.d = new Uint8ClampedArray(w * h * 4);
  }

  static rgb(hex) { return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)]; }

  px(x, y, c, a = 1) {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const [r, g, b] = typeof c === 'string' ? Raster.rgb(c) : c;
    const i = (y * this.w + x) * 4;
    if (a >= 1) { this.d[i] = r; this.d[i + 1] = g; this.d[i + 2] = b; this.d[i + 3] = 255; return; }
    this.d[i] += (r - this.d[i]) * a; this.d[i + 1] += (g - this.d[i + 1]) * a; this.d[i + 2] += (b - this.d[i + 2]) * a; this.d[i + 3] = 255;
  }

  rect(x, y, w, h, c, a = 1) { for (let j = y | 0; j < y + h; j += 1) for (let i = x | 0; i < x + w; i += 1) this.px(i, j, c, a); }

  disc(cx, cy, r, c, a = 1) { for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) if (x * x + y * y <= r * r) this.px(cx + x, cy + y, c, a); }

  glow(cx, cy, r, c, strength = 0.6) {
    for (let y = -r; y <= r; y += 1) for (let x = -r; x <= r; x += 1) {
      const d = Math.sqrt(x * x + y * y) / r;
      if (d < 1) this.px(cx + x, cy + y, c, (1 - d) * (1 - d) * strength);
    }
  }

  vgrad(y0, y1, top, bottom) {
    const a = Raster.rgb(top), b = Raster.rgb(bottom);
    for (let y = y0; y < y1; y += 1) {
      const t = (y - y0) / Math.max(1, y1 - y0 - 1);
      // 픽셀 느낌을 위해 4단 계단
      const s = Math.floor(t * 6) / 6;
      this.rect(0, y, this.w, 1, [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s, a[2] + (b[2] - a[2]) * s]);
    }
  }

  // 회색으로 바래기 (0~1)
  desaturate(amount) {
    if (amount <= 0) return;
    for (let i = 0; i < this.d.length; i += 4) {
      const g = this.d[i] * 0.3 + this.d[i + 1] * 0.59 + this.d[i + 2] * 0.11;
      this.d[i] += (g - this.d[i]) * amount; this.d[i + 1] += (g - this.d[i + 1]) * amount; this.d[i + 2] += (g - this.d[i + 2]) * amount;
    }
  }
}
