// 가게. 가게 주인(keeper)에게 말을 걸면(E) 가게 창이 열린다(src/ui/ShopPanel.js). 주인이 자리에 없으면 가게도 없다.
// 규칙(사고팔기·값·열린 시간)은 src/shop/shop.js, 필드에 붙이는 건 src/field/systems/Shops.js.
//
//   SHOPS[id] = {
//     name, keeper: 인물, map: 맵 id,
//     hours: ['HH:MM', 'HH:MM'],      시계가 도는 날에만 본다. 밖이면 닫았다
//     greet: [말, …]                   창이 열릴 때 주인이 하는 말 (하나씩 돌아가며)
//     closed: '말'                     닫힌 시간에 말 걸면
//     stock: [{ item, when?, n? }]     파는 것. when은 대본 조건, n은 하루에 파는 수(없으면 무한)
//     buys: ['food' | 'battle' | 'gear' | 'material']  사들이는 것의 종류 (없으면 사들이지 않는다)
//   }
// 지워진 주인의 가게는 열리지 않는다(주인이 필드에 없으니까). 가게 이름도 명패에서 바뀐다(Signs).

// 화폐: 동전(닢). 처음엔 주머니에 START_PURSE닢
export const COIN = '닢';
export const START_PURSE = 30;
// 사들일 때는 파는 값의 이만큼
export const SELL_RATE = 0.5;

// 값(닢). 여기 없는 것은 사고팔 수 없다(소중한 것, 보스가 떨군 것)
export const PRICES = {
  // 먹을 것
  honeybread: 5, chestnut: 3, apple: 3, jerky: 6, fish: 5, pie: 9, churu: 18,
  // 전투에 쓰는 것
  bandage: 4, herb: 7, antidote: 5, ointment: 8, potion: 45,
  // 장비
  leatherBoots: 30, leatherVest: 48, ironSword: 55, dwarfBlade: 160, frostCloak: 120, crystalCharm: 110,
  wanderCoat: 60, orcGloves: 40,
  // 재료
  wood: 3, stone: 3,
};

// 싸워서 받는 것: 무리 하나당, 보스는 따로 (src/scenes/battle/ActionScene.js)
export const BOUNTY = { foe: 2, boss: 40, raid: 25 };

export const SHOPS = {
  // 우리 마을 그레타네 잡화점: 붕대·실·등잔 기름 — 마을 사람이 늘 사는 것들. 목재·돌은 한스(목수)네로 넘긴다며 사들인다
  general: {
    name: '그레타네 잡화점', keeper: 'greta', map: 'village', hours: ['07:00', '19:00'],
    greet: ['어서 와요. [y]붕대[/y]는 늘 있어요. 견습들이 하도 굴러서.', '목재랑 돌 있으면 가져와요. 한스네 공방으로 넘기거든요.', '[mood=smile]소집 소문 돌고 나서 신발이 잘 나가요.'],
    closed: '오늘은 닫았어요. 내일 아침 일찍 열어요.',
    stock: [
      { item: 'bandage' }, { item: 'antidote' }, { item: 'apple' }, { item: 'jerky' },
      { item: 'ointment', when: { minDay: 11 } },
      { item: 'leatherBoots', n: 1 }, { item: 'leatherVest', n: 1, when: { ifFlag: 'rank.squire' } },
    ],
    buys: ['food', 'battle', 'material'],
  },
  // 로웬 장터: 마이의 과일 좌판
  fruit: {
    name: '마이의 과일 좌판', keeper: 'mai', map: 'trade', hours: ['07:00', '18:00'],
    greet: ['사과 사세요! [mood=smile]남쪽 과수원 거예요.', '오늘 건 달아요. 하나 맛보실래요? …아, 돈은 받아요.'],
    closed: '좌판 접었어요. 내일 아침에 와요!',
    stock: [{ item: 'apple' }, { item: 'chestnut' }, { item: 'pie', n: 3 }],
    buys: ['food'],
  },
  // 로웬 상인 조합: 먼 데서 온 물건. 물약과 '바다 건너 온' 간식
  guild: {
    name: '로웬 상인 조합', keeper: 'orban', map: 'trade', hours: ['08:00', '20:00'],
    greet: ['조합 물건은 비싸지. 대신 [y]먼 데서[/y] 왔어.', '[mood=neutral]그 봉지 간식? 남쪽 배가 싣고 왔는데, 어디서 만든 건지 선장도 모르더군.'],
    closed: '조합 문은 닫았네. 내일 오게.',
    stock: [
      { item: 'potion', n: 2 }, { item: 'herb' }, { item: 'ointment' }, { item: 'jerky' },
      { item: 'churu', n: 2 }, { item: 'wanderCoat', n: 1 },
    ],
    buys: ['food', 'battle', 'gear', 'material'],
  },
  // 드워프 마을 브로크의 대장간: 쇠붙이
  forge: {
    name: '브로크의 대장간', keeper: 'brok', map: 'dwarf', hours: ['06:00', '21:00'],
    greet: ['쇠를 보러 왔나. 만지는 건 공짜다.', '[mood=neutral]소집용 검을 벼리느라 손이 모자라. 그래도 [y]하나쯤[/y]은 내주지.'],
    closed: '불을 껐다. 아침에 다시 지핀다.',
    stock: [{ item: 'ironSword', n: 1 }, { item: 'dwarfBlade', n: 1 }, { item: 'leatherBoots', n: 1 }, { item: 'bandage' }],
    buys: ['gear', 'material'],
  },
  // 항구 넬의 생선 가게
  fishmonger: {
    name: '넬의 생선 가게', keeper: 'nell', map: 'harbor', hours: ['05:00', '17:00'],
    greet: ['오늘 고등어 좋아요! 말린 것도 있어요.', '[mood=smile]고양이 데리고 다녀요? 말린 생선 하나면 평생 친구예요.'],
    closed: '오늘 장사 끝! 내일 새벽 배 들어오면 와요.',
    stock: [{ item: 'fish' }, { item: 'jerky' }],
    buys: ['food'],
  },
  // 서리 마을 고르드의 여관: 파이와 털 망토
  inn: {
    name: '서리 마을 여관', keeper: 'gord', map: 'frost', hours: ['06:00', '23:00'],
    greet: ['파이 막 구웠다! 오크 막아 주는 사람한텐 [y]값을 덜[/y] 받고 싶은데… 장사는 장사라.', '털 망토? 우리 마을 겨울을 나 본 사람은 하나씩 걸치지.'],
    closed: '오늘은 닫았다. 국은 내일 끓이마.',
    stock: [{ item: 'pie' }, { item: 'jerky' }, { item: 'frostCloak', n: 1 }, { item: 'ointment' }],
    buys: ['food', 'material'],
  },
  // 아스테라 키라의 물약 가게
  potions: {
    name: '키라의 물약 가게', keeper: 'kira', map: 'magic', hours: ['09:00', '21:00'],
    greet: ['물약은 [y]수정 물[/y]로 달여요. 그래서 비싸요.', '[mood=smile]수정 부적? 도란 씨가 깎은 거예요. 쥐면 맞은 데가 덜 아파요.'],
    closed: '오늘 솥은 식었어요. 내일 오세요.',
    stock: [{ item: 'potion', n: 3 }, { item: 'herb' }, { item: 'antidote' }, { item: 'crystalCharm', n: 1 }],
    buys: ['battle', 'material'],
  },
};
