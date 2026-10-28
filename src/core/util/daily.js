// 날짜·시각 기반 값. 타이틀 일러스트가 매일 바뀌는 근거.

export function dailySeed(date = new Date()) {
  return date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
}

export function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 100000) / 100000; };
}

// 플레이어의 실제 시간대: dawn / day / dusk / night
export function timeOfDay(date = new Date()) {
  const h = date.getHours();
  if (h >= 5 && h < 8) return 'dawn';
  if (h >= 8 && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
}

export function season(date = new Date()) {
  const m = date.getMonth() + 1;
  if (m >= 3 && m <= 5) return 'spring';
  if (m >= 6 && m <= 8) return 'summer';
  if (m >= 9 && m <= 11) return 'autumn';
  return 'winter';
}

// 0(삭) ~ 1(다음 삭). 0.5 근처가 보름
export function moonPhase(date = new Date()) {
  const synodic = 29.530588853;
  const ref = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - ref) / 86400000;
  return ((days % synodic) + synodic) % synodic / synodic;
}
