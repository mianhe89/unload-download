// 길 맵에서 마주치는 몬스터. 칸·날짜로 정해진다 (같은 날 같은 칸이면 같은 무리, 이기면 그날은 없다).
// 마을·바다엔 없다. 보스는 정해진 자리에 늘 있다.
export const ENCOUNTER_CHANCE = 0.35;

// 기후별 무리 후보
export const POOLS = {
  temperate: [['slime'], ['slime', 'slime'], ['beast']],
  lateAutumn: [['beast'], ['slime', 'owl']],
  deepForest: [['owl'], ['owl', 'beast']],
  frost: [['skull'], ['owl', 'skull']],
  snow: [['skull'], ['skull', 'mole']],
  blackSnow: [['skull', 'skull']],
  dry: [['mole'], ['beast', 'mole']],
  desert: [['mole', 'mole'], ['beast']],
  coast: [['slime'], ['slime', 'beast']],
  volcano: [['beast', 'beast']],
  cave: [['mole'], ['mole', 'skull']],
  deepCave: [['skull', 'mole']],
  lava: [['beast', 'skull']],
  ancientHall: [['skull', 'skull']],
};

// 보스 자리. when: 나타나는 조건(대본 조건 문법), party: 같이 싸우는 사람, flag: 이기면 켜지는 플래그
export const BOSSES = {
  // 2장: 옆 마을로 가는 안개 길을 지키는 빈 갑옷. 루와 둘이서 싸운다
  'surface:5,10': {
    enemies: ['lostknight'], when: { ifFlag: 'ch2.started' }, party: ['me', 'lu'], flag: 'ch2.knight_beaten',
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
