// 아스테라 (40×34칸, 전체 지도 surface:1,8). 엘프 마을 너머 깊은 숲 속의 마법 도시. 마법사의 탑들과 마력 수정, 큰 서고.
// 남쪽 길이 숲길(surface:1,9)로 이어진다. 건물과 나무는 보랏빛을 띤다(objectTint).
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'magic', name: '아스테라', W: 40, H: 34, theme: 'village', objectTint: 0xd8c8f0,
  dirt: [[18, 10, 4, 24], [8, 14, 24, 6], [6, 6, 28, 3]],
  objects: [
    O('mage_tower', 6, 1, { name: '별의 탑', residents: ['har'] }),
    O('mage_tower', 26, 1, { name: '탑의 주인의 탑', residents: ['arka'] }),
    O('house_tall', 16, 0, { name: '아스테라 대서고', residents: ['onel'] }),
    O('mage_tower', 32, 18, { name: '견습 마법사 숙소', residents: ['fio', 'selma'] }),
    O('shop', 4, 20, { name: '물약 가게', residents: ['kira'] }),
    O('house_stone', 10, 25, { name: '수정 공방', residents: ['doran'] }),
    O('house_wood', 25, 25, { name: '멜과 솔의 집', residents: ['mel', 'sol'] }),
    O('crystal', 13, 13), O('crystal', 25, 13), O('crystal', 13, 19), O('crystal', 25, 19),
    O('fountain', 17, 15),
    O('bookshelf_wide', 23, 8), O('bench', 9, 17), O('bench', 28, 17), O('plant_pot', 15, 9), O('plant_pot', 24, 9),
    O('tree_big_pink', 2, 12), O('tree_pink', 34, 8), O('tree_big_pink', 33, 27), O('tree_pink', 4, 28),
  ],
  ring: { types: ['tree_grove_green', 'tree_grove', 'tree_pines'], gaps: { s: [18, 21] } },
  exits: [{ dir: 's', from: 18, to2: 22, to: 'surface:1,9', at: [1, 9] }],
  entry: { s: [20, 29] },
  spots: { plaza: { x: 20, y: 22 }, library: { x: 18, y: 5 }, gate: { x: 20, y: 29 } },
  zones: { library: { x: 16, y: 4, w: 8, h: 3 }, plaza: { x: 15, y: 14, w: 10, h: 7 } },
});
