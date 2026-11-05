// 서리 마을 (40×30칸, 전체 지도 surface:7,6). 겨울이 끝나지 않는 산기슭. 북쪽 회색 고원에 가장 가까워
// 잿빛 엄니 오크가 자주 내려온다. 그래서 마을이 사납다: 북문엔 바리케이드, 망루엔 늘 파수꾼.
// 길이 네 갈래다: 남쪽(우리 마을), 북쪽(검은 성), 동쪽(드워프 마을), 서쪽(엘프 마을로 가는 옛길).
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'frost', name: '서리 마을', W: 40, H: 30, theme: 'snow',
  dirt: [[13, 11, 14, 8], [18, 0, 4, 11], [18, 19, 4, 11], [27, 13, 13, 4], [0, 13, 13, 4], [26, 19, 4, 3]],
  objects: [
    O('house_tall', 12, 4, { name: '망루', residents: ['yuna', 'aske'] }),
    O('house_stone', 6, 9, { name: '여관 「곰의 굴」', residents: ['gord', 'tove'] }),
    O('house_wood', 28, 6, { name: '경비대장의 오두막', residents: ['brenna'] }),
    O('house_plain', 25, 22, { name: '곡식 창고' }),
    O('house_orange', 5, 20, { name: '사냥꾼의 집', residents: ['bjorn', 'ingrid'] }),
    O('forge', 31, 20),
    // 북문 바리케이드: 길 양옆으로 짐과 통을 쌓았다(가운데는 지나갈 수 있다)
    O('crate', 16, 8), O('crate', 17, 8), O('barrel', 16, 9), O('crate', 22, 8), O('crate', 23, 8), O('barrel', 23, 9),
    O('cart', 24, 11), O('haystack', 30, 17), O('well', 20, 14), O('barrel', 13, 18), O('signpost', 22, 20),
    O('tree_snow', 8, 4), O('tree_snow_round', 33, 10), O('tree_snow', 34, 24), O('pines_snow', 10, 24),
  ],
  ring: { types: ['tree_grove_snow', 'pines_snow', 'tree_grove_snow', 'pines_snow2'], gaps: { n: [18, 21], s: [18, 21], e: [13, 16], w: [13, 16] } },
  exits: [
    { dir: 's', from: 18, to2: 22, to: 'surface:7,7', at: [7, 7] },
    { dir: 'n', from: 18, to2: 22, to: 'surface:7,5', at: [7, 5] },
    { dir: 'e', from: 13, to2: 17, to: 'surface:8,6', at: [8, 6] },
    { dir: 'w', from: 13, to2: 17, to: 'surface:6,6', at: [6, 6] },
  ],
  entry: { s: [20, 25], n: [20, 4], e: [35, 15], w: [4, 15] },
  spots: {
    plaza: { x: 20, y: 16 }, gate: { x: 20, y: 9 }, towerFoot: { x: 14, y: 9 }, innDoor: { x: 8, y: 13 },
    lodge: { x: 30, y: 10 }, granary: { x: 27, y: 21 }, forge: { x: 32, y: 23 },
  },
  zones: { gate: { x: 17, y: 6, w: 6, h: 4 }, plaza: { x: 14, y: 12, w: 12, h: 6 } },
});
