// 서리 마을에 들르기 (1~3장, 길이 열려 있으면). 사나운 마을: 해 질 녘(17:30)마다 오크가 북문으로 내려온다(content/raids.js 'frost').
// 사람들은 오크를 미워하지만, 오크가 왜 내려오는지 어렴풋이 안다. 고원이 안개에 먹히고 있다.
import { N, T, keep, WALK } from '../chapters/dsl.js';

export const phases = {
  frost: {
    map: 'frost',
    visit: true,
    keepTime: true,
    place: '서리 마을',
    time: 'day',
    clock: true,
    player: { at: [20, 25], face: 'up' },
    onEnter: 'frost.arrive',
    events: [
      { id: 'frost.brenna', trigger: { near: 'brenna', r: 3 }, run: 'frost.brenna' },
      { id: 'frost.yuna', when: { unlessErased: 'yuna' }, trigger: { near: 'yuna', r: 3 }, run: 'frost.yuna' },
      { id: 'frost.gord', when: { unlessErased: 'gord' }, trigger: { near: 'gord', r: 3 }, run: 'frost.gord' },
    ],
  },
};

export const script = {
  'frost.arrive': [
    WALK,
    N('눈이었다. 남쪽은 아직 가을인데, 여기는 처음부터 겨울이었던 것처럼.', { unlessFlag: 'visited.frost' }),
    N('북문엔 통과 짐짝이 쌓여 있고, 망루엔 누군가 늘 서 있었다. 사나운 마을이었다.', { unlessFlag: 'visited.frost' }),
    { flag: 'visited.frost' },
    { flag: 'visited.surface:7,6' },
  ],
  'frost.brenna': [
    T('brenna', '외지인. 남쪽에서 왔나.'),
    T('brenna', '해 지기 전에 볼일 끝내고 나가. 아니면 활이라도 들든가.'),
    T('me', '해가 지면 뭐가 오는데요?'),
    T('brenna', '오크. 북쪽 회색 고원에서. 요즘은 거의 날마다다.'),
    T('brenna', '…예전엔 한 해에 한두 번이었다. 고원 끝이 하얗게 먹혀 들어간다더군. 놈들도 갈 데가 없는 거지.'),
    N('브렌나는 북문 너머를 보았다. 미워하는 얼굴이라기보다, 지친 얼굴이었다.'),
    { flag: 'frost.met_brenna' },
  ],
  'frost.yuna': [
    WALK,
    T('yuna', '남쪽에서 오셨어요? 거긴 정말 겨울이 끝나요?'),
    T('yuna', '저는 태어나서 눈 안 오는 날을 본 적이 없어요. 망루에서 보면 남쪽 하늘만 색이 달라요.'),
    T('yuna', '해 질 녘엔 제가 제일 먼저 오크를 봐요. 눈이 좋거든요. …그게 별로 좋은 일은 아니지만요.'),
  ],
  'frost.gord': [
    WALK,
    T('gord', '어서 와! 「곰의 굴」이다. 국은 늘 있다.'),
    T('gord', '이 마을 법은 하나야. 종이 울리면 문 걸고, 끝나면 국 먹고. 그러니까 살아.'),
    T('gord', '…남쪽 사람들은 오크를 "마왕의 졸개"라던데. 여기선 그냥 "배고픈 놈들"이라고 해.', keep('gord')),
  ],
  'talk.frost.brenna': [WALK, T('brenna', '해 지기 전에 화살을 세어 둬라. 그게 이 마을 인사다.')],
  'talk.frost.yuna': [WALK, T('yuna', '오늘은 조용하면 좋겠어요.')],
  'talk.frost.gord': [WALK, T('gord', '국 식는다! 들어와!')],
};
