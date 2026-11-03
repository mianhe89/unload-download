// 1부 1장 「빈 대장간」(4~10일). 이어하기(로드)로만 도달한다. 줄거리는 docs/스토리.md.
// 하루 하나의 페이즈를 날마다 되풀이한다(밤에 집에서 자면 다음 날 같은 페이즈). 이름 있는 사람들은 일과대로 산다.
// 로드할 때마다 이 아침은 조금씩 비어 간다.
// 배경 주민 배치 도우미: { id: [x, y, mode, radius] }
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

export const phases = {
  aftermath: {
    place: '우리 마을',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    objective: '종탑',
    // 마을 밖 길이 처음으로 '불러와졌다' (북쪽, 서리 마을 방향)
    exits: ['n'],
    // 시계가 돈다: 이름 있는 사람들은 배치 대신 각자 하루 일과(인물 파일의 schedule)대로 산다
    clock: true,
    day: 4,
    npcs: {
      // 배경 주민: 같은 아침인데 어딘가 빈 마을
      ...villagers({
        chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [11, 21, 'idle'],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
      }),
    },
    onEnter: 'aftermath.intro',
    events: [
      { id: 'mia', when: { ifErasedAny: true }, trigger: { near: 'mia', r: 3 }, run: 'aftermath.mia' },
      { id: 'chat.prayer', when: { ifErasedAny: true }, trigger: { near: 'monk', r: 3 }, run: 'aftermath.chat_prayer' },
      { id: 'chat.kid', when: { ifErasedAny: true }, trigger: { near: 'kid', r: 2 }, run: 'aftermath.chat_kid' },
      // 종탑은 이제 메인 퀘스트의 밤 단계다(q.ch1). 장은 10일째 루와 떠날 때 끝난다

      // 6일: 레온 도착. 낮에 초소 앞에 가면
      { id: 'leon.arrive', when: { minDay: 6, afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch1.leon' },
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
      // 10일: 우물가의 루에게 가면 안개 길로 떠난다(1장의 끝)
      { id: 'ch1.depart', when: { ifQuest: 'q.ch1.step5', minDay: 10 }, trigger: { near: 'lu', r: 3 }, run: 'ch1.end' },
    ],
  },
};

export const firstPhase = 'aftermath';
