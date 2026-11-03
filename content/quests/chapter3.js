// 1부 3장 「겨울 준비」(21~30일)의 퀘스트. 줄거리는 docs/스토리.md '3장 · 겨울 준비'.
// 단계는 지워지지 않는 히로인(미아·셀레나·루)으로만 잇는다.
export const quests = [
  {
    id: 'q.ch3', title: '첫눈 축제', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch3.started' } },
    steps: [
      { text: '겨울 장에서 미아와 함께 걷는다 (22일부터, 낮)', done: { flag: 'route.mia.hands' } },
      { text: '오후에 초소에 들러 셀레나의 명부 정리를 돕는다 (23일부터)', done: { flag: 'route.selena.quarrel' } },
      { text: '아침에 셀레나를 만난다', done: { flag: 'route.selena.made_up' } },
      { text: '사라졌던 루를 다시 만난다 (28일부터)', done: { flag: 'route.lu.back' } },
      { text: '30일 저녁, 광장의 첫눈 축제에 간다', done: { flag: 'part1.done' } },
    ],
  },
];
