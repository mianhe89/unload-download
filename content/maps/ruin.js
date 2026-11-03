// 빈 마을 (36×26칸, 전체 지도 surface:11,10). 사람이 전부 지워진 마을. 집과 문패만 남았다.
// 마른 땅 위에 빈 집들, 말라 죽은 나무, 멈춘 수레. 서쪽 길이 우리 마을 쪽(surface:10,10)으로 이어진다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'ruin', name: '빈 마을', W: 36, H: 26, theme: 'earth',
  dirt: [[3, 11, 15, 3], [10, 7, 14, 12], [16, 4, 3, 4], [23, 9, 7, 2], [23, 15, 7, 2]],
  objects: [
    O('house_plain', 9, 3, { name: '빈 집' }), O('house_wood', 20, 2, { name: '빈 집' }),
    O('house_orange', 26, 5, { name: '빈 집' }), O('house_stone', 26, 16, { name: '빈 집' }),
    O('house_red', 11, 18, { name: '빈 집' }), O('house_tall', 18, 18, { name: '마을 회관' }),
    // 이름 벽: 회관 앞 바위. 이름이 빽빽하다
    O('rocks_grey', 14, 13),
    O('well', 21, 11), O('cart', 12, 8), O('barrel', 24, 8), O('crate', 22, 14),
    O('tree_dead', 6, 6), O('tree_dead', 30, 12), O('tree_dead', 7, 17), O('stump', 25, 12), O('stump', 17, 9),
    O('signpost', 5, 10),
  ],
  ring: { types: ['dead_grove', 'rocks_brown', 'dead_grove', 'tree_pines'], gaps: { w: [10, 14] } },
  exits: [{ dir: 'w', from: 11, to2: 14, to: 'surface:10,10', at: [10, 10] }],
  entry: { w: [4, 12] },
  spots: { square: { x: 18, y: 12 }, nameWall: { x: 16, y: 15 }, well: { x: 21, y: 13 } },
  zones: { wall: { x: 13, y: 14, w: 6, h: 3 } },
});
