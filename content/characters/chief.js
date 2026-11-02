// 바르톨 — 촌장 (배경 주민)
export default {
  id: 'chief',
  name: '바르톨',
  role: '촌장',
  color: '#e0b0b8',
  erasable: false,
  background: true, // 이야기의 중심은 아니지만 마을을 살아 있게 한다
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Noble'를 바탕으로 변형 (검은 모자를 촌장의 포도주색 모자로)
  sprite: {
    base: 'Noble',
    recolor: { '4e484a': '6a2e3a', '3b3643': '4a1e2a' },
    edits: [],
  },
  // 페이즈별 혼잣말 (가까이 가거나 E로 말을 걸면)
  bubbles: {"festival": ["올해는 불 근처에 안 간다. 수염이 아깝거든.", "자네 아버지 지붕 솜씨는 아직도 최고야."], "morning": ["축제 뒷정리가 산더미군.", "명부 정리는 셀레나가 하지."], "aftermath": ["명부를 보는데… 뭔가 빠진 기분이야.", "광장이 좀 넓어진 것 같지 않나?"]},
  remnant: null,
};
