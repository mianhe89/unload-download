// ??? — 정리자
export default {
  id: 'keeper',
  name: '???',
  role: '정리자',
  color: '#8a8a8a',
  erasable: false,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["hood"],
    pal: { h: '#1a1820', H: '#1a1820', c: '#1e1c26', C: '#121018', a: '#3a3648', p: '#121018', b: '#0a0a10', k: '#24222e', K: '#121018', q: '#b8f0ff' },
  },
  silhouette: '얼굴 없는 두건. 눈 두 점만 빛난다. 유일하게 외곽선보다 어두운 몸.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
