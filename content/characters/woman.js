// 엘사 — 마을 사람 (배경 주민)
export default {
  id: 'woman',
  name: '엘사',
  role: '마을 사람',
  color: '#e0b0c8',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Villager2'를 바탕으로 변형 (파란 옷을 자두색으로)
  sprite: {
    base: 'Villager2',
    recolor: { '4a5270': '7a4a6a', '548789': 'a87a9a' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["우리 핀 못 봤어요?", "화관이 올해는 더 예쁘네."], "morning": ["빨래가 잘 마르겠네.", "핀이 어제 종을 세다 잠들었대요."], "aftermath": ["…이건 누구 빨래였지?", "우리 집 옆집이 원래 비어 있었나?"]},
  remnant: null,
};
