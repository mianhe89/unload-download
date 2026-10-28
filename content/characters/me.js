// 나 — 주인공
export default {
  id: 'me',
  name: '나',
  role: '주인공',
  color: '#e8e4f0',
  erasable: false,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["short"],
    pal: { h: '#6b4a3a', H: '#4a3128', c: '#5a7aa6', C: '#3f5a80', a: '#a87a4a', p: '#4a4a5a', b: '#3a2a22' },
  },
  silhouette: '짧은 갈색 머리, 파란 튜닉. 일부러 특징을 덜 줬다(플레이어가 자신을 겹쳐 보도록).',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
