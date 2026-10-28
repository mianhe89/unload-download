// 1장 「지워진 이름들」 — 지금은 도입부만. 이어하기(로드)로만 도달한다.
// 로드할 때마다 이 아침은 조금씩 비어 간다.
export const phases = {
  aftermath: {
    place: '광장 · 아침',
    time: 'day',
    player: { at: [16, 28], face: 'up' },
    objective: '종탑',
    npcs: {
      mia: { at: [26, 19], mode: 'idle', face: 'down' },
      hort: { at: [16, 16], mode: 'idle', face: 'down' },
      tom: { at: [33, 21], mode: 'wander', radius: 1 },
      rine: { at: [28, 13], mode: 'idle', face: 'down' },
      per: { at: [20, 21], mode: 'idle', face: 'down' },
      selena: { at: [36, 28], mode: 'idle', face: 'up' },
      lu: { at: [10, 28], mode: 'idle', face: 'right' },
    },
    onEnter: 'aftermath.intro',
    events: [
      { id: 'mia', when: { ifErasedAny: true }, trigger: { near: 'mia', r: 3 }, run: 'aftermath.mia' },
      { id: 'tower', trigger: { zone: 'tower' }, run: 'aftermath.tower' },
    ],
  },
};

export const firstPhase = 'aftermath';
