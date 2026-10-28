// 맵 문자 배열 → 한 장의 캔버스 텍스처. 가장자리로 갈수록 안개가 짙어진다.
import { TILE, TILE_KINDS } from '../../content/art/tiles.js';

export class MapRenderer {
  constructor(scene, map) {
    this.scene = scene;
    this.map = map;
    this.cols = map.rows[0].length;
    this.rows = map.rows.length;
    this.width = this.cols * TILE;
    this.height = this.rows * TILE;
  }

  kindAt(tx, ty) {
    const ch = this.map.rows[ty]?.[tx];
    return ch ? TILE_KINDS[ch] : TILE_KINDS.x;
  }

  isSolidTile(tx, ty) { return Boolean(this.kindAt(tx, ty).solid); }

  isSolidPx(px, py) { return this.isSolidTile(Math.floor(px / TILE), Math.floor(py / TILE)); }

  render(key = 'map.ground') {
    if (this.scene.textures.exists(key)) this.scene.textures.remove(key);
    const tex = this.scene.textures.createCanvas(key, this.width, this.height);
    const ctx = tex.getContext();
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < this.rows; y += 1) {
      for (let x = 0; x < this.cols; x += 1) {
        const k = this.kindAt(x, y);
        let base = k.floor ?? (k.name === 'fog' ? 'grass' : k.name); // 안개 칸 밑에는 풀
        // 창문은 지붕 바로 아래 줄에만, 세 칸에 하나
        if (base === 'wall') base = this.kindAt(x, y - 1).name === 'roof' && x % 3 === 1 ? 'wall' : 'wallPlain';
        const v = (x * 7 + y * 13) % 4;
        ctx.drawImage(this.scene.textures.get(`tile.${base}.${v}`).getSourceImage(), x * TILE, y * TILE);
        const fog = this.fogAmount(x, y);
        if (fog > 0) {
          ctx.fillStyle = `rgba(200,204,214,${fog})`;
          ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
        }
      }
    }
    tex.refresh();
    return key;
  }

  // 맵 가장자리까지의 거리로 안개 농도. 플레이어가 닿는 곳은 0.
  fogAmount(x, y) {
    const d = Math.min(x, y, this.cols - 1 - x, this.rows - 1 - y);
    const edge = this.map.FOG ?? 3;
    if (d >= edge + 1) return 0;
    if (d === edge) return 0.18;
    return Math.min(0.95, 0.45 + (edge - 1 - d) * 0.25);
  }
}
