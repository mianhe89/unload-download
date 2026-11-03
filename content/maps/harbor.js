// 항구 (40×28칸, 전체 지도 surface:8,15). 모래 바닥, 생선 냄새, 그물 너는 소리.
// 북쪽 길은 우리 마을 쪽(surface:8,14), 동쪽은 난파선 쪽(surface:9,15), 남쪽 끝은 배가 매인 선착장(길 맵 surface:8,15)으로 이어진다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'harbor', name: '항구', W: 40, H: 28, theme: 'sand',
  dirt: [[18, 0, 4, 28], [8, 10, 26, 6], [26, 12, 14, 4], [6, 18, 12, 3]],
  objects: [
    O('shop', 9, 5, { name: '생선 가게', residents: ['nell'] }),
    O('house_plain', 24, 4, { name: '항구지기 사무소' }),
    O('house_wood', 28, 18, { name: '어부의 집', residents: ['marlo'] }),
    O('house_orange', 5, 21, { name: '선원 여관' }),
    O('boat', 23, 21), O('barrel', 14, 9), O('barrel', 15, 9), O('crate', 16, 16), O('crate', 17, 16), O('crate', 24, 10),
    O('cart', 30, 9), O('sea_rock', 32, 22), O('signpost', 22, 6), O('well', 12, 17),
    O('tree_round', 6, 14), O('tree_round2', 34, 4), O('bush', 26, 23),
  ],
  ring: { types: ['tree_grove', 'tree_pines', 'tree_grove2', 'rocks_brown'], gaps: { n: [18, 21], s: [18, 21], e: [12, 15] } },
  exits: [
    { dir: 'n', from: 18, to2: 22, to: 'surface:8,14', at: [8, 14] },
    { dir: 'e', from: 12, to2: 16, to: 'surface:9,15', at: [9, 15] },
    { dir: 's', from: 18, to2: 22, to: 'surface:8,15', at: [8, 15] }, // 선착장 (배는 길 맵에서 탄다)
  ],
  entry: { n: [20, 4], e: [35, 13], s: [20, 23] },
  spots: { plaza: { x: 20, y: 13 }, fishShop: { x: 11, y: 9 }, pier: { x: 20, y: 22 }, marloDoor: { x: 30, y: 22 } },
  zones: { pier: { x: 18, y: 20, w: 4, h: 4 } },
});
