// 1부 1장 「견습 모집」(4~10일)의 퀘스트. 줄거리는 docs/스토리.md '새 뼈대'.
// 메인은 견습 훈련과 북쪽에서 내려오는 것들이다. 에다는 메인이 아니다 — 훈련 사이사이 주인공이 혼자 묻는 의문으로만 남는다.
// 메인 퀘스트는 지워지지 않는 사람(미아·셀레나·루·레온)과 장소로만 잇는다. 지워질 수 있는 사람이 단계에 끼면 그 사람이 지워진 순간 진행이 막힌다.
export const quests = [
  {
    id: 'q.ch1', title: '견습 모집', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch1.started' } },
    steps: [
      { text: '아침 훈련 — 우물가의 루에게 간다', done: { talk: 'lu' }, onDone: 'ch1.train', goal: [{ npc: 'lu' }, { spot: 'well' }] },
      { text: '동쪽 밭에 내려온 들개 떼를 쫓아낸다', done: { flag: 'ch1.dogs' }, goal: { zone: 'fields' } },
      { text: '초소의 셀레나에게 보고한다', done: { talk: 'selena' }, onDone: 'ch1.report', goal: [{ npc: 'selena' }, { zone: 'post' }] },
      { text: '여섯째 날 낮, 영주가 보낸 기사가 초소에 온다 (밤엔 집에서 자면 시간이 간다)', done: { flag: 'leon.arrived' }, goal: [{ zone: 'post', minDay: 6 }, { spot: 'playerHome' }] },
      { text: '여드레째 아침, 털린 채소밭의 발자국을 쫓는다', done: { flag: 'ch1.tracks' }, goal: [{ zone: 'fields', minDay: 8 }, { spot: 'playerHome' }] },
      { text: '열흘째 낮, 초소에서 견습 시험 공고를 듣는다', done: { flag: 'ch1.departed' }, goal: [{ zone: 'post', minDay: 10 }, { spot: 'playerHome' }] },
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
