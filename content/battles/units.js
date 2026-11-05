// 주인공의 바탕 능력치. 생활(체형·마음가짐·피로, src/life/life.js의 battleStats)과 히든 스킬이 이 위에 얹혀
// 액션 전투의 체력·힘·빠르기·돌진(src/action/engine.js의 bodyMods)이 된다. 상태 창에도 이 값이 보인다.
// 적은 content/action/foes.js. 동료는 없다 — 싸움은 늘 혼자다.
export const PARTY = {
  me: { name: '나', maxHp: 120, atk: 22, def: 12, spd: 100, evade: 0.05 },
};
