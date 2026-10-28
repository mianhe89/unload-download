// 등장인물. erasable: 로드 시 지워질 수 있는 마을 사람(1차 MVP 범위).
// 히로인 원형(미아·셀레나·루)은 기획서 기준 가안이며 바뀔 수 있다.
export const characters = {
  me:     { name: '나',       color: '#e8e4f0' },
  mia:    { name: '미아',     color: '#ffb3c8', role: '소꿉친구' },
  selena: { name: '셀레나',   color: '#9fc3ff', role: '기사단 선배' },
  lu:     { name: '루',       color: '#c9a6ff', role: '떠돌이 마법사' },
  hort:   { name: '호르트',   color: '#f2c98a', role: '빵집 주인', erasable: true },
  tom:    { name: '톰',       color: '#a8d8a0', role: '경비병', erasable: true },
  rine:   { name: '리네',     color: '#ffd1a6', role: '꽃집 아가씨', erasable: true },
  per:    { name: '페르',     color: '#d6c79e', role: '늙은 음유시인', erasable: true },
  eda:    { name: '에다',     color: '#ff9e7a', role: '대장장이의 딸' },
  keeper: { name: '???',      color: '#8a8a8a' },
};

// 지워지는 우선순위가 같을 때의 기본 순서
export const ERASE_ORDER = ['hort', 'tom', 'rine', 'per'];
