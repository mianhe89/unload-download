// 1부 1장 「견습 모집」(4~10일). 줄거리는 docs/스토리.md '새 뼈대'.
// 메인은 견습 훈련과 북쪽에서 내려오는 것들(들개 떼, 털린 채소밭, 오크의 발자국). 에다는 그 사이사이 한 줄씩 묻는 의문이다.
// 하루 하나의 페이즈를 날마다 되풀이한다(밤에 집에서 자면 시간이 간다). 이름 있는 사람들은 일과대로 산다.
// 배경 주민 배치 도우미: { id: [x, y, mode, radius] }
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

export const phases = {
  aftermath: {
    place: '우리 마을',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    objective: '견습 훈련',
    // 마을 밖 길이 처음으로 '불러와졌다' (북쪽, 서리 마을 방향)
    exits: ['n'],
    // 시계가 돈다: 이름 있는 사람들은 배치 대신 각자 하루 일과(인물 파일의 schedule)대로 산다
    clock: true,
    day: 4,
    npcs: {
      // 배경 주민: 같은 아침인데 어딘가 빈 마을
      ...villagers({
        chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [48, 13, 'wander', 2],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
      }),
    },
    onEnter: 'aftermath.intro',
    events: [
      // 지워진 사람이 있으면: 미아가 무심히 지나간다(한 줄)
      { id: 'mia', when: { ifErasedAny: true }, trigger: { near: 'mia', r: 3 }, run: 'aftermath.mia' },
      { id: 'chat.prayer', when: { ifErasedAny: true }, trigger: { near: 'monk', r: 3 }, run: 'aftermath.chat_prayer' },
      { id: 'chat.kid', when: { ifErasedAny: true }, trigger: { near: 'kid', r: 2 }, run: 'aftermath.chat_kid' },
      // 의문 한 줄: 빈 대장간 앞을 지나가면, 밤에 종탑 벽 앞에 서면 (메인이 아니다)
      { id: 'smithy', trigger: { zone: 'smithy' }, run: 'ch1.smithy' },
      { id: 'tower', when: { afterTime: '19:00' }, trigger: { zone: 'tower' }, run: 'aftermath.tower' },

      // 메인: 들개 떼(루의 훈련 뒤), 6일 레온, 8일 털린 채소밭의 발자국, 10일 시험 공고
      { id: 'dogs', when: { ifFlag: 'ch1.dogs_called', unlessFlag: 'ch1.dogs' }, trigger: { zone: 'fields' }, run: 'ch1.dogs' },
      { id: 'leon.arrive', when: { minDay: 6, afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch1.leon' },
      { id: 'tracks', when: { minDay: 8, ifFlag: 'ch1.dogs' }, trigger: { zone: 'fields' }, run: 'ch1.tracks' },
      { id: 'ch1.depart', when: { minDay: 10, ifFlag: 'ch1.tracks', afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch1.end' },
      // 7일 오후: 처음으로 날씨가 새어 든다(가을에 눈)
      { id: 'leak.first', when: { minDay: 7, afterTime: '13:00', beforeTime: '17:00' }, trigger: { timer: 3 }, run: 'ch1.leak' },
      // 노래의 뒷소절: 저녁 모닥불 곁에서 끝까지 들으면
      {
        id: 'per.verse', when: { ifQuest: 'q.ch1.verse', afterTime: '18:30', unlessErased: 'per' }, run: 'ch1.per_verse',
        trigger: {
          dwell: 'per', r: 3, seconds: 12,
          ticks: [
            { at: 2, bubble: { who: 'per', text: '♪ 마왕을 벤 용사가 칼을 거두고' } },
            { at: 6, bubble: { who: 'per', text: '♪ 고향 마을로 돌아오니' } },
            { at: 10, bubble: { who: 'per', text: '♪ 마을이 하나도 남지 않았더라' } },
          ],
        },
      },
      // 9일: 바깥을 향한 질문 1 — 우물가의 루가 하늘을 보다가 묻는다
      { id: 'ask.lu', when: { minDay: 9, afterTime: '10:00', beforeTime: '18:00' }, trigger: { near: 'lu', r: 3 }, run: 'ch1.ask_lu' },
    ],
  },
};

export const firstPhase = 'aftermath';
