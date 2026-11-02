// 톰 — 경비병
export default {
  id: 'tom',
  name: '톰',
  role: '경비병',
  color: '#a8d8a0',
  erasable: true,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Knight'를 바탕으로 변형 (투구는 그대로, 몸통 어두운 부분을 녹색 경비 조끼로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Knight',
    recolor: { '4e484a': '4a7a4a', '3b3643': '335a33' },
    edits: [],
  },
  silhouette: '철모와 볼 가리개. 녹색 경비 조끼.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["불 너무 키우지 마라!", "지루한 게 최고야."], "morning": ["이상 무.", "…이 얘기 아까 했나?"]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'barrel', text: "아무도 서 있지 않은 초소. 이 마을은 원래 경비가 필요 없을 만큼 조용했다고 한다." },
};
