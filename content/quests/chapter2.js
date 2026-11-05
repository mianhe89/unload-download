// 1부 2장 「옆 마을 가는 길」(11~20일)의 퀘스트. 줄거리는 docs/스토리.md '새 뼈대'.
// 메인 단계는 지워지지 않는 사람(세이·루·셀레나·레온)과 플래그로만 잇는다(회장이 지워져도 세이가 옛이야기를 대신 꺼낸다).
export const quests = [
  {
    id: 'q.ch2', title: '옆 마을 가는 길', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch2.started' } },
    steps: [
      { text: '낮에 초소에서 견습 시험을 치른다 (감독 레온)', done: { flag: 'rank.squire' }, goal: [{ zone: 'post' }, { place: 'home' }] },
      { text: '첫 임무 — 북쪽 길에서 서쪽으로 갈라지는 옆 마을 길, 길을 막은 갑옷을 쓰러뜨린다', done: { flag: 'ch2.knight_beaten' }, goal: { place: 'neighbor' } },
      { text: '옆 마을에 들어간다', done: { flag: 'ch2.arrived' }, goal: { place: 'neighbor' } },
      { text: '언덕 위 사당의 무녀에게 길이 열렸다고 알린다', done: { flag: 'ch2.sei_met' }, goal: [{ npc: 'sei' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '마을 회장에게 인사한다', done: { flag: 'ch2.old_kingdom' }, goal: [{ npc: 'elder', unlessErased: 'elder' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '돌아가기 전, 사당의 세이 곁에 잠시 머문다', done: { flag: 'ch2.sei_eda' }, goal: [{ npc: 'sei' }, { zone: 'shrine' }, { place: 'neighbor' }] },
      { text: '마을로 돌아가 오크 정찰대에 대비한다 — 열닷새째 밤에 온다', done: { flag: 'raid.scouts.over' }, goal: [{ zone: 'post' }, { place: 'home' }] },
      { text: '스무째 날 낮, 초소에 간다 (밤엔 집에서 자면 시간이 간다)', done: { flag: 'ch2.done' }, goal: [{ zone: 'post', minDay: 20 }, { spot: 'playerHome' }, { place: 'home' }] },
    ],
  },
  {
    id: 'q.ch2.letter', title: '초소의 봉인된 편지', kind: 'once',
    start: { auto: true, when: { ifFlag: 'rank.squire', minDay: 16 } },
    steps: [{ text: '낮에 초소에 들러 레온 앞으로 온 편지를 전한다', goal: [{ zone: 'post' }, { place: 'home' }], done: { flag: 'ch2.sealed_letter' } }],
  },
  {
    id: 'q.ch2.offering', title: '호라께 올리는 날', kind: 'once',
    start: { auto: true, when: { ifFlag: 'ch2.sei_eda', minDay: 16 } },
    steps: [{ text: '낮에 옆 마을 사당에 들러 세이의 제사를 함께한다', goal: [{ zone: 'shrine' }, { place: 'neighbor' }], done: { flag: 'ch2.offering' } }],
    reward: { aff: { sei: 2 } },
  },
];
