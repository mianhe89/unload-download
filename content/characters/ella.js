// 엘라 — 로사의 딸. 로사의 딸. 엄마 곁을 떠나지 않는다.
export default {
  id: 'ella', name: '엘라', role: '로사의 딸', age: 8, color: '#f0d070', erasable: false, background: true,
  sprite: { base: 'Child', shareBase: 'kid', recolor: { '5f7160': 'e0b040' }, edits: [{ type: 'headband', color: 'f6e070' }] },
  silhouette: '노란 옷의 꼬마.',
  bubbles: {},
  schedule: [{ from: '08:00', at: [12, 28], mode: 'wander', radius: 1, say: ['엄마, 물 더 길어 올까?'] }, { from: '18:30', home: true }],
  remnant: null,
};
