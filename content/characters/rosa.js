// 로사 — 세탁부. 페르의 하숙방에 딸 엘라와 세 든 세탁부.
export default {
  id: 'rosa', name: '로사', role: '세탁부', age: 33, color: '#d88a90', erasable: false, background: true,
  sprite: { base: 'Woman', shareBase: 'rine', recolor: { '548789': 'a8606a', '79b8ce': 'd08a90' }, edits: [{ type: 'headband', color: 'f4ead6' }] },
  silhouette: '붉은 옷, 걷어 올린 소매.',
  bubbles: {},
  schedule: [{ from: '08:00', at: [11, 27], task: '(빨래를 짠다)' }, { from: '15:00', at: [20, 25], face: 'down', say: ['오늘은 잘 마르겠네.'] }, { from: '19:00', home: true }],
  remnant: null,
};
