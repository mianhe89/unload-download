// 탑뷰 액션 전투 데이터 (보스전 2단계). 조작에 기대는 전투.
//   이동 WASD(화살표도) · 기본 공격 마우스 클릭(조준 방향) · 스킬 4칸 · 퀵슬롯 1~8

// 조작 키. 스킬 4칸(q w e r)에 어떤 키를 붙일지는 여기서 바꾼다.
// 이동이 WASD라 W가 겹쳐서, 기본은 Q E R F (왼손이 이동하면서 누를 수 있는 자리)
export const CONTROLS = { skills: { q: 'Q', w: 'W', e: 'E', r: 'R' } }; // 이동은 방향키(W가 스킬이라)
// 수치는 초안. 거리 단위는 px(월드), 시간은 초.

// ── 기본 스킬 (검사) ───────────────────────────────────────
//   shape: 'arc'(부채꼴: range, arc=각도) | 'line'(직선: range, width) | 'guard' | 'dash'
export const BASE_SKILLS = {
  atk: { name: '베기', shape: 'arc', range: 24, arc: 100, dmg: 10, cd: 0.38, windup: 0.06 },
  q: { name: '찌르기', shape: 'line', range: 44, width: 10, dmg: 24, cd: 3, windup: 0.12 },
  w: { name: '휘두르기', shape: 'arc', range: 32, arc: 200, dmg: 16, cd: 4.5, windup: 0.18, status: { id: 'bleed', chance: 0.6 } },
  e: { name: '막기', shape: 'guard', dur: 0.9, cd: 4, reduce: 0.75, parry: 0.22, arc: 160, blocksShots: false },
  r: { name: '돌진', shape: 'dash', dist: 64, dur: 0.18, cd: 5, dmg: 8, invuln: true },
};

// ── 상태이상 ────────────────────────────────────────────────
//   dps 초당 피해(최대 체력 비율), slow 이동 배수, stun 행동 불가, freeze 이동·행동 불가 + 다음 피해 1.5배로 풀림
//   weak 주는 피해 배수, vuln 받는 피해 배수, noRegen 회복(붕대·약초) 막음
export const STATUS = {
  burn:   { name: '화상', color: '#ff8a3a', dur: 3, dps: 0.025 },
  poison: { name: '중독', color: '#8ad04a', dur: 6, dps: 0.012, noRegen: true, stacks: 3 },
  bleed:  { name: '출혈', color: '#d03a4a', dur: 4, dps: 0.015, moving: 2 },  // 움직이면 2배
  slow:   { name: '둔화', color: '#7ab0ff', dur: 2.5, slow: 0.55 },
  stun:   { name: '기절', color: '#ffe066', dur: 1.0, stun: true },
  freeze: { name: '빙결', color: '#bfefff', dur: 1.6, freeze: true, shatter: 1.5 },
  weak:   { name: '약화', color: '#b08ad0', dur: 5, weak: 0.7 },
  vuln:   { name: '취약', color: '#ff6aa0', dur: 4, vuln: 1.25 },
};

// ── 소모품 (퀵슬롯) ─────────────────────────────────────────
//   regen: 맞지 않는 동안 over초에 걸쳐 heal만큼 (맞으면 끊긴다). 포션만 즉시 회복 — 그래서 귀하다
//   turn: 사이드뷰 턴제에서 쓸 때 (1~8). 쓰는 사람의 차례 하나를 쓴다 — heal 바로 회복, cures 푸는 상태
export const CONSUMABLES = {
  bandage:  { name: '붕대', rarity: 'common', regen: { heal: 40, over: 8 }, desc: '맞지 않는 동안 8초에 걸쳐 40 회복. 맞으면 끊긴다. 출혈을 멈춘다', cures: ['bleed'], turn: { heal: 35 } },
  herb:     { name: '약초', rarity: 'uncommon', regen: { heal: 30, over: 5 }, desc: '맞지 않는 동안 5초에 걸쳐 30 회복. 맞으면 끊긴다. 중독을 푼다', cures: ['poison'], turn: { heal: 25 } },
  potion:   { name: '회복 물약', rarity: 'epic', heal: 70, desc: '바로 70 회복. 마을에서도 구하기 어렵다', turn: { heal: 90 } },
  antidote: { name: '해독초', rarity: 'common', cures: ['poison', 'weak'], desc: '중독·약화를 푼다', turn: { cures: ['poison', 'weak'] } },
  ointment: { name: '화상 연고', rarity: 'uncommon', cures: ['burn', 'freeze'], desc: '화상·빙결을 푼다', turn: { cures: ['burn'], heal: 10 } },
};
export const QUICK_CD = 0.8; // 소모품끼리 공유하는 재사용 대기
export const QUICK_DEFAULT = ['bandage', 'herb', 'potion', 'antidote', 'ointment', null, null, null];
export const STARTER_KIT = { bandage: 5, herb: 3, potion: 1, antidote: 2, ointment: 1 };

