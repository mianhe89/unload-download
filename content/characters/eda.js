// 에다 — 대장장이의 딸
export default {
  id: 'eda',
  name: '에다',
  role: '대장장이의 딸',
  color: '#ff9e7a',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 대본상 수확제 밤 뒤로는 세상에서 사라져 있다. 마을 사람은 이 이름을 제대로 발음하지 못한다
  gone: { notInPhases: ['festival'] },
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Villager5'를 바탕으로 변형 (초록 모자를 주황 두건으로, 옷을 가죽 앞치마 색으로, 머리를 붉은 갈색으로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Villager5',
    recolor: { '56864c': 'e07a30', a8a129: 'f2a65a', d14b34: '8a5a3a', '8f3e56': '6a4228', '3b3643': '8a2e24', '4e484a': 'a8402e' },
    edits: [],
  },
  silhouette: '주황 두건 위 보안경, 가죽 앞치마. 그을린 색 계열로만 칠했다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["찾았다."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
