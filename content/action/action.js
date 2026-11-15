// 탑뷰 액션 전투 데이터. 이 게임의 모든 전투가 이 방식이다(적 목록은 content/action/foes.js). 조작에 기대는 전투.
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

// ── 손맛 ────────────────────────────────────────────────
//   accel/decel: 이동이 붙고 멎는 빠르기(초당, 클수록 즉각). 툭 서지 않고 미끄러지지도 않게
//   buffer: 쿨다운·구르기 중에 누른 공격·스킬을 이만큼(초) 기억했다가 되는 순간 쓴다
//   hurtInvuln: 맞은 뒤 잠깐 무적(깜빡임) — 한 번에 여러 대가 겹쳐 터지지 않게
//   recover: 기본 공격·스킬을 쓴 뒤 잠깐 느려지는 시간(무게) / 배수
export const FEEL = { accel: 16, decel: 20, buffer: 0.16, hurtInvuln: 0.2, recover: { atk: 0.12, q: 0.22, w: 0.22 }, recoverMul: 0.35 };
// 구르기(Space): 무적으로 예고를 뚫고 지나간다. 이동 방향(없으면 보는 쪽)으로
export const DODGE = { dist: 44, dur: 0.2, invuln: 0.26, cd: 0.6 };
// 기본 공격 3연타: 이어서 베면 셋째가 넓고 세게 민다. window 안에 다시 베야 이어진다
export const COMBO = { window: 0.6, hits: [{ dmgMul: 1, knock: 70 }, { dmgMul: 1.1, knock: 70 }, { dmgMul: 1.8, knock: 170, arc: 160, range: 30 }] };
// 넉백: 맞은 적이 밀려나는 힘(px/초)이 이만큼 줄어든다(초당 배수) / 작은 적은 잠깐 멈칫한다
export const KNOCK = { decay: 9, flinch: 0.14 };
// 난이도: 적 전체에 곱한다. 이 게임은 어렵다 — 예고를 읽고 구르고, 틈에 벤다
//   track: 예고 시간의 앞쪽 이만큼은 적이 주인공을 따라 겨눈다(그 뒤로 굳는다). 걸어서 비켜서는 늦고, 굴러야 한다
export const DIFFICULTY = { hp: 1.15, dmg: 1.45, contact: 1.4, speed: 1.12, rest: 0.8, tell: 0.92, track: 0.6, turn: 5 };

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
//   slot(장비의 종류): head 투구 | armor 갑옷 | cape 망토 | boots 신발 | gloves 장갑 | accessory 악세사리(1·2칸) | necklace 목걸이
//                     | backpack 배낭 | offhand 보조장비 | weapon 무기(1·2칸, 2는 예비 — 바꿔 들 수 있다)
//   mods: 스킬을 바꾼다 — { skill, ...덮어쓸 값 } (form: 이름·모양까지 바꾸는 변형)
//   set: 세트 이름
//   look: 주인공 도트에 입힐 색 (장비 외형) — body: [밝은 색, 어두운 색] 옷 두 톤을 바꾼다, head: [밝은, 어두운, 테두리] 머리 두 톤을 투구·모자 색으로(테두리는 이마 위 한 줄), cape: [밝은, 어두운] 망토,
//         shape: 투구 모양 'brim'(챙) | 'horns'(뿔) — 그 이름의 칸에 [밝은, 어두운] 색 (예: horns: ['e8dcc0', 'a08c64']),
//         blade: 칼날 색(액션 전투에서 보인다)
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
  oldHelm:     { name: '빈 기사의 투구', slot: 'head', rarity: 'rare', def: 0.06, desc: '받는 피해 -6%. 길 잃은 기사의 투구. 안쪽에 영주 기사단의 옛 문장이 있다.', look: { head: ['c4cad2', '6a7280', '2e343c'] } },
  strawHat:    { name: '밀짚모자', slot: 'head', rarity: 'common', def: 0.01, desc: '받는 피해 -1%. 수확 철에 들에서 쓰는 챙 넓은 모자. 햇볕을 가린다.', look: { head: ['e8c868', 'b08a3a', '8a5a2a'], shape: 'brim', brim: ['f0d070', 'b08a3a'] } },
  hornHelm:    { name: '뿔 투구', slot: 'head', rarity: 'rare', def: 0.07, atk: 1, desc: '받는 피해 -7%. 오크 장정이 쓰던 쇠 투구. 무슨 짐승인지 모를 뿔을 박아 넣었다.', look: { head: ['8a9098', '50565e', '2e343c'], shape: 'horns', horns: ['f0e6cc', 'b8a888'] } },
  furHat:      { name: '털모자', slot: 'head', rarity: 'uncommon', def: 0.03, desc: '받는 피해 -3%. 서리 마을 여관에서 파는 양털 모자. 귀까지 덮는다.', look: { head: ['ece4d4', 'a8987e', 'a83a3a'] } },
  dwarfHelm:   { name: '드워프 철모', slot: 'head', rarity: 'uncommon', def: 0.05, desc: '받는 피해 -5%. 갱도에서 쓰는 둥근 철모. 머리 위로 떨어지는 돌을 막는다.', look: { head: ['b8904e', '7a5a2c', '3a2a18'] } },
  // 가게에서 파는 것 (content/shop/shops.js)
  leatherBoots: { name: '가죽 신발', slot: 'boots', rarity: 'uncommon', def: 0.03, desc: '받는 피해 -3%. 그레타네 잡화점의 질긴 소가죽 신발. 밑창에 징이 박혀 있다.' },
  leatherVest: { name: '가죽 조끼', slot: 'armor', rarity: 'uncommon', def: 0.06, desc: '받는 피해 -6%. 두 겹으로 덧댄 사냥꾼용 조끼.', look: { body: ['9a6a3a', '5a3a1e'] } },
  ironSword: { name: '철검', slot: 'weapon', rarity: 'uncommon', atk: 2, desc: '드워프 대장간에서 막 벼린 철검. 목검보다 무겁고 정직하다.', look: { blade: 'a8b0bc' } },
  dwarfBlade: { name: '드워프 장검', slot: 'weapon', rarity: 'rare', atk: 5, desc: '브로크가 산의 불로 벼린 장검. 날에 룬이 희미하게 새겨져 있다.', look: { blade: 'e8c870' } },
  frostCloak: { name: '서리 망토', slot: 'cape', rarity: 'rare', def: 0.09, desc: '받는 피해 -9%. 서리 마을 사람들이 겨울을 나는 털 망토.', look: { cape: ['e8eef4', '8a9ab0'] } },
  travelCape: { name: '여행자 망토', slot: 'cape', rarity: 'uncommon', def: 0.03, desc: '받는 피해 -3%. 로웬 상인 조합이 길 떠나는 사람에게 파는 갈색 모직 망토. 비를 막는다.', look: { cape: ['a0784a', '5e4228'] } },
  redCape:    { name: '토르크의 붉은 망토', slot: 'cape', rarity: 'rare', atk: 2, def: 0.04, desc: '받는 피해 -4%. 토르크가 두르던 붉은 망토. 거칠게 짠 오크 털실이라 무겁고 따뜻하다.', look: { cape: ['c84a3a', '7a2420'] } },
  crystalCharm: { name: '수정 부적', slot: 'accessory', rarity: 'rare', def: 0.04, desc: '받는 피해 -4%. 아스테라의 마력 수정 조각. 쥐면 손이 서늘하다.' },
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
export const EQUIP_SLOTS = ['head', 'armor', 'cape', 'boots', 'gloves', 'acc1', 'acc2', 'necklace', 'backpack', 'offhand', 'weapon', 'weapon2'];
export const SLOT_FITS = {
  head: ['head'], armor: ['armor'], cape: ['cape'], boots: ['boots'], gloves: ['gloves'], accessory: ['acc1', 'acc2'],
  necklace: ['necklace'], backpack: ['backpack'], offhand: ['offhand'], weapon: ['weapon', 'weapon2'],
};
export const ACTIVE_SLOTS = EQUIP_SLOTS.filter((k) => k !== 'weapon2'); // 무기 2는 예비: 바꿔 들기 전엔 효과가 없다
export const EQUIP_DEFAULT = { weapon: 'woodSword', weapon2: null, armor: null, cape: null, head: null, boots: null, gloves: null, acc1: null, acc2: null, necklace: null, backpack: null, offhand: null };

export const ARENA = { w: 384, h: 240 };
