// 셀레나 — 기사단 선배
export default {
  id: 'selena',
  name: '셀레나',
  role: '기사단 선배',
  color: '#9fc3ff',
  erasable: false,   // 로드 시 지워질 수 있는가
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
