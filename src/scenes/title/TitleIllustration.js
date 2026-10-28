// 타이틀 일러스트: 언덕에서 내려다본 마을.
// 매일 바뀌는 것   — 실제 시각(새벽/낮/노을/밤), 계절, 날씨, 구름·별·새 배치, 달의 모양
// 진행에 따라 바뀌는 것 — 지워진 사람의 흔적, 바램, 종탑 위의 그림자, 하늘의 금
// 순수 함수라 Node에서 미리보기를 뽑을 수 있다(tools/preview-title.mjs).
import { Raster } from '../../core/art/Raster.js';
import { rng, timeOfDay, season, moonPhase, dailySeed } from '../../core/util/daily.js';
import { composeFrame, FRAME } from '../../../content/art/compose.js';
import { characters as CHARACTERS } from '../../../content/characters/index.js';

export const TITLE_W = 480;
export const TITLE_H = 270;

const SKY = {
  dawn: ['#3a3a6a', '#e89a7a'],
  day: ['#5a8ac8', '#b8d8f0'],
  dusk: ['#3a2a5a', '#e8784a'],
  night: ['#080a1e', '#25284a'],
};
const LIGHT = { dawn: 0.75, day: 1, dusk: 0.7, night: 0.38 };

// state: { date, erased: [ids], loads, chapter, phase, started }
export function drawTitle(state) {
  const date = state.date ?? new Date();
  const r = rng(dailySeed(date));
  const tod = timeOfDay(date);
  const sea = season(date);
  const erased = new Set(state.erased ?? []);
  const lit = LIGHT[tod];
  const R = new Raster(TITLE_W, TITLE_H);
  const shade = (hex, k = lit) => { const [a, b, c] = Raster.rgb(hex); return [a * k, b * k, c * k]; };

  // 날씨: 날짜로 정해진다
  const roll = r();
  const weather = roll < 0.55 ? 'clear' : roll < 0.8 ? 'cloud' : sea === 'winter' ? 'snow' : 'rain';

  // 하늘
  R.vgrad(0, 170, ...SKY[tod]);
  if (tod === 'night' || tod === 'dawn') {
    for (let i = 0; i < 70; i += 1) R.px(r() * TITLE_W, r() * 120, '#ffffff', 0.4 + r() * 0.6);
    drawMoon(R, 380 + r() * 40, 40 + r() * 20, moonPhase(date));
  }
  if (tod === 'day') R.glow(80 + r() * 300, 40, 40, '#fff4c0', 0.5);
  if (tod === 'dusk' || tod === 'dawn') R.glow(tod === 'dusk' ? 400 : 60, 150, 70, '#ffb070', 0.5);

  // 하늘의 금: 로드한 만큼 (세계선 이동의 흔적)
  for (let i = 0; i < Math.min(state.loads ?? 0, 7); i += 1) {
    let x = 40 + r() * 400, y = 10 + r() * 60;
    for (let k = 0; k < 14; k += 1) { R.px(x, y, '#e8f0ff', 0.55); x += r() > 0.5 ? 1 : 0; y += 1; }
  }

  // 구름
  const clouds = weather === 'clear' ? 2 : 6;
  for (let i = 0; i < clouds; i += 1) {
    const cx = r() * TITLE_W, cy = 20 + r() * 70, w = 30 + r() * 50;
    for (let k = 0; k < 5; k += 1) R.disc(cx + (k - 2) * w / 5, cy + (k % 2) * 3, 6 + r() * 6, shade('#e8ecf4', Math.min(1, lit + 0.2)), weather === 'clear' ? 0.5 : 0.8);
  }

  // 먼 숲, 그 너머의 흐릿한 가장자리
  for (let x = 0; x < TITLE_W; x += 1) {
    const h = 128 + Math.sin(x * 0.05 + r() * 0.2) * 4 + Math.sin(x * 0.17) * 2;
    R.rect(x, h, 1, 170 - h, shade('#2f4a3a'));
  }
  R.rect(0, 118, TITLE_W, 12, '#c8ccd6', 0.25);

  // 땅
  const groundTop = sea === 'winter' ? '#d8dce8' : sea === 'autumn' ? '#8a7a3a' : '#5e8c4a';
  R.rect(0, 165, TITLE_W, 105, shade(groundTop));
  for (let i = 0; i < 400; i += 1) R.px(r() * TITLE_W, 166 + r() * 104, shade(sea === 'winter' ? '#c0c4d4' : '#4e7a3e'));

  // 꽃밭 (리네)
  if (!erased.has('rine')) {
    for (let i = 0; i < 60; i += 1) R.px(300 + r() * 50, 196 + r() * 10, ['#f07aa0', '#f6e070', '#ffffff'][i % 3]);
  } else {
    for (let i = 0; i < 30; i += 1) R.px(300 + r() * 50, 196 + r() * 10, '#6a6458');
  }

  // 마을: 집들 (x, 폭, 높이, 누구네)
  const houses = [
    [70, 46, 26, 'hort'], [130, 36, 22, null], [330, 42, 24, 'smithy'], [390, 40, 22, null], [180, 34, 20, null], [272, 30, 20, 'tom'],
  ];
  for (const [x, w, h, owner] of houses) {
    const y = 182 - h;
    R.rect(x, y + 8, w, h - 8, shade('#c9b49a'));
    for (let k = 0; k < 8; k += 1) R.rect(x - 3 + k, y + 8 - k, w + 6 - k * 2, 1, shade('#9a4a3a'));
    R.rect(x + w / 2 - 3, y + h - 8, 6, 8, shade('#5a3a24'));
    const windowLit = tod === 'night' || tod === 'dusk';
    const dark = (owner && erased.has(owner)) || owner === 'smithy';
    const win = windowLit && !dark ? '#ffd27a' : shade('#3a4a6a');
    R.rect(x + 5, y + 12, 5, 4, win);
    if (w > 36) R.rect(x + w - 10, y + 12, 5, 4, win);
    if (windowLit && !dark) R.glow(x + 8, y + 14, 10, '#ffb060', 0.35);
  }
  // 빵집 굴뚝 연기 (호르트)
  R.rect(84, 145, 5, 10, shade('#7a6a5a'));
  if (!erased.has('hort')) for (let i = 0; i < 10; i += 1) R.disc(87 + Math.sin(i) * 3 + i, 140 - i * 5, 2 + (i >> 2), '#d8d8e0', 0.5 - i * 0.04);
  // 초소 등불 (톰)
  if (!erased.has('tom')) R.glow(286, 166, 12, '#ffd27a', tod === 'night' ? 0.8 : 0.3);

  // 종탑
  const tx = 228;
  R.rect(tx, 108, 24, 74, shade('#6a6672'));
  for (let y = 112; y < 182; y += 6) R.rect(tx, y, 24, 1, shade('#57535e'));
  R.rect(tx + 7, 118, 10, 12, shade('#1f1d2b'));
  R.disc(tx + 12, 126, 3, shade('#c8a040'));
  for (let k = 0; k < 12; k += 1) R.rect(tx - 2 + k, 108 - k, 28 - k * 2, 1, shade('#4a4658'));
  R.rect(tx + 10, 162, 4, 20, shade('#2a2430'));

  // 광장 모닥불 (아직 이야기가 시작되기 전, 혹은 축제 중)
  if (!state.started || state.phase === 'festival') {
    R.glow(240, 205, 26, '#ffb060', tod === 'night' ? 0.7 : 0.25);
    R.rect(236, 203, 8, 4, '#5a3e2a'); R.rect(238, 199, 4, 4, '#ff9a3a'); R.px(239, 197, '#ffd860');
  }

  // 벤치의 작은 사람 (페르)
  if (!erased.has('per')) { R.rect(160, 208, 14, 2, shade('#6a4228')); R.rect(165, 200, 4, 8, shade('#8a3a3a')); R.rect(164, 197, 6, 3, shade('#5a4a3a')); }

  // 종탑 위의 그림자: 프롤로그를 끝낸 세계
  if (state.chapter && state.chapter !== 'prologue') {
    R.rect(tx + 9, 88, 6, 10, '#121018');
    R.rect(tx + 8, 86, 8, 4, '#121018');
    R.px(tx + 10, 89, '#b8f0ff'); R.px(tx + 13, 89, '#b8f0ff');
  }

  // 날씨
  if (weather === 'rain') for (let i = 0; i < 160; i += 1) { const x = r() * TITLE_W, y = r() * TITLE_H; R.px(x, y, '#a8c0e0', 0.5); R.px(x - 1, y + 1, '#a8c0e0', 0.4); }
  if (weather === 'snow') for (let i = 0; i < 140; i += 1) R.px(r() * TITLE_W, r() * TITLE_H, '#ffffff', 0.8);
  if (weather !== 'rain' && tod !== 'night') {
    const bx = r() * 300 + 60, by = 50 + r() * 40;
    for (let i = 0; i < 5; i += 1) { R.px(bx + i * 7, by + (i % 2) * 3, '#2a2a3a'); R.px(bx + i * 7 + 1, by + (i % 2) * 3 - 1, '#2a2a3a'); R.px(bx + i * 7 - 1, by + (i % 2) * 3 - 1, '#2a2a3a'); }
  }

  // 앞쪽 언덕: 마을을 내려다보는 자리
  const hill = shade(sea === 'winter' ? '#b8bccb' : '#3e6a3a', lit * 0.85);
  for (let x = 0; x < TITLE_W; x += 1) {
    const top = 222 + Math.pow((x - 210) / 260, 2) * 40;
    R.rect(x, top, 1, TITLE_H - top, hill);
    if (r() < 0.25) R.rect(x, top - 1, 1, 1, shade(sea === 'winter' ? '#ffffff' : '#5a8a4a', lit * 0.9));
  }
  for (let i = 0; i < 40; i += 1) { const x = r() * TITLE_W; R.rect(x, 236 + r() * 30, 1, 3, shade('#2a4a2a', lit)); }

  // 언덕 위의 뒷모습. 아직 누군가 곁에 있다면 함께
  const figures = [{ id: 'me', x: 196 }];
  if (state.started && !(state.chapter && state.chapter !== 'prologue')) figures.push({ id: 'mia', x: 220 });
  for (const f of figures) blitSprite(R, composeFrame(CHARACTERS[f.id].art, 'up', 0), f.x, 214, 2, lit);

  // 바램: 지워진 만큼
  R.desaturate(Math.min(erased.size * 0.16, 0.65));
  return { raster: R, weather, tod, season: sea };
}

function blitSprite(R, px, ox, oy, scale, lit) {
  for (let y = 0; y < FRAME; y += 1) for (let x = 0; x < FRAME; x += 1) {
    const i = (y * FRAME + x) * 4;
    if (!px[i + 3]) continue;
    const k = Math.max(lit, 0.55);
    R.rect(ox + x * scale, oy + y * scale, scale, scale, [px[i] * k, px[i + 1] * k, px[i + 2] * k]);
  }
}

function drawMoon(R, x, y, phase) {
  R.glow(x, y, 22, '#d8e0ff', 0.3);
  R.disc(x, y, 9, '#f0eedc');
  // 그림자 원을 옮겨 달의 모양을 만든다
  const off = Math.cos(phase * Math.PI * 2) * 18;
  if (Math.abs(phase - 0.5) > 0.03) R.disc(x + (phase < 0.5 ? -off : off) * 0.6 + (phase < 0.5 ? -4 : 4), y, 9, '#0c0e24', 0.92);
}
