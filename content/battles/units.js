// 전투 유닛과 스킬. 사이드뷰 턴제(에픽세븐·라테일 계열): 속도 게이지로 차례, 스킬 3개, 속성 상성.
// 수치는 기획 초안이다. 오픈베타에서 클리어율을 보고 조정한다(패턴을 쉽게 만들어 맞추지 않는다).
//
// 스킬
//   power   공격력 배수 (한 타 기준)
//   hits    타수 — 타마다 따로 회피 판정 (다단 히트는 회피형 체형이 유리)
//   target  'one' 적 하나 | 'all' 적 전체 | 'ally' 아군 하나 | 'self'
//   element 'fire' | 'wind' | 'earth' | 'light' | 'dark' | null
//   effect  { push: n } 대상 게이지 +n, { slow: n } 대상 게이지 -n, { heal: 배수 }, { guard: true } 다음 차례까지 피해 절반
//   cooldown 쓴 뒤 n차례 쉬어야 한다
//   tell    (적) 예고 문구. 있으면 한 차례 먼저 예고하고 다음 차례에 쓴다
//   status  'burn' 맞으면 화상(자기 차례 끝마다 최대 체력의 6%, 2차례). 저항(체형·마음가짐)만큼 버틸 확률
//
// 궁극기(ultimate): 때리거나 맞으면 게이지가 차고(0→100), 가득 차면 4번으로 쓴다. 쓰면 컷인 연출
//   effect.cancelTell: 적이 예고해 둔 기술을 지운다

export const ELEMENTS = { fire: '불', wind: '바람', earth: '땅', light: '빛', dark: '어둠' };

export const PARTY = {
  me: {
    name: '나', element: 'earth', maxHp: 120, atk: 22, def: 12, spd: 100, evade: 0.05,
    skills: [
      { id: 'strike', name: '내려치기', power: 1.0, hits: 1, target: 'one' },
      { id: 'flurry', name: '연타', power: 0.45, hits: 3, target: 'one', cooldown: 1 },
      { id: 'remember', name: '기억하기', power: 0, hits: 0, target: 'self', effect: { guard: true, push: 20 }, cooldown: 2, desc: '다음 차례까지 피해 절반, 게이지 +20' },
    ],
    ultimate: { id: 'ult', name: '이름을 부른다', power: 2.4, hits: 1, target: 'one', effect: { cancelTell: true }, line: '…잊지 않았어.', desc: '강한 일격, 적의 예고를 지운다' },
  },
  selena: {
    name: '셀레나', element: 'fire', maxHp: 150, atk: 20, def: 18, spd: 85, evade: 0.03,
    skills: [
      { id: 'slash', name: '베기', power: 1.0, hits: 1, target: 'one', element: 'fire' },
      { id: 'shield', name: '방패 세우기', power: 0, hits: 0, target: 'self', effect: { guard: true, taunt: true }, cooldown: 2, desc: '다음 차례까지 피해 절반, 적의 공격을 끈다' },
      { id: 'sweep', name: '휩쓸기', power: 0.7, hits: 1, target: 'all', element: 'fire', cooldown: 2, status: 'burn' },
    ],
    ultimate: { id: 'ult', name: '기사단의 성벽', power: 0.9, hits: 1, target: 'all', element: 'fire', effect: { guardAll: true }, line: '내 뒤로.', desc: '적 전체 공격, 아군 전원 방어' },
  },
  lu: {
    name: '루', element: 'light', maxHp: 95, atk: 24, def: 9, spd: 110, evade: 0.08,
    skills: [
      { id: 'spark', name: '빛살', power: 0.9, hits: 1, target: 'one', element: 'light' },
      { id: 'still', name: '멈춤', power: 0.4, hits: 1, target: 'one', element: 'light', effect: { slow: 40 }, cooldown: 2, desc: '대상 게이지 -40' },
      { id: 'mend', name: '이어 붙이기', power: 0, hits: 0, target: 'ally', effect: { heal: 1.4, push: 15 }, cooldown: 2, desc: '아군 회복, 게이지 +15' },
    ],
    ultimate: { id: 'ult', name: '멈춘 시간', power: 0.6, hits: 1, target: 'all', element: 'light', effect: { slow: 50 }, line: '잠깐만, 거기 있어.', desc: '적 전체 공격, 게이지 -50' },
  },
};

