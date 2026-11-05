// 그레타 — 잡화점 주인. 잡화점 주인. 남편 볼프가 짐을 나른다.
export default {
  id: 'greta', name: '그레타', role: '잡화점 주인', age: 38, color: '#7ab07a', erasable: false, background: true,
  sprite: { base: 'Villager2', shareBase: 'woman', recolor: { '4a5270': '3e5e3e', '548789': '6a9a6a' }, edits: [{ type: 'headband', color: '4a8a4a' }] },
  silhouette: '초록 앞치마.',
  bubbles: {},
  schedule: [{ from: '07:00', at: [7, 15], face: 'down', say: ['잡화점 열었어요! 붕대, 실, 등잔 기름!'] }, { from: '19:00', home: true }],
  remnant: null,
};
