// 오크 전사 — 북쪽 회색 고원에서 내려온 부족 '잿빛 엄니'(가칭)의 전사. 습격(content/raids.js) 때만 나타난다.
// 그들의 고원이 안개에 먹혀 겨울 식량이 없다. 사람을 죽이러 온 게 아니라 곡식을 가지러 왔다(docs/스토리.md '축 4 · 습격')
export default {
  id: 'orc',
  name: '오크 전사',
  role: '잿빛 엄니 부족의 전사',
  color: '#7aa85a',
  erasable: false,
  extra: true,     // 대화 없는 상대(말풍선만)
  monster: true,
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Hunter' 바탕에 초록 피부, 어두운 가죽, 아래턱의 엄니
  sprite: {
    base: 'Hunter',
    shareBase: 'hunter',
    recolor: { ef914f: '7aa85a', fce2ca: 'a8d488', d14b34: '4a3a2a', '8f3e56': '2e241c', c8966b: '5a8040' },
    edits: [{ type: 'tusks' }],
  },
  silhouette: '초록 피부에 아래로 솟은 엄니, 어두운 가죽 차림.',
  bubbles: {},
  // 싸우는 동안 하는 말. 오크 말이지만 인간 말을 조금 섞는다
  barks: ['크르… 곡식!', '흰 아가리가 온다… 비켜라!', '겨울… 먹을 것!', '(몽둥이를 치켜든다)'],
  fleeBarks: ['크악! 물러나!', '(곡식 자루를 떨어뜨리고 달아난다)', '…다음엔 더 많이 온다.'],
  remnant: null,
};
