// 게임 안 시간. 다운로드 전 세계는 이 시계로 돈다(현실 시간은 다운로드 세계의 것, 기획서 '시간' 절).
// 게임 1분 = 현실 SECONDS_PER_MINUTE초. 기본은 1초 → 하루 24분.
export const SECONDS_PER_MINUTE = 1;
export const DAY = 24 * 60;

export const toMinute = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
export const toHHMM = (minute) => `${String(Math.floor(minute / 60) % 24).padStart(2, '0')}:${String(Math.floor(minute % 60)).padStart(2, '0')}`;

// 시간대 이름 (HUD·대사 조건용)
export function partOfDay(minute) {
  const h = minute / 60;
  if (h < 5) return 'night';
  if (h < 8) return 'dawn';
  if (h < 17) return 'day';
  if (h < 20) return 'dusk';
  return 'night';
}

// 밤의 깊이 0(한낮) ~ 1(한밤). 노을과 새벽에 부드럽게 오간다
export function nightness(minute) {
  const h = (minute / 60) % 24;
  if (h >= 21 || h < 4) return 1;
  if (h >= 7 && h < 17) return 0;
  if (h >= 17) return (h - 17) / 4;     // 17시 → 21시
  return 1 - (h - 4) / 3;               // 4시 → 7시
}

// 요일처럼 쓰는 이름 (일지·HUD)
export const dayLabel = (day) => `${day}일째`;
