// 루 — 떠돌이 마법사
export default {
  id: 'lu',
  name: '루',
  role: '떠돌이 마법사',
  color: '#c9a6ff',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'SorcererBlack'를 바탕으로 변형 (붉은 머리를 라벤더로, 로브를 보라로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'SorcererBlack',
    recolor: { e0394c: 'c8a8f0', '8f3e56': '8f6fc8', '4e484a': '4a3a6a', '5f7160': '33284a' },
    edits: [],
  },
  silhouette: '라벤더색 큰 올림머리와 보라 로브. 머리 위로 솟은 올림머리가 가장 높은 실루엣.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"morning": ["가장자리가 흐릿하네."], "aftermath": ["치우는 소리가 커졌어."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
