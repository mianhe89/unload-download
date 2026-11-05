// 물레방아 마을 (38×28칸, 전체 지도 surface:9,8). 시냇가 물레방아 마을. 소집 가는 길의 첫 마을.
// 지친 사람들이 광장에 '빗자루 제단'을 세우고 정리자를 섬긴다. "지워지는 건 구원이다."
// 서쪽은 우리 마을 쪽(surface:8,8), 동쪽은 영주의 성 쪽(surface:10,8).
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'mill', name: '물레방아 마을', W: 38, H: 28, theme: 'grass',
  dirt: [[0, 13, 38, 3], [13, 9, 12, 10], [28, 4, 3, 9]],
  objects: [
    O('house_plain', 26, 1, { name: '방앗간', residents: ['tobin', 'ruprecht'] }),
    O('house_wood', 7, 6, { name: '알마의 집', residents: ['alma'] }),
    O('house_orange', 8, 19, { name: '로테의 집', residents: ['lotte'] }), O('house_red', 26, 18), O('house_stone', 18, 21),
    // 빗자루 제단: 광장 가운데 룬돌 셋, 앞에 짚단
    O('runestone', 17, 10), O('runestone2', 19, 9), O('runestone', 21, 10), O('haystack', 19, 12),
    O('well', 14, 16), O('cart', 23, 15), O('barrel', 31, 12), O('crate', 32, 12), O('bench', 14, 18),
    O('tree_big_autumn', 4, 3), O('tree_round', 33, 20), O('tree_big', 3, 21), O('bush', 24, 10),
  ],
  animated: [{ type: 'mill', at: [26, -1] }],
  ring: { types: ['tree_grove', 'tree_grove2', 'tree_pines'], gaps: { w: [12, 16], e: [12, 16] } },
  exits: [
    { dir: 'w', from: 13, to2: 16, to: 'surface:8,8', at: [8, 8] },
    { dir: 'e', from: 13, to2: 16, to: 'surface:10,8', at: [10, 8] },
  ],
  entry: { w: [4, 14], e: [33, 14] },
  spots: { altar: { x: 19, y: 13 }, plaza: { x: 19, y: 16 }, millDoor: { x: 28, y: 5 }, almaDoor: { x: 9, y: 10 } },
  zones: { altar: { x: 15, y: 11, w: 9, h: 4 } },
});
