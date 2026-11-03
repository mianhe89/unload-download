// 유나 — 서리 마을의 젊은 파수꾼. 22세. 망루에서 산다. 눈이 가장 좋아서 오크를 제일 먼저 본다.
// 남쪽 마을들을 동경한다. "거긴 겨울이 끝난다며?"
export default {
  id: 'yuna',
  name: '유나',
  role: '망루 파수꾼',
  age: 22,
  color: '#e8a0a0',
  erasable: true,
  home: 'frost',
  // 필드 스프라이트: 'Knight' 바탕(톰과 같은 바탕)에 붉은 망토를 덧그렸다
  sprite: { base: 'Knight', shareBase: 'tom', recolor: { '4e484a': '6a3a3a', '3b3643': '4a2a2a' }, edits: [{ type: 'cape', color: '8a2a2a', dark: '5a1a1a' }] },
  silhouette: '철모에 붉은 망토. 작은 몸집.',
  bubbles: { frost: ['저기 북쪽, 연기 보여요? …아, 구름이구나.', '남쪽은 정말 겨울이 끝나요?'] },
  schedule: [
    { from: '05:00', at: 'towerFoot', face: 'up', say: ['교대! 망루 올라갑니다.'] },
    { from: '12:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '14:00', at: 'towerFoot', face: 'up' },
    { from: '23:00', home: true },
  ],
  remnant: { prop: 'crate' },
};
