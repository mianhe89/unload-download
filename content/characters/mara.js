// 마라 — 성 아랫마을 시장의 상인. 수다스럽고 셈이 빠르다. 소집 때문에 장사가 잘되지만, 장부의 이름이 자꾸 빈다.
export default {
  id: 'mara', name: '마라', role: '시장 상인', age: 29, color: '#e8c070', erasable: true, home: 'lordtown',
  // 필드 스프라이트: 'Woman' 바탕(리네와 같은 바탕)에 초록 머릿수건을 덧그렸다
  sprite: { base: 'Woman', shareBase: 'rine', recolor: {}, edits: [{ type: 'headband', color: '4a8a4a' }] },
  silhouette: '초록 머릿수건, 큰 장바구니.',
  bubbles: { lordtown: ['소집 덕에 화살촉이 불티나요!', '외상 장부에 이름이… 또 비었네.'] },
  schedule: [
    { from: '07:00', at: 'market', face: 'down', say: ['장 열었어요!'] },
    { from: '18:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
