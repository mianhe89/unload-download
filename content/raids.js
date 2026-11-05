// 마을 습격. 정해진 날·시각에 몬스터 무리가 쳐들어온다(기획서 '마을 습격', docs/스토리.md '축 4 · 습격').
// 주인공이 곁에 가서 E로 맞서면 물러나고, 하나라도 목표에 닿으면 못 지킨 것이다. 결과는 플래그와 호감도로 남는다.
// 전투 씬으로 넘어가는 맞서기는 다음 단계다(지금은 필드에서 E로 맞선다).
//
//   { id, title, day, at: 'HH:MM', when?: 대본 조건,
//     kind: 'sign'(예고만, 싸움 없음) | 'raid',
//     lines: [[누가, 말], ...]                 sign: 그날 보여 줄 장면 / raid: 습격 경고. 누가 ''면 내레이션
//     band: [{ id: 인물, from: [tx, ty], delay?: 초 }]   나타나는 곳은 마을 북쪽 길(마을 밖으로 이어지는 길)
//     target: [tx, ty], targetName                       오크들이 노리는 곳(곡식 더미·가게 앞)
//     won:  { lines, flags, aff }   지켰을 때
//     lost: { lines, flags, aff }   못 지켰을 때 }
// 습격마다 raid.<id>.on / .won / .lost / .over 플래그가 켜진다. lost가 FALL_AFTER번 쌓이면 village.fallen.
// 시계가 도는 날(phase.clock)에만 온다.
//   map: 그 습격이 오는 맵 (기본 우리 마을). daily: 날마다 그 시각에 온다(day 대신). 싸움은 늘 혼자다(동료 없음)

export const FALL_AFTER = 3;

export const RAIDS = [
  {
    id: 'sign', kind: 'sign', title: '털린 채소밭', day: 8, at: '07:00',
    lines: [
      ['', '아침. 서쪽 밭이 밤새 털려 있었다. 무가 뿌리째 뽑히고, 흙바닥에 커다란 발자국이 찍혀 있었다.'],
      ['tom', '곰은 아니야. 곰은 밭을 이렇게 가지런히 안 털어. 먹을 것만 골라서 자루에 담아 갔어.'],
      ['tom', '…발가락이 넷이군. 북쪽 고원 놈들인가. 거기 사는 오크들은 산을 잘 안 내려오는데.'],
    ],
    flags: ['raid.sign.seen'],
  },
  {
    id: 'scouts', kind: 'raid', title: '오크 정찰대', day: 15, at: '21:00',
    lines: [
      ['', '밤. 북쪽 길에서 발소리가 났다. 곧 종탑의 종이 빠르게 울렸다. 경보다.'],
      ['tom', '오크다! 셋, 북쪽 길로 내려온다! 서쪽 밭의 곡식 더미 쪽이야!'],
      ['', '서쪽 밭에는 올겨울 마을이 먹을 곡식을 건초 더미 아래 쌓아 두었다.'],
    ],
    band: [
      { id: 'orc', from: [34, 4] },
      { id: 'orc', from: [36, 4], delay: 5 },
      { id: 'orc', from: [35, 4], delay: 10 },
    ],
    target: [11, 23], targetName: '서쪽 밭의 곡식 더미',
    won: {
      lines: [
        ['', '마지막 오크가 곡식 자루를 떨어뜨리고 어둠 속으로 달아났다.'],
        ['tom', '쫓아냈다! …이야, 네가 아니었으면 곡식 더미가 텅 빌 뻔했어.'],
        ['', '사람들이 등불을 들고 나왔다. 누군가 "마왕의 졸개들"이라고 수군거렸다. 하지만 떨어진 자루 안에는 무기가 아니라 빈 그릇뿐이었다.'],
      ],
      flags: ['raid.scouts.won'],
      aff: { tom: 3, selena: 3 },
    },
    lost: {
      lines: [
        ['', '오크 하나가 건초 더미를 헤집고 곡식 자루를 메고 달아났다. 등불을 든 사람들이 모였을 땐 이미 늦었다.'],
        ['tom', '젠장… 곡식이 한 더미 털렸어. 올겨울 빵값이 오르겠군.'],
      ],
      flags: ['raid.scouts.lost', 'granary.looted'],
    },
  },
  {
    id: 'first', kind: 'raid', title: '토르크의 습격', day: 24, at: '20:30',
    lines: [
      ['', '초겨울 밤. 이번엔 발소리가 들리기도 전에 종이 울렸다. 북쪽 길에 횃불이 여럿 흔들렸다.'],
      ['selena', '정찰이 아니다. 무리다! 앞에 선 놈은 붉은 망토를 둘렀다.'],
      ['selena', '놈들이 광장 쪽으로 온다. 빵집을 노린다. 막아라!'],
    ],
    band: [
      { id: 'tork', from: [35, 4] },
      { id: 'orc', from: [34, 4], delay: 3 },
      { id: 'orc', from: [37, 4], delay: 3 },
      { id: 'orc', from: [34, 4], delay: 9 },
      { id: 'orc', from: [36, 4], delay: 9 },
    ],
    target: [16, 17], targetName: '호르트네 빵집',
    won: {
      lines: [
        ['tork', '…기억해 두겠다, 인간. 너희가 쌓아 둔 곡식 옆에서 우리가 굶었다는 걸.'],
        ['', '붉은 망토의 오크는 한쪽 엄니가 부러져 있었다. 그는 뒤돌아보지 않고 북쪽으로 사라졌다.'],
        ['selena', '잘했다. 견습치고는… 아니, 견습이라 부를 일은 아니군.'],
      ],
      flags: ['raid.first.won'],
      aff: { selena: 4, hort: 3 },
    },
    lost: {
      lines: [
        ['', '빵집 창고에서 불길이 솟았다. 오크들이 밀가루 자루를 끌고 달아나는 동안, 누군가 넘어뜨린 등불이 지붕으로 옮겨붙었다.'],
        ['hort', '내 가마… 내 가마가…'],
        ['', '불은 새벽에야 꺼졌다. 호르트 아저씨는 다치지 않았지만, 빵집은 한동안 문을 열 수 없다.'],
      ],
      flags: ['raid.first.lost', 'bakery.burned'],
    },
  },
  // 서리 마을: 북쪽 회색 고원에 가장 가까워 해 질 녘마다 오크가 내려온다. 브렌나는 망루에서 활로 막고, 창고 앞은 내가 맡는다
  {
    id: 'frost', kind: 'raid', map: 'frost', daily: true, at: '17:30', title: '해 질 녘의 오크',
    lines: [
      ['yuna', '오크다! 북문으로 둘! …아니, 셋!'],
      ['brenna', '또냐. 난 망루에서 쏜다. 외지인, 창고 앞은 네가 맡아.'],
    ],
    band: [
      { id: 'orc', from: [19, 4] },
      { id: 'orc', from: [21, 4], delay: 6 },
      { id: 'orc', from: [20, 4], delay: 12 },
    ],
    target: [27, 21], targetName: '서리 마을 곡식 창고',
    won: {
      lines: [
        ['brenna', '…물러갔군. 외지인치곤 쓸 만하다.'],
        ['gord', '다들 들어와! 국 끓였다!'],
      ],
      aff: { brenna: 2, yuna: 2, gord: 1 },
    },
    lost: {
      lines: [
        ['brenna', '창고 문이 뜯겼다. 자루 몇 개 가져갔군.'],
        ['yuna', '…내일은 제가 더 일찍 볼게요.'],
      ],
    },
  },
];
