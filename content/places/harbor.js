// 항구에 들르기 (1~3장). 남쪽 끝 선착장으로 나가면 길 맵의 배를 탈 수 있다(바다 유적은 썰물 때만).
import { N, T, keep, WALK } from '../chapters/dsl.js';

export const phases = {
  harbor: {
    map: 'harbor', visit: true, keepTime: true, place: '항구', time: 'day', clock: true,
    player: { at: [20, 4], face: 'down' },
    props: [{ prop: 'signpost', at: [21, 19], text: '팻말: "배는 선착장 끝. 썰물 때만 유적에 닿는다. ─ 항구지기"' }],
    onEnter: 'harbor.arrive',
    events: [
      { id: 'harbor.marlo', when: { unlessErased: 'marlo' }, trigger: { near: 'marlo', r: 3 }, run: 'harbor.marlo' },
      { id: 'harbor.nell', when: { unlessErased: 'nell' }, trigger: { near: 'nell', r: 3 }, run: 'harbor.nell' },
    ],
  },
};

export const script = {
  'harbor.arrive': [
    WALK,
    N('짠 바람이 불었다. 그물 너는 소리, 갈매기 소리, 생선 장수의 외침.', { unlessFlag: 'visited.harbor' }),
    { flag: 'visited.harbor' },
    { flag: 'visited.surface:8,15' },
  ],
  'harbor.marlo': [
    WALK,
    T('marlo', '육지 사람이로군. 바다 유적 보러 왔나?'),
    T('marlo', '물이 빠지면 지붕이 섬처럼 올라와. 하루 두 번, 잠깐씩. 그때 배를 대야 해.'),
    T('marlo', '거기 사람들이 살았다는데, 누가 살았는지는 아무도 몰라. …바다는 기억할 거야. 사람이 잊어도.'),
    { flag: 'harbor.tide' },
  ],
  'harbor.nell': [
    WALK,
    T('nell', '어서 와요! 오늘 고등어 좋아요!'),
    T('nell', '그거 알아요? 남쪽 깊은 바다에서 밤마다 노래가 들린대요. 인어의 나라가 있다나.'),
    T('nell', '우리 할머니는 그 노래를 들으면 잊었던 이름이 떠오른다고 했어요. …할머니 이름이 뭐였더라.', keep('nell')),
  ],
  'talk.harbor.marlo': [WALK, T('marlo', '물때 보고 다녀. 바다는 기다려 주지 않아.')],
  'talk.harbor.nell': [WALK, T('nell', '생선은 오늘 사야 맛있어요!')],
};
