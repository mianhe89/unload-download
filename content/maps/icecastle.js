// 얼음성 (36×30칸, 전체 지도 surface:5,4). 성째로 얼어붙은 성. 그 안에서는 아무것도 늙지도, 사라지지도 않는다.
// 노엘이 얼음 심장(대청 가운데)을 지킨다. 남쪽 성문이 서리 마을 쪽(surface:6,4)으로 이어진다.
// 성문(gate 구역)으로 걸어 나가면 노엘의 제안을 거절한 것이고, 얼음 심장(heart 구역)에 다가가면 받아들인 것이다(선택창 없이 행동으로).
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'icecastle', name: '얼음성', W: 36, H: 30, theme: 'snow', objectTint: 0xb8d8f0,
  dirt: [[16, 6, 4, 24], [9, 6, 18, 8]],
  objects: [
    O('house_tall', 11, 1, { name: '서쪽 탑' }), O('house_tall', 16, 0, { name: '얼음 대청', residents: ['noel'] }), O('house_tall', 21, 1, { name: '동쪽 탑' }),
    O('runestone', 14, 9), O('runestone2', 21, 9),            // 얼음 심장 양옆의 기둥
    O('tree_snow', 6, 6), O('tree_snow', 28, 6), O('tree_snow_round', 7, 18), O('tree_snow_round', 27, 18),
    O('rocks_grey', 4, 12), O('rocks_grey', 28, 12), O('pines_snow', 10, 22), O('pines_snow', 24, 22),
  ],
  ring: { types: ['tree_grove_snow', 'pines_snow', 'pines_snow2'], gaps: { s: [16, 19] } },
  exits: [{ dir: 's', from: 16, to2: 20, to: 'surface:6,4', at: [6, 4] }],
  entry: { s: [18, 25] },
  spots: { heart: { x: 18, y: 9 }, hall: { x: 18, y: 12 }, gate: { x: 18, y: 23 } },
  zones: { heart: { x: 16, y: 8, w: 4, h: 2 }, gate: { x: 15, y: 22, w: 6, h: 2 } },
});
