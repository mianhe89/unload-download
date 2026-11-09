// 길 맵에서 마주치는 몬스터. 칸·날짜로 정해진다 (같은 날 같은 칸이면 같은 무리, 이기면 그날은 없다).
// 마을·바다엔 없다. 보스는 정해진 자리에 늘 있다.
export const ENCOUNTER_CHANCE = 0.35;

// 기후별 무리 후보 (content/action/foes.js의 적). 한 번에 여덟까지 나오고, 쓰러지면 남은 무리가 가장자리에서 들어온다.
// 사는 땅이 생김새를 바꾼다: 화산엔 불씨 슬라임, 눈밭엔 서리 슬라임과 눈 올빼미, 사막엔 바위 두더지
const n = (id, k) => Array(k).fill(id);
export const POOLS = {
  temperate: [[...n('slime', 8), 'slime_big', 'slime_big'], [...n('wolf', 7), 'wolf_alpha'], [...n('slime', 5), ...n('slime_poison', 3), ...n('wolf', 3)]],
  lateAutumn: [[...n('wolf', 6), 'wolf_alpha', ...n('beast', 2)], ['beast', ...n('slime', 6), ...n('owl', 2), 'slime_big']],
  deepForest: [[...n('owl', 3), 'owl_dark', ...n('wolf', 5)], [...n('wolf', 8), 'wolf_alpha', 'beast']],
  frost: [[...n('slime_frost', 6), ...n('owl_snow', 2), 'slime_big'], [...n('skull', 3), ...n('wolf', 5)]],
  snow: [[...n('owl_snow', 3), ...n('slime_frost', 6), ...n('mole_ice', 2)], [...n('skull', 4), 'skull_knight', ...n('mole_ice', 3)]],
  blackSnow: [[...n('skull', 4), ...n('skull_ash', 2), 'skull_knight', 'skull_mage'], [...n('demon', 5), 'demon_large']],
  dry: [[...n('mole', 6), ...n('beast', 2), 'beast_ash'], [...n('beast', 3), ...n('wolf', 6), 'wolf_alpha']],
  desert: [[...n('mole_rock', 4), ...n('mole', 5)], [...n('beast', 5), ...n('beast_ash', 3)]],
  coast: [[...n('slime', 10), ...n('slime_big', 2)], [...n('slime', 6), ...n('slime_poison', 3), ...n('beast', 2)]],
  volcano: [[...n('slime_ember', 8), ...n('beast', 3), ...n('beast_ash', 2)]],
  cave: [[...n('mole', 6), ...n('skull', 2), 'skull_mage'], [...n('mole_rock', 4), ...n('skull', 3), 'skull_knight']],
  deepCave: [[...n('skull', 3), ...n('mole', 6), 'skull_mage', 'skull_knight']],
  lava: [[...n('slime_ember', 8), ...n('beast_ash', 3), ...n('skull_ash', 2)]],
  ancientHall: [[...n('skull', 5), ...n('skull_ash', 2), 'skull_knight', 'skull_mage']],
};

// 보스 자리. when: 나타나는 조건(대본 조건 문법), flag: 이기면 켜지는 플래그. 동료 없이 혼자 싸운다
export const BOSSES = {
  // 2장: 옆 마을로 가는 길을 지키는 빈 갑옷
  'surface:5,10': {
    enemies: ['lostknight'], when: { ifFlag: 'rank.squire' }, flag: 'ch2.knight_beaten',
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
  tork: [{ item: 'potion', p: 0.5, text: '토르크가 품에 지니던 물약. 오크 족장 집안의 것이다.' }, { item: 'emberCharm', p: 1, once: true, text: '토르크의 목에서 끊어진 불씨 부적이 떨어졌다.' }, { item: 'redCape', p: 1, once: true, text: '토르크가 달아나며 걸리적거리던 붉은 망토를 벗어 던졌다.' }],
  lostknight: [{ item: 'oldHelm', p: 1, once: true, text: '빈 갑옷이 무너지며 투구가 굴러 나왔다.' }],
};