export const MONSTERS = {
  slime: {
    name: '슬라임', sprite: 'Slime', element: 'earth', maxHp: 60, atk: 12, def: 6, spd: 80, evade: 0.02,
    skills: [{ id: 'bump', name: '몸통 박치기', power: 1.0, hits: 1, target: 'one' }],
  },
  beast: {
    name: '불짐승', sprite: 'Beast', element: 'fire', maxHp: 80, atk: 16, def: 8, spd: 95, evade: 0.05,
    skills: [
      { id: 'claw', name: '할퀴기', power: 0.5, hits: 2, target: 'one', element: 'fire' },
      { id: 'roar', name: '포효', power: 0.6, hits: 1, target: 'all', element: 'fire', cooldown: 3, status: 'burn' },
    ],
  },
  owl: {
    name: '바람 올빼미', sprite: 'Owl', element: 'wind', maxHp: 55, atk: 15, def: 5, spd: 125, evade: 0.15,
    skills: [{ id: 'peck', name: '쪼기', power: 0.35, hits: 3, target: 'one', element: 'wind' }],
  },
  mole: {
    name: '땅굴 두더지', sprite: 'Mole', element: 'earth', maxHp: 90, atk: 14, def: 14, spd: 70, evade: 0.02,
    skills: [{ id: 'dig', name: '파고들기', power: 1.2, hits: 1, target: 'one', element: 'earth' }],
  },
  skull: {
    name: '떠도는 해골', sprite: 'Skull', element: 'dark', maxHp: 70, atk: 18, def: 8, spd: 100, evade: 0.08,
    skills: [
      { id: 'bite', name: '물기', power: 1.0, hits: 1, target: 'one', element: 'dark' },
      { id: 'forget', name: '잊게 하기', power: 0.3, hits: 1, target: 'one', element: 'dark', effect: { slow: 30 }, cooldown: 2 },
    ],
  },
  // 습격의 오크(content/raids.js). 그림은 필드 인물 도트(char)를 그대로 쓴다.
  // 굶주린 전사들이라 오래 버티지 못하고, 함성으로 서로를 몰아붙인다
  orc: {
    name: '오크 전사', char: 'orc', element: 'earth', maxHp: 85, atk: 17, def: 10, spd: 88, evade: 0.03,
    skills: [
      { id: 'club', name: '몽둥이질', power: 1.1, hits: 1, target: 'one', element: 'earth' },
      { id: 'howl', name: '함성', power: 0, hits: 0, target: 'self', effect: { push: 35 }, cooldown: 3 },
    ],
  },
  // 토르크: 족장의 아들. 큰 기술은 한 차례 먼저 예고한다(정리자의 그림자보다 짧은 순환)
  tork: {
    name: '토르크', char: 'tork', element: 'fire', maxHp: 560, atk: 36, def: 13, spd: 100, evade: 0.04,
    pattern: ['cleave', 'charge', 'cleave', 'roar'],
    skills: [
      { id: 'cleave', name: '도끼 내려찍기', power: 1.0, hits: 1, target: 'one', element: 'fire' },
      { id: 'charge', name: '엄니 들이받기', power: 2.7, hits: 1, target: 'one', element: 'fire', tell: '부러진 엄니를 앞으로 숙인다 — 다음 차례, 한 사람에게 강한 일격 (방어하면 절반)' },
      { id: 'roar', name: '잿빛 함성', power: 1.15, hits: 1, target: 'all', element: 'fire', status: 'burn', tell: '횃불을 치켜들고 숨을 들이켠다 — 다음 차례, 전원에게 불길' },
    ],
  },
  // 보스: 정리자의 그림자. 모든 큰 기술을 한 차례 먼저 예고한다(로스트아크식 패턴 예고).
  // 순서대로 돈다: 먼지 털기(다단 → 회피형 유리) → 쓸어내기(전체 강타 → 방어·통통 유리) → 치우기(게이지 깎기)
  sweeper: {
    name: '정리자의 그림자', boss: true, sprite: 'GiantSpirit', element: 'dark', maxHp: 750, atk: 38, def: 14, spd: 95, evade: 0,
    pattern: ['dust', 'sweep', 'tidy'],
    skills: [
      { id: 'dust', name: '먼지 털기', power: 0.32, hits: 6, target: 'one', element: 'dark', tell: '빗자루를 치켜든다 — 다음 차례, 한 사람에게 여섯 번 (피할수록 덜 맞는다)' },
      { id: 'sweep', name: '쓸어내기', power: 1.5, hits: 1, target: 'all', element: 'dark', tell: '바닥을 크게 쓸 준비를 한다 — 다음 차례, 전원에게 강한 일격 (방어하면 절반)' },
      { id: 'tidy', name: '치우기', power: 0.8, hits: 1, target: 'one', element: 'dark', effect: { slow: 60 }, tell: '누군가를 가리킨다 — 다음 차례, 그 사람의 차례를 뒤로 민다' },
    ],
  },
};
