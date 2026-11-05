// 릴리 — 오토의 딸. 오토네 막내. 허수아비와 이야기한다.
export default {
  id: 'lili', name: '릴리', role: '오토의 딸', age: 9, color: '#f0a0c0', erasable: false, background: true,
  sprite: { base: 'Child', shareBase: 'kid', recolor: { '5f7160': 'd07aa0' }, edits: [{ type: 'headband', color: 'f07aa0' }] },
  silhouette: '분홍 옷의 꼬마.',
  bubbles: {},
  schedule: [{ from: '08:00', at: [48, 17], mode: 'wander', radius: 2, say: ['허수아비야, 안녕!'] }, { from: '17:30', home: true }],
  remnant: null,
};
