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

// 보스 자리: 검은 성 바로 앞 길
export const BOSSES = {
  'surface:8,2': { enemies: ['sweeper'], note: '빗자루를 든 거대한 그림자가 성문 앞을 쓸고 있다.' },
};
