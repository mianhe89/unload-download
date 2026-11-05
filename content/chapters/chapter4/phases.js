// 2부 4장 「소집 가는 길」(31일~). 줄거리는 docs/스토리.md '4장 · 소집 가는 길'.
// 첫눈 축제 다음 날의 소집령으로 셀레나·루·레온과 함께 왕도로 떠난다. 미아는 마을에 남는다.
//   1) 옆 마을: 세이가 순례로 합류한다
//   2) 물레방아 마을: 정리자를 섬기는 사람들. 정리자가 처음으로 낮에 나타나 묻는다(바깥을 향한 질문)
//   3) 영주의 성 아랫마을: 영주가 지워졌다. 셀레나의 추천으로 영주 대리가 된다
//   4) 기록하는 마을: 서로의 이름을 매일 적는 마을. 고향에서 편지가 온다(1부에서 습격을 막았는지에 따라)
//   5) 드워프 마을: 북쪽의 사자들이 레온을 데리러 온다. 레온의 결투 — 광장 가운데로 걸어 나가면 받는다, 가만히 있으면 세이가 북쪽으로 간다
//   6) 얼음성: 노엘의 제안 — 얼음 심장에 다가가면 얼린다(나쁜 끝), 성문으로 걸어 나가면 거절한다 (4장의 끝)
// 갈림길은 선택창이 아니라 행동으로 정한다.
// 함께 떠난 사람들은 들르는 마을마다 곁에 있다(페이즈 배치). 우리 마을엔 없다(인물 파일의 away).
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));
// 길동무: 들르는 마을마다 광장 근처에 선다
const party = (at) => Object.fromEntries(Object.entries(at).map(([id, [x, y]]) => [id, { at: [x, y], mode: 'idle', face: 'down', ...(id === 'sei' ? { when: { unlessFlag: 'sei.went_north' } } : {}) }]));

export const phases = {
  muster: {
    place: '우리 마을',
    time: 'day',
    bonfire: 'out',
    player: { at: [34, 10], face: 'up' },
    exits: ['n'],
    clock: true,
    day: 31,
    startAt: '07:00',
    onRoad: true, // 이야기는 길 위의 마을에서 이어진다
    npcs: villagers({
      chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [48, 13, 'wander', 2],
      hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
    }),
    onEnter: 'ch4.intro',
    events: [],
  },

  neighbor4: {
    map: 'neighbor', visit: true, keepTime: true, place: '옆 마을', time: 'day', clock: true,
    when: { ifFlag: 'ch4.departed' },
    player: { at: [34, 15], face: 'left' },
    npcs: party({ selena: [29, 16], lu: [24, 13], leon: [27, 12] }),
    onEnter: 'neighbor4.arrive',
    events: [],
  },

  mill: {
    map: 'mill', visit: true, keepTime: true, place: '물레방아 마을', time: 'day', clock: true,
    when: { ifFlag: 'ch4.sei_joined' },
    player: { at: [4, 14], face: 'right' },
    npcs: party({ selena: [10, 16], lu: [12, 12], leon: [11, 17], sei: [8, 15] }),
    onEnter: 'mill.arrive',
    events: [
      { id: 'mill.alma', trigger: { near: 'alma', r: 3 }, run: 'mill.alma' },
      { id: 'mill.keeper', when: { ifFlag: 'mill.alma' }, trigger: { zone: 'altar' }, run: 'mill.keeper' },
    ],
  },

  lordtown: {
    map: 'lordtown', visit: true, keepTime: true, place: '영주의 성 아랫마을', time: 'day', clock: true,
    when: { ifFlag: 'ch4.keeper_day' },
    player: { at: [21, 27], face: 'up' },
    npcs: party({ selena: [18, 20], lu: [24, 22], leon: [23, 19], sei: [17, 22] }),
    onEnter: 'lordtown.arrive',
    events: [
      { id: 'lordtown.portrait', trigger: { zone: 'castle' }, run: 'lordtown.portrait' },
    ],
  },

  ledger4: {
    map: 'ledger', visit: true, keepTime: true, place: '기록하는 마을', time: 'day', clock: true,
    when: { ifFlag: 'rank.regent' },
    player: { at: [19, 23], face: 'up' },
    npcs: party({ selena: [16, 18], lu: [22, 19], leon: [21, 17], sei: [15, 19] }),
    onEnter: 'ledger.arrive',
    events: [
      { id: 'ledger.board', trigger: { zone: 'board' }, run: 'ledger.board' },
      { id: 'ledger.letters', when: { ifFlag: 'ledger.board' }, trigger: { afterFlag: 'ledger.board', delay: 3 }, run: 'ledger.letters' },
      // 그날 밤 악마가 온다. 루가 나를 감싸다 다친다
      { id: 'ledger.demons', when: { ifFlag: 'ch4.ledger_done' }, trigger: { afterFlag: 'ch4.ledger_done', delay: 4 }, run: 'ledger.demons' },
      // 다친 루 곁에 가만히 머물면 (묻지 않고)
      {
        id: 'ledger.lu_watch', when: { ifFlag: 'ch4.lu_hurt' }, run: 'ledger.lu_watch',
        trigger: { dwell: 'lu', r: 2, seconds: 10, ticks: [{ at: 4, bubble: { who: 'lu', text: '…' } }] },
      },
    ],
  },

  dwarf4: {
    map: 'dwarf', visit: true, keepTime: true, place: '드워프 마을', time: 'day', clock: true,
    when: { ifFlag: 'ch4.demons', unlessFlag: 'ch4.duel_done' },
    player: { at: [19, 23], face: 'up' },
    npcs: { ...party({ selena: [14, 16], lu: [24, 16], sei: [16, 18] }), leon: { at: [19, 13], mode: 'idle', face: 'down' }, envoy: { at: [19, 10], mode: 'idle', face: 'down' } },
    onEnter: 'dwarf4.envoys',
    events: [
      // 결투: 광장 가운데로 걸어 나가면 받는다
      { id: 'duel.accept', when: { ifFlag: 'duel.offered' }, trigger: { zone: 'plaza' }, run: 'dwarf4.duel' },
      // 가만히 있으면(한동안 광장에 나가지 않으면) 세이가 스스로 북쪽으로 간다
      { id: 'duel.wait', when: { ifFlag: 'duel.offered', unlessFlag: 'duel.accepted' }, trigger: { afterFlag: 'duel.offered', delay: 45 }, run: 'dwarf4.sei_goes' },
    ],
  },

  icecastle4: {
    map: 'icecastle', visit: true, keepTime: true, place: '얼음성', time: 'day', clock: true,
    when: { ifFlag: 'ch4.duel_done' },
    player: { at: [18, 25], face: 'up' },
    npcs: { ...party({ selena: [15, 21], lu: [21, 21], leon: [20, 22], sei: [16, 22] }), noel: { at: [18, 12], mode: 'idle', face: 'down' } },
    onEnter: 'ice.arrive',
    events: [
      { id: 'ice.offer', trigger: { near: 'noel', r: 3 }, run: 'ice.offer' },
      // 성문으로 걸어 나가면 거절한 것
      { id: 'ice.refuse', when: { ifFlag: 'ice.offered', unlessFlag: 'noel.refused' }, trigger: { zone: 'gate' }, run: 'ice.refuse' },
      // 얼음 심장에 다가가면 받아들인 것 (나쁜 끝 — 되돌려야만 이어진다)
      { id: 'ice.freeze', when: { ifFlag: 'ice.offered', unlessFlag: 'noel.refused' }, trigger: { zone: 'heart' }, run: 'ice.freeze' },
    ],
  },
};

export const firstPhase = 'muster';
