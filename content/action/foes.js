// 액션 전투의 적. 모든 전투(길 위의 무리, 마을 습격, 시험·결투, 보스)가 이 목록을 쓴다.
//   art: { mon: 팩 몬스터 그림 } 또는 { char: 인물 도트 }, tint: 그림에 곱하는 색(같은 그림의 다른 갈래), scale: 크기
//   hp · radius(몸 반지름 px) · speed(px/초) · contact(몸에 닿으면 피해) · keep(이 거리를 지키며 쏜다, 원거리)
//   attacks: 차례로 쓴다. reach: 이 거리 안이어야 시작(없으면 어디서든). tell: 바닥에 붉은 예고를 띄우는 시간(초)
//     sweep  부채꼴 (range, arc)            lunge  짧은 직선 돌진 (dist, width)
//     shot   조준한 탄 (count, spread, speed) ring   둥글게 퍼지는 탄 (count, speed)
//     motes  쫓아오는 탄 (count, speed, life)
//   rest: 공격 사이 쉬는 시간. boss: 화면 위에 이름과 큰 체력 막대. enrageAt: 이 체력 비율 아래면 빨라진다
//   base: 전리품(content/battles/encounters.js의 DROPS)을 이 적의 것으로 친다(같은 갈래의 변종)
//   drops: 보스를 처음 이기면 얻는 장비
// 같은 그림에 색만 바꾼 변종이 많다: 팩에 몬스터 그림이 다섯 가지뿐이라, 사는 땅이 바꾼 생김새로 갈래를 낸다.
export const FOES = {
  // ── 들판·바닷가 ──
  slime: {
    name: '슬라임', art: { mon: 'Slime' }, hp: 18, radius: 6, speed: 26, contact: 5, rest: 1.3,
    attacks: [{ id: 'hop', kind: 'lunge', name: '튀어 오르기', reach: 46, tell: 0.5, dist: 38, width: 12, dmg: 6 }],
  },
  slime_ember: {
    name: '불씨 슬라임', art: { mon: 'Slime' }, tint: 0xff9a6a, base: 'slime', hp: 22, radius: 6, speed: 28, contact: 6, rest: 1.3,
    attacks: [{ id: 'hop', kind: 'lunge', name: '불씨 튀기기', reach: 46, tell: 0.5, dist: 38, width: 12, dmg: 7, status: { id: 'burn', chance: 0.4 } }],
  },
  slime_frost: {
    name: '서리 슬라임', art: { mon: 'Slime' }, tint: 0xa8d8ff, base: 'slime', hp: 22, radius: 6, speed: 22, contact: 5, rest: 1.4,
    attacks: [{ id: 'hop', kind: 'lunge', name: '얼음 튀기기', reach: 46, tell: 0.55, dist: 36, width: 12, dmg: 6, status: { id: 'slow', chance: 0.5 } }],
  },
  wolf: {
    name: '들개', art: { mon: 'Beast' }, tint: 0xb8b0a8, base: 'beast', hp: 22, radius: 6, speed: 58, contact: 4, rest: 0.9,
    attacks: [{ id: 'bite', kind: 'sweep', name: '물기', reach: 24, tell: 0.32, range: 22, arc: 80, dmg: 7, status: { id: 'bleed', chance: 0.25 } }],
  },
  beast: {
    name: '불짐승', art: { mon: 'Beast' }, hp: 34, radius: 7, speed: 44, contact: 6, rest: 1.0,
    attacks: [
      { id: 'claw', kind: 'sweep', name: '할퀴기', reach: 26, tell: 0.36, range: 24, arc: 100, dmg: 9 },
      { id: 'pounce', kind: 'lunge', name: '덮치기', reach: 80, tell: 0.55, dist: 64, width: 14, dmg: 10, status: { id: 'burn', chance: 0.35 } },
    ],
  },
  // ── 숲·설원 ──
  owl: {
    name: '바람 올빼미', art: { mon: 'Owl' }, hp: 20, radius: 6, speed: 48, contact: 3, keep: 72, rest: 1.2,
    attacks: [{ id: 'feather', kind: 'shot', name: '깃털 날리기', reach: 150, tell: 0.45, count: 3, spread: 0.28, speed: 95, dmg: 5 }],
  },
  owl_snow: {
    name: '눈 올빼미', art: { mon: 'Owl' }, tint: 0xe8f0ff, base: 'owl', hp: 22, radius: 6, speed: 44, contact: 3, keep: 76, rest: 1.3,
    attacks: [{ id: 'feather', kind: 'shot', name: '얼음 깃털', reach: 150, tell: 0.5, count: 3, spread: 0.3, speed: 90, dmg: 5, status: { id: 'slow', chance: 0.4 } }],
  },
  skull: {
    name: '떠도는 해골', art: { mon: 'Skull' }, hp: 28, radius: 6, speed: 32, contact: 5, keep: 46, rest: 1.2,
    attacks: [
      { id: 'bite', kind: 'sweep', name: '물기', reach: 26, tell: 0.4, range: 22, arc: 90, dmg: 9 },
      { id: 'wisp', kind: 'motes', name: '도깨비불', tell: 0.6, count: 1, speed: 38, life: 3, dmg: 6, status: { id: 'weak', chance: 0.35 } },
    ],
  },
  skull_ash: {
    name: '재 해골', art: { mon: 'Skull' }, tint: 0xa89a90, base: 'skull', hp: 32, radius: 6, speed: 30, contact: 5, keep: 52, rest: 1.2,
    attacks: [
      { id: 'wisp', kind: 'motes', name: '잿빛 불', tell: 0.6, count: 1, speed: 38, life: 3, dmg: 5, status: { id: 'poison', chance: 0.35 } },
      { id: 'bite', kind: 'sweep', name: '물기', reach: 26, tell: 0.4, range: 22, arc: 90, dmg: 9 },
    ],
  },
  // ── 마른 땅·사막·굴 ──
  mole: {
    name: '땅굴 두더지', art: { mon: 'Mole' }, hp: 40, radius: 7, speed: 22, contact: 6, rest: 1.5,
    attacks: [{ id: 'dig', kind: 'lunge', name: '파고들기', reach: 110, tell: 0.7, dist: 90, width: 14, dmg: 12, status: { id: 'stun', chance: 0.3 } }],
  },
  mole_rock: {
    name: '바위 두더지', art: { mon: 'Mole' }, tint: 0xc8b090, base: 'mole', hp: 52, radius: 8, speed: 20, contact: 7, rest: 1.6,
    attacks: [
      { id: 'dig', kind: 'lunge', name: '파고들기', reach: 110, tell: 0.7, dist: 90, width: 16, dmg: 12, status: { id: 'stun', chance: 0.3 } },
      { id: 'rocks', kind: 'ring', name: '돌 튀기기', tell: 0.6, count: 8, speed: 70, dmg: 5 },
    ],
  },
  // ── 습격의 오크 (content/raids.js). 굶주린 전사들: 오래 버티지 못하고 한꺼번에 몰려든다 ──
  orc: {
    name: '오크 전사', art: { char: 'orc' }, hp: 46, radius: 7, speed: 36, contact: 6, rest: 1.0,
    attacks: [
      { id: 'club', kind: 'sweep', name: '몽둥이질', reach: 28, tell: 0.45, range: 28, arc: 110, dmg: 11 },
      { id: 'rush', kind: 'lunge', name: '몸통 박치기', reach: 80, tell: 0.6, dist: 70, width: 14, dmg: 10 },
    ],
  },

  // ── 보스와 한 사람과의 싸움 ──
  // 토르크: 족장의 아들. 3장 습격의 우두머리
  tork: {
    name: '토르크', art: { char: 'tork' }, scale: 1.4, boss: true, hp: 360, radius: 10, speed: 38, contact: 8, rest: 0.8, enrageAt: 0.4,
    attacks: [
      { id: 'cleave', kind: 'sweep', name: '도끼 내려찍기', tell: 0.8, range: 46, arc: 150, dmg: 18, status: { id: 'burn', chance: 0.5 } },
      { id: 'charge', kind: 'lunge', name: '엄니 들이받기', tell: 0.75, dist: 150, width: 20, dmg: 20, status: { id: 'stun', chance: 0.4 } },
      { id: 'cleave', kind: 'sweep', name: '도끼 내려찍기', tell: 0.8, range: 46, arc: 150, dmg: 18, status: { id: 'burn', chance: 0.5 } },
      { id: 'roar', kind: 'ring', name: '잿빛 함성', tell: 0.7, count: 14, speed: 72, dmg: 8, status: { id: 'burn', chance: 0.3 } },
    ],
  },
  // 견습 시험의 감독 레온(2장): 쓰러뜨리려는 게 아니라 받아 내는지 본다. 목검이라 덜 아프다
  leon: {
    name: '레온', art: { char: 'leon' }, boss: true, hp: 150, radius: 7, speed: 66, contact: 5, rest: 0.75,
    attacks: [
      { id: 'jab', kind: 'lunge', name: '찌르기', tell: 0.4, dist: 50, width: 12, dmg: 10 },
      { id: 'feint', kind: 'sweep', name: '돌려 치기', tell: 0.4, range: 34, arc: 200, dmg: 11 },
      { id: 'thrust', kind: 'lunge', name: '정면 일격', tell: 0.7, dist: 130, width: 16, dmg: 18 },
      { id: 'feint', kind: 'sweep', name: '돌려 치기', tell: 0.4, range: 34, arc: 200, dmg: 11 },
    ],
  },
  // 2부 4장 결투: 이번엔 진검이고, 이기려고 든다
  leon_duel: {
    name: '레온', art: { char: 'leon' }, boss: true, hp: 230, radius: 7, speed: 72, contact: 6, rest: 0.6, enrageAt: 0.4,
    attacks: [
      { id: 'jab', kind: 'lunge', name: '찌르기', tell: 0.36, dist: 54, width: 12, dmg: 12 },
      { id: 'thrust', kind: 'lunge', name: '정면 일격', tell: 0.62, dist: 140, width: 16, dmg: 24 },
      { id: 'sweep', kind: 'sweep', name: '돌려 베기', tell: 0.45, range: 36, arc: 240, dmg: 15, status: { id: 'bleed', chance: 0.4 } },
      { id: 'storm', kind: 'shot', name: '바람 베기', tell: 0.55, count: 5, spread: 0.22, speed: 125, dmg: 8, status: { id: 'bleed', chance: 0.4 } },
    ],
  },
  // 2장: 옆 마을로 가는 안개 길의 빈 갑옷
  lostknight: {
    name: '길 잃은 기사', art: { char: 'lostknight' }, scale: 1.3, boss: true, hp: 300, radius: 9, speed: 30, contact: 7, rest: 1.0, enrageAt: 0.4,
    attacks: [
      { id: 'slash', kind: 'sweep', name: '녹슨 베기', tell: 0.6, range: 40, arc: 130, dmg: 14 },
      { id: 'charge', kind: 'lunge', name: '빈 돌격', tell: 0.85, dist: 160, width: 20, dmg: 22 },
      { id: 'mist', kind: 'ring', name: '녹슨 먼지', tell: 0.7, count: 12, speed: 62, dmg: 7, status: { id: 'slow', chance: 0.5 } },
    ],
    drops: ['oldHelm'],
  },
  // 검은 성 앞: 정리자의 그림자
  sweeper: {
    name: '정리자의 그림자', art: { mon: 'GiantSpirit' }, tint: 0xb8a8ff, boss: true, hp: 280, radius: 16, speed: 34, contact: 6, rest: 0.9, enrageAt: 0.4,
    attacks: [
      { id: 'sweep', kind: 'sweep', name: '쓸어내기', tell: 0.9, range: 54, arc: 140, dmg: 22 },
      { id: 'ring', kind: 'ring', name: '먼지 털기', tell: 0.7, count: 14, speed: 70, dmg: 9, status: { id: 'slow', chance: 0.4 } },
      { id: 'charge', kind: 'lunge', name: '치우기', tell: 0.8, dist: 150, width: 18, dmg: 18, status: { id: 'stun', chance: 0.5 } },
      { id: 'motes', kind: 'motes', name: '먼지 구름', tell: 0.5, count: 4, speed: 42, life: 4, dmg: 7, status: { id: 'poison', chance: 0.5 } },
    ],
    drops: ['twinEdge'],
  },
};

// 이 적의 전리품 갈래 (변종은 원래 갈래의 것)
export const dropBase = (id) => FOES[id]?.base ?? id;
