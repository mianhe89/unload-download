// 2부 4장 「소집 가는 길」(31일~). 줄거리는 docs/스토리.md '4장 · 소집 가는 길'.
// 첫눈 축제 다음 날의 소집령으로 셀레나·루·레온과 함께 왕도로 떠난다. 미아는 마을에 남는다.
//   1) 옆 마을: 세이가 순례로 합류한다
//   2) 물레방아 마을: 정리자를 섬기는 사람들. 정리자가 처음으로 낮에 나타나 묻는다(바깥을 향한 질문)
//   3) 영주의 성 아랫마을: 영주가 지워졌다. 셀레나의 추천으로 영주 대리가 된다 (4장 전반의 끝)
// 함께 떠난 사람들은 들르는 마을마다 곁에 있다(페이즈 배치). 우리 마을엔 없다(인물 파일의 away).
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));
// 길동무: 들르는 마을마다 광장 근처에 선다
const party = (at) => Object.fromEntries(Object.entries(at).map(([id, [x, y]]) => [id, { at: [x, y], mode: 'idle', face: 'down' }]));

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
      chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [11, 21, 'idle'],
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
};

export const firstPhase = 'muster';
