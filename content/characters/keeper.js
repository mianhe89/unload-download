// ??? — 정리자
export default {
  id: 'keeper',
  name: '???',
  role: '정리자',
  color: '#8a8a8a',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'NinjaDark'를 바탕으로 변형 (몸을 외곽선보다 어두운 검정으로, 눈을 하늘색 발광으로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'NinjaDark',
    recolor: { '5f7160': '24222e', '4e484a': '1a1820', '3b3643': '121018', d14b34: '6ad0f0', ef914f: 'b8f0ff' },
    edits: [],
  },
  silhouette: '얼굴 없는 두건. 눈 두 점만 빛난다. 유일하게 외곽선보다 어두운 몸.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
