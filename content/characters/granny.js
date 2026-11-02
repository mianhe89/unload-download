// 마르타 — 할머니 (배경 주민)
export default {
  id: 'granny',
  name: '마르타',
  role: '할머니',
  color: '#d8c8e0',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'OldWoman'를 바탕으로 변형 (보라 머리를 백발로, 옷을 갈색으로)
  sprite: {
    base: 'OldWoman',
    recolor: { a5608b: '9a9aa4', d3a2c0: 'd2d2d8', '548789': '8a5a3a', '2d697b': '6a4228' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["젊을 땐 나도 밤새 춤췄지.", "모닥불은 오래 볼수록 따뜻해."], "morning": ["아침 바람이 차구나.", "어젯밤 종소리가 길었지?"], "aftermath": ["요즘은 이름이 자꾸 혀끝에서 맴돌아.", "누굴 부르려다 잊었어."]},
  remnant: null,
};
