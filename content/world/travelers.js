// 길 맵의 떠돌이. 마을이 아니라 길 위에서 가끔 만난다.
// 칸·날짜로 정해진다: 같은 날 같은 칸이면 같은 사람이 있다 (다음 날엔 다를 수 있다).
//   spirit    정신체. 이 세계 바깥에서 온 흐릿한 사람(기획서 '정신체 네트워크').
//             결정적이지 않은 작은 도움만 준다: 근처에 아직 아무도 안 간 곳의 방향.
//             마을 사람과 달리 지워진 이름을 온전히 말한다.
//   wanderer  추운 길의 나그네
//   merchant  따뜻한 길의 떠돌이 상인
// 글 안의 {hint}는 정신체의 방향 힌트, {lastErased}는 가장 최근에 지워진 사람 이름.
export const TRAVELERS = {
  spirit: {
    chance: 0.18,
    biomes: null, // 어디서든 (지하·은하 포함)
    lines: [
      '…{hint}',
      '나도 누굴 찾고 있었는데, 이름이 생각 안 나.',
      { text: '{lastErased}. 그 이름, 너만 기억하는 거 아니야.', ifErasedAny: true },
      '오래 있으면 안 돼. 나는 원래 여기 없는 사람이니까.',
    ],
  },
  wanderer: {
    chance: 0.3,
    biomes: ['frost', 'snow', 'blackSnow', 'lateAutumn'],
    lines: [
      '북쪽은 해가 짧아. 아니, 없어.',
      '눈 위 발자국은 금방 지워져. 사람도 그래.',
      '서리 마을에선 아무도 이름을 묻지 않아. 잊어버릴까 봐.',
    ],
  },
  merchant: {
    chance: 0.3,
    biomes: ['temperate', 'lateAutumn', 'dry', 'desert', 'coast', 'deepForest'],
    lines: [
      '물건 볼래? …미안, 오늘은 팔 게 없어. 다 누가 사 갔는데, 누가 샀는지 기억이 안 나.',
      '빈 마을엔 가지 마. 장사가 안 돼. 손님이 없거든. 아주 처음부터.',
      '항구에서 배가 나가긴 해. 돌아오는 건 못 봤어.',
    ],
  },
};

// 정신체의 힌트 글. {dir} 방향, {n} 칸 수
export const SPIRIT_HINT = {
  found: '{dir}으로 {n}칸쯤. 아직 아무도 안 간 자리가 있어.',
  none: '이 근처엔 이제 네가 모르는 곳이 없어.',
};
