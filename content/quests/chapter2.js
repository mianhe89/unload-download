// 1부 2장 「안개 너머」(11~20일)의 퀘스트. 줄거리는 docs/스토리.md '2장 · 안개 너머'.
// 메인 단계는 지워지지 않는 사람(세이·루·셀레나)과 플래그로만 잇는다(회장이 지워져도 세이가 옛이야기를 대신 꺼낸다).
export const quests = [
  {
    id: 'q.ch2', title: '안개 너머의 마을', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch2.started' } },
    steps: [
      { text: '북쪽 길로 나가 서쪽 갈림길의 안개 속으로 간다 (루와 함께)', done: { flag: 'ch2.knight_beaten' }, goal: { place: 'neighbor' } },
      { text: '안개 너머의 마을에 들어간다', done: { flag: 'ch2.arrived' }, goal: { place: 'neighbor' } },
      { text: '언덕 위 사당의 무녀를 만난다 (낮)', done: { flag: 'ch2.sei_met' }, goal: [{ npc: 'sei' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '회장에게 마을의 옛이야기를 듣는다', done: { flag: 'ch2.old_kingdom' }, goal: [{ npc: 'elder', unlessErased: 'elder' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '세이 곁에 머물며 에다 이야기를 꺼낸다', done: { flag: 'ch2.sei_eda' }, goal: [{ npc: 'sei' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '우리 마을로 돌아가 초소에서 견습 시험을 치른다 (낮)', done: { flag: 'rank.squire' }, goal: [{ zone: 'post' }, { place: 'home' }] },
      { text: '스무째 날, 북쪽 길 어귀의 루에게 간다 (밤엔 집에서 자면 하루가 지난다)', done: { flag: 'ch2.done' }, goal: [{ npc: 'lu', minDay: 20 }, { spot: 'playerHome' }, { place: 'home' }] },
    ],
  },
  {
    id: 'q.ch2.letter', title: '초소의 봉인된 편지', kind: 'once',
    start: { auto: true, when: { ifFlag: 'rank.squire', minDay: 16 } },
    steps: [{ text: '낮에 초소에 들러 레온 앞으로 온 편지를 전한다', goal: [{ zone: 'post' }, { place: 'home' }], done: { flag: 'ch2.sealed_letter' } }],
  },
  {
    id: 'q.ch2.offering', title: '가이아께 올리는 날', kind: 'once',
    start: { auto: true, when: { ifFlag: 'ch2.sei_eda', minDay: 16 } },
    steps: [{ text: '낮에 옆 마을 사당에 들러 세이의 제사를 함께한다', goal: [{ zone: 'shrine' }, { place: 'neighbor' }], done: { flag: 'ch2.offering' } }],
    reward: { aff: { sei: 2 } },
  },
];
