// 엘프 마을 (40×30칸, 전체 지도 surface:2,12). 깊은 숲 속, 큰 나무 사이에 지은 집들. 흙길 대신 풀이 눌린 오솔길.
// 동쪽은 우리 마을 쪽(surface:3,12), 북쪽은 서리 마을로 가는 얼어붙은 옛길(surface:2,11), 서쪽 끝은 세계수(surface:1,12).
// 깊은 숲을 지나치게 베면 이 마을은 보이지 않는다(src/world/visits.js) — 그 칸은 그루터기 숲(길 맵)이 된다.
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'elf', name: '엘프 마을', W: 40, H: 30, theme: 'village',
  dirt: [[14, 13, 26, 3], [18, 3, 3, 10], [0, 14, 14, 2], [16, 16, 8, 6]],
  objects: [
    O('house_wood', 9, 7, { name: '파수꾼의 집', residents: ['elf'] }),
    O('house_red', 25, 6, { name: '장로의 집', residents: ['sylwen'] }),
    O('house_wood', 26, 19, { name: '활 만드는 집' }),
    O('runestone', 17, 18), O('runestone2', 22, 18), O('well', 19, 20),
    O('tree_big', 4, 3), O('tree_big', 32, 2), O('tree_big_pink', 13, 21), O('tree_big', 33, 22), O('tree_big', 6, 19),
    O('tree_round2', 23, 10), O('tree_round', 14, 9), O('bush', 30, 15), O('bush2', 11, 12), O('sunflower', 20, 23), O('flower_red', 18, 23),
  ],
  ring: { types: ['tree_grove', 'tree_pines', 'tree_grove2', 'tree_grove'], gaps: { n: [18, 21], e: [13, 16], w: [13, 16] } },
  exits: [
    { dir: 'e', from: 13, to2: 17, to: 'surface:3,12', at: [3, 12] },
    { dir: 'n', from: 18, to2: 22, to: 'surface:2,11', at: [2, 11] },
    { dir: 'w', from: 13, to2: 17, to: 'surface:1,12', at: [1, 12] }, // 세계수
  ],
  entry: { e: [35, 14], n: [19, 4], w: [4, 14] },
  spots: { glade: { x: 20, y: 19 }, elderDoor: { x: 27, y: 10 }, watchDoor: { x: 11, y: 11 }, westPath: { x: 6, y: 14 } },
  zones: { glade: { x: 16, y: 17, w: 8, h: 5 } },
});
