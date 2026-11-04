// 기록하는 마을 (38×28칸, 전체 지도 surface:14,4). 잊지 않으려고 모두가 매일 서로의 이름을 적는다.
// 광장 가운데 큰 게시판(명부 판)에 날마다 이름을 붙이고, 집집마다 문에 장부가 걸려 있다. 지키려던 기록이 감시가 되어 있다.
// 남쪽은 영주의 성 쪽(surface:14,5), 서쪽은 드워프 마을 쪽(surface:13,4).
import { makeTown, O } from './town.js';

export default makeTown({
  id: 'ledger', name: '기록하는 마을', W: 38, H: 28, theme: 'grass',
  dirt: [[17, 8, 4, 20], [0, 12, 17, 3], [10, 8, 18, 10]],
  objects: [
    O('house_tall', 15, 1, { name: '기록관', residents: ['scribe'] }),
    O('house_plain', 4, 4), O('house_wood', 27, 4), O('house_orange', 4, 19), O('house_red', 27, 19), O('house_stone', 23, 21),
    // 명부 판: 광장 가운데 표지와 룬돌
    O('signpost', 18, 12), O('signpost', 20, 12), O('runestone', 16, 13), O('runestone2', 22, 13),
    O('crate', 12, 10), O('barrel', 13, 10), O('bench', 12, 16), O('well', 25, 14),
    O('tree_round', 8, 9), O('tree_big', 33, 10), O('tree_round2', 31, 16),
  ],
  ring: { types: ['tree_grove', 'tree_pines', 'tree_grove2'], gaps: { s: [17, 20], w: [11, 14] } },
  exits: [
    { dir: 's', from: 17, to2: 21, to: 'surface:14,5', at: [14, 5] },
    { dir: 'w', from: 12, to2: 15, to: 'surface:13,4', at: [13, 4] },
  ],
  entry: { s: [19, 23], w: [4, 13] },
  spots: { board: { x: 19, y: 14 }, scribeDoor: { x: 17, y: 5 }, plaza: { x: 19, y: 16 } },
  zones: { board: { x: 15, y: 13, w: 9, h: 3 } },
});
