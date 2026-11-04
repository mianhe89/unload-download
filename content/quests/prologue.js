// 프롤로그 「수확제 다음 날」의 메인 퀘스트. 수첩에 지금 할 일이 보이게 이야기의 흐름을 단계로 나눈다.
// 단계는 대본·이벤트가 켜는 플래그로 넘어간다(이벤트는 끝나면 done.<이벤트 id>가 켜진다).
export const quests = [
  {
    id: 'q.prologue', title: '수확제 다음 날', kind: 'main',
    start: { auto: true, when: { unlessFlag: 'done.keeper' } },
    steps: [
      {
        text: '마을 사람 셋의 축제 준비를 돕는다', done: { flag: 'prep.ready' },
        count: { n: 3, of: { eda: 'ev.prep.eda', hort: 'ev.prep.hort', rine: 'ev.prep.rine', per: 'ev.prep.per', tom: 'ev.prep.tom', selena: 'ev.prep.selena' } },
      },
      { text: '광장의 미아에게 간다', done: { flag: 'done.prep.end' }, goal: { npc: 'mia' } },
      { text: '수확제의 밤을 함께 보낸다 — 광장 사람들을 돕거나, 미아 곁에 가만히 서 있는다', done: { flag: 'eda.met' }, goal: { spot: 'plaza' }, count: { n: 2, of: { hort: 'ev.hort', rine: 'ev.rine', per: 'ev.per', tom: 'ev.tom', mia: 'ev.mia' } } },
      { text: '광장에서 자정의 종소리를 기다린다', done: { flag: 'done.bells' }, goal: { spot: 'plaza' } },
      { text: '약속대로 에다의 대장간에 간다', done: { flag: 'smithy.seen' }, goal: { zone: 'smithy' } },
      { text: '에다를 아는 사람을 찾는다 — 미아, 그리고 초소의 셀레나', done: { flag: 'selena.done' }, goal: [{ npc: 'mia', unlessFlag: 'mia.talked' }, { zone: 'post' }] },
      { text: '우물가에 왔다는 마법사를 만난다', done: { flag: 'done.lu' }, goal: [{ npc: 'lu' }, { spot: 'well' }] },
      { text: '밤, 종탑 앞에 가 본다', done: { flag: 'done.keeper' }, goal: { zone: 'tower' } },
    ],
  },
];
