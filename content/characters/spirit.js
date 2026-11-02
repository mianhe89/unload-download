// 정신체 — 길 위의 흐릿한 사람 (길 맵의 떠돌이)
export default {
  id: 'spirit',
  name: '정신체',
  role: '길 위의 흐릿한 사람',
  color: '#b9a8ff',
  erasable: false,
  background: true,
  traveler: true, // 마을이 아니라 길 맵에 가끔 나타난다 (content/world/travelers.js)
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Spirit'를 바탕으로 변형 (하늘색 몸을 보랏빛으로)
  sprite: {
    base: 'Spirit',
    recolor: { '79b8ce': 'b9a8ff', '9ba7aa': '8a7ac8' },
    edits: [],
  },
  bubbles: {},
  remnant: null,
};
