// 프롤로그 「수확제 다음 날」의 메인 퀘스트. 수첩에 지금 할 일이 보이게 이야기의 흐름을 단계로 나눈다.
// 단계는 대본·이벤트가 켜는 플래그로 넘어간다(이벤트는 끝나면 done.<이벤트 id>가 켜진다).
export const quests = [
  {
    id: 'q.prologue', title: '수확제 다음 날', kind: 'main',
    start: { auto: true, when: { unlessFlag: 'done.keeper' } },
    steps: [
      { text: '마을을 돌며 축제 준비를 돕는다 (세 군데 이상)', done: { flag: 'prep.ready' } },
      { text: '광장의 미아에게 간다', done: { flag: 'done.prep.end' } },
      { text: '수확제의 밤을 즐긴다 (광장 사람들을 돕거나, 미아 곁에 있어 보자)', done: { flag: 'eda.met' } },
      { text: '자정의 종소리를 듣는다', done: { flag: 'done.bells' } },
      { text: '약속대로 에다의 대장간에 간다', done: { flag: 'smithy.seen' } },
      { text: '에다를 아는 사람을 찾는다', done: { flag: 'selena.done' } },
      { text: '우물가에 왔다는 마법사를 만난다', done: { flag: 'done.lu' } },
      { text: '밤에 종탑에 가 본다', done: { flag: 'done.keeper' } },
    ],
  },
];
