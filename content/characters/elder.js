// 옆 마을 회장 — 68세. 지워진 왕국의 시종이었다. 왕국이 지워지던 날 갓난아이 세이를 안고 국경을 넘었다.
// 그 이야기를 할 때만 세이를 보지 않는다(docs/스토리.md '2장 · 안개 너머')
export default {
  id: 'elder',
  name: '회장',
  role: '옆 마을 회장',
  age: 68,
  color: '#c8b48a',
  erasable: true,
  home: 'neighbor',
  // 필드 스프라이트: 'OldMan3' 바탕(떠돌이 상인과 같은 바탕)을 잿빛 옷으로, 등에 낡은 시종 망토를 덧그렸다
  sprite: {
    base: 'OldMan3',
    shareBase: 'merchant',
    recolor: { f1c471: '6a5a48', '3b3643': '3a3644' },
    edits: [{ type: 'cape', color: '6a4a2e', dark: '4a321e' }],
  },
  silhouette: '흰 수염의 노인. 잿빛 옷에 낡은 갈색 망토.',
  bubbles: {},
  schedule: [
    { from: '07:00', at: 'elderDoor', face: 'down', say: ['아침 바람이 차구먼.'] },
    { from: '10:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '15:00', at: 'shrine', face: 'up', say: ['…'] },
    { from: '19:00', home: true },
  ],
  remnant: { prop: 'bench' },
};
