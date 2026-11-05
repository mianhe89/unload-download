// 로웬 (44×34칸, 전체 지도 surface:9,13). 우리 마을 남동쪽 들판의 교역 도시. 우리 마을·빈 마을·항구 사이라 장사꾼이 모인다.
// 돌 깔린 큰 광장 가운데 분수, 장터 천막, 상인 조합, 여관. 북쪽 길이 우리 마을 쪽(surface:9,12)으로 이어진다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'trade', name: '로웬', W: 44, H: 34, theme: 'grass',
  dirt: [[20, 0, 4, 34], [8, 12, 28, 12], [4, 16, 36, 4], [10, 26, 24, 3]],
  objects: [
    // 광장: 가운데 분수, 둘레에 장터 천막
    O('fountain', 19, 14),
    O('stall_red', 12, 13), O('stall_yellow', 15, 13), O('stall_red', 28, 13), O('stall_yellow', 31, 13),
    O('stall_yellow', 12, 21), O('stall_red', 31, 21),
    O('lion_fountain', 38, 4),
    // 건물
    O('house_tall', 9, 2, { name: '상인 조합', residents: ['orban'] }),
    O('house_tall', 29, 2, { name: '여관 「은빛 분수」', residents: ['barbara', 'nina'] }),
    O('bakery', 4, 8, { name: '로웬 빵집' }),
    O('house_red', 5, 24, { name: '폴과 이다의 집', residents: ['paul', 'ida', 'miro'] }),
    O('house_stone', 33, 24, { name: '경비대 초소', residents: ['karl', 'mateo'] }),
    O('house_orange', 26, 27, { name: '꽃 할머니 댁', residents: ['heda'] }),
    O('shop', 14, 27, { name: '천 가게', residents: ['devon', 'mai'] }),
    O('crate_loaves', 7, 12), O('basket_apples', 11, 17), O('basket_greens', 30, 17), O('flour_sack', 6, 12),
    O('barrel', 27, 9), O('barrel', 28, 9), O('cart', 36, 17), O('crate', 16, 9), O('crate', 17, 9), O('bench', 24, 22), O('bench', 15, 22),
    O('well', 36, 10), O('plant_pot', 18, 11), O('plant_pot', 25, 11),
    O('tree_round', 4, 18), O('tree_round2', 38, 20), O('tree_big', 34, 11),
  ],
  ring: { types: ['tree_grove', 'tree_grove2', 'tree_pines'], gaps: { n: [20, 23] } },
  exits: [{ dir: 'n', from: 20, to2: 24, to: 'surface:9,12', at: [9, 12] }],
  entry: { n: [21, 4] },
  spots: { fountain: { x: 21, y: 19 }, market: { x: 14, y: 17 }, inn: { x: 31, y: 6 }, guild: { x: 11, y: 6 } },
  zones: { fountain: { x: 18, y: 13, w: 8, h: 8 } },
});
