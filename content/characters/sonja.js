// 소냐 — 견습 동기. 같이 견습에 붙은 동기. 셀레나를 동경한다.
export default {
  id: 'sonja', name: '소냐', role: '견습 동기', age: 21, color: '#6a9a6a', erasable: false, background: true,
  sprite: { base: 'Villager4', shareBase: 'selena', recolor: { f1c471: 'd08a3a', d78b4a: 'a8602a', d14b34: '5a7a5a', '8f3e56': '3a5a3a' }, edits: [{ type: 'cape', color: '3a6a3a', dark: '244a24' }] },
  silhouette: '주황 땋은 머리, 초록 견습복.',
  bubbles: {},
  schedule: [{ from: '07:30', at: [39, 28], face: 'up', say: ['셀레나 초소장님처럼 될 거야.'] }, { from: '13:00', at: [26, 19], face: 'down', say: ['발! 뒤꿈치부터 딛지 말라니까.'] }, { from: '20:00', home: true }],
  remnant: null,
};
