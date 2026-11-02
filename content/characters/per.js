// 페르 — 늙은 음유시인
export default {
  id: 'per',
  name: '페르',
  role: '늙은 음유시인',
  color: '#d6c79e',
  erasable: true,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'OldMan2'를 바탕으로 변형 (빨간 모자를 낡은 갈색 챙모자로, 외투를 바랜 빨강으로, 모자에 깃털을 그려 넣음)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'OldMan2',
    recolor: { e0394c: '8a6a48', '8f3e56': '5a4630', d14b34: 'a04848' },
    edits: [{ type: 'feather' }],
  },
  silhouette: '깃털 꽂은 챙모자와 흰 수염. 바랜 붉은 외투.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"festival": ["♪ 북쪽 끝, 검은 성에…", "좋은 노래는 닳지 않지."], "morning": ["노래 한 소절이 비는군."]},
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: { prop: 'lute', text: "주인 없는 류트. 마왕 노래를 아는 사람은 이제 없다." },
};
