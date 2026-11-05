// 세이 (가칭) — 옆 마을의 무녀. 호라의 사당을 지킨다. 지워진 왕국의 마지막 공주라는 건 본인도 모른다(docs/스토리.md)
// 갓난아이 때 회장이 안고 국경을 넘었다. 지워진 것을 기도 속에서 어렴풋이 느낀다
export default {
  id: 'sei',
  name: '세이',
  role: '옆 마을의 무녀',
  age: 20,
  color: '#e88a8a',
  erasable: false,
  home: 'neighbor',
  // 필드 스프라이트: 'Princess' 바탕(미아와 같은 바탕)을 흰 저고리·붉은 치마로, 검은 머리에 붉은·흰 머리띠를 덧그렸다
  sprite: {
    base: 'Princess',
    shareBase: 'mia',
    recolor: { a3754e: 'e8b48a', '965340': 'c8906a', f1c471: 'f4f0f4', d78b4a: 'cfc8d8', '8d977f': 'b8323a', abc2bc: 'd85a5a', e0394c: 'd23a3a' },
    edits: [{ type: 'headband' }],
  },
  silhouette: '검은 긴 머리에 붉은·흰 머리띠. 흰 저고리, 붉은 치마.',
  bubbles: {},
  // 아침엔 사당을 쓸고, 낮엔 마을을 돌며 사람들의 이야기를 듣고, 해 질 녘 다시 사당에 등불을 건다
  // 4장: 순례로 소집 길에 합류하면 옆 마을에 없다
  away: { ifFlag: 'ch4.sei_joined' },
  schedule: [
    { from: '06:00', at: 'shrine', face: 'up', say: ['호라께서 오늘도 맡아 주시기를.'] },
    { from: '11:00', at: 'plaza', mode: 'wander', radius: 3, say: ['오늘은 바람이 조용하네요.'] },
    { from: '16:00', at: 'well', mode: 'wander', radius: 2 },
    { from: '18:00', at: 'shrine', task: '(사당 처마에 등불을 건다)' },
    { from: '20:00', home: true },
  ],
  remnant: null,
};