// ── 장비 ────────────────────────────────────────────────────
//   slot(장비의 종류): head 투구 | armor 갑옷 | boots 신발 | gloves 장갑 | accessory 악세사리(1·2칸) | necklace 목걸이
//                     | backpack 배낭 | offhand 보조장비 | weapon 무기(1·2칸, 2는 예비 — 바꿔 들 수 있다)
//   mods: 스킬을 바꾼다 — { skill, ...덮어쓸 값 } (form: 이름·모양까지 바꾸는 변형)
//   set: 세트 이름
//   look: 주인공 도트에 입힐 색 (장비 외형) — body: [밝은 색, 어두운 색] 옷 두 톤을 바꾼다, blade: 칼날 색(액션 전투에서 보인다)
export const EQUIPMENT = {
  woodSword:   { name: '목검', slot: 'weapon', rarity: 'common', atk: 0, desc: '허수아비를 치던 목검.' },
  knightBlade: { name: '기사단 장검', slot: 'weapon', rarity: 'rare', atk: 4, set: 'knight', desc: '셀레나가 쓰던 것과 같은 규격.', look: { blade: 'c8d0e0' } },
  twinEdge:    {
    name: '쌍날 「가로지르기」', slot: 'weapon', rarity: 'legendary', unique: true, atk: 6,
    mods: [{ skill: 'q', name: '수평베기', shape: 'arc', range: 40, arc: 150, dmgMul: 2 }],
    desc: '찌르기가 수평베기로 바뀐다. 피해 2배.', look: { blade: 'ffbf47' },
  },
  knightPlate: { name: '기사단 흉갑', slot: 'armor', rarity: 'rare', def: 0.1, set: 'knight', desc: '받는 피해 -10%.', look: { body: ['c8d0e0', '6a7488'] } },
  mirrorBuckler: {
    name: '거울 방패', slot: 'offhand', rarity: 'epic', unique: true,
    mods: [{ skill: 'e', blocksShots: true, reflect: true }],
    desc: '막기가 탄환·원거리 공격도 막고 되받아친다.',
  },
  wanderCoat:  { name: '나그네 외투', slot: 'armor', rarity: 'uncommon', def: 0.05, desc: '받는 피해 -5%. 눈길에서 얻은 두꺼운 외투.', look: { body: ['b89a6a', '6a5236'] } },
  oldHelm:     { name: '빈 기사의 투구', slot: 'head', rarity: 'rare', def: 0.06, desc: '받는 피해 -6%. 길 잃은 기사의 투구. 안쪽에 영주 기사단의 옛 문장이 있다.' },
  orcGloves:   { name: '오크 가죽 장갑', slot: 'gloves', rarity: 'uncommon', atk: 2, desc: '거칠게 무두질한 가죽 장갑. 손에 힘이 잘 실린다.' },
  emberCharm:  { name: '불씨 부적', slot: 'accessory', rarity: 'uncommon', mods: [{ skill: 'atk', status: { id: 'burn', chance: 0.2 } }], desc: '기본 공격이 20% 확률로 화상을 입힌다.' },
};
export const SETS = {
  knight: {
    name: '기사단', pieces: ['knightBlade', 'knightPlate'],
    bonus: { 2: { desc: '휘두르기 출혈 확정, 돌진 재사용 -1초', mods: [{ skill: 'w', status: { id: 'bleed', chance: 1 } }, { skill: 'r', cdAdd: -1 }] } },
  },
};
// 장비 칸: 장비 종류 → 들어갈 수 있는 칸
export const EQUIP_SLOTS = ['head', 'armor', 'boots', 'gloves', 'acc1', 'acc2', 'necklace', 'backpack', 'offhand', 'weapon', 'weapon2'];
export const SLOT_FITS = {
  head: ['head'], armor: ['armor'], boots: ['boots'], gloves: ['gloves'], accessory: ['acc1', 'acc2'],
  necklace: ['necklace'], backpack: ['backpack'], offhand: ['offhand'], weapon: ['weapon', 'weapon2'],
};
export const ACTIVE_SLOTS = EQUIP_SLOTS.filter((k) => k !== 'weapon2'); // 무기 2는 예비: 바꿔 들기 전엔 효과가 없다
export const EQUIP_DEFAULT = { weapon: 'woodSword', weapon2: null, armor: null, head: null, boots: null, gloves: null, acc1: null, acc2: null, necklace: null, backpack: null, offhand: null };

// ── 보스 2단계 ──────────────────────────────────────────────
//   attacks: 차례로 돈다. tell = 예고 시간(바닥에 빨간 표시), 그 뒤에 판정
//   sweep: 부채꼴 쓸기 · ring: 둥글게 퍼지는 먼지 탄 · charge: 직선 돌진 · motes: 쫓아오는 먼지
export const ACTION_BOSSES = {
  sweeper: {
    name: '정리자의 그림자', radius: 16, speed: 34, contact: 6,
    phaseAt: 0.5,                 // 1단계(턴제)에서 체력이 이만큼 남으면 2단계로
    enrageAt: 0.4,                // 2단계 체력이 이 아래면 예고가 빨라진다
    attacks: [
      { id: 'sweep', name: '쓸어내기', tell: 0.9, range: 54, arc: 140, dmg: 22 },
      { id: 'ring', name: '먼지 털기', tell: 0.7, count: 14, speed: 70, dmg: 9, status: { id: 'slow', chance: 0.4 } },
      { id: 'charge', name: '치우기', tell: 0.8, dist: 150, width: 18, dmg: 18, status: { id: 'stun', chance: 0.5 } },
      { id: 'motes', name: '먼지 구름', tell: 0.5, count: 4, speed: 42, life: 4, dmg: 7, status: { id: 'poison', chance: 0.5 } },
    ],
    rest: 0.9,                    // 공격 사이 쉬는 시간
    drops: ['twinEdge'],          // 처음 이기면 얻는 장비 (빈 칸이면 바로 낀다)
  },
};

export const ARENA = { w: 320, h: 208 };
