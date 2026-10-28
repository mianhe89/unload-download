// 미아 — 소꿉친구
export default {
  id: 'mia',
  name: '미아',
  role: '소꿉친구',
  color: '#ffb3c8',
  erasable: false,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["short", "pigtails"],
    pal: { h: '#d0703e', H: '#a5532c', c: '#f1e3c8', C: '#cdb995', a: '#e0607e', p: '#b0846a', b: '#6a4030' },
  },
  silhouette: '양 갈래 머리. 머리 옆으로 튀어나온 두 덩이가 멀리서도 보인다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["벌금이다, 벌금!", "꿀빵 냄새 난다…", "같이 다녀~"], "morning": ["괜찮아?", "어제 사과주 많이 마셨지?"], "aftermath": ["…또 그 얼굴이다."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
