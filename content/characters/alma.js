// 알마 — 물레방아 마을에서 '빗자루 든 그림자'(정리자)를 섬기는 사람들의 중심. 지쳐 있다. 남편과 아이를 잃었는데,
// 잃은 게 누구였는지 기억나지 않는다. 그래서 지워짐을 구원이라 믿는다: 잊으면 아프지 않으니까.
export default {
  id: 'alma', name: '알마', role: '빗자루 제단을 지키는 여인', age: 38, color: '#b8b0c8', erasable: true, home: 'mill',
  // 필드 스프라이트: 'Villager5' 바탕(에다와 같은 바탕)에 잿빛 두건 망토를 덧그렸다
  sprite: { base: 'Villager5', shareBase: 'eda', recolor: { '56864c': '8a8a94', a8a129: 'a8a8b0', d14b34: '6a6a74' }, edits: [{ type: 'cape', color: 'a8a8b0', dark: '7a7a84' }] },
  silhouette: '잿빛 두건, 잿빛 망토.',
  bubbles: { mill: ['쓸어 주시기를.', '잊으면 아프지 않아요.'] },
  schedule: [
    { from: '06:00', at: 'altar', face: 'up', say: ['오늘도 쓸어 주시기를.'] },
    { from: '13:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '16:00', at: 'altar', face: 'up' },
    { from: '21:00', home: true },
  ],
  remnant: { prop: 'bench' },
};
