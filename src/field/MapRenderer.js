// 맵 그리기: 바닥(풀 + 흙길 자동 타일 + 풀포기)은 한 장의 캔버스로 굽고,
// 건물·나무·소품은 각각 이미지로 올려 아래쪽 끝 기준으로 앞뒤를 정한다(나무 뒤로 걸어가면 가려짐).
import { TILE } from '../../content/maps/village.js';
import { OBJECTS, DIRT, GRASS, DECOR, ANIMATED, THEMES } from '../../content/art/pack.js';
import { dirtQuarter } from './autotile.js';

const hash = (x, y, s = 0) => {
  let h = (x * 374761393 + y * 668265263 + s * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

// 바닥 테마(눈·모래 등)는 같은 자동 타일 좌표를 옮겨서 쓴다 (pack.js THEMES)
const shift = ([x, y], [dx, dy]) => [x + dx, y + dy];

export class MapRenderer {
  // open: 열린 출구 방향들 ('n' 등). 열린 출구 자리는 안개를 걷고 걸어 나갈 수 있다
  constructor(scene, map, { open = [] } = {}) {
    this.scene = scene;
    this.map = map;
    this.open = open;
    this.theme = THEMES[map.theme ?? 'village'];
    const off = this.theme.offset;
    this.grass = { plain: shift(GRASS.plain, off), variants: GRASS.variants.map((v) => shift(v, off)) };
    this.dirt = {
      center: DIRT.center.map((v) => shift(v, off)),
      ...Object.fromEntries(['outer', 'edge', 'inner'].map((k) => [k, Object.fromEntries(Object.entries(DIRT[k]).map(([n, v]) => [n, shift(v, off)]))])),
    };
    this.cols = map.W;
    this.rows = map.H;
    this.width = map.W * TILE;
    this.height = map.H * TILE;
  }

  isSolidPx(px, py) { return this.map.isSolidPx(px, py, this.open); }

  isDirt(x, y) { return this.map.terrain[y]?.[x] === 'd'; }

  // ── 바닥 ────────────────────────────────────────────
  renderGround(key = 'map.ground') {
    const { scene } = this;
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const tex = scene.textures.createCanvas(key, this.width, this.height);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    const floor = scene.textures.get('sheet.floor').getSourceImage();
    const detail = scene.textures.get('sheet.detail').getSourceImage();
    const hasWater = this.theme.water || this.map.terrain.some((row) => row.includes('w'));
    const water = hasWater ? scene.textures.get('sheet.water').getSourceImage() : null;
    const W_PLAIN = [1, 1], W_SPARK = [11, 1];
    const quad = (src, [sx, sy], qx, qy, dx, dy) => ctx.drawImage(src, sx * TILE + qx * 8, sy * TILE + qy * 8, 8, 8, dx + qx * 8, dy + qy * 8, 8, 8);

    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const dx = x * TILE, dy = y * TILE;
        if (this.map.terrain[y][x] === 'w') {
          const [sx, sy] = hash(x, y) < 0.92 ? W_PLAIN : W_SPARK;
          ctx.drawImage(water, sx * TILE, sy * TILE, TILE, TILE, dx, dy, TILE, TILE);
          continue;
        }
        if (!this.isDirt(x, y) && this.theme.water) {
          // 바다: 물 타일, 가끔 반짝이는 물결
          const w = this.theme.water;
          const [sx, sy] = hash(x, y) < 0.92 ? w.plain : w.variants[Math.floor(hash(x, y, 1) * w.variants.length)];
          ctx.drawImage(water, sx * TILE, sy * TILE, TILE, TILE, dx, dy, TILE, TILE);
          continue;
        }
        if (!this.isDirt(x, y)) {
          // 풀: 대부분 민무늬, 가끔 무늬 있는 타일
          const r = hash(x, y);
          const [sx, sy] = r < 0.82 ? this.grass.plain : this.grass.variants[Math.floor(hash(x, y, 1) * this.grass.variants.length)];
          ctx.drawImage(floor, sx * TILE, sy * TILE, TILE, TILE, dx, dy, TILE, TILE);
          continue;
        }
        // 흙: 8×8 사분면마다 이웃을 보고 조각을 고른다 (autotile.js)
        for (const qy of [0, 1]) {
          for (const qx of [0, 1]) {
            const q = dirtQuarter((i, j) => this.isDirt(i, j), x, y, qx, qy);
            const src = q.kind === 'center' ? this.dirt.center[Math.floor(hash(x, y, 2) * this.dirt.center.length)] : this.dirt[q.kind][q.key];
            quad(floor, src, qx, qy, dx, dy);
          }
        }
      }
    }

    // 풀포기와 들꽃: 풀 칸에만, 길·물체 근처는 피해서 (눈·모래 위엔 없다)
    if (this.theme.decor) for (let y = this.map.FOG; y < this.rows - this.map.FOG; y += 1) {
      for (let x = this.map.FOG; x < this.cols - this.map.FOG; x += 1) {
        if (this.isDirt(x, y) || this.map.isSolidTile(x, y)) continue;
        const r = hash(x, y, 7);
        if (r > 0.16) continue;
        const list = r < 0.03 ? DECOR.flowers : DECOR.tufts;
        const [sx, sy] = list[Math.floor(hash(x, y, 8) * list.length)];
        ctx.drawImage(detail, sx * TILE, sy * TILE, TILE, TILE, x * TILE, y * TILE, TILE, TILE);
      }
    }

    // 테마 색 덮기 (용암·갱도·은하)
    if (this.theme.tint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillStyle = this.theme.tint;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.globalCompositeOperation = 'source-over';
    }

    // 가장자리 안개: 세계가 거기서 끝난다
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const f = this.fogAmount(x, y);
        if (f <= 0) continue;
        ctx.fillStyle = `rgba(214,218,230,${f})`;
        ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
      }
    }
    tex.refresh();
    return key;
  }

  // 열린 출구의 통로 칸인가
  inOpenGap(x, y) {
    const edge = this.map.FOG + 1;
    return (this.map.exits ?? []).some((e) => this.open.includes(e.dir) && (
      (e.dir === 'n' && y < edge && x >= e.from && x < e.to2) || (e.dir === 's' && y >= this.rows - edge && x >= e.from && x < e.to2)
      || (e.dir === 'w' && x < edge && y >= e.from && y < e.to2) || (e.dir === 'e' && x >= this.cols - edge && y >= e.from && y < e.to2)));
  }

  fogAmount(x, y) {
    if (this.inOpenGap(x, y)) return 0;
    const d = Math.min(x, y, this.cols - 1 - x, this.rows - 1 - y);
    const edge = this.map.FOG;
    if (d > edge) return 0;
    if (d === edge) return 0.12;
    return Math.min(0.96, 0.4 + (edge - 1 - d) * 0.28);
  }

  // ── 물체 ────────────────────────────────────────────
  placeObjects() {
    const { scene } = this;
    const list = [];
    for (const o of this.map.objects) {
      const def = OBJECTS[o.type];
      const [, , w, h] = def.rect;
      const x = o.at[0] * TILE, y = o.at[1] * TILE;
      const img = scene.add.image(x, y, textureOf(def), o.type).setOrigin(0, 0).setDepth(y + h);
      // 땅에 닿는 그림자 (막히는 물체만)
      if (def.foot) {
        const [fx, fy, fw, fh] = def.foot;
        scene.add.ellipse(x + fx + fw / 2, y + fy + fh - 2, fw * 0.95, Math.max(5, fh * 0.5), 0x10140c, 0.22).setDepth(-500);
      }
      list.push({ ...o, img, w, h });
    }
    for (const a of this.map.animated ?? []) {
      const def = ANIMATED[a.type];
      scene.add.sprite(a.at[0] * TILE, a.at[1] * TILE, `anim.${a.type}`, 0).setOrigin(0, 0)
        .setDepth(a.at[1] * TILE + def.frame[1]).play(`anim.${a.type}`);
    }
    this.objects = list;
    return list;
  }
}

export const textureOf = (def) => `sheet.${def.sheet}`;
