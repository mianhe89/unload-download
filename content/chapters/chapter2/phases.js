// 1부 2장 「옆 마을 가는 길」(11~20일). 줄거리는 docs/스토리.md '새 뼈대'.
// 우리 마을의 하루(fogroad)와 옆 마을에 들르는 페이즈(neighbor, visit)로 나뉜다.
//   1) 11일 견습 시험(감독 레온) → 견습 기사
//   2) 첫 임무: 북쪽 길에서 서쪽으로 갈라지는 옆 마을 길을 막은 빈 갑옷(길 잃은 기사, surface:5,10)
//   3) 옆 마을: 세이와 호라의 사당, 회장의 옛이야기. 세이가 기도에서 들은 이름 — 더 묻기 전에 봉화가 오른다
//   4) 15일 밤 오크 정찰대(content/raids.js). 20일, 초소에서 장이 끝난다
const villagers = (m) => Object.fromEntries(Object.entries(m).map(([id, [x, y, mode, radius]]) => [id, { at: [x, y], mode, radius, face: 'down' }]));

export const phases = {
  fogroad: {
    place: '우리 마을',
    time: 'day',
    bonfire: 'out',
    player: { at: [16, 28], face: 'up' },
    exits: ['n'],
    clock: true,
    day: 11,
    npcs: {
      // 루는 이 장 내내 초소 곁에서 견습들을 본다
      lu: { at: [32, 26], mode: 'idle', face: 'down' },
      ...villagers({
        chief: [24, 14, 'idle'], granny: [28, 21, 'idle'], kid: [12, 26, 'wander', 2], farmer: [48, 13, 'wander', 2],
        hunter: [40, 18, 'idle'], monk: [21, 11, 'idle'], woman: [20, 23, 'idle'], oldman: [30, 18, 'idle'],
      }),
    },
    onEnter: 'ch2.intro',
    events: [
      // 11일 낮, 초소에 가면: 견습 시험
      { id: 'exam', when: { unlessFlag: 'rank.squire', afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch2.exam' },
      // 시험 뒤, 16일부터: 레온 앞으로 온 봉인된 편지
      { id: 'letter', when: { ifFlag: 'rank.squire', minDay: 16, afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch2.letter' },
      // 20일: 정찰대를 겪고 나서 낮에 초소에 가면 장이 끝난다
      { id: 'ch2.depart', when: { ifFlag: ['rank.squire', 'ch2.sei_eda'], minDay: 20, afterTime: '09:00', beforeTime: '18:00' }, trigger: { zone: 'post' }, run: 'ch2.end' },
    ],
  },

  // 옆 마을. 길 맵에서 옆 마을 칸에 들어서면 온다(src/world/visits.js). 길을 막은 빈 갑옷을 쓰러뜨려야 들어갈 수 있다
  neighbor: {
    map: 'neighbor',
    visit: true,
    keepTime: true,
    when: { ifFlag: 'ch2.knight_beaten' },
    place: '옆 마을',
    time: 'day',
    player: { at: [34, 15], face: 'left' },
    clock: true,
    onEnter: 'neighbor.arrive',
    events: [
      // 세이: 사당 앞에서 처음 만난다
      { id: 'sei.meet', when: { unlessFlag: 'ch2.sei_met' }, trigger: { near: 'sei', r: 3 }, run: 'neighbor.sei' },
      // 회장: 세이를 만난 뒤, 옛 왕국 이야기
      { id: 'elder.story', when: { ifFlag: 'ch2.sei_met', unlessErased: 'elder' }, trigger: { near: 'elder', r: 3 }, run: 'neighbor.elder' },
      // 회장이 지워졌다면: 세이가 대신 마을의 옛이야기를 조금 안다
      { id: 'elder.gone', when: { ifFlag: 'ch2.sei_met', ifErased: 'elder' }, trigger: { zone: 'shrine' }, run: 'neighbor.elder_gone' },
      // 세이 곁에 머물러 에다의 이름을 꺼낸다
      {
        id: 'sei.eda', when: { ifFlag: 'ch2.old_kingdom', unlessFlag: 'ch2.sei_eda' }, run: 'neighbor.sei_eda',
        trigger: {
          dwell: 'sei', r: 3, seconds: 6,
          ticks: [{ at: 2, bubble: { who: 'sei', text: '…무슨 하실 말씀이라도?' } }],
        },
      },
      // 시험에 붙은 뒤 13일부터: 레온이 세이를 처음 본다
      { id: 'leon.sei', when: { ifFlag: 'rank.squire', minDay: 13 }, trigger: { near: 'sei', r: 4 }, run: 'neighbor.leon_sei' },
      // 16일부터: 호라께 올리는 날 (호라의 숨)
      { id: 'offering', when: { ifFlag: 'ch2.sei_eda', minDay: 16, afterTime: '08:00', beforeTime: '17:00' }, trigger: { zone: 'shrine' }, run: 'neighbor.offering' },
    ],
  },
};

export const firstPhase = 'fogroad';
