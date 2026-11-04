// 노엘 (가칭) — 북쪽 얼음성의 여자. 27세. 얼음 마법. 자기 성을 얼려 시간을 멈췄다. 얼음 안에서는 아무것도 사라지지 않는다.
// 그녀가 무엇을 잃었는지, 왜 얼렸는지는 아직 아무도 모른다(docs/스토리.md '열린 질문').
export default {
  id: 'noel', name: '노엘', role: '얼음성의 여자', age: 27, color: '#b8e0f8', erasable: false, home: 'icecastle',
  // 필드 스프라이트: 'Princess' 바탕(미아와 같은 바탕)을 얼음빛으로, 서리 망토를 덧그렸다
  sprite: {
    base: 'Princess', shareBase: 'mia',
    recolor: { '3b3643': 'b8d8ec', '4e484a': 'e4f2fc', f1c471: 'a8d0f0', d78b4a: '6a9ad0', '8d977f': '5a84b8', abc2bc: '8ab4e0', e0394c: 'e8f6ff' },
    edits: [{ type: 'cape', color: 'eaf6ff', dark: 'b0d0ec' }],
  },
  silhouette: '은백색 긴 머리, 얼음빛 드레스, 서리 망토.',
  bubbles: { icecastle: ['여기선 아무것도 늙지 않아.', '…추워? 금방 익숙해져.'] },
  remnant: null,
};
