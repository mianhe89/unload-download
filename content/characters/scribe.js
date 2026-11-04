// 헤스퍼 — 기록하는 마을의 기록관. 처음엔 사람들을 지키려고 이름을 적게 했다. 지금은 적지 않는 사람을 의심한다.
export default {
  id: 'scribe', name: '헤스퍼', role: '기록관', age: 52, color: '#a8b8d8', erasable: true, home: 'ledger',
  // 필드 스프라이트: 'Monk' 바탕(수도사와 같은 바탕)에 잉크 빛 망토를 덧그렸다
  sprite: { base: 'Monk', shareBase: 'monk', recolor: {}, edits: [{ type: 'cape', color: '2a2e4a', dark: '1a1e32' }] },
  silhouette: '수도사 차림에 잉크 빛 망토, 손에 장부.',
  bubbles: { ledger: ['오늘 이름은 적었나?', '적지 않으면, 없는 사람이야.'] },
  schedule: [
    { from: '06:00', at: 'board', face: 'up', say: ['아침 명부를 붙인다.'] },
    { from: '12:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '15:00', at: 'board', face: 'up' },
    { from: '20:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
