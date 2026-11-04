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

// 모든 아이템의 이름·등급은 가방 목록(content/items.js) 한 곳에서 (전투 소모품·장비 포함)
export { ITEMS } from '../items.js';
