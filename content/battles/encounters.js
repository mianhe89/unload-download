// 길 맵에서 마주치는 몬스터. 칸·날짜로 정해진다 (같은 날 같은 칸이면 같은 무리, 이기면 그날은 없다).
// 마을·바다엔 없다. 보스는 정해진 자리에 늘 있다.
export const ENCOUNTER_CHANCE = 0.35;

// 기후별 무리 후보 (content/action/foes.js의 적). 한 번에 다섯까지 나오고, 쓰러지면 남은 무리가 들어온다.
// 사는 땅이 생김새를 바꾼다: 화산엔 불씨 슬라임, 눈밭엔 서리 슬라임과 눈 올빼미, 사막엔 바위 두더지
const n = (id, k) => Array(k).fill(id);
export const POOLS = {
  temperate: [n('slime', 4), [...n('slime', 4), 'wolf', 'wolf'], n('wolf', 4)],
  lateAutumn: [[...n('wolf', 3), 'beast'], ['beast', ...n('slime', 3), 'owl', 'owl']],
  deepForest: [[...n('owl', 3), 'wolf', 'wolf'], [...n('wolf', 5), 'beast']],
  frost: [[...n('slime_frost', 3), 'owl_snow', 'owl_snow'], [...n('skull', 2), ...n('wolf', 3)]],
  snow: [[...n('owl_snow', 3), ...n('slime_frost', 3)], [...n('skull', 3), 'mole']],
  blackSnow: [[...n('skull', 3), ...n('skull_ash', 3)]],
  dry: [[...n('mole', 3), 'beast'], [...n('beast', 2), ...n('wolf', 3)]],
  desert: [[...n('mole_rock', 2), ...n('mole', 2)], n('beast', 4)],
  coast: [n('slime', 6), [...n('slime', 3), 'beast', 'beast']],
  volcano: [[...n('slime_ember', 4), ...n('beast', 2)]],
  cave: [[...n('mole', 3), 'skull'], [...n('mole_rock', 2), ...n('skull', 2)]],
  deepCave: [[...n('skull', 3), ...n('mole', 3)]],
  lava: [[...n('slime_ember', 4), 'beast', 'skull_ash']],
  ancientHall: [[...n('skull', 4), ...n('skull_ash', 2)]],
};

// 보스 자리. when: 나타나는 조건(대본 조건 문법), flag: 이기면 켜지는 플래그. 동료 없이 혼자 싸운다
export const BOSSES = {
  // 2장: 옆 마을로 가는 길을 지키는 빈 갑옷
  'surface:5,10': {
    enemies: ['lostknight'], when: { ifFlag: 'ch2.started' }, flag: 'ch2.knight_beaten',
    note: '안개 속에서 녹슨 갑옷이 일어선다. 투구 안이 텅 비어 있다.',
  },
  'surface:8,2': { enemies: ['sweeper'], note: '빗자루를 든 거대한 그림자가 성문 앞을 쓸고 있다.' },
};

// 이기면 떨어뜨리는 것: 몬스터마다 그럴 만한 것만 (포션은 귀해서 일반 몬스터는 안 떨군다)
//   p: 확률, n: 개수, text: 얻을 때 보이는 한 줄, once: 장비처럼 한 번 얻으면 다시 안 나오는 것
export const DROPS = {
  slime: [{ item: 'herb', p: 0.35, text: '슬라임이 삼키다 만 약초가 남았다.' }],
  beast: [{ item: 'herb', p: 0.2, text: '짐승이 뜯어 먹던 약초 덤불이 그대로 있다.' }],
  owl: [{ item: 'antidote', p: 0.25, text: '부엉이 둥지에 해독초가 깔려 있었다.' }],
  mole: [{ item: 'stone', p: 0.5, n: 2, text: '두더지 굴에서 돌이 굴러 나왔다.' }],
  skull: [{ item: 'bandage', p: 0.3, text: '해골이 감고 있던 붕대. 빨면 쓸 만하다.' }],
  orc: [{ item: 'bandage', p: 0.4, text: '오크가 허리에 차고 있던 붕대를 떨어뜨렸다.' }, { item: 'ointment', p: 0.15, text: '오크의 짐에서 화상 연고가 나왔다. 불을 다루는 부족이다.' }, { item: 'orcGloves', p: 0.08, once: true, text: '달아난 오크가 가죽 장갑 한 켤레를 떨구고 갔다.' }],
  tork: [{ item: 'potion', p: 0.5, text: '토르크가 품에 지니던 물약. 오크 족장 집안의 것이다.' }, { item: 'emberCharm', p: 1, once: true, text: '토르크의 목에서 끊어진 불씨 부적이 떨어졌다.' }],
  lostknight: [{ item: 'oldHelm', p: 1, once: true, text: '빈 갑옷이 무너지며 투구가 굴러 나왔다.' }],
};
