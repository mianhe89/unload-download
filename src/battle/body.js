// 주인공 체형 → 전투 보정 (순수 함수, 기획서 '주인공 체형·컨디션 시스템').
// 정답 체형은 없다: 모든 체형이 얻는 것과 잃는 것을 함께 가진다. 수치는 스테이터스 창에 그대로 공개한다.
//   thin    마른     회피·속도 ↑, 체력 ↓, 넉백에 약함
//   normal  보통     균형
//   muscle  근육질   공격·방어 관통 ↑, 회피 소폭 ↓
//   chubby  통통     체력·방어·상태이상 저항 ↑, 한 방이 묵직함, 회피·속도 ↓
export const BODIES = {
  thin:   { name: '마른',   hp: 0.85, atk: 1.0,  def: 0.95, spd: 1.12, evade: +0.15, heavy: 1.0,  pierce: 0,   resist: 0 },
  normal: { name: '보통',   hp: 1.0,  atk: 1.0,  def: 1.0,  spd: 1.0,  evade: 0,     heavy: 1.0,  pierce: 0,   resist: 0 },
  muscle: { name: '근육질', hp: 1.05, atk: 1.15, def: 1.05, spd: 1.0,  evade: -0.03, heavy: 1.0,  pierce: 0.2, resist: 0.1 },
  chubby: { name: '통통',   hp: 1.25, atk: 1.0,  def: 1.2,  spd: 0.9,  evade: -0.08, heavy: 1.15, pierce: 0,   resist: 0.3 },
};

// 체중(kg)과 근육량(0~1)으로 체형을 정한다. 훈련으로 근육이 붙으면 같은 체중도 근육질이 된다
export function bodyOf({ weight = 65, muscle = 0.3 } = {}) {
  if (muscle >= 0.6 && weight >= 60) return 'muscle';
  if (weight < 56) return 'thin';
  if (weight >= 80) return 'chubby';
  return 'normal';
}

// 주인공 기본 능력치에 체형을 반영한다
export function applyBody(base, body = 'normal') {
  const b = BODIES[body];
  return {
    ...base,
    maxHp: Math.round(base.maxHp * b.hp),
    atk: Math.round(base.atk * b.atk),
    def: Math.round(base.def * b.def),
    spd: Math.round(base.spd * b.spd),
    evade: Math.max(0, Math.round((base.evade + b.evade) * 100) / 100),
    heavy: b.heavy,
    pierce: b.pierce,
    resist: b.resist,
    body,
  };
}
