// 영주의 성 아랫마을 (42×32칸, 전체 지도 surface:13,7). 우리 영지를 다스리는 영주의 성과 그 아래 마을.
// 성 안 초상화 자리가 비어 있다. 아무도 영주가 누구였는지 기억하지 못한다(docs/스토리.md '영주의 성 아랫마을').
// 남쪽 길이 물레방아 마을 쪽(surface:13,8)으로 이어진다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'lordtown', name: '영주의 성 아랫마을', W: 42, H: 32, theme: 'grass',
  dirt: [[19, 6, 4, 26], [8, 14, 26, 4], [14, 4, 14, 3]],
  objects: [
    // 성: 높은 건물 셋을 나란히 (가운데가 성관, 양옆이 탑)
    O('house_tall', 13, 1, { name: '서쪽 탑' }), O('house_tall', 19, 0, { name: '영주의 성', residents: ['oswin'] }), O('house_tall', 25, 1, { name: '동쪽 탑' }),
    O('house_stone', 6, 9, { name: '병영' }), O('house_plain', 30, 9, { name: '여관' }),
    O('house_orange', 7, 20, { name: '시장 상인의 집', residents: ['mara'] }), O('house_red', 28, 21), O('house_wood', 12, 24),
    O('crate', 16, 13), O('crate', 17, 13), O('barrel', 25, 13), O('cart', 27, 15), O('well', 22, 19), O('bench', 14, 19),
    O('tree_big', 3, 4), O('tree_big', 36, 4), O('tree_round2', 34, 18), O('tree_round', 5, 15),
  ],
  ring: { types: ['tree_grove', 'tree_grove2', 'tree_pines'], gaps: { s: [19, 22] } },
  exits: [{ dir: 's', from: 19, to2: 23, to: 'surface:13,8', at: [13, 8] }],
  entry: { s: [21, 27] },
  spots: { gate: { x: 21, y: 8 }, market: { x: 21, y: 16 }, barracks: { x: 8, y: 13 }, castleDoor: { x: 21, y: 5 } },
  zones: { castle: { x: 18, y: 5, w: 6, h: 3 } },
});
