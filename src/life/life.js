// 생활: 먹고, 움직이고, 쉬는 만큼 몸과 마음이 변한다 (순수 함수 — 테스트 가능).
// 기획서 '주인공 체형·컨디션 시스템', '생활 방식과 마음가짐'.
// - 한 번의 행동으로 바뀌지 않는다. 쌓여서 서서히 움직인다.
// - 정답은 없다. 체형도 마음가짐도 얻는 것과 잃는 것을 함께 가진다.
// - 수치는 스테이터스 창에서 전부 보인다 (숨기는 건 유토피아 판정뿐).
import { bodyOf, applyBody, BODIES } from '../battle/body.js';
import { ACTIONS, MINDS, WALK_KCAL_PER_TILE } from '../../content/life/life.js';

export const freshLife = () => ({
  weight: 66,          // kg
  muscle: 0.3,         // 0~1
  fatigue: 0,          // 0~100
  mind: { relaxed: 0, diligent: 0, firm: 0 },
  walked: 0,           // 걸은 칸 (소모 칼로리 누적용)
  last: {},            // 행동별 마지막 시각 (ms)
});

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const round = (v, d = 2) => Math.round(v * 10 ** d) / 10 ** d;

// 행동할 수 있나: 같은 행동은 cooldown(분)마다 한 번
export function canDo(life, id, now = Date.now()) {
  const a = ACTIONS[id];
  const last = life.last[id] ?? -Infinity;
  return now - last >= a.cooldown * 60_000;
}

export function minutesLeft(life, id, now = Date.now()) {
  const last = life.last[id] ?? -Infinity;
  return Math.max(0, Math.ceil((ACTIONS[id].cooldown * 60_000 - (now - last)) / 60_000));
}

// 행동 하나: 새 상태를 돌려준다 (원본은 건드리지 않는다)
export function act(life, id, now = Date.now()) {
  const a = ACTIONS[id];
  if (!a) throw new Error(`없는 행동: ${id}`);
  const n = structuredClone(life);
  n.weight = round(clamp(n.weight + (a.kcal ?? 0) / 1000 * 0.12 - (a.burn ?? 0) / 1000 * 0.12, 40, 130));
  n.muscle = round(clamp(n.muscle + (a.muscle ?? 0) - (n.fatigue > 80 && a.muscle ? 0.01 : 0), 0, 1), 3);
  n.fatigue = clamp(n.fatigue + (a.fatigue ?? 0), 0, 100);
  for (const [k, v] of Object.entries(a.mind ?? {})) n.mind[k] = round(n.mind[k] + v);
  // 몸 관리: 훈련한 날 제대로 먹으면 '단단함'으로 기운다
  if (a.meal === 'balanced' && n.fatigue > 0) n.mind.firm = round(n.mind.firm + 0.5);
  n.last[id] = now;
  return n;
}

// 먹기: 가방의 먹을 것을 직접 먹는다 (content/items.js의 kcal). 배가 차면 피로도 조금 풀린다
export function eat(life, kcal) {
  const n = structuredClone(life);
  n.weight = round(clamp(n.weight + kcal / 1000 * 0.12, 40, 130));
  n.fatigue = clamp(n.fatigue - Math.round(kcal / 100), 0, 100);
  return n;
}

// 걷기: 걸은 만큼 조금씩 빠진다
export function walk(life, tiles) {
  const n = { ...life, walked: life.walked + tiles };
  n.weight = round(clamp(life.weight - (tiles * WALK_KCAL_PER_TILE) / 1000 * 0.12, 40, 130), 3);
  return n;
}

// 마음가짐: 한쪽이 다른 것들보다 3 이상 앞서면 그 성향, 아니면 균형
export function mindsetOf(mind) {
  const entries = Object.entries(mind).sort((a, b) => b[1] - a[1]);
  const [top, second] = entries;
  return top[1] - second[1] >= 3 ? top[0] : 'balanced';
}

// 전투용 주인공 능력치: 체형 + 마음가짐 + 피로
export function battleStats(base, life) {
  const body = bodyOf(life);
  const s = applyBody(base, body);
  const m = MINDS[mindsetOf(life.mind)];
  const tired = life.fatigue >= 70 ? 0.9 : 1;
  return {
    ...s,
    atk: Math.round(s.atk * (m.atk ?? 1) * tired),
    def: Math.round(s.def * (m.def ?? 1)),
    spd: Math.round(s.spd * tired),
    resist: round(s.resist + (m.resist ?? 0)),
    startGauge: m.startGauge ?? 0,
    mind: mindsetOf(life.mind),
  };
}

// 주인공 도트: 체형별 변형 (npm run assets가 me@thin 등을 만든다)
export const skinOf = (life) => { const b = bodyOf(life ?? freshLife()); return b === 'normal' ? 'me' : `me@${b}`; };

// 스테이터스 창에 보여줄 줄들
export function statusLines(base, life) {
  const st = battleStats(base, life);
  const b = BODIES[st.body];
  const m = MINDS[st.mind];
  return [
    `체중 ${life.weight.toFixed(1)}kg · 근육 ${Math.round(life.muscle * 100)} · 피로 ${Math.round(life.fatigue)}`,
    `체형 ${b.name} — 체력 ${st.maxHp} · 공격 ${st.atk} · 방어 ${st.def} · 속도 ${st.spd} · 회피 ${Math.round(st.evade * 100)}%`,
    `마음가짐 ${m.name} — ${m.desc}`,
    `여유 ${life.mind.relaxed} · 부지런함 ${life.mind.diligent} · 단단함 ${life.mind.firm}`,
    life.fatigue >= 70 ? '지쳐 있다: 공격·속도 -10%. 집에 가서 한숨 자야겠다.' : life.fatigue >= 40 ? '조금 피곤하다. 집 짚 침대가 생각난다.' : '',
  ].filter(Boolean);
}
