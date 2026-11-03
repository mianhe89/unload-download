// 미아 — 소꿉친구
export default {
  id: 'mia',
  name: '미아',
  role: '소꿉친구',
  color: '#ffb3c8',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Princess'를 바탕으로 변형 (검은 머리를 주황으로, 머리 장식을 분홍으로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Princess',
    recolor: { '3b3643': 'a5532c', '4e484a': 'd0703e', e0394c: 'e0607e' },
    edits: [],
  },
  silhouette: '양 갈래 머리. 머리 옆으로 튀어나온 두 덩이가 멀리서도 보인다.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["벌금이다, 벌금!", "꿀빵 냄새 난다…", "같이 다녀~"], "morning": ["괜찮아?", "어제 사과주 많이 마셨지?"], "aftermath": ["…또 그 얼굴이다."]},
  // 하루 일과. 아침 광장 산책, 점심엔 빵집, 오후엔 꽃밭에서 리네와 수다, 저녁에 광장, 밤엔 미아네 집
  schedule: [
    { from: '07:30', at: 'plaza', mode: 'wander', radius: 3, say: ['좋은 아침! 오늘 뭐 해?'] },
    { from: '11:30', at: 'bakeryStall', task: '(꿀빵을 하나 산다)' },
    { from: '13:00', at: 'flowerBed', mode: 'wander', radius: 1, say: ['리네 언니네 꽃, 오늘 예쁘다.'] },
    { from: '17:00', at: 'plaza', mode: 'wander', radius: 2 },
    { from: '20:00', home: true },
  ],
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
