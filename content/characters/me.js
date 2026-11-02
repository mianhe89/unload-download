// 나 — 주인공
export default {
  id: 'me',
  name: '나',
  role: '주인공',
  color: '#e8e4f0',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Boy'를 바탕으로 변형 (갈색 머리, 하늘색 셔츠와 남색 바지로 바꿈 (플레이어가 자신을 겹쳐 보도록 무난하게))
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Boy',
    recolor: { d14b34: '7a5236', '965340': '4f3326', e3f1f5: '9cc0e6', '548789': '3f5a80' },
    edits: [],
  },
  silhouette: '짧은 갈색 머리, 파란 튜닉. 일부러 특징을 덜 줬다(플레이어가 자신을 겹쳐 보도록).',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
