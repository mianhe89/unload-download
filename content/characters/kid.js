// 핀 — 아이 (배경 주민)
export default {
  id: 'kid',
  name: '핀',
  role: '아이',
  color: '#ffd890',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Child'를 바탕으로 변형 (녹색 모자를 빨간 모자로)
  sprite: {
    base: 'Child',
    recolor: { '5f7160': 'b04a34' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["불꽃 봤어? 봤어?", "나도 화관 갖고 싶다!", "종 몇 번 치는지 셀 거야!"], "morning": ["종 세다가 잠들었어. 열둘까진 셌는데.", "형, 대장간 무서워. 아무도 없어."], "aftermath": ["형, 여기 원래 뭐 있었어?", "숨바꼭질하는데 한 명이 안 나와."]},
  remnant: null,
};
