// 카이 — 사냥꾼의 아들. 이반의 아들. 견습 시험에 떨어졌다. 대신 활을 잡았다.
export default {
  id: 'kai', name: '카이', role: '사냥꾼의 아들', age: 19, color: '#8aa86a', erasable: false, background: true,
  sprite: { base: 'Hunter', shareBase: 'hunter', recolor: { '4a5270': '5a4a3a', '548789': '7a6a4a', '79b8ce': 'a89a6a' }, edits: [{ type: 'feather' }] },
  silhouette: '갈색 사냥꾼 옷, 아버지보다 한 뼘 작다.',
  bubbles: {},
  schedule: [{ from: '07:00', at: [43, 18], face: 'left', say: ['아버지는 북쪽 숲이 수상하대.'] }, { from: '15:00', at: [44, 12], task: '(활시위를 고친다)' }, { from: '19:00', home: true }],
  remnant: null,
};
