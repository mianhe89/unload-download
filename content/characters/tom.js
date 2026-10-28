// 톰 — 경비병
export default {
  id: 'tom',
  name: '톰',
  role: '경비병',
  color: '#a8d8a0',
  erasable: true,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["helmet"],
    pal: { h: '#5a4a3a', H: '#3a3028', c: '#4a7a4a', C: '#335a33', a: '#c8a040', p: '#4a4038', b: '#2a2420', k: '#a8b0b8', K: '#78808a' },
  },
  silhouette: '철모와 볼 가리개. 녹색 경비 조끼.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["불 너무 키우지 마라!", "지루한 게 최고야."], "morning": ["이상 무.", "…이 얘기 아까 했나?"]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'emptyStall', text: "아무도 서 있지 않은 초소. 이 마을은 원래 경비가 필요 없을 만큼 조용했다고 한다." },
};
