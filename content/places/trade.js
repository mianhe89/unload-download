// 로웬에 들르기 (1~4장). 분수 광장의 교역 도시. 장사꾼과 경비병, 여관, 그리고 북쪽 국경에서 소식이 끊긴 상단 이야기.
// 사건은 작게: 분수에 동전을 던지면 소원(아무 일도 일어나지 않는다), 국경에서 온 피난민의 한마디.
import { N, T, WALK } from '../chapters/dsl.js';

const at = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode: mode ?? 'idle', radius, face: 'down' }]));

export const phases = {
  trade: {
    map: 'trade', visit: true, keepTime: true, place: '로웬', time: 'day', clock: true,
    player: { at: [21, 4], face: 'down' },
    npcs: at({
      orban: [11, 7], rico: [24, 19, 'idle'], mai: [13, 16], devon: [16, 16], barbara: [31, 7], nina: [33, 8, 'wander', 1],
      karl: [21, 10], mateo: [35, 22], paul: [8, 16, 'wander', 2], ida: [9, 28], miro: [17, 21, 'wander', 2], heda: [27, 23],
    }),
    onEnter: 'trade.arrive',
    events: [
      { id: 'trade.coin', trigger: { idle: 4, near: 'rico', r: 4, minTime: 3 }, run: 'trade.coin' },
      { id: 'trade.refugee', when: { ifFlag: 'trade.coin' }, trigger: { near: 'karl', r: 3 }, run: 'trade.refugee' },
    ],
  },
};

export const script = {
  'trade.arrive': [
    WALK,
    N('돌 깔린 길이 넓어지더니, 광장 한가운데서 분수가 물을 뿜고 있었다. 천막마다 사람이 북적였다.', { unlessFlag: 'visited.trade' }),
    N('로웬. 우리 마을에서 이틀 거리의 장터 도시였다. 이렇게 사람이 많은 곳은 처음이었다.', { unlessFlag: 'visited.trade' }),
    { flag: 'visited.trade' },
    { flag: 'visited.surface:9,13' },
  ],
  // 분수 곁에 가만히 서 있으면: 동전 하나
  'trade.coin': [
    WALK,
    N('분수 바닥에 동전이 반짝였다. 나도 하나 던졌다. 무엇을 빌었는지는 말하지 않기로 했다.'),
    T('rico', '[mood=smile]뭘 빌었어? …말하면 안 이뤄진대. 알아.'),
  ],
  'trade.refugee': [
    WALK,
    T('karl', '북쪽에서 온 피난민들이 광장 끝에 모여 있다. 마을이 하룻밤에 비었다더군.'),
    T('karl', '불탄 집도 없고, 싸운 흔적도 없고. 사람만 없다고. 다들 [y]악마[/y] 짓이라 한다.'),
    N('전령이 했던 말과 같았다. 나는 손바닥의 반지를 쥐었다. …비었다는 마을에도, 기억하는 사람이 하나쯤은 남았을까.'),
  ],
};
