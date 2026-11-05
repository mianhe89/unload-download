// 한스 — 목수. 엘사의 남편, 핀의 아빠. 마을의 지붕과 울타리는 거의 다 이 사람 손을 탔다.
export default {
  id: 'hans', name: '한스', role: '목수', age: 41, color: '#8a9ac8', erasable: false, background: true,
  sprite: { base: 'Villager3', shareBase: 'farmer', recolor: { '56864c': '4a5a7a', a8a129: '7a8ab0' }, edits: [{ type: 'headband', color: '8a5a34' }] },
  silhouette: '청회색 작업복, 허리에 망치.',
  bubbles: {},
  schedule: [{ from: '07:30', at: [12, 19], task: '(울타리를 고친다)' }, { from: '13:00', at: [30, 18], face: 'down', say: ['목책 말뚝이 모자라. 숲에 한 번 더 가야겠군.'] }, { from: '18:30', home: true }],
  remnant: null,
};
