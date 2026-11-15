// 유물: 지니고 있으면 싸움이 바뀌는 물건(패시브). 싸워서 가끔, 보스에게서, 몇몇 가게에서 얻는다. 같은 것을 또 얻으면 겹친다.
// 하나하나는 작지만 서로 섞인다 — 칼바람에 불씨 이빨이 붙으면 불타는 칼바람, 쫓는 눈까지 있으면 쫓아가 태운다.
//   fx(효과) — 엔진(src/action/engine.js)이 읽는다. 겹치면 더하거나(수치) 켠다(on/off)
//     dmg: 모든 피해 +비율 · speed: 이동 +비율 · hp: 최대 체력 +값 · atkCd: 기본 공격 재사용 -비율 · dodgeCd: 구르기 재사용 -비율
//     reach: 베기·찌르기 범위 +비율 · knock: 넉백 +비율
//     wave: 기본 공격마다 칼바람(앞으로 날아가는 칼날 탄)을 날린다. 값 = 기본 공격 피해에 대한 비율
//     waveCount: 칼바람 갈래 +n · waveSeek: 칼바람이 적을 쫓는다 · wavePierce: 꿰뚫는 적 수 +n · waveSize: 칼바람 크기 +비율
//     onHit: { status, chance } 맞힌 적에게 (칼바람·번개 포함) · leech: 준 피해의 비율만큼 회복(초당 상한 있음)
//     chain: 맞히면 그 확률로 가까운 적에게 번개(그 피해의 60%)
//     killBlast: 쓰러진 적이 터진다(그 적 최대 체력의 비율로 둘레에) · killHeal: 쓰러뜨리면 회복
//     dodgeRing: 구르면 그 자리에 칼바람 고리(n갈래) · dodgeCharge: 구른 뒤 첫 공격 피해 ×(1+값)
//     thorns: 맞으면 둘레로 가시(n갈래) · thirdWave: 3연타 셋째가 칼바람 n갈래를 부채꼴로
//     calm: 맞지 않고 4초 지나면 다음 공격 ×(1+값) · rage: 체력 30% 이하면 피해 +비율 · echo: 찌르기·휘두르기가 0.3초 뒤 한 번 더(그 비율)
//   icon: 16×16 그림 — shape(돌·반지·이빨·눈·깃털·심장·씨앗·종·탈·못·조각·초) + 색 셋
//   where: 어디서 나오나 — 'drop'(싸움 전리품), 'boss'(보스), 'shop'(가게) · 그림자 속(땅)마다 가중치는 encounters.js
export const RELICS = {
  whetstone:   { name: '숫돌', rarity: 'common', fx: { dmg: 0.15 }, desc: '모든 피해 +15%. 손바닥만 한 숫돌. 날이 잘 서면 마음도 선다.', icon: { shape: 'stone', c: ['#a8a8b0', '#6a6a78', '#d8d8e0'] }, where: ['drop', 'shop'] },
  featherShoe: { name: '깃털 신', rarity: 'common', fx: { speed: 0.12, dodgeCd: 0.15 }, desc: '이동 +12%, 구르기 재사용 -15%. 깃털을 꿰맨 가벼운 신.', icon: { shape: 'feather', c: ['#f0f0e8', '#b8b8a8', '#ffffff'] }, where: ['drop', 'shop'] },
  ironHeart:   { name: '쇠 심장', rarity: 'uncommon', fx: { hp: 25 }, desc: '최대 체력 +25. 드워프가 맹세할 때 쥐는 쇠붙이 심장.', icon: { shape: 'heart', c: ['#9aa0a8', '#5a6068', '#d0d6de'] }, where: ['drop', 'shop', 'boss'] },
  quickHands:  { name: '재빠른 손', rarity: 'uncommon', fx: { atkCd: 0.2 }, desc: '기본 공격 재사용 -20%. 소매치기 장갑에서 떨어진 단추.', icon: { shape: 'ring', c: ['#e8c060', '#a07828', '#fff0b0'] }, where: ['drop'] },
  giantGrip:   { name: '거인의 손잡이', rarity: 'rare', fx: { reach: 0.25, knock: 0.5 }, desc: '베기·찌르기 범위 +25%, 넉백 +50%. 사람 손에는 너무 큰 칼자루 조각.', icon: { shape: 'stone', c: ['#8a6a4a', '#5a3e28', '#c09a70'] }, where: ['drop', 'boss'] },
  glassBlade:  { name: '유리 칼날', rarity: 'epic', fx: { dmg: 0.45, hp: -35 }, desc: '피해 +45%, 최대 체력 -35. 잘 베이고, 잘 깨진다.', icon: { shape: 'shard', c: ['#c8f0ff', '#78b8d8', '#ffffff'] }, where: ['drop', 'boss'] },
  bladeWave:   { name: '칼바람 조각', rarity: 'rare', fx: { wave: 0.6 }, desc: '기본 공격마다 앞으로 칼바람이 날아간다(기본 공격 피해의 60%). 바람이 깃든 쇳조각.', icon: { shape: 'shard', c: ['#d8f8e8', '#78c8a0', '#ffffff'] }, where: ['drop', 'boss', 'shop'] },
  twinWind:    { name: '두 갈래 바람', rarity: 'rare', fx: { waveCount: 1, wave: 0.15 }, desc: '칼바람이 한 갈래 더 나간다. 칼바람이 없으면 기본 공격마다 약한 칼바람.', icon: { shape: 'feather', c: ['#c8e8ff', '#7aa0d8', '#ffffff'] }, where: ['drop'] },
  seekingEye:  { name: '쫓는 눈', rarity: 'epic', fx: { waveSeek: 1 }, desc: '칼바람·가시가 가까운 적을 쫓아간다. 감기지 않는 유리 눈알.', icon: { shape: 'eye', c: ['#f0f0f0', '#4a7ad8', '#141b1b'] }, where: ['drop', 'boss'] },
  needle:      { name: '꿰뚫는 바늘', rarity: 'uncommon', fx: { wavePierce: 2, waveSize: 0.2 }, desc: '칼바람이 적 둘을 더 꿰뚫고 조금 커진다. 재봉사의 큰 바늘.', icon: { shape: 'nail', c: ['#d8d8e0', '#8a8a98', '#ffffff'] }, where: ['drop', 'shop'] },
  emberTooth:  { name: '불씨 이빨', rarity: 'uncommon', fx: { onHit: { status: 'burn', chance: 0.25 } }, desc: '맞힌 적이 25% 확률로 탄다. 불짐승이 빠뜨린 이빨. 아직 따뜻하다.', icon: { shape: 'tooth', c: ['#ffb070', '#d0502a', '#fff0c0'] }, where: ['drop'] },
  venomFang:   { name: '독니', rarity: 'uncommon', fx: { onHit: { status: 'poison', chance: 0.22 } }, desc: '맞힌 적이 22% 확률로 중독된다(겹친다). 늪 뱀의 송곳니.', icon: { shape: 'tooth', c: ['#a8e070', '#5a9030', '#e8ffc0'] }, where: ['drop'] },
  frostShard:  { name: '서리 조각', rarity: 'rare', fx: { onHit: { status: 'slow', chance: 0.3 }, freeze: 0.06 }, desc: '맞힌 적이 30% 확률로 느려지고, 6% 확률로 언다. 녹지 않는 얼음.', icon: { shape: 'shard', c: ['#e0f4ff', '#88c0e8', '#ffffff'] }, where: ['drop', 'shop'] },
  leechRing:   { name: '거머리 반지', rarity: 'rare', fx: { leech: 0.04 }, desc: '준 피해의 4%만큼 체력이 찬다(1초에 최대 6). 안쪽에 이빨 자국.', icon: { shape: 'ring', c: ['#c84a5a', '#7a2030', '#ff9aa8'] }, where: ['drop', 'boss'] },
  stormNail:   { name: '번개 못', rarity: 'rare', fx: { chain: 0.22 }, desc: '맞히면 22% 확률로 가까운 적에게 번개가 튄다(60% 피해). 벼락 맞은 종탑에서 빠진 못.', icon: { shape: 'nail', c: ['#ffe878', '#c8a028', '#ffffff'] }, where: ['drop', 'boss'] },
  bombSeed:    { name: '터지는 씨앗', rarity: 'rare', fx: { killBlast: 0.35 }, desc: '쓰러진 적이 터진다(그 적 체력의 35%를 둘레에). 깨물면 안 된다.', icon: { shape: 'seed', c: ['#e0703a', '#8a3018', '#ffc080'] }, where: ['drop'] },
  soulCandle:  { name: '넋 촛불', rarity: 'uncommon', fx: { killHeal: 2 }, desc: '적을 쓰러뜨릴 때마다 체력 2. 꺼져도 다시 붙는 초.', icon: { shape: 'candle', c: ['#f0e8d0', '#b8a888', '#ffd060'] }, where: ['drop', 'shop'] },
  shadowStep:  { name: '그림자 걸음', rarity: 'epic', fx: { dodgeRing: 6 }, desc: '구르면 그 자리에 칼바람 고리가 퍼진다. 발자국이 남지 않는 신발 끈.', icon: { shape: 'feather', c: ['#8a7ab8', '#4a3a78', '#c8b8f0'] }, where: ['drop', 'boss'] },
  ambush:      { name: '잠복의 깃', rarity: 'uncommon', fx: { dodgeCharge: 0.8 }, desc: '구른 뒤 첫 공격 피해 +80%. 올빼미 깃털.', icon: { shape: 'feather', c: ['#c8a070', '#7a5a38', '#f0d8b0'] }, where: ['drop'] },
  thornCoat:   { name: '가시 껍질', rarity: 'uncommon', fx: { thorns: 8 }, desc: '맞으면 둘레로 가시 여덟 개가 튄다. 고슴도치가 벗어 둔 듯한 껍질.', icon: { shape: 'seed', c: ['#8aa050', '#4a6028', '#c8e090'] }, where: ['drop'] },
  thirdMoon:   { name: '세 번째 달', rarity: 'epic', fx: { thirdWave: 3 }, desc: '3연타의 셋째가 칼바람 셋을 부채꼴로 날린다. 하늘에 없는 달이 그려진 메달.', icon: { shape: 'ring', c: ['#e0e0ff', '#8a8ad0', '#ffffff'] }, where: ['drop', 'boss'] },
  calmHeart:   { name: '고요한 심장', rarity: 'rare', fx: { calm: 1 }, desc: '4초 동안 맞지 않으면 다음 공격 피해 2배. 느리게 뛰는 돌 심장.', icon: { shape: 'heart', c: ['#a0c8e0', '#5a88a8', '#e0f0ff'] }, where: ['drop', 'shop'] },
  rageMask:    { name: '성난 탈', rarity: 'rare', fx: { rage: 0.6 }, desc: '체력이 30% 아래면 피해 +60%. 오크 전사들이 쓰는 나무 탈.', icon: { shape: 'mask', c: ['#c85a3a', '#7a2a18', '#f0b080'] }, where: ['drop', 'boss'] },
  echoBell:    { name: '메아리 종', rarity: 'epic', fx: { echo: 0.6 }, desc: '찌르기·휘두르기가 0.3초 뒤 한 번 더 울린다(60%). 손톱만 한 종. 흔들지 않아도 운다.', icon: { shape: 'bell', c: ['#e8c060', '#a07828', '#fff0b0'] }, where: ['boss', 'shop'] },
};

