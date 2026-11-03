// 1부 3장 「겨울 준비」(21~30일). 줄거리는 docs/스토리.md '3장 · 겨울 준비'.
// 평화가 가장 따뜻한 장이다. 3부에서 잃을 것을 여기서 가장 많이 쥐여 준다.
//   미아와 겨울 장을 걷고(처음 손잡은 날), 셀레나와 명부를 두고 다투고, 루가 사흘 동안 사라졌다 돌아온다.
//   24일 밤엔 토르크가 쳐들어온다(content/raids.js). 30일 저녁, 첫눈 축제에서 종소리를 센다.
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

export const phases = {
  winter: {
    place: '우리 마을',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    exits: ['n'],
    clock: true,
    day: 21,
    npcs: {
      // 겨울 장: 북쪽 상인이 광장에 좌판을 폈다
      merchant: { at: [28, 15], mode: 'idle', face: 'down' },
      ...villagers({
        chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [11, 21, 'idle'],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
      }),
    },
    onEnter: 'ch3.intro',
    events: [
      // 미아: 겨울 장 인파 속에서 손을 잡는다 (22일부터, 낮)
      { id: 'mia.hands', when: { minDay: 22, afterTime: '10:00', beforeTime: '17:00', unlessFlag: 'route.mia.hands' }, trigger: { near: 'mia', r: 3 }, run: 'ch3.mia_hands' },
      {
        id: 'mia.hands.walk', when: { ifFlag: 'ch3.holding' }, run: 'ch3.mia_hands_end',
        trigger: {
          dwell: 'mia', r: 3, seconds: 40,
          ticks: [
            { at: 8, bubble: { who: 'mia', text: '사람 진짜 많다…' } },
            { at: 18, bubble: { who: 'mia', text: '저기 군밤 판다. …아니, 그냥 걷자.' } },
            { at: 30, bubble: { who: 'mia', text: '…놓지 마.' } },
          ],
        },
      },
      // 셀레나: 오후의 초소에서 명부를 두고 다툰다 → 다음 날 아침 꿀빵을 들고 온다
      { id: 'selena.quarrel', when: { minDay: 23, afterTime: '13:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch3.selena_quarrel' },
      { id: 'selena.makeup', when: { ifFlag: 'route.selena.quarrel', beforeTime: '11:00' }, trigger: { near: 'selena', r: 4 }, run: 'ch3.selena_makeup' },
      // 루: 25~27일엔 없다. 우물가에 가 보면 빈자리 / 28일에 돌아온다
      { id: 'lu.missing', when: { minDay: 25, maxDay: 27 }, trigger: { zone: 'well' }, run: 'ch3.lu_missing' },
      { id: 'lu.back', when: { minDay: 28 }, trigger: { near: 'lu', r: 3 }, run: 'ch3.lu_back' },
      // 루가 다시 안개 길로 가자고 하자 미아가 막는다
      { id: 'quarrel', when: { ifFlag: 'route.lu.back' }, trigger: { near: 'mia', r: 3 }, run: 'ch3.quarrel' },
      // 레온의 밤: 견습이 된 뒤, 밤 10시가 넘어 초소에 가면
      { id: 'leon.night', when: { ifFlag: 'rank.squire', afterTime: '22:00' }, trigger: { zone: 'post' }, run: 'ch3.leon_night' },
      // 얼음성 소문: 겨울 장의 북쪽 상인
      { id: 'rumor', trigger: { near: 'merchant', r: 2 }, run: 'ch3.rumor' },
      // 날씨 새어 듦: 맑은 밤의 소나기 (26일부터, 미아 곁)
      { id: 'leak.rain', when: { minDay: 26, afterTime: '19:00', beforeTime: '21:30' }, trigger: { near: 'mia', r: 4 }, run: 'ch3.leak_rain' },
      // 바깥을 향한 질문 2 (로드 2회 이상): 손을 잡은 뒤의 미아
      { id: 'ask.mia', when: { ifFlag: 'route.mia.hands', minLoads: 2, minDay: 27 }, trigger: { near: 'mia', r: 3 }, run: 'ch3.ask_mia' },
      // 30일 저녁: 첫눈 축제로
      { id: 'to.fest', when: { minDay: 30, afterTime: '18:00' }, trigger: { timer: 1 }, run: 'ch3.to_fest' },
    ],
  },

  // 30일 밤, 첫눈 축제. 광장에 모닥불, 다들 모였다
  snowfest: {
    place: '첫눈 축제',
    time: 'night',
    bonfire: 'lit',
    player: { at: [24, 23], face: 'up' },
    npcs: {
      mia: { at: [22, 20], mode: 'idle', face: 'right' },
      selena: { at: [27, 20], mode: 'idle', face: 'left' },
      lu: { at: [20, 18], mode: 'idle', face: 'right' },
      leon: { at: [29, 21], mode: 'idle', face: 'left', when: { ifFlag: 'leon.arrived' } },
      hort: { at: [18, 20], mode: 'idle', face: 'right' },
      tom: { at: [31, 19], mode: 'idle', face: 'left' },
      rine: { at: [25, 21], mode: 'idle', face: 'up' },
      per: { at: [21, 19], mode: 'idle', face: 'right' },
      ...villagers({ chief: [24, 14, 'idle'], granny: [29, 23, 'idle'], kid: [23, 22, 'wander', 2], woman: [19, 22, 'idle'] }),
    },
    lights: [{ spot: 'fire', radius: 90, flicker: true }],
    onEnter: 'snowfest.intro',
    events: [
      { id: 'bells', trigger: { timer: 20 }, run: 'snowfest.bells' },
    ],
  },
};

export const firstPhase = 'winter';
