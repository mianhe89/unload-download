// 타일 한 칸보다 큰 맵 랜드마크(모닥불 등)를 올린다.
import { TILE } from '../../content/art/tiles.js';

export function placeLandmarks(scene, rows) {
  // 'F' 덩어리의 왼쪽 위 칸마다 큰 모닥불 하나
  rows.forEach((row, y) => [...row].forEach((ch, x) => {
    if (ch !== 'F' || rows[y][x - 1] === 'F' || rows[y - 1]?.[x] === 'F') return;
    scene.add.sprite(x * TILE + TILE, y * TILE + TILE, 'fx.bonfire', 0).setDepth(y * TILE + TILE * 1.5).play('fx.bonfire');
  }));
}