// 얻는 확률: 이긴 싸움마다 무리 하나당 이만큼(최대 MAX), 보스는 처음 이길 때 하나 확정
export const RELIC_DROP = { perFoe: 0.012, max: 0.18 };

// ── 그림: 모양 틀 (a 밝은 몸, b 어두운 그늘, c 빛) ──
const SHAPES = {
  stone: ['................', '................', '................', '.....aaaaa......', '....aacccaa.....', '...aaccaaaab....', '..aaaaaaaaabb...', '..aaaaaaaaabb...', '..baaaaaaabbb...', '...bbaaaabbb....', '....bbbbbbb.....', '................', '................', '................', '................', '................'],
  feather: ['................', '..........ca....', '.........caa....', '........caab....', '.......caab.....', '......caab......', '.....caab.......', '....caab........', '....aab.........', '...aab..........', '..ab............', '.b..............', '................', '................', '................', '................'],
  heart: ['................', '................', '...aaa...aaa....', '..accaa.aaaab...', '..acaaaaaaaab...', '..aaaaaaaaaab...', '...aaaaaaaab....', '....aaaaaab.....', '.....aaaab......', '......aab.......', '.......b........', '................', '................', '................', '................', '................'],
  ring: ['................', '................', '.....aaaaa......', '....ac...ab.....', '...ac.....ab....', '...a.......b....', '...a.......b....', '...a.......b....', '...ab.....bb....', '....ab...bb.....', '.....bbbbb......', '................', '................', '................', '................', '................'],
  shard: ['................', '........c.......', '.......cab......', '.......cab......', '......caab......', '......caabb.....', '.....caaabb.....', '.....caaab......', '....caaabb......', '....caabb.......', '.....abb........', '......b.........', '................', '................', '................', '................'],
  eye: ['................', '................', '................', '....aaaaaaa.....', '..aaacbbbcaaa...', '.aaacbcccbcaaa..', '.aaaabcccbaaaa..', '..aaaabbbaaaa...', '....aaaaaaa.....', '................', '................', '................', '................', '................', '................', '................'],
  nail: ['................', '...aaaaaaa......', '...bbbbbbb......', '......cb........', '......ab........', '......ab........', '......ab........', '......ab........', '......ab........', '......ab........', '.......b........', '................', '................', '................', '................', '................'],
  tooth: ['................', '................', '....aaaaaaa.....', '...acaaaaaab....', '...acaaaaaab....', '...aaaaaaaab....', '....aaa.aab.....', '....aab..ab.....', '....aab..b......', '.....b..........', '................', '................', '................', '................', '................', '................'],
  seed: ['................', '.......c........', '......ca........', '.....aaaaa......', '....aacaaab.....', '...aacaaaabb....', '...aaaaaaabb....', '...aaaaaaabb....', '....aaaaabb.....', '.....bbbbb......', '................', '................', '................', '................', '................', '................'],
  candle: ['................', '.......c........', '......ccc.......', '.......c........', '......aab.......', '......aab.......', '......aab.......', '......aab.......', '......aab.......', '....bbbbbbb.....', '...bbbbbbbbb....', '................', '................', '................', '................', '................'],
  mask: ['................', '................', '...aaaaaaaaa....', '..aaaaaaaaaab...', '..aa.bb.bb.ab...', '..aaaaaaaaaab...', '..aaaacaaaaab...', '...aaaaaaaab....', '...ab.b.b.ab....', '....abbbbab.....', '.....bbbbb......', '................', '................', '................', '................', '................'],
  bell: ['................', '.......b........', '......aab.......', '.....acaab......', '.....acaab......', '....acaaaab.....', '....aaaaaab.....', '...aaaaaaaab....', '...bbbbbbbbb....', '.......c........', '................', '................', '................', '................', '................', '................'],
};

// 아이템 그림 꼴(content/art/icons.js가 읽는다)
export const RELIC_ICONS = Object.fromEntries(Object.entries(RELICS).map(([id, r]) => [id, { pal: { a: r.icon.c[0], b: r.icon.c[1], c: r.icon.c[2] }, rows: SHAPES[r.icon.shape] }]));
export const RELIC_SHAPES = Object.keys(SHAPES);
