// 리네 — 꽃집 아가씨
export default {
  id: 'rine',
  name: '리네',
  role: '꽃집 아가씨',
  color: '#ffd1a6',
  erasable: true,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'Woman'를 바탕으로 변형 (옷을 초록으로, 머리 위에 꽃 화관을 그려 넣음)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'Woman',
    recolor: { '548789': '4a8044', '79b8ce': '6aa860' },
    edits: [{ type: 'crown' }],
  },
  silhouette: '긴 금발과 화관. 머리 위 점점이 박힌 분홍 꽃.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["꽃 사세요!", "오늘만 반값!"], "morning": ["주인 없는 화관이 하나 남았어."]},
  // 하루 일과. 아침에 꽃밭을 열고, 한낮엔 우물에서 물을 길어 오고, 해 질 녘 꽃 수레를 덮고 꽃집으로
  schedule: [
    { from: '08:00', at: 'flowerBed', face: 'down', say: ['꽃 사세요~ 오늘 새로 핀 거 있어요!'] },
    { from: '12:00', at: 'well', task: '(물뿌리개에 물을 긷는다)' },
    { from: '12:30', at: 'flowerBed', face: 'down' },
    { from: '17:30', at: 'flowerBed', task: '(꽃 수레에 덮개를 씌운다)' },
    { from: '18:00', home: true },
  ],
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'crown', text: "시든 화관 하나. 이 마을엔 꽃집이 없다고 한다." },
};
