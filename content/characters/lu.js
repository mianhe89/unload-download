// 루 — 떠돌이 마법사
export default {
  id: 'lu',
  name: '루',
  role: '떠돌이 마법사',
  color: '#c9a6ff',
  erasable: false,   // 로드 시 지워질 수 있는가
  // 필드 스프라이트: Ninja Adventure 팩(CC0)의 'SorcererBlack'를 바탕으로 변형 (붉은 머리를 라벤더로, 로브를 보라로)
  // recolor: 원본색 → 바꿀색 (# 없이 6자리), edits: 픽셀 덧그리기. 결과는 npm run assets로 만든다
  sprite: {
    base: 'SorcererBlack',
    recolor: { e0394c: 'c8a8f0', '8f3e56': '8f6fc8', '4e484a': '4a3a6a', '5f7160': '33284a' },
    edits: [],
  },
  silhouette: '라벤더색 큰 올림머리와 보라 로브. 머리 위로 솟은 올림머리가 가장 높은 실루엣.',
  // 페이즈별로 근처에 가면 머리 위에 뜨는 혼잣말
  bubbles: {"morning": ["가장자리가 흐릿하네."], "aftermath": ["치우는 소리가 커졌어."]},
  // 하루 일과. 집이 없는 떠돌이라 낮엔 우물가, 해 질 녘엔 마을 끝에서 숲 너머를 보고, 밤엔 종탑 앞에서 비질 소리에 귀를 기울인다.
  // 셀레나와 이야기한 뒤(프롤로그 3일 아침)부터 마을에 있다
  schedule: [
    { from: '09:00', at: 'well', mode: 'wander', radius: 2, say: ['숲 너머가 흐릿하네. 원래 저랬나?'], when: { ifFlag: 'selena.done' } },
    { from: '17:00', at: [6, 27], face: 'left', say: ['해 질 녘엔 안개가 더 잘 보여.'], when: { ifFlag: 'selena.done' } },
    { from: '22:00', at: [24, 10], face: 'up', task: '(종탑 쪽에 귀를 기울인다)', when: { ifFlag: 'selena.done' } },
    { from: '22:05', at: [24, 10], face: 'up', when: { ifFlag: 'selena.done' } },
  ],
  // 지워진 뒤 그 자리에 남는 흔적
  remnant: null,
};
