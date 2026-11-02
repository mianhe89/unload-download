// 1장 「지워진 이름들」 — 지금은 도입부만. 이어하기(로드)로만 도달한다.
// 로드할 때마다 이 아침은 조금씩 비어 간다.
// 배경 주민 배치 도우미: { id: [x, y, mode, radius] }
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

export const phases = {
  aftermath: {
    place: '광장 · 아침',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    objective: '종탑',
    // 마을 밖 길이 처음으로 '불러와졌다' (북쪽, 서리 마을 방향)
    exits: ['n'],
    npcs: {
      mia: { at: [26, 19], mode: 'idle', face: 'down' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [33, 21], mode: 'wander', radius: 1 },
      rine: { at: [28, 13], mode: 'idle', face: 'down' },
      per: { at: [20, 21], mode: 'idle', face: 'down' },
      selena: { at: [36, 28], mode: 'idle', face: 'up' },
      lu: { at: [10, 28], mode: 'idle', face: 'right' },
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
      { id: 'tower', trigger: { zone: 'tower' }, run: 'aftermath.tower' },
    ],
  },
};

export const firstPhase = 'aftermath';
