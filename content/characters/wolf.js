// 볼프 — 짐꾼. 그레타의 남편. 옆 마을과 북쪽 길로 짐을 나른다.
export default {
  id: 'wolf', name: '볼프', role: '짐꾼', age: 42, color: '#a0806a', erasable: false, background: true,
  sprite: { base: 'Inspector', shareBase: 'hort', recolor: { a3754e: '6a5a4a', '91522c': '4a3a2a' }, edits: [{ type: 'cape', color: '6a4a2a', dark: '4a3018' }] },
  silhouette: '갈색 작업복, 넓은 어깨.',
  bubbles: {},
  schedule: [{ from: '08:00', at: [10, 17], task: '(짐을 나른다)' }, { from: '12:00', at: [31, 18], face: 'down', say: ['북쪽 길로 오는 짐이 반으로 줄었어.'] }, { from: '18:00', home: true }],
  remnant: null,
};
