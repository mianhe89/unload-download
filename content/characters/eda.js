// 에다 — 대장장이의 딸
export default {
  id: 'eda',
  name: '에다',
  role: '대장장이의 딸',
  color: '#ff9e7a',
  erasable: false,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["short", "bandana"],
    pal: { h: '#8a2e24', H: '#5e1e18', c: '#8a5a3a', C: '#6a4228', a: '#c8c8c8', p: '#4a3a30', b: '#2a201a', k: '#e07a30', K: '#b45a1e', g: '#9ad0e8' },
  },
  silhouette: '주황 두건 위 보안경, 가죽 앞치마. 그을린 색 계열로만 칠했다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["찾았다."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
