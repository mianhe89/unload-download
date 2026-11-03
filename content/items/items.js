// 아이템과 등급. 등급마다 색이 다르다 (대사·스테이터스 창·획득 알림 어디서나 같은 색).
//   ink  흰 말풍선 위 글자색 (진하게)
//   glow 어두운 창 위 글자색 (밝게)
export const RARITY = {
  common:    { name: '일반', ink: '#5a5664', glow: '#d8d4e2' },
  uncommon:  { name: '고급', ink: '#2e8a3e', glow: '#7ee08a' },
  rare:      { name: '희귀', ink: '#2a62c9', glow: '#7fb0ff' },
  epic:      { name: '영웅', ink: '#8a3ac4', glow: '#d39bff' },
  legendary: { name: '전설', ink: '#c86a00', glow: '#ffbf47' },
};
export const RARITY_ORDER = Object.keys(RARITY);

// 히든 스킬 등급 → 같은 색 체계
export const GRADE_RARITY = { N: 'common', R: 'rare', SR: 'epic', SSR: 'legendary' };

import { CONSUMABLES, EQUIPMENT } from '../action/action.js';

export const ITEMS = {
  wood:   { name: '목재', rarity: 'common', desc: '길가의 나무를 벤 것. 벤 자리는 다시 자라지 않는다.' },
  stone:  { name: '돌', rarity: 'common', desc: '바위를 깨서 얻은 돌.' },
  honeyBread: { name: '꿀빵', rarity: 'uncommon', desc: '호르트네 빵집의 꿀빵. 축제 날엔 금방 동난다.' },
  bellShard: { name: '종의 조각', rarity: 'rare', desc: '종탑의 종에서 떨어져 나온 금빛 조각. 아직 울림이 남아 있다.' },
  spiritLeaf: { name: '정령의 잎', rarity: 'epic', desc: '빛이 나는 잎. 손에 쥐면 지워진 이름이 잠깐 떠오른다.' },
  starDust: { name: '별가루', rarity: 'legendary', desc: '은하에서 떨어진 가루. 이 세계 바깥의 것이다.' },
};

// 전투 소모품·장비도 같은 표 (이름·등급 색을 한 곳에서)
for (const [k, v] of Object.entries({ ...CONSUMABLES, ...EQUIPMENT })) ITEMS[k] = { name: v.name, rarity: v.rarity, desc: v.desc };
