// 페르 — 늙은 음유시인
export default {
  id: 'per',
  name: '페르',
  role: '늙은 음유시인',
  color: '#d6c79e',
  erasable: true,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["featherHat", "beard"],
    pal: { h: '#e8e4dc', H: '#b8b0a4', c: '#8a3a3a', C: '#682828', a: '#d8b860', p: '#4a3a3a', b: '#2a2020', k: '#5a4a3a', K: '#3f3428', r: '#e05a4a' },
  },
  silhouette: '깃털 꽂은 챙모자와 흰 수염. 바랜 붉은 외투.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["♪ 북쪽 끝, 검은 성에…", "좋은 노래는 닳지 않지."], "morning": ["노래 한 소절이 비는군."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'lute', text: "주인 없는 류트. 마왕 노래를 아는 사람은 이제 없다." },
};
