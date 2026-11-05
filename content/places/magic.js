// 아스테라에 들르기 (1~4장). 엘프 마을 너머 깊은 숲 속의 마법 도시. 숲을 베지 않은 사람에게만 길이 열린다(src/world/visits.js의 문턱).
// 마법사들은 루를 안다. 그러나 왜 탑을 나갔는지는 말하지 않는다(루의 저주 — 말하면 번진다).
import { N, T, keep, WALK } from '../chapters/dsl.js';

const at = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode: mode ?? 'idle', radius, face: 'down' }]));

export const phases = {
  magic: {
    map: 'magic', visit: true, keepTime: true, place: '아스테라', time: 'day', clock: true,
    player: { at: [20, 29], face: 'up' },
    npcs: at({
      arka: [28, 10], fio: [30, 21, 'wander', 1], selma: [29, 22], onel: [19, 8], kira: [7, 24], doran: [12, 29],
      har: [9, 10], mel: [27, 29], sol: [29, 28, 'wander', 1], bane: [22, 27],
    }),
    onEnter: 'magic.arrive',
    events: [
      { id: 'magic.lu', when: { unlessErased: 'lu' }, trigger: { near: 'arka', r: 3 }, run: 'magic.lu' },
      { id: 'magic.chronicle', trigger: { zone: 'library' }, run: 'magic.chronicle' },
    ],
  },
};

export const script = {
  'magic.arrive': [
    WALK,
    N('숲이 갑자기 끝나고, 보랏빛 지붕의 탑들이 나타났다. 광장의 수정 기둥이 낮인데도 은은하게 빛났다.', { unlessFlag: 'visited.magic' }),
    N('아스테라. 마법사들의 도시라고, 이야기로만 듣던 곳이었다.', { unlessFlag: 'visited.magic' }),
    { flag: 'visited.magic' },
    { flag: 'visited.surface:1,8' },
  ],
  'magic.lu': [
    T('arka', '자네… 루의 냄새가 나는군. 그 아이 곁에 있었나.'),
    T('me', '루를 아세요?'),
    T('arka', '이 탑에서 자랐지. 가장 재능 있는 아이였어. 무언가를 [y]붙들려다[/y] 탑을 나갔네.'),
    T('me', '뭘 붙들려고요? 얼굴의 반점은—'),
    T('arka', '그건 그 아이에게 묻지 말게. 나에게도. [w=300]말이 그 아이를 해칠 테니.'),
    N('탑의 주인은 그 이상 말하지 않았다. 다음 손님이 기다리고 있었다.'),
    { flag: 'magic.lu' },
  ],
  'magic.chronicle': [
    WALK,
    N('대서고의 서가 하나에 북쪽 왕국의 연대기가 꽂혀 있었다. 펼쳐 보니 왕국이 망한 해의 장이 비어 있었다.'),
    N('찢긴 자국도 없이, 처음부터 빈 종이였다. …셀레나의 명부 같았다.'),
    T('onel', '그 장은 아무도 못 채웠네. 쓰려고 하면 [y]무엇을 써야 할지[/y] 잊어버린다더군.'),
  ],
};
