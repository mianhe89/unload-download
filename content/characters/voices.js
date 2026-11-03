// 대사 소리 (글자가 찍힐 때 나는 '도도도'). 사람마다 높이·음색·말 빠르기가 다르다.
//   pitch  기본 높이 (Hz)
//   wave   음색: square(또렷·8비트) / triangle(부드러움) / sawtooth(거침) / sine(맑음)
//   spread 글자마다 높낮이가 흔들리는 정도 (0~0.3)
//   speed  한 글자 간격 (ms) — 작을수록 빠르게 말한다
//   every  몇 글자마다 소리를 낼지 (빠른 사람은 2)
export const DEFAULT_VOICE = { pitch: 330, wave: 'square', spread: 0.12, speed: 30, every: 1 };

export const VOICES = {
  me:       { pitch: 240, wave: 'triangle', spread: 0.08, speed: 30 },
  mia:      { pitch: 620, wave: 'square', spread: 0.18, speed: 24, every: 2 },   // 통통 튀는
  selena:   { pitch: 300, wave: 'square', spread: 0.05, speed: 32 },             // 짧고 단정
  lu:       { pitch: 520, wave: 'sine', spread: 0.1, speed: 38 },                // 느릿하고 맑게
  eda:      { pitch: 470, wave: 'triangle', spread: 0.15, speed: 26 },
  hort:     { pitch: 170, wave: 'sawtooth', spread: 0.1, speed: 34 },            // 굵은 빵집 아저씨
  tom:      { pitch: 280, wave: 'square', spread: 0.14, speed: 28 },
  rine:     { pitch: 560, wave: 'sine', spread: 0.12, speed: 30 },
  per:      { pitch: 360, wave: 'triangle', spread: 0.1, speed: 30 },
  keeper:   { pitch: 120, wave: 'sawtooth', spread: 0.03, speed: 46 },           // 낮고 느린
  chief:    { pitch: 200, wave: 'triangle', spread: 0.06, speed: 40 },
  granny:   { pitch: 400, wave: 'sine', spread: 0.06, speed: 44 },
  kid:      { pitch: 760, wave: 'square', spread: 0.22, speed: 22, every: 2 },
  farmer:   { pitch: 220, wave: 'square', spread: 0.1, speed: 32 },
  hunter:   { pitch: 190, wave: 'triangle', spread: 0.05, speed: 30 },
  monk:     { pitch: 160, wave: 'sine', spread: 0.02, speed: 42 },
  woman:    { pitch: 480, wave: 'triangle', spread: 0.1, speed: 28 },
  oldman:   { pitch: 180, wave: 'triangle', spread: 0.08, speed: 44 },
  spirit:   { pitch: 880, wave: 'sine', spread: 0.25, speed: 34 },               // 방울 같은
  wanderer: { pitch: 250, wave: 'triangle', spread: 0.1, speed: 34 },
  merchant: { pitch: 340, wave: 'square', spread: 0.16, speed: 22, every: 2 },   // 말이 빠른 장사꾼
  elf:      { pitch: 600, wave: 'sine', spread: 0.08, speed: 36 },
};
