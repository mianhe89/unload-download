// 구스타프 — 노인 (배경 주민)
export default {
  id: 'oldman',
  name: '구스타프',
  role: '노인',
  color: '#d0d0b0',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'OldMan'를 바탕으로 변형 (녹색 모자와 파란 옷을 갈색·적갈색으로)
  sprite: {
    base: 'OldMan',
    recolor: { '5f7160': '6a5a4a', '8d977f': '8a7a6a', '548789': '8a3a3a', '79b8ce': 'a85a5a' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["사과주 한 잔 더!", "페르 영감 노래는 언제 들어도 좋아."], "morning": ["머리가 지끈지끈하구먼.", "어제 누구랑 마셨더라."], "aftermath": ["광장이 이렇게 넓었던가.", "혼자 마시는 술은 맛이 없어."]},
  remnant: null,
};
