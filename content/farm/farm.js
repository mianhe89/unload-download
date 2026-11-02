// 행동 파밍 (기획서 '행동 파밍', '과하면 세계가 반응한다').
// 같은 행동을 반복하면 어느 순간 히든 스킬이 열린다. 희귀도와 확률은 게임 안에서 공개하지 않는다.
// 얻은 스킬은 스테이터스 창에 보인다. 얻는 것과 잃는 것이 함께 있다.

// 길 맵에서 하는 행동: E를 누른 물체 → 행동
//   chop  작은 나무 (베면 그 자리에서 영영 사라진다) → 목재
//   mine  바위 무더기 → 돌
export const FARM_TARGETS = {
  chop: ['tree_round', 'tree_round2', 'tree_pine', 'tree_dead', 'tree_snow', 'tree_snow2', 'tree_snow_round', 'tree_pink'],
  mine: ['rocks_brown', 'rocks_grey'],
};
export const FARM_TEXT = {
  chop: '나무를 베었다. 우지끈.',
  mine: '바위를 깨서 돌을 얻었다.',
};
export const YIELD = { chop: 'wood', mine: 'stone' };
export const ITEM_NAMES = { wood: '목재', stone: '돌' };

// 히든 스킬: min회 이상 한 뒤부터 매번 p 확률 (비공개)
//   effect: 주인공 능력치 보정 (전투) — atk/def 배수, spd 더하기, heavy 배수
export const HIDDEN_SKILLS = {
  woodcutter: { name: '우지끈', grade: 'SR', from: 'chop', min: 30, p: 0.05, desc: '공격 +10%, 한 방이 더 묵직하다', effect: { atk: 1.1, heavy: 1.1 } },
  stonehand: { name: '단단한 손', grade: 'R', from: 'mine', min: 15, p: 0.08, desc: '방어 +10%', effect: { def: 1.1 } },
  napper: { name: '낮잠 고수', grade: 'N', from: 'sleep', min: 6, p: 0.25, desc: '잠으로 피로가 더 풀린다', effect: { rest: 1.5 } },
  roamer: { name: '먼 길', grade: 'R', from: 'walk', min: 3000, p: 1, desc: '속도 +5', effect: { spd: 5 } },
};

// 세계의 반응: 깊은 숲에서 나무를 이만큼 베면 엘프 마을이 보이지 않게 된다
export const ELF_FOREST_LIMIT = 20;
// 깊은 숲에서 한 그루도 안 벤 사람만 엘프를 만난다
export const ELF_LINES = [
  '…베지 않았구나. 이 숲에서 그런 사람은 오랜만이야.',
  '여긴 이 세계에서 제일 오래된 곳이야. 지워지는 게 가장 늦게 오는 곳.',
  '네가 기억하는 이름들, 나무에 새겨 둬. 나무는 쉽게 잊지 않아.',
];
