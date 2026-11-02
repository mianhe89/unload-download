// 안셀름 — 수도사 (배경 주민)
export default {
  id: 'monk',
  name: '안셀름',
  role: '수도사',
  color: '#d8c0a0',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Monk'를 바탕으로 변형 (녹색 법의를 갈색으로)
  sprite: {
    base: 'Monk',
    recolor: { '56864c': '7a5a3a', '345a52': '5a3f28' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["축복이 함께하길.", "종은 열두 번 울리는 법이지."], "morning": ["종이 한 번 더 울렸다는 아이가 있더군.", "종탑 열쇠는 나만 갖고 있는데."], "aftermath": ["기도문 한 구절이 기억나지 않네.", "종탑 벽에 누가 글씨를 새겼어."]},
  remnant: null,
};
