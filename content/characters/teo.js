// 테오 — 마르타 할머니의 손자. 마르타 할머니와 둘이 산다. 핀과 단짝.
export default {
  id: 'teo', name: '테오', role: '마르타 할머니의 손자', age: 11, color: '#6aa0d8', erasable: false, background: true,
  sprite: { base: 'Child', shareBase: 'kid', recolor: { '5f7160': '3a6aa8' }, edits: [{ type: 'feather' }] },
  silhouette: '파란 옷의 꼬마.',
  bubbles: {},
  schedule: [{ from: '09:00', at: [22, 20], mode: 'wander', radius: 2, say: ['핀! 술래 해!'] }, { from: '18:00', home: true }],
  remnant: null,
};
