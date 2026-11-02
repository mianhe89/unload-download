// 셀레나 — 기사단 선배
export default {
  id: 'selena',
  name: '셀레나',
  role: '기사단 선배',
  color: '#9fc3ff',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Villager4'를 바탕으로 변형 (금발 단발을 은발로, 붉은 옷을 강철 회색으로 (볼 홍조 색은 그대로 둠))
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Villager4',
    recolor: { f1c471: 'e4e9f2', d78b4a: 'a9b4cc', d14b34: '7a8496', '8f3e56': '4f5868' },
    edits: [],
  },
  // (예전 코드 생성 픽셀. 타이틀 미리보기 도구용으로만 남김)
  art: {
    layers: ["bob"],
    pal: { h: '#c6d2e8', H: '#8f9fbd', c: '#9aa4b4', C: '#6a7486', a: '#3f6fc8', p: '#3a4250', b: '#2a2e38' },
  },
  silhouette: '은빛 단발과 강철 흉갑. 몸통이 가장 밝은 회색이다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"morning": ["용건은 짧게."], "aftermath": ["명부의 빈 줄이 늘었다."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
