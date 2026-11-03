// 빈 마을에 들르기 (1~3장 어느 때나, 길이 열려 있으면). 사람은 없고 문패와 이름 벽만 있다.
// 이름은 읽힌다(내레이션·주인공은 온전히 말한다). 다만 아무 얼굴도 떠오르지 않는다.
import { N, T, WALK } from '../chapters/dsl.js';

const plate = (who, at) => ({ prop: 'signpost', at, text: `문패: ${who}. 읽을 수는 있는데, 누구였는지 떠오르지 않는다.` });

export const phases = {
  ruin: {
    map: 'ruin',
    visit: true,
    keepTime: true,
    place: '빈 마을',
    time: 'day',
    clock: true,
    player: { at: [4, 12], face: 'right' },
    props: [
      plate('오르반과 마르타', [11, 6]),
      plate('꼬마 투이', [22, 5]),
      plate('대장장이 하겐', [28, 8]),
      plate('물레방앗간 리세', [28, 19]),
      plate('세 자매 — 앤, 에바, 엘', [13, 21]),
      { prop: 'pot', at: [24, 13], text: '솥 안에 마른 국물 자국. 누군가 끓이다 만 저녁이다.' },
      { prop: 'crate', at: [12, 11], text: '짐이 반쯤 꾸려져 있다. 떠나려던 걸까, 막 돌아온 걸까.' },
    ],
    onEnter: 'ruin.arrive',
    events: [
      { id: 'ruin.wall', trigger: { zone: 'wall' }, run: 'ruin.wall' },
    ],
  },
};

export const script = {
  'ruin.arrive': [
    WALK,
    N('마을이었다. 지붕도, 문도, 우물도 그대로였다.', { unlessFlag: 'visited.ruin' }),
    N('사람만 없었다. 발자국도, 연기도, 개 짖는 소리도.', { unlessFlag: 'visited.ruin' }),
    N('…여긴 늘 조용하다. 바람 소리만 난다.', { ifFlag: 'visited.ruin' }),
    { flag: 'visited.ruin' },
  ],
  'ruin.wall': [
    N('회관 앞 바위에 이름이 빽빽하게 새겨져 있었다. 위에서 아래까지, 빈틈없이.'),
    N('글씨가 다 달랐다. 날카로운 글씨, 삐뚤빼뚤한 글씨, 아주 작은 글씨. 여러 사람이 서로 다른 날에 새긴 것이었다.'),
    N('맨 아래 줄은 이름 한 글자만 새기다 멈춰 있었다.'),
    T('me', '…나만 이러는 게 아니었구나.'),
    N('잊지 않으려고 이름을 새긴 사람이, 나 말고도 있었다. 그리고 그 사람들도 지금은 없다.'),
    { fx: 'glitch' },
    { flag: 'ruin.wall' },
  ],
};
