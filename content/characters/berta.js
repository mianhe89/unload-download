// 베르타 — 오토의 아내. 오토네 농가의 안주인. 남편보다 밭을 더 잘 안다.
export default {
  id: 'berta', name: '베르타', role: '오토의 아내', age: 44, color: '#d8b070', erasable: false, background: true,
  sprite: { base: 'Woman', shareBase: 'rine', recolor: { '548789': '8a6a3a', '79b8ce': 'b8945a' }, edits: [{ type: 'headband', color: 'c8a050' }] },
  silhouette: '짚단 색 앞치마에 두건.',
  bubbles: {},
  schedule: [{ from: '07:00', at: [52, 18], face: 'down', say: ['오늘은 배추 뽑는 날이야.'] }, { from: '12:00', at: [50, 23], task: '(배추를 뽑는다)' }, { from: '18:30', home: true }],
  remnant: null,
};
