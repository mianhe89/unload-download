import { CONSUMABLES, EQUIPMENT } from './action/action.js';
// 가방에 드는 것들. 선택창 대신, 사람 곁에서 가방(I)을 열고 Enter로 건넨다(src/ui/BagPanel.js).
//   kind: 'food'(먹을 것, 건넬 수 있다) | 'material'(재료, 행동 파밍) | 'key'(소중한 것 — 건네지 않는다)
//   likes: { 인물: n }  그 사람이 얼마나 반가워하나 (2 반가움, 1 고마움, 0 그저 그럼, -1 난처함). 없으면 base
//   lines: { 인물: '받았을 때 하는 말' }  없으면 반가움 정도에 맞는 기본 말
//   has: 플래그 (key 아이템: 그 플래그가 켜져 있으면 가방에 보인다)
//   rarity: 등급 (content/items/items.js의 RARITY — 이름이 그 색으로 보인다). 없으면 일반
//   kind 'battle'(전투 소모품, 보스 2단계 퀵슬롯)·'gear'(장비, Enter로 입기)는 content/action/action.js에서 이름·설명을 가져온다
// 마음은 숫자로 보여 주지 않는다. 반응은 말풍선과 눈치 문장으로만.
export const ITEMS = {
  honeybread: {
    name: '꿀빵', kind: 'food', rarity: 'common', desc: '호르트네 빵집 꿀빵. 종이에 싸 두면 한나절은 따뜻하다.', base: 1,
    likes: { mia: 2, tom: 2, kid: 2, lu: 1, selena: 1, hort: -1, sei: 2 },
    lines: {
      mia: '꿀빵! …나 주려고 산 거야? 반 나눠 먹자.',
      tom: '오, 근무 중엔 이게 최고지. 어디 이르지 마라.',
      hort: '내 빵을 나한테 주면 어떡하냐. …마음은 고맙다.',
      selena: '…고맙다. 초소에서 먹지.',
      lu: '단 거 좋아. 가장자리엔 이런 게 없거든.',
      sei: '가이아께 올려도 될까요? …아, 저 먹으라고요? 그럼 반만요.',
    },
  },
  chestnut: {
    name: '군밤', kind: 'food', rarity: 'uncommon', desc: '겨울 장 북쪽 상인에게 산 군밤. 껍질째 따뜻하다.', base: 1,
    likes: { mia: 2, lu: 2, per: 2, granny: 2, selena: 0 },
    lines: {
      mia: '군밤이다! 장에서 사 왔어? 손 시렵지 않았어?',
      lu: '따뜻해. …이런 거, 오래 기억할 것 같아.',
      per: '허허, 군밤에는 노래가 따라오는 법이지. ♪',
      selena: '근무 중이다. …하나만.',
    },
  },
  wood: { name: '목재', kind: 'material', rarity: 'common', desc: '길 맵의 작은 나무를 베어 얻었다.', farm: true },
  stone: { name: '돌', kind: 'material', rarity: 'common', desc: '바위 무더기에서 캐냈다.', farm: true },
  ring: { name: '거친 쇠반지', kind: 'key', rarity: 'legendary', has: 'has.ring', desc: '에다가 손바닥에 올려 준 반지. 테두리가 아직 거칠다. 이 테두리로 종탑 벽에 이름을 새겼다.' },
  crown: { name: '리네의 화관', kind: 'key', rarity: 'epic', has: 'has.crown', desc: '수확제 밤, 리네가 짜 준 화관. 꽃은 조금 시들었다.' },
  ribbon: { name: '해바라기 끈', kind: 'key', rarity: 'epic', has: 'has.ribbon', desc: '소집 떠나는 아침, 미아가 가방 끈에 묶어 준 노란 끈. 미아 머리 장식과 같은 색이다. "이거 보면 돌아올 데 생각나라고."' },
};

// 전투 소모품(행동 파밍처럼 run.farm.items에 쌓인다)과 장비(run.gear)도 가방에 보인다
for (const [id, c] of Object.entries(CONSUMABLES)) ITEMS[id] = { name: c.name, kind: 'battle', rarity: c.rarity, desc: c.desc, farm: true };
for (const [id, e] of Object.entries(EQUIPMENT)) ITEMS[id] = { name: e.name, kind: 'gear', rarity: e.rarity, desc: e.desc, slot: e.slot };

// 받았을 때 반가움 정도별 기본 말
export const GIFT_LINES = {
  2: '와, 이거 좋아하는데. 고마워!',
  1: '고마워. 잘 받을게.',
  0: '…아, 응. 고마워.',
  '-1': '이건… 마음만 받을게.',
};

// 같은 사람에게는 하루에 한 번만 (같은 날 또 주면)
export const GIFT_AGAIN = '(오늘은 벌써 받았다는 눈치다. 내일 다시 주자.)';
