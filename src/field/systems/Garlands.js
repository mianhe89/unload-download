// 줄등: 축제 날 광장에 걸리는 등불 줄(미아가 걸었다). 기둥 사이에 처진 줄, 줄마다 색 등이 매달려 있고 밤엔 불이 들어온다.
// 맵의 garlands: [[x1, y1, x2, y2], …] (칸). 페이즈의 festive가 켜진 날, 그리고 garlandsWhen 조건(대본 조건)이 맞을 때만.
import { TILE } from '../../../content/maps/village.js';

const COLORS = [0xf2c21e, 0xe86a4a, 0xf4ead6, 0x6ab0e0, 0xe86aa0];

export class Garlands {
  constructor(field) {
    this.field = field;
    this.lamps = [];
    const lines = field.mapDef.garlands ?? [];
    const when = field.phase.garlandsWhen;
    if (!field.phase.festive || !lines.length || (when && !field.world().passes(when))) return;
    const g = field.add.graphics().setDepth(2000);
    let k = 0;
    for (const [x1, y1, x2, y2] of lines) {
      const ax = x1 * TILE + 8, ay = y1 * TILE - 10, bx = x2 * TILE + 8, by = y2 * TILE - 10;
      const len = Math.hypot(bx - ax, by - ay), sag = Math.min(14, len * 0.12);
      const pt = (t) => ({ x: ax + (bx - ax) * t, y: ay + (by - ay) * t + Math.sin(Math.PI * t) * sag });
      // 줄
      g.lineStyle(1, 0x3a2a20, 0.9).beginPath();
      for (let i = 0; i <= 24; i += 1) { const p = pt(i / 24); if (i) g.lineTo(p.x, p.y); else g.moveTo(p.x, p.y); }
      g.strokePath();
      // 기둥 끝
      for (const [x, y] of [[ax, ay], [bx, by]]) g.fillStyle(0x5a3a24, 1).fillRect(x - 1, y - 1, 3, 3);
      // 등
      const n = Math.max(3, Math.floor(len / 14));
      for (let i = 1; i < n; i += 1) {
        const p = pt(i / n), c = COLORS[k++ % COLORS.length];
        g.fillStyle(0x141b1b, 1).fillRect(Math.round(p.x) - 2, Math.round(p.y), 4, 5);
        g.fillStyle(c, 1).fillRect(Math.round(p.x) - 1, Math.round(p.y) + 1, 2, 3);
        this.lamps.push({ x: p.x, y: p.y + 2, c });
      }
    }
  }
}
