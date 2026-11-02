// 오토 — 농부 (배경 주민)
export default {
  id: 'farmer',
  name: '오토',
  role: '농부',
  color: '#c8d890',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Villager3'를 바탕으로 변형 (녹색 옷을 짚단 색으로)
  sprite: {
    base: 'Villager3',
    recolor: { '56864c': '7a6a3a', a8a129: 'c8a85a' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["올해 밀은 풍년이야.", "허수아비한테도 사과주 한 잔."], "morning": ["허수아비가 밤새 방향을 바꿨어.", "건초 더미가 하나 모자란데."], "aftermath": ["밭 한쪽이 비었어. 누가 갈았는지 기억이 안 나."]},
  remnant: null,
};
