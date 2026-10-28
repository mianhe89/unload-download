// 리네 — 꽃집 아가씨
export default {
  id: 'rine',
  name: '리네',
  role: '꽃집 아가씨',
  color: '#ffd1a6',
  erasable: true,   // 로드 시 지워질 수 있는가
  art: {
    layers: ["long", "flowerCrown"],
    pal: { h: '#f0cc6a', H: '#c8a040', c: '#6aa860', C: '#4a8044', a: '#f6f0e0', p: '#6a8a5a', b: '#5a4030', f: '#f07aa0', l: '#5aa04a' },
  },
  silhouette: '긴 금발과 화관. 머리 위 점점이 박힌 분홍 꽃.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["꽃 사세요!", "오늘만 반값!"], "morning": ["주인 없는 화관이 하나 남았어."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'crown', text: "시든 화관 하나. 이 마을엔 꽃집이 없다고 한다." },
};
