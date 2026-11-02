// 나그네 — 눈길의 나그네 (길 맵의 떠돌이)
export default {
  id: 'wanderer',
  name: '나그네',
  role: '눈길의 나그네',
  color: '#d8c0a0',
  erasable: false,
  background: true,
  traveler: true, // 마을이 아니라 길 맵에 가끔 나타난다 (content/world/travelers.js)
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Eskimo'를 바탕으로 변형 (푸른 털옷을 갈색 모피로)
  sprite: {
    base: 'Eskimo',
    recolor: { '2d697b': '6a4a3a', '548789': '8a6a4a' },
    edits: [],
  },
  bubbles: {},
  remnant: null,
};
