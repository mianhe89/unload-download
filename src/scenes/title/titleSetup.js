// 타이틀 장면의 설정을 정한다 (순수 함수 — 테스트 가능).
// 타이틀은 그림이 아니라 '지금 이 순간의 마을'이다.
// 매일 바뀌는 것   — 실제 시각(새벽/낮/노을/밤), 계절(떨어지는 것), 날씨(날짜 시드), 카메라가 머무는 곳
// 진행에 따라 바뀌는 것 — 누가 광장에 있는지(지워진 사람은 흔적만), 모닥불, 미아가 곁에 있는지,
//                        종탑 위의 그림자, 화면이 이따금 튀는 정도(로드 횟수)
import { timeOfDay, season, dailySeed, rng } from '../../core/util/daily.js';

// 타이틀에 서 있는 사람들 (칸 좌표). 이야기 시작 전의 수확제 밤 풍경이 기준
const TABLEAU = {
  hort: [16, 16], tom: [27, 19], rine: [28, 13], per: [21, 19],
  chief: [20, 15], granny: [28, 21], kid: [26, 18], oldman: [29, 16], woman: [14, 19],
};

const VIEWS = [
  { x: 24, y: 16 },   // 광장과 모닥불
  { x: 20, y: 13 },   // 종탑 쪽
  { x: 30, y: 17 },   // 꽃밭과 대장간 사이
];

// state: { started, chapter, phase, erased: [ids], loads }
export function titleSetup(state, date = new Date()) {
  const r = rng(dailySeed(date));
  const tod = timeOfDay(date);
  const sea = season(date);
  const roll = r();
  const weather = roll < 0.6 ? 'clear' : sea === 'winter' ? 'snow' : roll < 0.85 ? 'rain' : 'clear';
  const view = VIEWS[Math.floor(r() * VIEWS.length)];
  const erased = new Set(state.erased ?? []);
  const after = Boolean(state.chapter && state.chapter !== 'prologue');

  const people = [];
  const remnants = [];
  for (const [id, at] of Object.entries(TABLEAU)) {
    if (erased.has(id)) remnants.push({ id, at });
    else people.push({ id, at });
  }

  // 주인공은 늘 광장 아래에서 위(마을)를 본다. 1장부터는 미아가 곁에 없다
  const figures = [{ id: 'me', at: [24, 22] }];
  if (!after) figures.push({ id: 'mia', at: [23, 22] });

  return {
    tod,
    season: sea,
    weather,
    view,
    people,
    remnants,
    figures,
    // 모닥불: 시작 전·축제 중엔 타오르고, 그 뒤로는 꺼져 있다
    bonfire: !state.started || state.phase === 'festival' ? 'lit' : 'out',
    // 프롤로그를 끝낸 세계엔 종탑 앞에 정리자가 서 있다
    keeper: after,
    // 로드할수록 화면이 이따금 튄다 (초당 확률)
    glitch: Math.min((state.loads ?? 0) * 0.04, 0.3),
    // 떨어지는 것: 계절마다
    falling: weather === 'rain' ? 'rain' : weather === 'snow' ? 'snow' : sea === 'spring' ? 'leafPink' : sea === 'autumn' ? 'leaf' : null,
  };
}
