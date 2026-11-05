// 브람 — 견습 동기. 같이 견습에 붙은 동기. 대장장이가 되고 싶었는데 마을에 대장간이 없다.
export default {
  id: 'bram', name: '브람', role: '견습 동기', age: 20, color: '#a07050', erasable: false, background: true,
  sprite: { base: 'Boy', shareBase: 'me', recolor: { d14b34: '3a2a1a', '965340': '2a1a10', e3f1f5: 'd0b090', '548789': '6a4a2a' }, edits: [{ type: 'cape', color: '5a3a22', dark: '3a2414' }] },
  silhouette: '검은 머리, 가죽 조끼.',
  bubbles: {},
  schedule: [{ from: '07:30', at: [33, 28], face: 'up', say: ['오늘도 루 선생한테 굴렀어?'] }, { from: '13:00', at: [13, 22], task: '(목검을 휘두른다)' }, { from: '20:00', home: true }],
  remnant: null,
};
