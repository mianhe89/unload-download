// 드워프 마을 (38×28칸, 전체 지도 surface:11,5). 눈 덮인 산을 파고 사는 마을. 바위 사이로 대장간 연기가 오른다.
// 남쪽(빈 마을 쪽, surface:11,6), 서쪽(서리 마을 쪽, surface:10,5), 동쪽(불의 산 쪽, surface:12,5),
// 북쪽 끝은 갱도 입구(길 맵 surface:11,5의 계단 — 지하로 내려간다)로 이어진다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'dwarf', name: '드워프 마을', W: 38, H: 28, theme: 'snow',
  dirt: [[17, 0, 4, 28], [6, 12, 26, 5], [0, 13, 6, 3], [32, 13, 6, 3], [24, 6, 8, 3]],
  objects: [
    O('house_stone', 8, 6, { name: '대장간 「쇠망치와 맹세」', residents: ['brok', 'korrim'] }), O('forge', 12, 5),
    O('house_stone', 26, 2, { name: '광부 숙소', residents: ['helga', 'gurni', 'baldra'] }),
    O('house_tall', 26, 18, { name: '맹세의 전당', residents: ['hjalma'] }),
    O('forge', 30, 9), O('rocks_grey', 4, 18), O('rocks_brown', 10, 20), O('rocks_grey', 31, 22),
    O('crate', 14, 11), O('barrel', 15, 11), O('barrel', 22, 17), O('cart', 22, 10), O('signpost', 21, 4),
    O('pines_snow', 33, 4), O('tree_snow', 6, 2),
  ],
  ring: { types: ['rocks_grey', 'pines_snow', 'rocks_brown', 'tree_grove_snow'], gaps: { n: [17, 20], s: [17, 20], w: [12, 15], e: [12, 15] } },
  exits: [
    { dir: 's', from: 17, to2: 21, to: 'surface:11,6', at: [11, 6] },
    { dir: 'w', from: 13, to2: 16, to: 'surface:10,5', at: [10, 5] },
    { dir: 'e', from: 13, to2: 16, to: 'surface:12,5', at: [12, 5] },
    { dir: 'n', from: 17, to2: 21, to: 'surface:11,5', at: [11, 5] }, // 갱도 입구 (계단은 길 맵에서)
  ],
  entry: { s: [19, 23], w: [4, 14], e: [33, 14], n: [19, 4] },
  spots: { plaza: { x: 19, y: 14 }, forgeDoor: { x: 10, y: 10 }, hall: { x: 28, y: 23 }, mineRoad: { x: 19, y: 6 } },
  zones: { forge: { x: 8, y: 9, w: 6, h: 3 }, plaza: { x: 17, y: 12, w: 5, h: 4 } },
});
