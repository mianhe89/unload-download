// 호르트 — 빵집 주인
export default {
  id: 'hort',
  name: '호르트',
  role: '빵집 주인',
  color: '#f2c98a',
  erasable: true,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Inspector'를 바탕으로 변형 (흰 모자는 제빵사 모자로 그대로, 갈색 코트를 크림색 앞치마로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Inspector',
    recolor: { a3754e: 'efe6d2', '91522c': 'cbb994' },
    edits: [],
  },
  silhouette: '부푼 흰 제빵사 모자와 콧수염. 모자 덕에 머리가 가장 둥글고 크다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["꿀빵 마지막 판이다!", "식기 전에 먹어!"], "morning": ["오늘은 호두빵이다.", "…왜 탄 빵을 모아뒀지?"]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'crate', text: "빵 냄새가 날 것 같은 빈 좌판. 아무도 이 자리를 쓴 적이 없다고 한다." },
};
