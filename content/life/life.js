// 생활 행동과 마음가짐 데이터. 수치는 초안 — 플레이하며 조정한다.
// 선택창은 없다. 마을의 장소에서 E를 누르면 그 행동을 한다 (빵집 진열대, 집, 우물, 초소 앞 허수아비).
//   kcal   먹은 열량 (체중 +)
//   burn   쓴 열량 (체중 -)
//   muscle 근육 +
//   fatigue 피로 +/-
//   mind   마음가짐 쪽으로 기울기
//   cooldown 같은 행동을 다시 하려면 (실제 분)
export const ACTIONS = {
  honeyBread: { name: '꿀빵 먹기', kcal: 900, mind: { relaxed: 1 }, cooldown: 20, text: '꿀빵을 두 개 먹었다. 배가 든든하다.', meal: 'heavy' },
  homeMeal:   { name: '집밥', kcal: 600, fatigue: -10, mind: { diligent: 0.5 }, cooldown: 30, text: '집에서 밥을 차려 먹었다. 국이 따뜻했다.', meal: 'balanced' },
  sleep:      { name: '잠', fatigue: -60, mind: { relaxed: 1 }, cooldown: 60, text: '한숨 잤다. 꿈은 기억나지 않는다.' },
  water:      { name: '물 길어 나르기', burn: 500, muscle: 0.02, fatigue: 15, mind: { diligent: 1 }, cooldown: 15, text: '우물에서 물을 길어 날랐다. 팔이 뻐근하다.' },
  battle:     { name: '싸움', burn: 300, fatigue: 8, mind: { firm: 0.2 }, cooldown: 0, text: '' }, // 전투 한 번의 대가 (자리 없음)
  drill:      { name: '목검 휘두르기', burn: 700, muscle: 0.035, fatigue: 25, mind: { diligent: 1, firm: 0.5 }, cooldown: 20, text: '허수아비를 상대로 목검을 백 번 휘둘렀다.' },
};

// 걸으면 칸마다 이만큼 쓴다 (kcal)
export const WALK_KCAL_PER_TILE = 0.6;

// 마음가짐 → 전투 보정 (주인공만). 정답 성향은 없다
export const MINDS = {
  relaxed:  { name: '여유',     desc: '위기에도 평정 — 상태이상 저항 +20%', resist: 0.2 },
  diligent: { name: '부지런함', desc: '먼저 움직인다 — 전투 시작 게이지 +15', startGauge: 15 },
  firm:     { name: '단단함',   desc: '정공법에 강하다 — 공격 +8%, 방어 +5% (대신 기믹 힌트가 줄어든다)', atk: 1.08, def: 1.05 },
  balanced: { name: '균형',     desc: '막히는 데가 없다 — 특별한 보정 없음' },
};

// 마을에서 행동하는 자리 (칸 좌표, content/maps/village.js 기준)
export const LIFE_SPOTS = [
  { action: 'honeyBread', at: [15, 16], needs: 'hort' },   // 빵집 진열대 (호르트가 지워지면 없다)
  { action: 'homeMeal', at: [16, 28] },                   // 우리 집 앞
  { action: 'sleep', at: [17, 28] },
  { action: 'water', at: [8, 26] },                       // 우물 (루가 서는 자리를 피해 위쪽)
  { action: 'drill', at: [11, 24] },                      // 허수아비 (아침 꼬마 자리를 피해 왼쪽 아래)
];
