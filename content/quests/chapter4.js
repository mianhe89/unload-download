// 2부 4장 「소집 가는 길」의 퀘스트. 줄거리는 docs/스토리.md '4장 · 소집 가는 길'.
export const quests = [
  {
    id: 'q.ch4', title: '왕도로', kind: 'main',
    start: { auto: true, when: { ifFlag: 'ch4.started' } },
    steps: [
      { text: '북쪽 길로 나가 서쪽 갈림길의 옆 마을에 들른다 (세이와 합류)', done: { flag: 'ch4.sei_joined' } },
      { text: '서리 마을 가는 길에서 동쪽으로 갈라져 물레방아 마을로 간다', done: { flag: 'ch4.mill_arrived' } },
      { text: '광장 제단 앞의 사람들과 이야기한다', done: { flag: 'mill.alma' } },
      { text: '제단 앞에 다시 선다', done: { flag: 'ch4.keeper_day' } },
      { text: '동쪽 영주의 성 아랫마을로 간다', done: { flag: 'ch4.lord_arrived' } },
      { text: '성에 들어가 영주에게 인사한다', done: { flag: 'rank.regent' } },
      { text: '영주의 성 북쪽, 기록하는 마을로 간다', done: { flag: 'visited.surface:14,4' } },
      { text: '광장의 명부 판을 본다', done: { flag: 'ledger.board' } },
      { text: '서쪽 드워프 마을로 간다', done: { flag: 'duel.offered' } },
      { text: '레온의 결투', done: { flag: 'ch4.duel_done' } },
      { text: '서리 마을 북서쪽, 얼음성에 들른다', done: { flag: 'ice.offered' } },
      { text: '얼음성을 나선다', done: { flag: 'noel.refused' } },
    ],
  },
];
