// 1부 1장 「빈 대장간」(4~10일)의 퀘스트. 줄거리는 docs/스토리.md '1장 · 빈 대장간'.
// 메인 퀘스트는 지워지지 않는 사람(미아·셀레나·루)과 장소로만 잇는다. 지워질 수 있는 사람이 단계에 끼면
// 그 사람이 지워진 순간 진행이 막히기 때문이다. 지워질 수 있는 사람의 이야기는 사이드로 둔다.
export const quests = [
  {
    id: 'q.ch1', title: '에다를 찾아서', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch1.started' } },
    steps: [
      { text: '빈 대장간을 다시 살펴본다', done: { zone: 'smithy' }, onDone: 'ch1.smithy', goal: { zone: 'smithy' } },
      { text: '미아에게 에다 이야기를 다시 꺼낸다', done: { talk: 'mia' }, onDone: 'ch1.mia', goal: { npc: 'mia' } },
      { text: '셀레나에게 명부를 다시 보여 달라고 한다', done: { talk: 'selena' }, onDone: 'ch1.ledger', goal: [{ npc: 'selena' }, { zone: 'post' }] },
      { text: '밤(19시 이후), 종탑 벽을 확인한다', done: { zone: 'tower', when: { afterTime: '19:00' } }, onDone: 'aftermath.tower', goal: { zone: 'tower' } },
      { text: '우물가의 루에게 사라진 사람들 이야기를 한다', done: { talk: 'lu' }, onDone: 'ch1.lu', goal: [{ npc: 'lu' }, { spot: 'well' }] },
      { text: '열흘째 되는 날, 우물가의 루에게 간다 (밤엔 집에서 자면 하루가 지난다)', done: { flag: 'ch1.departed' }, goal: [{ npc: 'lu', minDay: 10 }, { spot: 'well', minDay: 10 }, { spot: 'playerHome' }] },
    ],
  },
  {
    id: 'q.ch1.verse', title: '노래의 뒷소절', kind: 'once', giver: 'per',
    // 로드한 사람에게만 열린다
    start: { when: { ifFlag: 'ch1.started', minLoads: 1, unlessErased: 'per' } },
    offer: '자네, 수확제 밤에 내 노래를 끝까지 들었지. …이상하군. 오늘따라 뒷소절이 자꾸 입에 맴도네. 저녁에 모닥불 곁으로 오게. 들려주지.',
    steps: [
      { text: '저녁(18시 반 이후), 모닥불 곁에서 페르의 노래를 끝까지 듣는다', done: { flag: 'per.verse.heard' }, goal: [{ npc: 'per' }, { spot: 'fireside' }] },
    ],
    reward: { aff: { per: 4 } },
  },
];
