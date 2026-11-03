// 드워프 마을에 들르기 (1~3장). 북쪽 끝 갱도 입구로 나가면 길 맵의 계단으로 지하에 내려간다.
// 정통 판타지의 드워프: 작고 단단하고, 쇠와 맹세를 중히 여기고, 고집이 세다(기획서 '종족과 지역').
import { N, T, WALK } from '../chapters/dsl.js';

export const phases = {
  dwarf: {
    map: 'dwarf', visit: true, keepTime: true, place: '드워프 마을', time: 'day', clock: true,
    player: { at: [19, 23], face: 'up' },
    props: [{ prop: 'signpost', at: [20, 5], text: '팻말: "갱도. 맹세 없는 자 내려가지 말 것."' }],
    onEnter: 'dwarf.arrive',
    events: [
      // 에다의 반지를 본 늙은 대장장이 (docs/스토리.md '드워프 광산 마을')
      { id: 'dwarf.ring', when: { unlessErased: 'brok', ifFlag: 'has.ring' }, trigger: { near: 'brok', r: 3 }, run: 'dwarf.ring' },
      { id: 'dwarf.helga', when: { unlessErased: 'helga' }, trigger: { near: 'helga', r: 3 }, run: 'dwarf.helga' },
    ],
  },
};

export const script = {
  'dwarf.arrive': [
    WALK,
    N('바위를 파고 지은 집들 사이로 대장간 연기가 올랐다. 망치 소리가 산을 울렸다.', { unlessFlag: 'visited.dwarf' }),
    { flag: 'visited.dwarf' },
    { flag: 'visited.surface:11,5' },
  ],
  'dwarf.ring': [
    T('brok', '잠깐. 그 손에 든 거, 보여 다오.'),
    N('브로크가 반지를 받아 들고, 손톱으로 테두리를 천천히 훑었다.'),
    T('brok', '…솜씨는 거칠어. 망치를 너무 세게 내리쳤고, 식히는 것도 서둘렀지.'),
    T('brok', '그런데 마음은 곧은 테두리다. 한 사람만 생각하면서 두드린 쇠야. 이런 건 쉽게 부러지지 않아.'),
    T('brok', '누가 만들었나?'),
    T('me', '…에다요. 대장장이 딸.'),
    T('brok', '에다라. 처음 듣는 이름이군. 이걸 만든 손이라면, 언젠가 꼭 만나 보고 싶다.'),
    { flag: 'dwarf.ring' },
  ],
  'dwarf.helga': [
    WALK,
    T('helga', '사람이 여기까지 올라오다니. 길 잃었나?'),
    T('helga', '요즘 갱도가 이상해. 지도엔 셋째 갈래가 있는데, 가 보면 그냥 막장이야. 다들 원래 막장이었대.'),
    T('helga', '내가 그 갈래에서 은을 캔 게 지난달인데. …내 머리가 이상한 건가.'),
    { flag: 'dwarf.mine' },
  ],
  'talk.dwarf.brok': [WALK, T('brok', '쇠는 거짓말을 안 한다. 사람이 하지.')],
  'talk.dwarf.helga': [WALK, T('helga', '갱도는 정직해. 사람이 헷갈릴 뿐이지.')],
};
