// 세계의 '지금'. 다운로드 전(웹, UNLOAD)은 게임 안 시계, 다운로드 후(데스크톱, DOWNLOAD)는 플레이어의 현실 시간(기획서 '시간').
// 게임 안 달력: 1일째 = 늦가을 11월 10일(수확제 철). 21일째가 12월 1일(초겨울), 30일째 첫눈 축제.
// 계절·하루의 빛·조수·떠돌이·몬스터·생활 쿨다운이 모두 이 시각을 따른다.
import { platform } from '../../platform/index.js';

const BASE = { month: 10, date: 10 }; // 11월 10일 (월은 0부터)

export function worldDate(run, { real = platform.isDesktop } = {}) {
  if (real) return new Date();
  const t = run?.time ?? { day: 1, minute: 9 * 60 };
  const d = new Date(2026, BASE.month, BASE.date + (t.day - 1), 0, 0, 0, 0);
  d.setMinutes(Math.floor(t.minute));
  return d;
}

// 생활 쿨다운 등에 쓰는 '지금'(ms). 게임 안 1분 = 이 시계의 1분
export const worldNow = (run, opts) => worldDate(run, opts).getTime();
