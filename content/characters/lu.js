// 루 — 떠돌이 마법사
export default {
  id: 'lu',
  name: '루',
  role: '떠돌이 마법사',
  color: '#c9a6ff',
  erasable: false,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["long", "wizHat"],
    pal: { h: '#c8b0f0', H: '#9a7fc8', c: '#4a3a6a', C: '#33284a', a: '#e8c860', p: '#33284a', b: '#2a2038', k: '#5a3f8a', K: '#3f2a66' },
  },
  silhouette: '챙 넓은 고깔모자. 머리 위로 삐죽 솟은 끝이 가장 높은 실루엣.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"morning": ["가장자리가 흐릿하네."], "aftermath": ["치우는 소리가 커졌어."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
