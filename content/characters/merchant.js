// 떠돌이 상인 — 짐을 진 상인 (길 맵의 떠돌이)
export default {
  id: 'merchant',
  name: '떠돌이 상인',
  role: '짐을 진 상인',
  color: '#e0c070',
  erasable: false,
  background: true,
  traveler: true, // 마을이 아니라 길 맵에 가끔 나타난다 (content/world/travelers.js)
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'OldMan3'를 바탕으로 변형 (노란 옷을 짙은 황토색으로, 보라 띠를 붉게)
  sprite: {
    base: 'OldMan3',
    recolor: { f1c471: 'c9a24a', '3b3643': '7a2e2e' },
    edits: [],
  },
  bubbles: {},
  remnant: null,
};
