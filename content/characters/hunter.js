// 이반 — 사냥꾼 (배경 주민)
export default {
  id: 'hunter',
  name: '이반',
  role: '사냥꾼',
  color: '#a8c8a0',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Hunter'를 바탕으로 변형 (파란 옷을 숲빛 녹색으로)
  sprite: {
    base: 'Hunter',
    recolor: { '4a5270': '3f5a3a', '548789': '5a7a4a', '79b8ce': '8aa86a' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["숲 너머는 안 가는 게 좋아.", "사슴이 요즘 안 보여."], "morning": ["안개가 어제보다 가까워.", "숲길 끝이 뿌옇게 지워져 있어."], "aftermath": ["사냥길이 하나 없어졌어. 지도엔 있는데."]},
  remnant: null,
};
